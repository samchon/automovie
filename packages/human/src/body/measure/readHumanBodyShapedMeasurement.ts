import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

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
 * Read a named geometric rule from an unchanged shaped body in metres, or null when its required landmarks, finite axis or closed section are unavailable.
 *
 * The measurement reader evaluates the unposed shape once. Distance reads a straight landmark span; skin-height reads a point's signed Y separation from its named ground landmark; extent and reach delegate to their dominant-rig skin instruments. These mesh readings do not establish clinical accuracy or physiological capacity.
 *
 * A section rule places parallel planes along its landmark segment, or places one plane through a declared skin vertex. At each station, measureHumanSection selects a closed loop per surface and this reader keeps the centroid nearest the station. Girth is that loop's planar convex-hull perimeter; breadth is its X extent. The rule then selects the maximum, minimum or smallest rearmost Z across answered stations. Missing stations are skipped, so a result does not certify that every requested station had a closed contour.
 *
 * Multiple stations share a triangle candidate index; this reader supplies actual station points and the same normal so its sign classification uses the cutter's arithmetic. A landmark-level plane nearly parallel to the segment returns null at the conventional 1e-9 dot-product threshold. Source positions, indices and landmark ordinals must remain the admitted basis population throughout the call.
 *
 * The optional observer receives fresh plane/seed objects after an answered station. It cannot mutate later station coordinates through those objects, but its exception aborts the call and its retained copies and computation are caller-owned.
 *
 * @evidence contracts/common.md#principled-implementation Rule-kind dispatch reuses the shaped skin and source landmarks, delegates region instruments and closed-loop cuts, then applies the authored station selection. Missing sources and non-finite distances or section axes return null; sampled mesh readings remain geometric observations rather than clinical validation.
 * @evidence contracts/common.md#clear-and-simple-design Shape evaluation belongs to the measurement reader, source landmark lookup to the basis helper, triangle selection to the section index and loop metrics to measureHumanSection; this owner places stations and selects their reported value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readings come from current source coordinates and declared rules rather than target measurements; unavailable stations are omitted explicitly, and neither a returned value nor the candidate index certifies physiological accuracy.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes distance, signed skin-height, region metrics, tape hull girth and X breadth, identifies station omission and index premises, and describes observer ownership and failure propagation.
 * @evidence contracts/performance.md#efficient-algorithms Distance is constant work after landmark lookup; region queries scan their source population. For L stations, each surface index computes cutter-equivalent vertex signs and scans triangles at every station, O(L(V+T)); each station then walks candidates and sorts surface answers, and closed-loop instruments also compute candidate hulls. No anatomy-size constant bounds those source-dependent costs.
 * @evidence contracts/performance.md#reuse-equivalent-work All rules consume an already evaluated shape. One parallel-stack index per surface serves the stations of this call, while contours are recomputed for each plane and no index is cached across rules or changed shapes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Station coordinates, candidate lists and section answers are call-local and source-sized; only the scalar result and observer-owned copies escape. No mesh handle, background task or persistent cache is acquired.
 */
