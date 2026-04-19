window.onload = function() {    
    // 1. Redirigir si ya hay token (Punto 2.c del enunciado) [cite: 55, 60]
    var token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
        window.location.href = 'index.html';
        return; 
    }

    // --- LÓGICA DEL OJITO ---
    var botonesToggle = document.querySelectorAll('.toggle-password');
    
    botonesToggle.forEach(function(btn) {
        btn.onclick = function(e) {
            // Buscamos el input que está justo antes o en el mismo grupo
            var contenedor = e.currentTarget.parentElement;
            var input = contenedor.querySelector('input');
            var icono = e.currentTarget.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text'; // Mostramos texto [cite: 63]
                if (icono) {
                    icono.className = 'fa-solid fa-eye'; // Cambiamos a ojo abierto
                }
            } else {
                input.type = 'password'; // Ocultamos texto [cite: 63]
                if (icono) {
                    icono.className = 'fa-solid fa-eye-slash'; // Cambiamos a ojo tachado
                }
            }
        };
    });

    // 2. ENVÍO DEL FORMULARIO (Punto 5.a) [cite: 77]
    var loginForm = document.querySelector('.auth-form');
    if (loginForm) {
        loginForm.onsubmit = function(e) {
            e.preventDefault(); 

            var valLogin = document.getElementById('login').value;
            var valPwd = document.getElementById('pwd').value;
            var recordar = document.querySelector('input[name="recordar"]').checked;

            var params = new URLSearchParams();
            params.append('login', valLogin);
            params.append('pwd', valPwd);
            if (recordar) params.append('recordar', 'on');

            fetch('api/usuarios/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params 
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.RESULTADO === 'OK') {
                    // Guardar según Punto 5.b [cite: 83]
                    var storage = recordar ? localStorage : sessionStorage;
                    storage.setItem('token', data.TOKEN);
                    storage.setItem('usuario', data.LOGIN);
                    
                    // Mensaje modal obligatorio (Punto 5.b) [cite: 81, 41]
                    document.getElementById('modal-titulo').textContent = 'Éxito';
                    document.getElementById('modal-texto').textContent = 'Bienvenido ' + data.LOGIN;
                    document.getElementById('modal-mensaje').style.display = 'flex';
                    document.getElementById('modal-btn-cerrar').onclick = function() {
                        window.location.href = 'index.html';
                    };
                } else {
                    // Error (Punto 5.b) [cite: 80]
                    alert("Error: " + data.DESCRIPCION); // Cambiar por tu modal si ya lo tienes
                }
            });
        };
    }
};