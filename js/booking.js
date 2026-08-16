import { db, BARBEIROS, HORARIOS, DURACAO_SLOT_MIN, WHATSAPP_NUMERO } from "./firebase-config.js";
import {
  collection, query, where, getDocs, addDoc, Timestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const state = {
  barberId: null,
  barberName: null,
  date: null,
  time: null,
  clientName: "",
  clientPhone: ""
};

const steps = ["step-barbeiro", "step-data", "step-horario", "step-dados", "step-confirmado"];
let currentStepIndex = 0;

function showStep(index) {
  steps.forEach((id, i) => {
    document.getElementById(id).classList.toggle("active", i === index);
  });
  document.querySelectorAll(".step-dot").forEach((dot, i) => {
    dot.classList.toggle("current", i === index);
    dot.classList.toggle("done", i < index);
  });
  currentStepIndex = index;
}

// ---------- Passo 1: escolher barbeiro ----------
const barberGrid = document.getElementById("barber-grid");
BARBEIROS.forEach((b) => {
  const card = document.createElement("div");
  card.className = "barber-card";
  card.innerHTML = `
    <div class="barber-avatar">${b.initials}</div>
    <h3>${b.name}</h3>
    <p>Toque para escolher</p>
  `;
  card.addEventListener("click", () => {
    document.querySelectorAll(".barber-card").forEach((c) => c.classList.remove("selected"));
    card.classList.add("selected");
    state.barberId = b.id;
    state.barberName = b.name;
    document.getElementById("btn-to-data").disabled = false;
  });
  barberGrid.appendChild(card);
});

document.getElementById("btn-to-data").addEventListener("click", () => showStep(1));
document.getElementById("btn-back-1").addEventListener("click", () => showStep(0));

// ---------- Passo 2: escolher data ----------
const dateInput = document.getElementById("date-input");
const today = new Date();
dateInput.min = today.toISOString().split("T")[0];

dateInput.addEventListener("change", () => {
  const selected = new Date(dateInput.value + "T00:00:00");
  const day = selected.getDay();
  const feedback = document.getElementById("date-feedback");
  if (!HORARIOS[day]) {
    feedback.textContent = "A barbearia não abre aos domingos. Escolha outro dia.";
    document.getElementById("btn-to-horario").disabled = true;
    state.date = null;
  } else {
    feedback.textContent = `Atendimento das ${HORARIOS[day].abre} às ${HORARIOS[day].fecha}.`;
    document.getElementById("btn-to-horario").disabled = false;
    state.date = dateInput.value;
  }
});

document.getElementById("btn-to-horario").addEventListener("click", async () => {
  showStep(2);
  await carregarHorarios();
});
document.getElementById("btn-back-2").addEventListener("click", () => showStep(0));

// ---------- Passo 3: escolher horário ----------
function gerarSlots(abre, fecha) {
  const slots = [];
  const [hA, mA] = abre.split(":").map(Number);
  const [hF, mF] = fecha.split(":").map(Number);
  let minutos = hA * 60 + mA;
  const fim = hF * 60 + mF;
  while (minutos + DURACAO_SLOT_MIN <= fim) {
    const h = String(Math.floor(minutos / 60)).padStart(2, "0");
    const m = String(minutos % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    minutos += DURACAO_SLOT_MIN;
  }
  return slots;
}

async function carregarHorarios() {
  const timeGrid = document.getElementById("time-grid");
  timeGrid.innerHTML = "<p class='empty-note'>Carregando horários...</p>";

  const day = new Date(state.date + "T00:00:00").getDay();
  const slots = gerarSlots(HORARIOS[day].abre, HORARIOS[day].fecha);

  const q = query(
    collection(db, "agendamentos"),
    where("barberId", "==", state.barberId),
    where("date", "==", state.date)
  );
  const snap = await getDocs(q);
  const ocupados = new Set();
  snap.forEach((doc) => {
    const d = doc.data();
    if (d.status !== "cancelado") ocupados.add(d.time);
  });

  // Se for hoje, esconde horários que já passaram
  const agora = new Date();
  const isHoje = state.date === agora.toISOString().split("T")[0];
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes();

  timeGrid.innerHTML = "";
  let algumDisponivel = false;

  slots.forEach((slot) => {
    const [h, m] = slot.split(":").map(Number);
    if (isHoje && h * 60 + m <= minutosAgora) return;

    const btn = document.createElement("div");
    btn.className = "time-slot" + (ocupados.has(slot) ? " taken" : "");
    btn.textContent = slot;
    if (!ocupados.has(slot)) {
      algumDisponivel = true;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".time-slot").forEach((s) => s.classList.remove("selected"));
        btn.classList.add("selected");
        state.time = slot;
        document.getElementById("btn-to-dados").disabled = false;
      });
    }
    timeGrid.appendChild(btn);
  });

  if (!algumDisponivel) {
    timeGrid.innerHTML = "<p class='empty-note'>Sem horários livres nesse dia. Tente outra data.</p>";
  }
}

document.getElementById("btn-to-dados").addEventListener("click", () => showStep(3));
document.getElementById("btn-back-3").addEventListener("click", () => showStep(1));

// ---------- Passo 4: dados do cliente ----------
const nameInput = document.getElementById("client-name");
const phoneInput = document.getElementById("client-phone");

function validarDados() {
  const ok = nameInput.value.trim().length > 1 && phoneInput.value.trim().length >= 8;
  document.getElementById("btn-confirmar").disabled = !ok;
}
nameInput.addEventListener("input", validarDados);
phoneInput.addEventListener("input", validarDados);

document.getElementById("btn-back-4").addEventListener("click", () => showStep(2));

document.getElementById("btn-confirmar").addEventListener("click", async (e) => {
  const btn = e.target;
  btn.disabled = true;
  btn.textContent = "Confirmando...";

  state.clientName = nameInput.value.trim();
  state.clientPhone = phoneInput.value.trim();

  try {
    await addDoc(collection(db, "agendamentos"), {
      barberId: state.barberId,
      barberName: state.barberName,
      date: state.date,
      time: state.time,
      clientName: state.clientName,
      clientPhone: state.clientPhone,
      status: "confirmado",
      createdAt: Timestamp.now()
    });

    preencherResumo();
    showStep(4);
  } catch (err) {
    console.error(err);
    alert("Não foi possível confirmar o agendamento. Verifique sua internet e tente novamente.");
    btn.disabled = false;
    btn.textContent = "Confirmar agendamento";
  }
});

function preencherResumo() {
  const dataFormatada = new Date(state.date + "T00:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long"
  });
  document.getElementById("resumo-barbeiro").textContent = state.barberName;
  document.getElementById("resumo-data").textContent = dataFormatada;
  document.getElementById("resumo-horario").textContent = state.time;
  document.getElementById("resumo-nome").textContent = state.clientName;

  const msg = encodeURIComponent(
    `Olá! Acabei de agendar um horário na Trevos Barbearia.\n` +
    `Barbeiro: ${state.barberName}\nData: ${dataFormatada}\nHorário: ${state.time}\nNome: ${state.clientName}`
  );
  document.getElementById("whatsapp-confirma").href = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMERO}&text=${msg}`;
}

document.getElementById("btn-novo-agendamento").addEventListener("click", () => {
  window.location.reload();
});

showStep(0);
