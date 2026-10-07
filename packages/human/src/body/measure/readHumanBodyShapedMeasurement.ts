import { Vector3 } from "@automovie/engine";

import { findHumanSkinLandmark } from "../../common/basis/findHumanSkinLandmark";
import { measureHumanSection } from "../../common/measure/measureHumanSection";
import { evaluateHumanBodyShape } from "../basis/evaluateHumanBodyShape";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import type { IAutoMovieHumanBodyMeasurementSection } from "../structures/IAutoMovieHumanBodyMeasurementSection";
import { indexHumanBodySectionTriangles } from "./indexHumanBodySectionTriangles";
import { readHumanBodySkinExtent } from "./readHumanBodySkinExtent";
import { readHumanBodySkinPoint } from "./readHumanBodySkinPoint";
import { readHumanBodySkinReach } from "./readHumanBodySkinReach";

/**
 * Read one rule from an already shaped body, in metres, or null when the
 * surface cannot answer it.
 *
 * `createHumanBodyMeasurementReader` evaluates the shape through the same
 * weights and evaluator the builder uses, without a pose. This owner reads
 * its result repeatedly without re-evaluating that unchanged skin. A `distance` is the straight
 * landmark-to-landmark length; an `extent` is the caliper reading between a
 * dominant-bone skin region's extreme points (`readHumanBodySkinExtent`); a `girth` or `breadth` walks the rule's
 * stations, cuts every surface at each and selects the closed loop nearest
 * the station seed before keeping the largest or smallest value, or the one
 * whose loop reaches furthest back, a girth read as a tape reads it (the
 * section's convex hull perimeter, `measureHumanSection`). A girth at a
 * skin landmark has one station, where the plane through that shaped vertex
 * meets the segment. A landmark the basis lacks, a named skin point the
 * basis does not declare (`skinLandmarks`), a plane parallel to the segment, or a station set on which no
 * closed loop exists, answers null. This is the instrument the channel measurement report and the simple
 * tier's inversions share.
 * An optional observer receives owned copies of each answered station's
 * plane and seed, so an artifact consumer can read that same cut without
 * repeating the instrument's witness calculation. The numeric return and
 * omitted-observer path retain the original measurement behavior. Mutating
 * those copies cannot change the measured skin or a later station.
 * @evidence contracts/common.md#principled-implementation One instrument reads source-rest and actual final Float32 surfaces without reimplementing planes, witnesses or tape sections.
 * @evidence contracts/common.md#clear-and-simple-design Reading an already evaluated skin is independent of constructing it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing witnesses and open sections answer null rather than an inferred anatomical value.
 * @evidence contracts/common.md#meaningful-documentation States each rule and its unavailable cases.
 * @evidence contracts/modeling.md#spatial-conventions Reads metre positions and source-frame plane directions without a unit or pose conversion.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It reads surfaces and creates no anatomical or source part identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels The source rule and evaluated surface are explicit inputs; it defines no shape channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits numbers and copied measurement witnesses, never render geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The builder owns the shared skin that this instrument reads.
 * @evidenceExclude contracts/modeling.md#rendered-observation The concrete exterior consumer owns rendered candidate inspection.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source rule owns its anatomical site; this function owns the instrument arithmetic.
 * @evidenceExclude contracts/anatomy.md#permitted-range It reports a reading or null and bounds no authored target.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The producer interprets named measurements; this function receives already evaluated geometry.
 */
export function readHumanBodyShapedMeasurement(
  basis: IAutoMovieHumanBodyBasis,
  shaped: ReturnType<typeof evaluateHumanBodyShape>,
  rule: IAutoMovieHumanBodyMeasurement,
  observeSection?: (section: IAutoMovieHumanBodyMeasurementSection) => void,
): number | null {
  // two registered skin points, read before the joint landmarks the other kinds name
  if (rule.kind === "skin-distance") {
    const a = readHumanBodySkinPoint(basis, shaped.surfaces, rule.from);
    const b = readHumanBodySkinPoint(basis, shaped.surfaces, rule.to);
    return a === null || b === null
      ? null
      : Vector3.length(Vector3.subtract(b, a));
  }
  // a registered skin point's height above the ground landmark's plane
  if (rule.kind === "skin-height") {
    const ground = shaped.landmarks[rule.from];
    const point = readHumanBodySkinPoint(basis, shaped.surfaces, rule.to);
    return ground === undefined || point === null ? null : point.y - ground.y;
  }
  const from = shaped.landmarks[rule.from];
  const to = shaped.landmarks[rule.to];
  if (from === undefined || to === undefined) return null;
  if (rule.kind === "distance")
    return Vector3.length(Vector3.subtract(to, from));
  if (rule.kind === "extent")
    return readHumanBodySkinExtent(basis, shaped.surfaces, from, to, rule);
  if (rule.kind === "skin-reach")
    return readHumanBodySkinReach(basis, shaped.surfaces, from, to, rule);
  const axis = Vector3.subtract(to, from);
  const normal = rule.horizontal
    ? Vector3.create(0, 1, 0)
    : Vector3.normalize(axis);
  let fractions: number[];
  if ("level" in rule) {
    const point = findHumanSkinLandmark(basis, rule.level);
    const positions =
      point === undefined ? undefined : shaped.surfaces[point.surface];
    if (
      point === undefined ||
      positions === undefined ||
      point.vertex * 3 + 2 >= positions.length
    )
      return null;
    const vertex = Vector3.create(
      positions[point.vertex * 3],
      positions[point.vertex * 3 + 1],
      positions[point.vertex * 3 + 2],
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
        measureHumanSection(
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
    observeSection?.({
      point: { ...point },
      normal: { ...normal },
      seed: { ...point },
    });
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
