// Tienda en Cuotas - Entrega Final
// clases.js: las clases del simulador (Producto y Carrito)

// Class: cada producto del catálogo (se crean con los datos que trae el fetch del catalogo.json)
class Producto {
    // constructor: recibe los datos y los guarda en el objeto con this
    constructor(id, nombre, categoria, precio, stock, imagen) {
        this.id = id
        this.nombre = nombre
        this.categoria = categoria
        this.precio = precio
        this.stock = stock
        this.imagen = imagen
    }

    // Método: calcula el valor de cada cuota (sin interés, como en la Pre-Entrega 1)
    calcularCuota(cuotas) {
        return this.precio / cuotas
    }
}

// Class: el carrito de compras. items es un array de objetos { id, nombre, precio, imagen, cantidad }
class Carrito {
    constructor(items) {
        this.items = items
    }

    // find: devuelve el item con ese id (o undefined si el producto no está en el carrito)
    buscarItem(id) {
        return this.items.find((item) => item.id === id)
    }

    // Si el producto ya está en el carrito suma una unidad; si no, lo agrega con cantidad 1
    agregar(producto) {
        const item = this.buscarItem(producto.id)
        if (item) {
            item.cantidad++
        } else {
            // Destructuring: del producto solo se guardan los datos que necesita el carrito
            const { id, nombre, precio, imagen } = producto
            this.items.push({ id, nombre, precio, imagen, cantidad: 1 })
        }
    }

    // Cambia la cantidad de un item (los límites los valida quien llama: mínimo 1 y máximo el stock)
    cambiarCantidad(id, cantidad) {
        const item = this.buscarItem(id)
        if (item) {
            item.cantidad = cantidad
        }
    }

    // filter: se queda con todos los items menos el que tiene ese id
    quitar(id) {
        this.items = this.items.filter((item) => item.id !== id)
    }

    vaciar() {
        this.items = []
    }

    // reduce: suma precio × cantidad de cada item, empezando desde 0
    calcularTotal() {
        return this.items.reduce((acumulado, item) => acumulado + item.precio * item.cantidad, 0)
    }

    // reduce: suma las unidades de todos los items (para el contador del carrito)
    contarUnidades() {
        return this.items.reduce((acumulado, item) => acumulado + item.cantidad, 0)
    }

    estaVacio() {
        return this.items.length === 0
    }
}
