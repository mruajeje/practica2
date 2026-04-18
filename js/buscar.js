window.onload = async () => {
    const form = document.getElementById('form-busqueda');
    const contenedor = document.getElementById('contenedor-actividades');

    // Función principal para pedir datos a XAMPP
    async function realizarBusqueda() {
        const t = document.getElementById('filtro-texto')?.value || '';
        const l = document.getElementById('filtro-lugar')?.value || '';
        const a = document.getElementById('filtro-autor')?.value || '';
        const c = document.getElementById('filtro-categoria')?.value || '';

        let url = 'api/actividades?';
        if (t) url += `t=${t}&`;
        if (l) url += `l=${l}&`;
        if (a) url += `a=${a}&`;
        if (c) url += `c=${c}&`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (data.RESULTADO === 'OK') {
                pintar(data.FILAS);
            }
        } catch (error) {
            console.error("Error al conectar con la base de datos:", error);
        }
    }

    function pintar(filas) {
        contenedor.innerHTML = ''; // ESTO BORRA LO ANTIGUO
        
        if (filas.length === 0) {
            contenedor.innerHTML = '<p>No se han encontrado actividades reales.</p>';
            return;
        }

            filas.forEach(act => {
                contenedor.innerHTML += `
                    <article class="activity-card">
                        <a href="actividad.html?id=${act.id}">
                            <img src="./fotos/actividades/${act.foto}" class="activity-img">
                        </a>
                        <div class="activity-info">
                            <h3><a href="actividad.html?id=${act.id}">${act.nombre}</a></h3>
                            <p><i class="fa-solid fa-location-dot"></i> ${act.lugar}</p>
                            <p><i class="fa-solid fa-user"></i> ${act.autor}</p>
                        </div>
                    </article>`;
            });
    }

    // Escuchar el botón de buscar
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            realizarBusqueda();
        };
    }

    // Al cargar la página, mostrar todas las actividades por defecto
    realizarBusqueda();

    // Petición de todas las categorías guardadas (Punto 9.a) [cite: 153]
    try {
        const resCat = await fetch('api/categorias');
        const dataCat = await resCat.json();
        if (dataCat.RESULTADO === 'OK') {
            const dl = document.getElementById('sugerencias-categorias');
            dataCat.FILAS.forEach(cat => {
                dl.innerHTML += `<option value="${cat.nombre}">`; // [cite: 156]
            });
        }
    } catch (e) {
        console.error("Error cargando categorías:", e);
    }
};