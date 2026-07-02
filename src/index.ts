// eviland — the public API surface.
//
// Eviland is an instrument-aware, self-directing generative music visual engine.
// It is framework-agnostic and dependency-free: give it an HTMLCanvasElement and
// per-frame audio data (frequency + time-domain Uint8Arrays, e.g. from a Web
// Audio AnalyserNode), and it renders. The same engine powers NewAmp.
//
// Pipeline:
//   audio bytes ──► reactor.analyze() ──► EvilandFrame
//   EvilandFrame ──► (optional) director.update() / randomizer.generate()
//                 ──► renderer.setConfig() + renderer.setWaveform()
//   renderer.render(frame, palette, dtMs) ──► canvas
//
// Composition extras (each optional, each its own transparent canvas layer):
//   scene-overlay   25 shader scenes + a drum-driven accent scene
//   reactor-overlay causal per-instrument 2D event layer
//   art-palette     album-art dominant colors → EvilandPalette tinting
//
// See README.md for a 20-line embedding example.

// ── Renderer (WebGL2) ──────────────────────────────────────────────────────
export {
  createEvilandRenderer,
  type EvilandRenderer,
  type EvilandPalette,
  type EvilandOptions,
} from './eviland';

// ── Reactor (24-band causal onset detection) ───────────────────────────────
export {
  createEvilandReactor,
  EVILAND_BANDS,
  type EvilandReactor,
  type EvilandReactorConfig,
  type EvilandFrame,
  type EvilandOnset,
  type VoiceGroup,
} from './eviland-audio';

// ── Operator engine (data-driven, serializable looks) ──────────────────────
export {
  evalConfig,
  createDynamics,
  defaultConfig,
  cloneConfig,
  lerpConfig,
  type OperatorConfig,
  type EvilandDynamics,
  type Channel,
  type Binding,
  type AudioFeature,
  type Curve,
  type WaveformConfig,
  type WaveMode,
  type PaletteConfig,
  type RGB,
  type FrameLike,
  type QSlot,
  type QLfo,
  type LfoShape,
} from './eviland-operators';

// ── Deterministic RNG + shareable seed codes ───────────────────────────────
export {
  Rng,
  mulberry32,
  hashSeed,
  toSeedState,
  encodeSeedCode,
  decodeSeedCode,
} from './eviland-rng';

// ── Randomizer (generative looks from a seed) ──────────────────────────────
export {
  generate,
  mutate,
  encode,
  decode,
  ARCHETYPES,
  type Archetype,
  type GenerateResult,
} from './eviland-randomizer';

// ── Director (autonomous conductor) ────────────────────────────────────────
export {
  createDirector,
  type Director,
  type DirectorOptions,
  type EnergyTier,
} from './eviland-director';

// ── Recorder (canvas + audio → WebM) ───────────────────────────────────────
export {
  createCanvasRecorder,
  CanvasRecorderError,
  type CanvasRecorder,
  type CanvasRecorderOptions,
  type CanvasRecorderErrorCode,
} from './eviland-recorder';

// ── Scene overlay (25 shader scenes + drum-driven accent layer) ─────────────
export {
  createSceneOverlay,
  type SceneOverlay,
  type SceneOverlayOptions,
} from './scene-overlay';
export { SCENES, type SceneDef } from './scenes/index';

// ── Reactor overlay (causal per-instrument 2D event layer) ─────────────────
export { createReactorOverlay, type ReactorOverlay } from './reactor-overlay';

// ── Album-art palettes (the visuals see the record sleeve) ─────────────────
export {
  extractArtPalette,
  blendPaletteWithArt,
  type ArtPalette,
} from './art-palette';

// ── Visual memory (persistent per-track lineage plans) ─────────────────────
export {
  VISUAL_MEMORY_SCHEMA_VERSION,
  VISUAL_MEMORY_ALGO_VERSION,
  LINEAGE_PLAY_LADDER,
  createEmptyPlan,
  validatePlan,
  prunePlan,
  nextGenerationAt,
  type VisualMemoryPlan,
  type VisualMemoryLineage,
  type VisualMemorySection,
  type VisualMemoryCounters,
  type VisualMemoryEvolutionEntry,
  type VisualMemoryNeighborSeed,
} from './eviland-memory-types';
