import type { Rect, SplitterRect } from 'api/types';
import Splitter from './Splitter';

import { Parser as XmlParser } from 'xml2js';

class XML extends Splitter {
	override doCheck(data: string, cb: (checked: boolean) => void) {
		if(!data) {
			cb(false);
			return;
		}

		try {
			var parser = new XmlParser();
			parser.parseString(data, (err, atlas) => {
				if(err) {
					cb(false);
					return;
				}

				cb(atlas.TextureAtlas && Array.isArray(atlas.TextureAtlas.sprite));
			});
		}
		catch(e) {
			cb(false);
		}
	}

	override doSplit(data: string, cb: (res: Rect[] | false) => void) {
		if(!data) {
			cb(false);
			return;
		}

		try {
			var parser = new XmlParser();
			parser.parseString(data, (err, atlas) => {
				if(err) {
					cb(false);
					return;
				}

				const res: SplitterRect[] = [];

				const list = atlas.TextureAtlas.sprite;

				for(let item of list) {
					item = item.$;

					item.x *= 1;
					item.y *= 1;
					item.w *= 1;
					item.h *= 1;
					item.oX *= 1;
					item.oY *= 1;
					item.oW *= 1;
					item.oH *= 1;

					const trimmed = item.w < item.oW || item.h < item.oH;

					res.push({
						name: Splitter.fixFileName(item.n),
						frame: {
							x: item.x,
							y: item.y,
							w: item.w,
							h: item.h
						},
						spriteSourceSize: {
							x: 0,
							y: 0,
							w: item.w,
							h: item.h
						},
						sourceSize: {
							w: item.oW,
							h: item.oH
						},
						frameSize: {
							x: item.oX,
							y: item.oY,
							w: item.oW,
							h: item.oH
						},
						rotated: item.r === 'y',
						trimmed
					});
				}

				cb(res);
			});
		}
		catch(e) {
			cb(false);
		}
	}

	override get splitterName() {
		return 'XML';
	}
}

export default XML;