// 1. Cogemos el formulario por su id
const form = document.getElementById("formCita");

// 2. Cookies: cada cita se guarda en su propia cookie
// Un año en segundos: cuánto dura cada cookie de cita
const DURACION_COOKIE = 60 * 60 * 24 * 365;

// Guarda una cita en su propia cookie, llamada "cita_<id>".
// Si ya existe una cookie con ese nombre, la sobrescribe (lo usaremos al modificar).
function guardarCita(cita) {
  const valor = encodeURIComponent(JSON.stringify(cita)); // objeto → texto → texto seguro
  document.cookie = "cita_" + cita.id + "=" + valor + "; max-age=" + DURACION_COOKIE + "; path=/";
}

// Lee TODAS las cookies y devuelve un array con las citas guardadas
function leerCitas() {
  const citas = [];   // aquí iremos metiendo cada cita

  // Si no hay ninguna cookie, document.cookie es "" y no hay nada que leer
  if (document.cookie === "") {
    return citas;
  }

  // 1. document.cookie trae todas juntas: "cita_1=...; cita_2=..."
  //    split("; ") las separa en un array: ["cita_1=...", "cita_2=..."]
  const cookies = document.cookie.split("; ");

  // 2. Recorremos cada cookie y nos quedamos solo con las de citas
  for (const cookie of cookies) {
    if (!cookie.startsWith("cita_")) {
      continue;   // no es una cita (otra cookie del navegador): pasamos a la siguiente
    }

    // 3. Separamos nombre y valor por el PRIMER "="
    //    "cita_123=%7B..." → posición del "=" → nos quedamos con lo que va detrás
    const posicionIgual = cookie.indexOf("=");
    const valor = cookie.slice(posicionIgual + 1);

    // 4. Deshacemos lo que hizo guardarCita, en orden inverso:
    //    texto seguro → texto JSON → objeto
    const cita = JSON.parse(decodeURIComponent(valor));
    citas.push(cita);
  }

  // El navegador no garantiza el orden de las cookies: ordenamos por id
  // (instante de creación) para que el Nº de orden de la tabla sea siempre el mismo
  citas.sort(function (a, b) {
    return a.id - b.id;
  });

  return citas;
}

// Genera un id único: el instante actual en milisegundos (lo pide el guion).
// Si ya existe una cookie con ese id (dos citas en el mismo milisegundo),
// le sumamos 1 hasta encontrar uno libre, para no sobrescribir ninguna cita.
function generarId() {
  let id = Date.now();
  while (document.cookie.includes("cita_" + id + "=")) {
    id++;
  }
  return id;
}

// Elimina la cookie de una cita. Una cookie no se "borra": se vuelve a escribir
// con el mismo nombre y path, pero con max-age=0, y el navegador la descarta al momento.
function eliminarCita(id) {
  document.cookie = "cita_" + id + "=; max-age=0; path=/";
}

// Busca la cita POR SU ID EN LAS COOKIES (no en el HTML, como exige el guion)
// y carga sus datos en el formulario para poder modificarla.
function cargarCitaEnFormulario(id) {
  const cita = leerCitas().find(function (c) {
    return c.id === id;
  });
  if (!cita) {
    return;   // no debería pasar, pero si la cookie ya no existe, no hacemos nada
  }

  document.getElementById("idCita").value = cita.id;   // el id oculto: así el submit sabe que es una modificación
  document.getElementById("fechaCita").value = cita.fechaCita;
  document.getElementById("horaCita").value = cita.horaCita;
  document.getElementById("nombre").value = cita.nombreCliente;
  document.getElementById("apellido").value = cita.apellidoCliente;
  document.getElementById("dni").value = cita.dniCliente;
  document.getElementById("telefono").value = cita.telefonoCliente;
  document.getElementById("fechaNacimiento").value = cita.fechaNacimiento;
  document.getElementById("observaciones").value = cita.observaciones;

  // Avisamos visualmente de que estamos modificando, no creando
  document.getElementById("tituloFormulario").textContent = "Modificar cita";
  document.getElementById("btnGuardar").textContent = "Guardar cambios";
  form.scrollIntoView({ behavior: "smooth" });   // subimos al formulario
}

