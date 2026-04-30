// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Инициализируем Firebase Admin, чтобы функция имела доступ к вашему проекту
admin.initializeApp();

// Создаем нашу функцию, которая будет доступна по специальной ссылке
exports.checkCode = functions.https.onCall(async (data, context) => {
  // data.role - это 'admin' или 'manager', который прислал браузер
  // data.code - это код, который ввел пользователь в браузере

  if (!data.role || !data.code) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Роль и код обязательны."
    );
  }

  try {
    // Получаем доступ к Remote Config на сервере
    const remoteConfig = admin.remoteConfig();
    const template = await remoteConfig.getTemplate();
    
    // Достаем НАСТОЯЩИЕ коды из настроек (они никогда не покинут сервер)
    const adminCode = template.parameters.admin_code.defaultValue.value;
    const managerCode = template.parameters.manager_code.defaultValue.value;

    let isValid = false;
    // Сравниваем код от пользователя с настоящим кодом
    if (data.role === "admin" && data.code === adminCode) {
      isValid = true;
    } else if (data.role === "manager" && data.code === managerCode) {
      isValid = true;
    }

    // Отправляем ответ обратно в браузер: "успех" или "неудача"
    if (isValid) {
      return { success: true, role: data.role };
    } else {
      return { success: false, message: "Неверный код" };
    }
  } catch (error) {
    console.error("Ошибка при проверке кода:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Произошла внутренняя ошибка сервера."
    );
  }
});