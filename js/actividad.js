window.onload = function() {
    var parametros = new URLSearchParams(window.location.search);
    var idActividad = parametros.get('id');

    // 7.a: Comprobación de ID en la URL [cite: 108, 109]
    if (!idActividad || isNaN(idActividad)) {
        window.location.href = 'index.html';
        return;
    }

    var token = sessionStorage.getItem('token') || localStorage.getItem('token');
    var fotosActividad = [];
    var fotoActualIndex = 0;

    // --- CADENA DE CARGA CON PROMESAS (Sin async/await) [cite: 7] ---
    fetch('api/actividades/' + idActividad)
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.RESULTADO === 'OK') pintarDatosBasicos(data.FILAS[0]); // 7.b
            return fetch('api/actividades/' + idActividad + '/fotos');
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.RESULTADO === 'OK') {
                fotosActividad = data.FILAS;
                actualizarVisorFoto(); // 7.c
            }
            return fetch('api/actividades/' + idActividad + '/categorias');
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.RESULTADO === 'OK') pintarCategorias(data.FILAS); // 7.d
            return fetch('api/actividades/' + idActividad + '/comentarios');
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.RESULTADO === 'OK') pintarComentarios(data.FILAS); // 7.e
            gestionarFormularioComentario(); // 7.f
        })
        .catch(function(err) { console.error("Error en la carga:", err); });

    // --- FUNCIONES DE RENDERIZADO ---

    function pintarDatosBasicos(act) {
        document.getElementById('contenedor-detalles').innerHTML = 
            '<h2 class="detail-title">' + act.nombre + '</h2>' +
            '<div class="detail-meta">' +
                '<span><i class="fa-solid fa-location-dot"></i> ' + act.lugar + '</span>' +
                '<span><i class="fa-solid fa-calendar-days"></i> ' + act.fecha_alta + '</span>' +
            '</div>' +
            '<p class="detail-description">' + act.descripcion + '</p>';
    }

    function actualizarVisorFoto() {
        var contenedor = document.getElementById('contenedor-galeria');
        if (fotosActividad.length === 0) return;
        var foto = fotosActividad[fotoActualIndex];
        
        // 7.c: Carrusel (Solo una foto a la vez con descripción) [cite: 117]
        contenedor.innerHTML = 
            '<h3>Galería de Fotos</h3>' +
            '<div class="carousel-card">' +
                '<div class="image-wrapper">' +
                    '<img src="./fotos/actividades/' + foto.fichero + '" class="carousel-img-main">' +
                    '<div class="caption-overlay">' + foto.descripcion + '</div>' +
                '</div>' +
                '<div class="carousel-footer">' +
                    '<button id="btn-ant" class="btn-nav">Anterior</button>' +
                    '<span class="step-indicator">' + (fotoActualIndex + 1) + ' de ' + fotosActividad.length + '</span>' +
                    '<button id="btn-sig" class="btn-nav">Siguiente</button>' +
                '</div>' +
            '</div>';

        document.getElementById('btn-ant').disabled = (fotoActualIndex === 0);
        document.getElementById('btn-sig').disabled = (fotoActualIndex === fotosActividad.length - 1);

        document.getElementById('btn-ant').onclick = function() { fotoActualIndex--; actualizarVisorFoto(); };
        document.getElementById('btn-sig').onclick = function() { fotoActualIndex++; actualizarVisorFoto(); };
    }

    function pintarCategorias(cats) {
        var lista = document.getElementById('lista-categorias');
        if (!lista) return;
        lista.innerHTML = '';
        cats.forEach(function(c) {
            lista.innerHTML += '<span class="badge">' + c.nombre + '</span> ';
        });
    }

    function pintarComentarios(comentarios) {
        // 7.e: Título con número de comentarios [cite: 125]
        document.getElementById('titulo-comentarios').innerHTML = 'Comentarios (' + comentarios.length + ')';
        var lista = document.getElementById('contenedor-lista-comentarios');
        lista.innerHTML = '';
        comentarios.forEach(function(c) {
            var estrellas = '★'.repeat(c.valoracion) + '☆'.repeat(5 - c.valoracion);
            lista.innerHTML += 
                '<div class="comment-item">' +
                    '<strong>' + c.login + '</strong> <small>(' + formatearFecha(c.fecha_hora) + ')</small>' +
                    '<p>' + c.texto + '</p>' +
                    '<p style="color:orange">' + estrellas + '</p>' +
                '</div>';
        });
    }

    function gestionarFormularioComentario() {
        var div = document.getElementById('contenedor-interaccion-usuario');
        if (!token) {
            // 7.f: Usuario no logueado [cite: 128, 129]
            div.innerHTML = '<p>Para dejar un comentario debes <a href="login.html">hacer login</a>.</p>';
        } else {
            // 7.f: Usuario logueado (Carga de HTML externo) [cite: 130, 131]
            fetch('comentario_form.html')
                .then(function(r) { return r.text(); })
                .then(function(html) {
                    div.innerHTML = html;
                    document.getElementById('form-comentario').onsubmit = enviarComentario;
                });
        }
    }

    function enviarComentario(e) {
        e.preventDefault();
        var fd = new FormData(e.target);
        // 7.g: Guardar comentario con cabecera Authorization [cite: 134]
        fetch('api/actividades/' + idActividad + '/comentarios', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: new URLSearchParams(fd)
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.RESULTADO === 'OK') {
                e.target.reset();
                // 7.g.ii: Actualizar sin recargar [cite: 136]
                fetch('api/actividades/' + idActividad + '/comentarios')
                    .then(function(r) { return r.json(); })
                    .then(function(d) { pintarComentarios(d.FILAS); });
            }
        });
    }

    function formatearFecha(f) {
        // Formato: "8 de febrero de 2026, 12:45" [cite: 124]
        var d = new Date(f);
        var meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        return d.getDate() + " de " + meses[d.getMonth()] + " de " + d.getFullYear() + ", " + d.getHours() + ":" + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    }
};