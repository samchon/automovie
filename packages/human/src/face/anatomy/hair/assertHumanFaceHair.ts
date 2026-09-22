import typia from "typia";

import type { IAutoMovieHumanFaceHair } from "../../structures/IAutoMovieHumanFaceHair";

const bounded = (value: number, low: number, high: number): boolean =>
  Number.isFinite(value) && value >= low && value <= high;
const positive = (value: number): boolean =>
  Number.isFinite(value) && value > 0;
const nonnegative = (value: number): boolean =>
  Number.isFinite(value) && value >= 0;
const vector = (values: readonly number[]): boolean =>
  values.every(Number.isFinite);
const direction = (values: readonly number[]): boolean =>
  vector(values) && positive(Math.hypot(...values));

/**
 * Admit a complete numerical hairstyle before root sampling or allocation.
 * Document loading and generation call the same owner. Units and styling
 * meanings belong to IAutoMovieHumanFaceHair; limits here bound representation
 * and arithmetic cost, not biological populations. The million-interval budget
 * counts all layers and the longest authored length including its variation.
 * Even a zero-count layer must have valid fields. Shared surface/domain lookup,
 * actual root emergence and contact feasibility belong to the compiled builder.
 * The input and its nested arrays are read without mutation or normalization.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Refuses invalid numerical hair documents before evaluating shared facial geometry.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair Applies finite metric, angular, appearance, identity and combined allocation conditions to every layer.
 */
export function assertHumanFaceHair(input: IAutoMovieHumanFaceHair): void {
  const hair = typia.assertEquals<IAutoMovieHumanFaceHair>(input);
  if (hair.layers.length > 8)
    throw new Error("A numerical hairstyle accepts at most eight layers.");
  const identities = new Set<string>();
  let intervals = 0;
  for (const layer of hair.layers) {
    if (
      [layer.id, layer.surface, layer.domain].some((id) => id.trim() === "") ||
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
      !Object.values(layer.hairline).every((angle) =>
        bounded(angle, 0, Math.PI),
      ) ||
      !layer.lengthAxes.every(positive) ||
      !bounded(layer.lengthVariation, 0, 1) ||
      !positive(layer.width) ||
      layer.width > 0.04 ||
      !positive(layer.samplingStep) ||
      layer.samplingStep > 0.005 ||
      !nonnegative(layer.clearance) ||
      !direction(layer.flow) ||
      !nonnegative(layer.lift.strength) ||
      !positive(layer.lift.reach)
    )
      throw new Error(
        "Hair roots, lengths, widths and flow need finite admitted numerical fields.",
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
    const part = layer.part;
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
      !layer.finish.color.every((value) => bounded(value, 0, 1)) ||
      !bounded(layer.finish.roughness, 0, 1) ||
      !Number.isInteger(layer.finish.fibres) ||
      !bounded(layer.finish.fibres, 1, 32) ||
      !bounded(layer.finish.coverage, 0.1, 1) ||
      !bounded(layer.finish.normal, 0, 1) ||
      !bounded(layer.finish.shade, 0, 1)
    )
      throw new Error(
        "Hair curl, taper and fibre appearance need resolved finite parameters.",
      );
    const perLock = Math.ceil(
      (Math.max(...layer.lengthAxes) * (1 + layer.lengthVariation)) /
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
