# Tienda en Cuotas – Entrega Final

Entrega Final del curso de JavaScript de Coderhouse: **Aplicación Web Interactiva**.

Es la versión final del **Simulador de Cuotas** que fue creciendo en cada pre-entrega, convertido en una
**tienda online** con el circuito de compra completo. Todos los planes son **sin interés** (`precio / cuotas`).

## Cómo abrirlo (configuración previa)

Los productos se cargan con `fetch` desde `data/catalogo.json`, y el navegador bloquea `fetch` de archivos locales
si se abre el `index.html` con doble click (`file://`). Hay que abrirlo con un servidor, por ejemplo con la extensión
**Live Server** de VS Code (click derecho sobre `index.html` → *Open with Live Server*).
Si se abre sin servidor, la tienda muestra el error "no se pudo conectar con el servidor" y un botón para reintentar.

## El circuito de compra

| Paso | Qué hace el usuario |
|---|---|
| 1. Elegí tus productos | Ve el catálogo (traído del JSON), lo filtra por nombre o categoría y toca **Agregar al carrito** |
| 2. Tu carrito | Modifica las cantidades con **−** y **+** (entre 1 y el stock), quita productos con **✖** o vacía el carrito |
| Total | Ve el total, su equivalente en dólares (API) y elige pagarlo en 1, 3, 6 o 12 cuotas sin interés |
| 3. Confirmá tu compra | Completa nombre y email, toca **Confirmar compra**, revisa el detalle en el cartel y confirma |
| 4. Mis compras | La compra queda en el historial con su número; el stock baja. Se puede **cancelar** una compra (el stock vuelve) o **borrar el historial** |

El carrito, las compras y el plan de cuotas elegido quedan guardados: al recargar la página (F5) siguen ahí.

## Dónde está cada punto de la consigna

| Consigna | Dónde está |
|---|---|
| Estructura | `index.html` es el único archivo suelto (además de este README); el resto está en `css/`, `js/`, `data/` y `assets/` |
| `assets/` | `assets/img/`: el logo y una ilustración SVG por producto |
| 2 a 3 archivos `.js` | `js/clases.js` (clases `Producto` y `Carrito`), `js/datos.js` (fetch y localStorage) y `js/main.js` (DOM y eventos). Se cargan en ese orden con `defer` |
| `.json` como base de datos | `data/catalogo.json`: los productos (array de objetos) y los planes de cuotas. Ningún array de objetos está escrito en el JS |
| DOM e interacción | Todo se dibuja con `createElement` + `innerHTML` (`renderizarCatalogo`, `renderizarCarrito`, `renderizarCompras`) y responde a eventos `click`, `input`, `change` y `submit`. No hay `prompt`, `alert` ni `confirm` |
| Funciones de orden superior | `map` (convertir el JSON en `Producto`, opciones de los select), `filter` (buscador y categorías, quitar del carrito, cancelar compra), `find` (buscar producto / item), `reduce` (total y unidades del carrito), `forEach` (renderizar, descontar y devolver stock) |
| Storage | En `datos.js`: `leerStorage` (recuperar), `guardarStorage` (guardar / modificar con `setItem`) y `borrarStorage` (`removeItem`). Guardar: agregar al carrito y confirmar compra. Modificar: cambiar cantidades. Borrar: quitar un producto, cancelar una compra. Vaciar: vaciar carrito y borrar historial |
| Ternario | `textoCuotas`, clases de las tarjetas sin stock, botones deshabilitados, total en dólares |
| OR (`\|\|`) | `JSON.parse(...) \|\| []` en `leerStorage`, `cantidadEnCarrito`, `parseInt(selectCuotas.value) \|\| 1`, plan guardado `\|\| "1"` |
| Destructuring | En casi todas las funciones: `const { id, nombre, ... } = producto`, en los parámetros (`({ id, nombre })`), anidado (`comprador: { nombre, email }`) y con nuevo nombre (`planesDeCuotas: planes`) |
| `fetch` + `async/await` + `try/catch/finally` | `pedirDatos(url)` en `datos.js`. `cargarCatalogo()` y `cargarCotizacion()` en `main.js` |
| Manejo de errores de carga | Si `respuesta.ok` es `false` se lanza un `Error`; `explicarError()` distingue error del servidor (404), sin conexión (`TypeError`) y datos dañados (`SyntaxError`). Se muestra un SweetAlert y un botón **Reintentar**; el carrito guardado se sigue viendo pero no se puede confirmar. Si falla la API del dólar, la tienda sigue funcionando |
| Librerías | **Toastify** para los avisos de cada acción y **SweetAlert2** para confirmar (vaciar, comprar, cancelar) y para el error de carga. Por CDN con versión fija |
| API externa | Cotización del dólar oficial de [DolarApi](https://dolarapi.com) para mostrar el total en dólares |

### Cómo probar los errores

- **Archivo no encontrado (404):** renombrá `data/catalogo.json` y recargá la página.
- **Sin conexión:** abrí el `index.html` con doble click (sin servidor).
- **Datos dañados en el storage:** en la consola ejecutá `localStorage.setItem("carrito", "{roto")` y recargá: se descarta y el carrito arranca vacío.

## Estructura

```
├── index.html          # enlaza las librerías (CDN), el CSS y los 3 JS (con defer)
├── assets/
│   └── img/            # logo y una imagen SVG por producto
├── css/
│   └── style.css       # colores en variables, grilla responsive, carrito y ajustes de las librerías
├── data/
│   └── catalogo.json   # los productos y los planes de cuotas (la "base de datos" que se trae con fetch)
├── js/
│   ├── clases.js       # clases Producto y Carrito
│   ├── datos.js        # fetch (pedirDatos, explicarError) y localStorage (leer, guardar, borrar)
│   └── main.js         # estado, renderizado, acciones del usuario y eventos
└── README.md
```

## Autor

Benjamín Murillo
