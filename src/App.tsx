import React, { useState, useEffect, useRef, ChangeEvent, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { dbStorage, FALLBACK_CONFIG, AppConfig, SongItem } from './storage';

const PLACEHOLDERS = [
  { icon: '🌅', label: 'Lần đầu gặp' },
  { icon: '💞', label: 'Hẹn hò đầu' },
  { icon: '🎂', label: 'Sinh nhật em' },
  { icon: '✈️', label: 'Chuyến đi đôi' },
  { icon: '☕', label: 'Khoảnh khắc thường ngày' },
  { icon: '🌟', label: 'Kỷ niệm đặc biệt' },
  { icon: '🌸', label: 'Dạo phố' },
  { icon: '🎵', label: 'Ca khúc yêu thích' }
];

const FLOWERS = ['🌸', '🌺', '🌼', '🌻', '🌹', '🌷', '💐', '🪷'];
const NO_BLOOM = 'button, a, input, textarea, label, .num-btn, .react-btn, .fs-btn, .orbital-photo, .envelope-btn, .scratch-close, .save-btn, .add-row-btn, .del-row, .add-song-label, .sheet-close-btn, .letter-close-btn, .photo-modal-close, .album-cover';

// Beep sounds using Web Audio API
function playPop(type: 'soft' | 'success' | 'error' | 'flower' = 'soft') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ac = new AudioContextClass();
    const t = ac.currentTime;

    if (type === 'soft') {
      const o1 = ac.createOscillator();
      const o2 = ac.createOscillator();
      const g = ac.createGain();
      o1.connect(g); o2.connect(g); g.connect(ac.destination);
      o1.type = 'sine'; o2.type = 'sine';
      o1.frequency.setValueAtTime(520, t); o1.frequency.exponentialRampToValueAtTime(340, t + 0.12);
      o2.frequency.setValueAtTime(780, t); o2.frequency.exponentialRampToValueAtTime(440, t + 0.08);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.09, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o1.start(t); o1.stop(t + 0.18); o2.start(t); o2.stop(t + 0.08);
    } else if (type === 'success') {
      [440, 554, 659, 880].forEach((f, i) => {
        setTimeout(() => {
          const o = ac.createOscillator();
          const gn = ac.createGain();
          const t2 = ac.currentTime;
          o.connect(gn); gn.connect(ac.destination); o.type = 'sine'; o.frequency.value = f;
          gn.gain.setValueAtTime(0, t2); gn.gain.linearRampToValueAtTime(0.09, t2 + 0.01); gn.gain.exponentialRampToValueAtTime(0.001, t2 + 0.22);
          o.start(t2); o.stop(t2 + 0.22);
        }, i * 80);
      });
    } else if (type === 'error') {
      const oe = ac.createOscillator();
      const ge = ac.createGain();
      oe.connect(ge); ge.connect(ac.destination); oe.type = 'sine';
      oe.frequency.setValueAtTime(220, ac.currentTime); oe.frequency.linearRampToValueAtTime(180, ac.currentTime + 0.2);
      ge.gain.setValueAtTime(0.07, ac.currentTime); ge.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
      oe.start(); oe.stop(ac.currentTime + 0.25);
    } else if (type === 'flower') {
      const of2 = ac.createOscillator();
      const gf2 = ac.createGain();
      of2.connect(gf2); gf2.connect(ac.destination); of2.type = 'sine'; of2.frequency.value = 1200;
      of2.frequency.exponentialRampToValueAtTime(1600, ac.currentTime + 0.06);
      gf2.gain.setValueAtTime(0, ac.currentTime); gf2.gain.linearRampToValueAtTime(0.06, ac.currentTime + 0.01); gf2.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);
      of2.start(); of2.stop(ac.currentTime + 0.12);
    }
  } catch (e) {
    console.error('Audio feedback error', e);
  }
}

