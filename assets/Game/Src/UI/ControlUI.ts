import {_decorator, Camera, Component, instantiate, Node, Prefab, tween, Vec3} from 'cc';
import {TypeEnum} from "db://assets/Game/Src/Utils/Enum";
import {ControlListTarget} from "db://assets/Game/Src/Core/ControlListTarget";
import {EffUI} from "db://assets/Game/Src/UI/EffUI";
import {PosMoveItem} from "db://assets/Game/Src/UI/PosMoveItem";

const { ccclass, property } = _decorator;

@ccclass('ControlUI')
export class ControlUI extends Component {
    static _instance: ControlUI;
    static get instance() {
        return this._instance;
    }
    @property(Node)
    parentItem: Node = null!;
    @property(Prefab)
    dau : Prefab = null!;
    @property(Prefab)
    nho : Prefab = null!;
    @property(Prefab)
    vai : Prefab = null!;

    @property(Node)
    targetXanh: Node = null!;
    @property(Node)
    targetDo: Node = null!;
    @property(Node)
    targetTim: Node = null!;

    @property(Camera)
    Camera: Camera = null!;

    @property(Node)
    popUpEnd: Node = null!;

    @property(Node)
    fireWork : Node = null!;
    @property(Node)
    playNow : Node = null!;
    @property(Node)
    hand : Node = null!;
    @property(Node)
    textTut : Node = null!;

    checkFirst : boolean = false;

    private _pendingTowers: Set<object> = new Set();
    private _accumulatedCounts: Map<TypeEnum, number> = new Map();

    private _itemPools: Map<TypeEnum, Node[]> = new Map();
    private _effPool: Node[] = [];

    private readonly MAX_CONCURRENT_ANIM = 10;
    private _activeAnimCount = 0;
    private _pendingQueue: Map<TypeEnum, Array<{ item: Node, target: Node, duration: number }>> = new Map();

    @property(Prefab)
    effDropItem: Prefab = null!;

    onLoad() {
        ControlUI._instance = this;
        // pre-pool 12 node mỗi loại, active false sẵn
        this._prePool(TypeEnum.Xanh, this.dau, 12);
        this._prePool(TypeEnum.Do,   this.nho, 12);
        this._prePool(TypeEnum.Tim,  this.vai, 12);
    }

    private _prePool(type: TypeEnum, prefab: Prefab, count: number) {
        const pool: Node[] = [];
        for (let i = 0; i < count; i++) {
            const node = instantiate(prefab);
            node.setParent(this.parentItem);
            node.active = false;
            pool.push(node);
        }
        this._itemPools.set(type, pool);
    }

    RegisterTower(tower: object) {
        this._pendingTowers.add(tower);
    }

    ReportTowerDone(tower: object, counts: Map<TypeEnum, number>) {
        counts.forEach((count, type) => {
            this._accumulatedCounts.set(type, (this._accumulatedCounts.get(type) ?? 0) + count);
        });
        this._pendingTowers.delete(tower);
        if (this._pendingTowers.size === 0) {
            this.SetTargetCounts(this._accumulatedCounts);
        }
    }

    private _runParabola(startPos: Vec3, endPos: Vec3, duration: number, item: Node, target: Node, typeItem: TypeEnum, batchCount: number = 1) {
        const height = -400;
        const originScale = 0.6;
        const maxScale = 1;
        const tempPos = new Vec3();
        const obj = { t: 0 };

        tween(obj)
            .to(duration, { t: 1 }, {
                onUpdate: (o: { t: number }) => {
                    const t = o.t;
                    tempPos.x = startPos.x + (endPos.x - startPos.x) * t;
                    tempPos.y = startPos.y + (endPos.y - startPos.y) * t + height * 4 * t * (1 - t);
                    tempPos.z = 0;
                    item.setWorldPosition(tempPos);
                    const scale = originScale + (maxScale - originScale) * (0.5 - Math.abs(0.5 - t) * 2);
                    item.setScale(scale, scale, scale);
                }
            })
            .call(() => {
                const posMoveItem = target.getComponent(PosMoveItem);
                if (posMoveItem) {
                    posMoveItem.UpdateDataTotalItem(batchCount);
                    posMoveItem.AnimBounce();
                }
                this._returnItem(item, typeItem);
                this._activeAnimCount--;
                this._dispatchBatches();
            })
            .start();
    }

