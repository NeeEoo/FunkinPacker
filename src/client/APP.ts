import { Observer, GLOBAL_EVENT } from './Observer';
import TextureRenderer from './utils/TextureRenderer';
import { getFilterByType } from './filters';
import I18 from './locale/I18';
import type { RenderSettings } from 'api/exporters';
import { startExporter } from 'api/exporters';
import Downloader from 'platform/Downloader';
import type { FileData, MessageBoxData, PackResultsData } from 'types';
import TypedObserver from 'TypedObserver';
import type { PackerCombo } from 'api/packers/Packer';
import type { LoadedImages, PackOptions, Rect } from 'api/types';
import ErrorHandler from './ErrorHandler';
import FunkinPackerApi from 'api/FunkinPackerApi';

let INSTANCE:APP;

class APP {
	images: LoadedImages;
	packOptions: PackOptions;
	packResult: PackResultsData[] | null;

	api: FunkinPackerApi;

	constructor() {
		INSTANCE = this;

		this.images = {};
		this.packOptions = {};
		this.packResult = null;

		this.api = new FunkinPackerApi();

		TypedObserver.imagesListChanged.on(this.onImagesListChanged, this);
		TypedObserver.packOptionsChanged.on(this.onPackOptionsChanged, this);
		TypedObserver.packExporterChanged.on(this.onPackExporterOptionsChanged, this);
		Observer.on(GLOBAL_EVENT.START_EXPORT, this.startExport, this);
	}

	static get i() {
		return INSTANCE;
	}

	private onImagesListChanged = (data: LoadedImages) => {
		this.images = data;
		//console.log(this.images);
		this.pack();
	}

	private onPackOptionsChanged = (data: PackOptions) => {
		this.packOptions = data;
		this.pack();
	}

	private onPackExporterOptionsChanged = (data: PackOptions) => {
		this.packOptions = data;
	}

	private pack() {
		const keys = Object.keys(this.images);

		if (keys.length > 0) {
			Observer.emit(GLOBAL_EVENT.SHOW_PROCESSING);
			setTimeout(() => this.doPack(), 0);
		}
		else {
			this.doPack();
		}
	}

	private doPack() {
		try {
			this.api.loadImages(this.images);
			this.api.setOptions(this.packOptions);
			const {result, usedPacker} = this.api.pack();
			this.onPackComplete(result, usedPacker);
		}
		catch (e:any) {
			this.onPackError({
				description: ErrorHandler.translateError(e)
			});
			console.error(e);
		}
	}

	private onPackComplete = (res:Rect[][], usedPacker:PackerCombo) => {
		this.packResult = [];

		for (const data of res) {
			const renderer = new TextureRenderer(data, this.packOptions);

			this.packResult.push({
				data,
				buffer: renderer.buffer,
				renderer
			});
		}

		TypedObserver.packComplete.emit({
			packResults: this.packResult,
			usedPacker: usedPacker
		});
		Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
	}

	private onPackError = (err: MessageBoxData) => {
		Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
		TypedObserver.showMessage.emit(err.description);
	}

	private startExport() {
		if (!this.packResult || !this.packResult.length) {
			TypedObserver.showMessage.emit(I18.f("NO_IMAGES_ERROR"));
			return;
		}

		Observer.emit(GLOBAL_EVENT.SHOW_PROCESSING);
		setTimeout(() => this.doExport(), 0);
	}

	private async doExport() {
		const exporter = this.packOptions.exporterCls;
		const fileName = this.packOptions.fileName;
		const filterClass = getFilterByType(this.packOptions.filter);
		// eslint-disable-next-line new-cap
		const filter = new filterClass();

		const files:FileData[] = [];

		const textureFormat = this.packOptions.textureFormat ?? "png";
		//TODO: move to options
		const pixelFormat = textureFormat === "png" ? "RGBA8888" : "RGB888";

		let ix = 0;
		for (const item of this.packResult) {

			const fName = fileName + (this.packResult.length > 1 ? "-" + ix : "");

			//const buffer = item.renderer.scale(this.packOptions.scale);

			const buffer = item.renderer.getBuffer();

			let imageData = filter.apply(buffer).toDataURL(textureFormat === "png" ? "image/png" : "image/jpeg");
			const parts = imageData.split(",");
			parts.shift();
			imageData = parts.join(",");


			files.push({
				name: `${fName}.${textureFormat}`,
				content: imageData,
				base64: true
			});

			const options:RenderSettings = {
				imageName: `${fName}`,
				imageFile: `${fName}.${textureFormat}`,
				imageData,
				spritePadding: this.packOptions.spritePadding ?? 3,
				borderPadding: this.packOptions.borderPadding ?? 1,
				format: pixelFormat,
				textureFormat: textureFormat,
				imageWidth: buffer.width,
				imageHeight: buffer.height,
				removeFileExtension: this.packOptions.removeFileExtension ?? true,
				prependFolderName: this.packOptions.prependFolderName ?? true,
				base64Export: this.packOptions.base64Export ?? false,
				scale: this.packOptions.scale ?? 1,
				changedScale: this.packOptions.scale !== 1,
				trimMode: this.packOptions.trimMode ?? "trim",

				sortExportedRows: this.packOptions.sortExportedRows ?? true,
			};

			try {
				files.push({
					name: fName + "." + exporter.fileExt,
					content: await startExporter(this.api, exporter, item.data, options),
					base64: false
				});
			}
			catch (e) {
				Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
				TypedObserver.showMessage.emit(I18.f("EXPORTER_ERROR", e.toString()));
				console.error(e);
				return;
			}

			ix++;
		}

		Downloader.run(files, this.packOptions.fileName, this.packOptions.savePath);
		Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
	}
}

export default APP;