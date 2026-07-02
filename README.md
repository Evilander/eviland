# Eviland

**A music visualizer that listens — and remembers.**

Eviland is the visual engine behind [NewAmp](https://github.com/Evilander/newamp).
It's what I wanted MilkDrop to be after twenty years of loving MilkDrop:
zero-dependency, framework-agnostic WebGL2, embeddable like
[butterchurn](https://github.com/jberg/butterchurn) — except it knows which
instrument just hit, it conducts itself to the structure of the song, it paints
with the colors of the album you're playing, and it remembers what your
favorite songs look like across restarts.

## Why another visualizer engine

Classic visualizers react to an energy average — bass, mid, treble, done. They
look *busy* when music is busy. Eviland is built on a different premise: music
is made of instruments and structure, and the visuals should be too.

- **It hears instruments, not bands.** A 24-band mel spectral-flux onset
  detector classifies each transient — kick, snare, hat, vocal, bass — and
  every group drives its own visual events. A kick *does* something a hi-hat
  doesn't.
- **Looks are data, not preset files.** A look is an `OperatorConfig`: base
  values plus audio-feature bindings for every visual channel (warp, zoom,
  swirl, kaleidoscope, decay, fluid, bloom…). The randomizer mints endless
  musically-coherent looks, each reproducible from a short shareable seed like
  `K7Q2-9XMF`.
- **A Director conducts the song.** It reads sections, energy, and novelty,
  crossfades looks on the beat, builds into drops, settles into breakdowns —
  and when a chorus comes back, it *recalls the look that chorus had before*,
  so the visuals rhyme with the song.
- **It sees the record sleeve.** `art-palette` extracts the dominant colors of
  the current album art and blends them into the palette that drives every
  layer. A red album burns red. A teal album glows teal. Grayscale sleeves
  gracefully keep your theme.
- **It remembers your library.** Visual memory stores a tiny per-track plan —
  section fingerprints, the look each section earned, and a seed lineage that
  evolves at 8/32/96/256 plays. Come back to a song next week and its choruses
  bloom the same way they did last time, one generation older. Identity is
  seed lineage, never stored frames: one small row per track.
- **Two scenes at once, mixed by the drums.** On top of the feedback-field
  renderer, the scene overlay runs 25 self-contained shader scenes — lightning
  veins, liquid metal, kaleido bloom, comet trails, eye of the storm — with a
  second *accent* scene composited over the base whose opacity is played live
  by kick/snare/vocal envelopes. It materializes on the hits and evaporates in
  the quiet. A single MilkDrop preset structurally can't do that.

The renderer itself is MilkDrop-class where it counts: an RGBA16F ping-pong
feedback field with per-pixel radial warp profiles, per-channel RGB decay,
moving warp centre, video echo, a Navier–Stokes fluid layer with visible dye,
tear-free field-snapshot crossfades, dual-Kawase bloom, and ACES tone-mapping.

## Quick start (20 lines)

```ts
import { createEvilandRenderer, createEvilandReactor } from '@eviland/core';

const canvas = document.querySelector('canvas')!;
const renderer = createEvilandRenderer(canvas, { quality: 'high' });
if (!renderer) throw new Error('WebGL2 + EXT_color_buffer_float required');
renderer.resize(canvas.clientWidth, canvas.clientHeight, devicePixelRatio);

const ctx = new AudioContext();
const analyser = ctx.createAnalyser();            // wire your <audio> source → analyser
const onset = ctx.createAnalyser(); onset.smoothingTimeConstant = 0;
const reactor = createEvilandReactor({ sampleRate: ctx.sampleRate, fftSize: analyser.fftSize, binCount: analyser.frequencyBinCount });

const freq = new Uint8Array(analyser.frequencyBinCount);
const on = new Uint8Array(onset.frequencyBinCount);
const wave = new Uint8Array(256);
const palette = { bg: [0.02,0.02,0.06], dark: [1,0.15,0.4], accent: [0.1,0.8,1], light: [1,0.95,0.6] };

let prev = performance.now();
(function loop(t) {
  const dt = t - prev; prev = t;
  analyser.getByteFrequencyData(freq);
  onset.getByteFrequencyData(on);
  analyser.getByteTimeDomainData(wave);
  const frame = reactor.analyze(freq, on, freq, freq, dt, t);  // L/R = freq for mono
  renderer.setWaveform(wave);
  renderer.render(frame, palette, dt);
  requestAnimationFrame(loop);
})(prev);
```

## Let it conduct itself

```ts
import { generate, createDirector } from '@eviland/core';

// A specific look from a shareable seed:
const { config } = generate('K7Q2-9XMF');
renderer.setConfig(config);

// …or hand the whole song to the Director:
const director = createDirector({ songId: 'my-track' });
// inside the loop, before render():
renderer.setConfig(director.update(frame, dt));
```

## Stack the scene overlay on top

The scene overlay is its own transparent canvas — put it above your renderer
(or above butterchurn, which is exactly what NewAmp does) and feed it the same
frames:

```ts
import { createSceneOverlay, createReactorOverlay } from '@eviland/core';

const scenes = createSceneOverlay(sceneCanvas, { quality: 'high', seedKey: 'track-42' });
const events = createReactorOverlay(eventCanvas); // 2D, per-instrument bursts

// inside the loop:
scenes?.render(frame, palette, dt);
events?.render(frame, palette, dt);
```

Scenes rotate on section boundaries with a seeded walk — change `seedKey` per
track (or per track × memory generation) and every listener gets a different
sequence. A scene that fails to compile is blacklisted for the session and the
rotation moves on; the show never stops for a shader error.

## Paint with the album art

```ts
import { extractArtPalette, blendPaletteWithArt } from '@eviland/core';

const art = await extractArtPalette(coverUrl);      // null for grayscale/missing art
const tinted = blendPaletteWithArt(palette, art);   // background stays yours
renderer.render(frame, tinted, dt);                 // scenes + events too
```

## Record a clip

```ts
import { createCanvasRecorder } from '@eviland/core';
const rec = createCanvasRecorder(canvas, { fps: 60, videoBitsPerSecond: 12_000_000 });
rec.start(audioStream);              // pass a MediaStream to mux audio
// …later…
const webm = await rec.stop();       // → Blob
```

## API surface

| Export | What |
|---|---|
| `createEvilandRenderer(canvas, opts)` | WebGL2 renderer → `{ resize, render, setConfig, getConfig, setWaveform, dispose }` (or `null` when WebGL2 float is unavailable — fall back gracefully). |
| `createEvilandReactor(cfg)` | 24-band causal onset reactor → `EvilandFrame` per `analyze()`. |
| `createSceneOverlay(canvas, opts)` | 25 shader scenes + drum-driven accent layer on a transparent canvas. |
| `createReactorOverlay(canvas)` | Causal per-instrument 2D event layer. |
| `extractArtPalette / blendPaletteWithArt` | Album-art dominant colors → palette tinting. |
| `generate / mutate / encode / decode / ARCHETYPES` | Seedable generative looks. |
| `createDirector(opts)` | Autonomous conductor → `OperatorConfig` per `update()`. |
| `evalConfig / defaultConfig / lerpConfig / cloneConfig` | Operator-config evaluation + interpolation. |
| `createEmptyPlan / validatePlan / prunePlan` + types | Visual-memory plans (persist them however you like — NewAmp uses one SQLite row per track). |
| `Rng / encodeSeedCode / decodeSeedCode` | Deterministic RNG + shareable seed codes. |
| `createCanvasRecorder(canvas, opts)` | Canvas + audio → WebM (VP9/Opus). |

## Status

This repo tracks the engine as it ships inside NewAmp — the code here is the
exact source running in production there, synced from NewAmp's tree (which is
where day-to-day development happens; issues and PRs are welcome here and I'll
carry fixes across). `npm run build` produces `dist/` with types; an npm
publish of `@eviland/core` is planned once the API has soaked a little longer.

## Requirements

WebGL2 with `EXT_color_buffer_float`. `createEvilandRenderer` and
`createSceneOverlay` both return `null` when the context can't be created, so
you can fall back gracefully.

## License

MIT © evilander
