import React, { useMemo, useState } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../contexts/AuthContext';

// Safety & setup
import eBrake from '../images/guides/spare-tire-change-with-powertools/picture-of-ebrake-on-dash.jpeg';
import safetyCones from '../images/guides/spare-tire-change-with-powertools/picture-of-safe-tire-change-using-cones.jpeg';

// Tools & trunk access
import toolsLocation from '../images/guides/spare-tire-change-with-powertools/picture-of-where-tools-are-located.jpeg';
import trunkCoverOff from '../images/guides/spare-tire-change-with-powertools/picture-of-back-of-trunk-with-cover-off.jpeg';
import jackKit from '../images/guides/spare-tire-change-with-powertools/picture-of-srpare-tire-with-jack-kit-from-car.jpeg';

// Wheel lock & sockets
import wheelLockFront from '../images/guides/spare-tire-change-with-powertools/picture-of-wheel-lock-key-front.jpg';
import wheelLockBack from '../images/guides/spare-tire-change-with-powertools/picture-of-wheel-lock-key-back.jpg';
import wheelLockWithKey from '../images/guides/spare-tire-change-with-powertools/picture-of-wheel-lock-with-key.jpg';
import wheelLockWithoutKey from '../images/guides/spare-tire-change-with-powertools/picture-of-wheel-lock-without-key.jpg';
import sockets from '../images/guides/spare-tire-change-with-powertools/picture-of-sockets.jpg';
import keySwapped from '../images/guides/spare-tire-change-with-powertools/picture-of-key-swapped-with-lugnut.jpeg';
import impactDrill from '../images/guides/spare-tire-change-with-powertools/picture-of-impact-drill.jpg';

// Jacking
import jackPoint from '../images/guides/spare-tire-change-with-powertools/picture-of-jack-point.jpg';
import settingUpJack from '../images/guides/spare-tire-change-with-powertools/picture-of-setting-up-jack.jpeg';
import jackingAtPoint from '../images/guides/spare-tire-change-with-powertools/picture-of-jacking-car-at-jack-point.jpeg';
import tireOffGround from '../images/guides/spare-tire-change-with-powertools/picture-of-tire-off-ground.jpg';

// Removal star pattern
import starRemoval1 from '../images/guides/spare-tire-change-with-powertools/picture-of-impact-drill-star-1-removal.jpeg';
import starRemoval2 from '../images/guides/spare-tire-change-with-powertools/picture-of-impact-drill-star-2-removal.jpeg';
import starRemoval3 from '../images/guides/spare-tire-change-with-powertools/picture-of-impact-drill-star-3-removal.jpeg';
import starRemoval4 from '../images/guides/spare-tire-change-with-powertools/picture-of-impact-drill-star-4-removal.jpeg';

// Wheel off / on
import tireRemoved from '../images/guides/spare-tire-change-with-powertools/picture-of-tire-removed.jpeg';
import carWithoutRim from '../images/guides/spare-tire-change-with-powertools/picture-of-car-without-rim.jpeg';
import spareOnNoLugs from '../images/guides/spare-tire-change-with-powertools/picture-of-spare-on-without-lugnuts.jpeg';
import spareOnWithLugs from '../images/guides/spare-tire-change-with-powertools/picture-of-spare-on-with-lugnuts.jpeg';

// Install star pattern
import starInstall1 from '../images/guides/spare-tire-change-with-powertools/picture-of-impact-drill-star-1-installation.jpeg';
import starInstall2 from '../images/guides/spare-tire-change-with-powertools/picture-of-impact-drill-star-2-installation.jpeg';
import starInstall3 from '../images/guides/spare-tire-change-with-powertools/picture-of-impact-drill-star-3-installation.jpeg';
import starInstall4 from '../images/guides/spare-tire-change-with-powertools/picture-of-impact-drill-star-4-installation.jpeg';

// Inflate & stow
import spareMountedWithAir from '../images/guides/spare-tire-change-with-powertools/picture-of-spare-mounted-with-air.jpeg';
import airPumped from '../images/guides/spare-tire-change-with-powertools/picture-of-air-being-pumped.jpeg';
import spareAbove from '../images/guides/spare-tire-change-with-powertools/picture-of-spare-above-tire.jpeg';
import spareBelow from '../images/guides/spare-tire-change-with-powertools/picture-of-spare-below-tire.jpeg';
import torqueWrenchImg from '../images/guides/spare-tire-change-with-powertools/torque-wrench.jpg';

