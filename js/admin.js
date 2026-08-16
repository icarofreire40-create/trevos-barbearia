import { db, auth, BARBEIROS } from "./firebase-config.js";
import {
  signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  collection, query, where, orderBy, onSnapshot, doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const loginWrap = document.getElementById("login-wrap");
const adminShell = document.getElementById("admin-shell");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;
  try {
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (err) {
    loginError.textContent = "E-mail ou senha inválidos.";
  }
});

document.getElementById("logout-link").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginWrap.style.display = "none";
    adminShell.classList.add("active");
    iniciarPainel();
  } else {
    loginWrap.style.display = "flex";
    adminShell.classList.remove("active");
  }
});

// ---------- Painel ----------
const filtroBarbeiro = document.getElementById("filtro-barbeiro");
const filtroData = document.getElementById("filtro-data");
const apptList = document.getElementById("appt-list");

let unsubscribe = null;

function popularFiltroBarbeiros() {
  BARBEIROS.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    filtroBarbeiro.appendChild(opt);
  });
}

function iniciarPainel() {
  popularFiltroBarbeiros();
  const hoje = new Date().toISOString().split("T")[0];
  filtroData.value = hoje;
  carregarAgendamentos();

  filtroBarbeiro.addEventListener("change", carregarAgendamentos);
  filtroData.addEventListener("change", carregarAgendamentos);
}

function carregarAgendamentos() {
  if (unsubscribe) unsubscribe();

  const condicoes = [where("date", "==", filtroData.value)];
  if (filtroBarbeiro.value !== "todos") {
    condicoes.push(where("barberId", "==", filtroBarbeiro.value));
  }

  const q = query(collection(db, "agendamentos"), ...condicoes);

  unsubscribe = onSnapshot(q, (snap) => {
    const agendamentos = [];
    snap.forEach((d) => agendamentos.push({ id: d.id, ...d.data() }));
    agendamentos.sort((a, b) => a.time.localeCompare(b.time));
    renderizarLista(agendamentos);
  }, (err) => {
    console.error(err);
    apptList.innerHTML = "<p class='admin-empty'>Erro ao carregar agendamentos.</p>";
  });
}

function renderizarLista(agendamentos) {
  if (agendamentos.length === 0) {
    apptList.innerHTML = "<p class='admin-empty'>Nenhum agendamento para esse filtro.</p>";
    return;
  }

  apptList.innerHTML = "";
  agendamentos.forEach((a) => {
    const card = document.createElement("div");
    card.className = `appt-card status-${a.status}`;
    card.innerHTML = `
      <div class="appt-info">
        <span class="appt-time">${a.time}</span>
        <span class="appt-client">${a.clientName}</span>
        <span class="appt-sub">${a.barberName} · ${a.clientPhone}</span>
      </div>
      <div class="appt-actions">
        ${a.status === "confirmado" ? `
          <button class="btn-done" data-action="concluido">Concluído</button>
          <button class="btn-cancel" data-action="cancelado">Cancelar</button>
        ` : `<span class="appt-sub">${a.status}</span>`}
      </div>
    `;

    card.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await updateDoc(doc(db, "agendamentos", a.id), { status: btn.dataset.action });
      });
    });

    apptList.appendChild(card);
  });
}
