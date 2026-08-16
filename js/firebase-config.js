// Configuração do Firebase do projeto "barbearia-agendamento"
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2YeYPBmd2FNbVUQ43U6FcSojbPO6u0M0",
  authDomain: "barbearia-agendamento-d7781.firebaseapp.com",
  projectId: "barbearia-agendamento-d7781",
  storageBucket: "barbearia-agendamento-d7781.firebasestorage.app",
  messagingSenderId: "250561569514",
  appId: "1:250561569514:web:03337d98db00ca281bad93"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// ---- Configuração da barbearia ----
// Para adicionar/remover barbeiro, edite esta lista.
// id: usado internamente | name: aparece no site | initials: avatar
export const BARBEIROS = [
  { id: "little-hair", name: "Little Hair", initials: "LH", foto: "img/little-hair.jpg" },
  { id: "kevin-moraes", name: "Kevin Moraes", initials: "KM", foto: "img/kevin-moraes.jpg" }
];

// Horário de funcionamento por dia da semana (0 = domingo ... 6 = sábado)
export const HORARIOS = {
  1: { abre: "09:30", fecha: "20:00" }, // segunda
  2: { abre: "09:30", fecha: "20:00" }, // terça
  3: { abre: "09:30", fecha: "20:00" }, // quarta
  4: { abre: "09:30", fecha: "20:00" }, // quinta
  5: { abre: "09:30", fecha: "20:00" }, // sexta
  6: { abre: "09:00", fecha: "19:00" }  // sábado
  // domingo fechado (0 não existe no objeto)
};

export const DURACAO_SLOT_MIN = 60; // duração de cada horário de atendimento
export const WHATSAPP_NUMERO = "5562995561644";
