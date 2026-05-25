import { _decorator, Component, Node, Vec3, input, Input, EventMouse, Vec2, EventTouch, CCFloat, resources, AudioClip } from "cc";
import { IInput } from "./IInput";
import {ControlUI} from "db://assets/Game/Src/UI/ControlUI";
const { ccclass, property } = _decorator;

@ccclass("VirtualJoystic")
export class VirtualJoystic extends Component implements IInput {
    @property(CCFloat) private maxDistance = 10;
    @property(Node) private knob: Node;

    private delayCallbackTimer: number | null = null;
    #isUsingJoystic = false;
    #defaultPosition: Vec2 = new Vec2();
    private isDragging = false;

    @property(Node)
    BGM : Node = null;

    onLoad() {
        this.init();
    }
    public init(): void {
        // input.on(Input.EventType.MOUSE_DOWN, this.activateMouseJoystic, this)
        // input.on(Input.EventType.MOUSE_UP, this.deactivateJoystic, this);
        // input.on(Input.EventType.MOUSE_MOVE, this.moveKnobMouse, this);

        input.on(Input.EventType.TOUCH_START, this.activateTouchJoystic, this);
        input.on(Input.EventType.TOUCH_END, this.deactivateJoystic, this);
        input.on(Input.EventType.TOUCH_MOVE, this.moveKnobTouch, this);

        this.deactivateJoystic();
    }

    public getAxis(): Vec2 {
        if (this.#isUsingJoystic) {
            return new Vec2(this.knob.position.x / this.maxDistance, this.knob.position.y / this.maxDistance);
        } else {
            return new Vec2();
        }
    }
    checkFirst : boolean = false;

    private activateTouchJoystic(e: EventTouch): void {
        if (!this.checkFirst){
            this.checkFirst = true;
            ControlUI.instance.hand.active = false;

            ControlUI.instance.textTut.children[0].active = false;
            this.UnShowTut();
        }
        this.activateJoystic(e.getUILocation());
    }
    private activateMouseJoystic(e: EventMouse): void {
        // console.log(e.getUILocation());

        if (this.delayCallbackTimer !== null) {
            clearTimeout(this.delayCallbackTimer);
            this.delayCallbackTimer = null;
        }
        this.activateJoystic(e.getUILocation());
    }

    private activateJoystic(location: Vec2): void {
        this.#isUsingJoystic = true;
        this.node.active = true;
        this.#defaultPosition = location;

        this.node.setWorldPosition(new Vec3(this.#defaultPosition.x, this.#defaultPosition.y, 0));
        this.knob.worldPosition = new Vec3();
        this.knob.worldPosition = new Vec3(location.x, location.y, 0);
    }

    private deactivateJoystic(): void {
        this.#isUsingJoystic = false;
        this.node.active = false;
    }

    private moveKnobTouch(e: EventTouch): void {
        this.moveKnob(e.getUILocation());
    }

    private moveKnobMouse(e: EventMouse): void {
        this.moveKnob(e.getUILocation());
    }

    private moveKnob(location: Vec2): void {
        if (!this.#isUsingJoystic) return;

        this.isDragging = true;
        const posDelta: Vec2 = location.subtract(this.#defaultPosition);
        let x: number = posDelta.x;
        let y: number = posDelta.y;

        const length: number = Math.sqrt(posDelta.x ** 2 + posDelta.y ** 2);
        if (this.maxDistance < length) {
            const multiplier: number = this.maxDistance / length;

            x *= multiplier;
            y *= multiplier;
        }

        this.knob.position = new Vec3(x, y, 0);
    }
    ShowTutMove(){
        ControlUI._instance.textTut.children[0].active = true;
    }
    UnShowTut(){
        ControlUI._instance.textTut.children[0].active = false;
    }
}
