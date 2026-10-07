import {
  Vector3,
  buildAutoMovieMeshQueryHierarchy,
  collectAutoMovieSpatialQueryCandidates,
  segmentSegmentDistance,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanFaceLashCapsuleEntry } from "./structures/IHumanFaceLashCapsuleEntry";
import type { IHumanFaceLashRow } from "./structures/IHumanFaceLashRow";
import type { IHumanFaceLashSegment } from "./structures/IHumanFaceLashSegment";

/**
 * Admit the actual free shafts as shafts: each leaves its root, and no two
 * overlap. Penetration of skin and optics is measured and refused by
 * `readHumanFaceLashClearance`, which applies the conditions this owner used
 * to apply shaft by shaft and reports every row.
 *
 * Ring centres read Float32 geometry. Skin
 * insertion is confined to the source root's ball of the observed root
 * radius; the free tip must leave that ball. Only crossing points within
 * that local insertion are excluded, never a complete connecting band.
 * Ocular hulls have a complete exterior and admit no such insertion.
 * Existing source contact tolerance absorbs coordinate rounding; no budget
 * or clearance is increased and no shaft is shortened to make it fit.
 *
 * For inter-shaft separation, each connecting triangle is enclosed by the
 * capsule between its actual ring centres with maximum endpoint radius. A
 * finite resident AABB hierarchy restricts candidate pairs using the original
 * cell-cooccupation rule, then the shared bounded-segment distance verifies
 * separation under its numerical contract. Cells are compared, never stepped
 * through, so large absolute positions cannot stall a floating-point counter.
 * First shared XYZ cell and original segment ordinal retain the terminating
 * grid's pair order. Geometry and radii are never quantized to those cells.
 * Overlapping conservative capsules refuse, which is stricter than a surface
 * intersection census and is reported as such. Same-shaft pairs retain the
 * arc owner's curvature guard. Transparent surviving source cards supply no
 * biological shaft collider; their alpha-dependent appearance remains an
 * assembled observation limit.
 *
 * @evidence contracts/common.md#principled-implementation Float32 signed geometry and actual triangle crossings judge free tissue penetration, while convex capsule containment and bounded segment proximity certify pair separation.
 * @evidence contracts/common.md#clear-and-simple-design One contact owner uses existing geometry instruments and the shared finite resident candidate hierarchy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No profile, root, count, tolerance or last-valid input is changed to force a fit; a conservative proximity refusal names its actual shafts.
 * @evidence contracts/common.md#meaningful-documentation States root insertion, output precision, source tolerance, capsule conservatism and legacy card limits.
 * @evidence contracts/modeling.md#shared-boundaries Root insertion uses the same registered skin point; the remaining free shaft must stay outside the final skin and optical exterior.
 * @evidence contracts/modeling.md#spatial-conventions All geometry and tolerances are canonical head-frame metres.
 * @evidence contracts/anatomy.md#permitted-range The generated population is geometrically admitted only if free shafts leave their root insertion, avoid tissue penetration and have nonoverlapping capsule bounds. These bounds certify no clinical follicle implantation or population interval.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Geometric admission introduces no inferred tissue dimension.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Admits the emitted result without adding a shaping input.
 */
export function assertHumanFaceLashContact(
  rows: readonly IHumanFaceLashRow[],
): void {
  const point = (
    values: readonly number[],
    vertex: number,
  ): IAutoMovieVector3 =>
    Vector3.create(
      values[3 * vertex],
      values[3 * vertex + 1],
      values[3 * vertex + 2],
    );
  const segments: IHumanFaceLashSegment[] = [];
  let shaftId = 0;
  for (const row of rows) {
    if (row.mesh === null) continue;
    const mesh = {
      ...row.mesh,
      positions: row.mesh.positions.map(Math.fround),
    };
    for (let shaft = 0; shaft < row.centrelines.length; shaft++, shaftId++) {
      const centers = Array.from({ length: 13 }, (_, sample) => {
        const sum = Vector3.create();
        for (let radial = 0; radial < 8; radial++) {
          const p = point(mesh.positions, shaft * 117 + sample * 9 + radial);
          sum.x += p.x / 8;
          sum.y += p.y / 8;
          sum.z += p.z / 8;
        }
        return sum;
      });
      const radii = centers.map((center, sample) =>
        Math.max(
          ...Array.from({ length: 8 }, (_, radial) =>
            Vector3.length(
              Vector3.subtract(
                point(mesh.positions, shaft * 117 + sample * 9 + radial),
                center,
              ),
            ),
          ),
        ),
      );
      const root = centers[0];
      if (Vector3.length(Vector3.subtract(centers[12], root)) <= radii[0])
        throw new Error(
          `${row.side} ${row.row} shaft ${shaft} never leaves its geometric root insertion.`,
        );
      for (let sample = 0; sample < 12; sample++) {
        segments.push({
          from: centers[sample],
          to: centers[sample + 1],
          radius: Math.max(radii[sample], radii[sample + 1]),
          shaft: shaftId,
          population: row.side + " " + row.row,
        });
      }
    }
  }
  if (segments.length === 0) return;
  const cell = Math.max(
    ...segments.map(
      (segment) =>
        Vector3.length(Vector3.subtract(segment.to, segment.from)) +
        2 * segment.radius,
    ),
  );
  if (!(cell > 0) || !Number.isFinite(cell))
    throw new Error("Generated shaft proximity has no finite spatial cell.");
  const capsules: IHumanFaceLashCapsuleEntry[] = segments.map(
    (segment, ordinal) => {
      const axes = ["x", "y", "z"] as const;
      const low = axes.map(
        (axis) =>
          Math.min(segment.from[axis], segment.to[axis]) - segment.radius,
      );
      const high = axes.map(
        (axis) =>
          Math.max(segment.from[axis], segment.to[axis]) + segment.radius,
      );
      return {
        segment,
        ordinal,
        low,
        high,
        centre: low.map((value, axis) => value / 2 + high[axis] / 2),
      };
    },
  );
  const hierarchy = buildAutoMovieMeshQueryHierarchy([...capsules]);
  for (const capsule of capsules) {
    const segment = capsule.segment;
    for (const entry of collectAutoMovieSpatialQueryCandidates(
      hierarchy,
      capsule,
      cell,
      "shared-cell",
    )) {
      if (entry.ordinal >= capsule.ordinal) continue;
      const candidate = entry.segment;
      if (candidate.shaft === segment.shaft) continue;
      const distance = segmentSegmentDistance(
        segment.from,
        segment.to,
        candidate.from,
        candidate.to,
      );
      if (distance < segment.radius + candidate.radius)
        throw new Error(
          `${segment.population} shaft ${segment.shaft} overlaps the conservative capsule of ${candidate.population} shaft ${candidate.shaft}: ${distance * 1000} mm separation.`,
        );
    }
  }
}
