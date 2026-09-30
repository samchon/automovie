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
 * @evidence contracts/common.md#principled-implementation Channel weights are checked against each channel's envelope and kind, then a corrective activation is min(1, gain * product of the clamped driver factors), so it is present only when every driver is present. Each factor is a tent over its driver (rising from `below` to `peak`, falling to `above`), and admission (assertHumanFaceBasis) guarantees below < peak <= above <= 1 so the divisions are defined. A sum would fire a corrective on one driver alone, which is the pose it was authored to leave untouched.
 * @evidence contracts/common.md#clear-and-simple-design One function that turns a document into weights and activations; the geometry belongs to evaluateHumanFaceRest.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An out-of-domain value refuses instead of clamping, so no hidden edit of the document occurs.
 * @evidence contracts/common.md#meaningful-documentation States the boundary role, the activation form with its reason, the in-between semantics and shape-only classification.
 * @evidence contracts/modeling.md#parameter-channels Each channel is one signed trait whose neutral is zero (admission requires the envelope to contain zero); the positive and negative endpoints are named separately. Correctives are the declared dependencies between channels and they are computed here, not hidden in the geometry.
 * @evidence contracts/modeling.md#spatial-conventions Weights are dimensionless coordinates in each channel's envelope; no unit conversion happens.
 * @evidenceExclude contracts/anatomy.md#anatomical-source humanFaceBasisWeights carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range humanFaceBasisWeights admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority humanFaceBasisWeights defines no input through which a caller shapes a human form.
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
