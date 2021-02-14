import { AbstractBrick } from '../abstractBrick/abstractBrick.js';
import { Kdvu } from '../../kdvu.js';
import { rgbaT } from '../../todo.js';


export class ProviderBrick implements AbstractBrick {
    constructor(
        public date: Date,
        public title: string,
        public suptitle: string,
        public values: Kdvu[],
        public color: rgbaT,
    ) {
    }
}
