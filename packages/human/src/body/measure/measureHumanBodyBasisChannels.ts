import type { IAutoMovieHumanFaceEndpointScale } from "../../face/structures/IAutoMovieHumanFaceEndpointScale";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyChannelScale } from "../structures/IAutoMovieHumanBodyChannelScale";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { createHumanBodyMeasurementReader } from "./createHumanBodyMeasurementReader";
import { evaluateHumanBodyMeasurement } from "./evaluateHumanBodyMeasurement";
import { humanBodyMeasurementRule } from "./humanBodyMeasurementRule";

/**
 * Measure every channel's metric effect on an admitted body basis, in metres.
 *
 * The body editor calls this once per loaded basis for channels with a public
 * measurement rule; diagnostic callers may omit `measuredOnly` to inspect
 * every legacy channel's geometric displacement. For an authored rule, the
 * result includes the shaped surface measurement at neutral and at each
 * endpoint's full weight. The editor uses these measured endpoints to state
 * the available reach in millimetres. Its detailed input solver reads the
 * current body and inverts that same rule for a requested metric target.
 *
 * Rules run on the shape alone (identity omitted, no pose), through the same
 * `humanBodyBasisWeights` and `evaluateHumanBodyShape` the builder uses, so a
 * value measured here is the value the built body has. A rule whose landmarks
 * the basis lacks, or whose plane finds no closed loop, reports null values.
 * Every channel's neutral rule reads one lazily compiled rest skin; positive
 * and negative endpoints remain separate shaped bodies and are each evaluated
 * independently.
 * The basis is read, never mutated, and is expected to have passed
 * `assertHumanBodyBasis`; an empty surface population is refused here because
 * an RMS over nothing would publish NaN.
 *
 */
export function measureHumanBodyBasisChannels(
  basis: IAutoMovieHumanBodyBasis,
  options: { measuredOnly?: boolean } = {},
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
  let neutralReader: ReturnType<typeof createHumanBodyMeasurementReader> | undefined;
  const neutralRule = (rule: IAutoMovieHumanBodyMeasurement): number | null =>
    (neutralReader ??= createHumanBodyMeasurementReader(basis, {})).read(rule);
  return basis.channels
    .filter(
      (channel) =>
        options.measuredOnly !== true ||
        humanBodyMeasurementRule(channel.id) !== undefined,
    )
    .map((channel) => {
      const rule = humanBodyMeasurementRule(channel.id);
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
                neutral: neutralRule(rule),
                positive: evaluateRule(rule, { [channel.id]: channel.maximum }),
                negative:
                  channel.negative === null
                    ? null
                    : evaluateRule(rule, { [channel.id]: channel.minimum }),
              },
      };
    });
}
