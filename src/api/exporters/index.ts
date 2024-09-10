import * as appInfo from '../../../package.json';
import { smartSortImages, removeFromArray, cleanPrefix, getMaxSizesForSpriteSourceSize, getMaxSizesForSourceSize } from '../utils/common';
import finishExporter from './render';
import type { Rect, SplitterRect } from 'api/types';
import FunkinPackerApi from 'api/FunkinPackerApi';

import * as TemplateCocos2d from './templates/Cocos2d.mst';
import * as TemplateCss from './templates/Css.mst';
import * as TemplateEgret2D from './templates/Egret2D.mst';
import * as TemplateGodotAtlas from './templates/GodotAtlas.mst';
import * as TemplateGodotTileset from './templates/GodotTileset.mst';
import * as TemplateJsonArray from './templates/JsonArray.mst';
import * as TemplateJsonHash from './templates/JsonHash.mst';
import * as TemplateOldCss from './templates/OldCss.mst';
import * as TemplatePhaser3 from './templates/Phaser3.mst';
import * as TemplateSparrow from './templates/Sparrow.mst';
import * as TemplateSpine from './templates/Spine.mst';
import * as TemplateUIKit from './templates/UIKit.mst';
import * as TemplateUnity3D from './templates/Unity3D.mst';
import * as TemplateUnreal from './templates/Unreal.mst';
import * as TemplateXml from './templates/XML.mst';

export type Exporter = {
	exporterName: string;
	description: string;
	allowTrim: boolean;
	allowRotation: boolean;
	template: string;
	fileExt: string;
	content?: string;
};

export type TemplateSettings = {
	rects: ExporterRect[],
	config: RenderSettings,
	appInfo: typeof appInfo
};

type ExporterRect = Omit<SplitterRect, 'manualOffset'> & {
	origName: string;

	first: boolean;
	last: boolean;
};

export type RenderSettings = {
	imageName: string,
	imageFile: string,
	imageData: string,
	spritePadding: number,
	borderPadding: number,
	format: "RGBA8888" | "RGB888",
	textureFormat: 'png' | 'jpg',
	imageWidth: number,
	imageHeight: number,
	removeFileExtension: boolean,
	prependFolderName: boolean,
	base64Export: boolean,
	scale: number,
	changedScale: boolean,
	trimMode: string,

	sortExportedRows: boolean,

	base64Prefix?: string,
}

