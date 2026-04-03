function getStoredTasks() {
  const raw = localStorage.getItem ('kineticTasks');
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem('kineticTasks', JSON.stringify(tasks));
}

function getStoredBoards() {
  const raw = localStorage.getItem('kineticBoards');
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBoards(boards) {
  localStorage.setItem('kineticBoards', JSON.stringify(boards));
}

function computeStats(tasks) {
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  return { total, pending, completed };
}

function updateStats(tasks) {
  const totalTasksEl = document.querySelector('.total-tasks');
  const pendingEl = document.querySelector('.pending');
  const completedEl = document.querySelector('.completed');

  if (totalTasksEl) totalTasksEl.textContent = tasks.length;
  if (pendingEl) pendingEl.textContent = tasks.filter(t => t.status === 'pending').length;
  if (completedEl) completedEl.textContent = tasks.filter(t => t.status === 'completed').length;

  const dashboardStats = document.querySelector('.js-dashboard-stats');
  if (dashboardStats) {
    const stats = computeStats(tasks);
    dashboardStats.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div class="bg-surface-container-low rounded-xl p-6 border border-white/[0.03]">
          <h3 class="text-xs uppercase text-on-surface-variant">Total Tasks</h3>
          <p class="text-3xl font-black">${stats.total}</p>
        </div>
        <div class="bg-surface-container-low rounded-xl p-6 border border-white/[0.03]">
          <h3 class="text-xs uppercase text-on-surface-variant">Pending</h3>
          <p class="text-3xl font-black">${stats.pending}</p>
        </div>
        <div class="bg-surface-container-low rounded-xl p-6 border border-white/[0.03]">
          <h3 class="text-xs uppercase text-on-surface-variant">Completed</h3>
          <p class="text-3xl font-black">${stats.completed}</p>
        </div>
      </div>
    `;
  }
}

function updateStatsFromBoards() {
  const boards = getStoredBoards();
  let totalTasks = 0;
  let completedTasks = 0;
  let totalBoards = boards.length;
  let todoBoards = boards.filter(board => (board.status || 'todo') === 'todo').length;
  let inProgressBoards = boards.filter(board => (board.status || 'todo') === 'inprogress').length;

  boards.forEach(board => {
    if (board.tasks) {
      totalTasks += board.tasks.length;
      completedTasks += board.tasks.filter(task => task.status === 'completed').length;
    }
  });

  const statsElements = document.querySelectorAll('.stats-total, .stats-completed, .stats-pending');
  statsElements.forEach(el => {
    if (el.classList.contains('stats-total')) el.textContent = totalTasks;
    if (el.classList.contains('stats-completed')) el.textContent = completedTasks;
    if (el.classList.contains('stats-pending')) el.textContent = totalTasks - completedTasks;
  });

  // Update Kanban column counters
  const todoCounter = document.querySelector('.kanban-todo-count');
  const inProgressCounter = document.querySelector('.kanban-inprogress-count');

  if (todoCounter) todoCounter.textContent = todoBoards;
  if (inProgressCounter) inProgressCounter.textContent = inProgressBoards;
}

function renderBoards() {
  const boardsContainer = document.querySelector('.boards-list');
  if (!boardsContainer) return;

  const boards = getStoredBoards();
  if (!boards || boards.length === 0) {
    boardsContainer.innerHTML = '<p class="text-on-surface-variant col-span-full text-center py-8">Nenhum board criado ainda.</p>';
    return;
  }

  boardsContainer.innerHTML = '<ul class="space-y-2">';
  const list = boardsContainer.querySelector('ul');

  boards.forEach(board => {
    const item = document.createElement('li');
    item.className = 'flex items-center justify-between bg-surface-container-high p-2 rounded-lg border border-white/[0.05]';
    item.innerHTML = `
      <span class="text-xs">${board.name} · ${board.priority || 'medium'} · ${board.theme || 'N/A'}</span>
      <button class="text-error text-xs" onclick="deleteBoard('${board.id}')">Excluir</button>
    `;
    list.appendChild(item);
  });
}

function renderBoardSelector() {
  const selector = document.getElementById('boardSelector');
  if (!selector) return;

  const boards = getStoredBoards();
  selector.innerHTML = '<option value="">Choose a board...</option>';

  boards.forEach(board => {
    const option = document.createElement('option');
    option.value = board.id;
    option.textContent = board.name;
    selector.appendChild(option);
  });
}

function renderBoardTasks(boardId) {
  const tasksContainer = document.querySelector('.board-tasks-list');
  const section = document.getElementById('boardTasksSection');
  const boardNameEl = document.getElementById('selectedBoardName');

  if (!boardId) {
    section.classList.add('hidden');
    return;
  }

  const boards = getStoredBoards();
  const board = boards.find(b => b.id === boardId);

  if (!board) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  boardNameEl.textContent = board.name;

  if (!board.tasks || board.tasks.length === 0) {
    tasksContainer.innerHTML = '<p class="text-on-surface-variant">Nenhuma tarefa neste board.</p>';
    return;
  }

  tasksContainer.innerHTML = '';
  board.tasks.forEach(task => {
    const row = document.createElement('div');
    row.className = 'p-2 mb-2 rounded-md bg-surface-container-high border border-white/[0.06] flex justify-between items-center';

    const info = document.createElement('div');
    info.className = 'flex items-center gap-3';

    const title = document.createElement('span');
    title.textContent = task.title;
    if (task.status === 'completed') title.className = 'line-through text-on-surface-variant';

    const badge = document.createElement('span');
    badge.textContent = task.status;
    badge.className = 'text-[10px] font-bold px-2 py-1 rounded-full ' +
      (task.status === 'completed' ? 'bg-secondary/20 text-secondary' : 'bg-tertiary/20 text-tertiary');

    info.append(title, badge);

    const actions = document.createElement('div');
    actions.className = 'flex items-center gap-2';

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = task.status === 'completed' ? 'Reabrir' : 'Concluir';
    toggleBtn.className = 'text-xs px-2 py-1 rounded bg-primary/15 hover:bg-primary/25';
    toggleBtn.addEventListener('click', () => updateTaskStatusInBoard(boardId, task.id, task.status === 'completed' ? 'pending' : 'completed'));

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Excluir';
    deleteBtn.className = 'text-xs px-2 py-1 rounded bg-error-container/20 hover:bg-error-container/30';
    deleteBtn.addEventListener('click', () => deleteTaskFromBoard(boardId, task.id));

    actions.append(toggleBtn, deleteBtn);
    row.append(info, actions);
    tasksContainer.appendChild(row);
  });
}
function renderBoardsInKanban() {
  const todoColumn = document.querySelector('.kanban-todo-column');
  const inProgressColumn = document.querySelector('.kanban-inprogress-column');
  if (!todoColumn || !inProgressColumn) return;

  const todoContainer = document.getElementById('todoBoardCardsContainer');
  const inProgressContainer = document.getElementById('inProgressBoardCardsContainer');
  if (!todoContainer || !inProgressContainer) return;

  const boards = getStoredBoards();

  // limpar colunas
  todoContainer.innerHTML = '';
  inProgressContainer.innerHTML = '';

  const filteredTodo = boards.filter(b => (b.status || 'todo') === 'todo');
  const filteredInProgress = boards.filter(b => (b.status || 'todo') === 'inprogress');

  const addTaskBtn = todoColumn.querySelector('.add-task-btn');
  if (filteredTodo.length > 0) {
    if (addTaskBtn) addTaskBtn.style.display = 'none';
  } else {
    if (addTaskBtn) addTaskBtn.style.display = 'block';
  }

  const renderCard = (board, targetStatus) => {
    const boardCard = document.createElement('div');
    boardCard.className = 'board-card group bg-surface-container-low p-5 rounded-xl border border-outline-variant/5 hover:border-primary/20 hover:bg-surface-container-high transition-all duration-300';

    const title = document.createElement('h4');
    title.className = 'text-base font-bold text-on-surface mb-2';
    title.textContent = board.name;

    const desc = document.createElement('p');
    desc.className = 'text-xs text-on-surface-variant mb-3';
    desc.textContent = board.description || 'Sem descrição';

    const statusBtn = document.createElement('button');
    statusBtn.className = 'text-xs px-2 py-1 rounded bg-primary/15 hover:bg-primary/25';

    let completeBtn;
    if (targetStatus === 'inprogress') {
      statusBtn.textContent = 'Mover para In Progress';
      statusBtn.addEventListener('click', () => moveBoardStatus(board.id, 'inprogress'));
    } else {
      statusBtn.textContent = 'Mover para To Do';
      statusBtn.addEventListener('click', () => moveBoardStatus(board.id, 'todo'));

      // Botão Concluir só aparece no card In Progress
      completeBtn = document.createElement('button');
      completeBtn.className = 'text-xs px-2 py-1 rounded bg-success-container/20 hover:bg-success-container/30';
      completeBtn.textContent = 'Concluir';
      completeBtn.addEventListener('click', () => moveBoardStatus(board.id, 'done'));
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'text-xs px-2 py-1 rounded bg-error-container/20 hover:bg-error-container/30 ml-2';
    deleteBtn.textContent = 'Excluir';
    deleteBtn.addEventListener('click', () => deleteBoard(board.id));

    const controls = document.createElement('div');
    controls.className = 'flex items-center gap-2';
    controls.append(statusBtn, deleteBtn);
    if (completeBtn) controls.append(completeBtn);

    boardCard.append(title, desc, controls);
    return boardCard;
  };

  filteredTodo.forEach(board => {
    const card = renderCard(board, 'inprogress');
    todoContainer.appendChild(card);
  });

  filteredInProgress.forEach(board => {
    const card = renderCard(board, 'todo');
    inProgressContainer.appendChild(card);
  });

  // Atualiza counters
  const todoCounter = document.querySelector('.kanban-todo-count');
  const inProgressCounter = document.querySelector('.kanban-inprogress-count');
  if (todoCounter) todoCounter.textContent = filteredTodo.length;
  if (inProgressCounter) inProgressCounter.textContent = filteredInProgress.length;
}

function moveBoardStatus(boardId, status) {
  const boards = getStoredBoards();
  const board = boards.find(b => b.id === boardId);
  if (!board) return;
  board.status = status;
  saveBoards(boards);
  refreshBoardsUI();
}
function refreshBoardsUI() {
  renderBoards();
  renderBoardsInKanban();
  updateStatsFromBoards();
  refreshListsUI();
}

function refreshListsUI() {
  renderBoardSelector();
  const selector = document.getElementById('boardSelector');
  if (selector) {
    renderBoardTasks(selector.value);
  }
}

function refreshUI() {
  const tasks = getStoredTasks();
  renderTasks(tasks);
  updateStats(tasks);
}

function addTask(title) {
  if (!title) return;
  const tasks = getStoredTasks();
  const task = { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), title, status: 'pending' };
  tasks.push(task);
  saveTasks(tasks);
  refreshUI();
}

function updateTaskStatus(taskId, status) {
  const tasks = getStoredTasks().map(task => task.id === taskId ? { ...task, status } : task);
  saveTasks(tasks);
  refreshUI();
}

function addBoard(name, description, priority, dueDate, theme, assignee) {
  if (!name) return;
  const boards = getStoredBoards();
  const board = {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    name,
    description: description || '',
    priority: priority || 'medium',
    dueDate: dueDate || null,
    theme: theme || '',
    assignee: assignee || '',
    status: 'todo',
    tasks: []
  };
  boards.push(board);
  saveBoards(boards);
  refreshBoardsUI();
}

function deleteBoard(boardId) {
  const boards = getStoredBoards().filter(board => board.id !== boardId);
  saveBoards(boards);
  refreshBoardsUI();
}

function addTaskToBoard(boardId, title) {
  if (!title) return;
  const boards = getStoredBoards();
  const board = boards.find(b => b.id === boardId);
  if (board) {
    const task = { id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), title, status: 'pending' };
    board.tasks.push(task);
    saveBoards(boards);
    refreshBoardsUI();
  }
}

function updateTaskStatusInBoard(boardId, taskId, status) {
  const boards = getStoredBoards();
  const board = boards.find(b => b.id === boardId);
  if (board) {
    board.tasks = board.tasks.map(task => task.id === taskId ? { ...task, status } : task);
    saveBoards(boards);
    refreshBoardsUI();
  }
}

function deleteTaskFromBoard(boardId, taskId) {
  const boards = getStoredBoards();
  const board = boards.find(b => b.id === boardId);
  if (board) {
    board.tasks = board.tasks.filter(task => task.id !== taskId);
    saveBoards(boards);
    refreshBoardsUI();
  }
}

const addBtn = document.getElementById('addTaskBtn');
if (addBtn) {
  addBtn.addEventListener('click', () => {
    const input = document.getElementById('newTaskInput');
    const title = input.value.trim();
    if (!title) return;
    addTask(title);
    input.value = '';
  });
}

const createBoardBtn = document.getElementById('createBoardBtn');
if (createBoardBtn) {
  createBoardBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('newBoardInput');
    const descriptionInput = document.getElementById('boardDescription');
    const prioritySelect = document.getElementById('boardPriority');
    const dueDateInput = document.getElementById('boardDueDate');
    const themeSelect = document.getElementById('boardTheme');
    const assigneeSelect = document.getElementById('boardAssignee');

    const name = nameInput.value.trim();
    const description = descriptionInput.value.trim();
    const priority = prioritySelect.value;
    const dueDate = dueDateInput.value;
    const theme = themeSelect.value;
    const assignee = assigneeSelect.value;

    if (!name) return;

    addBoard(name, description, priority, dueDate, theme, assignee);

    // Clear form
    nameInput.value = '';
    descriptionInput.value = '';
    prioritySelect.value = 'medium';
    dueDateInput.value = '';
    themeSelect.value = 'design';
    assigneeSelect.value = 'alex-chen';
  });
}

const boardSelector = document.getElementById('boardSelector');
if (boardSelector) {
  boardSelector.addEventListener('change', (e) => {
    renderBoardTasks(e.target.value);
  });
}

const addBoardTaskBtn = document.getElementById('addBoardTaskBtn');
if (addBoardTaskBtn) {
  addBoardTaskBtn.addEventListener('click', () => {
    const selector = document.getElementById('boardSelector');
    const input = document.getElementById('newBoardTaskInput');
    const boardId = selector.value;
    const title = input.value.trim();
    if (!boardId || !title) return;
    addTaskToBoard(boardId, title);
    input.value = '';
    renderBoardTasks(boardId);
  });
}
function renderTasks(tasks) {//criada por ultimo por andrefortunato
  const container = document.querySelector('.tasks-list');
  if (!container) return;

  container.innerHTML = '';

  tasks.forEach(task => {
    const div = document.createElement('div');
    div.textContent = task.title;
    container.appendChild(div);
  });
}
function initBoardApp() {
  console.log('INIT RUNNING');
  console.log(getStoredBoards());
  
  refreshUI();
  refreshBoardsUI();
  refreshListsUI();
}

window.addEventListener('load', initBoardApp);

