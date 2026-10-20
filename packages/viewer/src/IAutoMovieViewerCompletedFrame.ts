import type * as THREE from "three";

/**
 * The original scene/camera at an owning producer's completed draw boundary.
 * A controller, when supplied, owns typed state capture/restoration. Consumers
 * observe synchronously and must not treat requested state as rendered facts.
 *
 * @evidence contracts/common.md#principled-implementation Carries original draw-completion scene/camera/pass and optional observed clock, with an application-owned state controller for capture, restoration, explicit redraw and clock freezing; composite layer facts remain separate from original native objects.
 * @evidence contracts/common.md#clear-and-simple-design The producer publishes one completion record while numerical application admission and transport consumers retain their own responsibilities; optional fields distinguish unavailable observations from false or zero values.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested state never substitutes for completed rendering; changed=false preserves idle facts, absent changed preserves eager saving and application-document changes still require fresh display facts.
 * @evidence contracts/common.md#meaningful-documentation Defines native versus composite objects, optional time semantics, numerical application prerequisite, idle/change classification and controller ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This completion record performs no draw, readback or application transaction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Producer change classification supplies facts for downstream saving decisions but is not itself proof that two draws are equivalent.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scene, camera and controller are borrowed from the draw owner; the record acquires no framebuffer or playback task.
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
    /** Capture application-owned state corresponding to the live completed view. */
    capture: () => unknown;

    /** Restore only states admitted by this application's controller. */
    restore: (state: unknown) => void;

    /** Synchronously redraw through the original producer or report failure. */
    redraw?: () => void;

    /** Freeze an owned playback clock while retaining its live rendered view. */
    freeze?: () => () => void;
  };
}
