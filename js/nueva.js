window.onload = function () {
    // 1. PROTECCIÓN DE ACCESO (Punto 2.c)
    var token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    var categoriasAsignadas = [];
    var fotosSeleccionadas = []; // Array de objetos { archivo: File, desc: String }

    // 2. CARGAR DATALIST DE CATEGORÍAS (Punto 9.a)
    fetch('api/categorias')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.RESULTADO === 'OK') {
                var dl = document.getElementById('existing-categories');
                data.FILAS.forEach(function (c) {
                    dl.innerHTML += '<option value="' + c.nombre + '">';
                });
            }
        });

    // 3. GESTIÓN DE CATEGORÍAS (Punto 9.b)
    var btnAddTag = document.getElementById('btn-add-tag');
    if (btnAddTag) {
        btnAddTag.onclick = function () {
            var input = document.getElementById('category-input');
            var val = input.value.trim();
            if (val && categoriasAsignadas.indexOf(val) === -1) {
                categoriasAsignadas.push(val);
                renderTags();
                input.value = '';
            }
        };
    }

    function renderTags() {
        var container = document.getElementById('assigned-tags-container');
        container.innerHTML = '';
        categoriasAsignadas.forEach(function (c, i) {
            var span = document.createElement('span');
            span.className = 'tag';
            span.innerHTML = c + ' <button type="button" onclick="eliminarTag(' + i + ')">&times;</button>';
            container.appendChild(span);
        });
    }

    window.eliminarTag = function (i) {
        categoriasAsignadas.splice(i, 1);
        renderTags();
    };

    // 4. GESTIÓN DE FOTOS (Puntos 9.c)
    var inputFile = document.getElementById('subir-ficha');
    var previewImg = document.getElementById('img-temp-preview');
    var btnSeleccionar = document.getElementById('btn-seleccionar');

    if (btnSeleccionar) btnSeleccionar.onclick = function () { inputFile.click(); };

    inputFile.onchange = function (e) {
        var file = e.target.files[0];
        if (file) {
            if (file.size > 200 * 1024) { // Límite 200KB 
                mostrarModal("Error de tamaño", "La foto no puede superar los 200KB.");
                inputFile.value = '';
                previewImg.src = 'img/ficha.png';
                return;
            }
            var reader = new FileReader();
            reader.onload = function (ev) { previewImg.src = ev.target.result; };
            reader.readAsDataURL(file);
        }
    };

    document.getElementById('btn-confirmar-foto').onclick = function () {
        var desc = document.getElementById('foto-desc-temp').value.trim();
        if (inputFile.files.length > 0 && desc !== "") {
            fotosSeleccionadas.push({ archivo: inputFile.files[0], desc: desc });
            renderFotos();
            // Limpiar ficha de entrada
            document.getElementById('foto-desc-temp').value = '';
            inputFile.value = '';
            previewImg.src = 'img/ficha.png';
        }
    };

    function renderFotos() {
        var list = document.getElementById('added-photos-list');
        list.innerHTML = '';
        fotosSeleccionadas.forEach(function (f, i) {
            var item = document.createElement('article');
            item.className = 'photo-item';
            // Usamos URL.createObjectURL para previsualizar sin cargar al servidor todavía
            var urlTemp = URL.createObjectURL(f.archivo);
            item.innerHTML =
                '<img src="' + urlTemp + '" alt="Foto">' +
                '<p>' + f.desc + '</p>' +
                '<button type="button" class="btn-delete" onclick="eliminarFoto(' + i + ')">Eliminar</button>';
            list.appendChild(item);
        });
    }

    window.eliminarFoto = function (i) {
        fotosSeleccionadas.splice(i, 1);
        renderFotos();
    };

    // 5. ENVÍO FINAL (Punto 9.d)
    var form = document.getElementById('form-nueva-actividad');
    form.onsubmit = function (e) {
        e.preventDefault();

        if (fotosSeleccionadas.length === 0) { // Requisito 176 [cite: 176]
            mostrarModal("Error", "Debes añadir al menos una foto.");
            return;
        }

        var fd = new FormData(form);

        // Añadir categorías al array (Punto 182) [cite: 182]
        categoriasAsignadas.forEach(function (c) {
            fd.append('categorias[]', c);
        });

        // Añadir fotos y descripciones (Puntos 189, 190) [cite: 189, 190]
        fotosSeleccionadas.forEach(function (f) {
            fd.append('fotos[]', f.archivo, f.archivo.name);
            fd.append('descripciones[]', f.desc);
        });

        fetch('api/actividades', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: fd
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.RESULTADO === 'OK') {
                    // Redirigir directamente a la página de la actividad usando el ID devuelto
                    // Formato: actividad.html?id=X
                    window.location.href = 'actividad.html?id=' + data.ID_ACTIVIDAD;
                } else {
                    alert("Error al crear: " + data.DESCRIPCION);
                }
            })
            .catch(function (err) { console.error(err); });

        function mostrarModal(titulo, texto) {
            document.getElementById('modal-titulo').textContent = titulo;
            document.getElementById('modal-texto').textContent = texto;
            document.getElementById('modal-mensaje').style.display = 'flex';
            document.getElementById('modal-btn-cerrar').onclick = function () {
                document.getElementById('modal-mensaje').style.display = 'none';
            };
        }
    };
}