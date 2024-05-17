import React from 'react';
import ReactDOM from 'react-dom';
import Storage from '../utils/Storage';
import { Observer, GLOBAL_EVENT } from '../Observer';
import I18 from '../utils/I18';
import { getExporterByType } from '../exporters';
import mustache from 'mustache';
import appInfo from '../../../package.json';

const STORAGE_CUSTOM_EXPORTER_KEY = "custom-exporter";

class EditCustomExporter extends React.Component {
	constructor(props) {
		super(props);

		this.contentRef = React.createRef();
		this.allowTrimRef = React.createRef();
		this.allowRotationRef = React.createRef();
		this.fileExtRef = React.createRef();
	}

	close = () => {
		Observer.emit(GLOBAL_EVENT.HIDE_EDIT_CUSTOM_EXPORTER);
	}

	save = () => {
		let exporter = getExporterByType("custom");

		let content = (this.contentRef.current).value;
		let allowTrim = (this.allowTrimRef.current).checked;
		let allowRotation = (this.allowRotationRef.current).checked;
		let fileExt = (this.fileExtRef.current).value;

		try {
			mustache.parse(content);

			exporter.content = content;
			exporter.allowTrim = allowTrim;
			exporter.allowRotation = allowRotation;
			exporter.fileExt = fileExt;

			Storage.save(STORAGE_CUSTOM_EXPORTER_KEY, exporter);

			Observer.emit(GLOBAL_EVENT.HIDE_EDIT_CUSTOM_EXPORTER);
		}
		catch(e) {
			Observer.emit(GLOBAL_EVENT.SHOW_MESSAGE, I18.f("EXPORTER_ERROR", e.message));
		}
	}

	render() {
		let exporter = getExporterByType("custom");

		return (
			<div className="edit-custom-exporter-cover">
				<div className="edit-custom-exporter-content">

					<div>
						<a href={appInfo.homepage} className="color-800" target="_blank">{I18.f("DOCUMENTATION")}</a>
					</div>

					<div>
						<textarea ref={this.contentRef} className="edit-custom-exporter-data" defaultValue={exporter.content}></textarea>
					</div>

					<div>
						<b>{I18.f("ALLOW_TRIM")}</b>
						<input ref={this.allowTrimRef} className="border-color-gray" type="checkbox" defaultChecked={exporter.allowTrim ? "checked" : ""}/>

						<b>{I18.f("ALLOW_ROTATION")}</b>
						<input ref={this.allowRotationRef} className="border-color-gray" type="checkbox" defaultChecked={exporter.allowRotation ? "checked" : ""}/>

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