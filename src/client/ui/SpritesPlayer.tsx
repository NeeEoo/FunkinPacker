import * as React from 'react';
import I18 from '../locale/I18';
import { smartSortImages} from 'api/utils/common';
import type { PackResultsData } from 'types';
import type { Rect } from 'api/types';
import TypedObserver from 'TypedObserver';
import type { TextureBack } from './SheetSplitter';
import { GLOBAL_EVENT, Observer } from '../Observer';

interface Props {
	readonly start: boolean;
	readonly textureBack: TextureBack[number];
	readonly data: PackResultsData[];
}

type Texture = {
	readonly config: Rect,
	readonly baseTexture: HTMLCanvasElement
}

class SpritesPlayer extends React.Component<Props> {
	private readonly fpsRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly speedRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly bufferRef: React.RefObject<HTMLCanvasElement> = React.createRef();
	private readonly viewRef: React.RefObject<HTMLCanvasElement> = React.createRef();
	private readonly playerContainerRef: React.RefObject<HTMLDivElement> = React.createRef();
	private readonly containerRef: React.RefObject<HTMLDivElement> = React.createRef();
	private textures: Texture[];
	private currentTextures: Texture[];
	private currentFrame: number = 0;
	private width: number = 0;
	private height: number = 0;
	private selectedImages: string[];

	private updateTimer: NodeJS.Timeout | number | null = null;

	constructor(props: Props) {
		super(props);

		this.textures = [];
		this.currentTextures = [];
		this.selectedImages = [];
	}

	override componentDidMount = () => {
		TypedObserver.imagesListSelectedChanged.on(this.onImagesSelected, this);

		if(this.props.start) this.setup();
		else this.stop();
	}

	override componentWillUnmount = () => {
		this.stop();
	}

	onImagesSelected = (list: string[]) => {
		this.selectedImages = list;
		this.updateCurrentTextures();
	}

	override componentDidUpdate = () => {
		if(this.props.start) this.setup();
		else this.stop();
	}

	setup = () => {
		this.playerContainerRef.current.className = "player-view-container " + this.props.textureBack;

		this.textures = [];

		if(!this.props.data) return;

		this.width = 0;
		this.height = 0;

		for(const part of this.props.data) {
			const baseTexture = part.buffer;

			for (const config of part.data) {
				const {w, h} = SpritesPlayer.getFrameSize(config);

				//console.log(w, h, config, config.sourceSize);

				if (this.width < w) this.width = w;
				if (this.height < h) this.height = h;

				this.textures.push({
					config: config,
					baseTexture: baseTexture
				});
			}
		}

		if(this.width < 256) this.width = 256;
		if(this.height < 200) this.height = 200;

		const canvas = this.viewRef.current;
		canvas.width = this.width;
		canvas.height = this.height;

		this.updateCurrentTextures();
	}

	private static getFrameSize(config:Rect) {
		let w = config.sourceSize.mw;
		let h = config.sourceSize.mh;

		let width = config.frameSize.w;
		let height = config.frameSize.h;
		let x = config.frameSize.x;
		let y = config.frameSize.y;
		if(x < 0) {
			width -= x;
			x = 0;
		}
		if(y < 0) {
			height -= y;
			y = 0;
		}

		w = Math.max(width, w);
		h = Math.max(height, h);

		return {w, h};
	}

	eventForceUpdate = (e: KeyboardEvent) => {
		if(!e) return;

		if(e.code === "Enter" && e.ctrlKey) {
			this.updateCurrentTextures();
			e.preventDefault();
			return;
		}

		let key = e.keyCode || e.which;
		if(key === 13) {
			this.updateCurrentTextures();
			e.preventDefault();
		}
	}

	onSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		this.fpsRef.current.textContent = e.target.value + " fps";
	}

	updateCurrentTextures = () => {
		let textures:Texture[] = [];

		for(const tex of this.textures) {
			if(!tex.config.cloned && this.selectedImages.indexOf(tex.config.file) >= 0) {
				textures.push(tex);
			}

			if(tex.config.cloned && this.selectedImages.indexOf(tex.config.originalFile) >= 0) {
				textures.push(tex);
			}
		}

		textures = textures.sort((a, b) => {
			return smartSortImages(a.config.name, b.config.name);
		});

		this.currentTextures = textures;
		this.currentFrame = 0;
		this.update(true);
	}

	update = (skipFrameUpdate:boolean) => {
		if(this.updateTimer) clearTimeout(this.updateTimer);

		if(!skipFrameUpdate) {
			this.currentFrame++;
			if(this.currentFrame >= this.currentTextures.length) {
				this.currentFrame = 0;
			}
		}
		this.renderTexture();

		this.updateTimer = setTimeout(this.update, 1000 / +this.speedRef.current.value);
	}

	renderTexture = () => {
		const ctx = this.viewRef.current.getContext("2d");
		if(!ctx) {
			Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
			TypedObserver.showMessage.emit(I18.f('ERROR_NO_CONTEXT'));

			return;
		}

		ctx.clearRect(0, 0, this.width, this.height);

		const texture = this.currentTextures[this.currentFrame];
		if(!texture) return;

		// TODO: maybe make this draw directly to the canvas instead of to a buffer

		//console.log(texture.config);

		//let w = Math.max(texture.config.sourceSize.mw, texture.config.sourceSize.w);
		//let h = Math.max(texture.config.sourceSize.mh, texture.config.sourceSize.h);
		const {w, h} = SpritesPlayer.getFrameSize(texture.config);

		const buffer = this.bufferRef.current;
		buffer.width = w;
		buffer.height = h;

		const bufferCtx = buffer.getContext("2d");
		if(!bufferCtx) {
			Observer.emit(GLOBAL_EVENT.HIDE_PROCESSING);
			TypedObserver.showMessage.emit(I18.f('ERROR_NO_CONTEXT'));

			return;
		}
		bufferCtx.clearRect(0, 0, w, h);

		let frameX = texture.config.spriteSourceSize.x;
		let frameY = texture.config.spriteSourceSize.y;
		let frameW = texture.config.spriteSourceSize.w;
		let frameH = texture.config.spriteSourceSize.h;
		let frameOffsetX = 0;
		let frameOffsetY = 0;

		//if(texture.config.manualOffset) {
		frameX += texture.config.frameSize.x;
		frameY += texture.config.frameSize.y;
		//}

		if(frameX < 0) {
			frameW -= frameX;
			frameOffsetX -= frameX;
			frameX = 0;
		}
		if(frameY < 0) {
			frameH -= frameY;
			frameOffsetY -= frameY;
			frameY = 0;
		}

		if(texture.config.rotated) {
			bufferCtx.save();

			bufferCtx.translate(frameX + frameW/2, frameY + frameH/2);
			bufferCtx.rotate(-Math.PI/2);

			bufferCtx.drawImage(texture.baseTexture,
				texture.config.frame.x, texture.config.frame.y,
				texture.config.frame.h, texture.config.frame.w,
				-frameH/2, -frameW/2,
				texture.config.frame.h, texture.config.frame.w);

			bufferCtx.restore();
		}
		else {
			bufferCtx.drawImage(texture.baseTexture,
				texture.config.frame.x, texture.config.frame.y,
				texture.config.frame.w, texture.config.frame.h,
				frameX, frameY,
				texture.config.frame.w, texture.config.frame.h);
		}

		let x = this.width/2, y = this.height/2;
		x += frameOffsetX;
		y += frameOffsetY;

		ctx.drawImage(buffer,
			0, 0,
			w, h,
			x - w/2, y - h/2,
			w, h);
	}

	stop = () => {
		if(this.updateTimer) clearTimeout(this.updateTimer);
	}

	override render() {
		return (
			<div ref={this.containerRef} className="player-container">
				<div className="player-window border-color-gray">
					<div ref={this.playerContainerRef}>
						<canvas ref={this.viewRef}></canvas>
						<canvas ref={this.bufferRef} className="player-buffer"></canvas>
					</div>
					<div>
						<table>
							<tbody>
							<tr>
								<td>
									{I18.f("ANIMATION_SPEED")}
								</td>
								<td>
									<input type="range" ref={this.speedRef} max="60" min="1" defaultValue="24" onChange={this.onSpeedChange}/>
								</td>
								<td>
									<div ref={this.fpsRef} className="player-fps">24 fps</div>
								</td>
							</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		)
	}

}

export default SpritesPlayer;