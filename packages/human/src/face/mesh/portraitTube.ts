import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { Point } from "./Point";
import { p } from "./p";
import { portraitPatch as patch } from "./portraitPatch";

/**
 * An eight-sided swept strand in the same frame as its guiding curve.
 * The Z guide is suitable for anterior eyelash and eyebrow paths, whose
 * tangents are never parallel to Z. Zero, nonfinite and Z-parallel tangents
 * refuse before a collapsed ring can enter the model. Width is radius, in mm.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Forms swept lash and brow strands in the shared construction frame.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Uses an eight-sided ring around each finite non-Z-parallel curve tangent, retaining one centre, radius and frame per ring.
 */
export const portraitTube = (
  curve: (t: number) => Point,
  width: (t: number) => number,
  rows: number,
): IAutoMovieMesh => {
  // Each ring shares one centre and tangent frame. These curves are pure;
  // recomputing that frame for every side only repeats identical work.
  const frames = Array.from({ length: rows + 1 }, (_, row) => {
    const v = row / rows;
    const at = curve(v);
    const tangent = Vector3.normalize(
      Vector3.subtract(
        curve(Math.min(1, v + 0.0001)),
        curve(Math.max(0, v - 0.0001)),
      ),
    );
    if (
      ![tangent.x, tangent.y, tangent.z].every(Number.isFinite) ||
      (tangent.x === 0 && tangent.y === 0)
    )
      throw new Error(
        "Portrait strand tangents must be finite, nonzero and transverse to Z.",
      );
    const right = Vector3.normalize(Vector3.cross(p(0, 0, 1), tangent)),
      up = Vector3.cross(tangent, right),
      radius = width(v);
    return { at, right, up, radius };
  });
  return patch(
    (u, v) => {
      const { at, right, up, radius } = frames[Math.round(v * rows)];
      return p(
        at.x +
          radius * (right.x * Math.cos(tau * u) + up.x * Math.sin(tau * u)),
        at.y +
          radius * (right.y * Math.cos(tau * u) + up.y * Math.sin(tau * u)),
        at.z +
          radius * (right.z * Math.cos(tau * u) + up.z * Math.sin(tau * u)),
      );
    },
    8,
    rows,
  );
};

/** One turn, for the eight-sided ring swept along a guide. */
const tau = Math.PI * 2;
