# Skill: Aplicar Insumo a un Lote

## Descripción
Flujo completo para aplicar un insumo (fertilizante, herbicida, etc.) a un lote agrícola, incluyendo verificación de stock, consulta climática, registro en Firestore y alertas automáticas.

## Flujo principal

### 1. Autenticación
- El usuario debe iniciar sesión con Firebase Auth.
- Verificar que `auth.currentUser` no sea `null`.
- Si no está autenticado, redirigir a `/login`.

### 2. Panel principal
- Mostrar Dashboard con menú de opciones.
- El usuario debe tener rol (`userRole`) con permisos para aplicar insumos.

### 3. Seleccionar "Aplicar insumo a un lote"
- Navegar al formulario de aplicación.
- Solicitar: lote destino, insumo, cantidad, fecha de aplicación.

### 4. Verificar stock
- Consultar Firestore: `db.collection('inventario').doc(insumoId).get()`.
- Si `stock < cantidadSolicitada`:
  - Mostrar error: "Stock insuficiente. Disponible: X, solicitado: Y".
  - Detener flujo.
- Si hay suficiente stock:
  - Continuar al paso 5.

### 5. Consultar clima actual
- Usar API de clima (OpenWeatherMap o similar) con coordenadas del lote.
- Parámetros: latitud, longitud del lote desde Firestore (`lotes/{loteId}`).
- Evaluar condición:
  - Si `clima.lluvia` es verdadero o `clima.main` incluye "Rain", "Drizzle", "Thunderstorm":
    - Enviar alerta vía WhatsApp: "Aplicación cancelada por lluvia en lote {nombre}".
    - Cancelar operación.
  - Si está despejado (`clima.main` incluye "Clear" o nubes sin lluvia):
    - Continuar al paso 6.

### 6. Registrar aplicación en Firestore
- Crear documento en `aplicaciones/` con:
  ```js
  {
    loteId,
    insumoId,
    cantidad,
    fecha: Timestamp.now(),
    usuario: auth.currentUser.uid,
    clima: { temp, humedad, condicion }
  }
  ```
- Actualizar inventario: restar cantidad del stock.
- Actualizar lote: sumar cantidad aplicada al historial del lote.
- Usar `runTransaction` de Firestore para operación atómica.

### 7. Tarea automática (CRON diario)
- Ejecutar cada mañana a las 6:00 AM.
- Firebase Functions con `schedule('every day 06:00')`.
- Revisar:
  - Lotes con fecha de cosecha próxima (7 días o menos).
  - Insumos con stock bajo (< umbral configurable).

### 8. Alertas WhatsApp
- Usar API de WhatsApp (Twilio / WhatsApp Business API).
- Para cada lote próximo a cosecha: enviar recordatorio.
- Para cada insumo con stock bajo: notificar para reabastecer.
- Template del mensaje:
  ```
  ⚠️ Alerta Finca Digital
  Lote: {nombre} - Cosecha en {dias} días.
  Insumo: {nombre} - Stock actual: {stock} ({porcentaje}% del mínimo).
  ```

## Estructura de datos en Firestore

### Colección: `inventario`
```
{insumoId}
  ├── nombre: string
  ├── tipo: string
  ├── stock: number
  ├── stockMinimo: number
  ├── unidad: string
  └── ultimaActualizacion: Timestamp
```

### Colección: `lotes`
```
{loteId}
  ├── nombre: string
  ├── ubicacion: { lat, lng }
  ├── cultivo: string
  ├── fechaSiembra: Timestamp
  ├── fechaCosecha: Timestamp
  ├── aplicaciones: array<{ insumoId, cantidad, fecha }>
  └── activo: boolean
```

### Colección: `aplicaciones`
```
{autoId}
  ├── loteId: string (ref)
  ├── insumoId: string (ref)
  ├── cantidad: number
  ├── fecha: Timestamp
  ├── usuario: string (uid)
  └── clima: { temp: number, humedad: number, condicion: string }
```

## Consideraciones
- Todas las operaciones críticas deben usar transacciones de Firestore.
- La API de clima debe tener key en variables de entorno.
- Las alertas de WhatsApp deben configurarse con el proveedor elegido.
- Los cron jobs deben tener logs para depuración.
