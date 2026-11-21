// Tienda en Cuotas - Entrega Final
// main.js: el estado de la tienda, el renderizado en el DOM y los eventos
// Usa las clases de clases.js y las funciones de datos.js (se cargan antes en el index.html)

// ===== ESTADO =====

// let: el catálogo y los planes arrancan vacíos y se llenan cuando termina el fetch del catalogo.json
let catalogo = []
let planesDeCuotas = []

// El carrito y las compras se recuperan del localStorage (si no hay nada guardado, arrancan vacíos)
const carrito = new Carrito(leerStorage(claveCarrito))
let compras = leerStorage(claveCompras)

// La cotización del dólar vale null hasta que responde la API. textoDolar es lo que se muestra mientras tanto
let cotizacionDolar = null
let textoDolar = "⏳ Consultando la cotización del dólar..."

// Objeto: el color de fondo de cada tipo de notificación de Toastify
const coloresMensaje = {
    exito: "#16a34a",
    error: "#dc2626",
    aviso: "#b45309",
    info: "#4f46e5"
}

// ===== ELEMENTOS DEL DOM =====

// Catálogo
const inputBuscar = document.querySelector("#input-buscar")
const selectCategoria = document.querySelector("#select-categoria")
const contadorProductos = document.querySelector("#contador-productos")
const contenedorProductos = document.querySelector("#contenedor-productos")

// Carrito y resumen
const contadorCarrito = document.querySelector("#contador-carrito")
const contenedorCarrito = document.querySelector("#contenedor-carrito")
const totalCarrito = document.querySelector("#total-carrito")
const totalDolares = document.querySelector("#total-dolares")
const selectCuotas = document.querySelector("#select-cuotas")
const valorCuota = document.querySelector("#valor-cuota")
const botonVaciar = document.querySelector("#boton-vaciar")

// Formulario de compra
const formularioCompra = document.getElementById("formulario-compra")
const inputNombre = document.getElementById("input-nombre")
const inputEmail = document.getElementById("input-email")
const botonConfirmar = document.getElementById("boton-confirmar")

// Historial de compras
const contenedorCompras = document.querySelector("#contenedor-compras")
const botonBorrarHistorial = document.querySelector("#boton-borrar-historial")

// ===== FUNCIONES DE AYUDA =====

