window.onload = async () => {
    // 1. Protección de acceso (Punto 152)
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) { window.location.href = 'index.html'; return; }

    let categorias = [];
    let fotosSeleccionadas = []; // Array de { archivo: File, desc: String }

    // 2. Cargar datalist (Punto 153)
    try {
        const res = await fetch('api/categorias');
        const data = await res.json();
        if (data.RESULTADO === 'OK') {
            const dl = document.getElementById('existing-categories');
            data.FILAS.forEach(c => dl.innerHTML += `<option value="${c.nombre}">`);
        }
    } catch (e) { console.error(e); }

    // 3. Gestión de Categorías (Punto 157)
    document.getElementById('btn-add-tag').onclick = () => {
        const input = document.getElementById('category-input');
        const val = input.value.trim();
        if (val && !categorias.includes(val)) {
            categorias.push(val);
            renderTags();
            input.value = '';
        }
    };

    function renderTags() {
        const container = document.getElementById('assigned-tags-container');
        container.innerHTML = categorias.map((c, i) => `
            <span class="tag">${c} <button type="button" onclick="eliminarTag(${i})">&times;</button></span>
        `).join('');
    }
    window.eliminarTag = (i) => { categorias.splice(i, 1); renderTags(); };

    // 4. Gestión de Fotos (Punto 161, 162)
    const inputFile = document.getElementById('subir-ficha');
    const previewImg = document.getElementById('img-temp-preview');

    document.getElementById('btn-seleccionar').onclick = () => inputFile.click();
    document.getElementById('preview-box').onclick = () => inputFile.click();

    inputFile.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 200 * 1024) { // Límite 200KB
                mostrarModal("Error de tamaño", "La foto no puede superar los 200KB.");
                e.target.value = '';
                previewImg.src = 'img/ficha.png';
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => previewImg.src = ev.target.result;
            reader.readAsDataURL(file);
        }
    };

    document.getElementById('btn-confirmar-foto').onclick = () => {
        const desc = document.getElementById('foto-desc-temp').value.trim();
        if (inputFile.files.length > 0 && desc !== "") {
            fotosSeleccionadas.push({ archivo: inputFile.files[0], desc: desc });
            renderFotos();
            // Limpiar ficha
            document.getElementById('foto-desc-temp').value = '';
            inputFile.value = '';
            previewImg.src = 'img/ficha.png';
        }
    };

    function renderFotos() {
        const list = document.getElementById('added-photos-list');
        list.innerHTML = fotosSeleccionadas.map((f, i) => `
            <article class="photo-item">
                <img src="${URL.createObjectURL(f.archivo)}" alt="Foto">
                <p>${f.desc}</p>
                <button type="button" class="btn-delete" onclick="eliminarFoto(${i})"><i class="fas fa-trash"></i> Eliminar</button>
            </article>
        `).join('');
    }
    window.eliminarFoto = (i) => { fotosSeleccionadas.splice(i, 1); renderFotos(); };

    // 5. Envío Final (Punto 178)
    document.getElementById('form-nueva-actividad').onsubmit = async (e) => {
        e.preventDefault();

        if (fotosSeleccionadas.length === 0) {
            mostrarModal("Error", "Debes añadir al menos una foto.");
            return;
        }

        const fd = new FormData(e.target);
        // Añadir arrays según Punto 182, 189, 190
        categorias.forEach(c => fd.append('categorias[]', c));
        // Busca este bloque y cámbialo por este para asegurar el envío del fichero
        fotosSeleccionadas.forEach((f, index) => {
            // Añadimos el tercer parámetro (f.archivo.name) para que PHP lo reconozca como FILE
            fd.append('fotos[]', f.archivo, f.archivo.name); 
            fd.append('descripciones[]', f.desc);
        });

        try {
            const res = await fetch('api/actividades', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: fd
            });
            const data = await res.json();
            if (data.RESULTADO === 'OK') {
                mostrarModal("Actividad guardada", `Se ha creado: ${data.NOMBRE}`);
                document.getElementById('modal-btn-cerrar').onclick = () => window.location.href = 'index.html';
            }
        } catch (err) { console.error(err); }
    };

    function mostrarModal(titulo, texto) {
        document.getElementById('modal-titulo').textContent = titulo;
        document.getElementById('modal-texto').textContent = texto;
        document.getElementById('modal-mensaje').style.display = 'flex';
        document.getElementById('modal-btn-cerrar').onclick = () => {
            document.getElementById('modal-mensaje').style.display = 'none';
        };
    }
};