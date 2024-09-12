import * as React from 'react';

import Storage from '../utils/Storage';

import exporters from 'api/exporters';
import { getExporterByType } from 'api/exporters';
import packers from 'api/packers';
import { getPackerByType } from 'api/packers';
import filters from '../filters';
import { getFilterByType } from '../filters';

import I18 from '../locale/I18';

import { Observer, GLOBAL_EVENT } from '../Observer';
import type { PackOptions } from 'api/types';
import TypedObserver from 'TypedObserver';
import APP from 'client/APP';

//import FileSystem from 'platform/FileSystem';

const STORAGE_OPTIONS_KEY = "pack-options";
const STORAGE_CUSTOM_EXPORTER_KEY = "custom-exporter";

let INSTANCE:PackProperties = null;

interface Props {}

interface State {
	packer: string;
	hasStoredOrder: boolean;
}

class PackProperties extends React.Component<Props, State> {
	packOptions: PackOptions;
	private readonly fileNameRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly textureFormatRef: React.RefObject<HTMLSelectElement> = React.createRef();
	private readonly removeFileExtensionRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly prependFolderNameRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly scaleRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly filterRef: React.RefObject<HTMLSelectElement> = React.createRef();
	private readonly exporterRef: React.RefObject<HTMLSelectElement> = React.createRef();
	private readonly editCustomFormatRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly widthRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly heightRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly spritePaddingRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly borderPaddingRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly allowRotationRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly allowTrimRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly detectIdenticalRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly packerRef: React.RefObject<HTMLSelectElement> = React.createRef();
	private readonly packerMethodRef: React.RefObject<PackerMethods> = React.createRef();
	private readonly sortExportedRowsRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly fixedSizeRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly powerOfTwoRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly trimModeRef: React.RefObject<HTMLSelectElement> = React.createRef();
	private readonly alphaThresholdRef: React.RefObject<HTMLInputElement> = React.createRef();
	private readonly statsSIRef: React.RefObject<HTMLInputElement> = React.createRef();

	constructor(props: Props) {
		super(props);

		INSTANCE = this;

		this.packOptions = this.loadOptions();
		this.loadCustomExporter();

		this.state = {
			packer: this.packOptions.packer,
			hasStoredOrder: APP.i.api.hasStoredOrder()
		};
	}

	override componentDidMount = () => {
		TypedObserver.storedOrderChanged.on(this.onStoredOrderChanged, this);

		this.updateEditCustomTemplateButton();
		this.emitChanges();
	}

	override componentWillUnmount = () => {
		TypedObserver.storedOrderChanged.off(this.onStoredOrderChanged, this);
	}

	static get i() {
		return INSTANCE;
	}

	setOptions = (data: PackOptions) => {
		this.packOptions = this.applyOptionsDefaults(data);
		this.saveOptions();
		this.refreshPackOptions();
		this.emitChanges();
	}

	loadCustomExporter = () => {
		// WARNING: todo: type this
		let data = Storage.load(STORAGE_CUSTOM_EXPORTER_KEY);
		if(data) {
			let exporter = getExporterByType("custom");
			exporter.allowTrim = data.allowTrim;
			exporter.allowRotation = data.allowRotation;
			exporter.fileExt = data.fileExt;
			exporter.content = data.content;
		}
	}

	loadOptions = () => {
		return this.applyOptionsDefaults(Storage.load(STORAGE_OPTIONS_KEY));
	}