let list: Exporter[] = [
	{
		exporterName: "Sparrow",
		description: "Sparrow format",
		allowTrim: true,
		allowRotation: true,
		template: "Sparrow.mst",
		fileExt: "xml",
		content: TemplateSparrow.default
	},
	{
		exporterName: "JSON (hash)",
		description: "Json hash",
		allowTrim: true,
		allowRotation: true,
		template: "JsonHash.mst",
		fileExt: "json",
		content: TemplateJsonHash.default
	},
	{
		exporterName: "JSON (array)",
		description: "Json array",
		allowTrim: true,
		allowRotation: true,
		template: "JsonArray.mst",
		fileExt: "json",
		content: TemplateJsonArray.default
	},
	{
		exporterName: "XML",
		description: "Plain XML format",
		allowTrim: true,
		allowRotation: true,
		template: "XML.mst",
		fileExt: "xml",
		content: TemplateXml.default
	},
	{
		exporterName: "css (modern)",
		description: "css format",
		allowTrim: true,
		allowRotation: true,
		template: "Css.mst",
		fileExt: "css",
		content: TemplateCss.default
	},
	{
		exporterName: "css (old)",
		description: "old css format",
		allowTrim: false,
		allowRotation: false,
		template: "OldCss.mst",
		fileExt: "css",
		content: TemplateOldCss.default
	},
	{
		exporterName: "pixi.js",
		description: "pixi.js format",
		allowTrim: true,
		allowRotation: true,
		template: "JsonHash.mst",
		fileExt: "json",
		content: TemplateJsonHash.default
	},
	{
		exporterName: "Godot (atlas)",
		description: "Godot Atlas format",
		allowTrim: true,
		allowRotation: true,
		template: "GodotAtlas.mst",
		fileExt: "tpsheet",
		content: TemplateGodotAtlas.default
	},
	{
		exporterName: "Godot (tileset)",
		description: "Godot Tileset format",
		allowTrim: true,
		allowRotation: true,
		template: "GodotTileset.mst",
		fileExt: "tpset",
		content: TemplateGodotTileset.default
	},
	{
		exporterName: "Phaser (hash)",
		description: "Phaser (json hash)",
		allowTrim: true,
		allowRotation: true,
		template: "JsonHash.mst",
		fileExt: "json",
		content: TemplateJsonHash.default
	},
	{
		exporterName: "Phaser (array)",
		description: "Phaser (json array)",
		allowTrim: true,
		allowRotation: true,
		template: "JsonArray.mst",
		fileExt: "json",
		content: TemplateJsonArray.default
	},
	{
		exporterName: "Phaser 3",
		description: "Phaser 3",
		allowTrim: true,
		allowRotation: true,
		template: "Phaser3.mst",
		fileExt: "json",
		content: TemplatePhaser3.default
	},
	{
		exporterName: "Spine",
		description: "Spine atlas",
		allowTrim: true,
		allowRotation: true,
		template: "Spine.mst",
		fileExt: "atlas",
		content: TemplateSpine.default
	},
	{
		exporterName: "cocos2d",
		description: "cocos2d format",
		allowTrim: true,
		allowRotation: true,
		template: "Cocos2d.mst",
		fileExt: "plist",
		content: TemplateCocos2d.default
	},
	{
		exporterName: "UnrealEngine",
		description: "UnrealEngine - Paper2d",
		allowTrim: true,
		allowRotation: true,
		template: "Unreal.mst",
		fileExt: "paper2dsprites",
		content: TemplateUnreal.default
	},
	{
		exporterName: "UIKit",
		description: "UIKit sprite sheet",
		allowTrim: true,
		allowRotation: false,
		template: "UIKit.mst",
		fileExt: "plist",
		content: TemplateUIKit.default
	},
	{
		exporterName: "Unity3D",
		description: "Unity3D sprite sheet",
		allowTrim: true,
		allowRotation: false,
		template: "Unity3D.mst",
		fileExt: "tpsheet",
		content: TemplateUnity3D.default
	},
	{
		exporterName: "Egret2D",
		description: "Egret2D sprite sheet",
		allowTrim: false,
		allowRotation: false,
		template: "Egret2D.mst",
		fileExt: "json",
		content: TemplateEgret2D.default
	},
	{
		exporterName: "custom",
		description: "Custom format",
		allowTrim: true,
		allowRotation: true,
		template: "",
		fileExt: ""
	}
] as const;

function getExporterByType(type:string | undefined | null): Exporter | null {
	if(!type) return null;

	for(const item of list) {
		if(item.exporterName === type) {
			return item;
		}
	}
	return null;
}

function prepareData(data: Rect[], options: RenderSettings): {
	rects: ExporterRect[],
	config: RenderSettings
} {

	const opt = { ...options };

	opt.imageName ||= "texture";
	opt.imageFile ||= (opt.imageName + "." + options.textureFormat);
	opt.format ||= "RGBA8888";
	opt.scale ||= 1;
	opt.base64Prefix = options.textureFormat === "png" ? "data:image/png;base64," : "data:image/jpeg;base64,";

	const ret:ExporterRect[] = [];

	for(const item of data) {
		let name = item.originalFile || item.file;
		if(!name) continue;
		const origName = name;

		if(opt.removeFileExtension) {
			const parts = name.split(".");
			if(parts.length > 1) parts.pop();
			name = parts.join(".");
		}

		if(!opt.prependFolderName) {
			name = name.split("/").pop();
		}

		const frame = {
			x: item.frame.x,
			y: item.frame.y,
			w: item.frame.w,
			h: item.frame.h,
			hw: item.frame.w/2,
			hh: item.frame.h/2
		};
		const spriteSourceSize = {
			x: item.spriteSourceSize.x,
			y: item.spriteSourceSize.y,
			w: item.spriteSourceSize.w,
			h: item.spriteSourceSize.h
		};
		const sourceSize = {
			w: item.sourceSize.w,
			h: item.sourceSize.h,
			mw: item.sourceSize.mw,
			mh: item.sourceSize.mh
		};

		let trimmed = item.trimmed;

		if(item.trimmed && opt.trimMode === 'crop') {
			trimmed = false;
			spriteSourceSize.x = 0;
			spriteSourceSize.y = 0;
			sourceSize.w = spriteSourceSize.w;
			sourceSize.h = spriteSourceSize.h;
		}

		/*if(opt.scale !== 1) { // Maybe round if sparrow?
			frame.x *= opt.scale;
			frame.y *= opt.scale;
			frame.w *= opt.scale;
			frame.h *= opt.scale;
			frame.hw *= opt.scale;
			frame.hh *= opt.scale;

			spriteSourceSize.x *= opt.scale;
			spriteSourceSize.y *= opt.scale;
			spriteSourceSize.w *= opt.scale;
			spriteSourceSize.h *= opt.scale;

			sourceSize.w *= opt.scale;
			sourceSize.h *= opt.scale;
		}*/

		ret.push({
			name,
			origName,
			frame,
			spriteSourceSize,
			sourceSize,
			frameSize: item.frameSize,
			rotated: item.rotated,
			trimmed,
			first: false,
			last: false
		} as const);

	}

	if(ret.length) {
		ret[0].first = true;
		ret[ret.length-1].last = true;
	}

	return {rects: ret, config: opt};
}

