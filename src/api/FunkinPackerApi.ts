import type { LoadedImages, PackOptions } from "api/types";
import TypedObserver from "api/TypedObserver";
import packerList from "./packers";
import PackProcessor from "./PackProcessor";
import { ApiError, ErrorCodes } from "./Errors";

export default class FunkinPackerApi {
	private images: LoadedImages;
	private options: PackOptions;
	private onComplete: (res:unknown) => void;
	private onError: (err:string) => void;

	private storedOrder: string[] | null = null;

	constructor() {
		this.options = {};
		this.onComplete = () => {};
		this.onError = () => {};
	}

	public hasStoredOrder = () => {
		return this.storedOrder && this.storedOrder.length > 0;
	}

	public clearOrder = () => {
		this.storedOrder = null;
	}

	public reset = () => {
		this.images = null;
		this.options = {};
		this.storedOrder = null;
		this.onComplete = () => {};
		this.onError = () => {};
	}

	public setStoredOrderObserver: TypedObserver<string[]> = new TypedObserver();
	public setStoredOrder(order:string[]) {
		this.storedOrder = order;
		this.setStoredOrderObserver.emit(order);
	}

	public getStoredOrder = () => {
		return this.storedOrder;
	}

	public setLoadedImagesObserver: TypedObserver<LoadedImages> = new TypedObserver();
	public loadImages(images:LoadedImages) {
		this.images = images;
		this.setLoadedImagesObserver.emit(images);
	}

	public setOptionsObserver: TypedObserver<PackOptions> = new TypedObserver();
	public setOptions(options:PackOptions) {
		this.options = options;
		this.setOptionsObserver.emit(options);
	}

	public setOnComplete(onComplete:(res:unknown) => void) {
		this.onComplete = onComplete;
	}

	public setOnError(onError:(err:string) => void) {
		this.onError = onError;
	}

	public static getAllPackers = () => {
		return packerList;
	}

	private _packProcessor: PackProcessor;

	public pack() {
		if(!this._packProcessor) {
			this._packProcessor = new PackProcessor(this);
		}
		if(!this.images) {
			throw new ApiError(ErrorCodes.NO_IMAGES_ERROR);
		}
		return this._packProcessor.pack(this.images, this.options);
	}
}