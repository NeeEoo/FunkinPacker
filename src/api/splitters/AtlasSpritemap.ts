import type { Rect } from 'api/types';
import Splitter from './Splitter';

type AtlasSpritemapFrame = {
	name: string,
	x: number,
	y: number,
	w: number,
	h: number,
	rotated: boolean
}

type AtlasSpritemapData = {
	ATLAS: {
		SPRITES: {
			SPRITE: AtlasSpritemapFrame
		}[]
	},
	meta: {
		app: string,
		version: string,
		image: string,
		format: string,
		size: {
			w: number,
			h: number
		},
		resolution: string
	}
}

class AtlasSpritemap extends Splitter {
	override doCheck(data: string, cb: (checked: boolean) => void) {
		try {
			const json = JSON.parse(data);
			console.log(json);
			console.log(json && json.ATLAS);
			console.log(json && json.ATLAS && Array.isArray(json.ATLAS.SPRITES));
			cb(json && json.ATLAS && Array.isArray(json.ATLAS.SPRITES));
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
			const json = JSON.parse(data) as AtlasSpritemapData;

			for(const spr of json.ATLAS.SPRITES) {
				const item = spr.SPRITE;
				console.log(item);
				const name = Splitter.fixFileName(item.name);

				let width, height;
				width = item.w;
				height = item.h;

				const rotated = item.rotated;

				if(rotated) {
					// Unsure if i should swap the offsets too?
					const temp = width;
					width = height;
					height = temp;
				}
				res.push({
					name: name,
					frame: {
						x: item.x,
						y: item.y,
						w: width,
						h: height
					},
					spriteSourceSize: {
						x: 0,
						y: 0,
						w: width,
						h: height
					},
					sourceSize: {
						w: width,
						h: height
					},
					frameSize: {
						x: 0,
						y: 0,
						w: width,
						h: height
					},
					trimmed: false,
					rotated: item.rotated
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
		return 'Atlas Spritemap';
	}
}

export default AtlasSpritemap;