const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const DATA_DIR = path.join(__dirname, 'data');
const STUDENTS_FILE = path.join(DATA_DIR, 'students.json');
const CLASSES_FILE = path.join(DATA_DIR, 'classes.json');
const ATTENDANCE_FILE = path.join(DATA_DIR, 'attendance.json');

// Garantir que a pasta data existe
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// Funções auxiliares
function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, 'utf8');
  return data.trim() ? JSON.parse(data) : [];
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Inicializar arquivos se não existirem (com os exemplos fornecidos)
function initFiles() {
  if (!fs.existsSync(CLASSES_FILE)) {
    writeJSON(CLASSES_FILE, [
      { "id": "1anoA", "name": "1º ANO A INTEGRAL", "etapa": "1º ANO" },
      { "id": "2e3anoMulti", "name": "2º E 3º ANO A INTEGRAL - MULTI ANOS INICIAIS", "etapa": "2º e 3º ANO" },
      { "id": "4e5anoMulti", "name": "4º E 5º ANO B INTEGRAL - MULTI ANOS INICIAIS", "etapa": "4º e 5º ANO" }
    ]);
  }
  if (!fs.existsSync(STUDENTS_FILE)) {
    // Aqui você colocaria o JSON completo dos alunos (o arquivo fornecido acima)
    // Como é grande, deixamos apenas um placeholder. Você deve copiar o conteúdo real.
    writeJSON(STUDENTS_FILE, []); 
    console.warn('⚠️ students.json vazio. Substitua pelo conteúdo real dos alunos.');
  }
  if (!fs.existsSync(ATTENDANCE_FILE)) {
    writeJSON(ATTENDANCE_FILE, []);
  }
}
initFiles();

// Endpoints
app.get('/api/classes', (req, res) => {
  const classes = readJSON(CLASSES_FILE);
  res.json(classes);
});

app.get('/api/students/:classId', (req, res) => {
  const classId = req.params.classId;
  const students = readJSON(STUDENTS_FILE).filter(s => s.classId === classId);
  res.json(students);
});

app.post('/api/attendance', (req, res) => {
  const { classId, date, attendanceMap } = req.body;
  if (!classId || !date || !attendanceMap) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }
  const attendance = readJSON(ATTENDANCE_FILE);
  const filtered = attendance.filter(r => !(r.classId === classId && r.date === date));
  filtered.push({ id: Date.now(), classId, date, attendanceMap });
  writeJSON(ATTENDANCE_FILE, filtered);
  res.json({ success: true });
});

app.get('/api/attendance/:classId/:date', (req, res) => {
  const { classId, date } = req.params;
  const attendance = readJSON(ATTENDANCE_FILE);
  const record = attendance.find(r => r.classId === classId && r.date === date);
  res.json(record ? record.attendanceMap : {});
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Arquivo de alunos: ${STUDENTS_FILE}`);
});

// LISTAR todas as chamadas (com dados da turma)
app.get('/api/attendance/all', (req, res) => {
  const attendance = readJSON(ATTENDANCE_FILE);
  const classes = readJSON(CLASSES_FILE);
  // Adiciona nome da turma a cada registro
  const enriched = attendance.map(record => {
    const turma = classes.find(c => c.id === record.classId);
    return {
      ...record,
      className: turma ? turma.name : record.classId,
      etapa: turma ? turma.etapa : ''
    };
  });
  res.json(enriched);
});

// DELETAR uma chamada pelo ID
app.delete('/api/attendance/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let attendance = readJSON(ATTENDANCE_FILE);
  const initialLength = attendance.length;
  attendance = attendance.filter(record => record.id !== id);
  if (attendance.length === initialLength) {
    return res.status(404).json({ error: 'Registro não encontrado' });
  }
  writeJSON(ATTENDANCE_FILE, attendance);
  res.json({ success: true });
});

// EDITAR (atualizar) uma chamada
app.put('/api/attendance/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { attendanceMap } = req.body;
  if (!attendanceMap) {
    return res.status(400).json({ error: 'attendanceMap é obrigatório' });
  }
  let attendance = readJSON(ATTENDANCE_FILE);
  const index = attendance.findIndex(record => record.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Registro não encontrado' });
  }
  attendance[index].attendanceMap = attendanceMap;
  writeJSON(ATTENDANCE_FILE, attendance);
  res.json({ success: true });
});