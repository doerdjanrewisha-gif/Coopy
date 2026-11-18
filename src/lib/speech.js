// Browser speech: recognition (shopper speaks) + synthesis (Coopy speaks).
// Everything runs in the browser; nothing is a phone call.

export const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const canListen = !!SR;
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

let unlocked = false;
export function unlockSpeech() {
  if (!canSpeak || unlocked) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
    unlocked = true;
  } catch {
    /* ignore */
  }
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  const prefs = [/en-GB/i, /en-IE/i, /en-AU/i, /en-US/i, /^en/i];
  for (const p of prefs) {
    const good = voices.filter((v) => p.test(v.lang));
    const nice = good.find((v) => /natural|neural|samantha|daniel|serena|google uk|karen|moira/i.test(v.name)) || good[0];
    if (nice) return nice;
  }
  return null;
}

export function speak(text, { onEnd } = {}) {
  if (!canSpeak) {
    onEnd?.();
    return () => {};
  }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/kr\b/g, 'kroner').replace(/·/g, ','));
  const v = pickVoice();
  if (v) u.voice = v;
  u.lang = v?.lang || 'en-GB';
  u.rate = 1.03;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(guard);
    onEnd?.();
  };
  u.onend = finish;
  u.onerror = finish;
  // Safety net: some browsers never fire onend.
  const guard = setTimeout(finish, Math.min(30000, 2500 + text.length * 80));
  synth.speak(u);
  return () => {
    synth.cancel();
    finish();
  };
}

export function stopSpeaking() {
  if (canSpeak) window.speechSynthesis.cancel();
}

// Starts one listening session. Returns a stop() function.
export function listen({ onInterim, onFinal, onError, onEnd }) {
  if (!SR) {
    onError?.('unsupported');
    return () => {};
  }
  const rec = new SR();
  rec.lang = 'en-GB';
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let finalText = '';
  rec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    onInterim?.((finalText + ' ' + interim).trim());
  };
  rec.onerror = (e) => onError?.(e.error || 'error');
  rec.onend = () => {
    if (finalText.trim()) onFinal?.(finalText.trim());
    onEnd?.();
  };
  try {
    rec.start();
  } catch {
    onError?.('start-failed');
  }
  return () => {
    try {
      rec.stop();
    } catch {
      /* ignore */
    }
  };
}

// Commit interim text if recognition ends without a final result (Safari).
export function listenWithFallback(opts) {
  let last = '';
  let gotFinal = false;
  return listen({
    ...opts,
    onInterim: (t) => {
      last = t;
      opts.onInterim?.(t);
    },
    onFinal: (t) => {
      gotFinal = true;
      opts.onFinal?.(t);
    },
    onEnd: () => {
      if (!gotFinal && last) opts.onFinal?.(last);
      opts.onEnd?.();
    },
  });
}
