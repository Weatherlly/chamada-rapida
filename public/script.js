document.addEventListener('DOMContentLoaded', () => {
  const classSelect = document.getElementById('classSelect');
  const dateInput = document.getElementById('dateInput');
  const loadBtn = document.getElementById('loadStudentsBtn');
  const studentsDiv = document.getElementById('studentsList');
  const saveSection = document.getElementById('saveSection');
  const saveBtn = document.getElementById('saveAttendanceBtn');

  let currentStudents = [];      // lista de alunos da turma selecionada
  let currentAttendance = {};    // { studentId: 'present' ou 'absent' }
  let currentClassId = null;

  // Define data atual como padrão
  const today = new Date().toISOString().slice(0, 10);
  dateInput.value = today;

  // Carrega lista de turmas
  async function loadClasses() {
    const res = await fetch('/api/classes');
    const classes = await res.json();
    classes.forEach(cls => {
      const option = document.createElement('option');
      option.value = cls.id;
      option.textContent = `${cls.name} - ${cls.etapa}`;
      classSelect.appendChild(option);
    });
  }

  // Busca alunos da turma + frequência já salva para a data
  async function loadStudentsAndAttendance() {
    const classId = classSelect.value;
    if (!classId) {
      alert('Selecione uma turma');
      return;
    }
    currentClassId = classId;
    const selectedDate = dateInput.value;
    if (!selectedDate) {
      alert('Selecione uma data');
      return;
    }

    // Buscar alunos
    const resStudents = await fetch(`/api/students/${classId}`);
    const students = await resStudents.json();
    currentStudents = students;

    // Buscar frequência já salva para esta data
    const resAtt = await fetch(`/api/attendance/${classId}/${selectedDate}`);
    const savedAttendance = await resAtt.json(); // objeto { studentId: status }

    // Inicializar currentAttendance: todos como 'present' por padrão, ou o que veio do servidor
    currentAttendance = {};
    students.forEach(std => {
      const studentId = std.id;
      if (savedAttendance[studentId]) {
        currentAttendance[studentId] = savedAttendance[studentId];
      } else {
        currentAttendance[studentId] = 'present'; // padrão presente
      }
    });

    renderStudents();
    saveSection.style.display = 'block';
  }

  // Renderiza a lista de alunos com botões Presente/Ausente
  function renderStudents() {
    studentsDiv.innerHTML = '';
    currentStudents.forEach(student => {
      const studentId = student.id;
      const status = currentAttendance[studentId] || 'present';

      const div = document.createElement('div');
      div.className = 'student-item';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'student-name';
      nameSpan.textContent = student.name;

      const btnGroup = document.createElement('div');
      btnGroup.className = 'status-buttons';

      const btnPresent = document.createElement('button');
      btnPresent.textContent = '✅ Presente';
      btnPresent.className = `status-btn present ${status === 'present' ? 'selected' : ''}`;
      btnPresent.addEventListener('click', () => {
        currentAttendance[studentId] = 'present';
        renderStudents(); // re-render para atualizar visual
      });

      const btnAbsent = document.createElement('button');
      btnAbsent.textContent = '❌ Ausente';
      btnAbsent.className = `status-btn absent ${status === 'absent' ? 'selected' : ''}`;
      btnAbsent.addEventListener('click', () => {
        currentAttendance[studentId] = 'absent';
        renderStudents();
      });

      btnGroup.appendChild(btnPresent);
      btnGroup.appendChild(btnAbsent);
      div.appendChild(nameSpan);
      div.appendChild(btnGroup);
      studentsDiv.appendChild(div);
    });
  }

  // Salvar frequência no backend
  async function saveAttendance() {
    if (!currentClassId) {
      alert('Nenhuma turma carregada');
      return;
    }
    const selectedDate = dateInput.value;
    if (!selectedDate) {
      alert('Selecione uma data');
      return;
    }

    const payload = {
      classId: currentClassId,
      date: selectedDate,
      attendanceMap: currentAttendance
    };

    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert('Frequência salva com sucesso!');
    } else {
      alert('Erro ao salvar. Tente novamente.');
    }
  }

  loadBtn.addEventListener('click', loadStudentsAndAttendance);
  saveBtn.addEventListener('click', saveAttendance);

  loadClasses();
});