// Deja el formulario como al principio: vacío, sin errores y en modo "Nueva cita"
function limpiarFormulario() {
  form.reset();
  // form.reset() NO vacía los input hidden: hay que hacerlo a mano,
  // si no, la siguiente cita "nueva" sobrescribiría la que se modificó
  document.getElementById("idCita").value = "";

  // Quitamos los bordes rojos y los mensajes de error que quedaran
  document.querySelectorAll(".campo-error").forEach(function (campo) {
    campo.classList.remove("campo-error");
  });
  document.querySelectorAll(".error").forEach(function (mensaje) {
    mensaje.textContent = "";
  });

  document.getElementById("tituloFormulario").textContent = "Nueva cita";
  document.getElementById("btnGuardar").textContent = "Guardar cita";
}

// Pinta en la tabla todas las citas guardadas en las cookies.
// Se llama al abrir la página y cada vez que se crea, modifica o elimina una cita.
function pintarTabla() {
  const cuerpo = document.getElementById("cuerpoTabla");
  const citas = leerCitas();

  cuerpo.innerHTML = "";   // vaciamos la tabla y la volvemos a pintar entera desde las cookies

  // Sin citas: solo la fila de "Dato vacío" (lo pide el guion)
  if (citas.length === 0) {
    cuerpo.innerHTML = '<tr id="filaVacia"><td colspan="10">Dato vacío</td></tr>';
    return;
  }

  // Una fila por cita. "indice" empieza en 0, por eso mostramos indice + 1 como Nº de orden
  citas.forEach(function (cita, indice) {
    const fila = document.createElement("tr");

    // Los datos de la cita, en el mismo orden que las columnas del <thead>.
    // El id NO se muestra: va oculto en los botones (data-id).
    const datos = [
      indice + 1,
      cita.fechaCita,
      cita.horaCita,
      cita.nombreCliente,
      cita.apellidoCliente,
      cita.dniCliente,
      cita.telefonoCliente,
      cita.fechaNacimiento,
      cita.observaciones
    ];

    for (const dato of datos) {
      const celda = document.createElement("td");
      celda.textContent = dato;   // textContent, NO innerHTML: si alguien escribe <b> en observaciones, se ve como texto y no rompe la página
      fila.appendChild(celda);
    }

    // Última columna: botones con el id oculto en data-id.
    // Al pulsarlos, leeremos ese id para buscar la cita EN LA COOKIE (no en el HTML), como exige el guion.
    const acciones = document.createElement("td");
    acciones.innerHTML =
      '<button type="button" class="btn-modificar" data-id="' + cita.id + '">Modificar</button> ' +
      '<button type="button" class="btn-eliminar" data-id="' + cita.id + '">Eliminar</button>';
    fila.appendChild(acciones);

    cuerpo.appendChild(fila);
  });
}

// Al abrir la página, cargamos las citas que ya hubiera en las cookies
pintarTabla();

// Botones Modificar y Eliminar de la tabla.
// Las filas se borran y se vuelven a crear cada vez que se pinta la tabla, así que no
// ponemos un evento en cada botón: ponemos UNO en el <tbody> (que siempre existe) y
// miramos qué botón se ha pulsado. Esto se llama "delegación de eventos".
document.getElementById("cuerpoTabla").addEventListener("click", function (evento) {
  const boton = evento.target;
  if (!boton.dataset.id) {
    return;   // se ha hecho clic en la tabla, pero no en un botón
  }
  const id = Number(boton.dataset.id);   // dataset siempre da texto: lo pasamos a número para comparar con cita.id

  if (boton.classList.contains("btn-eliminar")) {
    if (confirm("¿Seguro que quieres eliminar esta cita?")) {
      eliminarCita(id);
      // Si estábamos modificando justo esa cita, salimos del modo modificar
      if (document.getElementById("idCita").value === String(id)) {
        limpiarFormulario();
      }
      pintarTabla();   // si era la última, vuelve a salir "Dato vacío"
    }
  } else if (boton.classList.contains("btn-modificar")) {
    cargarCitaEnFormulario(id);
  }
});

