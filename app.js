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

// Variável global para armazenar o índice da meta em edição (para fechamento)
let currentMetaIndex = null;

// Função para formatar data como YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth()+1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

// Função para calcular limites da semana (domingo a sábado) a partir do input week (ISO, que começa na segunda)
function computeWeekBoundaries(weekString) {
    // weekString no formato "YYYY-Www"
    const [yearStr, weekStr] = weekString.split("-W");
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    // Calcula a data da segunda-feira da ISO week
    let simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    let monday = new Date(simple);
    if (dow <= 4) {
        monday.setDate(simple.getDate() - (dow - 1));
    } else {
        monday.setDate(simple.getDate() + (8 - dow));
    }
    // Domingo é o dia anterior à segunda-feira
    let sunday = new Date(monday);
    sunday.setDate(monday.getDate() - 1);
    // Sábado é 6 dias após o domingo
    let saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    return { start: formatDate(sunday), end: formatDate(saturday) };
}

// Adicionar meta semanal
document.getElementById("metaForm")?.addEventListener("submit", function(event) {
    event.preventDefault();
    
    const metaNome = document.getElementById("metaNome").value;
    const quantidade = document.getElementById("quantidade").value;
    const semana = document.getElementById("semana").value;
    
    const boundaries = computeWeekBoundaries(semana);
    
    const meta = { 
        metaNome, 
        quantidade, 
        semana, 
        start: boundaries.start, 
        end: boundaries.end, 
        status: "Pendente",
        type: "semanal"
    };
    metas.push(meta);
    localStorage.setItem("metas", JSON.stringify(metas));
    renderCalendar();
    document.getElementById("metaForm").reset();
});

// Função para renderizar o calendário
function renderCalendar() {
    const calendario = document.getElementById("calendario");
    if (!calendario) return;
    
    // Exibir o calendário do mês atual
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Primeiro e último dia do mês
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Ajustar para mostrar semanas completas (domingo a sábado)
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay()));
    
    let currentDate = new Date(startDate);
    
    let table = document.createElement("table");
    table.classList.add("table", "table-bordered");
    
    // Cabeçalho do calendário
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    daysOfWeek.forEach(day => {
        const th = document.createElement("th");
        th.innerText = day;
        headerRow.appendChild(th);
    });
    // Coluna extra para metas semanais
    const thExtra = document.createElement("th");
    thExtra.innerText = "Metas Semanais";
    headerRow.appendChild(thExtra);
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement("tbody");
    
    // Loop para cada semana
    while (currentDate <= endDate) {
        let row = document.createElement("tr");
        
        // Data de domingo desta semana (início)
        const weekStartDate = new Date(currentDate);
        const weekStartStr = formatDate(weekStartDate);
        
        // 7 dias da semana
        for (let i = 0; i < 7; i++) {
            let cell = document.createElement("td");
            cell.classList.add("day-cell");
            const cellDate = new Date(currentDate);
            const cellDateStr = formatDate(cellDate);
            
            // Exibir número do dia
            let dayDiv = document.createElement("div");
            dayDiv.classList.add("day-number");
            dayDiv.innerText = cellDate.getDate();
            cell.appendChild(dayDiv);
            
            // Listar metas diárias deste dia
            metas.filter(m => m.type === "diaria" && m.dia === cellDateStr)
                 .forEach(meta => {
                     let metaDiv = document.createElement("div");
                     metaDiv.classList.add("daily-meta");
                     metaDiv.innerHTML = `<strong>${meta.metaNome}</strong> (${meta.quantidade}) 
                        - <span class="text-${meta.status === 'Cumprida' ? 'success' : (meta.status === 'Não Cumprida' ? 'danger' : 'secondary')}">${meta.status}</span>
                        <button class="btn btn-sm btn-warning" onclick="openFecharMetaModal(${metas.indexOf(meta)})">Fechar Meta</button>`;
                     cell.appendChild(metaDiv);
                 });
            
            // Botão para adicionar meta diária
            let addBtn = document.createElement("button");
            addBtn.classList.add("btn", "btn-sm", "btn-primary", "mt-1");
            addBtn.innerText = "Adicionar Meta Diária";
            addBtn.onclick = function(e) {
                e.stopPropagation();
                openDailyMetaModal(cellDateStr);
            };
            cell.appendChild(addBtn);
            
            row.appendChild(cell);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Coluna para metas semanais da semana (filtrando as que têm start igual ao domingo desta semana)
        let weekMetaCell = document.createElement("td");
        metas.filter(m => m.type === "semanal" && m.start === weekStartStr)
             .forEach(meta => {
                 let metaDiv = document.createElement("div");
                 metaDiv.classList.add("week-meta");
                 metaDiv.innerHTML = `<strong>${meta.metaNome}</strong> (${meta.quantidade}) 
                    - <span class="text-${meta.status === 'Cumprida' ? 'success' : (meta.status === 'Não Cumprida' ? 'danger' : 'secondary')}">${meta.status}</span>
                    <button class="btn btn-sm btn-warning" onclick="openFecharMetaModal(${metas.indexOf(meta)})">Fechar Meta</button>`;
                 weekMetaCell.appendChild(metaDiv);
             });
        row.appendChild(weekMetaCell);
        
        tbody.appendChild(row);
    }
    table.appendChild(tbody);
    
    calendario.innerHTML = "";
    calendario.appendChild(table);
}

