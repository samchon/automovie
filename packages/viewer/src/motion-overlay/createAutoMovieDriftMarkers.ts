import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

import { autoMovieAnalysisRampColor } from "../autoMovieAnalysisRampColor.js";

/**
 * Points coloured by how far each one drifted from where it should stay, such
 * as a planted foot's sole or a held grip: blue at zero, green at half the
 * limit and red at or beyond it, on the analysis overlay's ramp.
 *
 * The points ignore depth so a marker under a foot stays visible. The caller
 * owns the returned points' geometry and material.
 *
 * @param samples Marker positions in world metres with their drift in metres.
 * @param limit Drift drawn fully red, metres; positive.
 * @param size Point size in output pixels.
 * @returns Vertex-coloured points.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the colour scale, depth behaviour and ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Reuses `autoMovieAnalysisRampColor` over `drift / limit`, so one ramp reads every overlay.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One position and one colour buffer filled in one loop.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Non-finite samples or a non-positive limit throw.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the sample count.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call draws new markers.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns and disposes the geometry and material.
 */
export function createAutoMovieDriftMarkers(
  samples: readonly { at: IAutoMovieVector3; drift: number }[],
  limit: number,
  size: number = 6,
): THREE.Points {
  if (!(limit > 0)) throw new Error("A drift limit must be positive");
  const positions: Float32Array = new Float32Array(samples.length * 3);
  const colors: Float32Array = new Float32Array(samples.length * 3);
  samples.forEach(
    (s: { at: IAutoMovieVector3; drift: number }, i: number): void => {
      if (![s.at.x, s.at.y, s.at.z, s.drift].every(Number.isFinite))
        throw new Error(`Drift sample ${i} is not finite`);
      const c: { r: number; g: number; b: number } = autoMovieAnalysisRampColor(
        s.drift / limit,
      );
      positions.set([s.at.x, s.at.y, s.at.z], i * 3);
      colors.set([c.r, c.g, c.b], i * 3);
    },
  );
  const points: THREE.Points = new THREE.Points(
    new THREE.BufferGeometry()
      .setAttribute("position", new THREE.BufferAttribute(positions, 3))
      .setAttribute("color", new THREE.BufferAttribute(colors, 3)),
    new THREE.PointsMaterial({
      size,
      sizeAttenuation: false,
      vertexColors: true,
      depthTest: false,
    }),
  );
  points.renderOrder = 22;
  return points;
}
