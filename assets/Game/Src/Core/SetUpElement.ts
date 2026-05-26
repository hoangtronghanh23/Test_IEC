import {_decorator, ColliderComponent, Component, isValid, ITriggerEvent, math, Node, Vec3} from 'cc';
import {EGroup} from "db://assets/Game/Src/Utils/EGroupMask";
import {Item} from "db://assets/Game/Src/Element/Item";
import {ControlUI} from "db://assets/Game/Src/UI/ControlUI";
import {ControlHole} from "db://assets/Game/Src/Core/ControlHole";

const { ccclass, property } = _decorator;
const _ime = new math.Vec3();
const _pot = new math.Vec3();

@ccclass('SetUpElement')
export class SetUpElement extends Component {

    @property({ type: Node })
    public roleNode: Node = null;

    @property({ type: Node })
    public planeNode: Node = null;
    @property(Node)
    bot : Node = null!;
    static instance: SetUpElement = null;
    countCollectStrawberry : number = 0;
    private _activeSoundCount: number = 0;
    private readonly MAX_COLLECT_SOUNDS: number = 5;
    private _allItems: Set<Node> = new Set();

    onLoad () {
        SetUpElement.instance = this;
    }

    public registerItem(node: Node) {
        this._allItems.add(node);
    }
    SetUpItem(){
        this.node.children.forEach((child) => {
            let collider = child.getComponent(ColliderComponent);
            if (collider) {
                collider.setGroup(EGroup.G_BODY);
                collider.setMask(-1);
            }
        })
    }
    start () {
        this.SetUpItem();
        // role setup
        if (this.roleNode) {
            this.roleNode.name = 'Hole';
            const colliders = this.roleNode.getComponents(ColliderComponent);

            const collider0 = colliders[0];
            if (collider0) {
                collider0.setGroup(EGroup.G_ROLE);
                collider0.setMask(EGroup.G_BODY);
                collider0.on('onTriggerEnter', this._onTriggerEnter0, this);
                collider0.on('onTriggerExit', this._onTriggerExit0, this);
            }

            const collider1 = colliders[1];
            if (collider1) {
                collider1.setGroup(EGroup.G_ROLE);
                collider1.setMask(EGroup.G_BODY);
                collider1.on('onTriggerStay', this._onTriggerStay1, this);
            }
        }

        // plane setup
        if (this.planeNode) {
            this.planeNode.name = 'Plane';
            let collider = this.planeNode.getComponent(ColliderComponent);
            if (collider) {
                collider.setGroup(EGroup.G_PLANE);
                collider.setMask(EGroup.G_BODY);
            }
        }
        this.planeNode.children.forEach((child) => {
            let collider = child.getComponent(ColliderComponent);
            if (collider) {
                collider.setGroup(EGroup.G_PLANE);
                collider.setMask(EGroup.G_BODY);
            }
        })
        // bot setup
        if (this.bot) {
            this.bot.name = 'Bot';
            let collider = this.bot.getComponent(ColliderComponent);
            if (collider) {
                collider.setGroup(EGroup.G_BOT);
                collider.setMask(EGroup.G_BODY);
            }
        }
    }

    private _onTriggerEnter0 (event: ITriggerEvent) {
        if (event.otherCollider.getComponent(Item)) {
            event.otherCollider.setMask(EGroup.G_BODY + EGroup.G_ROLE);
        }
    }

    private readonly MAX_COLLECT_PER_FRAME = 3;

    update(_dt: number) {
        let collected = 0;
        // check toàn bộ item đã đăng ký — không bỏ sót bất kỳ item nào
        this._allItems.forEach(node => {
            if (!isValid(node) || !node.active) {
                this._allItems.delete(node);
                return;
            }
            if (collected >= this.MAX_COLLECT_PER_FRAME) return;
            if (node.worldPosition.y < 0) {
                this._allItems.delete(node);
                this._collectItem(node);
                collected++;
            }
        });
    }

    private _collectItem(node: Node) {
        if (this._activeSoundCount < this.MAX_COLLECT_SOUNDS) {
            this._activeSoundCount++;
            this.scheduleOnce(() => { this._activeSoundCount--; }, 1.0);
        }
        const typeItem = node.getComponent(Item).typeItem;
        const target = ControlUI.instance.GetTarget(typeItem);
        const item = ControlUI.instance.SpawnItem(typeItem);
        const eff = ControlUI.instance.SpawnEff(node);
        ControlUI.instance.ShowEffDropItem(eff);
        this.roleNode.getComponent(ControlHole).fillCircleStep(this.roleNode.getComponent(ControlHole).circleSprite, 0.05);
        if (target) ControlUI.instance.MoveItem(item, target, typeItem);
        node.active = false;
    }

    private _onTriggerExit0 (event: ITriggerEvent) {
        if (event.otherCollider.getComponent(Item)) {
            if (event.otherCollider.node.worldPosition.y >= 0) {
                event.otherCollider.setMask(-1);
            }
        }
    }

    private _onTriggerStay1 (event: ITriggerEvent) {
        if (event.otherCollider.getComponent(Item)) {
            if (event.otherCollider.attachedRigidBody) {
                const rb = event.otherCollider.attachedRigidBody;
                rb.isKinematic = false;
                rb.useGravity = true;
                rb.clearState();
                rb.wakeUp();

                const wp = event.otherCollider.node.worldPosition;
                _ime.x = wp.x - this.roleNode.worldPosition.x;
                _ime.z = wp.z - this.roleNode.worldPosition.z;
                Vec3.copy(_pot, _ime);
                _pot.normalize();
                _pot.y = 0.5;
                _ime.y = 2;
                _ime.negative();
                _ime.normalize();
                _ime.multiplyScalar(12);
                event.otherCollider.attachedRigidBody.applyImpulse(_ime, _pot);
            }
        }
    }
}


