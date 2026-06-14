const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.actualizarPassword = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated', 'Debes iniciar sesion para ejecutar esta accion.'
    );
  }

  const { uid, newPassword } = data;

  if (!uid || !newPassword || newPassword.length < 6) {
    throw new functions.https.HttpsError(
      'invalid-argument', 'La contrasena debe tener al menos 6 caracteres.'
    );
  }

  try {
    await admin.auth().updateUser(uid, { password: newPassword });
    return { success: true };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
