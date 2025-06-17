document.addEventListener('DOMContentLoaded', () => {
    // Variables globales
    let items = [];
    let egresos = [];
    let cajero = null;
    let cajaInicial = 0;
    let tipoSeleccionado = '';
    let medioPagoSeleccionado = '';

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
            cargarDatosGuardados();
        } else {
            alert('Ingresa nombre y monto inicial.');
        }
    });

    // Servicios y medios de pago (botones)
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

    // Agregar item
    document.getElementById('agregar-item').addEventListener('click', agregarItem);

    // Agregar egreso
    document.getElementById('agregar-egreso').addEventListener('click', agregarEgreso);

    // Cuadrar caja
    document.getElementById('cuadrar-caja').addEventListener('click', cuadrarCaja);

    // Exportar a Excel (XLSX)
    document.getElementById('exportar-excel').addEventListener('click', exportarExcel);

    // Cerrar caja
    document.getElementById('cerrar-caja').addEventListener('click', cerrarCaja);

    // ======================
    // FUNCIONES PRINCIPALES
    // ======================

    function agregarItem() {
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
            mascota,
            peso: peso || 'N/A',
            propietario,
            servicio: nombreServicio,
            tipo: tipoSeleccionado,
            precio,
            medioPago: medioPagoSeleccionado,
            fecha: new Date().toLocaleString()
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

        const egreso = {
            monto,
            descripcion: descripcion || 'Sin descripción',
            fecha: new Date().toLocaleString()
        };

        egresos.push(egreso);
        guardarDatos();
        actualizarEgresos();
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
                guardarDatos();
                actualizarTabla();
            });
        });
    }

    function actualizarEgresos() {
        listaEgresos.innerHTML = '';
        let totalEgresos = 0;

        egresos.forEach((egreso, index) => {
            const div = document.createElement('div');
            div.className = 'egreso-item';
            div.innerHTML = `
                <span>${egreso.descripcion}: S/ ${egreso.monto.toFixed(2)}</span>
                <button class="btn-eliminar" data-index="${index}">Eliminar</button>
            `;
            listaEgresos.appendChild(div);
            totalEgresos += egreso.monto;
        });

        document.querySelectorAll('#lista-egresos .btn-eliminar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                egresos.splice(index, 1);
                guardarDatos();
                actualizarEgresos();
            });
        });
    }

    function cuadrarCaja() {
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
        const totalEfectivo = items
            .filter(item => item.medioPago === 'Efectivo')
            .reduce((sum, item) => sum + item.precio, 0);
        
        const totalFinal = cajaInicial + totalEfectivo - totalEgresos;

        document.getElementById('total-final').innerHTML = `
            <h3>Total Caja:</h3>
            <p>Efectivo en caja: S/ ${(cajaInicial + totalEfectivo).toFixed(2)}</p>
            <p>Total egresos: S/ ${totalEgresos.toFixed(2)}</p>
            <p><strong>Total final: S/ ${totalFinal.toFixed(2)}</strong></p>
        `;
    }

    function exportarExcel() {
        // Crear un nuevo libro de trabajo
        const wb = XLSX.utils.book_new();
        
        // 1. Hoja de datos principales
        const datosPrincipales = [
            ["=== REPORTE VETERINARIA ==="],
            [`Cajero: ${cajero}`],
            [`Fecha: ${new Date().toLocaleDateString()}`],
            [""],
            ["=== INFORMACIÓN DE CAJA ==="],
            [`Caja Inicial: S/ ${cajaInicial.toFixed(2)}`],
            [""],
            ["=== DETALLE DE CLIENTES Y SERVICIOS ==="],
            ["No.", "Fecha", "Hora", "Mascota", "Peso", "Propietario", "Servicio", "Tipo Servicio", "Precio", "Medio de Pago"]
        ];
        
        // Agregar datos de registros
        items.forEach((item, index) => {
            const [fecha, hora] = item.fecha.split(', ');
            datosPrincipales.push([
                index + 1,
                fecha,
                hora,
                item.mascota,
                item.peso,
                item.propietario,
                item.servicio,
                item.tipo,
                `S/ ${item.precio.toFixed(2)}`,
                item.medioPago
            ]);
        });
        
        // Totales de servicios
        const totalIngresos = items.reduce((sum, item) => sum + item.precio, 0);
        datosPrincipales.push(["", "", "", "", "", "", "", "Total Ingresos:", `S/ ${totalIngresos.toFixed(2)}`, ""]);
        
        // 2. Hoja de egresos
        const datosEgresos = [
            ["=== DETALLE DE EGRESOS ==="],
            ["No.", "Fecha", "Hora", "Descripción", "Monto"]
        ];
        
        egresos.forEach((egreso, index) => {
            const [fecha, hora] = egreso.fecha.split(', ');
            datosEgresos.push([
                index + 1,
                fecha,
                hora,
                egreso.descripcion,
                `S/ ${egreso.monto.toFixed(2)}`
            ]);
        });
        
        const totalEgresos = egresos.reduce((sum, egreso) => sum + egreso.monto, 0);
        datosEgresos.push(["", "", "", "Total Egresos:", `S/ ${totalEgresos.toFixed(2)}`]);
        
        // 3. Hoja de resúmenes
        const datosResumen = [
            ["=== INGRESOS POR TIPO DE SERVICIO ==="],
            ["Tipo Servicio", "Monto"],
            ...Object.entries(items.reduce((acc, item) => {
                acc[item.tipo] = (acc[item.tipo] || 0) + item.precio;
                return acc;
            }, {})).map(([tipo, total]) => [tipo, `S/ ${total.toFixed(2)}`]),
            [""],
            ["=== INGRESOS POR MEDIO DE PAGO ==="],
            ["Medio de Pago", "Monto"],
            ...Object.entries(items.reduce((acc, item) => {
                acc[item.medioPago] = (acc[item.medioPago] || 0) + item.precio;
                return acc;
            }, {})).map(([pago, total]) => [pago, `S/ ${total.toFixed(2)}`]),
            [""],
            ["=== CUADRE DE CAJA ==="],
            ["Concepto", "Monto"],
            ["Caja Inicial", `S/ ${cajaInicial.toFixed(2)}`],
            ["Ingresos en Efectivo", `S/ ${items.filter(item => item.medioPago === 'Efectivo').reduce((sum, item) => sum + item.precio, 0).toFixed(2)}`],
            ["Egresos en Efectivo", `S/ ${totalEgresos.toFixed(2)}`],
            ["Total en Caja", `S/ ${(cajaInicial + items.filter(item => item.medioPago === 'Efectivo').reduce((sum, item) => sum + item.precio, 0) - totalEgresos).toFixed(2)}`],
            [""],
            ["=== RESUMEN GENERAL ==="],
            ["Concepto", "Monto"],
            ["Total Ingresos (todos los medios)", `S/ ${totalIngresos.toFixed(2)}`],
            ["Total Egresos", `S/ ${totalEgresos.toFixed(2)}`],
            ["Diferencia (Ingresos - Egresos)", `S/ ${(totalIngresos - totalEgresos).toFixed(2)}`]
        ];
        
        // Crear hojas de trabajo
        const ws1 = XLSX.utils.aoa_to_sheet(datosPrincipales);
        const ws2 = XLSX.utils.aoa_to_sheet(datosEgresos);
        const ws3 = XLSX.utils.aoa_to_sheet(datosResumen);
        
        // Añadir hojas al libro
        XLSX.utils.book_append_sheet(wb, ws1, "Servicios");
        XLSX.utils.book_append_sheet(wb, ws2, "Egresos");
        XLSX.utils.book_append_sheet(wb, ws3, "Resumen");
        
        // Generar archivo XLSX
        const fecha = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(wb, `reporte_veterinaria_${cajero}_${fecha}.xlsx`);
    }

    function cerrarCaja() {
        if (confirm('¿Estás seguro de cerrar la caja? Todos los datos se borrarán.')) {
            localStorage.removeItem('veterinaria_data');
            location.reload();
        }
    }

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
                actualizarEgresos();
            }
        }
    }
});