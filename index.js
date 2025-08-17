let questions = [];
let score = 0;

let availableQuestions = []; // câu chưa làm hoặc skip
let pendingSet = new Set();  // track skip
let state = [];              // trạng thái từng câu: 'pending' | 'correct' | 'wrong'

let currentQ = null; 
let selectedAnswer = null;
let answered = false;

const soundCorrect = new Audio('sounds/correct.mp3');
const soundWrong = new Audio('sounds/wrong.mp3');

document.getElementById('fileInput').addEventListener('change', handleFile);

function handleFile(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    questions = [];
    for (let i = 1; i < rows.length; i++) {
      if (!rows[i][0]) continue;
      questions.push({
        question: rows[i][0],
        answers: [rows[i][1], rows[i][2], rows[i][3], rows[i][4]],
        correct: rows[i][5]?.toString().trim().toUpperCase(),
        //Thêm ảnh từ excel
        image: rows[i][6] ? rows[i][6].trim() : null
      });
    }
    startGame();
  };
  reader.readAsArrayBuffer(file);
}

function startGame() {
  document.getElementById('game').style.display = 'block';
  score = 0;
  document.getElementById('score').innerText = score;
  document.getElementById('totalQ').innerText = questions.length;

  availableQuestions = Array.from(questions.keys());
  pendingSet.clear();
  state = new Array(questions.length).fill('pending');

  nextQuestion();
}

function nextQuestion() {
  if (availableQuestions.length === 0) {
    return finishGame();
  }
  // random pick
  const randIndex = Math.floor(Math.random() * availableQuestions.length);
  const qIndex = availableQuestions[randIndex];
  currentQ = qIndex;
  showQuestion(questions[qIndex]);
}

function showQuestion(q) {
 document.getElementById('question').innerText = q.question;

  // ✅ Hiển thị ảnh với placeholder fallback
  const imgDiv = document.getElementById('questionImage');
  imgDiv.innerHTML = ""; 
  let img = document.createElement("img");
  img.src = q.image || "https://i.pinimg.com/originals/f2/e6/54/f2e65478f62bcb16f4ec9b5e82f7d76d.gif"; 
  img.onerror = () => {
    img.src = "https://via.placeholder.com/220x150?text=Image+Error";
  };
  img.style.maxWidth = "300px";
  img.style.margin = "10px 0";
  img.style.borderRadius = "8px";
  imgDiv.appendChild(img);

  // ===== Đáp án =====
  const answersDiv = document.getElementById('answers');
  answersDiv.innerHTML = "";
  selectedAnswer = null;
  answered = false;

  q.answers.forEach((ans, idx) => {
    const div = document.createElement('div');
    div.className = "answer";
    div.innerText = ans;
    div.onclick = () => {
      if (answered) return;
      document.querySelectorAll('.answer').forEach(el => el.style.background = "#fff");
      div.style.background = "#4bb616ff";
      selectedAnswer = idx;
    };
    answersDiv.appendChild(div);
  });

  document.getElementById('confirm').style.display = "inline-block";
  if (availableQuestions.length === 1) {
    document.getElementById('next').innerText = "Hoàn thành";
  } else {
    document.getElementById('next').innerText = "Tiếp theo";
  }
}



document.getElementById('confirm').onclick = () => {
  if (selectedAnswer === null) {
    alert("Hãy chọn một đáp án!");
    return;
  }
  const q = questions[currentQ];
  const correctIndex = { A:0, B:1, C:2, D:3 }[q.correct];
  const nodes = document.querySelectorAll('.answer');

  nodes[correctIndex].classList.add("correct");
  if (selectedAnswer === correctIndex) {
    document.getElementById('correctSound').play();
    score += 5;
    document.getElementById('score').innerText = score;
    state[currentQ] = 'correct';
    removeFromAvailable(currentQ);
  } else {
    document.getElementById('wrongSound').play();
    nodes[selectedAnswer].classList.add("wrong");
    state[currentQ] = 'wrong';
    removeFromAvailable(currentQ); // loại hẳn
  }

  answered = true;
  document.getElementById('confirm').style.display = "none";
};

document.getElementById('next').onclick = () => {
  // nếu chưa confirm → coi là skip, vẫn giữ trong available nhưng move sang cuối
  if (!answered && state[currentQ] === 'pending') {
    if (!pendingSet.has(currentQ)) {
      pendingSet.add(currentQ);
    }
  }
  nextQuestion();
};

function removeFromAvailable(qIndex) {
  availableQuestions = availableQuestions.filter(i => i !== qIndex);
  pendingSet.delete(qIndex);
}

function finishGame() {
  document.getElementById('popup').style.display = "flex";
  document.getElementById('finalScore').innerText = "Điểm của bạn: " + score;
  document.getElementById('comment').innerText = score < 20 ? "Cố lên 💪" : "Phát huy hơn nữa 🚀";
}

document.getElementById('replay').onclick = () => {
  document.getElementById('popup').style.display = "none";
  document.getElementById('game').style.display = "none";
  document.getElementById('fileInput').value = "";
  questions = [];
  score = 0;
  availableQuestions = [];
  pendingSet.clear();
  state = [];
  currentQ = null;
  selectedAnswer = null;
  answered = false;
};