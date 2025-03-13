const users = {
    "admin": "1234",
    "user": "senha"
};

// Verifica login
document.getElementById("loginForm")?.addEventListener("submit", function(event) {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
    if (users[username] && users[username] === password) {
        localStorage.setItem("loggedUser", username);
        window.location.href = "main.html";
    } else {
        document.getElementById("loginError").style.display = "block";
    }
});

// Redireciona caso não esteja logado
if (window.location.pathname.includes("main.html")) {
    const user = localStorage.getItem("loggedUser");
    if (!user) {
        window.location.href = "index.html";
    } else {
        document.getElementById("userGreeting").innerText = user;
    }
}

// Logout
function logout() {
    localStorage.removeItem("loggedUser");
    window.location.href = "index.html";
}

// Armazena metas
let metas = JSON.parse(localStorage.getItem("metas")) || [];

// Adicionar meta
document.getElementById("metaForm")?.addEventListener("submit", function(event) {
    event.preventDefault();
    
    const metaNome = document.getElementById("metaNome").value;
    const quantidade = document.getElementById("quantidade").value;
    const semana = document.getElementById("semana").value;
    
    const meta = { metaNome, quantidade, semana, status: "Pendente" };
    metas.push(meta);
    localStorage.setItem("metas", JSON.stringify(metas));
    renderizarCalendario();
});

// Renderiza metas no calendário
function renderizarCalendario() {
    const calendario = document.getElementById("calendario");
    if (!calendario) return;
    calendario.innerHTML = "";
    metas.forEach((meta, index) => {
        const div = document.createElement("div");
        div.classList.add("card", "p-2", "mb-2");
        div.innerHTML = `<strong>${meta.metaNome}</strong> (${meta.quantidade}) - Semana: ${meta.semana} <br>
            Status: <span class="text-${meta.status === 'Cumprida' ? 'success' : 'danger'}">${meta.status}</span>
            <button class="btn btn-sm btn-warning mt-1" onclick="fecharMeta(${index})">Fechar Meta</button>`;
        calendario.appendChild(div);
    });
}

// Fechar meta
function fecharMeta(index) {
    const resultado = confirm("Você cumpriu esta meta?");
    metas[index].status = resultado ? "Cumprida" : "Não Cumprida";
    localStorage.setItem("metas", JSON.stringify(metas));
    renderizarCalendario();
}

renderizarCalendario();
