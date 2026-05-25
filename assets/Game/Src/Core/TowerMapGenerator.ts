import { _decorator, Component, Prefab, instantiate, ColliderComponent, RigidBody } from 'cc';
import { EGroup } from "db://assets/Game/Src/Utils/EGroupMask";
import { Item } from "db://assets/Game/Src/Element/Item";
import { TypeEnum } from "db://assets/Game/Src/Utils/Enum";
import { ControlUI } from "db://assets/Game/Src/UI/ControlUI";
import { SetUpElement } from "db://assets/Game/Src/Core/SetUpElement";

const { ccclass, property } = _decorator;


@ccclass('TowerMapGenerator')
export class TowerMapGenerator extends Component {
    @property({ type: [Prefab] })
    public itemPrefabs: Prefab[] = [];

    @property
    public maxItemsInRing: number = 8;

    @property
    public itemStepPerLayer: number = 2;

    @property
    public itemDiameter: number = 1;

    @property
    public itemSpacing: number = 0.2;

    @property
    public layerHeight: number = 1.2;

    private _pendingLayers: number[] = [];
    private _pendingIndex: number = 0;
    private _layerHeight: number = 0;
    private _typeCounts: Map<TypeEnum, number> = new Map();

    start() {
        ControlUI.instance.RegisterTower(this);
        this.generateTower();
    }

    public generateTower() {
        this.node.removeAllChildren();
        this._pendingLayers = this._computeLayers();
        this._layerHeight = Math.abs(this.layerHeight);
        this._pendingIndex = 0;
        this._typeCounts.clear();
    }

    update(_dt: number) {
        if (this._pendingIndex >= this._pendingLayers.length) return;

        const itemCount = this._pendingLayers[this._pendingIndex];
        const radius = this._radiusForCount(itemCount);
        const y = this._pendingIndex * this._layerHeight;
        this._spawnRing(itemCount, radius, y, this._pendingIndex);
        this._pendingIndex++;

        if (this._pendingIndex >= this._pendingLayers.length) {
            ControlUI.instance.ReportTowerDone(this, this._typeCounts);
        }
    }

    private _computeLayers(): number[] {
        const layers: number[] = [];
        let current = Math.max(1, this.maxItemsInRing);
        while (current > 1) {
            layers.push(current);
            current = Math.max(1, current - Math.max(1, this.itemStepPerLayer));
        }
        layers.push(1);
        return layers;
    }

    private _radiusForCount(itemCount: number): number {
        if (itemCount <= 1) return 0;
        return itemCount * (this.itemDiameter + this.itemSpacing) / (2 * Math.PI);
    }

    private _spawnRing(itemCount: number, radius: number, yOffset: number, layerIndex: number) {
        if (this.itemPrefabs.length === 0) return;

        const prefab = this.itemPrefabs[layerIndex % this.itemPrefabs.length];
        const angleStep = (2 * Math.PI) / itemCount;
        const base = this.node.worldPosition;

        for (let i = 0; i < itemCount; i++) {
            const angle = i * angleStep;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const itemNode = instantiate(prefab);
            this.node.addChild(itemNode);
            itemNode.setWorldPosition(base.x + x, base.y + yOffset, base.z + z);

            const itemComp = itemNode.getComponent(Item);
            if (itemComp) {
                const t = itemComp.typeItem;
                this._typeCounts.set(t, (this._typeCounts.get(t) ?? 0) + 1);
            }

            const collider = itemNode.getComponent(ColliderComponent);
            if (collider) {
                collider.setGroup(EGroup.G_BODY);
                collider.setMask(-1);
            }

            const rb = itemNode.getComponent(RigidBody);
            if (rb) {
                rb.isKinematic = true;
                rb.useGravity = false;
            }

            SetUpElement.instance?.registerItem(itemNode);
        }
    }
}