type QuizOption = { text: string; why: string };
type QuizQuestion = { q: string; options: QuizOption[]; correctIndex: number };

const quiz: QuizQuestion[] = [
  {
    q: 'What safety setup should be done before any work?',
    options: [
      { text: 'Turn on hazard lights only', why: 'Helpful, but insufficient for a safe work zone.' },
      { text: 'Engage parking brake and set safety cones if available', why: 'Correct: prevents rolling and alerts traffic.' },
      { text: 'Lift the car first', why: 'Unsafe—stabilize the scene before lifting.' },
      { text: 'Place jack under the oil pan', why: 'Never jack on non-structural components.' }
    ],
    correctIndex: 1
  },
  {
    q: 'Where is the proper jack location?',
    options: [
      { text: 'Any solid-looking point', why: 'Risk of damage—use manufacturer jack points.' },
      { text: 'Designated vehicle jack point', why: 'Correct: designed to support vehicle safely.' },
      { text: 'On brake rotor', why: 'Never support weight on brake components.' },
      { text: 'Under bumper cover', why: 'Plastic covers aren’t structural.' }
    ],
    correctIndex: 1
  },
  {
    q: 'When should you first crack the lug nuts?',
    options: [
      { text: 'After wheel is fully off the ground', why: 'Wheel may spin—harder and unsafe.' },
      { text: 'Before lifting, while tire is still on ground', why: 'Correct: prevents spinning; controlled breakaway.' },
      { text: 'After installing the spare', why: 'Too late—must loosen the flat first.' },
      { text: 'Never loosen lug nuts', why: 'You must loosen to remove the wheel.' }
    ],
    correctIndex: 1
  },
  {
    q: 'How high should you lift the car?',
    options: [
      { text: 'As high as the jack can go', why: 'Over-lifting increases risk and isn’t needed.' },
      { text: 'Just enough so wheel clears, using spare as a thickness gauge', why: 'Correct: lift only as needed for safe removal/installation.' },
      { text: 'Leave tire touching ground', why: 'You need clearance to remove the wheel.' },
      { text: 'High enough to crawl under', why: 'Never crawl under a car supported only by a jack.' }
    ],
    correctIndex: 1
  },
  {
    q: 'Best practice for removal sequence of lug nuts?',
    options: [
      { text: 'Random order', why: 'Uneven release can bind or warp components.' },
      { text: 'Clockwise order', why: 'Too sequential—use criss-cross to balance load.' },
      { text: 'Star (criss-cross) pattern', why: 'Correct: balances stress across the wheel.' },
      { text: 'Remove the tightest one last only', why: 'Pattern matters more than single-lug strategy.' }
    ],
    correctIndex: 2
  },
  {
    q: 'What should you do when mounting the spare?',
    options: [
      { text: 'Start with the impact gun immediately', why: 'Can cross-thread lugs; hand-start first.' },
      { text: 'Hand-thread all lugs before snugging', why: 'Correct: avoids cross-threading and ensures seating.' },
      { text: 'Tighten one lug fully then others', why: 'Uneven seating; can warp rotor.' },
      { text: 'Skip any missing lug', why: 'All lugs are required for safe operation.' }
    ],
    correctIndex: 1
  },
  {
    q: 'Initial tightening pattern while suspended?',
    options: [
      { text: 'Circular pattern, maximum torque', why: 'Over-torque and pattern can cause issues.' },
      { text: 'Random short bursts all around', why: 'Inconsistent seating; use a pattern.' },
      { text: 'Star pattern, just snug to seat the wheel', why: 'Correct: final torque comes after lowering.' },
      { text: 'Only tighten two opposite lugs fully', why: 'Partial tightening causes imbalance.' }
    ],
    correctIndex: 2
  },
  {
    q: 'Final tightening to specification should be done with…',
    options: [
      { text: 'Impact gun', why: 'Impacts aren’t accurate for final torque.' },
      { text: 'Torque wrench', why: 'Correct: ensures manufacturer torque spec.' },
      { text: 'Hand-tight only', why: 'Insufficient—lugs can loosen.' },
      { text: 'Breaker bar for maximum force', why: 'Over-torque can damage studs/rotor.' }
    ],
    correctIndex: 1
  },
  {
    q: 'What about spare tire pressure before driving?',
    options: [
      { text: 'No check needed on spares', why: 'Spares often lose pressure; must verify PSI.' },
      { text: 'Check and inflate to recommended PSI', why: 'Correct: safe handling and longevity.' },
      { text: 'Over-inflate “to be safe”', why: 'Over-inflation reduces traction and can be unsafe.' },
      { text: 'Deflate slightly for comfort', why: 'Under-inflation can overheat and fail.' }
    ],
    correctIndex: 1
  },
  {
    q: 'Wheel lock handling:',
    options: [
      { text: 'Ignore wheel lock and use any socket', why: 'Risk of damage; you need the correct lock key.' },
      { text: 'Use the wheel lock key and seat it fully', why: 'Correct: prevents stripping the lock pattern.' },
      { text: 'Hammer a smaller socket onto it', why: 'Destructive and unprofessional for normal cases.' },
      { text: 'Skip the lock and remove other lugs', why: 'The lock must be removed to take the wheel off.' }
    ],
    correctIndex: 1
  },
  {
    q: 'After 25–50 miles on a spare, you should…',
    options: [
      { text: 'Do nothing', why: 'Lug nuts can settle; re-check torque is recommended.' },
      { text: 'Re-check torque and inspect tire pressure', why: 'Correct: safety check after initial driving.' },
      { text: 'Drive faster to seat the wheel', why: 'Speed doesn’t help and is unsafe.' },
      { text: 'Rotate tires immediately', why: 'Rotation is unrelated here.' }
    ],
    correctIndex: 1
  },
  {
    q: 'Using the spare as a height gauge means…',
    options: [
      { text: 'Lifting higher than the spare’s diameter', why: 'Over-lifting isn’t needed and adds risk.' },
      { text: 'Lifting only enough so wheel clears, comparing gap to spare thickness', why: 'Correct: a practical height reference.' },
      { text: 'Lifting until the tire dangles freely', why: 'Excess lift can destabilize the jack.' },
      { text: 'Not lifting at all', why: 'You need clearance to remove/fit the wheel.' }
    ],
    correctIndex: 1
  },
  {
    q: 'What’s the right way to avoid cross-threading?',
    options: [
      { text: 'Start with impact and let it find threads', why: 'Impacts can easily cross-thread.' },
      { text: 'Hand-thread all lug nuts first', why: 'Correct: ensures proper alignment before tightening.' },
      { text: 'Tighten one lug fully to center wheel', why: 'Can cause misalignment and damage.' },
      { text: 'Grease the studs heavily', why: 'Lubrication changes torque characteristics; avoid unless specified.' }
    ],
    correctIndex: 1
  },
];