function correctOrder(api:FunkinPackerApi, exporter: Exporter, rects:ExporterRect[], config:RenderSettings) {
	let storedOrder = api.getStoredOrder();
	if(storedOrder !== null) {
		storedOrder = [...storedOrder];
		/* if(config.removeFileExtension) {
			for(let i = 0; i < storedOrder.length; i++) {
				let name = storedOrder[i];
				let parts = name.split(".");
				if(parts.length > 1) parts.pop();
				storedOrder[i] = parts.join(".");
			}
		} */

		let oldRects:ExporterRect[] = [...rects];
		let nameMap:Record<string, ExporterRect> = {};
		for (const v of rects) {
			nameMap[v.origName] = v;
		}

		// filter for frames which exist
		let array = storedOrder.filter((v) => !!nameMap[v]).map(name => {
			const item = nameMap[name];
			removeFromArray(oldRects, item);
			return item;
		}) as ExporterRect[];
		rects = array.concat(oldRects);
	}

	return {rects, config};
}

function offsetFrames(api:FunkinPackerApi, exporter: Exporter, rects:ExporterRect[], config:RenderSettings) {
	for(const rect of rects) {
		//const frameAnim = cleanPrefix(rect.name);

		let frameX = rect.spriteSourceSize.x;
		let frameY = rect.spriteSourceSize.y;
		let frameW = rect.spriteSourceSize.w;
		let frameH = rect.spriteSourceSize.h;
		let frameOffsetX = 0;
		let frameOffsetY = 0;

		frameX += rect.frameSize.x;
		frameY += rect.frameSize.y;

		rect.spriteSourceSize.x = frameX + frameOffsetX;
		rect.spriteSourceSize.y = frameY + frameOffsetY;
	}

	const maxSizes = getMaxSizesForSourceSize(rects);

	for(const rect of rects) {
		const frameAnim = cleanPrefix(rect.name);

		rect.sourceSize.w = Math.max(rect.sourceSize.w, maxSizes[frameAnim].mw) + rect.spriteSourceSize.x;
		rect.sourceSize.h = Math.max(rect.sourceSize.h, maxSizes[frameAnim].mh) + rect.spriteSourceSize.y;
	}

	return {rects, config};
}

function startExporter(api:FunkinPackerApi, exporter: Exporter, data: Rect[], options: RenderSettings): Promise<string> {
	return new Promise((resolve, reject) => {
		let {rects, config} = prepareData(data, options);
		const renderOptions = {
			rects,
			config,
			appInfo
		};

		// Sort the exported rows
		if(config.sortExportedRows) {
			rects = rects.sort((a, b) => smartSortImages(a.name, b.name));
		}

		({ rects, config } = correctOrder(api, exporter, rects, config));
		({ rects, config } = offsetFrames(api, exporter, rects, config));

		//console.log(rects.map((v)=>v.name));

		//data = rects;
		renderOptions.rects = rects;

		if(exporter.content) {
			finishExporter(exporter, renderOptions, resolve, reject);
			return;
		}

		//sendGet("static/exporters/" + exporter.template, null, (template) => {
		//	exporter.content = template as string;
		//	finishExporter(exporter, renderOptions, resolve, reject);
		//}, () => reject(new Error(exporter.template + " not found")));
	});
}

export {getExporterByType, startExporter};
export default list;