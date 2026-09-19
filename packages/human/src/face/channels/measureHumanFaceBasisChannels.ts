import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import { IAutoMovieHumanFaceChannelScale } from "../structures/IAutoMovieHumanFaceChannelScale";
import { IAutoMovieHumanFaceEndpointScale } from "../structures/IAutoMovieHumanFaceEndpointScale";

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
 * that basis. The one precondition this function cannot leave implicit is a
 * resident vertex, because dividing by an empty population would publish NaN as
 * a measurement; the browser editor reads a fetched asset before any builder
 * has admitted it, so that case is refused here rather than displayed. Cost is
 * linear in the total number of sparse rows.
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
  const resident = basis.surfaces.reduce(
    (total, surface) => total + surface.positions.length / 3,
    0,
  );
  if (resident === 0)
    throw new Error("A facial basis needs resident vertices to measure.");
  // Accumulate squared magnitudes and take the roots once at the end: both
  // reported figures are roots of the same per-row quantity, and squaring a
  // sparse row is cheaper than taking its length for every row.
  const measure = (name: string): IAutoMovieHumanFaceEndpointScale => {
    let sumOfSquares = 0;
    let largestSquare = 0;
    let rowCount = 0;
    for (const surface of basis.surfaces) {
      const rows = surface.targets[name];
      if (rows === undefined) continue;
      for (let i = 0; i < rows.length; i += 4) {
        const square =
          rows[i + 1] * rows[i + 1] +
          rows[i + 2] * rows[i + 2] +
          rows[i + 3] * rows[i + 3];
        sumOfSquares += square;
        largestSquare = Math.max(largestSquare, square);
        rowCount++;
      }
    }
    return {
      displacement: Math.sqrt(sumOfSquares / resident),
      peak: Math.sqrt(largestSquare),
      vertices: rowCount,
    };
  };
  return basis.channels.map((channel) => ({
    id: channel.id,
    kind: channel.kind,
    positive: measure(channel.positive),
    negative: channel.negative === null ? null : measure(channel.negative),
  }));
}
