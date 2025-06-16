document.addEventListener('DOMContentLoaded', () => {
    // Variables globales
    let items = [];
    let egresos = [];
    let cajero = null;
    let cajaInicial = 0;
    let servicioSeleccionado = '';
    let medioPagoSeleccionado = '';

    // Elementos del DOM
    const modalInicio = document.getElementById('modal-inicio');
    const sistema = document.getElementById('sistema');
    const btnIniciar = document.getElementById('iniciar-sistema');
    const nombreCajeroInput = document.getElementById('nombre-cajero');
    const montoCajaInput = document.getElementById('monto-caja');
    const tituloCajero = document.getElementById('titulo-cajero');

    // Iniciar sistema
    btnIniciar.addEventListener('click', () => {
        if (nombreCajeroInput.value && montoCajaInput.value) {
            cajero = nombreCajeroInput.value;
            cajaInicial = parseFloat(montoCajaInput.value);
            tituloCajero.textContent = `Cajero: ${cajero} - Caja Inicial: S/ ${cajaInicial.toFixed(2)}`;
            modalInicio.classList.add('hidden');
            sistema.classList.remove('hidden');
            cargarDatosGuardados();
        } else {
            alert('Ingresa nombre y monto inicial.');
        }
    });

    // Servicios y medios de pago (botones)
    document.querySelectorAll('.btn-servicio').forEach(btn => {
        btn.addEventListener('click', () => {
            servicioSeleccionado = btn.dataset.servicio;
            document.querySelectorAll('.btn-servicio').forEach(b => b.style.backgroundColor = '');
            btn.style.backgroundColor = '#45a049';
        });
    });

    document.querySelectorAll('.btn-pago').forEach(btn => {
        btn.addEventListener('click', () => {
            medioPagoSeleccionado = btn.dataset.pago;
            document.querySelectorAll('.btn-pago').forEach(b => b.style.backgroundColor = '');
            btn.style.backgroundColor = '#45a049';
        });
    });

    // Agregar item
    document.getElementById('agregar-item').addEventListener('click', agregarItem);

    // Agregar egreso
    document.getElementById('agregar-egreso').addEventListener('click', agregarEgreso);

    // Cuadrar caja
    document.getElementById('cuadrar-caja').addEventListener('click', cuadrarCaja);

    // Exportar a Excel
    document.getElementById('exportar-excel').addEventListener('click', exportarExcel);

    // Cerrar caja
    document.getElementById('cerrar-caja').addEventListener('click', cerrarCaja);

    // Funciones
    function agregarItem() {
        const mascota = document.getElementById('mascota').value;
        const peso = document.getElementById('peso').value;
        const propietario = document.getElementById('propietario').value;
        const precio = parseFloat(document.getElementById('precio').value);

        if (!mascota || !propietario || !servicioSeleccionado || !precio || !medioPagoSeleccionado) {
            alert('Completa todos los campos obligatorios.');
            return;
        }

        const item = {
            mascota,
            peso: peso || 'N/A',
            propietario,
            servicio: servicioSeleccionado,
            precio,
            medioPago: medioPagoSeleccionado
        };

        items.push(item);
        guardarDatos();
        actualizarTabla();
        limpiarFormulario();
    }

    function agregarEgreso() {
        const monto = parseFloat(document.getElementById('monto-egreso').value);
        const descripcion = document.getElementById('descripcion-egreso').value;

        if (!monto) {
            alert('Ingresa un monto válido.');
            return;
        }

        egresos.push({ monto, descripcion });
        guardarDatos();
        document.getElementById('monto-egreso').value = '';
        document.getElementById('descripcion-egreso').value = '';
    }

    function actualizarTabla() {
        const tbody = document.querySelector('#tabla-resumen tbody');
        tbody.innerHTML = '';
        let total = 0;

        items.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.mascota}</td>
                <td>${item.servicio}</td>
                <td>S/ ${item.precio.toFixed(2)}</td>
                <td>${item.medioPago}</td>
                <td><button class="btn-eliminar" data-index="${index}">Eliminar</button></td>
            `;
            tbody.appendChild(tr);
            total += item.precio;
        });

        document.getElementById('total-items').textContent = `Total: S/ ${total.toFixed(2)}`;

        // Eventos para botones eliminar
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                items.splice(index, 1);
                guardarDatos();
                actualizarTabla();
            });
        });
    }

    function cuadrarCaja() {
        const resumenCierre = document.getElementById('resumen-cierre');
        resumenCierre.classList.remove('hidden');

        // Resumen por servicio
        const servicios = {};
        items.forEach(item => {
            servicios[item.servicio] = (servicios[item.servicio] || 0) + item.precio;
        });

        let htmlServicios = '<h3>Por Servicio:</h3><ul>';
        for (const [servicio, total] of Object.entries(servicios)) {
            htmlServicios += `<li>${servicio}: S/ ${total.toFixed(2)}</li>`;
        }
        htmlServicios += '</ul>';
        document.getElementById('resumen-servicios').innerHTML = htmlServicios;

        // Resumen por medio de pago
        const pagos = {};
        items.forEach(item => {
            pagos[item.medioPago] = (pagos[item.medioPago] || 0) + item.precio;
        });

        let htmlPagos = '<h3>Por Medio de Pago:</h3><ul>';
        for (const [pago, total] of Object.entries(pagos)) {
            htmlPagos += `<li>${pago}: S/ ${total.toFixed(2)}</li>`;
        }
        htmlPagos += '</ul>';
        document.getElementById('resumen-pagos').innerHTML = htmlPagos;

        // Total general
        const totalIngresos = items.reduce((sum, item) => sum + item.precio, 0);
        const totalEgresos = egresos.reduce((sum, egreso) => sum + egreso.monto, 0);
        const totalFinal = cajaInicial + totalIngresos - totalEgresos;

        document.getElementById('total-final').innerHTML = `
            <h3>Total Caja:</h3>
            <p>Ingresos: S/ ${totalIngresos.toFixed(2)}</p>
            <p>Egresos: S/ ${totalEgresos.toFixed(2)}</p>
            <p><strong>Total Final: S/ ${totalFinal.toFixed(2)}</strong></p>
        `;
    }

    function exportarExcel() {
        const ruta = prompt('Ingresa la ruta donde guardar el archivo (ej: C:/Downloads):', 'C:/Downloads');
        if (!ruta) return;

        const data = {
            cajero,
            cajaInicial,
            items,
            egresos
        };

        fetch('backend/exportar.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data, ruta })
        })
        .then(response => response.text())
        .then(message => alert(message))
        .catch(error => alert('Error: ' + error));
    }

    function cerrarCaja() {
        if (confirm('¿Estás seguro de cerrar la caja? Todos los datos se borrarán.')) {
            fetch('backend/cierre_caja.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cajero, items, egresos, cajaInicial })
            })
            .then(response => response.text())
            .then(message => {
                alert(message);
                localStorage.removeItem('veterinaria_data');
                location.reload();
            })
            .catch(error => alert('Error: ' + error));
        }
    }

    function limpiarFormulario() {
        document.getElementById('mascota').value = '';
        document.getElementById('peso').value = '';
        document.getElementById('propietario').value = '';
        document.getElementById('precio').value = '';
        servicioSeleccionado = '';
        medioPagoSeleccionado = '';
        document.querySelectorAll('.btn-servicio, .btn-pago').forEach(btn => {
            btn.style.backgroundColor = '';
        });
    }

    function guardarDatos() {
        const data = { cajero, cajaInicial, items, egresos };
        localStorage.setItem('veterinaria_data', JSON.stringify(data));
    }

    function cargarDatosGuardados() {
        const data = localStorage.getItem('veterinaria_data');
        if (data) {
            const parsed = JSON.parse(data);
            if (parsed.cajero === cajero) {
                items = parsed.items || [];
                egresos = parsed.egresos || [];
                actualizarTabla();
            }
        }
    }
});