	applyOptionsDefaults = (data: PackOptions) => {
		if(!data) data = {};

		data.fileName = data.fileName || "texture";
		data.textureFormat = data.textureFormat || "png";
		data.removeFileExtension = data.removeFileExtension === undefined ? true : data.removeFileExtension;
		data.prependFolderName = data.prependFolderName === undefined ? true : data.prependFolderName;
		data.scale = data.scale || 1;
		data.filter = getFilterByType(data.filter) ? data.filter : filters[0].type;
		data.exporter = getExporterByType(data.exporter) ? data.exporter : exporters[0].exporterName;
		data.base64Export = false;//data.base64Export === undefined ? false : data.base64Export;
		//data.savePath = data.savePath || "";
		data.width = data.width === undefined ? 8192 : data.width;
		data.height = data.height === undefined ? 8192 : data.height;
		data.fixedSize = data.fixedSize === undefined ? false : data.fixedSize;
		data.powerOfTwo = data.powerOfTwo === undefined ? false : data.powerOfTwo;
		data.spritePadding = data.spritePadding === undefined ? 3 : data.spritePadding;
		data.borderPadding = data.borderPadding === undefined ? 1 : data.borderPadding;
		data.allowRotation = data.allowRotation === undefined ? false : data.allowRotation;
		data.allowTrim = data.allowTrim === undefined ? true : data.allowTrim;
		data.trimMode = data.trimMode === undefined ? "trim" : data.trimMode;
		data.alphaThreshold = data.alphaThreshold || 0;
		data.detectIdentical = data.detectIdentical === undefined ? true : data.detectIdentical;
		data.sortExportedRows = data.sortExportedRows === undefined ? true : data.sortExportedRows;
		data.repackUpdateFileName = data.repackUpdateFileName === undefined ? true : data.repackUpdateFileName;
		data.statsSI = data.statsSI === undefined ? 1024 : data.statsSI;
		var optimalPacker = getPackerByType("OptimalPacker");
		data.packer = getPackerByType(data.packer) ? data.packer : optimalPacker.packerName;
		data.packerMethod = data.packerMethod || optimalPacker.defaultMethod;

		let methodValid = false;
		let packer = getPackerByType(data.packer);
		if(packer) {
			let packerMethods = Object.keys(packer.methods);
			for(let method of packerMethods) {
				if(method === data.packerMethod) {
					methodValid = true;
					break;
				}
			}

			if(!methodValid) data.packerMethod = packer.defaultMethod;

			if(this.packerMethodRef?.current) {
				this.packerMethodRef.current.setValue(data.packerMethod);
			}
		}

		return data;
	}

	saveOptions = (force=false) => {
		if(PLATFORM === "web" || force) {
			Storage.save(STORAGE_OPTIONS_KEY, this.packOptions);
		}
	}

	updatePackOptions = () => {
		let data:PackOptions = {};

		data.textureFormat = (this.textureFormatRef.current).value as "png" | "jpg";
		data.removeFileExtension = (this.removeFileExtensionRef.current).checked;
		data.prependFolderName = (this.prependFolderNameRef.current).checked;
		//data.base64Export = (this.base64ExportRef.current).checked;
		data.scale = Number((this.scaleRef.current).value);
		data.filter = (this.filterRef.current).value;
		data.exporter = (this.exporterRef.current).value;
		data.fileName = (this.fileNameRef.current).value;
		//data.savePath = (this.savePathRef.current).value;
		data.width = Number((this.widthRef.current).value) || 0;
		data.height = Number((this.heightRef.current).value) || 0;
		data.fixedSize = (this.fixedSizeRef.current).checked;
		data.powerOfTwo = (this.powerOfTwoRef.current).checked;
		data.spritePadding = Number((this.spritePaddingRef.current).value) || 0;
		data.borderPadding = Number((this.borderPaddingRef.current).value) || 0;
		data.allowRotation = (this.allowRotationRef.current).checked;
		data.allowTrim = (this.allowTrimRef.current).checked;
		data.trimMode = (this.trimModeRef.current).value as "trim" | "crop";
		data.alphaThreshold = +(this.alphaThresholdRef.current).value;
		data.detectIdentical = (this.detectIdenticalRef.current).checked;
		data.sortExportedRows = (this.sortExportedRowsRef.current).checked;
		data.statsSI = Number((this.statsSIRef.current).value);
		data.packer = (this.packerRef.current).value;
		data.packerMethod = (this.packerMethodRef.current).value;

		this.packOptions = this.applyOptionsDefaults(data);

		TypedObserver.siUnitsChanged.emit(this.packOptions.statsSI);
	}

