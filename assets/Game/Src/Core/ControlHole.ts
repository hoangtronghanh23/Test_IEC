import { _decorator, clamp, Component,Animation, EventTouch, Input, input, math, Node, Sprite, tween, Vec3, Label } from 'cc';
import {GameManager} from "db://assets/PLAGameFoundation/gameControl/core/manager/gameManager";
import {Constant} from "db://assets/constant/constant";
import {ControlUI} from "db://assets/Game/Src/UI/ControlUI";
const { ccclass, property } = _decorator;

const v2_1 = new math.Vec2();
const v2_2 = new math.Vec2();
const v3_1 = new math.Vec3();

@ccclass('ControlHole')
export class ControlHole extends Component {
    @property
    moveSpeed = 1;

    @property
    moveSpeedShiftScale = 5;

    @property({ slide: true, range: [0.05, 0.5, 0.01] })
    damp = 0.2;

    @property(Sprite)
    circleSprite: Sprite = null!;
    @property(Node)
    Ring  : Node = null!;

    @property(Node)
    BGM : Node = null;

    _euler = new math.Vec3();
    _velocity = new math.Vec3();
    _position = new math.Vec3();
    _speedScale = 0.3;

    start() {
        math.Vec3.copy(this._euler, this.node.parent.eulerAngles);
        math.Vec3.copy(this._position, this.node.parent.position);
        this.currentScale = this.node.parent.scale.clone();
    }

    update(dt: number) {
        // position
        math.Vec3.transformQuat(v3_1, this._velocity, this.node.parent.rotation);
        math.Vec3.scaleAndAdd(this._position, this._position, v3_1, this.moveSpeed * this._speedScale);
        math.Vec3.lerp(v3_1, this.node.parent.position, this._position, dt / this.damp);

        if (v3_1.x < -60 || v3_1.x > 60 || v3_1.z < -60 || v3_1.z > 60)
            this._position.set(v3_1);

        v3_1.x = clamp(v3_1.x, -60, 60);
        v3_1.z = clamp(v3_1.z, -60, 60);

        this.node.parent.setPosition(v3_1);
    }

    onDestroy() {
        this._removeEvents();
    }

    onEnable() {
        this._addEvents();
    }

    onDisable() {
        this._removeEvents();
    }

    private _addEvents() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private _removeEvents() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private checkFirst = false;
    onTouchStart(e: EventTouch) {

    }
    onTouchMove(e: EventTouch) {
        e.getStartLocation(v2_1);
        e.getLocation(v2_2);
        math.Vec2.subtract(v2_2, v2_2, v2_1);
        this._velocity.x = v2_2.x * 0.01;
        this._velocity.z = -v2_2.y * 0.01;
        this._velocity.x = this._velocity.x < 0 ? this._velocity.x - 0.75 : this._velocity.x + 0.75;
        this._velocity.z = this._velocity.z < 0 ? this._velocity.z - 0.75 : this._velocity.z + 0.75;
        this._velocity.x = clamp(this._velocity.x, -1.25, 1.25);
        this._velocity.z = clamp(this._velocity.z, -1.25, 1.25);
    }

    onTouchEnd(e: EventTouch) {
        e.getStartLocation(v2_1);
        this._velocity.x = 0;
        this._velocity.z = 0;
    }

    changeEnable() {
        this.enabled = !this.enabled;
    }
    private currentFill = 0;
    private currentScale = new Vec3(0,0,0);
    public fillCircleStep(sprite: Sprite, step: number) {
        const targetFill = this.currentFill - step;

        // Nếu đã đạt tới ngưỡng
        if (targetFill <= -0.99) {
            this.currentFill = 0;
            this.Ring.active = true;
            this.Ring.getComponent(Animation).play('effScale');
            this.currentScale = this.currentScale.clone().add(new Vec3(0.04, 0.04, 0.04));
            this.AnimScale();

            // Tween từ currentFill đến 0 (reset)
            tween(sprite)
                .to(0.3, { fillRange: 0 }, {
                    onUpdate: (target: Sprite) => {
                        this.currentFill = target.fillRange;
                    },
                })
                .start();
        } else {
            // Tween từ currentFill đến targetFill
            tween(sprite)
                .to(0.3, { fillRange: targetFill }, {
                    onUpdate: (target: Sprite) => {
                        this.currentFill = target.fillRange;
                    },
                })
                .start();

            this.currentFill = targetFill;
        }
    }
    AnimScale() {
        tween(this.node)
            .to(0.2, { scale: this.currentScale.clone().add(new Vec3(0.1,0.1,0.1)) }, { easing: 'sineInOut' })
            .to(0.2, { scale: this.currentScale }, { easing: 'sineInOut' })
            .call(() => {
                this.node.scale = this.currentScale;
            })
            .start();
    }
}