// Sparkle particles generator
function createSparkle(x: number, y: number, n = 8) {
  const emojis = ['💕', '✨', '🌸', '💗', '⭐', '🌟', '💖', '🎀', '🌷'];
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'sparkle-el';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    const tx = (Math.random() - 0.5) * 140;
    const ty = (Math.random() - 0.8) * 140;
    el.style.setProperty('--tx', `${tx}px`);
    el.style.setProperty('--ty', `${ty}px`);
    el.style.left = `${x - 14}px`;
    el.style.top = `${y - 14}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }
}

// Flower particle generator
function createBloomFlower(x: number, y: number) {
  playPop('flower');
  const el = document.createElement('div');
  el.className = 'flower-burst';
  el.textContent = FLOWERS[Math.floor(Math.random() * FLOWERS.length)];
  el.style.left = `${x - 16}px`;
  el.style.top = `${y - 16}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

// React float generator
function createReactFloat(emoji: string, x: number, y: number) {
  playPop('flower');
  const el = document.createElement('div');
  el.className = 'react-float';
  el.textContent = emoji;
  el.style.left = `${x - 16}px`;
  el.style.top = `${y - 16}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);

  for (let i = 0; i < 4; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle-el';
    s.textContent = emoji;
    const tx = (Math.random() - 0.5) * 80;
    const ty = (Math.random() - 0.8) * 80;
    s.style.setProperty('--tx', `${tx}px`);
    s.style.setProperty('--ty', `${ty}px`);
    s.style.left = `${x - 14}px`;
    s.style.top = `${y - 14}px`;
    s.style.fontSize = '1rem';
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 700);
  }
}

// Character-by-character render helper
const LetterTextAnimate = ({ text }: { text: string }) => {
  let delay = 0;
  return (
    <>
      {Array.from(text).map((char, index) => {
        if (char === '\n') {
          const currentDelay = delay;
          delay += 18;
          return <br key={index} style={{ animationDelay: `${currentDelay}ms` }} />;
        }
        const currentDelay = delay;
        delay += char === ' ' ? 8 : 28;
        return (
          <span
            key={index}
            className="letter-char"
            style={{ animationDelay: `${currentDelay}ms` }}
          >
            {char}
          </span>
        );
      })}
    </>
  );
};

export default function App() {
  const [dbInited, setDbInited] = useState(false);
  const [config, setConfig] = useState<AppConfig>(FALLBACK_CONFIG);
  const [photosList, setPhotosList] = useState<string[]>([]);
  const [songsList, setSongsList] = useState<SongItem[]>([]);

  // Page Navigation States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [isWrongPin, setIsWrongPin] = useState(false);
  const [isScratchOpen, setIsScratchOpen] = useState(false);

  // App Features Modal States
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [isEnvelopeOpening, setIsEnvelopeOpening] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fsIndex, setFsIndex] = useState(0);

  const [checkedPromises, setCheckedPromises] = useState<Record<number, boolean>>({});
  const [isSurpriseRevealed, setIsSurpriseRevealed] = useState(false);

  // Admin Configuration Sheet
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminConfig, setAdminConfig] = useState<AppConfig>(FALLBACK_CONFIG);
  const [adminReasons, setAdminReasons] = useState<string[]>([]);
  const [adminPromises, setAdminPromises] = useState<string[]>([]);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  // Background Music State
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // Refs for custom controls
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const orbitalWrapRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const orbitalItemsRef = useRef<{ el: HTMLDivElement; baseX: number; baseY: number; ri: number }[]>([]);

  // 1. Initialize IndexedDB and Load State
  useEffect(() => {
    async function initAndLoad() {
      await dbStorage.init();
      
      const savedConfig = await dbStorage.get<AppConfig>('config');
      const savedPhotos = await dbStorage.get<string[]>('photos');
      const savedSongs = await dbStorage.get<SongItem[]>('songs');

      if (savedConfig) {
        const merged = { ...FALLBACK_CONFIG, ...savedConfig };
        setConfig(merged);
        setAdminConfig(merged);
        setAdminReasons(merged.reasons);
        setAdminPromises(merged.promises);
      } else {
        setAdminReasons(FALLBACK_CONFIG.reasons);
        setAdminPromises(FALLBACK_CONFIG.promises);
      }

      if (savedPhotos) setPhotosList(savedPhotos);
      if (savedSongs) setSongsList(savedSongs);

      setDbInited(true);
    }
    initAndLoad();
  }, []);

  // 2. Lock screen Background Starry effect
  useEffect(() => {
    if (isUnlocked) return;
    const container = document.getElementById('lockStars');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 80; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDuration = `${1.5 + Math.random() * 3}s`;
      star.style.animationDelay = `${Math.random() * 3}s`;
      container.appendChild(star);
    }
  }, [isUnlocked]);

  // 3. Falling Petals Effect (Only when unlocked)
  useEffect(() => {
    if (!isUnlocked) return;
    const layer = document.getElementById('petalLayer');
    if (!layer) return;
    layer.innerHTML = '';
    ['🌸', '🌺', '✨', '💕', '🌷', '💗'].forEach((p) => {
      for (let i = 0; i < 4; i++) {
        const el = document.createElement('div');
        el.className = 'petal';
        el.textContent = p;
        el.style.left = `${Math.random() * 100}%`;
        el.style.fontSize = `${0.7 + Math.random() * 0.9}rem`;
        el.style.animationDuration = `${10 + Math.random() * 14}s`;
        el.style.animationDelay = `${Math.random() * 14}s`;
        layer.appendChild(el);
      }
    });
  }, [isUnlocked]);

  // 4. Global screen click to bloom flower
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(NO_BLOOM)) return;
      createBloomFlower(e.clientX, e.clientY);
    };

    const handleGlobalTouch = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(NO_BLOOM)) return;
      const t = e.touches[0];
      createBloomFlower(t.clientX, t.clientY);
    };

    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('touchstart', handleGlobalTouch, { passive: true });

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalTouch);
    };
  }, [isUnlocked]);

  // 5. Scroll animation triggers
  useEffect(() => {
    if (!isUnlocked) return;

    let lastScrollY = window.scrollY;
    let scrollDir = 'down';

    const handleScroll = () => {
      const y = window.scrollY;
      scrollDir = y > lastScrollY ? 'down' : 'up';
      lastScrollY = y;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const startTypewriter = (el: HTMLElement) => {
      if (el.dataset.twDone) return;
      el.dataset.twDone = '1';
      const full = el.textContent?.trim() || '';
      el.textContent = '';
      let i = 0;
      const tick = setInterval(() => {
        el.textContent = full.slice(0, ++i);
        if (i >= full.length) {
          clearInterval(tick);
          el.classList.add('done');
        }
      }, 55);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const target = en.target as HTMLElement;
        if (en.isIntersecting) {
          target.classList.remove('exit-up');
          target.classList.add('visible');
          target.querySelectorAll('.typewriter').forEach((tw) => {
            startTypewriter(tw as HTMLElement);
          });
        } else if (scrollDir === 'up' && target.classList.contains('visible')) {
          target.classList.remove('visible');
          target.classList.add('exit-up');
          target.querySelectorAll('.typewriter').forEach((tw) => {
            const el = tw as HTMLElement;
            delete el.dataset.twDone;
            el.classList.remove('done');
          });
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal-section-item').forEach((it) => {
      io.observe(it);
    });

    const envWrap = document.getElementById('envelopeFlyWrap');
    let envObserver: IntersectionObserver | null = null;
    if (envWrap) {
      envObserver = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            envWrap.classList.remove('exit-up');
            setTimeout(() => { envWrap.classList.add('fly-in'); }, 180);
          } else if (scrollDir === 'up' && envWrap.classList.contains('fly-in')) {
            envWrap.classList.remove('fly-in');
            envWrap.classList.add('exit-up');
          }
        });
      }, { threshold: 0.15 });
      envObserver.observe(envWrap);
    }

    const albumWrap = document.getElementById('albumFlyWrap');
    let albumObserver: IntersectionObserver | null = null;
    if (albumWrap) {
      albumObserver = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            albumWrap.classList.remove('exit-up');
            setTimeout(() => { albumWrap.classList.add('fly-in'); }, 180);
          } else if (scrollDir === 'up' && albumWrap.classList.contains('fly-in')) {
            albumWrap.classList.remove('fly-in');
            albumWrap.classList.add('exit-up');
          }
        });
      }, { threshold: 0.15 });
      albumObserver.observe(albumWrap);
    }

    // Stagger lists loading
    const pl = document.getElementById('promisesList');
    let plObserver: IntersectionObserver | null = null;
    if (pl) {
      plObserver = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            pl.querySelectorAll('.promise-item').forEach((item, idx) => {
              const el = item as HTMLElement;
              el.classList.remove('exit-up');
              setTimeout(() => { el.classList.add('item-visible'); }, 100 + idx * 130);
            });
          } else if (scrollDir === 'up') {
            Array.from(pl.querySelectorAll('.promise-item.item-visible')).reverse().forEach((item, idx) => {
              const el = item as HTMLElement;
              setTimeout(() => {
                el.classList.remove('item-visible');
                el.classList.add('exit-up');
              }, idx * 60);
            });
          }
        });
      }, { threshold: 0.08 });
      plObserver.observe(pl);
    }

    const rl = document.getElementById('reasonsList');
    let rlObserver: IntersectionObserver | null = null;
    if (rl) {
      rlObserver = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            rl.querySelectorAll('.reason-item').forEach((item, idx) => {
              const el = item as HTMLElement;
              el.classList.remove('exit-up');
              setTimeout(() => { el.classList.add('item-visible'); }, 80 + idx * 110);
            });
          } else if (scrollDir === 'up') {
            Array.from(rl.querySelectorAll('.reason-item.item-visible')).reverse().forEach((item, idx) => {
              const el = item as HTMLElement;
              setTimeout(() => {
                el.classList.remove('item-visible');
                el.classList.add('exit-up');
              }, idx * 60);
            });
          }
        });
      }, { threshold: 0.08 });
      rlObserver.observe(rl);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      io.disconnect();
      if (envObserver) envObserver.disconnect();
      if (albumObserver) albumObserver.disconnect();
      if (plObserver) plObserver.disconnect();
      if (rlObserver) rlObserver.disconnect();
    };
  }, [isUnlocked, config]);

  // 6. Keyboard events on Lock screen
  useEffect(() => {
    if (isUnlocked) return;
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        pressNum(e.key);
      } else if (e.key === 'Backspace') {
        pressDelete();
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isUnlocked, pin]);

  // 7. Scratch Card scratch mechanics
  useEffect(() => {
    if (!isScratchOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const g = ctx.createLinearGradient(0, 0, 220, 72);
    g.addColorStop(0, '#c0a0b0');
    g.addColorStop(0.5, '#e8d0da');
    g.addColorStop(1, '#b090a0');
    ctx.fillStyle = g;
    ctx.beginPath();
    if ((ctx as any).roundRect) {
      (ctx as any).roundRect(0, 0, 220, 72, 12);
    } else {
      ctx.rect(0, 0, 220, 72);
    }
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.font = '12px serif';
    for (let i = 0; i < 220; i += 20) {
      for (let j = 0; j < 72; j += 20) {
        ctx.fillText('✦', i, j + 14);
      }
    }

    ctx.fillStyle = '#9a7080';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CÀO ĐỂ XEM', 110, 35);
    ctx.font = '11px sans-serif';
    ctx.fillText('Mật khẩu bí mật', 110, 52);

    let drawing = false;
    const scratch = (x: number, y: number) => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
    };

    const handleMouseDown = (e: MouseEvent) => {
      drawing = true;
      const r = canvas.getBoundingClientRect();
      scratch(e.clientX - r.left, e.clientY - r.top);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!drawing) return;
      const r = canvas.getBoundingClientRect();
      scratch(e.clientX - r.left, e.clientY - r.top);
    };

    const handleMouseUp = () => { drawing = false; };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      drawing = true;
      const r = canvas.getBoundingClientRect();
      const t = e.touches[0];
      scratch(t.clientX - r.left, t.clientY - r.top);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!drawing) return;
      const r = canvas.getBoundingClientRect();
      const t = e.touches[0];
      scratch(t.clientX - r.left, t.clientY - r.top);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleMouseUp);
    };
  }, [isScratchOpen]);

  // 8. Orbital Proximity Scale Easing (GPU Accelerated direct DOM animation)
  useEffect(() => {
    if (!isPhotoModalOpen) return;

    let rafId: number;
    const frame = () => {
      const mouse = mouseRef.current;
      orbitalItemsRef.current.forEach((item) => {
        const el = item.el;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const ecx = r.left + r.width / 2;
        const ecy = r.top + r.height / 2;
        const dist = Math.hypot(mouse.x - ecx, mouse.y - ecy);

        const influence = 180;
        const maxScale = item.ri === 0 ? 1.3 : 1.65;
        const target = dist < influence ? 1 + (maxScale - 1) * (1 - dist / influence) : 1;

        const cur = parseFloat(el.getAttribute('data-scale') || '1');
        const ns = cur + (target - cur) * 0.15; // smooth physics ease
        el.setAttribute('data-scale', ns.toString());
        el.style.transform = `scale(${ns})`;
        el.style.zIndex = Math.round(ns * 10 + (item.ri === 0 ? 50 : 20)).toString();
      });
      rafId = requestAnimationFrame(frame);
    };

    // Gather orbital photos
    orbitalItemsRef.current = [];
    const elements = document.querySelectorAll('.orbital-photo');
    elements.forEach((el, i) => {
      const ri = parseInt(el.getAttribute('data-ri') || '1');
      orbitalItemsRef.current.push({
        el: el as HTMLDivElement,
        baseX: 0,
        baseY: 0,
        ri
      });
      setTimeout(() => {
        el.classList.add('photo-shown');
      }, 120 + i * 140);
    });

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isPhotoModalOpen, photosList]);

  // Background Music Mechanics
  const playTrack = (idx: number) => {
    if (songsList.length === 0) return;
    const nextIdx = ((idx % songsList.length) + songsList.length) % songsList.length;
    setCurrentSongIndex(nextIdx);

    const audio = audioRef.current;
    if (!audio) return;

    audio.onended = null;
    audio.oncanplay = null;
    audio.onerror = null;
    audio.volume = 0.45;
    audio.loop = songsList.length === 1;

    audio.onended = () => {
      if (songsList.length > 1) {
        playTrack(nextIdx + 1);
      }
    };

    audio.onerror = () => {
      if (songsList.length > 1) {
        setTimeout(() => {
          playTrack(nextIdx + 1);
        }, 500);
      }
    };

    audio.oncanplay = () => {
      audio.oncanplay = null;
      audio.play()
        .then(() => {
          setIsMusicPlaying(true);
        })
        .catch(attachResumeListener);
    };

    audio.src = songsList[nextIdx].data;
    audio.load();
  };

  const attachResumeListener = () => {
    const tryPlay = () => {
      const audio = audioRef.current;
      if (audio) {
        audio.play()
          .then(() => {
            setIsMusicPlaying(true);
            ['click', 'keydown', 'touchstart', 'scroll'].forEach((ev) => {
              document.removeEventListener(ev, tryPlay);
            });
          })
          .catch(() => {});
      }
    };
    ['click', 'keydown', 'touchstart', 'scroll'].forEach((ev) => {
      document.addEventListener(ev, tryPlay, { once: true });
    });
  };

  const startMusic = () => {
    if (songsList.length > 0) {
      playTrack(0);
    }
  };

  // PIN Press Mechanics
  const pressNum = (n: string) => {
    if (pin.length >= 4) return;
    playPop('soft');
    const newPin = pin + n;
    setPin(newPin);

    if (newPin.length === 4) {
      setTimeout(() => {
        if (newPin === config.password) {
          playPop('success');
          unlockApplication();
        } else {
          playPop('error');
          setIsWrongPin(true);
          setTimeout(() => {
            setPin('');
            setIsWrongPin(false);
          }, 700);
        }
      }, 150);
    }
  };

  const pressDelete = () => {
    if (!pin.length) return;
    playPop('soft');
    setPin(pin.slice(0, -1));
  };

  const unlockApplication = () => {
    setIsUnlocked(true);
    // Animate Love meter width after unlock
    setTimeout(() => {
      const mb = document.getElementById('meterBar');
      if (mb) {
        const pct = config.meter.indexOf('∞') >= 0 ? 100 : Math.min(parseInt(config.meter) || 100, 100);
        mb.style.width = `${pct}%`;
      }
    }, 800);
    startMusic();
  };

  // Scratch Modal opening
  const openScratch = () => {
    playPop();
    setIsScratchOpen(true);
  };

  // Envelope Opening Sequences
  const handleEnvelopeClick = () => {
    if (isLetterModalOpen) return;
    playPop('soft');
    const btn = document.getElementById('envelopeBtn');
    if (btn) btn.classList.add('shaking');

    setTimeout(() => {
      if (btn) btn.classList.remove('shaking');
      setIsEnvelopeOpening(true);

      setTimeout(() => {
        setIsLetterModalOpen(true);
        createSparkle(window.innerWidth / 2, window.innerHeight / 2, 6);
        setTimeout(() => {
          setIsEnvelopeOpening(false);
        }, 500);
      }, 500);
    }, 550);
  };

  // Memories Slideshow Controls
  const openPhotoModal = () => {
    playPop();
    setIsPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    playPop();
    setIsPhotoModalOpen(false);
    orbitalItemsRef.current = [];
  };

  const openFullscreen = (idx: number) => {
    if (photosList.length === 0) return;
    playPop();
    setFsIndex(idx);
    setIsFullscreenOpen(true);
  };

  const fsNav = (dir: number) => {
    if (photosList.length === 0) return;
    setFsIndex((fsIndex + dir + photosList.length) % photosList.length);
  };

  const handleOrbitalMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    mouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleOrbitalTouchMove = (e: ReactTouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleOrbitalMouseLeave = () => {
    mouseRef.current = { x: -9999, y: -9999 };
  };

  // Reactions dispatcher
  const dispatchReaction = (emoji: string, e: ReactMouseEvent) => {
    createReactFloat(emoji, e.clientX, e.clientY);
  };

  // Surprise reveal trigger
  const handleReveal = (e: ReactMouseEvent) => {
    playPop('success');
    createSparkle(e.clientX, e.clientY, 12);
    setIsSurpriseRevealed(true);
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        createSparkle(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.7, 6);
      }, i * 100);
    }
  };

  // Dynamic lists admin handlers
  const handleAddReason = () => {
    playPop();
    setAdminReasons([...adminReasons, '']);
  };

  const handleRemoveReason = (index: number) => {
    playPop();
    setAdminReasons(adminReasons.filter((_, i) => i !== index));
  };

  const handleReasonChange = (index: number, val: string) => {
    const updated = [...adminReasons];
    updated[index] = val;
    setAdminReasons(updated);
  };

  const handleAddPromise = () => {
    playPop();
    setAdminPromises([...adminPromises, '']);
  };

  const handleRemovePromise = (index: number) => {
    playPop();
    setAdminPromises(adminPromises.filter((_, i) => i !== index));
  };

  const handlePromiseChange = (index: number, val: string) => {
    const updated = [...adminPromises];
    updated[index] = val;
    setAdminPromises(updated);
  };

  // Media files uploading
  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    let loaded = 0;
    const newPhotos = [...photosList];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          newPhotos.push(ev.target.result as string);
        }
        loaded++;
        if (loaded === files.length) {
          // Keep strict limit of 30 if exceeds, but safely let user upload
          const clamped = newPhotos.slice(0, 30);
          setPhotosList(clamped);
          dbStorage.set('photos', clamped);
          playPop('success');
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSongUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    let loaded = 0;
    const newSongs = [...songsList];

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          newSongs.push({
            name: file.name.replace(/\.[^.]+$/, ''),
            data: ev.target.result as string
          });
        }
        loaded++;
        if (loaded === files.length) {
          setSongsList(newSongs);
          dbStorage.set('songs', newSongs);
          playPop('success');
          // If no track is playing, bootstrap immediately
          if (isUnlocked && !isMusicPlaying) {
            playTrack(newSongs.length - 1);
          }
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleDeletePhoto = (idx: number) => {
    playPop();
    const updated = photosList.filter((_, i) => i !== idx);
    setPhotosList(updated);
    dbStorage.set('photos', updated);
  };

  const handleDeleteSong = (idx: number) => {
    playPop();
    const updated = songsList.filter((_, i) => i !== idx);
    setSongsList(updated);
    dbStorage.set('songs', updated);

    if (updated.length === 0) {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.src = '';
      }
      setIsMusicPlaying(false);
    } else if (currentSongIndex >= updated.length) {
      playTrack(0);
    }
  };

  // Settings Save logic
  const handleAdminSave = async () => {
    playPop('success');
    const updated: AppConfig = {
      name: adminConfig.name || FALLBACK_CONFIG.name,
      tagline: adminConfig.tagline || FALLBACK_CONFIG.tagline,
      envFrom: adminConfig.envFrom || FALLBACK_CONFIG.envFrom,
      letter: adminConfig.letter,
      sig: adminConfig.sig || FALLBACK_CONFIG.sig,
      reasons: adminReasons.map((r) => r.trim()).filter(Boolean),
      promises: adminPromises.map((p) => p.trim()).filter(Boolean),
      meter: adminConfig.meter || FALLBACK_CONFIG.meter,
      meterLbl: adminConfig.meterLbl,
      surprise: adminConfig.surprise,
      password: adminConfig.password.replace(/\D/g, '').slice(0, 4) || config.password
    };

    setConfig(updated);
    await dbStorage.set('config', updated);

    // Dynamic save indicators trigger
    setShowSaveIndicator(true);
    setTimeout(() => {
      setShowSaveIndicator(false);
    }, 1800);

    // Animate Love meter based on new configs
    const mb = document.getElementById('meterBar');
    if (mb) {
      mb.style.width = '0%';
      setTimeout(() => {
        const pct = updated.meter.indexOf('∞') >= 0 ? 100 : Math.min(parseInt(updated.meter) || 100, 100);
        mb.style.width = `${pct}%`;
      }, 100);
    }

    setIsSurpriseRevealed(false);
    setIsAdminOpen(false);

    // Throw sparkles
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        createSparkle(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.7, 5);
      }, i * 80);
    }
  };

  // Calc items position coordinates mapping
  const getOrbitalItems = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const cx = W / 2;
    const cy = H / 2;
    const minWH = Math.min(W, H);

    const usePlaceholders = photosList.length === 0;
    const items = usePlaceholders ? PLACEHOLDERS : photosList;
    const n = items.length;

    const rings = n <= 0 ? [0, 0, 0] :
                  n === 1 ? [1, 0, 0] :
                  n <= 6 ? [1, n - 1, 0] :
                  [1, Math.min(n - 1, 6), Math.max(0, n - 7)];

    const rSize = [minWH * 0.28, minWH * 0.155, minWH * 0.1];
    const rRad = [0, minWH * 0.27, minWH * 0.44];

    const rendered: any[] = [];
    let idx = 0;

    rings.forEach((count, ri) => {
      for (let i = 0; i < count; i++) {
        if (idx >= n) break;
        const angle = ri === 0 ? 0 : (2 * Math.PI / count) * i - Math.PI / 2;
        const x = cx + rRad[ri] * Math.cos(angle);
        const y = cy + rRad[ri] * Math.sin(angle);
        const sz = rSize[ri];

        rendered.push({
          id: idx,
          x,
          y,
          sz,
          ri,
          isCenter: ri === 0,
          imgSrc: usePlaceholders ? undefined : (items[idx] as string),
          placeholder: usePlaceholders ? (items[idx] as any) : undefined,
          index: idx
        });
        idx++;
      }
    });

    return rendered;
  };

  const orbitalRenderedItems = isPhotoModalOpen ? getOrbitalItems() : [];

  if (!dbInited) {
    return (
      <div className="min-h-screen bg-[#1a0610] flex flex-col items-center justify-center text-[#f7d6df] font-sans">
        <div className="lock-seal">💌</div>
        <div className="mt-4 font-light tracking-wide animate-pulse">Đang tải kỷ niệm tình yêu...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="petal-layer" id="petalLayer" />
      <div id="save-indicator" className={showSaveIndicator ? 'show' : ''}>💾 Đã lưu!</div>

      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* ── LOCK SCREEN ── */}
      {!isUnlocked && (
        <div id="lock-screen" className="relative overflow-hidden">
          <div className="lock-stars" id="lockStars" />
          <div className="lock-seal">💌</div>
          <div className="lock-title">Dành Riêng Cho Em</div>
          <div className="lock-sub">Nhập mã bí mật để mở</div>

          <div className="pin-display" id="pinDisplay">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                id={`dot${i}`}
                className={`pin-dot ${i < pin.length ? 'filled' : ''} ${isWrongPin ? 'wrong' : ''}`}
              />
            ))}
          </div>

          <div className="numpad select-none">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                className="num-btn"
                onClick={() => pressNum(n.toString())}
              >
                {n}
              </button>
            ))}
            <div className="num-btn empty" />
            <button
              type="button"
              className="num-btn"
              onClick={() => pressNum('0')}
            >
              0
            </button>
            <button
              type="button"
              id="delBtn"
              className="num-btn flex items-center justify-center font-sans"
              onClick={pressDelete}
            >
              ⌫
            </button>
          </div>

          <div className="lock-hint-link" id="hintLink" onClick={openScratch}>
            🪄 Quên mật khẩu? Cào để xem gợi ý
          </div>
        </div>
      )}

      {/* ── SCRATCH MODAL ── */}
      <div id="scratch-modal" className={isScratchOpen ? 'open' : ''}>
        <div className="scratch-box">
          <div className="scratch-title">🎟 Thẻ Bí Mật</div>
          <div className="scratch-sub">Cào lớp phủ để xem mật khẩu của em</div>
          <div className="scratch-wrap select-none">
            <canvas ref={canvasRef} id="scratch-canvas" width="220" height="72" />
            <div className="scratch-reveal" id="scratch-reveal">
              {config.password.split('').join(' ')}
            </div>
          </div>
          <button
            type="button"
            className="scratch-close"
            id="scratchCloseBtn"
            onClick={() => {
              playPop();
              setIsScratchOpen(false);
            }}
          >
            Đóng lại
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      {isUnlocked && (
        <div id="main-content" className="relative w-full overflow-hidden">
          <div className="hero select-none">
            <div className="hero-eyebrow animate-fade-in">Dành riêng cho</div>
            <div className="hero-name" id="heroName">{config.name}</div>
            <div className="hero-tagline" id="heroTagline">{config.tagline}</div>
            <div className="hero-scroll">↓</div>
          </div>

          {/* Letter section */}
          <div className="section reveal-section-item">
            <div className="section-label">Từ Trái Tim Anh</div>
            <div className="section-heading typewriter" id="headingLetter">Thư Tình</div>
            <div className="envelope-fly-wrap" id="envelopeFlyWrap">
              <button
                type="button"
                className="envelope-btn"
                id="envelopeBtn"
                onClick={handleEnvelopeClick}
              >
                <div className={`env-svg-wrap ${isEnvelopeOpening ? 'opening' : ''}`} id="envWrap">
                  <svg className="env-shape" viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
                    <rect width="400" height="240" rx="20" ry="20" fill="#fdf0f4" />
                    <polygon points="0,240 200,145 400,240" fill="rgba(240,180,200,0.3)" />
                    <line x1="0" y1="240" x2="200" y2="145" stroke="rgba(210,150,175,0.35)" strokeWidth="1" />
                    <line x1="400" y1="240" x2="200" y2="145" stroke="rgba(210,150,175,0.35)" strokeWidth="1" />
                    <polygon className="env-flap-el" points="0,0 400,0 200,115" fill="#f0b8cc" />
                    <polygon points="0,0 400,0 200,115" fill="url(#fg)" opacity="0.4" />
                    <line x1="0" y1="0" x2="200" y2="115" stroke="rgba(200,100,140,0.25)" strokeWidth="1" />
                    <line x1="400" y1="0" x2="200" y2="115" stroke="rgba(200,100,140,0.25)" strokeWidth="1" />
                    <rect x="8" y="8" width="384" height="224" rx="16" ry="16" fill="none" stroke="rgba(200,130,160,0.18)" strokeWidth="1.5" strokeDasharray="6,4" />
                    <defs>
                      <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#e08090" stopOpacity="0.08" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="env-letter-icon">📄</div>
                  <div className="env-content-over">
                    <div className="env-seal-badge select-none">💋</div>
                    <div className="env-to-label">Gửi đến</div>
                    <div className="env-recipient" id="envFrom">{config.envFrom}</div>
                    <div className="env-cta select-none">✉️ &nbsp;Bấm để mở thư...</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="divider reveal-section-item">✦ ✦ ✦</div>

          {/* Album section */}
          <div className="section reveal-section-item">
            <div className="section-label">Ký Ức Của Mình</div>
            <div className="section-heading typewriter" id="headingAlbum">Album Ảnh</div>
            <div className="album-fly-wrap" id="albumFlyWrap">
              <div className="album-cover" id="albumCover" onClick={openPhotoModal}>
                <span className="album-icon select-none">📷</span>
                <div className="album-title">Chuyện Của Chúng Mình</div>
                <div className="album-sub">Bấm để xem ảnh</div>
                <div className="album-badge" id="photoBadge">{photosList.length} ảnh</div>
              </div>
            </div>
          </div>

          <div className="divider reveal-section-item">✦ ✦ ✦</div>

          {/* Reasons Section */}
          <div className="section reveal-section-item">
            <div className="section-label">Vì Sao Anh Yêu Em</div>
            <div className="section-heading typewriter" id="headingReasons">Những Lý Do</div>
            <ul className="reasons-list" id="reasonsList">
              {config.reasons.map((r, i) => (
                <li key={i} className="reason-item">
                  <span className="reason-num">{i + 1}</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="divider reveal-section-item">✦ ✦ ✦</div>

          {/* Love Meter Meter Section */}
          <div className="section reveal-section-item select-none">
            <div className="section-label">Đo Lường Tình Yêu</div>
            <div className="section-heading">Anh Yêu Em Bao Nhiêu?</div>
            <div className="meter-track">
              <div className="meter-bar" id="meterBar">
                {config.meter}
              </div>
            </div>
            <div className="text-right text-xs mt-1 text-[#8a4060]" id="meterLbl">
              {config.meterLbl}
            </div>
          </div>

          <div className="divider reveal-section-item">✦ ✦ ✦</div>

          {/* Promises Checklist Section */}
          <div className="section reveal-section-item">
            <div className="section-label">Cam Kết Của Anh</div>
            <div className="section-heading typewriter" id="headingPromises">Lời Hứa</div>
            <ul className="promises-list" id="promisesList">
              {config.promises.map((promise, index) => {
                const checked = !!checkedPromises[index];
                return (
                  <li
                    key={index}
                    className={`promise-item select-none transition-colors ${checked ? 'checked' : ''}`}
                    onClick={(e) => {
                      playPop();
                      createSparkle(e.clientX, e.clientY, 4);
                      setCheckedPromises({
                        ...checkedPromises,
                        [index]: !checked
                      });
                    }}
                  >
                    <span className="promise-icon transition-transform select-none">
                      {checked ? '✅' : '🤝'}
                    </span>
                    <span>{promise}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Secret surprise block */}
          <div className="reveal-bottom reveal-section-item">
            <button
              type="button"
              className="reveal-btn select-none"
              id="revealBtn"
              onClick={handleReveal}
            >
              {isSurpriseRevealed ? '💖 Anh Yêu Em Mãi Mãi 💖' : '✨ Mở Điều Bí Mật ✨'}
            </button>
            <div className={`surprise-text ${isSurpriseRevealed ? 'show' : ''}`} id="surpriseText">
              {config.surprise}
            </div>
          </div>
        </div>
      )}

      {/* ── LETTER MODAL ── */}
      <div id="letter-modal" className={isLetterModalOpen ? 'open' : ''} onClick={(e) => {
        if (e.target === e.currentTarget) {
          playPop();
          setIsLetterModalOpen(false);
        }
      }}>
        <div className="letter-modal-inner">
          <div className="letter-modal-seal">
            <div className="letter-modal-seal-icon">💌</div>
            <button
              type="button"
              className="letter-close-btn"
              id="letterCloseBtn"
              onClick={() => {
                playPop();
                setIsLetterModalOpen(false);
              }}
            >
              ✕
            </button>
          </div>
          <div className="letter-modal-body">
            <div className="letter-date" id="letterDate">
              {(() => {
                const now = new Date();
                const months = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
                return `Ngày ${now.getDate()} ${months[now.getMonth()]} năm ${now.getFullYear()}`;
              })()}
            </div>
            <div className="letter-content-area">
              <div className="letter-content-text" id="letterText">
                {isLetterModalOpen && <LetterTextAnimate text={config.letter} />}
              </div>
            </div>
            <div className="letter-sig-area">
              <div className="letter-sig-text" id="letterSig">
                {config.sig}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PHOTO ORBITAL MODAL ── */}
      <div
        id="photo-modal"
        className={isPhotoModalOpen ? 'open' : ''}
        onClick={(e) => {
          if (e.target === e.currentTarget) closePhotoModal();
        }}
      >
        <div className="photo-modal-header select-none">
          <div className="photo-modal-title">Ảnh Của Chúng Mình 💕</div>
          <button
            type="button"
            className="photo-modal-close"
            id="photoModalClose"
            onClick={closePhotoModal}
          >
            ✕
          </button>
        </div>

        <div
          ref={orbitalWrapRef}
          id="orbital-wrap"
          onMouseMove={handleOrbitalMouseMove}
          onTouchMove={handleOrbitalTouchMove}
          onMouseLeave={handleOrbitalMouseLeave}
        >
          {orbitalRenderedItems.map((item) => (
            <div
              key={item.id}
              className={`orbital-photo ${item.isCenter ? 'center-photo' : ''}`}
              data-ri={item.ri}
              style={{
                width: `${item.sz}px`,
                height: `${item.sz}px`,
                left: `${item.x - item.sz / 2}px`,
                top: `${item.y - item.sz / 2}px`
              }}
              onClick={() => openFullscreen(item.index)}
            >
              {item.imgSrc ? (
                <img src={item.imgSrc} alt="" />
              ) : (
                <div className="orbital-photo-placeholder select-none">
                  <div className="ph-icon">{item.placeholder?.icon}</div>
                  <div className="ph-label">{item.placeholder?.label}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="orbital-hint select-none">
          Kéo gần ảnh để xem to • Nhấn để xem toàn màn hình
        </div>

        <div id="reaction-bar" className="select-none">
          {['❤️', '😍', '🥰', '😘', '💕', '🌸', '✨'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="react-btn select-none"
              onClick={(e) => dispatchReaction(emoji, e)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* ── FULLSCREEN PHOTO VIEWER ── */}
      <div id="photo-fullscreen" className={isFullscreenOpen ? 'open' : ''}>
        <button
          type="button"
          className="fs-close"
          id="fsClose"
          onClick={() => {
            playPop();
            setIsFullscreenOpen(false);
          }}
        >
          ✕
        </button>
        {photosList.length > 0 && (
          <img
            id="fs-img"
            src={photosList[fsIndex]}
            alt=""
            onTouchStart={(e) => {
              (window as any)._swipeX = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const startX = (window as any)._swipeX;
              if (startX === undefined) return;
              const dx = e.changedTouches[0].clientX - startX;
              if (Math.abs(dx) > 40) {
                fsNav(dx < 0 ? 1 : -1);
              }
              delete (window as any)._swipeX;
            }}
          />
        )}
        <div className="fs-nav select-none">
          <button
            type="button"
            className="fs-btn"
            id="fsPrev"
            onClick={() => {
              playPop();
              fsNav(-1);
            }}
          >
            ‹
          </button>
          <div className="fs-counter" id="fsCounter">
            {photosList.length > 0 ? `${fsIndex + 1} / ${photosList.length}` : '0 / 0'}
          </div>
          <button
            type="button"
            className="fs-btn"
            id="fsNext"
            onClick={() => {
              playPop();
              fsNav(1);
            }}
          >
            ›
          </button>
        </div>
        <div id="fs-reaction-bar" className="select-none">
          {['❤️', '😍', '🥰', '😘', '💕', '🌸', '✨'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="react-btn select-none"
              onClick={(e) => dispatchReaction(emoji, e)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* ── FLOATING CONFIG TRIGGER ── */}
      <button
        type="button"
        id="admin-toggle"
        className="select-none flex items-center justify-center"
        onClick={() => {
          playPop();
          setAdminConfig(config);
          setAdminReasons(config.reasons);
          setAdminPromises(config.promises);
          setIsAdminOpen(true);
        }}
      >
        ⚙️
      </button>

      {/* ── ADMIN SETTINGS OVERLAY SHEET ── */}
      <div
        id="admin-overlay"
        className={isAdminOpen ? 'open' : ''}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            playPop();
            setIsAdminOpen(false);
          }
        }}
      >
        <div className="admin-sheet select-text text-left font-sans text-sm">
          <button
            type="button"
            className="sheet-close-btn"
            id="adminCloseBtn"
            onClick={() => {
              playPop();
              setIsAdminOpen(false);
            }}
          >
            ✕
          </button>
          <div className="sheet-handle" />
          <div className="sheet-title">⚙️ Cài Đặt & Nội Dung</div>
          <div className="sheet-sub">Mọi thay đổi được lưu tự động vào thiết bị 💾</div>

          <label className="field-label">Tên người nhận</label>
          <input
            className="field-input"
            id="a-name"
            placeholder="Em Yêu"
            value={adminConfig.name}
            onChange={(e) => setAdminConfig({ ...adminConfig, name: e.target.value })}
          />

          <label className="field-label">Phụ đề hero</label>
          <input
            className="field-input"
            id="a-tagline"
            placeholder="Mỗi ngày bên em..."
            value={adminConfig.tagline}
            onChange={(e) => setAdminConfig({ ...adminConfig, tagline: e.target.value })}
          />

          <label className="field-label">Tên trong phong bì</label>
          <input
            className="field-input"
            id="a-envfrom"
            placeholder="Em Yêu Của Anh"
            value={adminConfig.envFrom}
            onChange={(e) => setAdminConfig({ ...adminConfig, envFrom: e.target.value })}
          />

          <label className="field-label">Nội dung thư tình</label>
          <textarea
            className="field-textarea"
            id="a-letter"
            rows={5}
            value={adminConfig.letter}
            onChange={(e) => setAdminConfig({ ...adminConfig, letter: e.target.value })}
          />

          <label className="field-label">Chữ ký</label>
          <input
            className="field-input"
            id="a-sig"
            placeholder="Anh ❤️"
            value={adminConfig.sig}
            onChange={(e) => setAdminConfig({ ...adminConfig, sig: e.target.value })}
          />

          <hr className="admin-sep" />

          {/* Photos Management */}
          <label className="field-label">📷 Ảnh Album (Tối đa 30 ảnh)</label>
          <div className="text-xs text-[#a07080] mb-2">Ảnh được lưu ngoại tuyến, tự hiện lại khi mở trang.</div>
          <label className="add-song-label select-none" htmlFor="photo-upload">
            📎 Thêm ảnh vào album
          </label>
          <input
            type="file"
            id="photo-upload"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handlePhotoUpload}
          />
          <div id="photo-admin-list" className="mt-2 flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
            {photosList.map((photo, i) => (
              <div key={i} className="song-row py-1">
                <img src={photo} className="w-9 h-9 object-cover rounded-lg flex-shrink-0" alt="" />
                <span>Ảnh {i + 1}</span>
                <button
                  type="button"
                  className="song-del"
                  onClick={() => handleDeletePhoto(i)}
                >
                  🗑
                </button>
              </div>
            ))}
            {photosList.length === 0 && (
              <div className="text-xs text-center text-[#b0909a] py-2">Chưa có ảnh nào</div>
            )}
          </div>

          <hr className="admin-sep" />

          {/* Reasons Row Builder */}
          <label className="field-label">Lý do yêu em</label>
          <div id="a-reasons" className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
            {adminReasons.map((reason, i) => (
              <div key={i} className="list-row">
                <input
                  className="field-input"
                  type="text"
                  placeholder="Lý do..."
                  value={reason}
                  onChange={(e) => handleReasonChange(i, e.target.value)}
                />
                <button
                  type="button"
                  className="del-row"
                  onClick={() => handleRemoveReason(i)}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="add-row-btn select-none"
            id="addReasonBtn"
            onClick={handleAddReason}
          >
            + Thêm lý do
          </button>

          {/* Promises Row Builder */}
          <label className="field-label">Lời hứa</label>
          <div id="a-promises" className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
            {adminPromises.map((promise, i) => (
              <div key={i} className="list-row">
                <input
                  className="field-input"
                  type="text"
                  placeholder="Lời hứa..."
                  value={promise}
                  onChange={(e) => handlePromiseChange(i, e.target.value)}
                />
                <button
                  type="button"
                  className="del-row"
                  onClick={() => handleRemovePromise(i)}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="add-row-btn select-none"
            id="addPromiseBtn"
            onClick={handleAddPromise}
          >
            + Thêm lời hứa
          </button>

          <label className="field-label">Mét tình yêu (% hoặc ∞%)</label>
          <input
            className="field-input"
            id="a-meter"
            placeholder="∞%"
            value={adminConfig.meter}
            onChange={(e) => setAdminConfig({ ...adminConfig, meter: e.target.value })}
          />

          <label className="field-label">Nhãn mét</label>
          <input
            className="field-input"
            id="a-meterlbl"
            placeholder="Vô cực..."
            value={adminConfig.meterLbl}
            onChange={(e) => setAdminConfig({ ...adminConfig, meterLbl: e.target.value })}
          />

          <label className="field-label">Tin nhắn bất ngờ</label>
          <textarea
            className="field-textarea"
            id="a-surprise"
            rows={3}
            value={adminConfig.surprise}
            onChange={(e) => setAdminConfig({ ...adminConfig, surprise: e.target.value })}
          />

          <label className="field-label">Mật khẩu 4 số</label>
          <input
            className="field-input"
            id="a-pass"
            maxLength={4}
            placeholder="0102"
            type="text"
            inputMode="numeric"
            value={adminConfig.password}
            onChange={(e) => setAdminConfig({ ...adminConfig, password: e.target.value.replace(/\D/g, '').slice(0, 4) })}
          />

          <hr className="admin-sep" />

          {/* Songs Management */}
          <label className="field-label">🎵 Nhạc Nền</label>
          <div className="text-xs text-[#a07080] mb-2">Nhạc được lưu ngoại tuyến, tự động phát khi mở trang.</div>
          <div id="song-list-admin" className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
            {songsList.map((song, i) => (
              <div key={i} className="song-row">
                <span>🎵 {song.name}</span>
                <button
                  type="button"
                  className="song-del"
                  onClick={() => handleDeleteSong(i)}
                >
                  🗑
                </button>
              </div>
            ))}
            {songsList.length === 0 && (
              <div className="text-xs text-center text-[#b0909a] py-2">Chưa có bài hát nào</div>
            )}
          </div>
          <label className="add-song-label select-none" htmlFor="song-file-input">
            🎵 Thêm bài hát (MP3/OGG)
          </label>
          <input
            type="file"
            id="song-file-input"
            accept="audio/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleSongUpload}
          />

          <button
            type="button"
            className="save-btn select-none"
            id="saveAdminBtn"
            onClick={handleAdminSave}
          >
            💾 Lưu & Áp Dụng
          </button>
        </div>
      </div>
    </div>
  );
}
