import MaxRectsPacker from "./MaxRectsPacker";
import MaxRectsBin from "./MaxRectsBin";
import OptimalPacker from "./OptimalPacker";
import GrowingPacker from "./GrowingPacker";
import OrderedPacker from "./OrderedPacker";
import FixedOrderedPacker from "./FixedOrderedPacker";
import type { PackerClass } from "./Packer";

const list:PackerClass[] = [
	MaxRectsBin,
	MaxRectsPacker,
	GrowingPacker,
	OrderedPacker,
	FixedOrderedPacker,
	OptimalPacker
] as const;

function getPackerByType(name:string | undefined | null):PackerClass {
	if(!name) return OptimalPacker;

	for(const item of list) {
		if(item.packerName === name) {
			return item;
		}
	}
	return OptimalPacker;
}

export { getPackerByType };
export default list;