// Función flecha: el precio con el signo $, separador de miles y dos decimales (ej: $450.000,00)
const formatearPrecio = (valor) =>
    `$${valor.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// Función flecha + ternario: "1 cuota" o "N cuotas" según la cantidad
const textoCuotas = (cuotas) => cuotas === 1 ? "1 cuota" : `${cuotas} cuotas`

// find: busca en el catálogo el producto con ese id
const buscarProducto = (id) => catalogo.find((producto) => producto.id === id)

// ?. y OR (||): si el producto no está en el carrito, buscarItem da undefined y la cantidad es 0
const cantidadEnCarrito = (id) => carrito.buscarItem(id)?.cantidad || 0

// Guarda el carrito en el localStorage (se llama después de cada cambio)
const guardarCarrito = () => guardarStorage(claveCarrito, carrito.items)

// Función declarada (feedback): muestra una notificación con la librería Toastify, con el color según el tipo
function mostrarMensaje(texto, tipo) {
    Toastify({
        text: texto,
        duration: 3500,
        gravity: "top",
        position: "right",
        close: true,
        style: { background: coloresMensaje[tipo] }
    }).showToast()
}

// Función async: pide confirmación con SweetAlert2 (reemplaza al confirm nativo). Devuelve true si aceptó
async function confirmar(titulo, html, textoBoton) {
    const respuesta = await Swal.fire({
        icon: "question",
        title: titulo,
        html: html,
        showCancelButton: true,
        confirmButtonText: textoBoton,
        cancelButtonText: "Volver",
        confirmButtonColor: coloresMensaje.info
    })
    return respuesta.isConfirmed
}

// map + destructuring: convierte los objetos del JSON en objetos Producto (con sus métodos)
function convertirCatalogo(productos) {
    return productos.map(({ id, nombre, categoria, precio, stock, imagen }) =>
        new Producto(id, nombre, categoria, precio, stock, imagen)
    )
}

// El stock del catalogo.json es el inicial: se le restan las unidades de las compras guardadas
function descontarStockComprado() {
    // forEach anidados: cada compra tiene varios items
    compras.forEach(({ items }) => {
        items.forEach(({ id, cantidad }) => {
            const producto = buscarProducto(id)
            if (producto) {
                producto.stock -= cantidad
            }
        })
    })
}

// Al cancelar una compra, sus unidades vuelven al stock
function devolverStock({ items }) {
    items.forEach(({ id, cantidad }) => {
        const producto = buscarProducto(id)
        if (producto) {
            producto.stock += cantidad
        }
    })
}

// Arma las opciones del filtro de categorías sin repetir
function crearOpcionesCategorias() {
    // map: se queda con la categoría de cada producto
    // filter: deja solo la primera vez que aparece cada una (indexOf da la primera posición)
    const categorias = catalogo
        .map((producto) => producto.categoria)
        .filter((categoria, posicion, lista) => lista.indexOf(categoria) === posicion)
    return categorias.map((categoria) => `<option value="${categoria}">${categoria}</option>`).join("")
}

// map + join: un <option> por cada plan de cuotas del JSON
function crearOpcionesCuotas() {
    return planesDeCuotas.map((cuotas) => `<option value="${cuotas}">${textoCuotas(cuotas)}</option>`).join("")
}

// ===== RENDERIZADO =====

// Paso 1 del circuito: dibuja las tarjetas del catálogo según la búsqueda y la categoría elegida
function renderizarCatalogo() {
    const texto = inputBuscar.value.trim().toLowerCase()
    const categoriaElegida = selectCategoria.value

    // filter: el nombre tiene que contener el texto buscado y la categoría coincidir (o ser "Todas")
    const visibles = catalogo.filter((producto) =>
        producto.nombre.toLowerCase().includes(texto) &&
        (categoriaElegida === "" || producto.categoria === categoriaElegida)
    )

    contadorProductos.innerText = `Mostrando ${visibles.length} de ${catalogo.length} productos`
    contenedorProductos.innerHTML = ""

    if (visibles.length === 0) {
        contenedorProductos.innerHTML = `<p class="mensaje-lista">No hay productos que coincidan con tu búsqueda.</p>`
        return
    }

    // spread (...): pasa los planes sueltos a Math.max para mostrar el plan más largo
    const cuotasMaximas = Math.max(...planesDeCuotas)

    // forEach: una tarjeta por producto
    visibles.forEach((producto) => {
        // Destructuring: las propiedades del producto en variables con el mismo nombre
        const { id, nombre, categoria, precio, stock, imagen } = producto
        const enCarrito = cantidadEnCarrito(id)
        const disponible = stock - enCarrito

        // if...else if: el texto del botón según el stock
        let textoBoton = "Agregar al carrito"
        if (stock === 0) {
            textoBoton = "Sin stock"
        } else if (disponible === 0) {
            textoBoton = "Ya tenés todo el stock"
        }

        const tarjeta = document.createElement("article")
        // Ternario: la tarjeta se ve apagada si no se pueden agregar más unidades
        tarjeta.className = `tarjeta ${disponible === 0 ? "sin-stock" : ""}`
        tarjeta.innerHTML = `
            <img src="${imagen}" alt="${nombre}" class="tarjeta-imagen">
            <span class="categoria">${categoria}</span>
            <h3>${nombre}</h3>
            <p class="precio">${formatearPrecio(precio)}</p>
            <p class="valor-cuota">Hasta ${textoCuotas(cuotasMaximas)} de ${formatearPrecio(producto.calcularCuota(cuotasMaximas))} sin interés</p>
            <p class="stock">Stock: ${stock}${enCarrito > 0 ? ` · En tu carrito: ${enCarrito}` : ""}</p>
            <button class="boton boton-principal" ${disponible === 0 ? "disabled" : ""}>${textoBoton}</button>
        `
        contenedorProductos.appendChild(tarjeta)

        // Evento click: agrega este producto al carrito
        tarjeta.querySelector("button").addEventListener("click", () => agregarAlCarrito(producto))
    })
}

// Paso 2 del circuito: dibuja los items del carrito con sus botones para cambiar la cantidad
function renderizarCarrito() {
    contadorCarrito.innerText = carrito.contarUnidades()
    contenedorCarrito.innerHTML = ""

    if (carrito.estaVacio()) {
        contenedorCarrito.innerHTML = `<p class="mensaje-lista">Tu carrito está vacío. Agregá productos del catálogo.</p>`
    }

    carrito.items.forEach((item) => {
        const { id, nombre, precio, imagen, cantidad } = item
        // ?. y OR (||): si el catálogo no cargó, no se sabe el stock y no se deja sumar
        const stock = buscarProducto(id)?.stock || 0

        const fila = document.createElement("div")
        fila.className = "item-carrito"
        fila.innerHTML = `
            <img src="${imagen}" alt="${nombre}">
            <div class="item-datos">
                <h3>${nombre}</h3>
                <p>${formatearPrecio(precio)} c/u</p>
            </div>
            <div class="item-cantidad">
                <button class="boton-cantidad boton-restar" ${cantidad === 1 ? "disabled" : ""} aria-label="Restar una unidad">−</button>
                <span>${cantidad}</span>
                <button class="boton-cantidad boton-sumar" ${cantidad >= stock ? "disabled" : ""} aria-label="Sumar una unidad">+</button>
            </div>
            <p class="item-subtotal">${formatearPrecio(precio * cantidad)}</p>
            <button class="boton-quitar" aria-label="Quitar ${nombre} del carrito">✖</button>
        `
        contenedorCarrito.appendChild(fila)

        // Eventos click: modificar la cantidad o quitar el producto
        fila.querySelector(".boton-restar").addEventListener("click", () => cambiarCantidad(item, cantidad - 1))
        fila.querySelector(".boton-sumar").addEventListener("click", () => cambiarCantidad(item, cantidad + 1))
        fila.querySelector(".boton-quitar").addEventListener("click", () => quitarDelCarrito(item))
    })

    actualizarResumen()
}

// Paso 3 del circuito: calcula el total del carrito y el valor de cada cuota (sin interés)
function actualizarResumen() {
    const total = carrito.calcularTotal()
    // OR (||): mientras no cargaron los planes, el select está vacío y se usa 1 cuota
    const cuotas = parseInt(selectCuotas.value) || 1

    totalCarrito.innerText = formatearPrecio(total)
    valorCuota.innerText = `${textoCuotas(cuotas)} de ${formatearPrecio(total / cuotas)} sin interés`

    // Ternario: el total en dólares aparece cuando la API devolvió la cotización
    totalDolares.innerText = cotizacionDolar !== null
        ? `≈ US$ ${(total / cotizacionDolar).toFixed(2)} (dólar oficial a $${cotizacionDolar})`
        : textoDolar

    botonVaciar.disabled = carrito.estaVacio()
    // No se puede confirmar con el carrito vacío ni si el catálogo no cargó (no se sabe el stock)
    botonConfirmar.disabled = carrito.estaVacio() || catalogo.length === 0
}

// Paso 4 del circuito: el historial de compras confirmadas (guardado en el localStorage)
function renderizarCompras() {
    contenedorCompras.innerHTML = ""
    botonBorrarHistorial.disabled = compras.length === 0

    if (compras.length === 0) {
        contenedorCompras.innerHTML = `<p class="mensaje-lista">Todavía no confirmaste ninguna compra.</p>`
        return
    }

    compras.forEach((compra) => {
        // Destructuring anidado: de comprador se sacan nombre y email
        const { numero, fecha, comprador: { nombre, email }, items, total, cuotas } = compra
        // map + join: "2 × Celular, 1 × Mochila"
        const detalle = items.map((item) => `${item.cantidad} × ${item.nombre}`).join(", ")

        const tarjeta = document.createElement("article")
        tarjeta.className = "compra"
        tarjeta.innerHTML = `
            <div class="compra-encabezado">
                <h3>Compra #${numero}</h3>
                <span>${fecha}</span>
            </div>
            <p>${nombre} · ${email}</p>
            <p>${detalle}</p>
            <p class="compra-total">${formatearPrecio(total)} en ${textoCuotas(cuotas)} de ${formatearPrecio(total / cuotas)}</p>
            <button class="boton boton-eliminar">Cancelar compra</button>
        `
        contenedorCompras.appendChild(tarjeta)

        tarjeta.querySelector("button").addEventListener("click", () => cancelarCompra(compra))
    })
}

// Vuelve a dibujar todo (se llama después de cada cambio en el carrito o en las compras)
function actualizarVista() {
    renderizarCatalogo()
    renderizarCarrito()
    renderizarCompras()
}

// ===== PETICIONES (fetch + async/await) =====

// Función async: trae el catálogo del catalogo.json y lo muestra (try...catch...finally)
async function cargarCatalogo() {
    // Mientras carga: aviso en el catálogo y los filtros bloqueados
    contadorProductos.innerText = ""
    contenedorProductos.innerHTML = `<p class="mensaje-lista cargando">⏳ Cargando productos...</p>`
    inputBuscar.disabled = true
    selectCategoria.disabled = true

    try {
        await esperar(demoraCarga)
        // Destructuring: el JSON es un objeto con los productos y los planes de cuotas
        const { productos, planesDeCuotas: planes } = await pedirDatos(urlCatalogo)

        catalogo = convertirCatalogo(productos)
        planesDeCuotas = planes
        descontarStockComprado()

        selectCategoria.innerHTML = `<option value="">Todas las categorías</option>${crearOpcionesCategorias()}`
        selectCuotas.innerHTML = crearOpcionesCuotas()
        // OR (||): si el usuario nunca eligió un plan, arranca en 1 cuota
        selectCuotas.value = localStorage.getItem(claveCuotas) || "1"

        inputBuscar.disabled = false
        selectCategoria.disabled = false
        mostrarMensaje(`✅ ${catalogo.length} productos cargados`, "exito")
        renderizarCatalogo()
    } catch (error) {
        // catch: el fetch falló, el servidor respondió con error o los datos estaban dañados
        catalogo = []
        const motivo = explicarError(error)
        Swal.fire({
            icon: "error",
            title: "No se pudieron cargar los productos",
            text: `Motivo: ${motivo}. Tocá "Reintentar" para volver a intentarlo.`,
            confirmButtonText: "Entendido",
            confirmButtonColor: coloresMensaje.info
        })
        contenedorProductos.innerHTML = `
            <div class="mensaje-lista">
                <p>😕 No se pudieron cargar los productos (${motivo}).</p>
                <button id="boton-reintentar" class="boton boton-principal">🔄 Reintentar</button>
            </div>
        `
        document.querySelector("#boton-reintentar").addEventListener("click", cargarCatalogo)
    } finally {
        // finally: haya salido bien o mal, se muestran el carrito y las compras guardadas
        renderizarCarrito()
        renderizarCompras()
    }
}

// Función async: trae la cotización del dólar de una API pública para mostrar el total en dólares
async function cargarCotizacion() {
    try {
        // Destructuring: de la respuesta de la API solo interesa el precio de venta
        const { venta } = await pedirDatos(urlDolar)
        cotizacionDolar = venta
    } catch (error) {
        // Si la API no responde, la tienda sigue funcionando, solo sin el total en dólares
        textoDolar = `❌ No se pudo obtener la cotización del dólar (${explicarError(error)})`
    } finally {
        actualizarResumen()
    }
}

// ===== ACCIONES DEL USUARIO =====

// Agrega una unidad al carrito si queda stock disponible
function agregarAlCarrito(producto) {
    const { id, nombre, stock } = producto
    if (cantidadEnCarrito(id) >= stock) {
        mostrarMensaje(`❌ No queda más stock de ${nombre}`, "error")
        return
    }
    carrito.agregar(producto)
    guardarCarrito()
    mostrarMensaje(`🛒 ${nombre} se agregó al carrito`, "exito")
    actualizarVista()
}

// Modificar: cambia la cantidad de un item (entre 1 y el stock del producto)
function cambiarCantidad({ id, nombre }, nuevaCantidad) {
    const stock = buscarProducto(id)?.stock || 0
    if (nuevaCantidad < 1) {
        return
    }
    if (nuevaCantidad > stock) {
        mostrarMensaje(`❌ Solo hay ${stock} unidades de ${nombre}`, "error")
        return
    }
    carrito.cambiarCantidad(id, nuevaCantidad)
    guardarCarrito()
    actualizarVista()
}

// Borrar: quita un producto del carrito y guarda el carrito actualizado
function quitarDelCarrito({ id, nombre }) {
    carrito.quitar(id)
    guardarCarrito()
    mostrarMensaje(`🗑️ ${nombre} se quitó del carrito`, "aviso")
    actualizarVista()
}

// Vaciar: confirma con SweetAlert2, vacía el carrito y borra su clave del localStorage
async function vaciarCarrito() {
    if (!(await confirmar("¿Vaciar el carrito?", "Se van a quitar todos los productos.", "Sí, vaciar"))) {
        return
    }
    carrito.vaciar()
    borrarStorage(claveCarrito)
    mostrarMensaje("🗑️ Se vació el carrito", "aviso")
    actualizarVista()
}

// El próximo número de compra: el mayor que haya + 1 (arranca en 1001)
const calcularNumeroCompra = () => Math.max(1000, ...compras.map((compra) => compra.numero)) + 1

// Paso final del circuito: valida los datos, confirma con SweetAlert2 y registra la compra
async function confirmarCompra(evento) {
    // preventDefault: el formulario no recarga la página al enviarse
    evento.preventDefault()

    const nombre = inputNombre.value.trim()
    const email = inputEmail.value.trim()
    const cuotas = parseInt(selectCuotas.value)
    const total = carrito.calcularTotal()

    // if...else if: cada dato inválido muestra su propio error
    if (carrito.estaVacio()) {
        mostrarMensaje("❌ Tu carrito está vacío", "error")
        return
    } else if (nombre === "") {
        mostrarMensaje("❌ Ingresá tu nombre", "error")
        inputNombre.focus()
        return
    } else if (!email.includes("@") || !email.includes(".")) {
        mostrarMensaje("❌ Ingresá un email válido (ej: nombre@mail.com)", "error")
        inputEmail.focus()
        return
    }

    // map + join: el detalle de la compra en una lista para el cartel de confirmación
    const detalle = carrito.items
        .map((item) => `<li>${item.cantidad} × ${item.nombre}: ${formatearPrecio(item.precio * item.cantidad)}</li>`)
        .join("")
    const confirmada = await confirmar(
        "¿Confirmás la compra?",
        `<ul class="detalle-compra">${detalle}</ul>
         <p><strong>Total: ${formatearPrecio(total)}</strong></p>
         <p>${textoCuotas(cuotas)} de ${formatearPrecio(total / cuotas)} sin interés</p>`,
        "Confirmar compra"
    )
    if (!confirmada) {
        return
    }

    // Objeto: la compra que se guarda en el historial. map copia los items del carrito
    const compra = {
        numero: calcularNumeroCompra(),
        fecha: new Date().toLocaleString("es-AR"),
        comprador: { nombre, email },
        items: carrito.items.map((item) => ({ id: item.id, nombre: item.nombre, precio: item.precio, cantidad: item.cantidad })),
        total,
        cuotas
    }

    // Se descuenta el stock, se guarda la compra (al principio del historial) y se vacía el carrito
    compra.items.forEach(({ id, cantidad }) => {
        buscarProducto(id).stock -= cantidad
    })
    compras.unshift(compra)
    guardarStorage(claveCompras, compras)
    carrito.vaciar()
    borrarStorage(claveCarrito)
    formularioCompra.reset()
    actualizarVista()

    Swal.fire({
        icon: "success",
        title: `¡Gracias por tu compra, ${nombre}!`,
        html: `Tu número de compra es <strong>#${compra.numero}</strong>.<br>
               Vas a pagar ${textoCuotas(cuotas)} de ${formatearPrecio(total / cuotas)} sin interés.<br>
               Te enviamos el detalle a ${email}.`,
        confirmButtonText: "Seguir comprando",
        confirmButtonColor: coloresMensaje.exito
    })
}

// Borrar una compra del historial: devuelve las unidades al stock
async function cancelarCompra(compra) {
    const { numero } = compra
    if (!(await confirmar(`¿Cancelar la compra #${numero}?`, "Las unidades vuelven al stock de la tienda.", "Sí, cancelar"))) {
        return
    }
    devolverStock(compra)
    // filter: todas las compras menos la cancelada
    compras = compras.filter((guardada) => guardada.numero !== numero)
    guardarStorage(claveCompras, compras)
    mostrarMensaje(`↩️ Se canceló la compra #${numero}`, "aviso")
    actualizarVista()
}

