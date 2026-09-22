import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";

/**
 * The control state one document asks of one admitted facial basis.
 *
 * This is the boundary between a document and the geometry: channel weights
 * checked against their envelopes and corrective activations computed from
 * those weights. It reads both inputs and mutates neither. The builder
 * applies the result, the articulation reads the same weights for its joint
 * angles, and offline preparation calls it so an endpoint decomposed at
 * weight one is exactly the endpoint the builder evaluates at weight one.
 *
 * The activation is a product of the clamped driving sides times the
 * authored gain, capped at one: present only when every driver is present, a
 * quarter when two drivers are at half. That is MetaHuman's `PSDNetImpl`,
 * which computes `min(1, weight * product of clamped inputs)` over a buffer
 * it clamps to [0,1] first, and the form matters more than the source: a sum
 * here would fire a corrective on one driver alone, which is the pose it was
 * authored to leave untouched. An input with a peak under one is an
 * in-between: its factor is a tent over the driver, one at the peak and zero
 * at either end of its span, which is the whole envelope unless the input
 * names one. A corrective is shape-only when every driver is a shape channel,
 * which is what lets landmarks and identity read it.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Refuses unsupported channels and out-of-envelope weights instead of clamping them.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Computes the `|weight| x endpoint` selection and the product corrective activation the evaluation order applies.
 */
export function humanFaceBasisWeights(
  basis: IAutoMovieHumanFaceBasis,
  document: Pick<IAutoMovieHumanFaceBasisDocument, "shape" | "expression">,
): {
  weights: Map<string, number>;
  activations: { target: string; activation: number; shapeOnly: boolean }[];
} {
  const channels = new Map(
    basis.channels.map((channel) => [channel.id, channel]),
  );
  const weights = new Map<string, number>();
  for (const kind of ["shape", "expression"] as const)
    for (const [name, weight] of Object.entries(document[kind])) {
      const channel = channels.get(name);
      if (
        channel === undefined ||
        channel.kind !== kind ||
        !Number.isFinite(weight) ||
        weight < channel.minimum ||
        weight > channel.maximum
      )
        throw new Error(
          "Unsupported or out-of-domain facial control: " + kind + "." + name,
        );
      weights.set(name, weight);
    }
  const activations = (basis.correctives ?? []).map((corrective) => ({
    target: corrective.target,
    shapeOnly: corrective.inputs.every(
      (input) => channels.get(input.channel)!.kind === "shape",
    ),
    activation: Math.min(
      1,
      corrective.inputs.reduce((total, input) => {
        const weight = weights.get(input.channel) ?? 0;
        const driver = input.side === "negative" ? -weight : weight;
        const peak = input.peak ?? 1;
        const [below, above] = input.between ?? [0, 1];
        const factor =
          driver <= peak
            ? (driver - below) / (peak - below)
            : above > peak
              ? (above - driver) / (above - peak)
              : 1;
        return total * Math.min(1, Math.max(0, factor));
      }, corrective.weight),
    ),
  }));
  return { weights, activations };
}
