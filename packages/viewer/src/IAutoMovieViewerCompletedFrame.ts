import type * as THREE from "three";

/**
 * The original scene/camera at an owning producer's completed draw boundary.
 * A controller, when supplied, owns typed state capture/restoration. Consumers
 * observe synchronously and must not treat requested state as rendered facts.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerCompletedFrame {
  /** Native camera used by the original draw; composite layer cameras belong in facts. */
  camera: THREE.Camera;

  /** Original drawn scene; composite facts retain each layer's observed objects. */
  scene: THREE.Scene;

  /** Pass actually drawn, including the original producer's handled composite. */
  pass: string;

  /**
   * Seconds of this completed producer state, when its owner exposes a clock.
   * Idle requests do not advance it; a guide redraw preserves the last time.
   * Absence means no clock was supplied, rather than an observed zero.
   */
  elapsedSeconds?: number;

  /** Additional actual frame facts supplied by a handled-composite owner. */
  facts?: object;

  /** Numerical editors require their application transaction before admission. */
  requiresApplication?: boolean;

  /**
   * True when the producer's native controls or model/display transitions
   * changed this view, including an explicit redraw. False marks an idle draw
   * whose exact facts still remain observable; absent preserves eager saving.
   * Application-document changes independently require updated display facts.
   */
  changed?: boolean;

  /** Actual application controller; its state is serialized only by its owner. */
  control?: {
    capture: () => unknown;
    restore: (state: unknown) => void;
    /** Synchronously redraw through the original producer or report failure. */
    redraw?: () => void;
    /** Freeze an owned playback clock while retaining its live rendered view. */
    freeze?: () => () => void;
  };
}
