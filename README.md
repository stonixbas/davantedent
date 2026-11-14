# DavanteDent · Gestión de citas

Aplicación web para gestionar las citas de una clínica dental, hecha con HTML, CSS y JavaScript (sin servidor ni base de datos).

- Formulario para crear y modificar citas, con validación de todos los campos (incluida la letra del DNI).
- Clase `Cita` para representar cada cita; el identificador es el instante de creación.
- Cada cita se guarda en su propia cookie del navegador y se cargan todas al abrir la página.
- Tabla con número de orden y botones para modificar y eliminar; si no hay citas, muestra "Dato vacío".

## Cómo ejecutarla

Abrir `index.html` con un servidor local (por ejemplo, Live Server de VS Code). Abierta directamente como archivo (`file://`), algunos navegadores no guardan cookies.

Trabajo de enfoque de Desarrollo Web en Entorno Cliente (DAW).
