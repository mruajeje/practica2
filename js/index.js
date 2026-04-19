window.onload = function() {
    // 1. GESTIÓN DE SESIÓN Y MENÚ
    var token = sessionStorage.getItem('token') || localStorage.getItem('token');

    // Buscamos los elementos del menú por su enlace
    var liLogin = document.querySelector('a[href="login.html"]');
    var liRegistro = document.querySelector('a[href="registrar.html"]');
    var liNueva = document.querySelector('a[href="nueva.html"]');
    
    // Para el Logout, buscamos el enlace que contenga el texto o la función
    var enlaces = document.querySelectorAll('.main-nav a');
    var liLogout = null;
    for (var i = 0; i < enlaces.length; i++) {
        if (enlaces[i].textContent.toLowerCase().includes('logout') || enlaces[i].getAttribute('onclick')) {
            liLogout = enlaces[i].parentElement;
        }
    }

    if (token) {
        if (liLogin) liLogin.parentElement.style.display = 'none';
        if (liRegistro) liRegistro.parentElement.style.display = 'none';
        if (liLogout) liLogout.style.display = 'block';
        if (liNueva) liNueva.parentElement.style.display = 'block';
    } else {
        if (liLogin) liLogin.parentElement.style.display = 'block';
        if (liRegistro) liRegistro.parentElement.style.display = 'block';
        if (liLogout) liLogout.style.display = 'none';
        if (liNueva) liNueva.parentElement.style.display = 'none';
    }

    // 2. CARGA DE ACTIVIDADES (Paginación)
    var contenedor = document.getElementById('contenedor-actividades');
    var infoPaginacion = document.getElementById('info-paginacion');
    var btnMostrarMas = document.getElementById('btn-mostrar-mas');
    
    var registroActual = 0;
    var cantidadPorPagina = 6;
    var totalActividades = 0;

    function cargarActividades(esInicio) {
        if (esInicio) {
            registroActual = 0;
            if (contenedor) contenedor.innerHTML = '';
        }

        var url = 'api/get/actividades.php?reg=' + registroActual + '&cant=' + cantidadPorPagina;

        fetch(url)
            .then(function(res) {
                return res.json();
            })
            .then(function(data) {
                if (data.RESULTADO === 'OK') {
                    totalActividades = data.TOTAL_COINCIDENCIAS;
                    renderizarActividades(data.FILAS);
                    registroActual += data.FILAS.length;
                    actualizarInterfazPaginacion();
                }
            })
            .catch(function(err) {
                console.error("Error al cargar actividades:", err);
            });
    }

    function renderizarActividades(actividades) {
        if (!contenedor) return;
        actividades.forEach(function(act) {
            var article = document.createElement('article');
            article.className = 'activity-card';
            article.innerHTML = 
                '<a href="actividad.html?id=' + act.id + '" class="img-link">' +
                    '<img src="./fotos/actividades/' + act.foto + '" alt="' + act.nombre + '" class="activity-img">' +
                '</a>' +
                '<div class="activity-info">' +
                    '<h3 class="activity-title"><a href="actividad.html?id=' + act.id + '">' + act.nombre + '</a></h3>' +
                '</div>';
            contenedor.appendChild(article);
        });
    }

    function actualizarInterfazPaginacion() {
        if (infoPaginacion) {
            infoPaginacion.textContent = 'Mostrando ' + registroActual + ' de ' + totalActividades + ' actividades';
        }
        if (btnMostrarMas) {
            btnMostrarMas.style.display = (registroActual < totalActividades) ? 'inline-block' : 'none';
            btnMostrarMas.disabled = false;
            btnMostrarMas.textContent = "Mostrar más";
        }
    }

    if (btnMostrarMas) {
        btnMostrarMas.onclick = function() {
            btnMostrarMas.disabled = true;
            btnMostrarMas.textContent = "Cargando...";
            cargarActividades(false);
        };
    }

    // Lanzar carga inicial
    cargarActividades(true);
};