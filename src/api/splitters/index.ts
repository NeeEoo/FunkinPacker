import Grid from './Grid';
import JsonHash from './JsonHash';
import JsonArray from './JsonArray';
//import XML from './XML';
import UIKit from './UIKit';
import Spine from './Spine';
import Sparrow from './Sparrow';
import Splitter, { type SplitterOptions } from './Splitter';
import type { Rect } from 'api/types';
import TypedObserver from 'TypedObserver';
import APP from 'client/APP';
import Phaser3 from './Phaser3';
import AtlasSpritemap from './AtlasSpritemap';

const GridSplitter = new Grid();

export const list: Splitter[] = [
	new Sparrow(),
	GridSplitter,
	new JsonHash(),
	new JsonArray(),
	//XML,
	new UIKit(),
	new Spine(),
	new Phaser3(),
	new AtlasSpritemap()
] as const;

function getDefaultSplitter():Splitter {
	return new Sparrow();
}

export class SplitterMaster {
	currentSplitter: Splitter | null;
	_storedSplitterOrder: string[] | null;

	constructor() {
		this.currentSplitter = null;
		this._storedSplitterOrder = null;
	}

	getListOfSplitters = () => {
		return list;
	}

	getListOfSplittersNames = () => {
		const names = [];
		for(const item of list) {
			names.push(item.splitterName);
		}
		return names;
	}

	getCurrentSplitter = () => {
		if(this.currentSplitter === null)
			return getDefaultSplitter();
		return this.currentSplitter;
	}

	getSplitterFromName = (name: string) => {
		for(const item of list) {
			if(item.splitterName === name) {
				return item;
			}
		}
		return getDefaultSplitter();
	}

	findSplitter = (data: string) => {
		for(const item of list) {
			if(item.splitterName === GridSplitter.splitterName) continue;

			let isValid = false;
			item.doCheck(item.cleanData(data), (checked) => {
				if(checked) {
					isValid = true;
				}
			});
			if(isValid) {
				return item;
			}
		}

		return getDefaultSplitter();
	}

	loadSplitter = (splitter: Splitter) => {
		if(splitter === null)
			this.currentSplitter = getDefaultSplitter();
		else
			this.currentSplitter = splitter;
	}

	finishSplit = () => {
		if(this._storedSplitterOrder === null) return;
		APP.i.api.setStoredOrder(this._storedSplitterOrder);
		TypedObserver.storedOrderChanged.emit(this._storedSplitterOrder);
		this._storedSplitterOrder = null;
	}

	cleanData = (data: string) => {
		if(this.currentSplitter === null) {
			throw new Error("No splitter found");
		}

		return this.currentSplitter.cleanData(data);
	}

	splitData = (data:string, options:SplitterOptions, cb: (res: Rect[]) => void) => {
		if(this.currentSplitter === null) {
			throw new Error("No splitter found");
		}

		console.log(this.currentSplitter.splitterName, "is parsing data", data, options);

		data = this.cleanData(data);

		this.currentSplitter.options = options;
		this.currentSplitter.doSplit(data, (res) => {
			if(res === false)
				return cb([]);

			const order = [];
			for(const item of res) {
				order.push(item.name);
			}

			this._storedSplitterOrder = order;

			cb(res);
		});
	}
}