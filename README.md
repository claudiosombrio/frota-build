# Diário de Bordo - Celk Sistemas (Generated by m-ionic (Yeoman))

## Get started
#### gulp watch
Prepares everything for development and opens your default browser. Get ready to start coding!
```sh
gulp watch
```
Livereloads your application when changing/adding/deleting files to immediately reflect the changes you make. If you don't want this task to open your browser, just add the `--no-open` option and navigate to `http://localhost:9000` yourself. For your convenience any occurring **ESLint or jsonlint errors** will be presented to you on every livereload.

#### File structure
<pre>
└──  app/           - your application folder
│   └──  bower_components/    - local installation of bower packages
│   └──  main/                - ---main module---
│   └──  anotherModule/       - ---another  module---
│   │   ├──  ...
│   ├──  app.js               - application module, includes main module, ionic, ui-router etc ...
│   └──  index.html           - angular entry point, injects: app files, bower files, fonts,  ...
├──  gulp/    - gulp tasks
├──  hooks/         - cordova hooks
├──  nodes_modules/ - local installation of node modules
├──  platforms/     - cordova platforms
├──  plugins/       - corodova plugins
├──  res/           - resources folder for splash screens and app icons
├──  test/          - unit and integration tests
├──  www/           - your gulp build goes here, cordova starts building from here
├──  .bowerrc       - bower configuration
├──  .editorconfig  - editor configuration
├──  .eslintrc      - ESLint configuration
├──  .gitattributes - git's attribute configuration
├──  .gitignore     - git's ignore configuration
├──  .travis.yml    - travis continuous integration configuration
├──  .yo-rc.json    - yeoman's .yo-rc.json
├──  bower.json     - bower dependencies
├──  config.xml     - cordova's config.xml
├──  gulpfile.js    - entry point to all gulp tasks
├──  jenkins.sh     - shell script for jenkins continuous integration
├──  package.json   - node dependencies configuration
├──  README.md      - the generator's README.md
</pre>

## Testing
When setting up your project or using the module, controller, service, directive or filter sub-generator, Generator-M-Ionic will automatically generate sample test files for that component. These files can be found in the `test/karma` and `test/protractor` directory respectively. To check if all tests are running properly run:

```sh
gulp karma
# and
gulp protractor
```
**Hint**: `gulp watch` and `gulp protractor` cannot be run at the same time.

## More gulp tasks

