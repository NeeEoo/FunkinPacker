import type { Rect } from "api/types";
import Splitter from "./Splitter";

type Phaser3Format = {
	textures: Phaser3Texture[]
}

type Phaser3Texture = {
	image: string,
	format: string,
	size: { w: number, h: number },
	scale: number,
	frames: Phaser3Frame[]
}

type Phaser3Frame = {
	filename: string,
	frame: { x: number, y: number, w: number, h: number },
	rotated?: boolean,
	trimmed?: boolean,
	spriteSourceSize: { x: number, y: number, w: number, h: number },
	sourceSize: { w: number, h: number },
	anchor?: { x: number, y: number },
}

class Phaser3 extends Splitter {
    override doCheck(data: string, cb: (checked: boolean) => void) {
        try {
            const json = JSON.parse(data);

            cb(json && json.textures && Array.isArray(json.textures));
        } catch (e) {
			if(DEBUG)
				console.error(e);
            cb(false);
        }
    }

    override doSplit(data: string, cb: (res: Rect[] | false) => void) {
        const res = [];

        try {
            const json = JSON.parse(data) as Phaser3Format;

            for (const texture of json.textures) {
                for (const item of texture.frames) {
					const trimmed = item.trimmed || item.frame.w < item.spriteSourceSize.w || item.frame.h < item.spriteSourceSize.h;
                    res.push({
						name: Splitter.fixFileName(item.filename),
						frame: {
							x: item.frame.x,
							y: item.frame.y,
							w: item.frame.w,
							h: item.frame.h
						},
						spriteSourceSize: {
							x: 0,
							y: 0,
							w: item.frame.w,
							h: item.frame.h
						},
						sourceSize: {
							w: item.sourceSize.w,
							h: item.sourceSize.h
						},
						frameSize: {
							x: item.spriteSourceSize.x,
							y: item.spriteSourceSize.y,
							w: item.spriteSourceSize.w,
							h: item.spriteSourceSize.h
						},
						trimmed: trimmed,
						rotated: item.rotated ?? false
					});
                }
            }

			cb(res);
        } catch (e) {
			if(DEBUG)
				console.error(e);
			cb(false);
		}
    }

	override get splitterName() {
		return 'Phaser 3';
	}
}

export default Phaser3;