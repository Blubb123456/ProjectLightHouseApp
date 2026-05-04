name: "Build Unsigned iOS IPA"

on:
  workflow_dispatch:

jobs:
  build:
    runs-on: macos-15
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Dependencies
        run: npm install

      - name: Debug Path Verification
        run: |
          echo "Checking for with-environment.sh..."
          if [ -f "node_modules/react-native/scripts/xcode/with-environment.sh" ]; then
            echo "✅ Found at root node_modules"
          else
            echo "❌ NOT FOUND at root node_modules"
            find . -name "with-environment.sh"
          fi

      - name: Generate iOS Folder
        run: npx expo prebuild --platform ios --clean --no-install

      - name: Configure Podfile and Project
        run: |
          cd ios
          cat <<'EOF' > Podfile
          require_relative '../node_modules/expo/scripts/autolinking'
          require_relative '../node_modules/react-native/scripts/react_native_pods'
          platform :ios, '15.1'
          install! 'cocoapods', :deterministic_uuids => false
          target 'ProjectLightHouseReactApp' do
            use_expo_modules!
            config = use_native_modules!
            use_react_native!(
              :path => config[:reactNativePath],
              :hermes_enabled => true,
              :fabric_enabled => false,
              :new_arch_enabled => false
            )
            post_install do |installer|
              installer.pods_project.targets.each do |target|
                target.build_configurations.each do |config|
                  config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'
                  config.build_settings['GCC_PRECOMPILE_PREFIX_HEADER'] = 'NO'
                  config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++20'
                  config.build_settings['SWIFT_OPTIMIZATION_LEVEL'] = '-Onone'
                  config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
                end
                # Aggressive path fix for CI
                target.build_phases.each do |phase|
                  if phase.respond_to?(:shell_script)
                    # We use the absolute path from the runner workdir to be safe
                    abs_path = "#{Dir.pwd}/.."
                    phase.shell_script = "export REACT_NATIVE_PATH=\"#{abs_path}/node_modules/react-native\"\n" + phase.shell_script
                  end
                end
              end
            end
          end
          EOF
          pod install

      - name: Overwrite Hermes Source (Regex Preservation)
        run: |
          FILE="node_modules/react-native/ReactCommon/hermes/executor/HermesExecutorFactory.cpp"
          if [ -f "$FILE" ]; then
            python3 -c "
          import re, os
          path = '$FILE'
          with open(path, 'r') as f:
              content = f.read()

          # 1. Add missing headers if not present
          if '#include <thread>' not in content:
              content = '#include <thread>\n#include <atomic>\n' + content

          # 2. Fix the thread ID ambiguity by using auto
          content = content.replace('std::thread::id expected', 'auto expected')

          # 3. Fix the shared_ptr constructor (Replace std::make_shared with std::shared_ptr<DecoratedRuntime>(new DecoratedRuntime)
          # This regex finds 'std::make_shared<DecoratedRuntime>(' and replaces it while keeping everything inside the parens
          content = re.sub(r'std::make_shared<DecoratedRuntime>\(', 
                           r'std::shared_ptr<DecoratedRuntime>(new DecoratedRuntime(', content)

          # 4. Fix the HermesExecutor constructor cast
          # We look for the start of the make_unique call and inject the static_pointer_cast for the first argument
          content = re.sub(r'return std::make_unique<HermesExecutor>\(\s*runtime,', 
                           r'return std::make_unique<HermesExecutor>(std::static_pointer_cast<facebook::jsi::Runtime>(runtime),', content)

          with open(path, 'w') as f:
              f.write(content)
          "
            echo "✅ Source patched using Regex preservation."
          fi
          
      - name: Build Unsigned Archive
        run: |
          rm -rf build/DerivedData
          export REACT_NATIVE_PATH="$(pwd)/node_modules/react-native"
          
          # We use -allowProvisioningUpdates to clear target errors 
          # and force-disable the strict reentrancy check in the compiler flags
          xcodebuild archive \
            -workspace ios/ProjectLightHouseReactApp.xcworkspace \
            -scheme ProjectLightHouseReactApp \
            -configuration Release \
            -archivePath build/ProjectLighthouse.xcarchive \
            -sdk iphoneos \
            -destination 'generic/platform=iOS' \
            -derivedDataPath build/DerivedData \
            -parallelizeTargets=NO \
            -jobs 1 \
            OTHER_CPLUSPLUSFLAGS="-Wno-error=non-modular-include-in-framework-module -Wno-error=return-type -Wno-error=reorder-ctor" \
            REACT_NATIVE_PATH="$REACT_NATIVE_PATH" \
            USE_HEADERMAP=NO \
            CLANG_ENABLE_MODULES=NO \
            CODE_SIGNING_ALLOWED=NO \
            CODE_SIGNING_REQUIRED=NO \
            clean archive
      - name: Package IPA
        run: |
          mkdir -p build/Payload
          APP_PATH=$(find build/ProjectLighthouse.xcarchive -name "*.app" | head -1)
          cp -r "$APP_PATH" build/Payload/
          cd build && zip -r ProjectLighthouse.ipa Payload

      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ProjectLighthouse-IPA
          path: build/ProjectLighthouse.ipa
