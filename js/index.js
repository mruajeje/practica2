document.addEventListener('DOMContentLoaded', () => {
    
    // 1. GESTIÓN DEL MENÚ SEGÚN EL TOKEN
    const tokenSession = sessionStorage.getItem('token');
    const tokenLocal = localStorage.getItem('token');
    const token = tokenSession || tokenLocal;

    // Buscamos los botones del menú por su enlace
    const btnLogin = document.querySelector('a[href="login.html"]').parentElement;
    const btnRegistro = document.querySelector('a[href="registrar.html"]').parentElement;
    const btnNueva = document.querySelector('a[href="nueva.html"]').parentElement;
    
    // El botón de logout apunta a index.html, lo buscamos por su texto
    const menuLinks = document.querySelectorAll('.main-nav a');
    let btnLogout = null;
    menuLinks.forEach(link => {
        if (link.textContent.trim() === 'Logout') {
            btnLogout = link.parentElement;
        }
    });

    if (token) {
        // Si está logueado: Ocultamos Login/Registro y Mostramos Logout/Nueva
        if(btnLogin) btnLogin.style.display = 'none';
        if(btnRegistro) btnRegistro.style.display = 'none';
        if(btnLogout) btnLogout.style.display = 'block';
        if(btnNueva) btnNueva.style.display = 'block';
    } else {
        // Si NO está logueado: Mostramos Login/Registro y Ocultamos Logout/Nueva
        if(btnLogin) btnLogin.style.display = 'block';
        if(btnRegistro) btnRegistro.style.display = 'block';
        if(btnLogout) btnLogout.style.display = 'none';
        if(btnNueva) btnNueva.style.display = 'none';
    }

    // 2. CARGA DE ACTIVIDADES DINÁMICAS
    const contenedor = document.getElementById('contenedor-actividades');

    async function cargarActividades() {
        try {
            // Hacemos la petición a la API
            const response = await fetch('api/actividades');
            const data = await response.json();

            console.log("ESTRUCTURA REAL DE LA ACTIVIDAD:", data.FILAS[0]);

            if (data.RESULTADO === 'OK') {
                renderizarActividades(data.FILAS);
            } else {
                contenedor.innerHTML = '<p>No se han podido cargar las actividades.</p>';
            }
        } catch (error) {
            console.error("Error al obtener actividades:", error);
            contenedor.innerHTML = '<p>Error de conexión con el servidor.</p>';
        }
    }

    function renderizarActividades(actividades) {
        contenedor.innerHTML = ''; // Limpiamos el texto de "Cargando..."

        actividades.forEach(act => {
            const card = document.createElement('article');
            card.className = 'activity-card';
            
            // Recreamos tu estructura HTML exacta para que no se rompa el CSS
            card.innerHTML = `
                <a href="actividad.html?id=${act.id}" class="img-link">
                    <img src="./fotos/actividades/${act.foto}" alt="${act.nombre}" class="activity-img">
                </a>
                
                <div class="activity-info">
                    <h3 class="activity-title" title="${act.nombre}">
                        <a href="actividad.html?id=${act.id}">${act.nombre}</a>
                    </h3>
                    
                    <div class="activity-meta">
                        <p class="date">Fecha de creación: ${act.fecha_alta}</p>
                        <p class="location"><i class="fa-solid fa-location-dot"></i> ${act.lugar}</p>
                        <p class="author"><i class="fa-solid fa-user"></i> ${act.autor}</p>
                    </div>
                </div>
            `;
            contenedor.appendChild(card);
        });
    }

    // Iniciamos la carga
    cargarActividades();
});