// Botón Cancelar: descarta lo escrito y vuelve al modo "Nueva cita"
document.getElementById("btnCancelar").addEventListener("click", limpiarFormulario);

// 3. Escuchamos el envío del formulario: validamos y, si todo está bien, creamos y guardamos la cita
form.addEventListener("submit", function (evento) {
  evento.preventDefault();   // sin esto la página se recarga y se pierde lo escrito

  let hayErrores = false;    // "bandera": empieza en false y cualquier campo mal la pone a true

  // --- Nombre: no vacío ---
  const nombre = document.getElementById("nombre");
  const errorNombre = document.getElementById("errorNombre");
  if (nombre.value.trim() === "") {
    nombre.classList.add("campo-error");        // borde rojo (está en el CSS)
    errorNombre.textContent = "El nombre no puede estar vacío.";
    hayErrores = true;
  } else {
    nombre.classList.remove("campo-error");     // si lo corrige, quitamos el rojo
    errorNombre.textContent = "";
  }

  // --- Apellido: no vacío ---
  const apellido = document.getElementById("apellido");
  const errorApellido = document.getElementById("errorApellido");
  if (apellido.value.trim() === "") {
    apellido.classList.add("campo-error");        // borde rojo (está en el CSS)
    errorApellido.textContent = "El apellido no puede estar vacío.";
    hayErrores = true;
  } else {
    apellido.classList.remove("campo-error");     // si lo corrige, quitamos el rojo
    errorApellido.textContent = "";
  }

  // --- DNI: 8 números + letra, y la letra tiene que ser la correcta ---
  const dni = document.getElementById("dni");
  const errorDni = document.getElementById("errorDni");
  const valorDni = dni.value.trim().toUpperCase();   // "12345678z" → "12345678Z"

  // Las 23 letras posibles, en el orden oficial: el resto de dividir entre 23 es la posición
  const LETRAS_DNI = "TRWAGMYFPDXBNJZSQVHLCKE";

  if (!/^\d{8}[A-Z]$/.test(valorDni)) {
    // Caso 1: el formato ya está mal, ni calculamos la letra
    dni.classList.add("campo-error");
    errorDni.textContent = "El DNI debe tener 8 números y una letra.";
    hayErrores = true;
  } else {
    const numero = parseInt(valorDni.slice(0, 8));   // los 8 primeros caracteres → número 12345678
    const letra = valorDni.slice(8);                  // el carácter 9 → "Z"
    const letraCorrecta = LETRAS_DNI[numero % 23];    // 12345678 % 23 = 14 → posición 14 → "Z"

    if (letra !== letraCorrecta) {
      // Caso 2: formato bien, pero la letra no corresponde al número
      dni.classList.add("campo-error");
      errorDni.textContent = "La letra del DNI no es correcta.";
      hayErrores = true;
    } else {
      // Caso 3: todo bien
      dni.classList.remove("campo-error");
      errorDni.textContent = "";
    }
  }

  // --- Teléfono: exactamente 9 números ---
  const telefono = document.getElementById("telefono");
  const errorTelefono = document.getElementById("errorTelefono");
  // /^\d{9}$/ significa: de principio (^) a fin ($), 9 dígitos (\d{9}) y nada más
  if (!/^\d{9}$/.test(telefono.value.trim())) {
    telefono.classList.add("campo-error");        // borde rojo (está en el CSS)
    errorTelefono.textContent = "El teléfono debe tener 9 números.";
    hayErrores = true;
  } else {
    telefono.classList.remove("campo-error");     // si lo corrige, quitamos el rojo
    errorTelefono.textContent = "";
  }

  // --- Fecha de nacimiento: no vacía y no en el futuro ---
  const fechaNacimiento = document.getElementById("fechaNacimiento");
  const errorFechaNacimiento = document.getElementById("errorFechaNacimiento");
  if (fechaNacimiento.value === "") {
    fechaNacimiento.classList.add("campo-error");
    errorFechaNacimiento.textContent = "La fecha de nacimiento no puede estar vacía.";
    hayErrores = true;
  } else {
    // La fecha de nacimiento no puede ser posterior a hoy
    const fechaNac = new Date(fechaNacimiento.value);
    const hoy = new Date();
    if (fechaNac > hoy) {
      fechaNacimiento.classList.add("campo-error");
      errorFechaNacimiento.textContent = "La fecha de nacimiento no puede estar en el futuro.";
      hayErrores = true;
    } else {
      fechaNacimiento.classList.remove("campo-error");
      errorFechaNacimiento.textContent = "";
    }
  }

  // --- Fecha de la cita: no vacía y no en el pasado ---
  const fechaCita = document.getElementById("fechaCita");
  const errorFechaCita = document.getElementById("errorFechaCita");
  if (fechaCita.value === "") {
    fechaCita.classList.add("campo-error");
    errorFechaCita.textContent = "La fecha de la cita no puede estar vacía.";
    hayErrores = true;
  } else {
    const fechaCit = new Date(fechaCita.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Ignoramos la hora para comparar solo fechas
    if (fechaCit < hoy) {
      fechaCita.classList.add("campo-error");
      errorFechaCita.textContent = "La fecha de la cita no puede ser en el pasado.";
      hayErrores = true;
    } else {
      fechaCita.classList.remove("campo-error");
      errorFechaCita.textContent = "";
    }
  }

  // --- Hora de la cita: no vacía ---
  const horaCita = document.getElementById("horaCita");
  const errorHoraCita = document.getElementById("errorHoraCita");
  if (horaCita.value === "") {
    horaCita.classList.add("campo-error");
    errorHoraCita.textContent = "La hora de la cita no puede estar vacía.";
    hayErrores = true;
  } else {
    horaCita.classList.remove("campo-error");
    errorHoraCita.textContent = "";
  }

  // --- Observaciones: obligatorias (recepción siempre anota el motivo de la cita) ---
  const observaciones = document.getElementById("observaciones");
  const errorObservaciones = document.getElementById("errorObservaciones");
  if (observaciones.value.trim() === "") {
    observaciones.classList.add("campo-error");        // borde rojo (está en el CSS)
    errorObservaciones.textContent = "Las observaciones no pueden estar vacías.";
    hayErrores = true;
  } else {
    observaciones.classList.remove("campo-error");     // si lo corrige, quitamos el rojo
    errorObservaciones.textContent = "";
  }

  if (hayErrores) {
    return;   // paramos: no se crea la cita, y lo escrito sigue en el formulario
  }

  // Todo correcto. ¿Cita nueva o modificación?
  // - Si el input oculto tiene un id, estamos modificando: reutilizamos ese id y
  //   guardarCita sobrescribirá su cookie.
  // - Si está vacío, es una cita nueva: id único nuevo (ver generarId).
  const idOculto = document.getElementById("idCita").value;
  const id = idOculto !== "" ? Number(idOculto) : generarId();

  const cita = new Cita(
    id,
    fechaCita.value,
    horaCita.value,
    nombre.value.trim(),
    apellido.value.trim(),
    valorDni,                 // ya en mayúsculas
    telefono.value.trim(),
    fechaNacimiento.value,
    observaciones.value.trim()
  );
  console.log("Cita creada:", cita);   // comprobación en consola (F12)
  guardarCita(cita);                   // la guardamos en su cookie "cita_<id>"
  pintarTabla();                       // repintamos para que aparezca la cita nueva o modificada
  limpiarFormulario();                 // solo se vacía el formulario si la cita se ha guardado
});