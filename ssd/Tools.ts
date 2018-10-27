class Tools {

    static makeBlockNode(): cc.Node {
        const node: cc.Node = new cc.Node();
        node.addComponent(cc.BlockInputEvents);
        const widget: cc.Widget = node.addComponent(cc.Widget);
        widget.isAlignTop = true;
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.top = 0;
        widget.bottom = 0;
        widget.left = 0;
        widget.right = 0;
        return node;
    }

    static splitString(str: string, len: number = 20): string {
        const ret = [''];
        let index = 0;
        let count = 0;
        for (let i = 0; i < str.length; i++) {
            const chr: string = str.charAt(i);
            if (chr == '\n') {
                ret.push('');
                index++;
                count = 0;
                continue;
            }
            const chrEs: string = escape(chr);
            const chrLen: number = chrEs.length >= 4 ? 2 : 1;
            if (count >= len) {
                ret.push('');
                index++;
                count = 0;
            }
            ret[index] += chr;
            count += chrLen;
        }
        return ret.join('\n');
    }

    static inScreen(rect: cc.Rect): cc.Vec2 {
        const ret: cc.Vec2 = new cc.Vec2(0, 0);
        //x轴只选取一个越界方向
        if (rect.x < -cc.winSize.width / 2) {
            ret.x = -1;
        }
        else if ((rect.x + rect.width) > cc.winSize.width / 2) {
            ret.x = 1;
        }
        //y轴只选取一个越界方向
        if (rect.y < -cc.winSize.height / 2) {
            ret.y = -1;
        }
        else if ((rect.y + rect.height) > cc.winSize.height / 2) {
            ret.y = 1;
        }
        return ret;
    }

}

export default Tools;