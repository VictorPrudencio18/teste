
// IMPORTANT: This file's configuration is no longer used as Firebase has been removed from the application.
// The content below is preserved for reference but has no effect.

/*
const userProvidedConfig = {
  apiKey: "AIzaSyDYM1_vlleyXSRuMWWykGLj7kvWic0Opsw",
  authDomain: "aularespondeai.firebaseapp.com",
  projectId: "aularespondeai",
  storageBucket: "aularespondeai.firebasestorage.app", 
  messagingSenderId: "90553908773",
  appId: "1:90553908773:web:a7e9cff43c0112dc6e49cc",
  measurementId: "SEU_MEASUREMENT_ID_AQUI" 
};

const finalConfig: { [key: string]: string } = {};
for (const key in userProvidedConfig) {
  if (userProvidedConfig.hasOwnProperty(key)) {
    const value = userProvidedConfig[key as keyof typeof userProvidedConfig];
    if (key === "measurementId" && (value === "SEU_MEASUREMENT_ID_AQUI" || value === "" || !value)) {
      // Skip placeholder or empty measurementId
    } else {
      finalConfig[key] = value;
    }
  }
}

export const firebaseConfig = finalConfig;
console.log("[firebaseConfig.ts] Firebase configuration (NO LONGER USED):", JSON.stringify(firebaseConfig));

if (firebaseConfig.apiKey === "SUA_API_KEY_AQUI" || firebaseConfig.projectId === "SEU_PROJECT_ID_AQUI") {
  console.error(
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n" +
    "ALERTA CRÍTICO: A configuração do Firebase em 'firebaseConfig.ts' PARECE CONTER VALORES PLACEHOLDER.\n" +
    "Por favor, verifique se você substituiu TODOS os valores com as credenciais REAIS do seu projeto Firebase.\n" +
    "A aplicação NÃO FUNCIONARÁ corretamente se as credenciais estiverem incorretas.\n" +
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  );
} else if (!firebaseConfig.apiKey || !firebaseConfig.apiKey.startsWith("AIza")) {
    console.warn(
    "Atenção: A API Key do Firebase em 'firebaseConfig.ts' parece vazia ou tem um formato incomum (não começa com 'AIza'). " +
    "Verifique se o valor está correto, conforme fornecido pelo console do Firebase."
    );
}
*/

console.log("[firebaseConfig.ts] This file is no longer actively used as Firebase integration has been removed.");
export const firebaseConfig = {}; // Export empty object to satisfy any remaining imports
