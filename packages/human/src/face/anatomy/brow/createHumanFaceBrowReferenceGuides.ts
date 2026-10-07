import { catmullRomPoint } from "../../mesh/catmullRomPoint";
import type { IHumanFaceBrowReferenceGuide } from "./IHumanFaceBrowReferenceGuide";
import type { IHumanFaceBrowReferenceGuidesInput } from "./IHumanFaceBrowReferenceGuidesInput";
import { assertPortraitEyebrowProfile } from "./assertPortraitEyebrowProfile";
import { resolvePortraitEyebrowPlacement } from "./resolvePortraitEyebrowPlacement";

/**
 * Derive finite brow guides from the actual native reference band before any
 * material disk is selected. Source preparation and the shaft builder consume
 * this same definition, so extending disk support cannot change a guide.
 * Uniform Catmull-Rom interpolates the two registered boundaries; placement
 * chooses roots, tip fractions, thinning and flow in their existing meanings.
 * Source-band tangent and millimetre bend define each finite reference chord.
 *
 * These are authored construction conventions rather than measured follicles
 * or geodesics. Resolution samples the same free guide the source registers;
 * native seating and current normal/arc reading remain downstream. No source
 * vertex, requested quantity or population default is changed here.
 *
 * @evidence contracts/common.md#principled-implementation One reference-space band and finite guide definition precede both source support compilation and runtime material transport, removing the disk-dependent guide/support cycle.
 * @evidence contracts/common.md#clear-and-simple-design Owns placement and free-guide generation; native seating, physical arc and shaft meshes remain separate consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Preserves existing root, fade, density, flow, finite-difference tangent and millimetre bend definitions without altered defaults or source geometry.
 * @evidence contracts/common.md#meaningful-documentation States reference ownership, guide semantics, source/runtime consumers and nonclinical limitations.
 * @evidence contracts/modeling.md#spatial-conventions Reference positions and output stations are head-frame metres; profile bends convert from millimetres once.
 * @evidence contracts/modeling.md#shared-boundaries Actual native band identities supply the same guide to source support and runtime registration.
 * @evidence contracts/modeling.md#parameter-channels Placement retains root/fade/grain meanings and bend modifies the finite reference guide rather than material coordinates.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries derived shaft guides rather than rendered parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The shaft mesh owner retains the rendered lattice.
 * @evidenceExclude contracts/modeling.md#rendered-observation Brow assembly observes the emitted shafts.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The population and profile owners retain qualifications; this calculation adds no clinical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing profile admission owns bounds and the emitted contact owner judges geometry.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No personal curve input is introduced.
 * @author Samchon
 */
export function createHumanFaceBrowReferenceGuides(
  input: IHumanFaceBrowReferenceGuidesInput,
): IHumanFaceBrowReferenceGuide[] {
  const { positions, binding, count } = input;
  const shape = structuredClone(input.profile);
  assertPortraitEyebrowProfile(shape, count);
  if (count === 0) return [];
  if (
    binding.upper.length < 2 || binding.lower.length < 2 ||
    [...binding.upper, ...binding.lower].some((vertex) =>
      !Number.isInteger(vertex) || vertex < 0 || 3 * vertex + 2 >= positions.length,
    )
  ) throw new Error("Eyebrow reference boundaries need resident native identities.");
  const { flow, rootBand, endFade: ends } = resolvePortraitEyebrowPlacement(shape);
  const landmark = (vertex: number) => ({
    x: positions[3 * vertex], y: positions[3 * vertex + 1], z: positions[3 * vertex + 2],
  });
  const top = binding.upper.map(landmark), bottom = binding.lower.map(landmark);
  const band = (u: number, across: number): number[] => {
    const a = catmullRomPoint(bottom, u), b = catmullRomPoint(top, u);
    return [a.x + (b.x - a.x) * across, a.y + (b.y - a.y) * across, a.z + (b.z - a.z) * across];
  };
  const lateralSign = Math.abs(band(1, 0.5)[0]) >= Math.abs(band(0, 0.5)[0]) ? 1 : -1;
  const fade = (distance: number, reach: number): number => {
    if (reach === 0) return 1;
    const t = Math.min(1, distance / reach);
    return t * t * (3 - 2 * t);
  };
  const densityStep = shape.densitySeed === undefined ? 0.61803398875 : Math.SQRT2;
  const densityPhase = shape.densitySeed === undefined ? 0 :
    (Math.imul(shape.densitySeed, 0x9e3779b1) >>> 0) / 0x100000000;
  const result: IHumanFaceBrowReferenceGuide[] = [];
  for (let index = 0; index < count; index++) {
    const u = (index + 0.5) / count, anatomical = lateralSign > 0 ? u : 1 - u;
    const envelope = fade(anatomical, ends[0]) * fade(1 - anatomical, ends[1]);
    if (((index + 0.5) * densityStep + densityPhase) % 1 >= envelope) continue;
    const rootFraction = (index * 0.61803398875) % 1;
    const start = rootBand[0] + (rootBand[1] - rootBand[0]) * rootFraction;
    const direction = flow?.(anatomical, rootBand[0] === rootBand[1] ? 0.5 : rootFraction);
    const end = direction?.tip ?? start + (shape.span ?? 0.26 + 0.08 * Math.sin(Math.PI * u));
    const bend = (direction?.outwardBend ?? shape.outwardBend) * 0.001;
    const before = band(Math.max(0, u - 0.01), 0.5), after = band(Math.min(1, u + 0.01), 0.5);
    const along = [0, 1, 2].map((axis) => (after[axis] - before[axis]) * lateralSign);
    const length = Math.hypot(...along);
    if (!(length > 0)) throw new Error("An eyebrow reference band needs a nonzero tangent.");
    result.push({ index, points: Array.from({ length: shape.segments + 1 }, (_, ring) => {
      const t = ring / shape.segments, base = band(u, start + (end - start) * t);
      return base.map((value, axis) => value + (along[axis] / length) * bend * t * t);
    }) });
  }
  return result;
}
