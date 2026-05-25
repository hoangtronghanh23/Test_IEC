import {_decorator, Component} from 'cc';
import {TypeEnum} from "db://assets/Game/Src/Utils/Enum";

const { ccclass, property } = _decorator;

@ccclass('Item')
export class Item extends Component {
    @property
    typeItem : TypeEnum = TypeEnum.Xanh;
}


