window.onload = function() {
    // 1. REFERENCIAS AL DOM
    var form = document.getElementById('form-busqueda');
    var contenedor = document.getElementById('contenedor-actividades');
    var infoPaginacion = document.getElementById('info-paginacion');
    var btnMostrarMas = document.getElementById('btn-mostrar-mas');
    
    var inputTexto = document.getElementById('filtro-texto');
    var inputLugar = document.getElementById('filtro-lugar');
    var inputAutor = document.getElementById('filtro-autor');
    var inputCategoria = document.getElementById('filtro-categoria');

    // Variables de estado
    var registroActual = 0;
    var cantidadPorPagina = 6;
    var totalActividades = 0;

    // 2. LECTOR DE URL (Requisito 8.a)
    var paramsURL = new URLSearchParams(window.location.search);
    if (paramsURL.has('lugar') && inputLugar) inputLugar.value = paramsURL.get('lugar');
    if (paramsURL.has('autor') && inputAutor) inputAutor.value = paramsURL.get('autor');
    if (paramsURL.has('categoria') && inputCategoria) inputCategoria.value = paramsURL.get('categoria');

    // 3. FUNCIÓN DE CARGA (Requisito 8.b) - SIN ASYNC
    function cargarActividades(reset) {
        if (reset) {
            registroActual = 0;
            contenedor.innerHTML = '<p>Buscando...</p>'; 
        }

        var t = inputTexto ? inputTexto.value.trim() : '';
        var l = inputLugar ? inputLugar.value.trim() : '';
        var a = inputAutor ? inputAutor.value.trim() : '';
        var c = inputCategoria ? inputCategoria.value.trim() : '';

        // Construcción manual de la URL
        var url = 'api/get/actividades.php?reg=' + registroActual + '&cant=' + cantidadPorPagina;
        if (t) url += '&t=' + encodeURIComponent(t);
        if (l) url += '&l=' + encodeURIComponent(l);
        if (a) url += '&a=' + encodeURIComponent(a);
        if (c) url += '&c=' + encodeURIComponent(c);

        fetch(url)
            .then(function(response) { 
                return response.json(); 
            })
            .then(function(data) {
                if (data.RESULTADO === 'OK') {
                    if (reset) contenedor.innerHTML = '';
                    totalActividades = data.TOTAL_COINCIDENCIAS;
                    
                    if (totalActividades === 0 && reset) {
                        contenedor.innerHTML = '<p>No se han encontrado resultados.</p>';
                    } else {
                        renderizarActividades(data.FILAS);
                        registroActual += data.FILAS.length;
                    }
                    actualizarInterfazPaginacion();
                }
            })
            .catch(function(error) {
                console.error("Error:", error);
                contenedor.innerHTML = '<p>Error al conectar con el servidor.</p>';
            });
    }

    function renderizarActividades(actividades) {
        actividades.forEach(function(act) {
            var card = document.createElement('article');
            card.className = 'activity-card';
            card.innerHTML = 
                '<a href="actividad.html?id=' + act.id + '">' +
                    '<img src="./fotos/actividades/' + act.foto + '" class="activity-img">' +
                '</a>' +
                '<div class="activity-info">' +
                    '<h3><a href="actividad.html?id=' + act.id + '">' + act.nombre + '</a></h3>' +
                    '<p><i class="fa-solid fa-location-dot"></i> ' + act.lugar + '</p>' +
                    '<p><i class="fa-solid fa-user"></i> ' + act.autor + '</p>' +
                '</div>';
            contenedor.appendChild(card);
        });
    }

    function actualizarInterfazPaginacion() {
        if (infoPaginacion) {
            infoPaginacion.textContent = 'Mostrando ' + registroActual + ' de ' + totalActividades + ' resultados';
        }
        if (btnMostrarMas) {
            btnMostrarMas.style.display = (registroActual < totalActividades) ? 'inline-block' : 'none';
            btnMostrarMas.disabled = false;
        }
    }

    // EVENTOS
    if (btnMostrarMas) {
        btnMostrarMas.onclick = function() { 
            cargarActividades(false); 
        };
    }
    
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            cargarActividades(true);
        };
    }

    // Carga inicial
    cargarActividades(true);

    // 4. CARGAR CATEGORÍAS EN DATALIST (Requisito 9.a)
    fetch('api/get/categorias.php')
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.RESULTADO === 'OK') {
                var dl = document.getElementById('sugerencias-categorias');
                if (dl) {
                    data.FILAS.forEach(function(cat) {
                        dl.innerHTML += '<option value="' + cat.nombre + '">';
                    });
                }
            }
        });
};