import type { Rect, SplitterRect } from 'api/types';
import Splitter from './Splitter';

/*class Point {
	x: number;
	y: number;
}*/

class Spine extends Splitter {
	override doCheck(data: string, cb: (checked: boolean) => void) {
		const lines = data.split('\n');
		if(lines.length < 2) return cb(false);
		if(lines[0].trim() !== '') return cb(false);

		if(lines[lines.length-1].trim() !== '') return cb(false);

		cb(lines[2] && lines[2].trim().indexOf('size:') === 0);
	}

	private static finalizeItem(item:SplitterRect):Rect {
		/*if(item.offset) {
			item.spriteSourceSize = {
				x: item.offset.x,
				y: item.offset.y,
				w: item.frame.w,
				h: item.frame.h
			}
		}
		else {
			item.spriteSourceSize = {x: 0, y: 0, w: item.frame.w, h: item.frame.h};
		}*/

		item.trimmed = item.frame.w !== item.sourceSize.w || item.frame.h !== item.sourceSize.h;

		return item;
	}

	override doSplit(data: string, cb: (res: Rect[] | false) => void) {
		const res:Rect[] = [];

		const lines = data.split('\n');

		let currentItem:SplitterRect = null;

		for(let i=6; i<lines.length; i++) {
			let line = lines[i];

			if(!line) continue;

			if(line[0].trim()) {
				if(currentItem) {
					res.push(Spine.finalizeItem(currentItem));
				}

				currentItem = {
					name: Splitter.fixFileName(line.trim()),
					frame: {
						x: -1,
						y: -1,
						w: -1,
						h: -1
					},
					spriteSourceSize: {
						x: 0,
						y: 0,
						w: -1,
						h: -1
					},
					sourceSize: {
						w: -1,
						h: -1
					},
					frameSize: {
						x: -1,
						y: -1,
						w: -1,
						h: -1
					},
					trimmed: false,
					rotated: false
				};
			}
			else {
				line = line.trim();
				const parts = line.split(':');
				const name = parts[0].trim();
				const val = parts[1].trim();

				const valParts = val.split(',');
				valParts[0] = valParts[0].trim();

				if(valParts[1]) valParts[1] = valParts[1].trim();

				switch (name) {
					case "rotate":
						currentItem.rotated = val === 'true';
						break;
					case "xy":
						currentItem.frame.x = parseInt(valParts[0], 10);
						currentItem.frame.y = parseInt(valParts[1], 10);
						break;
					case "size":
						currentItem.frame.w = parseInt(valParts[0], 10);
						currentItem.frame.h = parseInt(valParts[1], 10);
						currentItem.spriteSourceSize.w = currentItem.frame.w;
						currentItem.spriteSourceSize.h = currentItem.frame.h;
						break;
					case "orig":
						currentItem.sourceSize.w = parseInt(valParts[0], 10);
						currentItem.sourceSize.h = parseInt(valParts[1], 10);
						currentItem.frameSize.w = currentItem.sourceSize.w;
						currentItem.frameSize.h = currentItem.sourceSize.h;
						break;
					case "offset":
						//currentItem.spriteSourceSize.x = parseInt(valParts[0], 10);
						//currentItem.spriteSourceSize.y = parseInt(valParts[1], 10);
						currentItem.frameSize.x = parseInt(valParts[0], 10);
						currentItem.frameSize.y = parseInt(valParts[1], 10);
						break;
					default:
						break;
				}
			}
		}

		if(currentItem) {
			res.push(Spine.finalizeItem(currentItem));
		}

		cb(res);
	}

	override get splitterName() {
		return 'Spine';
	}

	override get inverseRotation() {
		return true;
	}
}

export default Spine;