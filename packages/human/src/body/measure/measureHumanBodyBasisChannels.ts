import type { IAutoMovieHumanFaceEndpointScale } from "../../face/structures/IAutoMovieHumanFaceEndpointScale";
import { HUMAN_BODY_MEASUREMENTS } from "../constants/HUMAN_BODY_MEASUREMENTS";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyChannelScale } from "../structures/IAutoMovieHumanBodyChannelScale";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { evaluateHumanBodyMeasurement } from "./evaluateHumanBodyMeasurement";

/**
 * Measure every channel's metric effect on an admitted body basis, in metres.
 *
 * The body editor calls this once per loaded basis and prints the result
 * beside each control: the per-unit RMS displacement, peak and moved vertex
 * count as the face reports them, plus, for a channel with a rule in
 * `HUMAN_BODY_MEASUREMENTS`, the rule evaluated on the shaped surface at the
 * neutral and at each endpoint's full weight. That is what turns the weight of
 * `measureBustCirc` into "bust girth 940 mm, +38 mm per unit" on the screen,
 * and what lets a caller convert a typed millimetre value into a weight by the
 * chord between the two evaluations.
 *
 * Rules run on the shape alone (identity omitted, no pose), through the same
 * `humanBodyBasisWeights` and `evaluateHumanBodyShape` the builder uses, so a
 * value measured here is the value the built body has. A rule whose landmarks
 * the basis lacks, or whose plane finds no closed loop, reports null values.
 * The basis is read, never mutated, and is expected to have passed
 * `assertHumanBodyBasis`; an empty surface population is refused here because
 * an RMS over nothing would publish NaN.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Turns each channel's dimensionless weight into a stated measurement with its neutral value and per-unit change, and reports the unmeasurable ones as such.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Evaluates the RMS, peak and count per endpoint and the girth, distance, height and breadth rules at neutral and both endpoints.
 */
export function measureHumanBodyBasisChannels(
  basis: IAutoMovieHumanBodyBasis,
): IAutoMovieHumanBodyChannelScale[] {
  const resident = basis.surfaces.reduce(
    (total, surface) => total + surface.positions.length / 3,
    0,
  );
  if (resident === 0)
    throw new Error("A body basis needs resident vertices to measure.");
  const scale = (name: string): IAutoMovieHumanFaceEndpointScale => {
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
  const evaluateRule = (
    rule: IAutoMovieHumanBodyMeasurement,
    shape: Record<string, number>,
  ): number | null => evaluateHumanBodyMeasurement(basis, shape, rule);
  return basis.channels.map((channel) => {
    const rule = HUMAN_BODY_MEASUREMENTS[channel.id];
    return {
      id: channel.id,
      group: channel.group,
      positive: scale(channel.positive),
      negative: channel.negative === null ? null : scale(channel.negative),
      measurement:
        rule === undefined
          ? null
          : {
              id: channel.id,
              kind: rule.kind,
              neutral: evaluateRule(rule, {}),
              positive: evaluateRule(rule, { [channel.id]: channel.maximum }),
              negative:
                channel.negative === null
                  ? null
                  : evaluateRule(rule, { [channel.id]: channel.minimum }),
            },
    };
  });
}
