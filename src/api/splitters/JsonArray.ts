import type { Rect } from 'api/types';
import Splitter from './Splitter';

type JsonArrayFormat = {
	frames: JsonArrayFrame[]
}

type JsonArrayFrame = {
	filename: string,
	frame: { x: number, y: number, w: number, h: number },
	rotated?: boolean,
	trimmed?: boolean,
	spriteSourceSize: { x: number, y: number, w: number, h: number },
	sourceSize: { w: number, h: number },
	duration?: number
}

class JsonArray extends Splitter {
	override doCheck(data: string, cb: (checked: boolean) => void) {
		try {
			const json = JSON.parse(data);
			cb(json && json.frames && Array.isArray(json.frames));
		}
		catch(e) {
			if(DEBUG)
				console.error(e);
			cb(false);
		}
	}

	override doSplit(data: string, cb: (res: Rect[] | false) => void) {
		try {
			const res = [];
			const json = JSON.parse(data) as JsonArrayFormat;

			for(const item of json.frames) {
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

			cb(res);
		}
		catch(e) {
			if(DEBUG)
				console.error(e);
			cb(false);
		}
	}

	override get splitterName() {
		return 'JSON (array)';
	}
}

export default JsonArray;