// Tienda en Cuotas - Entrega Final
// datos.js: de dónde salen los datos (fetch al catalogo.json y a la API del dólar) y el localStorage

// ===== FUENTES DE DATOS =====

// catalogo.json: el archivo local que simula ser la base de datos (productos y planes de cuotas)
const urlCatalogo = "./data/catalogo.json"
// API pública (sin autenticación): la cotización del dólar oficial del día
const urlDolar = "https://dolarapi.com/v1/dolares/oficial"

// Una pequeña espera antes del fetch (en milisegundos) para que se llegue a ver el "Cargando productos..."
const demoraCarga = 800

// Función flecha que devuelve una Promise: se resuelve sola después de ms milisegundos (setTimeout)
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Función async: hace el fetch a una url y devuelve los datos ya convertidos desde JSON
async function pedirDatos(url) {
    // await fetch: espera la respuesta del servidor. Si no hay conexión, fetch lanza un TypeError
    const respuesta = await fetch(url)

    // respuesta.ok es false si el servidor respondió con un error (por ejemplo 404: no existe)
    if (!respuesta.ok) {
        // throw: lanza un error propio que atrapa el catch de quien llamó a pedirDatos()
        throw new Error(`el servidor respondió con el error ${respuesta.status}`)
    }

    // await respuesta.json(): convierte el cuerpo de la respuesta en un array u objeto de JavaScript
    return await respuesta.json()
}

// Función declarada: traduce el error atrapado por un catch a un mensaje claro para el usuario
function explicarError(error) {
    // if...else if: cada tipo de error tiene su explicación
    if (error.name === "Error") {
        // Los errores que lanzamos nosotros con throw (respuesta no exitosa)
        return error.message
    } else if (error.name === "SyntaxError") {
        // respuesta.json() no pudo leer los datos
        return "los datos están dañados"
    } else {
        // fetch lanza TypeError cuando no hay conexión (o si se abrió el index.html sin servidor)
        return "no se pudo conectar con el servidor"
    }
}

// ===== STORAGE =====

// Las claves con las que se guardan los datos en el localStorage
const claveCarrito = "carrito"
const claveCompras = "compras"
const claveCuotas = "cuotasElegidas"

// Recuperar: lee un array del localStorage
function leerStorage(clave) {
    try {
        // OR (||): si la clave no existe, JSON.parse(null) da null y se usa un array vacío
        return JSON.parse(localStorage.getItem(clave)) || []
    } catch (error) {
        // Si lo guardado está dañado (SyntaxError), se borra esa clave y se arranca de cero
        localStorage.removeItem(clave)
        return []
    }
}

// Guardar / modificar: setItem pisa lo que había en esa clave con la versión actualizada
function guardarStorage(clave, datos) {
    // JSON.stringify: el localStorage solo guarda texto, así que el array se convierte a JSON
    localStorage.setItem(clave, JSON.stringify(datos))
}

// Borrar: removeItem elimina esa clave del localStorage
function borrarStorage(clave) {
    localStorage.removeItem(clave)
}
