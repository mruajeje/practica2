window.onload = function() {
    var parametros = new URLSearchParams(window.location.search);
    var idActividad = parametros.get('id');

    if (!idActividad || isNaN(idActividad)) {
        window.location.href = 'index.html';
        return;
    }

    var token = sessionStorage.getItem('token') || localStorage.getItem('token');
    var fotosActividad = [];
    var fotoActualIndex = 0;

    // --- CADENA DE CARGA CON PROMESAS ---
    fetch('api/actividades/' + idActividad)
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.RESULTADO === 'OK') pintarDatosBasicos(data.FILAS[0]);
            return fetch('api/actividades/' + idActividad + '/fotos');
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.RESULTADO === 'OK') {
                fotosActividad = data.FILAS;
                actualizarVisorFoto();
            }
            return fetch('api/actividades/' + idActividad + '/comentarios');
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.RESULTADO === 'OK') pintarComentarios(data.FILAS);
            gestionarFormularioComentario();
        })
        .catch(function(err) { console.error("Error en la carga:", err); });

    // --- FUNCIONES VISUALES ---

    function pintarDatosBasicos(act) {
        var header = document.getElementById('contenedor-detalles');
        header.innerHTML = 
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
        contenedor.innerHTML = 
            '<div class="carousel-card">' +
                '<div class="image-wrapper">' +
                    '<img src="./fotos/actividades/' + foto.fichero + '" class="carousel-img-main">' +
                    '<div class="caption-overlay">' + foto.descripcion + '</div>' +
                '</div>' +
                '<div class="carousel-footer">' +
                    '<button id="btn-ant" class="btn-nav"><i class="fa-solid fa-chevron-left"></i> Anterior</button>' +
                    '<span class="step-indicator">Foto ' + (fotoActualIndex + 1) + ' de ' + fotosActividad.length + '</span>' +
                    '<button id="btn-sig" class="btn-nav">Siguiente <i class="fa-solid fa-chevron-right"></i></button>' +
                '</div>' +
            '</div>';

        document.getElementById('btn-ant').disabled = (fotoActualIndex === 0);
        document.getElementById('btn-sig').disabled = (fotoActualIndex === fotosActividad.length - 1);

        document.getElementById('btn-ant').onclick = function() { fotoActualIndex--; actualizarVisorFoto(); };
        document.getElementById('btn-sig').onclick = function() { fotoActualIndex++; actualizarVisorFoto(); };
    }

    function pintarComentarios(comentarios) {
        document.getElementById('titulo-comentarios').innerHTML = '<i class="fa-solid fa-comments"></i> Comentarios (' + comentarios.length + ')';
        var lista = document.getElementById('contenedor-lista-comentarios');
        lista.innerHTML = '';
        
        comentarios.forEach(function(c) {
            var estrellas = '';
            for(var i=0; i<5; i++) estrellas += (i < c.valoracion) ? '<i class="fa-solid fa-star" style="color:#f1c40f"></i>' : '<i class="fa-regular fa-star" style="color:#ccc"></i>';
            
            lista.innerHTML += 
                '<article class="comment-card-styled">' +
                    '<div class="comment-header">' +
                        '<img src="./fotos/usuarios/' + c.foto_autor + '" class="comment-avatar">' +
                        '<div>' +
                            '<strong>' + c.login + '</strong>' +
                            '<span class="comment-date">' + c.fecha_hora + '</span>' +
                        '</div>' +
                        '<div class="comment-stars">' + estrellas + '</div>' +
                    '</div>' +
                    '<p class="comment-body">' + c.texto + '</p>' +
                '</article>';
        });
    }

    function gestionarFormularioComentario() {
        var contenedor = document.getElementById('contenedor-interaccion-usuario');
        if (!token) {
            contenedor.innerHTML = '<div class="login-box-detail">Para participar, <a href="login.html">inicia sesión aquí</a></div>';
            return;
        }

        contenedor.innerHTML = 
            '<form id="form-comentario" class="styled-form">' +
                '<h3>¿Qué te ha parecido?</h3>' +
                '<textarea name="texto" required placeholder="Comparte tu experiencia..."></textarea>' +
                '<div class="form-row">' +
                    '<div class="rating-select">' +
                        '<label>Tu nota:</label>' +
                        '<select name="valoracion">' +
                            '<option value="5">★★★★★ Excelente</option>' +
                            '<option value="4">★★★★☆ Muy buena</option>' +
                            '<option value="3">★★★☆☆ Normal</option>' +
                            '<option value="2">★★☆☆☆ Mala</option>' +
                            '<option value="1">★☆☆☆☆ Muy mala</option>' +
                        '</select>' +
                    '</div>' +
                    '<button type="submit" class="btn-submit">Publicar ahora</button>' +
                '</div>' +
            '</form>';

        document.getElementById('form-comentario').onsubmit = enviarComentario;
    }

    function enviarComentario(e) {
        e.preventDefault();
        var fd = new FormData(e.target);
        fetch('api/actividades/' + idActividad + '/comentarios', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: new URLSearchParams(fd)
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.RESULTADO === 'OK') {
                e.target.reset();
                fetch('api/actividades/' + idActividad + '/comentarios')
                    .then(function(r) { return r.json(); })
                    .then(function(d) { pintarComentarios(d.FILAS); });
            }
        });
    }
};