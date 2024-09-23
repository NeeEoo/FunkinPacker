import * as React from 'react';
import Storage from '../utils/Storage';
import { Observer, GLOBAL_EVENT } from '../Observer';
import I18 from '../locale/I18';
import { getExporterByType } from 'api/exporters';
import mustache from 'mustache';
import * as appInfo from '../../../package.json';
import TypedObserver from 'TypedObserver';

const {
	homepage: appHomepage
} = appInfo;

const STORAGE_CUSTOM_EXPORTER_KEY = "custom-exporter";

class EditCustomExporter extends React.Component {
	private readonly contentRef: React.RefObject<HTMLTextAreaElement> = React.createRef();
	private readonly allowTrimRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly allowRotationRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly fileExtRef: React.RefObject<HTMLInputElement> = React.createRef();

	constructor(props: any) {
		super(props);
	}

	close = () => {
		Observer.emit(GLOBAL_EVENT.HIDE_EDIT_CUSTOM_EXPORTER);
	}

	save = () => {
		let exporter = getExporterByType("custom");

		let content = (this.contentRef.current)?.value ?? "";
		let allowTrim = (this.allowTrimRef.current)?.checked ?? true;
		let allowRotation = (this.allowRotationRef.current)?.checked ?? false;
		let fileExt = (this.fileExtRef.current)?.value ?? ".custom";

		try {
			mustache.parse(content);

			exporter.content = content;
			exporter.allowTrim = allowTrim;
			exporter.allowRotation = allowRotation;
			exporter.fileExt = fileExt;

			Storage.save(STORAGE_CUSTOM_EXPORTER_KEY, exporter);

			Observer.emit(GLOBAL_EVENT.HIDE_EDIT_CUSTOM_EXPORTER);
		}
		catch(e: any) {
			TypedObserver.showMessage.emit(I18.f("EXPORTER_ERROR", e.message));
			console.error(e);
		}
	}

	override render() {
		let exporter = getExporterByType("custom");

		return (
			<div className="edit-custom-exporter-overlay">
				<div className="edit-custom-exporter-content">

					<div>
						<a href={appHomepage} className="color-800" target="_blank">{I18.f("DOCUMENTATION")}</a>
					</div>

					<div>
						<textarea ref={this.contentRef} className="edit-custom-exporter-data" defaultValue={exporter.content}></textarea>
					</div>

					<div>
						<b>{I18.f("ALLOW_TRIM")}</b>
						<input ref={this.allowTrimRef} className="border-color-gray" type="checkbox" defaultChecked={exporter.allowTrim}/>

						<b>{I18.f("ALLOW_ROTATION")}</b>
						<input ref={this.allowRotationRef} className="border-color-gray" type="checkbox" defaultChecked={exporter.allowRotation}/>

						<b>{I18.f("FILE_EXT")}</b>
						<input ref={this.fileExtRef} className="border-color-gray" type="text" defaultValue={exporter.fileExt}/>
					</div>

					<div className="edit-custom-exporter-controls">
						<div className="btn back-800 border-color-gray color-white" onClick={this.save}>{I18.f("SAVE")}</div>
						&nbsp;&nbsp;&nbsp;
						<div className="btn back-black border-color-gray color-white" onClick={this.close}>{I18.f("CANCEL")}</div>
					</div>

				</div>
			</div>
		);
	}
}

export default EditCustomExporter;