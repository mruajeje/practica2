// 1. FUNCIÓN DE SALIDA BLINDADA (Debe ser global)
window.forzarSalida = function() {
    // Aniquilación absoluta de los datos de sesión
    sessionStorage.clear();
    localStorage.clear();
    
    // Redirección dura
    window.location.replace('index.html');
};

// 2. RENDERIZADO DEL MENÚ
function construirMenu() {
    let token = sessionStorage.getItem('token') || localStorage.getItem('token');

    // Destrucción de tokens basura
    if (token === 'null' || token === 'undefined' || token === '') {
        token = null;
    }

    const menuUl = document.querySelector('.main-nav ul');
    if (!menuUl) return;

    if (!token) {
        // ESTADO: DESCONECTADO
        menuUl.innerHTML = `
            <li><a href="index.html"><i class="fa-solid fa-house"></i> Inicio</a></li>
            <li><a href="buscar.html"><i class="fa-solid fa-magnifying-glass"></i> Buscar</a></li>
            <li><a href="login.html"><i class="fa-solid fa-user"></i> Login</a></li>
            <li><a href="registrar.html"><i class="fa-solid fa-user-plus"></i> Crear cuenta</a></li>
        `;
    } else {
        // ESTADO: CONECTADO
        const nombre = sessionStorage.getItem('usuario') || 'Usuario';
        
        // Fíjate en el href y el onclick. Es imposible que el navegador lo ignore.
        menuUl.innerHTML = `
            <li><a href="index.html"><i class="fa-solid fa-house"></i> Inicio</a></li>
            <li><a href="buscar.html"><i class="fa-solid fa-magnifying-glass"></i> Buscar</a></li>
            <li><a href="nueva.html"><i class="fa-solid fa-plus"></i> Nueva</a></li>
            <li><a href="#" onclick="forzarSalida(); return false;"><i class="fa-solid fa-right-from-bracket"></i> Logout (${nombre})</a></li>
        `;
    }
}

// Ejecución inmediata
construirMenu();