import type { Rect, SplitterRect } from 'api/types';
import Splitter from './Splitter';

import { Parser as XmlParser } from 'xml2js';
import { HaxeXmlParser } from './tools/HaxeXmlParser';

type SparrowFrame = {
	x: number,
	y: number,
	name: string,
	width: number,
	height: number,
	frameX: number,
	frameY: number,
	frameWidth: number,
	frameHeight: number,
	rotated: boolean
}

type RawSparrowFrame = {
	x: string,
	y: string,
	name: string,
	width: string,
	height: string,
	frameX: string,
	frameY: string,
	frameWidth: string,
	frameHeight: string,
	rotated: string
}

class Sparrow extends Splitter {
	override doCheck(data: string, cb: (checked: boolean) => void) {
		if(!data) {
			cb(false);
			return;
		}

		try {
			var parser = new XmlParser();
			parser.parseString(data, (err, atlas) => {
				if(err) {
					throw err;
				}

				cb(atlas.TextureAtlas && Array.isArray(atlas.TextureAtlas.SubTexture));
			});
		}
		catch(e) {
			try {
				console.log("Trying to parse as Haxe Xml");
				const atlas = HaxeXmlParser.parse(data, false);
				console.log("Parsed as Haxe Xml");
				//console.log(atlas);
				if(atlas.hasElement("TextureAtlas")) {
					const list = atlas.firstElement();
					const arr = list.elementsNamed("SubTexture");
					cb(arr.length > 0);
				} else {
					cb(false);
				}
			} catch(e) {
				console.error(e);
				cb(false);
			}
		}
	}

	override doSplit(data: string, cb: (res: Rect[] | false) => void) {
		if(!data) {
			cb(false);
			return;
		}

		let res: SplitterRect[] = [];

		try {
			var parser = new XmlParser();
			parser.parseString(data, (err, atlas) => {
				if(err) {
					throw err;
				}

				let list = atlas.TextureAtlas.SubTexture;

				for(let li of list) {
					let attribs = li.$;

					res.push(this.convertToRect({
						name: attribs.name,
						x: attribs.x,
						y: attribs.y,
						width: attribs.width,
						height: attribs.height,
						frameX: attribs.frameX,
						frameY: attribs.frameY,
						frameWidth: attribs.frameWidth,
						frameHeight: attribs.frameHeight,
						rotated: attribs.rotated
					}));
				}

				cb(res);
			});
		}
		catch(e) {
			try {
				const atlas = HaxeXmlParser.parse(data, false).firstElement();
				const rects = atlas.elementsNamed("SubTexture");
				for(const rect of rects) {
					res.push(this.convertToRect({
						name: rect.get("name"),
						x: rect.get("x"),
						y: rect.get("y"),
						width: rect.get("width"),
						height: rect.get("height"),
						frameX: rect.get("frameX"),
						frameY: rect.get("frameY"),
						frameWidth: rect.get("frameWidth"),
						frameHeight: rect.get("frameHeight"),
						rotated: rect.get("rotated")
					}));
				}
				cb(res);
				return;
			} catch(e) {
				console.error(e);
			}
		}

		cb(res);
	}

	private convertToRect(attribs:RawSparrowFrame): Rect {
		const name = Splitter.fixFileName(attribs.name);

		const rotated = attribs.rotated === 'true';
		if(rotated) {
			// Unsure if i should swap the offsets too?
			const temp = attribs.width;
			attribs.width = attribs.height;
			attribs.height = temp;
		}

		const width = parseInt(attribs.width, 10);
		const height = parseInt(attribs.height, 10);

		const item: SparrowFrame = {
			name: name,
			x: parseInt(attribs.x, 10),
			y: parseInt(attribs.y, 10),
			width: width,
			height: height,
			frameX: 0,
			frameY: 0,
			frameWidth: width,
			frameHeight: height,
			rotated: rotated
		};

		if(attribs.frameX) {
			item.frameX = -parseInt(attribs.frameX, 10);
			item.frameY = -parseInt(attribs.frameY, 10);
			item.frameWidth = parseInt(attribs.frameWidth, 10);
			item.frameHeight = parseInt(attribs.frameHeight, 10);
		}

		//console.log(name, item);

		const trimmed = item.width < item.frameWidth || item.height < item.frameHeight;

		// TODO: make this only happen visually, since users have reported issues with this
		//item.frameWidth = Math.max(item.frameWidth, item.width + item.frameX);
		//item.frameHeight = Math.max(item.frameHeight, item.height + item.frameY);

		return {
			name: item.name,
			frame: {
				x: item.x,
				y: item.y,
				w: item.width,
				h: item.height
			},
			spriteSourceSize: {
				x: 0,
				y: 0,
				w: item.width,
				h: item.height
			},
			sourceSize: {
				w: item.width,
				h: item.height
			},
			frameSize: {
				x: item.frameX,
				y: item.frameY,
				w: item.frameWidth,
				h: item.frameHeight
			},
			rotated,
			trimmed
		};
	}

	override get splitterName() {
		return 'Sparrow';
	}
}

export default Sparrow;