import type { Rect } from 'api/types';
import Splitter from './Splitter';

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
			const json = JSON.parse(data);

			for(const item of json.frames) {
				item.name = Splitter.fixFileName(item.filename);
				res.push(item);
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