import { Injectable } from '@angular/core';
import * as JSZip from 'jszip';

export interface ArchivoExtraido {
    nombre: string;
    contenido: string | ArrayBuffer;
}

@Injectable({
    providedIn: 'root',
})
export class ZipService {

    constructor() { }

    public async descomprimirArchivo(archivoZip: Blob): Promise<ArchivoExtraido[]> {
        
        const archivoBlob = archivoZip;

        try {
            const arrayBuffer = await this._readFileAsArrayBuffer(archivoBlob);
            
            const zip = new JSZip();
            const zipCargado = await zip.loadAsync(arrayBuffer);

            const archivosExtraidos: ArchivoExtraido[] = [];
            
            const nombresArchivos = zipCargado.files;

            for (const nombre of Object.keys(nombresArchivos)) {
                const archivo = nombresArchivos[nombre];
                
                if (archivo.dir) {
                    continue;
                }

                const contenidoExtraido = await archivo.async('text');
                
                archivosExtraidos.push({ 
                    nombre: nombre, 
                    contenido: contenidoExtraido 
                });
            }
            
            return archivosExtraidos;

        } catch (error) {
            const mensajeError = 'Error en la descompresión. El archivo puede estar corrupto o no ser un formato ZIP válido.';
            console.error(mensajeError, error);
            throw new Error(mensajeError); 
        }
    }

    private _readFileAsArrayBuffer(file: Blob): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            const onReaderLoad = (event: ProgressEvent<FileReader>) => {
                resolve(event.target?.result as ArrayBuffer);
            };
            const onReaderError = (error: ProgressEvent<FileReader>) => {
                reject(reader.error);
            };
            
            reader.onload = onReaderLoad;
            reader.onerror = onReaderError;
            
            reader.readAsArrayBuffer(file);
        });
    }

}


// 
// 
// 
// 
// 
// fin del componente o servicio
