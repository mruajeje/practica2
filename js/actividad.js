window.onload = async () => {
    
    // 1. CAPTURAR EL ID DE LA URL
    const parametros = new URLSearchParams(window.location.search);
    const idActividad = parametros.get('id');

    if (!idActividad) {
        document.getElementById('contenedor-detalles').innerHTML = '<h2>Error: No se ha especificado ninguna actividad.</h2>';
        return;
    }

    // 2. SEGURIDAD DEL FORMULARIO SEGÚN EL TOKEN
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const zonaFormulario = document.getElementById('zona-formulario-comentario');
    const zonaAviso = document.getElementById('zona-aviso-login');

    if (token) {
        if (zonaFormulario) zonaFormulario.style.display = 'block';
        if (zonaAviso) zonaAviso.style.display = 'none';
    } else {
        if (zonaFormulario) zonaFormulario.style.display = 'none';
        if (zonaAviso) zonaAviso.style.display = 'block';
    }

    // 3. OBTENER Y PINTAR DATOS
    try {
        // PETICIÓN DE LA ACTIVIDAD
        const peticionAct = await fetch(`api/actividades/${idActividad}`);
        const datosAct = await peticionAct.json();

        if (datosAct.RESULTADO === 'OK' && datosAct.FILAS.length > 0) {
            pintarActividad(datosAct.FILAS[0]);
        }

        // PETICIÓN DE LOS COMENTARIOS
        const peticionCom = await fetch(`api/actividades/${idActividad}/comentarios`);
        const datosCom = await peticionCom.json();

        if (datosCom.RESULTADO === 'OK') {
            pintarComentarios(datosCom.FILAS);
        }

    } catch (error) {
        console.error("Error al conectar con la API:", error);
    }

    // -----------------------------------------
    // FUNCIONES DE RENDERIZADO (DIBUJO)
    // -----------------------------------------

    function pintarActividad(act) {
        const contenedorDetalles = document.getElementById('contenedor-detalles');
        const contenedorGaleria = document.getElementById('contenedor-galeria');

        // Inyectamos la descripción y los metadatos reales
        contenedorDetalles.innerHTML = `
            <h2>${act.nombre}</h2>
            <section class="activity-description">
                <h3>Descripción de la experiencia</h3>
                <p>${act.descripcion}</p> 
            </section>
            <div class="activity-meta-links">
                <p class="meta-item"><i class="fa-solid fa-user"></i> Creado por: <span class="highlight-link">${act.autor}</span></p>
                <p class="meta-item"><i class="fa-solid fa-location-dot"></i> Lugar: <span class="highlight-link">${act.lugar}</span></p>
                <p class="meta-item"><i class="fa-regular fa-calendar"></i> Publicado: ${act.fecha_alta}</p>
            </div>
        `;

        // Inyectamos la foto principal
        contenedorGaleria.innerHTML = `
            <h3>Galería de Fotos</h3>
            <div class="photo-viewer">
                <img src="./fotos/actividades/${act.foto}" alt="${act.nombre}" class="main-photo">
            </div>
        `;
    }

    function pintarComentarios(comentarios) {
        const contenedor = document.getElementById('contenedor-lista-comentarios');
        const titulo = document.getElementById('titulo-comentarios');
        
        titulo.textContent = `Comentarios de usuarios (${comentarios.length})`;
        contenedor.innerHTML = ''; 

        if (comentarios.length === 0) {
            contenedor.innerHTML = '<p>Aún no hay opiniones. ¡Sé el primero!</p>';
            return;
        }

        comentarios.forEach(com => {
            // Usamos los nombres exactos: login, fecha_hora, texto, valoracion
            contenedor.innerHTML += `
                <article class="comment">
                    <div class="comment-header">
                        <div class="user-avatar-placeholder">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        <div class="comment-meta">
                            <span class="comment-author">${com.login}</span>
                            <span class="comment-date">${com.fecha_hora}</span>
                        </div>
                    </div>
                    <div class="comment-body">
                        <p>${com.texto}</p>
                    </div>
                    <div class="comment-rating">
                        Valoración: ${com.valoracion}/5 <i class="fa-solid fa-star"></i>
                    </div>
                </article>
            `;
        });
    }

    // --- LÓGICA PARA ENVIAR COMENTARIO ---
    const formulario = document.getElementById('form-comentario');
    if (formulario) {
        formulario.onsubmit = async (e) => {
            e.preventDefault(); // Evitamos que la página se recargue

            // Recogemos los datos del formulario
            const texto = document.getElementById('comment-text').value;
            const valoracion = formulario.querySelector('input[name="rating"]:checked')?.value;

            if (!valoracion) {
                alert("Por favor, selecciona una puntuación con las estrellas.");
                return;
            }

            // Preparamos los datos para enviar (según lo que pida tu API)
            const datosEnviar = new URLSearchParams();
            datosEnviar.append('id_actividad', idActividad);
            datosEnviar.append('texto', texto);
            datosEnviar.append('valoracion', valoracion);

            try {
                const response = await fetch(`api/actividades/${idActividad}/comentarios`, {
                    method: 'POST',
                    headers: {
                        'Authorization': token // IMPORTANTE: Enviamos el token para identificarnos
                    },
                    body: datosEnviar
                });

                const resultado = await response.json();

                if (resultado.RESULTADO === 'OK') {
                    alert("¡Comentario enviado con éxito!");
                    location.reload(); // Recargamos para que aparezca tu nuevo comentario
                } else {
                    alert("Error al enviar: " + resultado.DESCRIPCION);
                }
            } catch (error) {
                console.error("Error en la petición POST:", error);
            }
        };
    }
};