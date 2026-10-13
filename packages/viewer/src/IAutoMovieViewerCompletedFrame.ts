import type * as THREE from "three";

/**
 * The original scene/camera at an owning producer's completed draw boundary.
 * A controller, when supplied, owns typed state capture/restoration. Consumers
 * observe synchronously and must not treat requested state as rendered facts.
 *
 * @evidence contracts/common.md#principled-implementation The producer supplies its actual scene and camera after drawing rather than an inferred request.
 * @evidence contracts/common.md#clear-and-simple-design One completion shape supports ordinary viewports and handled composites.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No copied renderer, subject lookup or fabricated ready/model state is introduced.
 * @evidence contracts/common.md#meaningful-documentation Defines observation timing and controller ownership.
 * @evidence requirements/review/subject-inspection.md#review-subject-evidence Exposes original completed view and runtime objects to the application observation owner.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-observation Separates source-produced observation from requested state and review verdicts.
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
