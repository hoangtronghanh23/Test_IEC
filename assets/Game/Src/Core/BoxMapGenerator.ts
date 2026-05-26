import { _decorator, Component, Prefab, instantiate, ColliderComponent, RigidBody } from 'cc';
import { EGroup } from "db://assets/Game/Src/Utils/EGroupMask";
import { Item } from "db://assets/Game/Src/Element/Item";
import { TypeEnum } from "db://assets/Game/Src/Utils/Enum";
import { ControlUI } from "db://assets/Game/Src/UI/ControlUI";
import { SetUpElement } from "db://assets/Game/Src/Core/SetUpElement";

const { ccclass, property } = _decorator;


@ccclass('BoxMapGenerator')
export class BoxMapGenerator extends Component {
    @property({ type: [Prefab] })
    public itemPrefabs: Prefab[] = [];

    @property
    public sizeX: number = 6;

    @property
    public sizeY: number = 6;

    @property
    public sizeZ: number = 6;

    @property
    public itemDiameter: number = 1;

    @property
    public itemSpacing: number = 0.2;

    @property
    public layerHeight: number = 1.2;

    private _pendingIndex: number = 0;
    private _layerHeight: number = 0;
    private _typeCounts: Map<TypeEnum, number> = new Map();

    start() {
        ControlUI.instance.RegisterTower(this);
        this.generateBox();
    }

    public generateBox() {
        this.node.removeAllChildren();
        this._layerHeight = Math.abs(this.layerHeight);
        this._pendingIndex = 0;
        this._typeCounts.clear();
    }

    update(_dt: number) {
        if (this._pendingIndex >= this.sizeY) return;

        const y = this._pendingIndex * this._layerHeight;
        this._spawnLayer(y, this._pendingIndex);
        this._pendingIndex++;

        if (this._pendingIndex >= this.sizeY) {
            ControlUI.instance.ReportTowerDone(this, this._typeCounts);
        }
    }

    private _spawnLayer(yOffset: number, layerIndex: number) {
        if (this.itemPrefabs.length === 0) return;

        const prefab = this.itemPrefabs[layerIndex % this.itemPrefabs.length];
        const step = this.itemDiameter + this.itemSpacing;
        const base = this.node.worldPosition;

        const offsetX = -((this.sizeX - 1) * step) / 2;
        const offsetZ = -((this.sizeZ - 1) * step) / 2;

        for (let ix = 0; ix < this.sizeX; ix++) {
            for (let iz = 0; iz < this.sizeZ; iz++) {
                const x = offsetX + ix * step;
                const z = offsetZ + iz * step;

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
}