	refreshPackOptions = () => {
		(this.textureFormatRef.current).value = this.packOptions.textureFormat;
		(this.removeFileExtensionRef.current).checked = this.packOptions.removeFileExtension;
		(this.prependFolderNameRef.current).checked = this.packOptions.prependFolderName;
		//(this.base64ExportRef.current).checked = this.packOptions.base64Export;
		(this.scaleRef.current).value = Number(this.packOptions.scale).toString();
		(this.filterRef.current).value = this.packOptions.filter;
		(this.exporterRef.current).value = this.packOptions.exporter;
		(this.fileNameRef.current).value = this.packOptions.fileName;
		//(this.savePathRef.current).value = this.packOptions.savePath;
		(this.widthRef.current).value = (Number(this.packOptions.width) || 0).toString();
		(this.heightRef.current).value = (Number(this.packOptions.height) || 0).toString();
		(this.fixedSizeRef.current).checked = this.packOptions.fixedSize;
		(this.powerOfTwoRef.current).checked = this.packOptions.powerOfTwo;
		(this.spritePaddingRef.current).value = (Number(this.packOptions.spritePadding) || 0).toString();
		(this.borderPaddingRef.current).value = (Number(this.packOptions.borderPadding) || 0).toString();
		(this.allowRotationRef.current).checked = this.packOptions.allowRotation;
		(this.allowTrimRef.current).checked = this.packOptions.allowTrim;
		(this.trimModeRef.current).value = this.packOptions.trimMode;
		(this.alphaThresholdRef.current).value = (this.packOptions.alphaThreshold || 0).toString();
		(this.detectIdenticalRef.current).checked = this.packOptions.detectIdentical;
		(this.sortExportedRowsRef.current).checked = this.packOptions.sortExportedRows;
		(this.statsSIRef.current).value = this.packOptions.statsSI.toString();
		(this.packerRef.current).value = this.packOptions.packer;
		(this.packerMethodRef.current).value = this.packOptions.packerMethod;
	}

	getPackOptions = () => {
		let data = Object.assign({}, this.packOptions);
		data.exporterCls = getExporterByType(data.exporter);
		data.packerCls = getPackerByType(data.packer);
		return data;
	}

	emitChanges = () => {
		TypedObserver.packOptionsChanged.emit(this.getPackOptions());
		TypedObserver.siUnitsChanged.emit(this.packOptions.statsSI);
	}

	onPackerChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
		this.setState({packer: e.target.value});
		this.onPropChanged();
	}

	onPropChanged = () => {
		this.updatePackOptions();
		this.saveOptions();

		this.emitChanges();
	}

	onExporterChanged = () => {
		let exporter = getExporterByType((this.exporterRef.current).value);
		let allowTrimInput = this.allowTrimRef.current;
		let allowRotationInput = this.allowRotationRef.current;

		let doRefresh = (allowTrimInput.checked !== exporter.allowTrim) ||
						(allowRotationInput.checked !== exporter.allowRotation);

		allowTrimInput.checked = exporter.allowTrim;
		allowRotationInput.checked = exporter.allowRotation;

		this.updateEditCustomTemplateButton();

		this.onExporterPropChanged();
		if(doRefresh) this.onPropChanged();
	}

	updateEditCustomTemplateButton = () => {
		let exporter = getExporterByType(this.exporterRef.current.value);
		(this.editCustomFormatRef.current).style.visibility = exporter.exporterName === "custom" ? "visible" : "hidden";
	}

	onExporterPropChanged = () => {
		this.updatePackOptions();
		this.saveOptions();

		TypedObserver.packExporterChanged.emit(this.getPackOptions());
	}
	eventForceUpdate = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
		if(!e) return;

		if(e.code === "Enter" && e.ctrlKey) {
			this.onPropChanged();
			return;
		}

		let key = e.keyCode || e.which;
		if(key === 13) {
			this.onPropChanged();
		}
	}

	eventForceUpdateExporter = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
		if(!e) return;

		if(e.code === "Enter" && e.ctrlKey) {
			this.onExporterPropChanged();
			return;
		}

		let key = e.keyCode || e.which;
		if(key === 13) {
			this.onExporterPropChanged();
		}
	}

	startExport = () => {
		Observer.emit(GLOBAL_EVENT.START_EXPORT);
	}

	editCustomExporter = () => {
		Observer.emit(GLOBAL_EVENT.SHOW_EDIT_CUSTOM_EXPORTER);
	}

	/*selectSavePath = () => {
		let dir = FileSystem.selectFolder();
		if(dir) {
			(this.savePathRef.current).value = dir;
			this.onExporterPropChanged();
		}
	}*/

	onStoredOrderChanged = (order: string[]) => {
		this.setState({hasStoredOrder: order !== null && order.length > 0});
	}

	override render() {
		let exporter = getExporterByType(this.packOptions.exporter);
		if(!exporter) return <span>Failed to load exporter, please reload the page, if issue persists, report it to the developer. Data: {JSON.stringify(this.packOptions)}</span>;
		let allowRotation = this.packOptions.allowRotation && exporter.allowRotation;
		let exporterRotationDisabled = !exporter.allowRotation;
		let allowTrim = this.packOptions.allowTrim && exporter.allowTrim;
		let exporterTrimDisabled = !exporter.allowTrim;

		return (
			<div className="props-list back-white">
				<div className="pack-properties-containter">
					<table>
						<tbody>
							<tr>
								<td colSpan={3} className="center-align">
									Export Options
								</td>
							</tr>
							<tr title={I18.f("FILE_NAME_TITLE")} style={{display: PLATFORM === 'web' ? '' : 'none'}}>
								<td>{I18.f("FILE_NAME")}</td>
								<td><input ref={this.fileNameRef} className="border-color-gray" type="text" defaultValue={this.packOptions.fileName} onBlur={this.onExporterPropChanged} /></td>
								<td></td>
							</tr>
							<tr title={I18.f("TEXTURE_FORMAT_TITLE")}>
								<td>{I18.f("TEXTURE_FORMAT")}</td>
								<td>
									<select ref={this.textureFormatRef} className="border-color-gray" defaultValue={this.packOptions.textureFormat} onChange={this.onExporterChanged}>
										<option value="png">png</option>
										<option value="jpg">jpg</option>
									</select>
								</td>
								<td></td>
							</tr>
							<tr title={I18.f("REMOVE_FILE_EXT_TITLE")}>
								<td>{I18.f("REMOVE_FILE_EXT")}</td>
								<td><input ref={this.removeFileExtensionRef} className="border-color-gray" type="checkbox" defaultChecked={this.packOptions.removeFileExtension} onChange={this.onExporterPropChanged} /></td>
								<td></td>
							</tr>
							<tr title={I18.f("PREPEND_FOLDER_TITLE")}>
								<td>{I18.f("PREPEND_FOLDER")}</td>
								<td><input ref={this.prependFolderNameRef} className="border-color-gray" type="checkbox" defaultChecked={this.packOptions.prependFolderName} onChange={this.onExporterPropChanged} /></td>
								<td></td>
							</tr>
							{/* <tr title={I18.f("BASE64_EXPORT_TITLE")}>
								<td>{I18.f("BASE64_EXPORT")}</td>
								<td><input ref={this.base64ExportRef} className="border-color-gray" type="checkbox" defaultChecked={this.packOptions.base64Export} onChange={this.onExporterPropChanged} /></td>
								<td></td>
							</tr> */}
							<tr title={I18.f("FORMAT_TITLE")}>
								<td>{I18.f("FORMAT")}</td>
								<td>
									<select ref={this.exporterRef} className="border-color-gray" onChange={this.onExporterChanged} defaultValue={this.packOptions.exporter}>
									{exporters.map(node => {
										return (<option key={"exporter-" + node.exporterName} defaultValue={node.exporterName}>{node.exporterName}</option>)
									})}
									</select>
								</td>
								<td>
									<div className="edit-btn back-800" ref={this.editCustomFormatRef} onClick={this.editCustomExporter}></div>
								</td>
							</tr>
							{/*  <tr title={I18.f("SAVE_PATH_TITLE")} style={{display: PLATFORM === 'electron' ? '' : 'none'}}>
								<td>{I18.f("SAVE_PATH")}</td>
								<td><input ref={this.savePathRef} className="border-color-gray" type="text" defaultValue={this.packOptions.savePath} onBlur={this.onExporterPropChanged} /></td>
								<td>
									<div className="folder-btn back-800" onClick={this.selectSavePath}></div>
								</td>
							</tr> */}
							<tr>
								<td colSpan={3} className="center-align">
									<div className="btn back-800 border-color-gray color-white" onClick={this.startExport}>{I18.f("EXPORT")}</div>
								</td>
							</tr>
							<tr>
								<td colSpan={3} className="center-align">
									Pack Options
								</td>
							</tr>

							<tr title={I18.f("WIDTH_TITLE")}>
								<td>{I18.f("WIDTH")}</td>
								<td><input ref={this.widthRef} type="number" min="0" className="border-color-gray" defaultValue={this.packOptions.width} onBlur={this.onPropChanged} onKeyDown={this.eventForceUpdate}/></td>
								<td></td>
							</tr>
							<tr title={I18.f("HEIGHT_TITLE")}>
								<td>{I18.f("HEIGHT")}</td>
								<td><input ref={this.heightRef} type="number" min="0" className="border-color-gray" defaultValue={this.packOptions.height} onBlur={this.onPropChanged} onKeyDown={this.eventForceUpdate}/></td>
								<td></td>
							</tr>
							<tr title={I18.f("PADDING_TITLE")}>
								<td>{I18.f("PADDING")}</td>
								<td><input ref={this.spritePaddingRef} type="number" className="border-color-gray" defaultValue={this.packOptions.spritePadding} min="0" onInput={this.onPropChanged} onKeyDown={this.eventForceUpdate}/></td>
								<td></td>
							</tr>
							<tr title={I18.f("EXTRUDE_TITLE")}>
								<td>{I18.f("EXTRUDE")}</td>
								<td><input ref={this.borderPaddingRef} type="number" className="border-color-gray" defaultValue={this.packOptions.borderPadding} min="0" onInput={this.onPropChanged} onKeyDown={this.eventForceUpdate}/></td>
								<td></td>
							</tr>
							<tr title={I18.f("ALLOW_ROTATION_TITLE")}>
								<td>{I18.f("ALLOW_ROTATION")}</td>
								<td><input ref={this.allowRotationRef} type="checkbox" className="border-color-gray" onChange={this.onPropChanged} defaultChecked={allowRotation} disabled={exporterRotationDisabled} /></td>
								<td></td>
							</tr>
							<tr title={I18.f("ALLOW_TRIM_TITLE")}>
								<td>{I18.f("ALLOW_TRIM")}</td>
								<td><input ref={this.allowTrimRef} type="checkbox" className="border-color-gray" onChange={this.onPropChanged} defaultChecked={allowTrim}  disabled={exporterTrimDisabled} /></td>
								<td></td>
							</tr>
							<tr title={I18.f("DETECT_IDENTICAL_TITLE")}>
								<td>{I18.f("DETECT_IDENTICAL")}</td>
								<td><input ref={this.detectIdenticalRef} type="checkbox" className="border-color-gray" onChange={this.onPropChanged} defaultChecked={this.packOptions.detectIdentical}/></td>
								<td></td>
							</tr>
							<tr title={I18.f("PACKER_TITLE")}>
								<td>{I18.f("PACKER")}</td>
								<td>
									<select ref={this.packerRef} className="border-color-gray" onChange={this.onPackerChange} defaultValue={this.packOptions.packer}>
									{packers.map(node => {
										return (<option key={"packer-" + node.packerName} defaultValue={node.packerName}>{node.packerName}</option>)
									})}
									</select>
								</td>
								<td></td>
							</tr>
							<tr title={I18.f("PACKER_METHOD_TITLE")}>
								<td>{I18.f("PACKER_METHOD")}</td>
								<td><PackerMethods ref={this.packerMethodRef} packer={this.state.packer} defaultMethod={this.packOptions.packerMethod} handler={this.onPropChanged}/></td>
								<td></td>
							</tr>
							<tr title={I18.f("SCALE_TITLE")}>
								<td>{I18.f("SCALE")}</td>
								<td><input ref={this.scaleRef} type="number" min="0" className="border-color-gray" defaultValue={this.packOptions.scale} onBlur={this.onPropChanged}/></td>
								<td></td>
							</tr>
							<tr>
								<td colSpan={3} className="center-align">
									Advanced
								</td>
							</tr>

							<tr title={I18.f("CLEAR_STORED_ORDER_TITLE")}>
								<td colSpan={3} className="center-align">
									{
										this.state.hasStoredOrder ?
											<div className="btn back-800 border-color-gray color-white" onClick={APP.i.api.clearOrder}>{I18.f("CLEAR_STORED_ORDER")}</div> :
											<></>
										//<div className="btn back-400 border-color-gray color-white">{I18.f("CLEAR_STORED_ORDER")}</div>
									}
								</td>
							</tr>

							<tr title={I18.f("SORT_EXPORT_TITLE")}>
								<td>{I18.f("SORT_EXPORT")}</td>
								<td><input ref={this.sortExportedRowsRef} type="checkbox" className="border-color-gray" onChange={this.onExporterChanged} defaultChecked={this.packOptions.sortExportedRows} /></td>
								<td></td>
							</tr>

							<tr title={I18.f("FIXED_SIZE_TITLE")}>
								<td>{I18.f("FIXED_SIZE")}</td>
								<td><input ref={this.fixedSizeRef} type="checkbox" className="border-color-gray" onChange={this.onPropChanged} defaultChecked={this.packOptions.fixedSize} /></td>
								<td></td>
							</tr>
							<tr title={I18.f("POWER_OF_TWO_TITLE")}>
								<td>{I18.f("POWER_OF_TWO")}</td>
								<td><input ref={this.powerOfTwoRef} type="checkbox" className="border-color-gray" onChange={this.onPropChanged} defaultChecked={this.packOptions.powerOfTwo} /></td>
								<td></td>
							</tr>
							<tr title={I18.f("TRIM_MODE_TITLE")}>
								<td>{I18.f("TRIM_MODE")}</td>
								<td>
									<select ref={this.trimModeRef} className="border-color-gray" onChange={this.onPropChanged} defaultValue={this.packOptions.trimMode} disabled={exporterTrimDisabled || !this.packOptions.allowTrim}>
										<option value="trim">trim</option>
										<option value="crop">crop</option>
									</select>
								</td>
								<td></td>
							</tr>
							<tr title={I18.f("ALPHA_THRESHOLD_TITLE")}>
								<td>{I18.f("ALPHA_THRESHOLD")}</td>
								<td><input ref={this.alphaThresholdRef} type="number" className="border-color-gray" defaultValue={this.packOptions.alphaThreshold} min="0" max="255" onBlur={this.onPropChanged} onKeyDown={this.eventForceUpdate}/></td>
								<td></td>
							</tr>
							<tr title={I18.f("FILTER_TITLE")}>
								<td>{I18.f("FILTER")}</td>
								<td>
									<select ref={this.filterRef} className="border-color-gray" onChange={this.onExporterChanged} defaultValue={this.packOptions.filter}>
										{filters.map(node => {
											return (<option key={"filter-" + node.type} defaultValue={node.type}>{node.type}</option>)
										})}
									</select>
								</td>
								<td></td>
							</tr>
							<tr title={I18.f("STATS_SI_TITLE")}>
								<td>{I18.f("STATS_SI")}</td>
								<td><input ref={this.statsSIRef} type="number" className="border-color-gray" defaultValue={this.packOptions.statsSI} min="0" onBlur={this.onExporterPropChanged} onChange={this.onExporterPropChanged} onKeyDown={this.eventForceUpdateExporter}/></td>
								<td></td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		);
	}
}

interface PackerMethodsProps {
	packer: string;
	defaultMethod: string;
	handler: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
}

class PackerMethods extends React.Component<PackerMethodsProps, {
	value: string;
}> {
	selectRef: React.RefObject<HTMLSelectElement> = React.createRef();
	value: string;

	constructor(props: PackerMethodsProps) {
		super(props);

		this.value = this.props.defaultMethod;
		this.state = {value: this.value};
	}

	setValue(val: string) {
		this.value = val;
		this.setState({value: val});
	}

	onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		this.value = e.target.value;
		this.setState({value: this.value});
		this.props.handler(e);
	}

	override render() {
		let packerCls = getPackerByType(this.props.packer);

		if(!packerCls) {
			throw new Error("Unknown packer " + this.props.packer);
		}

		let items = [];

		let methods = Object.keys(packerCls.methods);
		for(let item of methods) {
			items.push(<option value={item} key={"packer-method-" + item}>{item}</option>);
		}

		// defaultValue={this.props.defaultMethod}
		return (
			<select ref={this.selectRef} onChange={this.onChange} className="border-color-gray" value={this.state.value}>{items}</select>
		)
	}
}

export default PackProperties;