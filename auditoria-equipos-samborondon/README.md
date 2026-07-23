# Auditoria y Optimizacion de Rendimiento de Equipos

Aplicacion web educativa para la Unidad Educativa Fiscal Samborondon. Permite registrar equipos antiguos del laboratorio, diagnosticar rendimiento, documentar acciones de optimizacion, comparar resultados, visualizar estadisticas, cargar evidencias y exportar reportes.

## Archivos

- `index.html`: estructura de la aplicacion.
- `styles.css`: diseno responsive, modo claro/oscuro y componentes visuales.
- `app.js`: logica de registro, diagnostico, optimizacion, dashboard, reportes, LocalStorage, JSON y galeria.
- `assets/logo-samborondon.jpeg`: logotipo institucional.
- `assets/imagenes/hero-laboratorio-auditoria.png`: imagen hero generada para el proyecto.

## Uso

Abre `index.html` en el navegador. La aplicacion incluye tres equipos de ejemplo la primera vez que se ejecuta. Los cambios se guardan automaticamente en `LocalStorage` del navegador.

## Funciones principales

- Registrar, editar, buscar, filtrar y eliminar equipos.
- Guardar diagnostico tecnico por equipo.
- Calcular rendimiento inicial y rendimiento final estimado.
- Registrar acciones de optimizacion con estado y observaciones.
- Ver dashboard con KPIs y graficos.
- Verificar estado operativo de la app: modo HTTP/PWA, almacenamiento, dependencias y respaldos.
- Medir calidad metodologica del proyecto con diagnosticos, optimizaciones, evidencias y notas.
- Usar asistente tecnico para priorizar equipos por riesgo.
- Priorizar equipos criticos con recomendaciones automaticas.
- Generar conclusiones, recomendaciones, propuestas y reflexion desde los resultados registrados.
- Generar reporte individual por equipo y exportarlo en PDF.
- Generar informe general del proyecto en PDF.
- Exportar e importar datos en JSON.
- Crear respaldo manual, restaurar ultimo respaldo local y exportar paquete completo del proyecto.
- Cargar evidencias fotograficas del proceso.
- Guardar conclusiones, recomendaciones y reflexiones.
- Cambiar entre modo claro y modo oscuro.
- Instalar la app como PWA y usar archivos principales desde cache cuando se sirve por localhost o HTTPS.

## Nota tecnica

La pagina funciona como plataforma educativa de registro y simulacion tecnica. No ejecuta limpiezas reales, no modifica el sistema operativo y no borra archivos del computador del usuario.
