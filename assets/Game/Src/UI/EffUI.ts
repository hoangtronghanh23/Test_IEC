import { _decorator, Camera, Component, Node, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('EffUI')
export class EffUI extends Component {
    @property(Vec3)
    targetWold: Vec3 = new Vec3();

    @property(Camera)
    camera: Camera = null!;

    distance = 2;

    private _lastWPos: Vec3 = new Vec3();
    private _pos: Vec3 = new Vec3();

    Init() {
        const wpos = this.targetWold;
        // @ts-ignore
        if (!this.camera!._camera || !this.node.active) {
            return;
        }

        this._lastWPos.set(wpos);
        const camera = this.camera!;
        // [HACK]
        // @ts-ignore
        camera._camera.update();
        camera.convertToUINode(wpos, this.node.parent!, this._pos);
        this.node.setPosition(this._pos.clone().add(new Vec3(0,50,0))); // set position canvas
        // @ts-ignore
        Vec3.transformMat4(this._pos, this.targetWold, camera._camera!.matView);// tinh toa do z chieu sau canvas

        const ratio = this.distance / Math.abs(this._pos.z);

        const value = Math.floor(ratio * 100) / 100;
        // this.node.setScale(value, value, 1);
    }
}


