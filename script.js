// ===============================
// 📦 Load Tasks
// ===============================
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// ===============================
// ⏰ Set Minimum Date-Time
// ===============================
function setMinDateTime() {
  const now = new Date();
  const formatted = now.toISOString().slice(0,16);
  document.getElementById("dueDate").min = formatted;
}
setMinDateTime();

// ===============================
// 💾 Save Tasks
// ===============================
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// ===============================
// ➕ Add Task
// ===============================
function addTask() {
  const title = document.getElementById("title").value;
  const dueDate = document.getElementById("dueDate").value;

  if (!title) return alert("Enter task");
  if (!dueDate) return alert("Select date & time");

  const task = {
    id: Date.now(),
    title,
    priority: document.getElementById("priority").value,
    category: document.getElementById("category").value,
    dueDate,
    completed: false
  };

  tasks.push(task);
  saveTasks();

  document.getElementById("title").value = "";
  document.getElementById("dueDate").value = "";

  renderTasks();
}

// ===============================
// ✏️ Edit Task
// ===============================
function editTask(id) {
  const task = tasks.find(t => t.id === id);

  const newTitle = prompt("Edit Task Title", task.title);
  if (!newTitle) return;

  const newDate = prompt("Edit Date (YYYY-MM-DDTHH:MM)", task.dueDate);
  if (!newDate) return;

  task.title = newTitle;
  task.dueDate = newDate;

  saveTasks();
  renderTasks();
}

// ===============================
// ❌ Delete Task
// ===============================
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

// ===============================
// ✅ Toggle Complete
// ===============================
function toggleTask(id) {
  tasks = tasks.map(t =>
    t.id === id ? {...t, completed: !t.completed} : t
  );
  saveTasks();
  renderTasks();
}

// ===============================
// 📅 Format Date-Time
// ===============================
function formatDateTime(dateTime) {
  if (!dateTime) return "No deadline";

  return new Date(dateTime).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

// ===============================
// ⏳ Countdown
// ===============================
function getCountdown(dateTime) {
  const now = new Date();
  const target = new Date(dateTime);
  const diff = target - now;

  if (diff <= 0) return "Time passed";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000*60*60)) / (1000*60));

  return `${hours}h ${minutes}m left`;
}

// ===============================
// 🔔 Notification
// ===============================
if ("Notification" in window) {
  Notification.requestPermission();
}

function checkAlerts() {
  const now = new Date();

  tasks.forEach(task => {
    if (!task.completed && task.dueDate) {
      const diff = new Date(task.dueDate) - now;

      if (diff > 0 && diff < 5 * 60 * 1000) {
        if (Notification.permission === "granted") {
          new Notification("Task Reminder", {
            body: task.title + " is due soon"
          });
        }
      }
    }
  });
}
setInterval(checkAlerts, 60000);

// ===============================
// 🧲 Drag & Drop
// ===============================
let draggedId = null;

document.addEventListener("dragstart", (e) => {
  if (e.target.classList.contains("task")) {
    draggedId = e.target.dataset.id;
    e.target.classList.add("dragging");
  }
});

document.addEventListener("dragend", (e) => {
  if (e.target.classList.contains("task")) {
    e.target.classList.remove("dragging");
  }
});

document.getElementById("taskList").addEventListener("dragover", (e) => {
  e.preventDefault();
});

document.getElementById("taskList").addEventListener("drop", (e) => {
  const target = e.target.closest(".task");
  if (!target) return;

  const targetId = target.dataset.id;

  const draggedIndex = tasks.findIndex(t => t.id == draggedId);
  const targetIndex = tasks.findIndex(t => t.id == targetId);

  const [movedTask] = tasks.splice(draggedIndex, 1);
  tasks.splice(targetIndex, 0, movedTask);

  saveTasks();
  renderTasks();
});

// ===============================
// 📊 Chart
// ===============================
let chart;

function renderChart() {
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.length - completed;

  const canvas = document.getElementById("taskChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: ["Completed", "Pending"],
    datasets: [{
      data: [completed, pending],
      backgroundColor: ["#4CAF50", "#FF5252"]
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false   // 🔥 THIS FIXES SIZE ISSUE
  }
});
}

// ===============================
// 📋 Render Tasks
// ===============================
function renderTasks() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";

  let filtered = [...tasks];

  const search = document.getElementById("search").value.toLowerCase();
  const status = document.getElementById("filterStatus").value;
  const priority = document.getElementById("filterPriority").value;

  if (search) {
    filtered = filtered.filter(t => t.title.toLowerCase().includes(search));
  }

  if (status === "completed") {
    filtered = filtered.filter(t => t.completed);
  } else if (status === "pending") {
    filtered = filtered.filter(t => !t.completed);
  }

  if (priority !== "all") {
    filtered = filtered.filter(t => t.priority === priority);
  }

  filtered.forEach(task => {
    const div = document.createElement("div");

    div.className = `task glass ${task.priority.toLowerCase()} ${task.completed ? "completed":""}`;
    div.setAttribute("draggable", true);
    div.dataset.id = task.id;

    if (new Date(task.dueDate) < new Date() && !task.completed) {
      div.classList.add("overdue");
    }

    div.innerHTML = `
      <div class="task-header">
        <h3>${task.title}</h3>
        <span class="badge ${task.priority.toLowerCase()}">${task.priority}</span>
      </div>

      <div class="task-body">
        <p><b>Category:</b> ${task.category}</p>
        <p><b>Due:</b> ${formatDateTime(task.dueDate)}</p>
        <p><b>Time Left:</b> ${getCountdown(task.dueDate)}</p>
      </div>

      <div class="task-actions">
        <button onclick="editTask(${task.id})">Edit</button>
        <button onclick="toggleTask(${task.id})">Complete</button>
        <button onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;

    list.appendChild(div);
  });

  document.getElementById("emptyState").style.display =
    filtered.length === 0 ? "block" : "none";

  updateProgress();
  renderChart();
}

// ===============================
// 📊 Progress
// ===============================
function updateProgress() {
  const completed = tasks.filter(t => t.completed).length;
  const percent = tasks.length ? (completed / tasks.length) * 100 : 0;
  document.getElementById("progressBar").style.width = percent + "%";
}

// ===============================
// 🌙 Theme Toggle
// ===============================
document.getElementById("toggleTheme").onclick = () => {
  document.body.classList.toggle("dark");
};

// ===============================
// 🔁 Events
// ===============================
document.getElementById("search").addEventListener("input", renderTasks);
document.getElementById("filterStatus").addEventListener("change", renderTasks);
document.getElementById("filterPriority").addEventListener("change", renderTasks);

// ===============================
renderTasks();

if ("serviceWorker" in navigator) {
  if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => console.log("SW Registered"))
      .catch(err => console.log("SW Error:", err));
  });
}
}