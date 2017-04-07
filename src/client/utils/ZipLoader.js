import {Observer, GLOBAL_EVENT} from '../Observer';

class ZipLoader {
    
    constructor() {
        this.onProgress = null;
        this.onEnd = null;
        this.zip = null;
        this.filesList = [];
        this.loaded = {};
        this.loadedCnt = 0;
    }
    
    load(file, onProgress=null, onEnd=null) {
        
        this.onProgress = onProgress;
        this.onEnd = onEnd;
        
        this.zip = new JSZip();
        this.zip.loadAsync(file).then(
            () => this.parseZip(),
            () => {
                Observer.emit(GLOBAL_EVENT.SHOW_MESSAGE, "Invalid zip file");
                if(this.onEnd) this.onEnd({});
            }
        );
    }
    
    parseZip() {
        
        let extensions = ["png", "jpg", "jpeg"];
        this.filesList = [];
        
        let files = Object.keys(this.zip.files);
        
        for(let name of files) {
            let file = this.zip.files[name];
            
            if(!file.dir) {
                let ext = name.split(".").pop().toLowerCase();
                if(extensions.indexOf(ext) >= 0) {
                    this.filesList.push(name);
                }
                
            }
        }

        this.loadedCnt = 0;
        
        this.loadNext();
    }
    
    loadNext() {
        if(!this.filesList.length) {
            if(this.onEnd) this.onEnd(this.loaded);
            return;
        }
        
        let name = this.filesList.shift();
        
        this.zip.file(name).async("base64").
            then(d => {
                let ext = name.split(".").pop().toLowerCase();
                let content = "data:image/"+ext+";base64," + d;

                let img = new Image();
    
                img.src = content;
                img._base64 = content;
                img._ix = this.loadedCnt;
    
                this.loaded[name] = img;
                this.loadedCnt++;
    
                if(this.onProgress) {
                    this.onProgress(this.loadedCnt / (this.loadedCnt + this.filesList.length));
                }
                
                img.onload = () => this.loadNext();
            });
    }
}

export default ZipLoader;