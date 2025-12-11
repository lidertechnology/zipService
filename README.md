# zipService
Servicio Angular para descomprimir archivos ZIP

Informe detallado asegurará que el `ZipService` se use correctamente en cualquier componente *standalone* de Angular, siguiendo todas tus convenciones.

## 📝 Informe de Integración: `ZipService`

### 🎯 1. Objetivo del Servicio

El `ZipService` encapsula toda la complejidad de manejar archivos ZIP en el lado del cliente utilizando la biblioteca **JSZip**. Su propósito principal es desacoplar la lógica de descompresión de la capa de presentación (el componente).

| Característica | Detalle |
| :--- | :--- |
| **Dependencia Clave** | JSZip |
| **Método Principal** | `descomprimirArchivo(archivoZip: Blob)` |
| **Entrada** | Un objeto `Blob` o `File` (como se obtiene de un `<input type="file">`). |
| **Salida** | Una promesa (`Promise`) que resuelve en un arreglo de `ArchivoExtraido[]`. |
| **Convención Aplicada** | Reactive-Flow (RF), inyectable en `root`. |

-----

### 🛠️ 2. Código del Servicio (Recordatorio)

Este servicio es el núcleo de la funcionalidad:

```typescript
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
```

-----

### 🧩 3. Uso en un Componente Standalone de Angular

A continuación, se muestra cómo un componente *standalone* usa el servicio, adhiriéndose a tus convenciones: **Reactive Forms**, **Signals** y **Angular Material**.

#### `zip-uncompressor.component.ts`

```typescript
import { Component, computed, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { ZipService, ArchivoExtraido } from './zip.service'; // Importación del servicio e interfaz

@Component({
    selector: 'app-zip-uncompressor',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressBarModule,
        MatIconModule,
        // ... otras dependencias de Material
    ],
    templateUrl: './zip-uncompressor.component.html',
    styleUrl: './zip-uncompressor.component.css',
})
export class ZipUncompressorComponent {

    // Dependencias
    private formBuilder = inject(FormBuilder);
    private zipService = inject(ZipService);

    // Estado local (Signal)
    private _archivosExtraidos = signal<ArchivoExtraido[]>([]);
    private _estaDescomprimiendo = signal<boolean>(false);

    // Estado público (Signal de solo lectura)
    public estado = {
        archivosExtraidos: computed(() => this._archivosExtraidos()),
        estaDescomprimiendo: computed(() => this._estaDescomprimiendo()),
    };

    // Formulario (Reactive Form)
    public formGroup = this.formBuilder.group({
        archivoZip: [null as File | null, Validators.required],
    });

    /**
     * @RF: Maneja la selección de archivo y actualiza el Reactive Form.
     */
    public onFileSelected(event: Event): void {
        const inputElement = event.target as HTMLInputElement;
        const archivoSeleccionado = inputElement.files?.[0] ?? null;

        if (archivoSeleccionado) {
            const nombreControl = 'archivoZip';
            this.formGroup.controls[nombreControl].setValue(archivoSeleccionado);
            this.formGroup.controls[nombreControl].markAsDirty();
        }
    }

    /**
     * @RF: Inicia el proceso de descompresión delegando la tarea al servicio.
     */
    public async descomprimirZip(): Promise<void> {
        if (this.formGroup.invalid) {
            alert('Debe seleccionar un archivo ZIP.');
            return;
        }

        const archivo = this.formGroup.controls['archivoZip'].value;
        if (!archivo) {
            return;
        }

        const archivoBlob = archivo as Blob;
        const estadoCargando = true;

        this._estaDescomprimiendo.set(estadoCargando);
        this._archivosExtraidos.set([]);

        try {
            // LLAMADA AL SERVICIO
            const resultados = await this.zipService.descomprimirArchivo(archivoBlob);
            
            // Gestión del estado (Signals)
            this._archivosExtraidos.set(resultados);

        } catch (error) {
            const mensajeError = error instanceof Error ? error.message : 'Ocurrió un error desconocido durante la descompresión.';
            alert(mensajeError);

        } finally {
            const estadoNoCargando = false;
            this._estaDescomprimiendo.set(estadoNoCargando);
        }
    }
}


// 
// 
// 
// 
// 
// fin del componente o servicio
```

-----

### 🚀 4. Resumen de Integración

El patrón aplicado asegura un código limpio y escalable:

| Capa | Responsabilidad | Elementos Utilizados |
| :--- | :--- | :--- |
| **UI/View (HTML)** | Interacción y visualización del estado. | Angular Material (Botones, Inputs, Cards). |
| **Componente (`ZipUncompressorComponent`)** | Flujo de control, estado y manejo de entrada. | `formGroup`, `signal` (`estado`), `inject(ZipService)`. |
| **Servicio (`ZipService`)** | Lógica de negocio de la descompresión. | `JSZip`, `FileReader`, `try/catch`. |

De esta manera, la lógica de descompresión puede ser usada por cualquier otro componente en la aplicación sin duplicar el código ni acoplarse a `JSZip`.

¿Te gustaría ahora que incorporemos la funcionalidad de **compresión** (crear un ZIP) al `ZipService` para hacerlo completamente bidireccional?
