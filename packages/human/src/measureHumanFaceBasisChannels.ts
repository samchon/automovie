import type { IAutoMovieHumanFaceBasis } from "./IAutoMovieHumanFaceBasis";

/**
 * How far one unit of a connected-basis channel actually moves the surface.
 *
 * A basis channel is a dimensionless authored weight, so the same numeric edit
 * means a different amount of geometry on every control: on the shipped CC0
 * head one unit of `philtrumVolume` displaces tens of micrometres while one
 * unit of `globalAgeStructure` displaces centimetres. An editor that shows only
 * the envelope therefore shows a range without a unit, and any consumer that
 * compares, regularizes or budgets weights across channels is comparing numbers
 * in incomparable units.
 *
 * Both figures are reported per unit of weight, in metres, over all surfaces of
 * the basis at once, because every attached surface consumes the same control
 * state. `displacement` is the root mean square over every resident vertex,
 * including the ones the endpoint leaves alone, so a channel that moves a wide
 * area scores above one that moves the same distance on a few vertices; it is
 * the whole endpoint's geometric commitment. `peak` is the largest single
 * vertex displacement, which is what a reader sees first on a render.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceChannelScale {
  /** Channel identity, matching the basis channel this measures. */
  id: string;
  /** Copied from the channel so a caller can group without a second lookup. */
  kind: "shape" | "expression";
  /** Metric effect of the positive endpoint, always present. */
  positive: IAutoMovieHumanFaceEndpointScale;
  /** Metric effect of the negative endpoint, or null for a nonnegative control. */
  negative: IAutoMovieHumanFaceEndpointScale | null;
}

/**
 * The measured metric effect of one named endpoint at unit weight.
 *
 * Distances are metres in the basis head frame. They describe the authored
 * displacement field only: a large `peak` says the endpoint moves geometry far,
 * never that the resulting face is anatomically valid, collision free or a
 * likeness of anyone.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEndpointScale {
  /** Root mean square displacement over every vertex of every surface. */
  displacement: number;
  /** Largest single-vertex displacement magnitude. */
  peak: number;
  /** Vertices the endpoint carries a sparse row for, across all surfaces. */
  vertices: number;
}

/**
 * Measure every channel's metric effect on an admitted connected facial basis.
 *
 * The connected editor calls this once per loaded basis and prints the result
 * beside each control, which is what gives a dimensionless weight the unit the
 * editing screen owes it. The whole-face fitting studies under
 * `test/studies/human-face` use the same figures to price a shape weight by the
 * geometry it commits instead of by its raw magnitude.
 *
 * The basis is read, never mutated. It is expected to have passed
 * `assertHumanFaceBasis`, which is what guarantees finite sparse rows and
 * resident vertex identities; an endpoint no surface carries a row for measures
 * as zero rather than throwing, because the admission boundary already refuses
 * that basis. Cost is linear in the total number of sparse rows.
 *
 * @param basis Admitted immutable basis to measure.
 * @returns One record per channel, in the basis's own channel order.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components States the metre magnitude of each named control's increase and decrease, which a dimensionless endpoint weight alone leaves undescribed.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Derives the unit a basis control carries from its own authored endpoint displacements rather than restating an authored constant.
 */
export function measureHumanFaceBasisChannels(
  basis: IAutoMovieHumanFaceBasis,
): IAutoMovieHumanFaceChannelScale[] {
  const vertices = basis.surfaces.reduce(
    (total, surface) => total + surface.positions.length / 3,
    0,
  );
  const measure = (name: string): IAutoMovieHumanFaceEndpointScale => {
    let square = 0;
    let peak = 0;
    let moved = 0;
    for (const surface of basis.surfaces) {
      const rows = surface.targets[name];
      if (rows === undefined) continue;
      for (let i = 0; i < rows.length; i += 4) {
        const length =
          rows[i + 1] * rows[i + 1] +
          rows[i + 2] * rows[i + 2] +
          rows[i + 3] * rows[i + 3];
        square += length;
        peak = Math.max(peak, length);
        moved++;
      }
    }
    return {
      displacement: Math.sqrt(square / vertices),
      peak: Math.sqrt(peak),
      vertices: moved,
    };
  };
  return basis.channels.map((channel) => ({
    id: channel.id,
    kind: channel.kind,
    positive: measure(channel.positive),
    negative: channel.negative === null ? null : measure(channel.negative),
  }));
}
