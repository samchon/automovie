import typia from "typia";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

const bounded: (value: number, low: number, high: number) => boolean = (value: number, low: number, high: number): boolean =>
  Number.isFinite(value) && value >= low && value <= high;
const positive: (value: number) => boolean = (value: number): boolean =>
  Number.isFinite(value) && value > 0;
const nonnegative: (value: number) => boolean = (value: number): boolean =>
  Number.isFinite(value) && value >= 0;
const vector: (values: readonly number[]) => boolean = (values: readonly number[]): boolean =>
  values.every(Number.isFinite);
const direction: (values: readonly number[]) => boolean = (values: readonly number[]): boolean =>
  vector(values) && positive(Math.hypot(...values));

/**
 * Admit a complete numerical hairstyle before root sampling or allocation. Document loading and generation call the same owner. Units and styling meanings belong to IAutoMovieHumanFaceHair; limits here bound representation and arithmetic cost, not biological populations. The million-interval budget counts all layers and the longest authored length including its variation. Even a zero-count layer must have valid fields. Shared surface/domain lookup, actual root emergence and contact feasibility belong to the compiled builder. The input and its nested arrays are read without mutation or normalization.
 *
 * @evidence contracts/common.md#principled-implementation Exact shape admission and explicit finite ranges bound every layer's masks, metric steps, guides, gathering and procedural appearance before allocation.
 * @evidence contracts/common.md#clear-and-simple-design One validator serves document loading and generation while compiled surface correspondence and contact own later feasibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts, eight layers and million intervals are representation budgets, not measured biological ranges; zero-count layers still undergo complete field checks and values remain unchanged.
 * @evidence contracts/common.md#meaningful-documentation Errors distinguish identity, geometry, guide, gathering, parting, curl or construction-budget failures, with physiological or rendered validity not established by admission alone.
 * @evidence contracts/performance.md#efficient-algorithms The layer count is capped at eight; checks and typia admission scale with authored nested fields, and interval estimates bound later count-times-length allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared local scalar predicates supply consistent finite range checks; no admission result is cached against mutable input objects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only small temporary sets and enumeration arrays are owned by this synchronous check; caller arrays and future geometry remain unallocated.
 */
