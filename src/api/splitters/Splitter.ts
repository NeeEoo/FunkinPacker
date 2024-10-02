import type { Rect } from 'api/types';

export type SplitterOptions = {
	textureWidth: number,
	textureHeight: number,
	width: number,
	height: number,
	padding: number
}

class Splitter {
	public options: SplitterOptions;

	doCheck(_data: string, cb: (checked: boolean) => void) {
		throw new Error('doCheck not implemented');
	}

	doSplit(_data: string, cb: (res: Rect[] | false) => void) {
		throw new Error('doSplit not implemented');
	}

	cleanData(_data: string) {
		if(!_data) {
			return _data;
		}
		// UTF8 BOM
		return (_data.startsWith("ï»¿")) ? _data.slice(3) : _data;
	}

	get splitterName() {
		return '!! Default !!';
	}

	static fixFileName(name: string) {
		const validExts = ['png', 'jpg', 'jpeg'];
		const ext = name.split('.').pop().toLowerCase();

		if(validExts.indexOf(ext) < 0) name += '.png';

		return name;
	}

	get inverseRotation() {
		return false;
	}
}

export default Splitter;