const { ccclass, property } = cc._decorator;
import Tools from './Tools';

@ccclass
export default class DialogManagerClass extends cc.Component {

    @property(cc.Prefab)
    public loadingPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    public backgroundMaskPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    public tipsPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    public confirmPrefab: cc.Prefab = null;

    private loadingNode: cc.Node = null;
    private loadingBgMaskNode: cc.Node = null;
    private tipsTimer: any = null;
    private isPresist: boolean = false;
    private dialogQueue: cc.Node[] = [];
    private tipsQueue: cc.Node[] = [];
    private tipsTag: number = 1;
    private commonTag: number = 1;
    private pushWaitQueue: cs.DialogData[] = [];
    private timer: any = null;
    private showing: boolean = false;

    onLoad() {
        if (!this.isPresist && !(<any>window).cs.DialogMgr) {
            console.warn('DialogManager');
            this.isPresist = true;
            cc.game.addPersistRootNode(this.node);
            (<any>window).cs.DialogMgr = this;
            this.loadingNode = cc.instantiate(this.loadingPrefab);
            this.loadingBgMaskNode = cc.instantiate(this.backgroundMaskPrefab);
        }
        else {
            console.log('ScreenManager ignore');
        }
    }

    push(dialogData: cs.DialogData, data: any = null, blankClose: boolean = false, showAction: boolean = true): void {
        dialogData = cc['clone'](dialogData);
        dialogData.blankClose = blankClose;
        data && (dialogData.data = data);
        this.showing = true;
        this.loadDialog(dialogData, (dialog: cc.Node) => {
            if (dialog) {
                dialog.parent = this.getRoot();
                dialog.zIndex = cs.Layer.DIALOG_START + this.dialogQueue.length;
                showAction && this.runShowAction(dialog);
                this.dialogQueue.push(dialog);
                this.showing = false;
            }
        });
    }

    pushWait(dialogData: cs.DialogData, data: any = null, blankClose: boolean = false): void {
        dialogData = cc['clone'](dialogData);
        dialogData.blankClose = blankClose;
        data && (dialogData.data = data);
        this.pushWaitQueue.push(dialogData);
        this.checkWait();
    }

    replace(dialogData: cs.DialogData, data: any = null, blankClose: boolean = false, showAction: boolean = true): void {
        dialogData = cc['clone'](dialogData);
        dialogData.blankClose = blankClose;
        data && (dialogData.data = data);
        if (!this.dialogQueue.length) {
            this.push(dialogData, data);
        }
        else {
            this.showing = true;
            this.loadDialog(dialogData, (dialog: cc.Node) => {
                if (dialog) {
                    this.close();
                    dialog.parent = this.getRoot();
                    dialog.zIndex = cs.Layer.DIALOG_START + this.dialogQueue.length;
                    showAction && this.runShowAction(dialog);
                    this.dialogQueue[this.dialogQueue.length] = dialog;
                    this.showing = false;
                }
            });
        }
    }

    //不推荐使用
    showModalLoading(): void {
        this.loadingBgMaskNode.parent = this.getRoot();
        this.loadingBgMaskNode.zIndex = cs.Layer.DIALOG_MODAL_BACKGROUND;
        this.loadingNode.parent = this.getRoot();
        this.loadingNode.zIndex = cs.Layer.DIALOG_MODAL_LOADING;
    }

    //不推荐使用
    hideModalLoading(): void {
        this.loadingBgMaskNode.parent = null;
        this.loadingNode.parent = null;
    }

    showLoading(delay: number = 0.2): void {
        this.timer = cs.Timer.scheduleNodeOnce(() => {
            this.showModalLoading();
        }, delay);
    }

    hideLoading(): void {
        cs.Timer.unschedule(this.timer);
        this.hideModalLoading();
    }

    close(tag: number = 0): void {
        if (tag) {
            for (let i = 0; i < this.dialogQueue.length; i++) {
                const node: cc.Node = this.dialogQueue[i];
                if (node && node.tag === tag) {
                    node.destroy();
                    this.dialogQueue.splice(i, 1);
                    break;
                }
            }
        }
        else {
            const node: cc.Node = this.dialogQueue.pop();
            if (node) {
                node.destroy();
            }
        }
        this.checkWait();
    }

    closeAll(): void {
        clearTimeout(this.tipsTimer);
        while (this.dialogQueue.length) {
            this.close();
        }
        while (this.tipsQueue.length) {
            this.tipsQueue.pop().removeFromParent(true);
        }
    }

    getUserData(context: any): any {
        const node: cc.Node = context.node;
        if (!node) {
            return null;
        }
        return node['____dialog_data'];
    }