export function assertHumanFaceHair(input: IAutoMovieHumanFaceHair): void {
  const hair: IAutoMovieHumanFaceHair = typia.assertEquals<IAutoMovieHumanFaceHair>(input);
  if (hair.layers.length > 8)
    throw new Error("A numerical hairstyle accepts at most eight layers.");
  const identities: Set<string> = new Set<string>();
  let intervals: number = 0;
  for (const layer of hair.layers) {
    if (
      [layer.id, layer.surface, layer.domain].some((id: string): boolean => id.trim() === "") ||
      identities.has(layer.id)
    )
      throw new Error(
        "Hair layers need nonblank source names and unique identities.",
      );
    identities.add(layer.id);
    if (
      !Number.isInteger(layer.count) ||
      !bounded(layer.count, 0, 1024) ||
      !Number.isInteger(layer.seed) ||
      !bounded(layer.seed, 0, 0xffffffff) ||
      !Object.values(layer.hairline).every((angle: number): boolean =>
        bounded(angle, 0, Math.PI),
      ) ||
      !layer.lengthAxes.every(positive) ||
      (layer.frontScale !== undefined && !positive(layer.frontScale)) ||
      !bounded(layer.lengthVariation, 0, 1) ||
      !positive(layer.samplingStep) ||
      layer.samplingStep > 0.005 ||
      !nonnegative(layer.clearance) ||
      (layer.terminalShaftDiameter !== undefined && !positive(layer.terminalShaftDiameter)) ||
      (layer.emergenceAngleDegrees !== undefined && (!positive(layer.emergenceAngleDegrees) || layer.emergenceAngleDegrees > 90)) ||
      !direction(layer.flow) ||
      !nonnegative(layer.lift.strength) ||
      !positive(layer.lift.reach) ||
      (layer.fall !== undefined && !positive(layer.fall.reach))
    )
      throw new Error(
        "Hair roots, lengths, steps and flow need finite admitted numerical fields.",
      );
    if (
      layer.guides !== undefined &&
      (!positive(layer.guides.fraction) ||
        layer.guides.fraction > 1 ||
        !Number.isInteger(layer.guides.neighbours) ||
        !bounded(layer.guides.neighbours, 1, 8) ||
        (layer.guides.clump !== undefined &&
          !bounded(layer.guides.clump, 0, 1)))
    )
      throw new Error(
        "Hair guides need a fraction in (0,1], one to eight neighbours and a clump in [0,1].",
      );
    if (layer.gather !== undefined) {
      const gather: NonNullable<IAutoMovieHumanFaceHair.Layer["gather"]> = layer.gather;
      if (
        !bounded(gather.anchor.polar, 0, Math.PI) ||
        !bounded(gather.anchor.azimuth, -Math.PI, Math.PI) ||
        !positive(gather.radius) ||
        !positive(gather.strength) ||
        gather.strength > 1 ||
        !direction(gather.tail.direction) ||
        (gather.tail.spread !== undefined &&
          (!nonnegative(gather.tail.spread.radius) ||
            !positive(gather.tail.spread.reach))) ||
        (layer.guides !== undefined && layer.guides.fraction !== 1)
      )
        throw new Error(
          "Gathered hair needs a scalp ray, positive tie radius and strength, a tail direction and fully integrated roots.",
        );
    }
    const part: IAutoMovieHumanFaceHair.Layer["part"] = layer.part;
    if (part !== undefined) {
      if (
        !direction(part.normal) ||
        !Number.isFinite(part.offset) ||
        !positive(part.transitionWidth) ||
        !vector(part.bias) ||
        !nonnegative(part.strength) ||
        !positive(part.reach)
      )
        throw new Error(
          "Hair parting needs finite directions and positive transition distances.",
        );
    }
    for (const region of [layer.rootRegion, part?.region])
      if (
        region !== undefined &&
        (!vector(region.center) || !region.spread.every(positive))
      )
        throw new Error(
          "Hair envelopes need finite centres and positive metre spreads.",
        );
    if (
      !bounded(layer.curl.angle, 0, Math.PI / 2) ||
      layer.curl.angle === Math.PI / 2 ||
      !positive(layer.curl.wavelength) ||
      layer.curl.wavelength < 8 * layer.samplingStep ||
      !positive(layer.curl.reach) ||
      !bounded(layer.taper.tipWidth, 0.05, 1) ||
      !bounded(layer.taper.start, 0, 0.95) ||
      !layer.finish.color.every((value: number): boolean => bounded(value, 0, 1)) ||
      !bounded(layer.finish.roughness, 0, 1) ||
      !Number.isInteger(layer.finish.fibres) ||
      !bounded(layer.finish.fibres, 1, 32) ||
      !bounded(layer.finish.coverage, 0.1, 1) ||
      !bounded(layer.finish.normal, 0, 1) ||
      !bounded(layer.finish.shade, 0, 1) ||
      (layer.finish.grey !== undefined && !bounded(layer.finish.grey, 0, 1))
    )
      throw new Error(
        "Hair curl, taper and fibre appearance need resolved finite parameters.",
      );
    const perLock: number = Math.ceil(
      (Math.max(...layer.lengthAxes) *
        Math.max(1, layer.frontScale ?? 1) *
        (1 + layer.lengthVariation)) /
        layer.samplingStep,
    );
    intervals += perLock * layer.count;
    if (
      !Number.isFinite(perLock) ||
      perLock > 1_000_000 ||
      intervals > 1_000_000
    )
      throw new Error(
        "A numerical hairstyle exceeds its million-interval construction budget.",
      );
  }
}
