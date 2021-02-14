import { Kdvu } from '../../kdvu.js';

export class AbstractBrick {
    constructor(
        public date?: Date,
        public title?: string,
        public suptitle?: string,
        public values?: Kdvu[],
    ) {

    }
}