#### gulp --cordova 'run any command'
A local wrapper for cordova cli (allows to use different cordova CLI versions in different projects). For instance instead of running `cordova plugins ls` you'd write the following to list all the installed plugins:
```sh
gulp --cordova 'plugin ls'
```
Head over to the [cordova cli documentation](http://cordova.apache.org/docs/en/edge/guide_cli_index.md.html#The%20Command-Line%20Interface) or their [github page](https://github.com/apache/cordova-cli/) to learn how to use the cordova cli. Remember that when using Generator-M-Ionic you don't need to install cordova globally!

#### gulp --cordova 'build-related task'

If you run one of the following cordova commands: `build <platform>`, `run <platform>`, `emulate <platform>`, 'serve' or `prepare <platform>`, `gulp build` will build your app into the www folder, before cordova will take it from there. For instance if you want to test your app on your connected ios device, run:
```sh
gulp --cordova 'run ios' # runs gulp build, then cordova run ios
```
Sometimes you don't want `gulp build` to run every time before the cordova command is run. In that case simply add the `--no-build` option and `gulp build` will be skipped.


#### gulp watch-build
Builds into www, watches version in www and opens your browser. Good for debugging and testing your build!
```sh
gulp watch-build
```
Add the `--no-build` option and `gulp build` will be skipped.
The `--no-open` options is available here as well, in case you don't want your browser to open automatically and would rather navigate to `http://localhost:9000` yourself.


#### gulp build
Builds your angular app and moves it to the www folder. Usually you don't run this command directly, but it will be implicitly run by `gulp watch-build` and any build-related cordova tasks (as explained above).
```sh
gulp build
```
Note that the build will not complete if you have any **ESLint or jsonlint errors** in your code! Sometimes it's necessary to let the build run anyway. Use the `--force-build` option to do so. The `--minify` option will minify javascript, css, html and images. These options will also work for all the build-related cordova tasks!

#### gulp environment
Injects environment (dev, prod and any other you'd like) variables into your `Config` constants.

##### How does it work?
Your `main` module per default contains the two files `env-dev.json` and `env-prod.json` located under `app/main/constants/`. Any key value pair you define in those files will be copied into the `Config.ENV` constant located in `app/main/constants/config-const.js`, depending on which environment you chosse. So when you're working on dev, all key value pairs from the `main` module's `env-dev.json` will be copied to your `config-const.js`. Same goes for the prod environment respectively. Then simply inject the `Config` constant in any service or controller where you need to use it.

##### Choosing an environment
When you run `gulp watch` or any other task that runs `gulp build` without specifying an environment it will default to the dev environment:
```shell
gulp watch                # defaults to --env=dev
gulp build                # so does this
gulp --cordova 'run ios'  # and any other command that uses gulp build
```
In order to choose an environment explicitly add the `--env` flag, like this:
```shell
gulp watch --env=prod
gulp build --env=prod
gulp --cordova 'run ios' --env=prod
```
While you're running `gulp watch` you can even **temporarily** switch the environment you're currently working on without having to restart your watch task. Simply type:
```shell
gulp environment --env=<env>
```
Gulp will livereload with your new environment! It's **important** to note that as soon as you are making more changes and a livereload is triggered, your environment switches back to the one that was supplied when `gulp watch` was started. If you want to **permanently** switch your environment you should do so by restarting your `gulp watch` tasks with the desired environment.

##### Creating a new environment
If you find yourself faced needing more than a dev and a prod environment simply create a new file: `app/main/constants/dev-env5.json`, fill it with the desired values and then run one the following:
```shell
gulp watch --env=env5
gulp build --env=env5
gulp environment --env=env5
```

##### Environments when using several modules
In case your project grows large and you have several modules in your project you will probably find yourself wanting to share environments across all modules. No problem. Every module you create has it's own `Config` constant located in `app/module/constants/config-const.js`. But only your `main` module contains the environment files. The gulp tasks will automatically copy the environments to all of your modules' `Config.ENV` constants.


#### gulp build-vars
Inject variables into your angular app -namely your `Config` constants which are defined in `app/*/constants/config-const.js`- during a build.

Adding the `--buildVars` flag to `gulp build` or any gulp task that runs `gulp build` implicitly, for instance:
```sh
gulp watch --buildVars='key:value,keys2:value2'
```
will result in `Config` constants that look like this:
```js
'use strict';
angular.module('main')
.constant('Config', {

  ENV: {
    /*inject-env*/
    // ..
    /*endinject*/
  },

  BUILD: {
    /*inject-build*/
    'key': 'value',
    'keys2': 'value2'
    /*endinject*/
}

});
```

#### gulp defaults
Define default flags for each gulp task.

You may have noticed that the Generator-M-Ionic supplies an extended amount of gulp tasks and flags to modify the behaviour of these tasks. Depending on your project specifics you may find yourself always typing the same flags for the same tasks over and over again. With the `gulp defaults` task you can spare yourself some typing. Here's how it works:

For instance we use `gulp watch --no-open` a lot.

##### setting a default
Running the following command will create a new `gulp/.gulp_settings.json` file and save your default flags in it. **Note**: the `.gulp_settings.json` file will be ignored by git, so these settings are only applied locally to your machine. If you want these settings to be part of the repository and share it with your team, simply remove the according line from the `.gitignore` and add `.gulp_setting.json` to your commit.

```sh
gulp defaults --set='watch --no-open'
```

What if you still want use a different set of flags from time to time? No worries, we though of that too!
You can add any amount of **additional command line flags**, they will be merged with your defaults. In the next example `gulp watch` will run with both the `--env-prod` from the command line *and* the `--no-open` flag from your defaults.

```sh
gulp watch --env=prod ## the --no-open flag will be merged
```

You can also **overwrite** your task's defaults by explicitly setting the flag to a different value. The value that is explicitly set, will always win:

```sh
gulp watch --open # will run with --open despite defaults
```

##### clearing a default
If on of the defaults is no longer required, running the following command will get rid of it:

```sh
gulp defaults --clear=watch
```

##### printing all defaults
By running `gulp defaults` without a 'set' or 'clear' flag, a comprehensive list of all the defaults that are defined in the `.gulp_settings.json` is shown.

```sh
gulp defaults
```

## Running on Windows
The generator should work just like on unix/mac except there's one difference, when running `gulp --cordova` tasks. They need doublequotes. So write this:
```sh
gulp --cordova "run android" # will work on windows
```
instead of this:
```sh
gulp --cordova 'run android' # won't work on windows
```

## Sub-generators

#### yo m-ionic:...
A handy and fast way to create different angular components, handling all the boilerplate for you.
The `<moduleName>` is optional and defaults to the main module when left blank
```sh
yo m-ionic:constant <constantName> <moduleName>
yo m-ionic:controller <controllerName> <moduleName>
yo m-ionic:directive <directiveName> <moduleName>
yo m-ionic:filter <filterName> <moduleName>
yo m-ionic:pair <pairName> <moduleName> # creates controller & template
yo m-ionic:template <templateName> <moduleName>
yo m-ionic:service <serviceName> <moduleName>
```
If you have `gulp watch` running, gulp will automatically inject your new files into your application and they will be available right away.

#### yo m-ionic:module - creates a new module
**Important**: While we are particularly proud of this feature, please note that using modules is only useful in large projects. We recommend that you only use them, if you know why you want to use them in your project. In our experience for most projects using one module is just fine.

1. `yo m-ionic:module <moduleName>` - create a new module
2. choose your template: `sidemenu`, `tabs` or `blank`
2. add your module to the `app/app.js`:

  ```js
  'use strict';
  angular.module('myProject', [
    // your modules
    'main',
    '<newModuleName>'
  ]);
  ```
3. restart your `gulp watch` task
3. in your browser, depending on the template you chose, navigate to `http://localhost:9000/#`
  - `/<module-name-in-kebap-case>` for `blank` templates
  - `/<module-name-in-kebap-case>/list` for `sidemenu` and `tabs` templates
4. **Done!** - see your new module in action!


## Git integration
The generator provides a default set of configuration for git:
- `.gitignore` and `.gitattributes` - http://git-scm.com/docs/gitignore

Leaving them as they are generated, you will allow git to exclude all of the 3rd party code from your project. Specifically this means:
- no bower components
- no node modules
- no cordova platforms and plugins

### After git clone
Since all these files are excluded from git, you need to install all of them when you start with a fresh clone of your project. In order to do so, run the following commands in that order:
```sh
npm install # installs all node modules including cordova, gulp and all that
bower install # install all bower components including angular, ionic, ng-cordova, ...
gulp --cordova 'prepare' # install all cordova platforms and plugins from the config.xml
```

### Platforms and plugins in config.xml
Since `cordova 5.0` all platforms and plugins you install can be added to the `config.xml`.

Release notes:
https://cordova.apache.org/news/2015/04/21/tools-release.html

> Added the ability to manage your plugin and platform dependencies in your project’s `config.xml`. When adding plugins or platforms, use the `--save` flag to add them to `config.xml`. Ex: `cordova platform add android --save`. Existing projects can use `cordova plugin save` and `cordova platform save` commands to save all previously installed plugins and platforms into your project’s `config.xml`. Platforms and plugins will be autorestored when `cordova prepare` is run. This allows developers to easily manage and share their dependenceis among different development enviroments and with their coworkers.
>

Since your projects `.gitignore` will completely ignore the `platforms/` and `plugins/` folders, it's important to make sure your `config.xml` contains all the plugins and platforms required by your project. As explained above this can either be achieved by always using the `--save` options when adding/removing platforms:

```sh
gulp --cordova 'platform add ios --save'
gulp --cordova 'plugin remove cordova-plugin-camera --save'
```

or by typing the following commands before you commit:

```sh
gulp --cordova 'platform save'
gulp --cordova 'plugin save'
```

## Options for debugging and development
```sh
yo m-ionic --appName='App Name' # set appName via CLI
yo m-ionic --skip-welcome-message # skips welcome message
yo m-ionic --skip-sdk # skip adding cordova platforms and plugins (sdk-specific) for travis
yo m-ionic --skip-install # for debugging purposes, no npm and bower install
yo m-ionic --skip-prompts # for debugging purposes, run with predefined answers
yo m-ionic --ios-only # in conjunction with --skip-prompts
yo m-ionic --android-only # in conjunction with --skip-prompts
yo m-ionic --no-cordova # in conjunction with --skip-prompts, no platforms/plugins
```
