const WHATSAPP_API = import.meta.env.VITE_WHATSAPP_API_URL;
const WHATSAPP_TOKEN = import.meta.env.VITE_WHATSAPP_TOKEN;

async function enviarMensaje({ to, message }) {
  if (!WHATSAPP_API || !WHATSAPP_TOKEN) {
    console.warn('WhatsApp API no configurada. Usar .env: VITE_WHATSAPP_API_URL y VITE_WHATSAPP_TOKEN');
    return;
  }
  try {
    await fetch(WHATSAPP_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${WHATSAPP_TOKEN}` },
      body: JSON.stringify({ to, message }),
    });
  } catch (err) {
    console.error('Error enviando WhatsApp:', err);
  }
}

export async function notificarEncargado({ encargadoTelefono, empleadoNombre, tareaTitulo, tareaId }) {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const enlace = `${baseUrl}/?task=${tareaId}&action=validar`;
  const message = `👷 *Empleado ${empleadoNombre}* completó:\n📋 *${tareaTitulo}*\n\n✅ ¿Validar?\n${enlace}`;
  await enviarMensaje({ to: encargadoTelefono, message });
}

export async function notificarAlertaCritica({ adminTelefono, loteNombre, cultivo, reportadoPor, fotoUrl }) {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const enlaceFoto = fotoUrl || `${baseUrl}/monitoreo`;
  const enlaceAccion = `${baseUrl}/?action=correctiva&lote=${encodeURIComponent(loteNombre)}`;
  const message = `🚨 *ALERTA CRÍTICA - Salud Vegetal*\n\n🌱 Lote: ${loteNombre}\n🌾 Cultivo: ${cultivo}\n👤 Reportó: ${reportadoPor}\n📸 Foto: ${enlaceFoto}\n\n🛠️ ¿Generar tarea correctiva?\n${enlaceAccion}`;
  await enviarMensaje({ to: adminTelefono, message });
}

export async function notificarExcepcionAdHoc({ adminTelefono, empleadoNombre, insumoNombre, cantidad, loteNombre }) {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const enlace = `${baseUrl}/?action=excepcion`;
  const message = `⚠️ *Excepción Ad-Hoc Reportada*\n\n👤 Empleado: ${empleadoNombre}\n📦 Insumo: ${insumoNombre}\n🔢 Cantidad: ${cantidad}\n🌱 Lote: ${loteNombre}\n\n🔗 Revisar: ${enlace}`;
  await enviarMensaje({ to: adminTelefono, message });
}

export async function notificarCorrectivaCreada({ encargadoTelefono, tareaTitulo, loteNombre, fechaLimite }) {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const enlace = `${baseUrl}/?task=pending`;
  const message = `🛠️ *Nueva Tarea Correctiva*\n\n📋 ${tareaTitulo}\n🌱 Lote: ${loteNombre}\n📅 Fecha límite: ${fechaLimite}\n\n🔗 Ver: ${enlace}`;
  await enviarMensaje({ to: encargadoTelefono, message });
}

export async function enviarRecordatorioDiario({ empleadoTelefono, tareas }) {
  if (!tareas?.length) return;
  const lista = tareas.map((t, i) => `${i + 1}. ${t.titulo} (${t.fechaLimiteLabel || 'hoy'})`).join('\n');
  const message = `📋 *Tareas de hoy*\n\n${lista}\n\nResponde *1* para confirmar una tarea o usa el panel web.`;
  await enviarMensaje({ to: empleadoTelefono, message });
}

export async function enviarReporteSemanal({ empleadoTelefono, tareasPendientes, tareasCompletadas, lotesActivos, excepcionesPendientes, alertasPendientes }) {
  const message = `📊 *Reporte Semanal Fincadigi*\n\n` +
    `✅ Tareas: ${tareasCompletadas || 0} completadas, ${tareasPendientes || 0} pendientes\n` +
    `🌱 Lotés activos: ${lotesActivos || 0}\n` +
    `⚠️ Excepciones: ${excepcionesPendientes || 0} pendientes\n` +
    `🚨 Alertas: ${alertasPendientes || 0} críticas\n\n` +
    `🔗 Panel: ${import.meta.env.VITE_APP_URL || window.location.origin}`;
  await enviarMensaje({ to: empleadoTelefono, message });
}
