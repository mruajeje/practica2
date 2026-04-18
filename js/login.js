document.addEventListener('DOMContentLoaded', () => {
    
    // 1. COMPROBAR SI YA ESTÁ LOGUEADO
    // Si ya hay un token (en session o local), no pinta nada en la página de login
    const tokenSession = sessionStorage.getItem('token');
    const tokenLocal = localStorage.getItem('token');
    
    if (tokenSession || tokenLocal) {
        window.location.href = 'index.html';
        return; // Detenemos la ejecución del script
    }

    // 2. REFERENCIAS AL DOM
    const loginForm = document.querySelector('.auth-form');
    
    // Referencias al Modal
    const modal = document.getElementById('modal-mensaje');
    const modalTitulo = document.getElementById('modal-titulo');
    const modalTexto = document.getElementById('modal-texto');
    const modalBtnCerrar = document.getElementById('modal-btn-cerrar');
    
    // Variable para saber si debemos redirigir al cerrar el modal
    let redirigirAlCerrar = false; 

    // Función auxiliar para mostrar el modal
    function mostrarModal(titulo, texto, redirigir = false) {
        modalTitulo.textContent = titulo;
        modalTexto.textContent = texto;
        redirigirAlCerrar = redirigir;
        modal.style.display = 'flex';
    }

    // Evento para cerrar el modal
    modalBtnCerrar.addEventListener('click', () => {
        modal.style.display = 'none';
        if (redirigirAlCerrar) {
            window.location.href = 'index.html';
        } else {
            // Si es un error, devolvemos el foco al campo login como pide el PDF
            document.getElementById('login').focus();
        }
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evitamos recargar la página

        // 1. EXTRACCIÓN BRUTAL DE DATOS (Campo por campo)
        const valLogin = document.getElementById('login').value;
        const valPwd = document.getElementById('pwd').value;
        const checkRecordar = document.querySelector('input[name="recordar"]').checked;

        // Comprobación visual en consola
        console.log("=== DATOS CAPTURADOS ===");
        console.log("Login:", valLogin);
        console.log("Pwd:", valPwd);
        console.log("Recordar:", checkRecordar);

        // 2. EMPAQUETADO PARA PHP (URLSearchParams puro)
        const dataForPHP = new URLSearchParams();
        dataForPHP.append('login', valLogin);
        dataForPHP.append('pwd', valPwd);
        if (checkRecordar) {
            dataForPHP.append('recordar', 'on');
        }

        try {
            // 3. ENVÍO AL SERVIDOR
            const response = await fetch('api/usuarios/login', {
                method: 'POST',
                body: dataForPHP 
            });

            const data = await response.json();

            // 4. GESTIÓN DE LA RESPUESTA
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
            mostrarModal('Error Fatal', 'El servidor no responde. ¿Está Apache encendido en XAMPP?', false);
            console.error('Error de fetch:', error);
        }
    });