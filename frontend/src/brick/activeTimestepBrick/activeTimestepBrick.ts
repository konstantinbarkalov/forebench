import { AbstractBrick } from '../abstractBrick/abstractBrick.js';


export class ActiveTimestepBrick implements AbstractBrick {
    constructor(
        public date: Date
    ) {
    }
}
