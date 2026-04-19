window.onload = () => {
    const form = document.getElementById('form-registro');
    const inputUser = document.getElementById('username');
    const inputPhoto = document.getElementById('user-photo');
    const photoPreview = document.getElementById('photo-preview');

    // Funcionalidad de los botones de ojo (ver contraseña)
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.onclick = (e) => {
            const input = e.currentTarget.parentElement.querySelector('input');
            input.type = input.type === 'password' ? 'text' : 'password';
            e.currentTarget.querySelector('i').classList.toggle('fa-eye-slash');
        };
    });

    // 1. Comprobar disponibilidad del login (Punto 6.a)
    inputUser.onblur = async () => {
        const login = inputUser.value.trim();
        if (login.length < 4) return;

        try {
            const res = await fetch(`api/usuarios/${login}`);
            const data = await res.json();
            const errorMsg = document.getElementById('error-login');

            if (data.DISPONIBLE === false) {
                errorMsg.style.display = 'block';
                inputUser.style.borderColor = '#d9534f';
            } else {
                errorMsg.style.display = 'none';
                inputUser.style.borderColor = '';
            }
        } catch (e) { console.error("Error al validar usuario", e); }
    };

    // 2. Control de foto y límite 200KB (Punto 6.c)
    document.getElementById('btn-trigger-upload').onclick = () => inputPhoto.click();
    document.getElementById('area-foto').onclick = () => inputPhoto.click();

    inputPhoto.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 200 * 1024) { // Límite 200KB
                mostrarModal("Error", "La imagen no puede superar los 200KB.");
                inputPhoto.value = '';
                photoPreview.src = './img/usuarioRegistro.png';
                return;
            }
            const reader = new FileReader();
            reader.onload = (ev) => photoPreview.src = ev.target.result;
            reader.readAsDataURL(file);
        }
    };

    // Botón Eliminar Foto
    document.getElementById('remove-photo').onclick = () => {
        inputPhoto.value = '';
        photoPreview.src = './img/usuarioRegistro.png';
    };

    // 3. Envío del Registro (Punto 6.d)
    form.onsubmit = async (e) => {
        e.preventDefault();

        // Validación de contraseñas (Punto 6.b)
        const p1 = document.getElementById('password').value;
        const p2 = document.getElementById('password-confirm').value;

        if (p1 !== p2) {
            mostrarModal("Atención", "Las contraseñas no coinciden.");
            return;
        }

        const fd = new FormData(form);

        try {
            const res = await fetch('api/post/usuarios/registro', {
                method: 'POST', 
                body: fd });
            const data = await res.json();

            if (data.RESULTADO === 'OK') {
                mostrarModal("Éxito", "Usuario registrado correctamente.");
                document.getElementById('modal-btn-cerrar').onclick = () => {
                    window.location.href = 'login.html';
                };
            } else {
                mostrarModal("Error", data.DESCRIPCION || "Error en el registro.");
            }
        } catch (err) {
            mostrarModal("Error", "No se pudo conectar con el servidor.");
        }
    };

    // Función auxiliar para el Modal
    function mostrarModal(titulo, texto) {
        document.getElementById('modal-titulo').innerText = titulo;
        document.getElementById('modal-texto').innerText = texto;
        document.getElementById('modal-registro').style.display = 'flex';
        document.getElementById('modal-btn-cerrar').onclick = () => {
            document.getElementById('modal-registro').style.display = 'none';
        };
    }
};