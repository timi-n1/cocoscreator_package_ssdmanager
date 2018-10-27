const { ccclass, property } = cc._decorator;


@ccclass
export default class SceneManagerClass extends cc.Component {

    private isPresist: boolean = false;
    private progress: number = 0.0;
    private progressCount: number = 0;
    private progressTotal: number = 0;
    private maxLimit: number = 2;//资源加载最大并发
    private currLimit: number = 0;
    private resLoadingList: cs.ResData[] = [];
    private currSceneName: string = 'Splash';
    private nextSceneName: string = null;

    private limitTimeTotal: number = 500.0;//ms
    private limitTimeStart: number = 0.0;
    private isLoading: boolean = false;

    onLoad() {
        if (!this.isPresist && !(<any>window).cs.SceneMgr) {
            console.warn('SceneManager');
            this.isPresist = true;
            cc.game.addPersistRootNode(this.node);
            (<any>window).cs.SceneMgr = this;
        }
        else {
            console.log('SceneManager ignore');
        }
    }

    update(dt) {
        if (this.resLoadingList.length && this.currLimit < this.maxLimit) {
            this.currLimit++;
            this.loadRes(this.resLoadingList.pop(), 5);
        }
    }

    gotoScene(sceneName: string): void {
        if( sceneName == this.nextSceneName || this.isLoading ){
            return;
        }
        this.isLoading = true;
        this.limitTimeStart = cs.CP.getTime();
        this.nextSceneName = sceneName;
        cs.ScreenMgr.closeAll();
        cs.DialogMgr.closeAll();
        cc.director.loadScene("Loading", () => {
            this.releasePrevScene();
            this.loadNextScene();
        });
    }

    gotoSceneSilence(sceneName: string):void{
        if( sceneName == this.nextSceneName ){
            return;
        }
        this.limitTimeStart = cs.CP.getTime();
        this.nextSceneName = sceneName;
        cs.ScreenMgr.closeAll();
        cs.DialogMgr.closeAll();
        // this.releasePrevScene();
        this.loadNextScene();
    }

    getProgress(): number {
        return this.progress;
    }

    getCurrScene(): string {
        return this.currSceneName;
    }

    private releasePrevScene(): void {
        // cc.loader.releaseResDir('');
        let resList: cs.ResData[] = cs.SceneRes[this.currSceneName];
        if (!resList) {
            return;
        }
        resList = resList.slice(0);
        for (let res of resList) {
            try{
                cc.loader.release(res.url);
            }
            catch(err){}
        }
        cs.CP.gc();
    }

    private loadNextScene(): void {
        const resList: cs.ResData[] = cs.SceneRes[this.nextSceneName];
        if (!resList || !resList.length) {
            this._runNextScene();
            return;
        }
        this.progressTotal = resList.length + 0;
        this.resLoadingList = resList.slice(0);
    }

    private loadRes(res: cs.ResData, trycount: number): void {
        console.log(`开始加载资源[${res.type.name}] - ${res.url}`);
        cc.loader.loadRes(res.url, res.type, (err) => {
            if (err) {
                console.error('资源加载错误', err);
                if (trycount--) {
                    this.loadRes(res, trycount);
                }
                else {
                    console.error('提示错误，要回到上一个场景???');
                }
            }
            this.currLimit--;
            this.progressCount++;
            this.progress = this.progressCount / this.progressTotal;
            if (this.progressCount >= this.progressTotal) {
                this._runNextScene(() => {
                    this.progress = 0.0;
                    this.progressCount = 0;
                    this.progressTotal = 0;
                });
            }
        });
    }

    private _runNextScene(cb?: () => void): void {
        const timeOff: number = cs.CP.getTime() - this.limitTimeStart;
        const delay: number = Math.max(this.limitTimeTotal - timeOff, 0) / 1000;
        this.scheduleOnce(() => {
            cc.director.loadScene(this.nextSceneName, () => {
                cb && cb();
                this.currSceneName = this.nextSceneName + '';
                this.nextSceneName = null;
                this.isLoading = false;
            });
        }, delay);
    }


}
