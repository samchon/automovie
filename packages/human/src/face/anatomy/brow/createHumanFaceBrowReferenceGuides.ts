import type { IPortraitEyebrowProfile } from "./IPortraitEyebrowProfile";
import type { IPortraitEyebrowPlacement } from "./IPortraitEyebrowPlacement";
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { IPortraitEyebrowFlowDirection } from "./IPortraitEyebrowFlowDirection";

import { catmullRomPoint } from "../../mesh/catmullRomPoint";
import type { IHumanFaceBrowReferenceGuide } from "./IHumanFaceBrowReferenceGuide";
import type { IHumanFaceBrowReferenceGuidesInput } from "./IHumanFaceBrowReferenceGuidesInput";
import { assertPortraitEyebrowProfile } from "./assertPortraitEyebrowProfile";
import { resolvePortraitEyebrowPlacement } from "./resolvePortraitEyebrowPlacement";

/**
 * Derive finite brow guides from the actual native reference band before any material disk is selected. The connected shaft builder consumes this definition, so extending disk support cannot change a guide. Uniform Catmull-Rom interpolates the two registered boundaries; placement chooses roots, tip fractions, thinning and flow in their existing meanings. Source-band tangent and millimetre bend define each finite reference chord.
 *
 * These are authored construction conventions rather than measured follicles
 * or geodesics. Resolution samples the same free guide the source registers;
 * native seating and current normal/arc reading remain downstream. No source
 * vertex, requested quantity or population default is changed here.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Uniform Catmull-Rom band interpolation, deterministic root/thinning laws and source lateral tangent derive finite reference chords before native seating.
 * @evidence contracts/common.md#clear-and-simple-design The connected shaft builder delegates reference guide construction here while registration and current metric/normal reads remain downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Guides retain original ordinals and requested dimensions; authored construction is not follicle measurement or a clinical/geodesic length certificate.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies source reference authority, finite resolution, unchanged population defaults and downstream native support.
 * @evidence contracts/performance.md#efficient-algorithms After boundary/profile admission, requested count N and segment count S drive O(N*S) guide stations; each Catmull-Rom query touches four boundary neighbours.
 * @evidence contracts/performance.md#reuse-equivalent-work Placement and cloned profile are resolved once, with top/bottom boundary points shared across all guide samples.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned surviving reference point arrays are caller-owned; copied profile, boundary arrays and per-fibre directions are call-local and no source cache is retained.
 */
export function createHumanFaceBrowReferenceGuides(
  input: IHumanFaceBrowReferenceGuidesInput,
): IHumanFaceBrowReferenceGuide[] {
  const { positions, binding, count }: IHumanFaceBrowReferenceGuidesInput = input;
  const shape: IPortraitEyebrowProfile = structuredClone(input.profile);
  assertPortraitEyebrowProfile(shape, count);
  if (count === 0) return [];
  if (
    binding.upper.length < 2 || binding.lower.length < 2 ||
    [...binding.upper, ...binding.lower].some((vertex: number): boolean  =>
      !Number.isInteger(vertex) || vertex < 0 || 3 * vertex + 2 >= positions.length,
    )
  ) throw new Error("Eyebrow reference boundaries need resident native identities.");
  const { flow, rootBand, endFade: ends }: IPortraitEyebrowPlacement = resolvePortraitEyebrowPlacement(shape);
  const landmark: (vertex: number) => IAutoMovieVector3 = (vertex: number): IAutoMovieVector3 => ({
    x: positions[3 * vertex], y: positions[3 * vertex + 1], z: positions[3 * vertex + 2],
  });
  const top: IAutoMovieVector3[] = binding.upper.map(landmark), bottom: IAutoMovieVector3[] = binding.lower.map(landmark);
  const band: (u: number, across: number) => number[] = (u: number, across: number): number[] => {
    const a: IAutoMovieVector3 = catmullRomPoint(bottom, u), b: IAutoMovieVector3 = catmullRomPoint(top, u);
    return [a.x + (b.x - a.x) * across, a.y + (b.y - a.y) * across, a.z + (b.z - a.z) * across];
  };
  const lateralSign: 1 | -1 = Math.abs(band(1, 0.5)[0]) >= Math.abs(band(0, 0.5)[0]) ? 1 : -1;
  const fade: (distance: number, reach: number) => number = (distance: number, reach: number): number => {
    if (reach === 0) return 1;
    const t: number = Math.min(1, distance / reach);
    return t * t * (3 - 2 * t);
  };
  const densityStep: number = shape.densitySeed === undefined ? 0.61803398875 : Math.SQRT2;
  const densityPhase: number = shape.densitySeed === undefined ? 0 :
    (Math.imul(shape.densitySeed, 0x9e3779b1) >>> 0) / 0x100000000;
  const result: IHumanFaceBrowReferenceGuide[] = [];
  for (let index: number = 0; index < count; index++) {
    const u: number = (index + 0.5) / count, anatomical: number = lateralSign > 0 ? u : 1 - u;
    const envelope: number = fade(anatomical, ends[0]) * fade(1 - anatomical, ends[1]);
    if (((index + 0.5) * densityStep + densityPhase) % 1 >= envelope) continue;
    const rootFraction: number = (index * 0.61803398875) % 1;
    const start: number = rootBand[0] + (rootBand[1] - rootBand[0]) * rootFraction;
    const direction: IPortraitEyebrowFlowDirection | undefined = flow?.(anatomical, rootBand[0] === rootBand[1] ? 0.5 : rootFraction);
    const end: number = direction?.tip ?? start + (shape.span ?? 0.26 + 0.08 * Math.sin(Math.PI * u));
    const bend: number = (direction?.outwardBend ?? shape.outwardBend) * 0.001;
    const before: number[] = band(Math.max(0, u - 0.01), 0.5), after: number[] = band(Math.min(1, u + 0.01), 0.5);
    const along: number[] = [0, 1, 2].map((axis: number): number  => (after[axis] - before[axis]) * lateralSign);
    const length: number = Math.hypot(...along);
    if (!(length > 0)) throw new Error("An eyebrow reference band needs a nonzero tangent.");
    result.push({ index, points: Array.from({ length: shape.segments + 1 }, (_: unknown, ring: number): number[]  => {
      const t: number = ring / shape.segments, base: number[] = band(u, start + (end - start) * t);
      return base.map((value: number, axis: number): number  => value + (along[axis] / length) * bend * t * t);
    }) });
  }
  return result;
}
