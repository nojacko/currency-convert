export interface ThingJson {
    id: string;
    name: string;
    description: string;
    value: number;
}

export interface ThingHash {
    [x: string]: Thing[];
}

export default class Thing {
    id: string;
    name: string;
    description: string = "";
    value: number;

    constructor() {
        this.id = crypto.randomUUID();
    }

    static fromJson(json: ThingJson) {
        const thing = new Thing();
        thing.id = json.id;
        thing.name = json.name;
        thing.description = json.description;
        thing.value = json.value;
        return thing;
    }

    toJson() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            value: this.value,
        }
    }
}