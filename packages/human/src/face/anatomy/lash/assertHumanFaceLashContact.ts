import { Vector3, buildAutoMovieMeshQueryHierarchy, collectAutoMovieSpatialQueryCandidates, segmentSegmentDistance, type IAutoMovieMeshQueryHierarchy as ImportedIAutoMovieMeshQueryHierarchy } from "@automovie/engine";
import type { IAutoMovieVector3, IAutoMovieMeshPhysicalVertices as ImportedIAutoMovieMeshPhysicalVertices, IAutoMovieMeshSkin as ImportedIAutoMovieMeshSkin } from "@automovie/interface";

import type { IHumanFaceLashCapsuleEntry } from "./structures/IHumanFaceLashCapsuleEntry";
import type { IHumanFaceLashRow } from "./structures/IHumanFaceLashRow";
import type { IHumanFaceLashSegment } from "./structures/IHumanFaceLashSegment";

/**
 * Admit the actual free shafts as shafts: each leaves its root, and no two overlap. Penetration of skin and optics is measured and refused by `readHumanFaceLashClearance`, which applies the conditions this owner used to apply shaft by shaft and reports every row.
 *
 * Ring centres read Float32 geometry. Skin insertion is confined to the source root's ball of the observed root radius; the free tip must leave that ball. Only crossing points within that local insertion are excluded, never a complete connecting band. Ocular hulls have a complete exterior and admit no such insertion. Existing source contact tolerance absorbs coordinate rounding; no budget or clearance is increased and no shaft is shortened to make it fit.
 *
 * For inter-shaft separation, each connecting triangle is enclosed by the capsule between its actual ring centres with maximum endpoint radius. A finite resident AABB hierarchy restricts candidate pairs using the original cell-cooccupation rule, then the shared bounded-segment distance verifies separation under its numerical contract. Cells are compared, never stepped through, so large absolute positions cannot stall a floating-point counter. First shared XYZ cell and original segment ordinal retain the terminating grid's pair order. Geometry and radii are never quantized to those cells. Overlapping conservative capsules refuse, which is stricter than a surface intersection census and is reported as such. Same-shaft pairs retain the arc owner's curvature guard. Transparent surviving source cards supply no biological shaft collider; their alpha-dependent appearance remains an assembled observation limit.
 *
 * @evidence contracts/common.md#principled-implementation Float32 ring centres and maximum endpoint radii conservatively enclose emitted shaft bands as capsules.
 * @evidence contracts/common.md#clear-and-simple-design This owner checks tip emergence and inter-shaft structure while the clearance reader separately judges optics and skin.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Conservative capsule overlap can reject surfaces that do not actually intersect; same-shaft pairs rely on the arc curvature guard and source cards provide no biological collider.
 * @evidence contracts/common.md#meaningful-documentation Head-metre geometry is never quantized to cells; stable original segment order controls the first refusal.
 * @evidence contracts/performance.md#efficient-algorithms Ring extraction is linear in shafts. For N fixed-band segments the hierarchy reduces typical candidates, but each segment can collect and sort N entries, giving O(N squared log N) worst-case traversal/sorting work plus quadratic narrow-phase comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work One capsule hierarchy serves all segments and the engine's shared bounded-segment distance supplies narrow-phase arithmetic.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Capsules, hierarchy and candidates are call-local and scale with emitted shafts; no collider or history survives successful admission.
 */
export function assertHumanFaceLashContact(
  rows: readonly IHumanFaceLashRow[],
): void {
  const point: (values: readonly number[], vertex: number) => IAutoMovieVector3 = (
    values: readonly number[],
    vertex: number,
  ): IAutoMovieVector3 =>
    Vector3.create(
      values[3 * vertex],
      values[3 * vertex + 1],
      values[3 * vertex + 2],
    );
  const segments: IHumanFaceLashSegment[] = [];
  let shaftId: number = 0;
  for (const row of rows) {
    if (row.mesh === null) continue;
    const mesh: { positions: number[]; physicalVertices?: ImportedIAutoMovieMeshPhysicalVertices; normals: number[] | null; uvs: number[] | null; colors?: number[]; reliefWeights?: number[]; indices: number[] | null; skin: ImportedIAutoMovieMeshSkin | null; } = {
      ...row.mesh,
      positions: row.mesh.positions.map(Math.fround),
    };
    for (let shaft: number = 0; shaft < row.centrelines.length; shaft++, shaftId++) {
      const centers: IAutoMovieVector3[] = Array.from({ length: 13 }, (_: unknown, sample: number): IAutoMovieVector3 => {
        const sum: IAutoMovieVector3 = Vector3.create();
        for (let radial: number = 0; radial < 8; radial++) {
          const p: IAutoMovieVector3 = point(mesh.positions, shaft * 117 + sample * 9 + radial);
          sum.x += p.x / 8;
          sum.y += p.y / 8;
          sum.z += p.z / 8;
        }
        return sum;
      });
      const radii: number[] = centers.map((center: IAutoMovieVector3, sample: number): number =>
        Math.max(
          ...Array.from({ length: 8 }, (_: unknown, radial: number): number =>
            Vector3.length(
              Vector3.subtract(
                point(mesh.positions, shaft * 117 + sample * 9 + radial),
                center,
              ),
            ),
          ),
        ),
      );
      const root: IAutoMovieVector3 = centers[0];
      if (Vector3.length(Vector3.subtract(centers[12], root)) <= radii[0])
        throw new Error(
          `${row.side} ${row.row} shaft ${shaft} never leaves its geometric root insertion.`,
        );
      for (let sample: number = 0; sample < 12; sample++) {
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
  const cell: number = Math.max(
    ...segments.map(
      (segment: IHumanFaceLashSegment): number =>
        Vector3.length(Vector3.subtract(segment.to, segment.from)) +
        2 * segment.radius,
    ),
  );
  if (!(cell > 0) || !Number.isFinite(cell))
    throw new Error("Generated shaft proximity has no finite spatial cell.");
  const capsules: IHumanFaceLashCapsuleEntry[] = segments.map(
    (segment: IHumanFaceLashSegment, ordinal: number): { segment: IHumanFaceLashSegment; ordinal: number; low: number[]; high: number[]; centre: number[]; } => {
      const axes: readonly ["x", "y", "z"] = ["x", "y", "z"] as const;
      const low: number[] = axes.map(
        (axis: "x" | "y" | "z"): number =>
          Math.min(segment.from[axis], segment.to[axis]) - segment.radius,
      );
      const high: number[] = axes.map(
        (axis: "x" | "y" | "z"): number =>
          Math.max(segment.from[axis], segment.to[axis]) + segment.radius,
      );
      return {
        segment,
        ordinal,
        low,
        high,
        centre: low.map((value: number, axis: number): number => value / 2 + high[axis] / 2),
      };
    },
  );
  const hierarchy: ImportedIAutoMovieMeshQueryHierarchy.ILeaf<IHumanFaceLashCapsuleEntry> | ImportedIAutoMovieMeshQueryHierarchy.IBranch<IHumanFaceLashCapsuleEntry> = buildAutoMovieMeshQueryHierarchy([...capsules]);
  for (const capsule of capsules) {
    const segment: IHumanFaceLashSegment = capsule.segment;
    for (const entry of collectAutoMovieSpatialQueryCandidates(
      hierarchy,
      capsule,
      cell,
      "shared-cell",
    )) {
      if (entry.ordinal >= capsule.ordinal) continue;
      const candidate: IHumanFaceLashSegment = entry.segment;
      if (candidate.shaft === segment.shaft) continue;
      const distance: number = segmentSegmentDistance(
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