const GuidesSpareTireWithPowertools: React.FC = () => {
  const { token, user } = useAuth();
  const [current, setCurrent] = useState(0);
  const [quizVisible, setQuizVisible] = useState(false);
  const [answers, setAnswers] = useState<number[]>(Array(quiz.length).fill(-1));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  const score = useMemo(() => {
    const total = quiz.length;
    const correct = answers.reduce((acc, a, i) => acc + (a === quiz[i].correctIndex ? 1 : 0), 0);
    return Math.round((correct / total) * 100);
  }, [answers]);

  // Simple inline SVG fallback if an external image blocks hotlinking
  const torqueWrenchFallback = encodeURI(
    `data:image/svg+xml;utf8,`+
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 96'>`+
    `<rect x='16' y='40' width='240' height='16' rx='8' fill='%2390a4ae'/>`+
    `<rect x='232' y='28' width='56' height='40' rx='8' fill='%23cfd8dc' stroke='%2390a4ae'/>`+
    `<circle cx='260' cy='48' r='10' fill='%2390a4ae'/>`+
    `<rect x='288' y='42' width='24' height='12' rx='6' fill='%23667380'/>`+
    `<text x='16' y='24' font-family='Arial' font-size='14' fill='%23667380'>Torque wrench (fallback)</text>`+
    `</svg>`
  );

  const steps: Array<{ img: string; title: string; caption: string; ref: string }> = [
    { img: safetyCones, title: 'Set up a safe work area', caption: 'Place safety cones or hazard markers if available to alert traffic.', ref: 'picture-of-safe-tire-change-using-cones.jpeg' },
    { img: eBrake, title: 'Engage the parking brake', caption: 'Always set the parking brake before working on the vehicle.', ref: 'picture-of-ebrake-on-dash.jpeg' },
  { img: trunkCoverOff, title: 'Open trunk cover', caption: 'Remove the trunk cover to access the spare and jack kit.', ref: 'picture-of-back-of-trunk-with-cover-off.jpeg' },
  { img: toolsLocation, title: 'Locate tools & spare', caption: 'Find the spare tire, jack, and tools—usually in the trunk.', ref: 'picture-of-where-tools-are-located.jpeg' },
    { img: jackKit, title: 'Jack kit and spare', caption: 'Identify the jack points and ensure you have the correct tools.', ref: 'picture-of-srpare-tire-with-jack-kit-from-car.jpeg' },
    { img: wheelLockWithoutKey, title: 'Check for wheel lock', caption: 'If present, you need the wheel lock key to remove the locking lug nut.', ref: 'picture-of-wheel-lock-without-key.jpg' },
    { img: wheelLockWithKey, title: 'Wheel lock key', caption: 'Use the wheel lock key on the locking lug nut.', ref: 'picture-of-wheel-lock-with-key.jpg' },
    { img: wheelLockFront, title: 'Wheel lock key (front)', caption: 'Confirm the correct orientation of the wheel lock key.', ref: 'picture-of-wheel-lock-key-front.jpg' },
    { img: wheelLockBack, title: 'Wheel lock key (back)', caption: 'Verify the key seats fully before applying torque.', ref: 'picture-of-wheel-lock-key-back.jpg' },
    { img: sockets, title: 'Choose the correct socket', caption: 'Select the proper size socket to avoid rounding lugs.', ref: 'picture-of-sockets.jpg' },
    { img: keySwapped, title: 'Swap key to regular lug', caption: 'After removing the lock, use the standard socket for other lugs.', ref: 'picture-of-key-swapped-with-lugnut.jpeg' },
    { img: impactDrill, title: 'Loosen lugs with impact', caption: 'Break each lug loose while the wheel is on the ground; don’t fully remove yet.', ref: 'picture-of-impact-drill.jpg' },
    { img: jackPoint, title: 'Locate jack point', caption: 'Use designated jack points shown in the manual or underbody marks.', ref: 'picture-of-jack-point.jpg' },
    { img: settingUpJack, title: 'Set up the jack', caption: 'Position the jack squarely on stable ground before lifting.', ref: 'picture-of-setting-up-jack.jpeg' },
    { img: jackingAtPoint, title: 'Lift at jack point', caption: 'Raise the vehicle until the tire just clears the ground.', ref: 'picture-of-jacking-car-at-jack-point.jpeg' },
    { img: tireOffGround, title: 'Confirm tire is off the ground', caption: 'Ensure there’s clearance to remove the wheel.', ref: 'picture-of-tire-off-ground.jpg' },
    { img: spareAbove, title: 'Use spare as height gauge (above)', caption: 'Reference: jack until the wheel sits slightly higher than the spare’s thickness so it can slide on/off without forcing.', ref: 'picture-of-spare-above-tire.jpeg' },
    { img: spareBelow, title: 'Use spare as height gauge (below)', caption: 'Alternate view: compare the gap to the spare. Only lift as high as needed—avoid over-lifting.', ref: 'picture-of-spare-below-tire.jpeg' },
    { img: starRemoval1, title: 'Remove lugs in star pattern (1)', caption: 'Loosen and remove lugs in a criss-cross pattern for even release.', ref: 'picture-of-impact-drill-star-1-removal.jpeg' },
    { img: starRemoval2, title: 'Remove lugs in star pattern (2)', caption: 'Continue evenly across opposite lugs.', ref: 'picture-of-impact-drill-star-2-removal.jpeg' },
    { img: starRemoval3, title: 'Remove lugs in star pattern (3)', caption: 'Work around the wheel to balance stress.', ref: 'picture-of-impact-drill-star-3-removal.jpeg' },
    { img: starRemoval4, title: 'Remove lugs in star pattern (4)', caption: 'Finish removal once all are loose.', ref: 'picture-of-impact-drill-star-4-removal.jpeg' },
    { img: tireRemoved, title: 'Remove the wheel', caption: 'Carefully pull the wheel straight off the hub.', ref: 'picture-of-tire-removed.jpeg' },
    { img: carWithoutRim, title: 'Hub exposed', caption: 'Inspect the hub surface; clean if necessary.', ref: 'picture-of-car-without-rim.jpeg' },
    { img: spareOnNoLugs, title: 'Mount the spare', caption: 'Align holes and slide the spare onto the hub.', ref: 'picture-of-spare-on-without-lugnuts.jpeg' },
    { img: spareOnWithLugs, title: 'Hand-start lug nuts', caption: 'Thread all lug nuts by hand to avoid cross-threading.', ref: 'picture-of-spare-on-with-lugnuts.jpeg' },
    { img: starInstall1, title: 'Initial tighten in star (1)', caption: 'Snug lugs in a star pattern to seat the wheel.', ref: 'picture-of-impact-drill-star-1-installation.jpeg' },
    { img: starInstall2, title: 'Initial tighten in star (2)', caption: 'Do not fully torque while suspended.', ref: 'picture-of-impact-drill-star-2-installation.jpeg' },
    { img: starInstall3, title: 'Initial tighten in star (3)', caption: 'Even pressure prevents rotor warp.', ref: 'picture-of-impact-drill-star-3-installation.jpeg' },
    { img: starInstall4, title: 'Initial tighten in star (4)', caption: 'Prepare to lower for final torque.', ref: 'picture-of-impact-drill-star-4-installation.jpeg' },
  // Explicit torque wrench slide (local image)
  { img: torqueWrenchImg as unknown as string, title: 'Proper final tightening tool', caption: 'Use a torque wrench for final torque to manufacturer specification. Impacts are for removal/snugging only.', ref: 'torque-wrench.jpg' },
  { img: spareMountedWithAir, title: 'Lower and torque to spec', caption: 'Lower until the tire contacts ground, then use a torque wrench to spec.', ref: 'picture-of-spare-mounted-with-air.jpeg' },
    { img: airPumped, title: 'Check and adjust tire pressure', caption: 'Inflate to the spare’s recommended PSI (often printed on sidewall).', ref: 'picture-of-air-being-pumped.jpeg' },
  ];

  const next = () => setCurrent((c) => Math.min(c + 1, steps.length - 1));
  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  const submitQuiz = async () => {
    setSubmitted(true);
    const passed = score >= 100;
    setResult({ score, passed });
    if (!user || !token) return;
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE || ''}/api/profile/skill-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key: 'spare-tire', name: 'Spare Tire Change Verified', score })
      });
      if (!res.ok) {
        console.warn('Failed to record skill test');
      }
    } catch (e) {
      console.error('submitQuiz error', e);
    } finally { setSaving(false); }
  };

  const progressPct = Math.round(((current + 1) / steps.length) * 100);
  const isTorque = steps[current]?.ref?.includes('torque-wrench');

  return (
    <div className="container" style={{ padding: '1.5rem', maxWidth: 880, margin: '0 auto', background: '#FFFFFF' }}>
      <h1 style={{ marginBottom: '.25rem' }}>Guide: Spare Tire Change (with Power Tools)</h1>
      <p style={{ opacity: .8, marginTop: 0 }}>Review the steps below. Complete the quiz to earn the “Spare Tire Change Verified” badge. Score 100% to pass.</p>

      <div className="card" style={{ padding: '1rem', borderRadius: 8, background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,.08)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.9rem' }}>
          <div
            style={{
              width: '100%',
              maxWidth: 560,
              aspectRatio: '1 / 1',
              position: 'relative',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(0,0,0,.08)'
            }}
          >
            <img
              key={current}
              src={imgError ? torqueWrenchFallback : steps[current].img}
              alt={steps[current].title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              style={{
                position: 'absolute',
                top: isTorque ? 12 : 0,
                right: isTorque ? 12 : 0,
                bottom: isTorque ? 12 : 0,
                left: isTorque ? 12 : 0,
                width: '100%',
                height: '100%',
                objectFit: isTorque ? 'contain' : 'cover'
              }}
            />
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontWeight:700, fontSize: '1.05rem' }}>{current + 1}. {steps[current].title}</div>
            <div style={{ fontSize:'.95rem', opacity:.9, lineHeight: 1.5, marginTop: '.2rem' }}>{steps[current].caption}</div>
            <div style={{ fontSize:'.75rem', opacity:.6, marginTop:'.35rem' }}>ref: {steps[current].ref}</div>
          </div>
          <div
            style={{
              position: 'sticky',
              bottom: 8,
              zIndex: 10,
              width: '100%',
              maxWidth: 560,
              background: 'rgba(255,255,255,0.55)',
              backdropFilter: 'blur(6px)',
              borderRadius: 12,
              padding: '.6rem',
              boxShadow: '0 6px 24px rgba(0,0,0,.08)'
            }}
          >
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
              <div style={{ flex: 1, height: 6, background: '#e9eef3', borderRadius: 999 }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: '#4f8cff', borderRadius: 999, transition: 'width .25s ease' }} />
              </div>
              <div style={{ fontSize: '.85rem', opacity: .75, minWidth: 88, textAlign: 'right' }}>{current + 1} / {steps.length}</div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap:'wrap', justifyContent:'center' }}>
              <button className="btn btn-outline" style={{ padding: '.6rem 1rem', borderRadius: 10 }} onClick={() => { setImgError(false); prev(); }} disabled={current === 0}>Previous</button>
              <button className="btn btn-primary" style={{ padding: '.6rem 1rem', borderRadius: 10 }} onClick={() => { setImgError(false); next(); }} disabled={current === steps.length - 1}>Next</button>
              {current === steps.length - 1 && (
                <button className="btn btn-success" style={{ padding: '.6rem 1rem', borderRadius: 10 }} onClick={() => setQuizVisible(true)}>
                  Proceed to Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {quizVisible && (
        <div className="card" style={{ padding: '1rem', borderRadius: 8, background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,.08)', marginTop: '1rem' }}>
          <h2>Knowledge Check</h2>
          {quiz.map((q, idx) => (
            <div key={idx} style={{ margin: '1rem 0' }}>
              <div style={{ fontWeight: 600 }}>{idx + 1}. {q.q}</div>
              <div style={{ display: 'grid', gap: '.35rem', marginTop: '.35rem' }}>
                {q.options.map((opt, oi) => (
                  <label key={oi} style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                    <input
                      type="radio"
                      name={`q-${idx}`}
                      checked={answers[idx] === oi}
                      onChange={() => setAnswers(a => a.map((v, i) => i === idx ? oi : v))}
                    />
                    <span>{opt.text}</span>
                  </label>
                ))}
              </div>

              {submitted && answers[idx] !== -1 && (
                <div style={{ marginTop: '.35rem', fontSize: '.9rem' }}>
                  {answers[idx] === q.correctIndex ? (
                    <div style={{ color: '#2e7d32' }}>Correct. {q.options[q.correctIndex].why}</div>
                  ) : (
                    <div style={{ color: '#c62828' }}>
                      Your answer: {q.options[answers[idx]].text} — {q.options[answers[idx]].why}
                      <div style={{ color: '#2e7d32' }}>Correct: {q.options[q.correctIndex].text} — {q.options[q.correctIndex].why}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <button className="btn btn-success" onClick={submitQuiz} disabled={saving}>Submit Quiz</button>
          {submitted && result && (
            <div style={{ marginTop: '.75rem' }}>
              <strong>Score:</strong> {result.score}% — {result.passed ? 'Pass ✅ Badge awarded to your profile' : 'Below 100% — review and try again'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GuidesSpareTireWithPowertools;
