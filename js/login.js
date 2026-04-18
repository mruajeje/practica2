window.onload = () => {    
    // 1. COMPROBAR SI YA ESTÁ LOGUEADO
    const tokenSession = sessionStorage.getItem('token');
    const tokenLocal = localStorage.getItem('token');
    
    if (tokenSession || tokenLocal) {
        window.location.href = 'index.html';
        return; 
    }

    // 2. REFERENCIAS AL DOM
    const loginForm = document.querySelector('.auth-form');
    const modal = document.getElementById('modal-mensaje');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalTexto = document.getElementById('modal-texto');
    const modalBtnCerrar = document.getElementById('modal-btn-cerrar');
    
    let redirigirAlCerrar = false; 

    function mostrarModal(titulo, texto, redirigir = false) {
        modalTitulo.textContent = titulo;
        modalTexto.textContent = texto;
        redirigirAlCerrar = redirigir;
        modal.style.display = 'flex';
    }

    modalBtnCerrar.addEventListener('click', () => {
        modal.style.display = 'none';
        if (redirigirAlCerrar) {
            window.location.href = 'index.html';
        } else {
            const loginInput = document.getElementById('login');
            if(loginInput) loginInput.focus();
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        // 1. Capturamos los datos limpios
        const valLogin = document.getElementById('login').value;
        const valPwd = document.getElementById('pwd').value;
        
        // Validación segura del checkbox
        const checkboxEl = document.querySelector('input[name="recordar"]');
        const checkRecordar = checkboxEl ? checkboxEl.checked : false;

        // 2. Preparamos el formato exacto que pide el servidor
        const dataForPHP = new URLSearchParams();
        dataForPHP.append('login', valLogin);
        dataForPHP.append('pwd', valPwd);
        if (checkRecordar) {
            dataForPHP.append('recordar', 'on');
        }

        try {
            // 3. Petición con la cabecera correcta
            const response = await fetch('api/usuarios/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: dataForPHP 
            });

            const data = await response.json();
            console.log("RESPUESTA DEL SERVIDOR:", data);

            // 4. Gestionamos el resultado
            if (data.RESULTADO === 'OK') {
                sessionStorage.clear();
                localStorage.clear();

                if (checkRecordar) {
                    localStorage.setItem('token', data.TOKEN);
                    localStorage.setItem('usuario', data.LOGIN);
                } else {
                    sessionStorage.setItem('token', data.TOKEN);
                    sessionStorage.setItem('usuario', data.LOGIN);
                }

                mostrarModal('Login Correcto', '¡Bienvenido, ' + data.LOGIN + '!', true);
            } else {
                mostrarModal('Error de Login', data.DESCRIPCION, false);
            }

        } catch (error) {
            mostrarModal('Error', 'No se pudo conectar con el servidor.', false);
            console.error("Error capturado:", error);
        }
    });
};