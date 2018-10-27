const { ccclass, property } = cc._decorator;

@ccclass
export default class ConfirmClass extends cc.Component {

    @property(cc.Label)
    labelTitle: cc.Label = null;

    @property(cc.Label)
    labelMsg: cc.Label = null;

    @property(cc.Label)
    labelBtnCancel: cc.Label = null;

    @property(cc.Label)
    labelBtnOk: cc.Label = null;

    private callbackCancel: () => void = null;
    private callbackOk: () => void = null;

    setTitle(val: string): void {
        this.labelTitle.string = val;
    }

    setMsg(val: string): void {
        this.labelMsg.string = val;
    }

    setCancelLabel(val: string): void {
        this.labelBtnCancel.string = val;
    }

    setOklLabel(val: string): void {
        this.labelBtnOk.string = val;
    }

    setCallbackCancel(cb: () => void): void {
        this.callbackCancel = cb;
    }

    setCallbackOk(cb: () => void): void {
        this.callbackOk = cb;
    }

    onCancel(): void {
        if (this.callbackCancel) {
            this.callbackCancel();
        }
        this._closeSelf();
    }

    onOk(): void {
        if (this.callbackOk) {
            this.callbackOk();
        }
        this._closeSelf();
    }

    isAlertMode(alert: boolean): void{
        if( alert ){
            this.labelBtnCancel.node.parent.active = false;
            this.labelBtnOk.node.parent.position = cc.p(0, 0);
        }
    }

    private _closeSelf(): void{
        cs.DialogMgr.close(this.node.tag);
    }

}