// Abre o modal para fechar meta e armazena o índice da meta selecionada
function openFecharMetaModal(index) {
    currentMetaIndex = index;
    var fecharModal = new bootstrap.Modal(document.getElementById('fecharMetaModal'));
    fecharModal.show();
}

// Configura as ações do modal de fechar meta
document.getElementById("btnCumprida").addEventListener("click", function() {
    if (currentMetaIndex !== null) {
        metas[currentMetaIndex].status = "Cumprida";
        localStorage.setItem("metas", JSON.stringify(metas));
        renderCalendar();
        bootstrap.Modal.getInstance(document.getElementById('fecharMetaModal')).hide();
        currentMetaIndex = null;
    }
});

document.getElementById("btnNaoCumprida").addEventListener("click", function() {
    if (currentMetaIndex !== null) {
        metas[currentMetaIndex].status = "Não Cumprida";
        localStorage.setItem("metas", JSON.stringify(metas));
        renderCalendar();
        bootstrap.Modal.getInstance(document.getElementById('fecharMetaModal')).hide();
        currentMetaIndex = null;
    }
});

document.getElementById("btnExcluir").addEventListener("click", function() {
    if (currentMetaIndex !== null) {
        metas.splice(currentMetaIndex, 1);
        localStorage.setItem("metas", JSON.stringify(metas));
        renderCalendar();
        bootstrap.Modal.getInstance(document.getElementById('fecharMetaModal')).hide();
        currentMetaIndex = null;
    }
});

// Abre o modal para adicionar meta diária para o dia selecionado
function openDailyMetaModal(dateStr) {
    document.getElementById("dailyMetaDate").value = dateStr;
    document.getElementById("dailyMetaForm").reset();
    var dailyModal = new bootstrap.Modal(document.getElementById('dailyMetaModal'));
    dailyModal.show();
}

// Salva a meta diária a partir do modal
document.getElementById("saveDailyMeta").addEventListener("click", function() {
    const metaNome = document.getElementById("dailyMetaNome").value;
    const quantidade = document.getElementById("dailyQuantidade").value;
    const dia = document.getElementById("dailyMetaDate").value;
    if(metaNome && quantidade && dia) {
        const meta = {
            metaNome,
            quantidade,
            dia,
            status: "Pendente",
            type: "diaria"
        };
        metas.push(meta);
        localStorage.setItem("metas", JSON.stringify(metas));
        renderCalendar();
        bootstrap.Modal.getInstance(document.getElementById('dailyMetaModal')).hide();
    }
});

// Renderiza o calendário ao carregar
renderCalendar();
