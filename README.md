# Economy · Rúbrica de Presentaciones (`2627-88052-A INGLÉS`)

Aplicación web estática para evaluar las presentaciones orales de los **39 alumnos** de Economy a lo largo de 3 días, con rúbrica de 4 temas (`0`, `3`, `5`, `7`, `10`), cálculo automático de la media sobre 10, guardado persistente y exportación directa a **Canvas LMS**.

## Características

- **Lista precargada de 39 alumnos** con sus identificadores exactos de Canvas (`Student`, `ID`, `SIS Login ID`, `Section`).
- **4 temas editables**: `Tema 1`, `Tema 2`, `Tema 3` y `Tema 4` pueden renombrarse en cualquier momento.
- **Escala fija**: `0`, `3`, `5`, `7`, `10` por cada tema, con cálculo inmediato de la nota final (media sobre `10.00`).
- **Organización en 3 días**: asigna cada alumno a `Día 1`, `Día 2` o `Día 3`, filtra por día o estado (`Pendientes`, `En progreso`, `Evaluados`) y busca por nombre o ID.
- **Dos modos de trabajo**:
  - **Lista**: vista completa de los alumnos con acceso directo a los 4 temas.
  - **Modo Presentación**: evaluación enfocada alumno por alumno mientras expone en público (con atajos de teclado `←` y `→`).
- **Persistencia para los 3 días**:
  - Guardado automático instantáneo en `localStorage` del navegador.
  - Descarga y restauración de copias de seguridad en `.json` para conservar respaldo diario o cambiar de equipo.
- **Exportación a Canvas LMS**:
  - Genera un `.csv` UTF-8 sin BOM con la estructura exacta exigida por Canvas (`Student,ID,SIS Login ID,Section,<Tarea>` + fila `Points Possible = 10.00`).
  - Los alumnos sin evaluar quedan en blanco para evitar sobrescribir con `0`.
  - Incluye además una descarga secundaria con el desglose de los 4 temas en CSV para Excel.

## Cómo usar la aplicación

### Opción 1: Abrir directamente en el navegador
Abre el archivo `index.html` con doble clic en Chrome, Edge, Firefox o Safari. No requiere servidor ni instalación.

### Opción 2: Publicar en GitHub Pages
1. Ve a **Settings → Pages** en el repositorio `jorge4321/ECO_rubric`.
2. En **Build and deployment**, selecciona **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
3. Guarda y accede desde la URL de GitHub Pages en cualquier ordenador o tablet del aula.

## Cómo subir las notas a Canvas LMS

1. Pulsa **Exportar Canvas** en la esquina superior derecha.
2. Verifica o edita el nombre de la columna (por defecto `Final Class Presentation`).
   - Si la tarea **no existe** todavía en Canvas, Canvas propondrá crearla automáticamente con `10.00` puntos posibles.
   - Si la tarea **ya existe**, introduce su nombre exacto seguido de su ID entre paréntesis tal y como aparece en tu CSV de Canvas, por ejemplo: `Final Class Presentation (601999)`.
3. Pulsa **Descargar CSV para Canvas**.
4. En **Canvas**, abre tu curso → **Calificaciones (Grades)** → **Importar (Import)** → selecciona el archivo `.csv` descargado → revisa el resumen de cambios y pulsa **Guardar cambios**.
