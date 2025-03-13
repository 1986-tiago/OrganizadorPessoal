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

/* 
  Armazena todas as metas em formato de objeto, 
  separadas por usuário. Exemplo:
  {
     "admin": [ ... metas ... ],
     "user":  [ ... metas ... ]
  }
*/
let allMetas = JSON.parse(localStorage.getItem("metas")) || {};
let loggedUser = localStorage.getItem("loggedUser");

// Garante que exista um array de metas para o usuário logado
if (loggedUser && !allMetas[loggedUser]) {
    allMetas[loggedUser] = [];
}

// Funções auxiliares para ler e salvar metas do usuário atual
function getUserMetas() {
    if (!loggedUser) return [];
    return allMetas[loggedUser] || [];
}

function setUserMetas(metas) {
    if (!loggedUser) return;
    allMetas[loggedUser] = metas;
    localStorage.setItem("metas", JSON.stringify(allMetas));
}

// Variável global para armazenar o índice da meta em edição (para fechamento)
let currentMetaIndex = null;

// Formata data em YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

/**
 * Dada uma data escolhida pelo usuário, calcula o intervalo (domingo a sábado)
 */
function getSundayAndSaturday(chosenDateStr) {
    let d = new Date(chosenDateStr);
    let day = d.getDay(); // 0 (Domingo) até 6 (Sábado)
    d.setDate(d.getDate() - day); // Ajusta para o domingo
    const sunday = new Date(d);
    let saturday = new Date(sunday);
    saturday.setDate(saturday.getDate() + 6);
    return {
        start: formatDate(sunday),
        end: formatDate(saturday)
    };
}

// --- Lógica para exibir o calendário customizado ---

function showCustomCalendar() {
    let input = document.getElementById("semana");
    let container = document.getElementById("customCalendarContainer");
    
    // Define a data base: se o input já tiver valor, use-o; senão, use hoje.
    let currentDate = input.value ? new Date(input.value) : new Date();
    let year = currentDate.getFullYear();
    let month = currentDate.getMonth();
    
    // Primeiro e último dia do mês
    let firstDayOfMonth = new Date(year, month, 1);
    let lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Calcular o início (domingo antes ou igual) e o fim (sábado depois ou igual) para preencher semanas completas
    let startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
    let endDate = new Date(lastDayOfMonth);
    endDate.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay()));
    
    let html = "<table class='custom-calendar-table'>";
    // Cabeçalho dos dias da semana
    let daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    html += "<thead><tr>";
    daysOfWeek.forEach(day => {
        html += `<th>${day}</th>`;
    });
    html += "</tr></thead>";
    
    html += "<tbody>";
    let dateIterator = new Date(startDate);
    while (dateIterator <= endDate) {
        html += "<tr>";
        for (let i = 0; i < 7; i++) {
            let cellDate = new Date(dateIterator);
            let cellDateStr = formatDate(cellDate);
            html += `<td data-date="${cellDateStr}">${cellDate.getDate()}</td>`;
            dateIterator.setDate(dateIterator.getDate() + 1);
        }
        html += "</tr>";
    }
    html += "</tbody></table>";
    
    container.innerHTML = html;
    container.style.display = "block";
    
    // Adiciona eventos de mouseover/mouseout para iluminar toda a semana (linha)
    let rows = container.querySelectorAll("tbody tr");
    rows.forEach(row => {
        row.addEventListener("mouseover", function() {
            row.querySelectorAll("td").forEach(cell => cell.classList.add("highlight"));
        });
        row.addEventListener("mouseout", function() {
            row.querySelectorAll("td").forEach(cell => cell.classList.remove("highlight"));
        });
    });
    
    // Ao clicar em um dia, define o valor no input e oculta o calendário
    let cells = container.querySelectorAll("td");
    cells.forEach(cell => {
        cell.addEventListener("click", function() {
            let selectedDate = cell.getAttribute("data-date");
            input.value = selectedDate;
            container.style.display = "none";
        });
    });
}

// Esconde o calendário customizado (opcional: pode ser usado ao clicar fora)
function hideCustomCalendar() {
    let container = document.getElementById("customCalendarContainer");
    container.style.display = "none";
}

// Ao clicar no input "semana", exibe o calendário customizado
document.getElementById("semana").addEventListener("click", function(e) {
    showCustomCalendar();
});

// --- Fim da lógica do calendário customizado ---

// Adicionar meta semanal
document.getElementById("metaForm")?.addEventListener("submit", function(event) {
    event.preventDefault();
    
    const metaNome = document.getElementById("metaNome").value;
    const quantidade = document.getElementById("quantidade").value;
    const chosenDate = document.getElementById("semana").value; // Valor definido pelo calendário customizado
    
    const boundaries = getSundayAndSaturday(chosenDate);
    
    const meta = { 
        metaNome, 
        quantidade, 
        semana: chosenDate,  
        start: boundaries.start, // domingo
        end: boundaries.end,     // sábado
        status: "Pendente",
        type: "semanal"
    };

    let metas = getUserMetas();
    metas.push(meta);
    setUserMetas(metas);

    renderCalendar();
    document.getElementById("metaForm").reset();
});

// Variável global para armazenar o mês/ano atualmente exibido no calendário principal
let currentCalendarDate = new Date();

