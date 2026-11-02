import { useState, useEffect, useCallback, useRef } from "react";
import { allExamSets } from "./data/index.js";

// ── Constants ──
const EXAM_TIME = 60 * 60; // 60 minutes in seconds
const PASS_SCORE = 70;

// ── Category color map ──
const categoryColors = {
  "表現の基礎": { bg: "#FF6B3520", border: "#FF6B35", text: "#FF6B35", icon: "🎨" },
  "2次元CGと撮影": { bg: "#00B4D820", border: "#00B4D8", text: "#00B4D8", icon: "📷" },
  "3次元CG": { bg: "#9B5DE520", border: "#9B5DE5", text: "#9B5DE5", icon: "🧊" },
  "知的財産権": { bg: "#F1573620", border: "#F15736", text: "#F15736", icon: "⚖️" },
  "関連知識": { bg: "#00C9A720", border: "#00C9A7", text: "#00C9A7", icon: "💻" }
};

// ── App Component ──
export default function App() {
  const [phase, setPhase] = useState("select"); // select | start | exam | review | results
  const [selectedExam, setSelectedExam] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME);
  const [showExplanation, setShowExplanation] = useState({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const timerRef = useRef(null);

  const questionBank = selectedExam ? selectedExam.questions : [];
  const totalSubQuestions = questionBank.reduce((sum, q) => sum + q.subQuestions.length, 0);

  // Timer
  useEffect(() => {
    if (phase === "exam" && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (subId, choiceIdx) => {
    if (examSubmitted) return;
    setAnswers(prev => ({ ...prev, [subId]: choiceIdx }));
  };

  const handleSubmit = useCallback(() => {
    clearInterval(timerRef.current);
    setExamSubmitted(true);
    setPhase("results");
  }, []);

  const calculateScore = () => {
    let correct = 0;
    questionBank.forEach(q => {
      q.subQuestions.forEach(sq => {
        if (answers[sq.id] === sq.answer) correct++;
      });
    });
    return {
      correct,
      total: totalSubQuestions,
      score: Math.round((correct / totalSubQuestions) * 100),
      passed: Math.round((correct / totalSubQuestions) * 100) >= PASS_SCORE
    };
  };

  const getCategoryScores = () => {
    const cats = {};
    questionBank.forEach(q => {
      if (!cats[q.category]) cats[q.category] = { correct: 0, total: 0 };
      q.subQuestions.forEach(sq => {
        cats[q.category].total++;
        if (answers[sq.id] === sq.answer) cats[q.category].correct++;
      });
    });
    return cats;
  };

  const answeredCount = Object.keys(answers).length;

  const selectExam = (exam) => {
    setSelectedExam(exam);
    setPhase("start");
  };

  const startExam = () => {
    setPhase("exam");
    setCurrentQ(0);
    setAnswers({});
    setTimeLeft(EXAM_TIME);
    setShowExplanation({});
    setExamSubmitted(false);
  };

  const startReview = () => {
    setPhase("review");
    setCurrentQ(0);
    setShowExplanation({});
  };

  const resetAll = () => {
    setPhase("select");
    setSelectedExam(null);
    setCurrentQ(0);
    setAnswers({});
    setTimeLeft(EXAM_TIME);
    setShowExplanation({});
    setExamSubmitted(false);
  };

  // ── SELECT SCREEN ──
  if (phase === "select") {
    return (
      <div style={styles.container}>
        <div style={styles.selectScreen}>
          <div style={styles.heroGlow} />
          <div style={styles.logoMark}>CG</div>
          <h1 style={styles.heroTitle}>CGクリエイター検定</h1>
          <div style={styles.heroBadge}>ベーシック</div>
          <h2 style={styles.heroSub}>模擬試験</h2>

          <div style={styles.dedicationBox}>
            <span style={styles.dedicationText}>
              🎁 CGクリエイター検定ベーシック、応援しています！<br />
              繰り返し解いて、自信をつけて本番に臨んでください。がんばれ！ — 田中先生より
            </span>
          </div>

          <div style={styles.examSetGrid}>
            <div style={styles.examSetLabel}>📝 模擬試験を選択してください</div>
            {allExamSets.map(exam => (
              <button
                key={exam.id}
                onClick={() => selectExam(exam)}
                style={styles.examSetBtn}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #9B5DE530, #00B4D830)";
                  e.currentTarget.style.borderColor = "#9B5DE5";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "#1a1a2e";
                  e.currentTarget.style.borderColor = "#2a2a4a";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={styles.examSetNum}>第{exam.id}回</div>
                <div style={styles.examSetTitle}>{exam.title}</div>
                <div style={styles.examSetInfo}>10問 / 60分</div>
              </button>
            ))}
          </div>

          <div style={styles.categoryList}>
            <div style={styles.categoryTitle}>出題分野</div>
            {Object.entries(categoryColors).map(([cat, c]) => (
              <div key={cat} style={{ ...styles.categoryTag, background: c.bg, borderColor: c.border, color: c.text }}>
                {c.icon} {cat}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── START SCREEN ──
  if (phase === "start") {
    return (
      <div style={styles.container}>
        <div style={styles.startScreen}>
          <div style={styles.heroGlow} />
          <div style={styles.logoMark}>CG</div>
          <h1 style={styles.heroTitle}>CGクリエイター検定</h1>
          <div style={styles.heroBadge}>ベーシック</div>
          <h2 style={styles.heroSub}>{selectedExam.title}</h2>

          <div style={styles.infoGrid}>
            <div style={styles.infoCard}>
              <div style={styles.infoIcon}>⏱️</div>
              <div style={styles.infoLabel}>試験時間</div>
              <div style={styles.infoValue}>60分</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoIcon}>📝</div>
              <div style={styles.infoLabel}>問題数</div>
              <div style={styles.infoValue}>全10問（{totalSubQuestions}設問）</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoIcon}>🎯</div>
              <div style={styles.infoLabel}>合格ライン</div>
              <div style={styles.infoValue}>70点以上</div>
            </div>
            <div style={styles.infoCard}>
              <div style={styles.infoIcon}>📋</div>
              <div style={styles.infoLabel}>形式</div>
              <div style={styles.infoValue}>マークシート（4択）</div>
            </div>
          </div>

          <div style={styles.categoryList}>
            <div style={styles.categoryTitle}>出題分野</div>
            {Object.entries(categoryColors).map(([cat, c]) => (
              <div key={cat} style={{ ...styles.categoryTag, background: c.bg, borderColor: c.border, color: c.text }}>
                {c.icon} {cat}
              </div>
            ))}
          </div>

          <div style={styles.dedicationBox}>
            <span style={styles.dedicationText}>🎁 合格を応援しています！ がんばれ！</span>
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={resetAll} style={styles.backButton}>
              ◀ 選択に戻る
            </button>
            <button onClick={startExam} style={styles.startButton}>
              試験を開始する ▶
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTS SCREEN ──
  if (phase === "results") {
    const result = calculateScore();
    const catScores = getCategoryScores();

    return (
      <div style={styles.container}>
        <div style={styles.resultsScreen}>
          <h1 style={styles.resultsTitle}>試験結果</h1>
          <div style={styles.resultExamName}>{selectedExam.title}</div>

          <div style={{
            ...styles.scoreCircleWrap,
            background: result.passed
              ? "linear-gradient(135deg, #00C9A720, #00B4D820)"
              : "linear-gradient(135deg, #F1573620, #FF6B3520)"
          }}>
            <div style={{
              ...styles.scoreCircle,
              borderColor: result.passed ? "#00C9A7" : "#F15736"
            }}>
              <div style={styles.scoreNumber}>{result.score}</div>
              <div style={styles.scoreUnit}>点</div>
            </div>
            <div style={{
              ...styles.passLabel,
              color: result.passed ? "#00C9A7" : "#F15736",
              background: result.passed ? "#00C9A715" : "#F1573615"
            }}>
              {result.passed ? "🎉 合格！" : "もう少し！"}
            </div>
            <div style={styles.resultSummary}>
              {totalSubQuestions}問中 {result.correct}問正解
            </div>
          </div>

          <div style={styles.catBreakdown}>
            <h3 style={styles.catBreakdownTitle}>分野別成績</h3>
            {Object.entries(catScores).map(([cat, data]) => {
              const pct = Math.round((data.correct / data.total) * 100);
              const c = categoryColors[cat];
              return (
                <div key={cat} style={styles.catRow}>
                  <div style={styles.catRowHeader}>
                    <span style={{ color: c.text, fontWeight: 700 }}>{c.icon} {cat}</span>
                    <span style={styles.catRowScore}>{data.correct}/{data.total}（{pct}%）</span>
                  </div>
                  <div style={styles.barOuter}>
                    <div style={{
                      ...styles.barInner,
                      width: `${pct}%`,
                      background: pct >= 70 ? c.border : "#F15736"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.resultButtons}>
            <button onClick={startReview} style={styles.reviewButton}>
              📖 解説を見る
            </button>
            <button onClick={startExam} style={styles.retryButton}>
              🔄 もう一度挑戦
            </button>
            <button onClick={resetAll} style={styles.homeButton}>
              🏠 トップへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── EXAM / REVIEW SCREEN ──
  const q = questionBank[currentQ];
  const isReview = phase === "review";
  const catColor = categoryColors[q.category];

  return (
    <div style={styles.container}>
      {/* Header bar */}
      <div style={styles.examHeader}>
        <div style={styles.examHeaderLeft}>
          <span style={{ ...styles.qBadge, background: catColor.bg, color: catColor.text, borderColor: catColor.border }}>
            {catColor.icon} {q.category}
          </span>
        </div>
        <div style={styles.examHeaderCenter}>
          {!isReview && (
            <div style={{
              ...styles.timer,
              color: timeLeft < 300 ? "#F15736" : "#e0e0e0"
            }}>
              ⏱ {formatTime(timeLeft)}
            </div>
          )}
          {isReview && <div style={styles.timer}>📖 解説モード</div>}
        </div>
        <div style={styles.examHeaderRight}>
          <span style={styles.progressText}>{answeredCount}/{totalSubQuestions} 解答済</span>
        </div>
      </div>

      {/* Question navigator */}
      <div style={styles.qNav}>
        {questionBank.map((qItem, idx) => {
          const allAnswered = qItem.subQuestions.every(sq => answers[sq.id] !== undefined);
          const someAnswered = qItem.subQuestions.some(sq => answers[sq.id] !== undefined);
          let bgColor = "#2a2a3a";
          if (idx === currentQ) bgColor = catColor.border;
          else if (allAnswered) bgColor = "#00C9A7";
          else if (someAnswered) bgColor = "#FFB800";

          return (
            <button
              key={qItem.id}
              onClick={() => setCurrentQ(idx)}
              style={{
                ...styles.qNavBtn,
                background: bgColor,
                color: idx === currentQ ? "#fff" : allAnswered ? "#fff" : "#ccc",
                fontWeight: idx === currentQ ? 800 : 600
              }}
            >
              {qItem.id}
            </button>
          );
        })}
      </div>

      {/* Main question area */}
      <div style={styles.examBody}>
        <div style={styles.mainQBox}>
          <span style={styles.mainQLabel}>第{q.id}問</span>
          <p style={styles.mainQText}>{q.mainQuestion}</p>
        </div>

        {q.subQuestions.map((sq, sIdx) => {
          const userAns = answers[sq.id];
          const isCorrect = userAns === sq.answer;
          const showExp = showExplanation[sq.id];

          return (
            <div key={sq.id} style={styles.subQBlock}>
              <div style={styles.subQHeader}>
                <span style={styles.subQLabel}>設問{sIdx + 1}</span>
                {isReview && userAns !== undefined && (
                  <span style={{
                    ...styles.resultBadge,
                    background: isCorrect ? "#00C9A720" : "#F1573620",
                    color: isCorrect ? "#00C9A7" : "#F15736"
                  }}>
                    {isCorrect ? "✓ 正解" : "✗ 不正解"}
                  </span>
                )}
              </div>
              <p style={styles.subQText}>{sq.text}</p>

              <div style={styles.choicesGrid}>
                {sq.choices.map((choice, cIdx) => {
                  let choiceStyle = { ...styles.choiceBtn };
                  const labels = ["ア", "イ", "ウ", "エ"];

                  if (isReview) {
                    if (cIdx === sq.answer) {
                      choiceStyle = {
                        ...choiceStyle,
                        background: "#00C9A720",
                        borderColor: "#00C9A7",
                        color: "#00C9A7"
                      };
                    } else if (cIdx === userAns && cIdx !== sq.answer) {
                      choiceStyle = {
                        ...choiceStyle,
                        background: "#F1573620",
                        borderColor: "#F15736",
                        color: "#F15736",
                        textDecoration: "line-through"
                      };
                    }
                  } else if (userAns === cIdx) {
                    choiceStyle = {
                      ...choiceStyle,
                      background: catColor.bg,
                      borderColor: catColor.border,
                      color: catColor.text
                    };
                  }

                  return (
                    <button
                      key={cIdx}
                      onClick={() => !isReview && handleAnswer(sq.id, cIdx)}
                      style={choiceStyle}
                      disabled={isReview}
                    >
                      <span style={styles.choiceLabel}>{labels[cIdx]}</span>
                      <span style={styles.choiceText}>{choice}</span>
                    </button>
                  );
                })}
              </div>

              {isReview && (
                <div>
                  <button
                    onClick={() => setShowExplanation(prev => ({ ...prev, [sq.id]: !prev[sq.id] }))}
                    style={styles.expToggle}
                  >
                    {showExp ? "▼ 解説を閉じる" : "▶ 解説を見る"}
                  </button>
                  {showExp && (
                    <div style={styles.expBox}>
                      <p style={styles.expText}>{sq.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer navigation */}
      <div style={styles.examFooter}>
        <button
          onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
          style={styles.navBtn}
          disabled={currentQ === 0}
        >
          ◀ 前の問題
        </button>

        {!isReview && currentQ === questionBank.length - 1 ? (
          <button onClick={handleSubmit} style={styles.submitBtn}>
            📮 提出する
          </button>
        ) : isReview && currentQ === questionBank.length - 1 ? (
          <button onClick={resetAll} style={styles.submitBtn}>
            🏠 トップへ戻る
          </button>
        ) : (
          <button
            onClick={() => setCurrentQ(Math.min(questionBank.length - 1, currentQ + 1))}
            style={styles.navBtn}
          >
            次の問題 ▶
          </button>
        )}
      </div>
    </div>
  );
}

// ── Styles ──
const styles = {
  container: {
    minHeight: "100vh",
    background: "#0f0f1a",
    color: "#e0e0e0",
    fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif",
    overflowX: "hidden"
  },

  // Select / Start screen shared
  selectScreen: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "40px 24px 60px",
    textAlign: "center",
    position: "relative"
  },
  startScreen: {
    maxWidth: 680,
    margin: "0 auto",
    padding: "40px 24px 60px",
    textAlign: "center",
    position: "relative"
  },
  heroGlow: {
    position: "absolute",
    top: -80,
    left: "50%",
    transform: "translateX(-50%)",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, #9B5DE520 0%, transparent 70%)",
    pointerEvents: "none"
  },
  logoMark: {
    display: "inline-block",
    fontSize: 48,
    fontWeight: 900,
    background: "linear-gradient(135deg, #FF6B35, #9B5DE5, #00B4D8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: 8,
    marginBottom: 8
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 800,
    margin: "8px 0 12px",
    letterSpacing: 2,
    color: "#ffffff"
  },
  heroBadge: {
    display: "inline-block",
    padding: "6px 24px",
    borderRadius: 20,
    background: "linear-gradient(135deg, #9B5DE5, #00B4D8)",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: 4
  },
  heroSub: {
    fontSize: 20,
    fontWeight: 600,
    color: "#aaa",
    margin: "16px 0 32px",
    letterSpacing: 4
  },

  // Exam set selection
  examSetGrid: {
    marginBottom: 28
  },
  examSetLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 16,
    letterSpacing: 1
  },
  examSetBtn: {
    display: "inline-block",
    margin: "6px",
    padding: "16px 24px",
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: 12,
    cursor: "pointer",
    textAlign: "center",
    color: "#e0e0e0",
    transition: "all 0.2s",
    minWidth: 140
  },
  examSetNum: {
    fontSize: 22,
    fontWeight: 800,
    background: "linear-gradient(135deg, #9B5DE5, #00B4D8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: 4
  },
  examSetTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#ccc",
    marginBottom: 4
  },
  examSetInfo: {
    fontSize: 11,
    color: "#666"
  },

  // Info cards (start screen)
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 28
  },
  infoCard: {
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: 12,
    padding: "16px 12px",
    textAlign: "center"
  },
  infoIcon: { fontSize: 24, marginBottom: 4 },
  infoLabel: { fontSize: 11, color: "#888", marginBottom: 2, letterSpacing: 1 },
  infoValue: { fontSize: 14, fontWeight: 700, color: "#e0e0e0" },

  categoryList: {
    marginBottom: 24,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  categoryTitle: {
    width: "100%",
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
    letterSpacing: 2
  },
  categoryTag: {
    padding: "6px 14px",
    borderRadius: 20,
    border: "1px solid",
    fontSize: 13,
    fontWeight: 600
  },

  dedicationBox: {
    background: "linear-gradient(135deg, #FFB80015, #FF6B3515)",
    border: "1px solid #FFB80040",
    borderRadius: 12,
    padding: "14px 20px",
    marginBottom: 28
  },
  dedicationText: {
    fontSize: 14,
    fontWeight: 600,
    color: "#FFB800",
    lineHeight: 1.8
  },

  backButton: {
    background: "#2a2a4a",
    color: "#ccc",
    border: "1px solid #3a3a5a",
    borderRadius: 12,
    padding: "14px 24px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer"
  },
  startButton: {
    background: "linear-gradient(135deg, #9B5DE5, #00B4D8)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "16px 48px",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 2,
    boxShadow: "0 4px 20px #9B5DE540"
  },

  // Exam header
  examHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "#1a1a2e",
    borderBottom: "1px solid #2a2a4a",
    position: "sticky",
    top: 0,
    zIndex: 100
  },
  examHeaderLeft: { flex: 1 },
  examHeaderCenter: { flex: 1, textAlign: "center" },
  examHeaderRight: { flex: 1, textAlign: "right" },
  qBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 16,
    border: "1px solid",
    fontSize: 12,
    fontWeight: 600
  },
  timer: {
    fontSize: 20,
    fontWeight: 800,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: 2
  },
  progressText: {
    fontSize: 13,
    color: "#888",
    fontWeight: 600
  },

  // Question navigator
  qNav: {
    display: "flex",
    gap: 6,
    padding: "12px 16px",
    background: "#15152a",
    borderBottom: "1px solid #2a2a4a",
    justifyContent: "center",
    flexWrap: "wrap"
  },
  qNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.15s"
  },

  // Exam body
  examBody: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "20px 16px 120px"
  },
  mainQBox: {
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: 12,
    padding: "20px",
    marginBottom: 24
  },
  mainQLabel: {
    display: "inline-block",
    background: "linear-gradient(135deg, #9B5DE5, #00B4D8)",
    color: "#fff",
    padding: "4px 16px",
    borderRadius: 16,
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 12,
    letterSpacing: 2
  },
  mainQText: {
    fontSize: 15,
    lineHeight: 1.7,
    color: "#ccc",
    margin: 0
  },

  // Sub questions
  subQBlock: {
    background: "#1a1a2e",
    border: "1px solid #2a2a4a",
    borderRadius: 12,
    padding: "20px",
    marginBottom: 16
  },
  subQHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8
  },
  subQLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#9B5DE5",
    letterSpacing: 2
  },
  resultBadge: {
    padding: "3px 12px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 700
  },
  subQText: {
    fontSize: 15,
    lineHeight: 1.7,
    color: "#e0e0e0",
    margin: "0 0 16px"
  },

  // Choices
  choicesGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  choiceBtn: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "12px 16px",
    background: "#0f0f1a",
    border: "1px solid #2a2a4a",
    borderRadius: 10,
    cursor: "pointer",
    textAlign: "left",
    color: "#ccc",
    fontSize: 14,
    lineHeight: 1.6,
    transition: "all 0.15s"
  },
  choiceLabel: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 28,
    height: 28,
    borderRadius: 6,
    background: "#2a2a4a",
    fontWeight: 700,
    fontSize: 13,
    color: "#aaa",
    flexShrink: 0
  },
  choiceText: {
    paddingTop: 3
  },

  // Explanation
  expToggle: {
    background: "none",
    border: "none",
    color: "#9B5DE5",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    padding: "8px 0 0",
    letterSpacing: 1
  },
  expBox: {
    background: "#0f0f2a",
    border: "1px solid #9B5DE540",
    borderRadius: 8,
    padding: "14px 16px",
    marginTop: 8
  },
  expText: {
    fontSize: 14,
    lineHeight: 1.8,
    color: "#bbb",
    margin: 0
  },

  // Footer
  examFooter: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 20px",
    background: "#1a1a2eee",
    borderTop: "1px solid #2a2a4a",
    backdropFilter: "blur(10px)",
    zIndex: 100
  },
  navBtn: {
    background: "#2a2a4a",
    color: "#ccc",
    border: "none",
    borderRadius: 10,
    padding: "12px 24px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer"
  },
  submitBtn: {
    background: "linear-gradient(135deg, #FF6B35, #F15736)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "12px 28px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 16px #FF6B3540"
  },

  // Results
  resultsScreen: {
    maxWidth: 600,
    margin: "0 auto",
    padding: "40px 24px 60px",
    textAlign: "center"
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: 4,
    marginBottom: 8,
    color: "#fff"
  },
  resultExamName: {
    fontSize: 14,
    color: "#888",
    marginBottom: 28
  },
  scoreCircleWrap: {
    borderRadius: 20,
    padding: "32px 24px",
    marginBottom: 28
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: "50%",
    border: "4px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    background: "#0f0f1a"
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 900,
    lineHeight: 1,
    color: "#fff"
  },
  scoreUnit: {
    fontSize: 16,
    color: "#888",
    fontWeight: 600
  },
  passLabel: {
    display: "inline-block",
    padding: "6px 24px",
    borderRadius: 20,
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 8
  },
  resultSummary: {
    fontSize: 14,
    color: "#888"
  },

  catBreakdown: {
    background: "#1a1a2e",
    borderRadius: 16,
    padding: "24px 20px",
    marginBottom: 28,
    textAlign: "left"
  },
  catBreakdownTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 16,
    letterSpacing: 2,
    textAlign: "center"
  },
  catRow: {
    marginBottom: 14
  },
  catRowHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: 13
  },
  catRowScore: {
    color: "#888",
    fontWeight: 600
  },
  barOuter: {
    height: 8,
    borderRadius: 4,
    background: "#2a2a4a",
    overflow: "hidden"
  },
  barInner: {
    height: "100%",
    borderRadius: 4,
    transition: "width 0.6s ease"
  },

  resultButtons: {
    display: "flex",
    flexDirection: "column",
    gap: 10
  },
  reviewButton: {
    background: "linear-gradient(135deg, #9B5DE5, #00B4D8)",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "14px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 2
  },
  retryButton: {
    background: "#2a2a4a",
    color: "#e0e0e0",
    border: "1px solid #3a3a5a",
    borderRadius: 12,
    padding: "14px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer"
  },
  homeButton: {
    background: "none",
    color: "#888",
    border: "1px solid #2a2a4a",
    borderRadius: 12,
    padding: "14px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer"
  }
};
