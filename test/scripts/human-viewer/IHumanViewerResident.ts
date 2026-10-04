import type * as THREE from "three";

/**
 * One document kept drawn-ready in the page: its stage, its group and what it
 * costs. The page bounds the sum of `bytes` instead of the number of residents.
 *
 * @evidence contracts/common.md#principled-implementation Carries the measured size the resident cache is bounded by.
 * @evidence contracts/common.md#meaningful-documentation Names what a resident owns and releases.
 * @author Samchon
 */
export interface IHumanViewerResident<Stage> {
  /** The product viewport that draws the document. */
  stage: Stage;

  /** The displayed group. */
  group: THREE.Group;

  /** Resizes the stage to the frame. */
  resize: () => void;

  /** Releases the stage's worker, controls and GPU resources. */
  release: () => void;

  /** Bytes of arrays the resident keeps alive, counted when it was built. */
  bytes: number;
}