// Renderiza o calendário principal (do mês atual) com metas diárias e semanais
function renderCalendar() {
    const calendario = document.getElementById("calendario");
    if (!calendario) return;
    
    let metas = getUserMetas();

    // Usa currentCalendarDate para definir o mês e ano exibidos
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay()));
    
    let currentDate = new Date(startDate);
    
    // Cria cabeçalho com navegação e exibição do mês e ano
    const calendarHeader = document.createElement("div");
    calendarHeader.classList.add("d-flex", "justify-content-between", "align-items-center", "mb-3");
    
    const prevButton = document.createElement("button");
    prevButton.classList.add("btn", "btn-secondary", "btn-sm");
    prevButton.innerText = "Anterior";
    prevButton.addEventListener("click", function() {
         currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
         renderCalendar();
    });
    
    const nextButton = document.createElement("button");
    nextButton.classList.add("btn", "btn-secondary", "btn-sm");
    nextButton.innerText = "Próximo";
    nextButton.addEventListener("click", function() {
         currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
         renderCalendar();
    });
    
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const monthYearText = document.createElement("span");
    monthYearText.innerText = monthNames[month] + " " + year;
    
    calendarHeader.appendChild(prevButton);
    calendarHeader.appendChild(monthYearText);
    calendarHeader.appendChild(nextButton);
    
    let table = document.createElement("table");
    table.classList.add("table", "table-bordered");
    
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    daysOfWeek.forEach(day => {
        const th = document.createElement("th");
        th.innerText = day;
        headerRow.appendChild(th);
    });
    const thExtra = document.createElement("th");
    thExtra.innerText = "Metas Semanais";
    headerRow.appendChild(thExtra);
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement("tbody");
    
    while (currentDate <= endDate) {
        let row = document.createElement("tr");
        
        const weekStartDate = new Date(currentDate);
        const weekStartStr = formatDate(weekStartDate);
        
        for (let i = 0; i < 7; i++) {
            let cell = document.createElement("td");
            cell.classList.add("day-cell");
            const cellDate = new Date(currentDate);
            const cellDateStr = formatDate(cellDate);
            
            let dayDiv = document.createElement("div");
            dayDiv.classList.add("day-number");
            dayDiv.innerText = cellDate.getDate();
            cell.appendChild(dayDiv);
            
            // Exibe metas diárias deste dia
            metas.filter(m => m.type === "diaria" && m.dia === cellDateStr)
                 .forEach(meta => {
                     let metaDiv = document.createElement("div");
                     metaDiv.classList.add("daily-meta");
                     metaDiv.innerHTML = `<strong>${meta.metaNome}</strong> (${meta.quantidade}) 
                        - <span class="text-${
                            meta.status === 'Cumprida' ? 'success' : (meta.status === 'Não Cumprida' ? 'danger' : 'secondary')
                        }">${meta.status}</span>
                        <button class="btn btn-sm btn-warning" onclick="openFecharMetaModal(${metas.indexOf(meta)})">Fechar Meta</button>`;
                     cell.appendChild(metaDiv);
                 });
            
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
        
        let weekMetaCell = document.createElement("td");
        metas.filter(m => m.type === "semanal" && m.start === weekStartStr)
             .forEach(meta => {
                 let metaDiv = document.createElement("div");
                 metaDiv.classList.add("week-meta");
                 metaDiv.innerHTML = `<strong>${meta.metaNome}</strong> (${meta.quantidade}) 
                    - <span class="text-${
                        meta.status === 'Cumprida' ? 'success' : (meta.status === 'Não Cumprida' ? 'danger' : 'secondary')
                    }">${meta.status}</span>
                    <button class="btn btn-sm btn-warning" onclick="openFecharMetaModal(${metas.indexOf(meta)})">Fechar Meta</button>`;
                 weekMetaCell.appendChild(metaDiv);
             });
        row.appendChild(weekMetaCell);
        
        tbody.appendChild(row);
    }
    table.appendChild(tbody);
    
    calendario.innerHTML = "";
    calendario.appendChild(calendarHeader);
    calendario.appendChild(table);
}

// Abre o modal para fechar meta e define currentMetaIndex
function openFecharMetaModal(index) {
    currentMetaIndex = index;
    var fecharModal = new bootstrap.Modal(document.getElementById('fecharMetaModal'));
    fecharModal.show();
}

// Configura ações dos botões do modal
document.getElementById("btnCumprida").addEventListener("click", function() {
    if (currentMetaIndex !== null) {
        let metas = getUserMetas();
        metas[currentMetaIndex].status = "Cumprida";
        setUserMetas(metas);
        renderCalendar();
        bootstrap.Modal.getInstance(document.getElementById('fecharMetaModal')).hide();
        currentMetaIndex = null;
    }
});

document.getElementById("btnNaoCumprida").addEventListener("click", function() {
    if (currentMetaIndex !== null) {
        let metas = getUserMetas();
        metas[currentMetaIndex].status = "Não Cumprida";
        setUserMetas(metas);
        renderCalendar();
        bootstrap.Modal.getInstance(document.getElementById('fecharMetaModal')).hide();
        currentMetaIndex = null;
    }
});

document.getElementById("btnExcluir").addEventListener("click", function() {
    if (currentMetaIndex !== null) {
        let metas = getUserMetas();
        metas.splice(currentMetaIndex, 1);
        setUserMetas(metas);
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
    
    if (metaNome && quantidade && dia) {
        let metas = getUserMetas();
        const meta = {
            metaNome,
            quantidade,
            dia,
            status: "Pendente",
            type: "diaria"
        };
        metas.push(meta);
        setUserMetas(metas);
        renderCalendar();
        bootstrap.Modal.getInstance(document.getElementById('dailyMetaModal')).hide();
    }
});

// Renderiza o calendário principal ao carregar
renderCalendar();