// Vaciar el historial: devuelve todo el stock y borra la clave de las compras del localStorage
async function borrarHistorial() {
    if (!(await confirmar("¿Borrar el historial?", "Se cancelan todas tus compras y el stock vuelve a como estaba.", "Sí, borrar"))) {
        return
    }
    compras.forEach(devolverStock)
    compras = []
    borrarStorage(claveCompras)
    mostrarMensaje("🗑️ Se borró el historial de compras", "aviso")
    actualizarVista()
}

// ===== EVENTOS =====

// Evento input: cada tecla en el buscador vuelve a filtrar el catálogo
inputBuscar.addEventListener("input", renderizarCatalogo)
// Evento change: al elegir otra categoría se filtra el catálogo
selectCategoria.addEventListener("change", renderizarCatalogo)

// Evento change: al cambiar el plan de cuotas se guarda la elección y se recalcula el resumen
selectCuotas.addEventListener("change", () => {
    localStorage.setItem(claveCuotas, selectCuotas.value)
    actualizarResumen()
})

botonVaciar.addEventListener("click", vaciarCarrito)
botonBorrarHistorial.addEventListener("click", borrarHistorial)

// Evento submit: el botón "Confirmar compra" (o Enter en el formulario)
formularioCompra.addEventListener("submit", confirmarCompra)

// ===== INICIO =====

// Al cargar la página: fetch del catálogo (catalogo.json) y de la cotización del dólar (API)
cargarCatalogo()
cargarCotizacion()
