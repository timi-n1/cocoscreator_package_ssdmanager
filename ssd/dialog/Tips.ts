const { ccclass, property } = cc._decorator;

@ccclass
export default class TipsClass extends cc.Component {

    @property(cc.Node)
    label: cc.Node = null;

    setMsg(val: string): void {
        this.label.getComponent(cc.Label).string = val;
    }

    setAlign(val: cc.Vec2): void {
        this.label.setAnchorPoint(val);
    }

}
