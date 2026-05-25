import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('MoveHand')
export class MoveHand extends Component {
    @property
    speed: number = 1;

    private time: number = 0;

    update(deltaTime: number) {
        this.time += deltaTime * this.speed;

        const A = 250;
        const B = 170;

        const x = A * Math.sin(this.time);
        const y = B * Math.sin(this.time) * Math.cos(this.time);

        this.node.setPosition(x, y);
    }
}


