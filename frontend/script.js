document.addEventListener('DOMContentLoaded', () => {
    // Variables globales
    let items = [];
    let egresos = [];
    let cajero = null;
    let cajaInicial = 0;
    let tipoSeleccionado = '';
    let medioPagoSeleccionado = '';

    // URL de tu API en Render (reemplaza con tu URL real)
    const API_URL = 'https://tu-api-veterinaria.onrender.com';

    // Elementos del DOM
    const modalInicio = document.getElementById('modal-inicio');
    const sistema = document.getElementById('sistema');
    const btnIniciar = document.getElementById('iniciar-sistema');
    const nombreCajeroInput = document.getElementById('nombre-cajero');
    const montoCajaInput = document.getElementById('monto-caja');
    const tituloCajero = document.getElementById('titulo-cajero');
    const listaEgresos = document.getElementById('lista-egresos');

    // Iniciar sistema
    btnIniciar.addEventListener('click', () => {
        if (nombreCajeroInput.value && montoCajaInput.value) {
            cajero = nombreCajeroInput.value;
            cajaInicial = parseFloat(montoCajaInput.value);
            tituloCajero.textContent = `Cajero: ${cajero} - Caja Inicial: S/ ${cajaInicial.toFixed(2)}`;
            modalInicio.classList.add('hidden');
            sistema.classList.remove('hidden');
        } else {
            alert('Ingresa nombre y monto inicial.');
        }
    });

    // Servicios y medios de pago
    document.querySelectorAll('.btn-tipo').forEach(btn => {
        btn.addEventListener('click', () => {
            tipoSeleccionado = btn.dataset.tipo;
            document.querySelectorAll('.btn-tipo').forEach(b => b.classList.remove('seleccionado'));
            btn.classList.add('seleccionado');
        });
    });

    document.querySelectorAll('.btn-pago').forEach(btn => {
        btn.addEventListener('click', () => {
            medioPagoSeleccionado = btn.dataset.pago;
            document.querySelectorAll('.btn-pago').forEach(b => b.classList.remove('seleccionado'));
            btn.classList.add('seleccionado');
        });
    });

    // Función para llamadas al backend
    async function callBackendAPI(action, data) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer tu_token_seguro' // Opcional para autenticación
                },
                body: JSON.stringify({ action, data })
            });
            
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            return await response.json();
        } catch (error) {
            console.error('Error al conectar con el backend:', error);
            throw error;
        }
    }

    // Agregar item
    document.getElementById('agregar-item').addEventListener('click', async () => {
        const mascota = document.getElementById('mascota').value;
        const peso = document.getElementById('peso').value;
        const propietario = document.getElementById('propietario').value;
        const nombreServicio = document.getElementById('nombre-servicio').value;
        const precio = parseFloat(document.getElementById('precio').value);

        if (!mascota || !propietario || !nombreServicio || !tipoSeleccionado || !precio || !medioPagoSeleccionado) {
            alert('Completa todos los campos obligatorios.');
            return;
        }

        const item = {
            fecha: new Date().toISOString(),
            mascota,
            peso: peso || 'N/A',
            propietario,
            servicio: nombreServicio,
            tipo: tipoSeleccionado,
            precio,
            medioPago: medioPagoSeleccionado,
            cajero
        };

        try {
            const result = await callBackendAPI('guardarItem', item);
            if (result.success) {
                items.push(item);
                actualizarTabla();
                limpiarFormulario();
                alert('Registro guardado exitosamente');
            } else {
                alert(result.message || 'Error al guardar');
            }
        } catch (error) {
            alert('Error de conexión: ' + error.message);
        }
    });

    // Actualizar tabla
    function actualizarTabla() {
        const tbody = document.querySelector('#tabla-resumen tbody');
        tbody.innerHTML = '';
        let total = 0;

        items.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.mascota}</td>
                <td>${item.peso}</td>
                <td>${item.propietario}</td>
                <td>${item.servicio}</td>
                <td>${item.tipo}</td>
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
                actualizarTabla();
            });
        });
    }

    // Agregar egreso
    document.getElementById('agregar-egreso').addEventListener('click', async () => {
        const monto = parseFloat(document.getElementById('monto-egreso').value);
        const descripcion = document.getElementById('descripcion-egreso').value;

        if (!monto) {
            alert('Ingresa un monto válido.');
            return;
        }

        const egreso = {
            fecha: new Date().toISOString(),
            descripcion: descripcion || 'Sin descripción',
            monto,
            cajero
        };

        try {
            const result = await callBackendAPI('guardarEgreso', egreso);
            if (result.success) {
                egresos.push(egreso);
                actualizarEgresos();
                document.getElementById('monto-egreso').value = '';
                document.getElementById('descripcion-egreso').value = '';
            }
        } catch (error) {
            alert('Error al guardar egreso: ' + error.message);
        }
    });

    // Actualizar egresos
    function actualizarEgresos() {
        listaEgresos.innerHTML = '';
        egresos.forEach((egreso, index) => {
            const div = document.createElement('div');
            div.className = 'egreso-item';
            div.innerHTML = `
                <span>${egreso.descripcion}: S/ ${egreso.monto.toFixed(2)}</span>
                <button class="btn-eliminar" data-index="${index}">Eliminar</button>
            `;
            listaEgresos.appendChild(div);
        });

        document.querySelectorAll('#lista-egresos .btn-eliminar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                egresos.splice(index, 1);
                actualizarEgresos();
            });
        });
    }

    // Cuadrar caja
    document.getElementById('cuadrar-caja').addEventListener('click', () => {
        const resumenCierre = document.getElementById('resumen-cierre');
        resumenCierre.classList.remove('hidden');

        // Resumen por tipo de servicio
        const tipos = {};
        items.forEach(item => {
            tipos[item.tipo] = (tipos[item.tipo] || 0) + item.precio;
        });

        let htmlTipos = '<h3>Ingresos por Tipo de Servicio:</h3><ul>';
        for (const [tipo, total] of Object.entries(tipos)) {
            htmlTipos += `<li>${tipo}: S/ ${total.toFixed(2)}</li>`;
        }
        htmlTipos += '</ul>';
        document.getElementById('resumen-tipos').innerHTML = htmlTipos;

        // Resumen por medio de pago
        const pagos = {};
        items.forEach(item => {
            pagos[item.medioPago] = (pagos[item.medioPago] || 0) + item.precio;
        });

        let htmlPagos = '<h3>Ingresos por Medio de Pago:</h3><ul>';
        for (const [pago, total] of Object.entries(pagos)) {
            htmlPagos += `<li>${pago}: S/ ${total.toFixed(2)}</li>`;
        }
        htmlPagos += '</ul>';
        document.getElementById('resumen-pagos').innerHTML = htmlPagos;

        // Total general
        const totalIngresos = items.reduce((sum, item) => sum + item.precio, 0);
        const totalEgresos = egresos.reduce((sum, egreso) => sum + egreso.monto, 0);
        const totalEfectivo = items.filter(item => item.medioPago === 'Efectivo')
                                 .reduce((sum, item) => sum + item.precio, 0);
        
        const totalFinal = cajaInicial + totalEfectivo - totalEgresos;

        document.getElementById('total-final').innerHTML = `
            <h3>Total Caja:</h3>
            <p>Efectivo en caja: S/ ${(cajaInicial + totalEfectivo).toFixed(2)}</p>
            <p>Total egresos: S/ ${totalEgresos.toFixed(2)}</p>
            <p><strong>Total final: S/ ${totalFinal.toFixed(2)}</strong></p>
        `;
    });

    // Cerrar caja
    document.getElementById('cerrar-caja').addEventListener('click', async () => {
        if (confirm('¿Estás seguro de cerrar la caja?')) {
            const totalIngresos = items.reduce((sum, item) => sum + item.precio, 0);
            const totalEgresos = egresos.reduce((sum, egreso) => sum + egreso.monto, 0);
            const totalFinal = cajaInicial + totalIngresos - totalEgresos;

            const cierre = {
                fecha: new Date().toISOString(),
                cajero,
                cajaInicial,
                totalIngresos,
                totalEgresos,
                totalFinal
            };

            try {
                const result = await callBackendAPI('cerrarCaja', cierre);
                if (result.success) {
                    alert('Caja cerrada exitosamente');
                    location.reload();
                }
            } catch (error) {
                alert('Error al cerrar caja: ' + error.message);
            }
        }
    });

    // Limpiar formulario
    function limpiarFormulario() {
        document.getElementById('mascota').value = '';
        document.getElementById('peso').value = '';
        document.getElementById('propietario').value = '';
        document.getElementById('nombre-servicio').value = '';
        document.getElementById('precio').value = '';
        tipoSeleccionado = '';
        medioPagoSeleccionado = '';
        document.querySelectorAll('.btn-tipo.seleccionado, .btn-pago.seleccionado').forEach(btn => {
            btn.classList.remove('seleccionado');
        });
    }

    // Exportar a Excel (simulado)
    document.getElementById('exportar-excel').addEventListener('click', () => {
        alert('Los datos se están guardando en el servidor. Puedes exportarlos desde Render.com');
    });
});