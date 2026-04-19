window.onload = async () => {
    // 1. GESTIÓN DEL MENÚ (Consistencia visual)
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    // ... (Aquí puedes mantener tu lógica de menús del index.js)

    // 2. REFERENCIAS AL DOM
    const form = document.getElementById('form-busqueda');
    const contenedor = document.getElementById('contenedor-actividades');
    const infoPaginacion = document.getElementById('info-paginacion');
    const btnMostrarMas = document.getElementById('btn-mostrar-mas');
    
    // Filtros del formulario
    const inputTexto = document.getElementById('filtro-texto');
    const inputLugar = document.getElementById('filtro-lugar');
    const inputAutor = document.getElementById('filtro-autor');
    const inputCategoria = document.getElementById('filtro-categoria');

    // Variables de estado
    let registroActual = 0;
    const cantidadPorPagina = 6;
    let totalActividades = 0;

    // 3. LECTOR DE URL (Requisito 8.a) [cite: 141-146]
    const paramsURL = new URLSearchParams(window.location.search);
    if (paramsURL.has('lugar') && inputLugar) inputLugar.value = paramsURL.get('lugar');
    if (paramsURL.has('autor') && inputAutor) inputAutor.value = paramsURL.get('autor');
    if (paramsURL.has('categoria') && inputCategoria) inputCategoria.value = paramsURL.get('categoria');

    // 4. FUNCIÓN DE CARGA Y BÚSQUEDA (Requisito 8.b y 151) [cite: 147-151]
    async function cargarActividades(reset = false) {
        if (reset) {
            registroActual = 0;
            contenedor.innerHTML = '<p>Buscando...</p>'; 
        }

        const t = inputTexto?.value.trim() || '';
        const l = inputLugar?.value.trim() || '';
        const a = inputAutor?.value.trim() || '';
        const c = inputCategoria?.value.trim() || '';

        // Usamos la ruta física para asegurar la conexión en tu servidor
        let url = `api/get/actividades.php?reg=${registroActual}&cant=${cantidadPorPagina}`;
        if (t) url += `&t=${encodeURIComponent(t)}`;
        if (l) url += `&l=${encodeURIComponent(l)}`;
        if (a) url += `&a=${encodeURIComponent(a)}`;
        if (c) url += `&c=${encodeURIComponent(c)}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.RESULTADO === 'OK') {
                if (reset) contenedor.innerHTML = '';
                totalActividades = data.TOTAL_COINCIDENCIAS;
                
                if (totalActividades === 0 && reset) {
                    contenedor.innerHTML = '<p>No se han encontrado resultados para esta búsqueda.</p>';
                } else {
                    renderizarActividades(data.FILAS);
                    registroActual += data.FILAS.length;
                }
                actualizarInterfazPaginacion();
            }
        } catch (error) {
            console.error("Error:", error);
            contenedor.innerHTML = '<p>Hubo un problema al conectar con el servidor.</p>';
        }
    }

    function renderizarActividades(actividades) {
        actividades.forEach(act => {
            const card = document.createElement('article');
            card.className = 'activity-card';
            card.innerHTML = `
                <a href="actividad.html?id=${act.id}">
                    <img src="./fotos/actividades/${act.foto}" class="activity-img">
                </a>
                <div class="activity-info">
                    <h3><a href="actividad.html?id=${act.id}">${act.nombre}</a></h3>
                    <p><i class="fa-solid fa-location-dot"></i> ${act.lugar}</p>
                    <p><i class="fa-solid fa-user"></i> ${act.autor}</p>
                </div>`;
            contenedor.appendChild(card);
        });
    }

    function actualizarInterfazPaginacion() {
        if(infoPaginacion) infoPaginacion.textContent = `Mostrando ${registroActual} de ${totalActividades} resultados`;
        if(btnMostrarMas) {
            btnMostrarMas.style.display = (registroActual < totalActividades) ? 'inline-block' : 'none';
            btnMostrarMas.disabled = false;
        }
    }

    // EVENTOS
    if(btnMostrarMas) btnMostrarMas.onclick = () => cargarActividades();
    if(form) form.onsubmit = (e) => { e.preventDefault(); cargarActividades(true); };

    // Carga inicial (lee la URL o muestra todo)
    cargarActividades(true);

    // 5. CARGAR CATEGORÍAS (Requisito 9.a) [cite: 153]
    try {
        const resCat = await fetch('api/get/categorias.php');
        const dataCat = await resCat.json();
        if (dataCat.RESULTADO === 'OK') {
            const dl = document.getElementById('sugerencias-categorias');
            dataCat.FILAS.forEach(cat => dl.innerHTML += `<option value="${cat.nombre}">`);
        }
    } catch (e) { console.error(e); }
};