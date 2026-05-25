import { _decorator, Component, Node } from 'cc';
import {GameManager} from "db://assets/PLAGameFoundation/gameControl/core/manager/gameManager";
import gameEndHandler from "db://assets/PLAGameFoundation/gameControl/utilities/handler/gameEndHandler";
import {Constant} from "db://assets/constant/constant";
const { ccclass, property } = _decorator;

@ccclass('GameControl')
export class GameControl extends Component {
    onLoad(){
        GameManager.instance.SetupManagerInit();
    }
    JumpStore() {
        gameEndHandler.StoreGameChangingNoCondition();
    }
}


