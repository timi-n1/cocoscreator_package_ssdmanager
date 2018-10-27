'use strict';

module.exports = {
    load() {
        // 当 package 被正确加载的时候执行
    },

    unload() {
        // 当 package 被正确卸载的时候执行
    },

    messages: {
        'run'() {
            const fs = require('fs-extra');
            const path = require('path');

            //ssd
            const source = path.resolve(__dirname, './ssd');
            const dist = path.resolve(Editor.projectInfo.path, './assets/script/ssd');
            Editor.log(`拷贝SSD资源到${dist}`);
            fs.copySync(source, dist);
            Editor.assetdb.refresh('db://assets/script/ssd/DialogManager.ts');
            // Editor.assetdb.refresh('db://assets/script/ssd/LaunchActionManager.ts');
            Editor.assetdb.refresh('db://assets/script/ssd/SceneManager.ts');
            // Editor.assetdb.refresh('db://assets/script/ssd/ScreenManager.ts');
            // Editor.assetdb.refresh('db://assets/script/ssd/SoundManager.ts');
            // Editor.assetdb.refresh('db://assets/script/ssd/SubHelper.ts');
            Editor.assetdb.refresh('db://assets/script/ssd/Tools.ts');
            Editor.assetdb.refresh('db://assets/script/ssd/dialog');
            Editor.assetdb.refresh('db://assets/script/ssd/dialog/Tips.ts');
            Editor.assetdb.refresh('db://assets/script/ssd/dialog/Confirm.ts');
            Editor.success('拷贝SSD资源完毕!');

        }
    },
};