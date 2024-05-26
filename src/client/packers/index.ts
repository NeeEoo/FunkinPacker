import MaxRectsPacker from "./MaxRectsPacker";
import MaxRectsBin from "./MaxRectsBin";
import OptimalPacker from "./OptimalPacker";
import { PackerClass } from "./Packer";

const list:PackerClass[] = [
	MaxRectsBin,
	MaxRectsPacker,
	OptimalPacker
];

function getPackerByType(name:string) {
	for(let item of list) {
		if(item.name === name) {
			return item;
		}
	}
	return null;
}

export { getPackerByType };
export default list;