import { AbstractBrick } from '../abstractBrick/abstractBrick.js';
import { Kdvu } from '../../kdvu.js';


export class TimestepBrick implements AbstractBrick {
    constructor(
        public date: Date,
        public values: Kdvu[]
    ) {
    }
}
