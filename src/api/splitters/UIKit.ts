import type { Rect } from 'api/types';
import Splitter from './Splitter';

import { parse as plistParse } from 'plist';

class UIKit extends Splitter {
	override doCheck(data: string, cb: (checked: boolean) => void) {
		try {
			const atlas = plistParse(data);
			if(!atlas) return cb(false);

			const frames = (atlas as plist.PlistObject).frames as plist.PlistObject;
			if(!frames) return cb(false);

			if(atlas && frames) {
				const names = Object.keys(frames);
				const frame = frames[names[0]] as plist.PlistObject;

				if(!frame) return cb(false);

				cb(frame.x !== undefined &&
					frame.y !== undefined &&
					frame.w !== undefined &&
					frame.h !== undefined &&
					frame.oX !== undefined &&
					frame.oY !== undefined &&
					frame.oW !== undefined &&
					frame.oH !== undefined);
			}

			cb(false);
		}
		catch(e) {
			if(DEBUG)
				console.error(e);
			cb(false);
		}
	}

	override doSplit(data: string, cb: (res: Rect[] | false) => void) {
		try {
			const res:Rect[] = [];

			const atlas = plistParse(data);
			const frames = (atlas as plist.PlistObject).frames as plist.PlistObject;

			const names = Object.keys(frames);

			for(const name of names) {
				const item = frames[name] as plist.PlistObject;

				const trimmed = item.w < item.oW || item.h < item.oH;

				res.push({
					name: Splitter.fixFileName(name),
					frame: {
						x: item.x as number,
						y: item.y as number,
						w: item.w as number,
						h: item.h as number
					},
					spriteSourceSize: {
						x: 0,
						y: 0,
						w: item.w as number,
						h: item.h as number
					},
					sourceSize: {
						w: item.oW as number,
						h: item.oH as number
					},
					frameSize: {
						x: item.oX as number,
						y: item.oY as number,
						w: item.oW as number,
						h: item.oH as number
					},
					trimmed,
					rotated: false
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
		return 'UIKit';
	}
}

export default UIKit;