export function readHumanBodyShapedMeasurement(
  basis: IAutoMovieHumanBodyBasis,
  shaped: ReturnType<typeof evaluateHumanBodyShape>,
  rule: IAutoMovieHumanBodyMeasurement,
  observeSection?: (section: IAutoMovieHumanBodyMeasurementSection) => void,
): number | null {
  // two registered skin points, read before the joint landmarks the other kinds name
  if (rule.kind === "skin-distance") {
    const a: IAutoMovieVector3 | null = readHumanBodySkinPoint(basis, shaped.surfaces, rule.from);
    const b: IAutoMovieVector3 | null = readHumanBodySkinPoint(basis, shaped.surfaces, rule.to);
    if (a === null || b === null) return null;
    const distance: number = Vector3.length(Vector3.subtract(b, a));
    return Number.isFinite(distance) ? distance : null;
  }
  // a registered skin point's height above the ground landmark's plane
  if (rule.kind === "skin-height") {
    const ground: IAutoMovieVector3 | undefined = shaped.landmarks[rule.from];
    const point: IAutoMovieVector3 | null = readHumanBodySkinPoint(basis, shaped.surfaces, rule.to);
    if (ground === undefined || point === null) return null;
    const height: number = point.y - ground.y;
    return Number.isFinite(height) ? height : null;
  }
  const from: IAutoMovieVector3 | undefined = shaped.landmarks[rule.from];
  const to: IAutoMovieVector3 | undefined = shaped.landmarks[rule.to];
  if (from === undefined || to === undefined) return null;
  if (rule.kind === "distance") {
    const distance: number = Vector3.length(Vector3.subtract(to, from));
    return Number.isFinite(distance) ? distance : null;
  }
  if (rule.kind === "extent")
    return readHumanBodySkinExtent(basis, shaped.surfaces, from, to, rule);
  if (rule.kind === "skin-reach")
    return readHumanBodySkinReach(basis, shaped.surfaces, from, to, rule);
  const axis: IAutoMovieVector3 = Vector3.subtract(to, from);
  const length: number = Vector3.length(axis);
  if (!Number.isFinite(length) || (!rule.horizontal && length <= 0)) return null;
  const normal: IAutoMovieVector3 = rule.horizontal
    ? Vector3.create(0, 1, 0)
    : Vector3.normalize(axis);
  let fractions: number[];
  if ("level" in rule) {
    const point: ReturnType<typeof findHumanSkinLandmark> = findHumanSkinLandmark(basis, rule.level);
    const positions: number[] | undefined =
      point === undefined ? undefined : shaped.surfaces[point.surface];
    if (
      point === undefined ||
      positions === undefined ||
      point.vertex * 3 + 2 >= positions.length
    )
      return null;
    const vertex: IAutoMovieVector3 = Vector3.create(
      positions[point.vertex * 3],
      positions[point.vertex * 3 + 1],
      positions[point.vertex * 3 + 2],
    );
    // the one plane through the vertex meets the segment at this fraction
    const across: number = Vector3.dot(axis, normal);
    if (!Number.isFinite(across) || Math.abs(across) < 1e-9) return null;
    fractions = [Vector3.dot(Vector3.subtract(vertex, from), normal) / across];
  } else
    fractions = Array.from(
      { length: rule.steps },
      (_: unknown, step: number): number =>
        rule.range[0] +
        (rule.steps === 1
          ? 0
          : (step * (rule.range[1] - rule.range[0])) / (rule.steps - 1)),
    );
  const pick: "max" | "min" | "rearmost" = "level" in rule ? "max" : rule.pick;
  const points: IAutoMovieVector3[] = fractions.map((fraction: number): IAutoMovieVector3 =>
    Vector3.add(from, Vector3.scale(axis, fraction)),
  );
  // a stack of stations shares one normal, so each surface is indexed once
  // for all of them; a lone station is cheaper walked whole
  const levels: number[] = points.map((point: IAutoMovieVector3): number => Vector3.dot(point, normal));
  if (points.some((point: IAutoMovieVector3): boolean => !Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z)) || levels.some((level: number): boolean => !Number.isFinite(level))) return null;
  const near: number[][][] | undefined =
    points.length > 1
      ? shaped.surfaces.map((positions: number[], index: number): number[][] =>
          indexHumanBodySectionTriangles(
            positions,
            basis.surfaces[index].indices,
            normal,
            levels,
            points,
          ),
        )
      : undefined;
  let chosen: number | null = null;
  let rearmost: number = Infinity;
  for (const [station, point] of points.entries()) {
    const section: NonNullable<ReturnType<typeof measureHumanSection>> | undefined = shaped.surfaces
      .map((positions: number[], index: number): ReturnType<typeof measureHumanSection> =>
        measureHumanSection(
          positions,
          basis.surfaces[index].indices,
          { point, normal },
          point,
          near?.[index][station],
        ),
      )
      .filter((value: ReturnType<typeof measureHumanSection>): value is NonNullable<ReturnType<typeof measureHumanSection>> => value !== null)
      .sort(
        (a: NonNullable<ReturnType<typeof measureHumanSection>>, b: NonNullable<ReturnType<typeof measureHumanSection>>): number =>
          Vector3.length(Vector3.subtract(a.centroid, point)) -
          Vector3.length(Vector3.subtract(b.centroid, point)),
      )[0];
    if (section === undefined) continue;
    observeSection?.({
      point: { ...point },
      normal: { ...normal },
      seed: { ...point },
    });
    const value: number = rule.kind === "breadth" ? section.breadth : section.girth;
    if (!Number.isFinite(value)) return null;
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
