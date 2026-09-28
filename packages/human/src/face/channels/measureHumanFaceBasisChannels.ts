import { evaluateHumanFaceRest } from "../basis/evaluateHumanFaceRest";
import { poseHumanFaceSurface } from "../basis/poseHumanFaceSurface";
import { resolveHumanFaceArticulation } from "../basis/resolveHumanFaceArticulation";
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
 * A channel that drives a joint is measured as the builder poses it: its
 * endpoint rows are the rest-space residual, so the figure a reader needs is
 * the posed displacement, `pose(neutral + rows) - neutral` over the attached
 * surfaces at weight one. That is the same attachment posing the builder
 * runs, so the printed millimetres are what the render shows rather than a
 * second formula for them. Every other endpoint is its rows alone.
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
  const articulated = new Map<string, string>();
  const articulation = basis.articulation;
  if (articulation !== undefined) {
    const { jaw } = articulation;
    for (const channel of [
      jaw.opening.channel,
      jaw.protrusion.channel,
      jaw.laterotrusion.left.channel,
      jaw.laterotrusion.right.channel,
      ...articulation.eyes.flatMap((eye) =>
        eye.gaze.map((gaze) => gaze.channel),
      ),
    ])
      articulated.set(
        basis.channels.find((one) => one.id === channel)!.positive,
        channel,
      );
  }
  const landmarks =
    articulation === undefined
      ? {}
      : evaluateHumanFaceRest(basis, { weights: new Map(), activations: [] })
          .landmarks;
  // Accumulate squared magnitudes and take the roots once at the end: both
  // reported figures are roots of the same per-row quantity, and squaring a
  // sparse row is cheaper than taking its length for every row. A joint's
  // channel is instead posed through the same attachment blend the builder
  // uses, and measured vertex by vertex against the neutral.
  const measure = (name: string): IAutoMovieHumanFaceEndpointScale => {
    let sumOfSquares = 0;
    let largestSquare = 0;
    let rowCount = 0;
    const channel = articulated.get(name);
    const motions =
      channel === undefined
        ? undefined
        : resolveHumanFaceArticulation(
            articulation!,
            new Map([[channel, 1]]),
            landmarks,
          ).motions;
    for (const surface of basis.surfaces) {
      const rows = surface.targets[name];
      if (motions !== undefined && (surface.attachments?.length ?? 0) > 0) {
        const rest = surface.positions.slice();
        if (rows !== undefined)
          for (let i = 0; i < rows.length; i += 4)
            for (let axis = 0; axis < 3; axis++)
              rest[rows[i] * 3 + axis] += rows[i + axis + 1];
        const posed = poseHumanFaceSurface(rest, surface.attachments!, motions);
        for (let v = 0; v * 3 < posed.length; v++) {
          const square =
            (posed[3 * v] - surface.positions[3 * v]) ** 2 +
            (posed[3 * v + 1] - surface.positions[3 * v + 1]) ** 2 +
            (posed[3 * v + 2] - surface.positions[3 * v + 2]) ** 2;
          if (square === 0) continue;
          sumOfSquares += square;
          largestSquare = Math.max(largestSquare, square);
          rowCount++;
        }
        continue;
      }
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
