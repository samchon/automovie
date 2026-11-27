import type * as THREE from "three";

/** Borrowed source and scratch state for matched comparison framing. */
export interface IAutoMovieUpdateComparisonCameraProps {
  /** Standalone perspective camera whose field and direction are matched. */
  perspective: THREE.PerspectiveCamera;
  /** Output orthographic camera; mutated to match the perspective chart. */
  comparison: THREE.OrthographicCamera;
  /** The source camera's target in world coordinates. */
  target: THREE.Vector3;
  /** Positive separation from centre to each comparison view, in metres. */
  halfSeparation: number;
  /** Mutable screen-right offset scratch vector. */
  offset: THREE.Vector3;
}