    /**
     * 弹出tips轻提示框
     * @param msg 消息内容
     * @param delay 消失时间延迟
     */
    tips(opt: cs.TipsData, maxKeep: number = 0): number {
        opt.delay = (opt.delay === undefined ? 3.0 : opt.delay);
        opt.position = opt.position || cc.v2(0, 0);
        opt.autoLineFeed = opt.autoLineFeed || 30;
        opt.anchorPoint = opt.anchorPoint || cc.v2(0.5, 0.5);
        const offsetFix = new cc.Vec2(
            opt.anchorPoint.x == 0 ? 30 : (opt.anchorPoint.x == 1 ? -30 : 0),
            opt.anchorPoint.y == 0 ? 24 : (opt.anchorPoint.y == 1 ? -22 : 0),
        );
        opt.offset = cc.pAdd(opt.offset || cc.v2(0, 0), offsetFix);
        //文字处理
        const msg = Tools.splitString(opt.msg, opt.autoLineFeed);
        //显示
        const node: cc.Node = cc.instantiate(this.tipsPrefab);
        //参数控制
        const com = node.getComponent('Tips');
        com.setMsg(msg);
        com.setAlign(opt.anchorPoint);
        node.parent = this.getRoot();
        node.position = cc.pAdd(opt.position, opt.offset);
        node.zIndex = cs.Layer.DIALOG_TIPS;
        node.tag = this.tipsTag++;
        this._closeTips(maxKeep);
        this.tipsQueue.push(node);

        // 
        try {
            if (opt.keepInScreen) {
                const rect: cc.Rect = node.getBoundingBox();
                const inScreen: cc.Vec2 = Tools.inScreen(rect);
                const newPosition: cc.Vec2 = cc.v2(node.position);
                if (inScreen.x !== 0) {
                    newPosition.x = (inScreen.x * cc.winSize.width / 2) - (inScreen.x * rect.width / 2);
                }
                if (inScreen.y !== 0) {
                    newPosition.y = (inScreen.y * cc.winSize.height / 2) - (inScreen.y * rect.height / 2);
                }
                // console.warn(rect, inScreen, newPosition);
                node.position = newPosition;
            }
            node.runAction(cc.sequence(
                cc.delayTime(opt.delay),
                cc.fadeOut(0.3),
                cc.callFunc(() => {
                    this.tipsClose(node.tag);
                })
            ));
        }
        catch (err) { }

        return node.tag;
    }

    private _closeTips(keep: number): void {
        while (this.tipsQueue.length > keep) {
            const node: cc.Node = this.tipsQueue.shift();
            node.removeFromParent(true);
        }
    }

    tipsClose(tag: number): void {
        for (let i = 0; i < this.tipsQueue.length; i++) {
            const node: cc.Node = this.tipsQueue[i];
            if (node && node.tag === tag) {
                node.removeFromParent(true);
                this.tipsQueue.splice(i, 1);
                break;
            }
        }
    }

    /**
     * 确认框
     * @param opts 
     */
    confirm(opts: cs.ConfirmData): number {
        opts.title = opts.title || '';
        opts.msg = opts.msg || '';
        opts.alert = opts.alert || false;
        opts.labelCancel = opts.labelCancel || '取消';
        opts.labelOK = opts.labelOK || '好的';
        opts.onCancel = opts.onCancel || function () { };
        opts.onOk = opts.onOk || function () { };
        const node: cc.Node = Tools.makeBlockNode();
        const mask: cc.Node = cc.instantiate(this.backgroundMaskPrefab);
        const dialog: cc.Node = cc.instantiate(this.confirmPrefab);
        mask.parent = node;
        dialog.parent = node;
        dialog.tag = this.commonTag++;
        const com = dialog.getComponent('Confirm');
        com.setTitle(opts.title);
        com.setMsg(opts.msg);
        com.setCancelLabel(opts.labelCancel);
        com.setOklLabel(opts.labelOK);
        com.setCallbackCancel(opts.onCancel);
        com.setCallbackOk(opts.onOk);
        com.isAlertMode(opts.alert);
        node.parent = this.getRoot();
        node.zIndex = cs.Layer.DIALOG_CONFIRM;
        node.tag = 0 + dialog.tag;
        this.runShowAction(node);
        this.dialogQueue.push(node);
        return node.tag;
    }

    private checkWait(): void {
        if (!this.dialogQueue.length && this.pushWaitQueue.length && !this.showing) {
            this.push(this.pushWaitQueue.shift());
        }
    }

    private runShowAction(node: cc.Node): void {
        node.scale = 0.7;
        node.runAction(cc.scaleTo(0.25, 1.0).easing(cc.easeBackOut()));
    }

    private loadDialog(dialogData: cs.DialogData, callback: Function): void {
        dialogData.depends = dialogData.depends || [];
        console.log(`尝试显示Dialog=${dialogData.name}`);
        const resList: cs.DialogDataDepend[] = dialogData.depends.concat([{ url: dialogData.url }]);
        // let needShowLoading: boolean = this.needLoading(resList);
        let timer = cs.Timer.scheduleNodeOnce(()=>{
            this.showModalLoading();
        }, 0.2);
        (<any>window).async.mapLimit(resList, 2, (res: cs.DialogDataDepend, done) => {
            cc.loader.loadRes(res.url, cc.Prefab, () => {
                done();
            });
        }, () => {
            cs.Timer.unschedule(timer);
            const node: cc.Node = Tools.makeBlockNode();
            const mask: cc.Node = cc.instantiate(this.backgroundMaskPrefab);
            const dialog: cc.Node = cc.instantiate(cc.loader.getRes(dialogData.url));
            dialog.getComponents(cc.Component).forEach((com: cc.Component) => {
                com['onSetCustomUserData'] && com['onSetCustomUserData'](dialogData.data);
            });
            mask.parent = node;
            dialog.parent = node;
            //增加空白区域点击关闭
            if (dialogData.blankClose) {
                const closeBtn: cc.Button = mask.addComponent(cc.Button);
                var clickEventHandler = new cc.Component.EventHandler();
                clickEventHandler.target = mask; //这个 node 节点是你的事件处理代码组件所属的节点
                clickEventHandler.component = "Mask";//这个是代码文件名
                clickEventHandler.handler = "onClose";
                closeBtn.clickEvents.push(clickEventHandler);
                dialog.addComponent(cc.BlockInputEvents);
            }
            //隐藏loading
            this.hideModalLoading();
            //数据操作
            dialog.attr({
                ____dialog_data: dialogData.data
            });
            callback && callback(node);
        });
    }

    private getRoot() {
        return cc.find('Canvas');
    }

    private needLoading(resList: cs.DialogDataDepend[]): boolean {
        for (let res of resList) {
            if (!cc.loader.getRes(res.url)) {
                return true;
            }
        }
        return false;
    }


}
