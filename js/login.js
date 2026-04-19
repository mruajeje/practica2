window.onload = function() {
    var form = document.querySelector('.auth-form');

    // Lógica del ojito (la mantenemos igual)
    var btnToggle = document.querySelector('.toggle-password');
    if (btnToggle) {
        btnToggle.onclick = function() {
            var inputPwd = document.getElementById('pwd');
            var icono = this.querySelector('i');
            if (inputPwd.type === 'password') {
                inputPwd.type = 'text';
                icono.className = 'fa-solid fa-eye';
            } else {
                inputPwd.type = 'password';
                icono.className = 'fa-solid fa-eye-slash';
            }
        };
    }

    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            var loginVal = document.getElementById('login').value;
            var pwdVal = document.getElementById('pwd').value;
            var recordar = document.querySelector('input[name="recordar"]').checked;

            var params = new URLSearchParams();
            params.append('login', loginVal);
            params.append('pwd', pwdVal);
            if (recordar) params.append('recordar', 'on');

            fetch('api/usuarios/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (data.RESULTADO === 'OK') {
                    // Guardamos datos
                    var storage = recordar ? localStorage : sessionStorage;
                    storage.setItem('token', data.TOKEN);
                    storage.setItem('usuario', data.LOGIN);

                    // REDIRECCIÓN DIRECTA: Sin esperar a modales si fallan
                    window.location.href = 'index.html';
                } else {
                    alert("Error: " + data.DESCRIPCION);
                }
            })
            .catch(function(err) { console.error(err); });
        };
    }
};