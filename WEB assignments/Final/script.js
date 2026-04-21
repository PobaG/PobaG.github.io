(function () {
  const sliderA = document.getElementById("sliderA");
  const sliderB = document.getElementById("sliderB");
  const sliderC = document.getElementById("sliderC");
  const readout = document.getElementById("volumeReadout");

  const sliders = [sliderA, sliderB, sliderC];

  let audioCtx;
  let masterGain;
  let toneLow;
  let toneHigh;

  const clamp01 = (value) => Math.max(0, Math.min(1, value));

  function smoothstep(edge0, edge1, value) {
    const span = edge1 - edge0;
    if (span <= 0) {
      return value >= edge1 ? 1 : 0;
    }

    const t = clamp01((value - edge0) / span);
    return t * t * (3 - 2 * t);
  }

  function ensureAudio() {
    if (audioCtx) {
      return;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      return;
    }

    audioCtx = new AudioCtor();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0;

    toneLow = audioCtx.createOscillator();
    toneLow.type = "sine";
    toneLow.frequency.value = 132;

    toneHigh = audioCtx.createOscillator();
    toneHigh.type = "triangle";
    toneHigh.frequency.value = 264;
    toneHigh.detune.value = 6;

    const highMix = audioCtx.createGain();
    highMix.gain.value = 0.28;

    toneLow.connect(masterGain);
    toneHigh.connect(highMix);
    highMix.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    toneLow.start();
    toneHigh.start();
  }

  // The three-stage puzzle lives here, so you can swap equations quickly.
  function computeState(a, b, c) {
    const stageOne = Math.min(a, 0.1);

    const unlockTwo = smoothstep(0.1, 0.22, a);
    const curveTwo = Math.sin((Math.PI / 2) * Math.pow(b, 2));
    const stageTwo = 0.5 * unlockTwo * curveTwo;

    const unlockThree = smoothstep(0.12, 0.3, stageTwo);
    const curveThree = Math.sin((Math.PI / 4) * (Math.pow(c, 3) + c));
    const stageThree = 0.4 * unlockThree * curveThree;

    return {
      a,
      b,
      c,
      stageOne,
      stageTwo,
      stageThree,
      unlockTwo,
      unlockThree,
      curveTwo,
      curveThree,
      volume: clamp01(stageOne + stageTwo + stageThree),
    };
  }

  function paintSlider(slider, value, wake) {
    const fill = `${(value * 100).toFixed(3)}%`;
    const wakeMix = clamp01(wake);
    const fillOpacity = 0.12 + 0.58 * wakeMix;
    const trackOpacity = 0.07 + 0.12 * wakeMix;

    slider.style.setProperty("--fill-size", fill);
    slider.style.setProperty("--fill", `rgba(119, 214, 194, ${fillOpacity.toFixed(3)})`);
    slider.style.setProperty("--track", `rgba(232, 241, 237, ${trackOpacity.toFixed(3)})`);
    slider.classList.toggle("sleeping", wakeMix < 0.12);
  }

  function syncAudio(volume) {
    if (!audioCtx || !masterGain) {
      return;
    }

    const target = Math.pow(volume, 1.2) * 0.16;
    const now = audioCtx.currentTime;

    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(target, now, 0.05);
  }

  function render() {
    const state = computeState(
      parseFloat(sliderA.value),
      parseFloat(sliderB.value),
      parseFloat(sliderC.value)
    );

    readout.textContent = `Current volume: ${(state.volume * 100).toFixed(1)}%`;
    readout.style.color = `rgba(238, 246, 241, ${(0.74 + state.volume * 0.26).toFixed(3)})`;

    paintSlider(sliderA, state.a, 1);
    paintSlider(sliderB, state.b, state.unlockTwo);
    paintSlider(sliderC, state.c, state.unlockThree);
    syncAudio(state.volume);

    window.threeBodyPrototype = {
      computeState,
      state,
    };
  }

  function onInput() {
    ensureAudio();

    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    render();
  }

  sliders.forEach((slider) => {
    slider.addEventListener("input", onInput);
    slider.addEventListener("change", onInput);
  });

  render();
})();
