import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import { assertSparseRows } from "./assertSparseRows";

/**
 * The control state one document asks of one admitted basis.
 *
 * This is the boundary between a document and the geometry: channel weights
 * checked against their envelopes, corrective activations computed from those
 * weights, and identity rows checked against the surfaces they name. It reads
 * both inputs and mutates neither; the builder applies the result and the
 * measuring code uses the same function so a channel measured at +1 is
 * exactly the channel the builder would evaluate at +1.
 *
 * The activation is the product form of `createHumanFaceBasisBuilder`:
 * `min(1, weight * product of clamped driver sides)`, zero unless every driver
 * is present. A sum here would fire a corrective on one driver alone, which is
 * the pose it was authored to leave untouched.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-connected-basis Refuses unsupported channels, out-of-envelope weights and identity rows on surfaces the basis lacks instead of clamping them.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-basis Computes the `|weight| x endpoint` selection and the product corrective activation the evaluation order applies.
 */
export function humanBodyBasisWeights(
  basis: IAutoMovieHumanBodyBasis,
  document: Pick<IAutoMovieHumanBodyBasisDocument, "shape" | "identity">,
): {
  weights: Map<string, number>;
  activations: { target: string; activation: number }[];
} {
  const channels = new Map(
    basis.channels.map((channel) => [channel.id, channel]),
  );
  const weights = new Map<string, number>();
  for (const [name, weight] of Object.entries(document.shape)) {
    const channel = channels.get(name);
    if (
      channel === undefined ||
      !Number.isFinite(weight) ||
      weight < channel.minimum ||
      weight > channel.maximum
    )
      throw new Error("Unsupported or out-of-domain body control: " + name);
    weights.set(name, weight);
  }
  // A per-vertex identity names surfaces and vertices of this basis. A row
  // that names neither is a document written against something else, and
  // silently skipping it would build a body that is not the one asked for.
  for (const [id, rows] of Object.entries(document.identity ?? {})) {
    const surface = basis.surfaces.find((one) => one.id === id);
    if (surface === undefined)
      throw new Error(
        "Per-vertex identity names a surface this basis does not declare: " +
          id,
      );
    assertSparseRows(rows, surface.positions.length / 3, "identity " + id);
  }
  const activations = (basis.correctives ?? []).map((corrective) => ({
    target: corrective.target,
    activation: Math.min(
      1,
      corrective.inputs.reduce((total, input) => {
        const weight = weights.get(input.channel) ?? 0;
        const driver = input.side === "negative" ? -weight : weight;
        return total * Math.min(1, Math.max(0, driver));
      }, corrective.weight),
    ),
  }));
  return { weights, activations };
}
