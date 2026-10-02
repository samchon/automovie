import { Vector3 } from "@automovie/engine";

import { evaluateHumanBodyShape } from "../basis/evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "../basis/humanBodyBasisWeights";
import { humanBodyClipRing } from "../simple/humanBodyClipRing";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { indexHumanBodySectionTriangles } from "./indexHumanBodySectionTriangles";
import { measureHumanBodySection } from "./measureHumanBodySection";

/**
 * Read one rule from an already shaped body, in metres, or null when the
 * surface cannot answer it.
 *
 * `createHumanBodyMeasurementReader` evaluates the shape through the same
 * weights and evaluator the builder uses, without a pose. This owner reads
 * its result repeatedly without re-evaluating that unchanged skin. A `height` reads from the lowest
 * surface point to the highest clip-ring mean across surfaces; a `distance` is the straight
 * landmark-to-landmark length; a `girth` or `breadth` walks the rule's
 * stations, cuts every surface at each and selects the closed loop nearest
 * the station seed before keeping the largest or smallest value, or the one
 * whose loop reaches furthest back, a girth read as a tape reads it (the
 * section's convex hull perimeter, `measureHumanBodySection`). A girth at a
 * skin landmark has one station, where the plane through that shaped vertex
 * meets the segment. A landmark the basis lacks, a skin landmark outside its
 * surface, a plane parallel to the segment, or a station set on which no
 * closed loop exists, answers null. This is the instrument the channel measurement report and the simple
 * tier's inversions share.
 *
 */
function readHumanBodyShapedMeasurement(
  basis: IAutoMovieHumanBodyBasis,
  shaped: ReturnType<typeof evaluateHumanBodyShape>,
  rule: IAutoMovieHumanBodyMeasurement,
): number | null {
  if (rule.kind === "height") {
    let lowest = Infinity;
    let top = -Infinity;
    shaped.surfaces.forEach((positions, index) => {
      const ring = humanBodyClipRing(basis.surfaces[index], positions);
      for (let v = 1; v < positions.length; v += 3)
        lowest = Math.min(lowest, positions[v]);
      top = Math.max(
        top,
        ring.reduce((sum, v) => sum + positions[v * 3 + 1], 0) / ring.length,
      );
    });
    return top - lowest;
  }
  const from = shaped.landmarks[rule.from];
  const to = shaped.landmarks[rule.to];
  if (from === undefined || to === undefined) return null;
  if (rule.kind === "distance")
    return Vector3.length(Vector3.subtract(to, from));
  const axis = Vector3.subtract(to, from);
  const normal = rule.horizontal
    ? Vector3.create(0, 1, 0)
    : Vector3.normalize(axis);
  let fractions: number[];
  if ("level" in rule) {
    const positions = shaped.surfaces[rule.level.surface];
    if (
      positions === undefined ||
      !Number.isInteger(rule.level.vertex) ||
      rule.level.vertex < 0 ||
      rule.level.vertex * 3 + 2 >= positions.length
    )
      return null;
    const vertex = Vector3.create(
      positions[rule.level.vertex * 3],
      positions[rule.level.vertex * 3 + 1],
      positions[rule.level.vertex * 3 + 2],
    );
    // the one plane through the vertex meets the segment at this fraction
    const across = Vector3.dot(axis, normal);
    if (Math.abs(across) < 1e-9) return null;
    fractions = [Vector3.dot(Vector3.subtract(vertex, from), normal) / across];
  } else
    fractions = Array.from(
      { length: rule.steps },
      (_, step) =>
        rule.range[0] +
        (rule.steps === 1
          ? 0
          : (step * (rule.range[1] - rule.range[0])) / (rule.steps - 1)),
    );
  const pick = "level" in rule ? "max" : rule.pick;
  const points = fractions.map((fraction) =>
    Vector3.add(from, Vector3.scale(axis, fraction)),
  );
  // a stack of stations shares one normal, so each surface is indexed once
  // for all of them; a lone station is cheaper walked whole
  const levels = points.map((point) => Vector3.dot(point, normal));
  const near =
    points.length > 1
      ? shaped.surfaces.map((positions, index) =>
          indexHumanBodySectionTriangles(
            positions,
            basis.surfaces[index].indices,
            normal,
            levels,
          ),
        )
      : undefined;
  let chosen: number | null = null;
  let rearmost = Infinity;
  for (const [station, point] of points.entries()) {
    const section = shaped.surfaces
      .map((positions, index) =>
        measureHumanBodySection(
          positions,
          basis.surfaces[index].indices,
          { point, normal },
          point,
          near?.[index][station],
        ),
      )
      .filter((value) => value !== null)
      .sort(
        (a, b) =>
          Vector3.length(Vector3.subtract(a.centroid, point)) -
          Vector3.length(Vector3.subtract(b.centroid, point)),
      )[0];
    if (section === undefined) continue;
    const value = rule.kind === "breadth" ? section.breadth : section.girth;
    if (pick === "rearmost") {
      if (section.back < rearmost) {
        rearmost = section.back;
        chosen = value;
      }
      continue;
    }
    if (chosen === null || (pick === "max" ? value > chosen : value < chosen))
      chosen = value;
  }
  return chosen;
}

/**
 * Compile one rest body for several measurement rules. Its shaped skin and
 * landmarks are owned by this reader; callers treat them as read-only. Every
 * reading observes that same numerical body. A different trial shape needs a
 * new reader, so mass, stature and tape reports cannot silently mix candidate
 * geometries.
 *
 * A rule with several stations shares one normal, so each surface is indexed
 * once for all its stations (`indexHumanBodySectionTriangles`) and every cut
 * reads only the triangles near its plane; the readings equal those of a
 * full walk of each station.
 *
 * @evidence contracts/common.md#principled-implementation The reader shapes the body once through the builder's own weights and evaluator, so every rule reads the same numerical skin; a height, a landmark distance and a station stack follow their stated definitions, and the station index only narrows the triangles each exact cut reads.
 * @evidence contracts/common.md#clear-and-simple-design One responsibility: one shaped rest body and the rules read from it. The cut, the index and the rule table are separate owners it calls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No channel, landmark or target value is special-cased; a rule is data from the table and an unanswerable rule answers null instead of a guess.
 * @evidence contracts/common.md#meaningful-documentation The comments state what the reader owns, its read-only contract, the rule kinds and the null answers, and why a stack is indexed.
 * @evidence contracts/modeling.md#spatial-conventions Every length is metres in the rest body's frame with +Z forward; a rule's segment and planes are built from landmarks in that frame and no other conversion occurs.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function reads one whole rest body and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes a shape but defines no channel; the rule table names what each channel measures.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry, only lengths.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint a viewer displays; the simple tier that consumes it answers that chapter.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value; the rule table names the landmarks and the public definitions.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no quantity; the caller's inversion refuses what the body cannot reach.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function reads a body and is not an input through which a caller shapes one.
 */
export function createHumanBodyMeasurementReader(
  basis: IAutoMovieHumanBodyBasis,
  shape: Record<string, number>,
): {
  shaped: ReturnType<typeof evaluateHumanBodyShape>;
  read: (rule: IAutoMovieHumanBodyMeasurement) => number | null;
} {
  const shaped = evaluateHumanBodyShape(
    basis,
    humanBodyBasisWeights(basis, { shape }),
  );
  return {
    shaped,
    read: (rule) => readHumanBodyShapedMeasurement(basis, shaped, rule),
  };
}
