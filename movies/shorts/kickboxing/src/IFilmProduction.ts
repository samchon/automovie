import type * as THREE from "three";

import type { BoutPlaybackRuntime } from "./physics/BoutPlaybackRuntime";
import type { FilmRuntime } from "./runtime/FilmRuntime";
import type { MovieAudio } from "./sound/MovieAudio";

/**
 * A mounted film: its scene, delivered camera, exact-time performance and the
 * prepared soundtrack and receipts the Viewer publishes for export and review.
 *
 * @evidence contracts/common.md#implementation-and-ownership One seek places the motion and the delivered camera for a second, so playback, seeking and capture draw the same state; the soundtrack and runtime receipts come from the same preparation, so picture and sound share one event set.
 * @evidence contracts/common.md#authoring-interface Read scene and camera to draw, call seek for an exact second, read audio and runtime for playback, export receipts and inspection, and call dispose once when the page closes.
 */
export interface IFilmProduction {
  /** Scene the Viewer renders, owned by this mount. */
  scene: THREE.Scene;

  /** The delivered film camera; seek moves it to the planned view. */
  camera: THREE.PerspectiveCamera;

  /** Prepared soundtrack, played by the transport and mixed by the render. */
  audio: MovieAudio;

  /** Prepared performance whose receipts the Viewer publishes. */
  runtime: FilmRuntime | BoutPlaybackRuntime;
  /** Admitted closed interval of available absolute film seconds. A bounded review archive never supplies frames outside it. */
  available: readonly [number, number];

  /**
   * Places the performance and the delivered camera for an exact film second.
   *
   * @evidence contracts/common.md#implementation-and-ownership The film evaluates its runtime and adopts the planned camera, so every consumer draws the same frame.
   * @evidence contracts/common.md#authoring-interface Call with a finite second within the film; the next draw shows that second.
   */
  seek(seconds: number): void;

  /**
   * Planned camera target at a film second, for inspection controls.
   *
   * @evidence contracts/common.md#implementation-and-ownership The film reads its planned camera; nothing moves.
   * @evidence contracts/common.md#authoring-interface Returns a fresh vector in world metres.
   */
  cameraTarget(seconds: number): THREE.Vector3;

  /**
   * Releases the soundtrack, performance and scenery.
   *
   * @evidence contracts/common.md#implementation-and-ownership The film owns the soundtrack, runtime and ring and releases them together, reporting every failure.
   * @evidence contracts/common.md#authoring-interface Call once when the page closes; it throws an aggregate of release failures.
   */
  dispose(): void;
}
