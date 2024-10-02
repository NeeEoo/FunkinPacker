import type { Rect } from 'api/types';
import Splitter from './Splitter';

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
			const json = JSON.parse(data);

			const names = Object.keys(json.frames);

			for(const name of names) {
				const item = json.frames[name];

				item.name = Splitter.fixFileName(name);
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
		return 'JSON (hash)';
	}
}

export default JsonHash;