window.onload = () => {
    const tokenSession = sessionStorage.getItem('token');
    const tokenLocal = localStorage.getItem('token');
    const token = tokenSession || tokenLocal;

    const btnLogin = document.querySelector('a[href="login.html"]')?.parentElement;
    const btnRegistro = document.querySelector('a[href="registrar.html"]')?.parentElement;
    const btnNueva = document.querySelector('a[href="nueva.html"]')?.parentElement;
    
    let btnLogout = null;
    document.querySelectorAll('.main-nav a').forEach(link => {
        if (link.textContent.trim() === 'Logout') btnLogout = link.parentElement;
    });

    if (token) {
        if(btnLogin) btnLogin.style.display = 'none';
        if(btnRegistro) btnRegistro.style.display = 'none';
        if(btnLogout) btnLogout.style.display = 'block';
        if(btnNueva) btnNueva.style.display = 'block';
    } else {
        if(btnLogin) btnLogin.style.display = 'block';
        if(btnRegistro) btnRegistro.style.display = 'block';
        if(btnLogout) btnLogout.style.display = 'none';
        if(btnNueva) btnNueva.style.display = 'none';
    }

    const contenedor = document.getElementById('contenedor-actividades');
    const infoPaginacion = document.getElementById('info-paginacion');
    const btnMostrarMas = document.getElementById('btn-mostrar-mas');
    
    let registroActual = 0;
    const cantidadPorPagina = 6;
    let totalActividades = 0;

    async function cargarActividades(reset = false) {
        if (reset) {
            registroActual = 0;
            contenedor.innerHTML = ''; 
        }

        try {
            // COMILLAS INVERTIDAS OBLIGATORIAS
            const url = `api/get/actividades.php?reg=${registroActual}&cant=${cantidadPorPagina}`;
            
            const response = await fetch(url);
            const data = await response.json();

            if (data.RESULTADO === 'OK') {
                totalActividades = data.TOTAL_COINCIDENCIAS;
                renderizarActividades(data.FILAS);
                registroActual += data.FILAS.length;
                actualizarInterfazPaginacion();
            } else {
                contenedor.innerHTML = '<p>No se han podido cargar las actividades.</p>';
            }
        } catch (error) {
            console.error(error);
            contenedor.innerHTML = `<p>Error de conexión: ${error.message}</p>`;
        }
    }

    function renderizarActividades(actividades) {
        actividades.forEach(act => {
            const card = document.createElement('article');
            card.className = 'activity-card';
            card.innerHTML = `
                <a href="actividad.html?id=${act.id}" class="img-link">
                    <img src="./fotos/actividades/${act.foto}" alt="${act.nombre}" class="activity-img">
                </a>
                <div class="activity-info">
                    <h3 class="activity-title"><a href="actividad.html?id=${act.id}">${act.nombre}</a></h3>
                </div>
            `;
            contenedor.appendChild(card);
        });
    }

    function actualizarInterfazPaginacion() {
        if(infoPaginacion) {
            infoPaginacion.textContent = `Mostrando ${registroActual} de ${totalActividades} actividades`;
        }
        if(btnMostrarMas) {
            if (registroActual >= totalActividades) {
                btnMostrarMas.style.display = 'none';
            } else {
                btnMostrarMas.style.display = 'inline-block';
                btnMostrarMas.disabled = false;
            }
        }
    }

    if(btnMostrarMas) {
        btnMostrarMas.onclick = () => {
            btnMostrarMas.disabled = true; 
            btnMostrarMas.textContent = "Cargando...";
            cargarActividades().then(() => {
                btnMostrarMas.textContent = "Mostrar más";
            });
        };
    }

    cargarActividades(true);
};