    SpawnItem(typeItem: TypeEnum): Node {
        const pool = this._itemPools.get(typeItem);
        if (pool && pool.length > 0) {
            const node = pool.pop();
            node.active = true;
            node.setPosition(0, 0, 0);
            node.setScale(1, 1, 1);
            return node;
        }
        let item: Node;
        if (typeItem == TypeEnum.Xanh)     item = instantiate(this.dau);
        else if (typeItem == TypeEnum.Do)  item = instantiate(this.nho);
        else                               item = instantiate(this.vai);
        item.setParent(this.parentItem);
        return item;
    }

    private _returnItem(node: Node, typeItem: TypeEnum) {
        node.active = false;
        if (!this._itemPools.has(typeItem)) this._itemPools.set(typeItem, []);
        this._itemPools.get(typeItem).push(node);
    }

    GetTarget(typeItem: TypeEnum): Node {
        if (typeItem == TypeEnum.Xanh)    return this.targetXanh;
        else if (typeItem == TypeEnum.Do) return this.targetDo;
        else                              return this.targetTim;
    }

    MoveItem(item: Node, target: Node, typeItem: TypeEnum, duration: number = 1) {
        if (!this._pendingQueue.has(typeItem)) this._pendingQueue.set(typeItem, []);
        this._pendingQueue.get(typeItem).push({ item, target, duration });
        this._dispatchBatches();
    }

    private _dispatchBatches() {
        for (const [typeItem, queue] of this._pendingQueue) {
            if (queue.length === 0) continue;
            if (this._activeAnimCount >= this.MAX_CONCURRENT_ANIM) break;

            const freeSlots = this.MAX_CONCURRENT_ANIM - this._activeAnimCount;
            const slotsForType = Math.min(freeSlots, queue.length);
            const batchSize = Math.ceil(queue.length / slotsForType);

            for (let s = 0; s < slotsForType && queue.length > 0; s++) {
                if (this._activeAnimCount >= this.MAX_CONCURRENT_ANIM) break;
                const count = Math.min(batchSize, queue.length);
                const batch = queue.splice(0, count);
                const first = batch[0];
                // trả pool các item dư trong batch
                for (let i = 1; i < batch.length; i++) {
                    this._returnItem(batch[i].item, typeItem);
                }
                this._activeAnimCount++;
                this._runParabola(
                    first.item.getWorldPosition().clone(),
                    first.target.getWorldPosition().clone(),
                    first.duration, first.item, first.target, typeItem, count
                );
            }
        }
    }

    SpawnEff(target: Node): Node {
        let eff: Node;
        if (this._effPool.length > 0) {
            eff = this._effPool.pop();
            eff.active = true;
        } else {
            eff = instantiate(this.effDropItem);
            eff.setParent(this.parentItem);
        }
        eff.setPosition(new Vec3(0, 0, 0));
        eff.getComponent(EffUI).camera = this.Camera;
        eff.getComponent(EffUI).targetWold = target.worldPosition;
        eff.getComponent(EffUI).Init();
        return eff;
    }

    ShowEffDropItem(eff: Node) {
        const target = eff.position.clone().add(new Vec3(0, 100, 0));
        tween(eff)
            .to(0.3, { position: target }, { easing: 'sineInOut' })
            .call(() => {
                eff.active = false;
                this._effPool.push(eff); // trả về pool
            })
            .start();
    }

    SetTargetCounts(counts: Map<TypeEnum, number>) {
        const targets: [Node, TypeEnum][] = [
            [this.targetXanh, TypeEnum.Xanh],
            [this.targetDo, TypeEnum.Do],
            [this.targetTim, TypeEnum.Tim],
        ];
        for (const [targetNode, type] of targets) {
            const count = counts.get(type) ?? 0;
            if (count > 0) {
                targetNode.active = true;
                targetNode.getComponent(PosMoveItem).setTotal(count);
            } else {
                targetNode.active = false;
                ControlListTarget.instance.RemoveTarget(targetNode);
            }
        }
    }
}
