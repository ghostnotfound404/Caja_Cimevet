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

    // Exportar a Excel
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
        const observaciones = document.getElementById('observaciones').value;

        if (!nombreServicio || !tipoSeleccionado || !precio || !medioPagoSeleccionado) {
            alert('Completa los campos obligatorios: Servicio, Tipo, Precio y Medio de Pago.');
            return;
        }

        const item = {
            mascota: mascota || '',
            peso: peso || '',
            propietario: propietario || '',
            servicio: nombreServicio,
            tipo: tipoSeleccionado,
            precio,
            medioPago: medioPagoSeleccionado,
            observaciones: observaciones || 'A',
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
            tr.dataset.index = index;
            tr.innerHTML = `
                <td>${item.mascota}</td>
                <td>${item.peso}</td>
                <td>${item.propietario}</td>
                <td>${item.servicio}</td>
                <td>${item.tipo}</td>
                <td>S/ ${item.precio.toFixed(2)}</td>
                <td>${item.medioPago}</td>
                <td>${item.observaciones}</td>
                <td class="acciones">
                    <button class="btn-editar" data-index="${index}">Editar</button>
                    <button class="btn-eliminar" data-index="${index}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
            total += item.precio;
        });

        document.getElementById('total-items').textContent = `Total: S/ ${total.toFixed(2)}`;

        // Eventos para botones editar
        document.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                editarItem(index);
            });
        });

        // Eventos para botones eliminar
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                if (confirm('¿Estás seguro de eliminar este registro?')) {
                    items.splice(index, 1);
                    guardarDatos();
                    actualizarTabla();
                }
            });
        });
    }

    function editarItem(index) {
        const item = items[index];
        const tr = document.querySelector(`tr[data-index="${index}"]`);
        
        // Convertir celdas en campos editables
        tr.innerHTML = `
            <td><input type="text" value="${item.mascota}" class="edit-field" data-field="mascota"></td>
            <td><input type="text" value="${item.peso}" class="edit-field" data-field="peso"></td>
            <td><input type="text" value="${item.propietario}" class="edit-field" data-field="propietario"></td>
            <td><input type="text" value="${item.servicio}" class="edit-field" data-field="servicio" required></td>
            <td>
                <select class="edit-field" data-field="tipo">
                    <option value="Clínica" ${item.tipo === 'Clínica' ? 'selected' : ''}>Clínica</option>
                    <option value="Farmacia" ${item.tipo === 'Farmacia' ? 'selected' : ''}>Farmacia</option>
                    <option value="Petshop" ${item.tipo === 'Petshop' ? 'selected' : ''}>Petshop</option>
                </select>
            </td>
            <td><input type="number" value="${item.precio}" class="edit-field" data-field="precio" required step="0.01"></td>
            <td>
                <select class="edit-field" data-field="medioPago">
                    <option value="Efectivo" ${item.medioPago === 'Efectivo' ? 'selected' : ''}>Efectivo</option>
                    <option value="Tarjeta" ${item.medioPago === 'Tarjeta' ? 'selected' : ''}>Tarjeta</option>
                    <option value="Transferencia" ${item.medioPago === 'Transferencia' ? 'selected' : ''}>Transferencia</option>
                </select>
            </td>
            <td><input type="text" value="${item.observaciones}" class="edit-field" data-field="observaciones"></td>
            <td class="acciones">
                <button class="btn-guardar" data-index="${index}">Guardar</button>
                <button class="btn-cancelar" data-index="${index}">Cancelar</button>
            </td>
        `;

        // Evento para guardar cambios
        tr.querySelector('.btn-guardar').addEventListener('click', () => {
            const inputs = tr.querySelectorAll('.edit-field');
            let isValid = true;
            
            // Validar campos requeridos
            inputs.forEach(input => {
                if (input.required && !input.value) {
                    input.style.borderColor = 'red';
                    isValid = false;
                } else {
                    input.style.borderColor = '';
                }
            });
            
            if (!isValid) {
                alert('Completa los campos obligatorios.');
                return;
            }
            
            // Actualizar item
            inputs.forEach(input => {
                const field = input.dataset.field;
                let value = input.value;
                
                if (field === 'precio') {
                    value = parseFloat(value);
                }
                
                items[index][field] = value;
            });
            
            guardarDatos();
            actualizarTabla();
        });

        // Evento para cancelar edición
        tr.querySelector('.btn-cancelar').addEventListener('click', () => {
            actualizarTabla();
        });
    }

    function actualizarEgresos() {
        listaEgresos.innerHTML = '';
        let totalEgresos = 0;

        egresos.forEach((egreso, index) => {
            const div = document.createElement('div');
            div.className = 'egreso-item';
            div.dataset.index = index;
            div.innerHTML = `
                <span>${egreso.descripcion}: S/ ${egreso.monto.toFixed(2)}</span>
                <button class="btn-editar-egreso" data-index="${index}">Editar</button>
                <button class="btn-eliminar" data-index="${index}">Eliminar</button>
            `;
            listaEgresos.appendChild(div);
            totalEgresos += egreso.monto;
        });

        // Eventos para botones editar egresos
        document.querySelectorAll('.btn-editar-egreso').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                editarEgreso(index);
            });
        });

        // Eventos para botones eliminar egresos
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                if (confirm('¿Estás seguro de eliminar este egreso?')) {
                    egresos.splice(index, 1);
                    guardarDatos();
                    actualizarEgresos();
                }
            });
        });
    }

    function editarEgreso(index) {
        const egreso = egresos[index];
        const div = document.querySelector(`.egreso-item[data-index="${index}"]`);
        
        div.innerHTML = `
            <span>
                <input type="text" value="${egreso.descripcion}" class="edit-egreso-desc">
                <input type="number" value="${egreso.monto}" class="edit-egreso-monto" step="0.01">
            </span>
            <button class="btn-guardar-egreso" data-index="${index}">Guardar</button>
            <button class="btn-cancelar-egreso" data-index="${index}">Cancelar</button>
        `;

        // Evento para guardar cambios
        div.querySelector('.btn-guardar-egreso').addEventListener('click', () => {
            const desc = div.querySelector('.edit-egreso-desc').value;
            const monto = parseFloat(div.querySelector('.edit-egreso-monto').value);
            
            if (!desc || isNaN(monto)) {
                alert('Completa todos los campos correctamente.');
                return;
            }
            
            egresos[index] = {
                descripcion: desc,
                monto: monto,
                fecha: egreso.fecha
            };
            
            guardarDatos();
            actualizarEgresos();
        });

        // Evento para cancelar edición
        div.querySelector('.btn-cancelar-egreso').addEventListener('click', () => {
            actualizarEgresos();
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
        const workbook = XLSX.utils.book_new();

        // 1. Hoja de Servicios
        const serviciosData = [
            ["No.", "Fecha", "Hora", "Mascota", "Peso", "Propietario", "Servicio", "Tipo Servicio", "Precio", "Medio de Pago", "Observaciones"],
            ...items.map((item, index) => {
                const [fecha, hora] = item.fecha.split(', ');
                return [
                    index + 1,
                    fecha,
                    hora,
                    item.mascota,
                    item.peso,
                    item.propietario,
                    item.servicio,
                    item.tipo,
                    item.precio,
                    item.medioPago,
                    item.observaciones
                ];
            }),
            ["", "", "", "", "", "", "", "Total Ingresos:", items.reduce((sum, item) => sum + item.precio, 0), "", ""]
        ];

        const serviciosSheet = XLSX.utils.aoa_to_sheet(serviciosData);
        XLSX.utils.book_append_sheet(workbook, serviciosSheet, "Servicios");

        // 2. Hoja de Egresos (solo si hay egresos)
        if (egresos.length > 0) {
            const egresosData = [
                ["No.", "Fecha", "Hora", "Descripción", "Monto"],
                ...egresos.map((egreso, index) => {
                    const [fecha, hora] = egreso.fecha.split(', ');
                    return [
                        index + 1,
                        fecha,
                        hora,
                        egreso.descripcion,
                        egreso.monto
                    ];
                }),
                ["", "", "", "Total Egresos:", egresos.reduce((sum, egreso) => sum + egreso.monto, 0)]
            ];

            const egresosSheet = XLSX.utils.aoa_to_sheet(egresosData);
            XLSX.utils.book_append_sheet(workbook, egresosSheet, "Egresos");
        }

        // 3. Hoja de Resumen
        const totalIngresos = items.reduce((sum, item) => sum + item.precio, 0);
        const totalEgresos = egresos.reduce((sum, egreso) => sum + egreso.monto, 0);
        const totalEfectivo = items
            .filter(item => item.medioPago === 'Efectivo')
            .reduce((sum, item) => sum + item.precio, 0);
        const totalFinal = cajaInicial + totalEfectivo - totalEgresos;

        const resumenData = [
            ["REPORTE VETERINARIA"],
            [""],
            ["Cajero:", cajero],
            ["Fecha:", new Date().toLocaleDateString()],
            [""],
            ["INFORMACIÓN DE CAJA"],
            ["Caja Inicial:", cajaInicial],
            [""],
            ["INGRESOS POR TIPO DE SERVICIO"],
            ...Object.entries(
                items.reduce((tipos, item) => {
                    tipos[item.tipo] = (tipos[item.tipo] || 0) + item.precio;
                    return tipos;
                }, {})
            ).map(([tipo, total]) => [tipo, total]),
            [""],
            ["INGRESOS POR MEDIO DE PAGO"],
            ...Object.entries(
                items.reduce((pagos, item) => {
                    pagos[item.medioPago] = (pagos[item.medioPago] || 0) + item.precio;
                    return pagos;
                }, {})
            ).map(([pago, total]) => [pago, total]),
            [""],
            ["CUADRE DE CAJA"],
            ["Caja Inicial:", cajaInicial],
            ["Ingresos en Efectivo:", totalEfectivo],
            ["Egresos en Efectivo:", totalEgresos],
            ["Total en Caja:", totalFinal],
            [""],
            ["RESUMEN GENERAL"],
            ["Total Ingresos (todos los medios):", totalIngresos],
            ["Total Egresos:", totalEgresos],
            ["Diferencia (Ingresos - Egresos):", totalIngresos - totalEgresos]
        ];

        const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
        XLSX.utils.book_append_sheet(workbook, resumenSheet, "Resumen");

        // Generar el archivo Excel
        XLSX.writeFile(workbook, `reporte_veterinaria_${cajero}_${new Date().toISOString().slice(0,10)}.xlsx`);
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
        document.getElementById('observaciones').value = '';
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