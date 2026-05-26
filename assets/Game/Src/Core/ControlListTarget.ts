import { _decorator, Component, Node } from 'cc';
import {ControlUI} from "db://assets/Game/Src/UI/ControlUI";

const { ccclass, property } = _decorator;

@ccclass('ControlListTarget')
export class ControlListTarget extends Component {
    @property([Node])
    listTarget: Node[] = [];
    static _instance: ControlListTarget;
    static get instance() {
        return this._instance;
    }
    onLoad(){
        ControlListTarget._instance = this;
        this.Init();
    }
    Init() {
        this.node.children.forEach((child) => {
            this.listTarget.push(child);
        })
    }
    RemoveTarget(node: Node) {
        const index = this.listTarget.indexOf(node);
        if (index !== -1) {
            this.listTarget.splice(index, 1);
        }
        node.active = false;
        if (this.listTarget.length == 0) {
            ControlUI.instance.fireWork.active = true;

            this.scheduleOnce(() => {
                ControlUI.instance.popUpEnd.active = true;
                ControlUI.instance.textTut.active = false;
            },1)
        }
    }
}