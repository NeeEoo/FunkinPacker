import type { Rect } from 'api/types';
import Splitter from './Splitter';

type JsonHashFormat = {
	frames: {
		[key: string]: JsonHashFrame
	},
	meta?: JsonHashMeta
}

type JsonHashMeta = {
	app: string,
	version: string,
	image: string,
	format: string,
	size: { w: number, h: number },
	scale: string,
	frameTags: JsonFrameTag[],
	layers: JsonLayer[],
	slices: JsonSlice[]
}

type JsonFrameTag = {
	name: string,
	from: number,
	to: number,
	direction: string,
	color: string
}

type JsonLayer = {
	name: string,
	opacity: number,
	blendMode: string
}

type JsonSlice = {
	// these might be wrong
	name: string,
	color: string,
	alpha: number
}

type JsonHashFrame = {
    frame: { x: number, y: number, w: number, h: number },
    rotated?: boolean,
    trimmed?: boolean,
    spriteSourceSize: { x: number, y: number, w: number, h: number },
    sourceSize: { w: number, h: number },
    duration?: number
}

class JsonHash extends Splitter {
	override doCheck(data: string, cb: (checked: boolean) => void) {
		try {
			const json = JSON.parse(data);
			cb(json && json.frames && !Array.isArray(json.frames));
		}
		catch(e) {
			if(DEBUG)
				console.error(e);
			cb(false);
		}
	}

	override doSplit(data: string, cb: (res: Rect[] | false) => void) {
		const res = [];

		try {
			const json = JSON.parse(data) as JsonHashFormat;

			const names = Object.keys(json.frames);

			for(const name of names) {
				const item = json.frames[name];

				const trimmed = item.trimmed || item.frame.w < item.spriteSourceSize.w || item.frame.h < item.spriteSourceSize.h;

				res.push({
					name: Splitter.fixFileName(name),
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
		return 'JSON (hash)';
	}
}

export default JsonHash;