import { _decorator,Animation, Component, Label, Node, tween, Vec3 } from 'cc';
import {TypeEnum} from "db://assets/Game/Src/Utils/Enum";
import {ControlListTarget} from "db://assets/Game/Src/Core/ControlListTarget";
const { ccclass, property } = _decorator;

@ccclass('PosMoveItem')
export class PosMoveItem extends Component {
    @property
    TypeItem : TypeEnum = TypeEnum.Xanh;
    totalItem : number = 24;
    @property(Label)
    text : Label = null!;
    anim : Animation = null!;
    originScale : Vec3 = new Vec3();
    onLoad(){
        this.anim = this.node.getComponent(Animation);
        this.originScale = this.node.scale.clone();
        this.text.string = this.totalItem.toString();
    }
    setTotal(n: number) {
        this.totalItem = n;
        this.text.string = n.toString();
    }

    UpdateDataTotalItem(count: number = 1) {
        this.totalItem -= count;
        this.text.string = Math.max(0, this.totalItem).toString();
        if (this.totalItem <= 0) {
            this.anim.once(Animation.EventType.FINISHED, () => {
                ControlListTarget.instance.RemoveTarget(this.node);
                // this.node.active = false;
            });

            this.anim.play('targetDestroy');
        }
    }
    AnimBounce(){
        let originTarget = this.originScale.clone().add(new Vec3(0.2, 0.2, 0.2));
        tween(this.node)
            .to(0.05, { scale : originTarget }, { easing: 'bounceOut' })
            .to(0.05, { scale: this.originScale }, { easing: 'bounceIn' })
            .call(() => {
                this.node.scale = this.originScale;
            })
            .start();
    }
}