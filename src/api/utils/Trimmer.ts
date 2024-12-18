import type { Rect } from "api/types";

const cns = document.createElement("canvas");
const _ctx = cns.getContext("2d", {willReadFrequently: true});
if(!_ctx) {
	throw new Error("No canvas context");
}
const ctx = _ctx;

class Trimmer {
	private static getSpacing(data: Uint8ClampedArray, width: number, height: number, threshold: number) {
		const stride = width * 4;
		let left = width, top = height;
		let right = width, bottom = height;

		// Left Right
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < left; x++) {
				const alpha = data[(y * stride) + (x * 4) + 3];
				if (alpha > threshold) {
					if (x < left) left = x;
					break;
				}
			}
			for (let x = 0; x < right; x++) {
				const rx = width - x - 1;
				const alpha = data[(y * stride) + (rx * 4) + 3];
				if (alpha > threshold) {
					if (x < right) right = x;
					break;
				}
			}
		}

		// TODO: add a optimization here

		// Top Bottom
		for (let x = 0; x < width; x++) {
			for (let y = 0; y < top; y++) {
				const alpha = data[(y * stride) + (x * 4) + 3];
				if (alpha > threshold) {
					if (y < top) top = y;
					break;
				}
			}
			for (let y = 0; y < bottom; y++) {
				const ry = height - y - 1;
				const alpha = data[(ry * stride) + (x * 4) + 3];
				if (alpha > threshold) {
					if (y < bottom) bottom = y;
					break;
				}
			}
		}

		return { left, right, top, bottom };
	}

	static trim(rects:Rect[], threshold:number=0) {
		if(rects.length === 0) return;

		if(PROFILER)
			console.time("trim");
		for(const item of rects) {
			const img = item.image;
			if(!img) continue;

			let spaces = {left: 0, right: 0, top: 0, bottom: 0};

			const cached = img.cachedTrim !== undefined && img.cachedTrim === threshold;

			if(cached && img.cachedSpaces) {
				spaces = img.cachedSpaces;
			} else {
				cns.width = img.width;
				cns.height = img.height;
				console.log(cns.width, cns.height);
				console.log(img.width, img.height);

				//console.log(item.name, img.width, img.height);

				ctx.clearRect(0, 0, cns.width, cns.height);

				console.log("cleared");

				ctx.drawImage(img.image, 0, 0, img.width, img.height, 0, 0, img.width, img.height);

				console.log("drawn");

				const {data} = ctx.getImageData(0, 0, img.width, img.height);

				console.log("got data");

				spaces = this.getSpacing(data, img.width, img.height, threshold);

				console.log("got spacing", spaces);
			}

			if(spaces.left !== img.width) { // was able to trim it
				if(spaces.left > 0 || spaces.right > 0 || spaces.top > 0 || spaces.bottom > 0) {
					item.trimmed = true;
					item.spriteSourceSize.x = spaces.left;
					item.spriteSourceSize.y = spaces.top;
					//item.spriteSourceSize.w = img.width-spaces.right;
					//item.spriteSourceSize.h = img.height-spaces.bottom;
					item.spriteSourceSize.w = img.width - spaces.left - spaces.right;
					item.spriteSourceSize.h = img.height - spaces.top - spaces.bottom;
					//console.log(item.name, spaces);
				}
			} else { // wasn't able to trim it empty image
				item.trimmed = true;
				item.spriteSourceSize.x = 0;
				item.spriteSourceSize.y = 0;
				item.spriteSourceSize.w = 1;
				item.spriteSourceSize.h = 1;
			}

			item.trimmedImage = cached ? img.cachedTrimmedImage : ctx.getImageData(
				item.spriteSourceSize.x,
				item.spriteSourceSize.y,
				item.spriteSourceSize.w,
				item.spriteSourceSize.h
			).data;

			if(item.trimmed) {
				item.frame.w = item.spriteSourceSize.w;
				item.frame.h = item.spriteSourceSize.h;
			}

			img.cachedTrimmedImage = item.trimmedImage;
			img.cachedSpaces = spaces;
			img.cachedTrim = threshold;
		}
		if(PROFILER)
			console.timeEnd("trim");
	}
}

export default Trimmer;