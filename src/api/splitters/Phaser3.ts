import type { Rect } from "api/types";
import Splitter from "./Splitter";

class Phaser3 extends Splitter {
    override doCheck(data: string, cb: (checked: boolean) => void) {
        try {
            const json = JSON.parse(data);

            cb(json && json.textures && Array.isArray(json.textures));
        } catch (e) {
            cb(false);
        }
    }

    override doSplit(data: string, cb: (res: Rect[] | false) => void) {
        const res = [];

        try {
            const json = JSON.parse(data);

            for (const texture of json.textures) {
                for (const item of texture.frames) {
                    item.name = Splitter.fixFileName(item.filename);
                    res.push(item);
                }
            }
        } catch (e) {}

        cb(res);
    }

    static get type() {
        return "Phaser 3";
    }
}

export default Phaser3;