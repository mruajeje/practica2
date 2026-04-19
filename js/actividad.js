window.onload = async () => {
    // 1. OBTENCIÓN DEL ID Y REDIRECCIÓN (Punto 7.a) [cite: 108, 109]
    const parametros = new URLSearchParams(window.location.search);
    const idActividad = parametros.get('id');

    if (!idActividad || isNaN(idActividad)) {
        window.location.href = 'index.html';
        return;
    }

    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    
    // Variables de estado para el carrusel (Punto 7.c) [cite: 116, 117]
    let fotosActividad = [];
    let fotoActualIndex = 0;

    // --- CARGA INICIAL DE DATOS ---
    try {
        // Datos básicos de la actividad (7.b) [cite: 110, 111]
        const resAct = await fetch(`api/actividades/${idActividad}`);
        const dataAct = await resAct.json();
        if (dataAct.RESULTADO === 'OK') pintarDatosBasicos(dataAct.FILAS[0]);

        // Fotos para el carrusel (7.c) [cite: 115]
        const resFotos = await fetch(`api/actividades/${idActividad}/fotos`);
        const dataFotos = await resFotos.json();
        if (dataFotos.RESULTADO === 'OK') {
            fotosActividad = dataFotos.FILAS;
            actualizarVisorFoto(); // Iniciamos el carrusel
        }

        // Categorías asignadas (7.d) [cite: 122]
        const resCat = await fetch(`api/actividades/${idActividad}/categorias`);
        const dataCat = await resCat.json();
        if (dataCat.RESULTADO === 'OK') pintarCategorias(dataCat.FILAS);

        // Comentarios (7.e) [cite: 123, 125]
        cargarComentarios();

        // Carga condicional del formulario (7.f) [cite: 126, 130]
        gestionarFormularioComentario();

    } catch (error) {
        console.error("Error en la carga:", error);
    }

    // --- GESTIÓN DEL CARRUSEL (Punto 7.c) [cite: 116, 117] ---
    function actualizarVisorFoto() {
        const contenedor = document.getElementById('contenedor-galeria');
        if (fotosActividad.length === 0) {
            contenedor.innerHTML = '<p>No hay fotos disponibles.</p>';
            return;
        }

        const foto = fotosActividad[fotoActualIndex];
        contenedor.innerHTML = `
            <h3>Galería de imágenes</h3>
            <div class="carousel">
                <div class="photo-container">
                    <img src="./fotos/actividades/${foto.archivo}" alt="Imagen ${fotoActualIndex + 1}" class="img-carrusel">
                    <p class="foto-descripcion"><em>${foto.descripcion}</em></p>
                </div>
                <div class="carousel-nav">
                    <button id="btn-ant" class="btn-nav" ${fotoActualIndex === 0 ? 'disabled' : ''}>Anterior</button>
                    <span>${fotoActualIndex + 1} / ${fotosActividad.length}</span>
                    <button id="btn-sig" class="btn-nav" ${fotoActualIndex === fotosActividad.length - 1 ? 'disabled' : ''}>Siguiente</button>
                </div>
            </div>`;

        document.getElementById('btn-ant').onclick = () => {
            if (fotoActualIndex > 0) { fotoActualIndex--; actualizarVisorFoto(); }
        };
        document.getElementById('btn-sig').onclick = () => {
            if (fotoActualIndex < fotosActividad.length - 1) { fotoActualIndex++; actualizarVisorFoto(); }
        };
    }

    // --- RENDERIZADO DE DATOS ---
    function pintarDatosBasicos(act) {
        document.getElementById('nombre-actividad').textContent = act.nombre;
        document.getElementById('descripcion-actividad').textContent = act.descripcion;
        document.getElementById('lugar-actividad').textContent = act.lugar;
        document.getElementById('autor-nombre').textContent = act.autor;
        document.getElementById('autor-foto').src = `./fotos/usuarios/${act.foto_autor}`;
        document.getElementById('valoracion-media').textContent = act.valoracion_media || "Sin valorar";
    }

    function pintarCategorias(categorias) {
        const contenedor = document.getElementById('lista-categorias');
        contenedor.innerHTML = '';
        categorias.forEach(cat => {
            contenedor.innerHTML += `<span class="badge-categoria">${cat.nombre}</span> `;
        });
    }

    async function cargarComentarios() {
        const res = await fetch(`api/actividades/${idActividad}/comentarios`);
        const data = await res.json();
        if (data.RESULTADO === 'OK') {
            const lista = document.getElementById('contenedor-lista-comentarios');
            document.getElementById('titulo-comentarios').textContent = `Comentarios (${data.FILAS.length})`; // [cite: 125]
            lista.innerHTML = '';
            data.FILAS.forEach(c => {
                lista.innerHTML += `
                    <div class="comment-card">
                        <img src="./fotos/usuarios/${c.foto_autor}" class="img-autor-comentario">
                        <div class="comment-content">
                            <strong>${c.login}</strong> - <small>${formatearFecha(c.fecha_hora)}</small>
                            <p>${c.texto}</p>
                            <p>Valoración: ${c.valoracion}/5</p>
                        </div>
                    </div>`;
            });
        }
    }

    // --- FORMULARIO Y SEGURIDAD (7.f y 7.g) [cite: 126, 134] ---
    async function gestionarFormularioComentario() {
        const contenedor = document.getElementById('contenedor-interaccion');
        if (!token) {
            contenedor.innerHTML = `<p>Para dejar un comentario debes <a href="login.html">hacer login</a>.</p>`; // [cite: 128, 129]
        } else {
            const resHtml = await fetch('comentario_form.html'); // [cite: 130]
            contenedor.innerHTML = await resHtml.text();
            prepararEnvioComentario();
        }
    }

    function prepararEnvioComentario() {
        const form = document.getElementById('form-comentario');
        form.onsubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(form);
            const res = await fetch(`api/actividades/${idActividad}/comentarios`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }, // [cite: 134, 207]
                body: new URLSearchParams(fd)
            });
            const data = await res.json();
            if (data.RESULTADO === 'OK') {
                form.reset();
                mostrarModal("Éxito", "Comentario guardado correctamente."); // [cite: 138]
                cargarComentarios(); // [cite: 136]
            }
        };
    }

    function formatearFecha(f) {
        const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        const d = new Date(f);
        return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}, ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`; // [cite: 124]
    }

    function mostrarModal(tit, txt) {
        document.getElementById('modal-titulo').textContent = tit;
        document.getElementById('modal-texto').textContent = txt;
        const m = document.getElementById('modal-mensaje');
        m.style.display = 'flex';
        document.getElementById('modal-btn-cerrar').onclick = () => m.style.display = 'none';
    }
};