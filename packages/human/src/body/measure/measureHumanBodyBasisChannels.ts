import type { IAutoMovieHumanEndpointScale } from "../../common/structures/IAutoMovieHumanEndpointScale";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyChannelScale } from "../structures/IAutoMovieHumanBodyChannelScale";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { createHumanBodyMeasurementReader } from "./createHumanBodyMeasurementReader";
import { evaluateHumanBodyMeasurement } from "./evaluateHumanBodyMeasurement";
import type { IAutoMovieHumanBodyChannelScaleOptions } from "../structures/IAutoMovieHumanBodyChannelScaleOptions";
import { humanBodyChannelReading } from "./humanBodyChannelReading";
import { humanBodyMeasurementRule } from "./humanBodyMeasurementRule";
import { orientHumanBodyMeasurement } from "./orientHumanBodyMeasurement";

/**
 * Measure every channel's metric effect on an admitted body basis, in metres.
 *
 * The body editor calls this once per loaded basis for channels with a public
 * measurement rule, either their own or the rule and side the exterior target
 * table binds a one-sided channel to (`humanBodyChannelReading`); diagnostic callers may omit `measuredOnly` to inspect
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
 *
 * @evidence contracts/common.md#principled-implementation Each endpoint scale is the root mean square of the sparse rows' offsets over every resident vertex, so a vertex a target does not move counts as zero, and the peak is the largest single row offset. The rule readings at neutral and at each endpoint's full weight go through the shared shape evaluator the builder uses, so they equal what the built body measures. The premises are an admitted basis whose rows address each moved vertex once, and a nonempty surface population, which is refused so that no RMS over nothing publishes NaN.
 * @evidence contracts/common.md#clear-and-simple-design One report function over the basis; the rule table, the shape evaluator and the shared reader own the instruments, and the only local state is one lazily built neutral reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No channel, basis or measurement is special-cased; a rule the basis cannot answer reports null instead of a substituted value.
 * @evidence contracts/common.md#meaningful-documentation States the callers, the optional diagnostic scope, the units, the shape-only reading, the null results for unanswerable rules and the empty-population refusal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part or group; it reports per-channel scales.
 * @evidence contracts/modeling.md#parameter-channels It consumes each channel's declared neutral (the empty shape), its positive endpoint at the maximum weight and its optional negative endpoint at the minimum weight, each read as a separate shaped body. A channel without a negative target reports null instead of a mirrored value, and no left/right pairing is inferred, so a pair is reported as two channels. It defines no channel and does not establish that channels vary independent traits.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits scale records and no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Row offsets and rule readings are metres in the rest body's frame, shape weights are dimensionless, and no unit or frame is converted here.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface or boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It reports numbers and owns no part, group or joint a viewer displays.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The measurement rule table owns each instrument's definition and source; this report carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It reports the reach of existing channel envelopes and admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input; the editor uses its reported reach and the inverse owner converts a target.
 */
export function measureHumanBodyBasisChannels(
  basis: IAutoMovieHumanBodyBasis,
  options: IAutoMovieHumanBodyChannelScaleOptions = {},
): IAutoMovieHumanBodyChannelScale[] {
  const resident = basis.surfaces.reduce(
    (total, surface) => total + surface.positions.length / 3,
    0,
  );
  if (resident === 0)
    throw new Error("A body basis needs resident vertices to measure.");
  const scale = (name: string): IAutoMovieHumanEndpointScale => {
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
  let neutralReader:
    | ReturnType<typeof createHumanBodyMeasurementReader>
    | undefined;
  const neutralRule = (rule: IAutoMovieHumanBodyMeasurement): number | null =>
    (neutralReader ??= createHumanBodyMeasurementReader(basis, {})).read(rule);
  return basis.channels
    .filter(
      (channel) =>
        options.measuredOnly !== true ||
        humanBodyChannelReading(channel.id) !== undefined,
    )
    .map((channel) => {
      const reading = humanBodyChannelReading(channel.id);
      const authored = reading === undefined ? undefined : humanBodyMeasurementRule(reading.rule);
      const rule =
        reading === undefined || authored === undefined
          ? undefined
          : reading.side === undefined
            ? authored
            : orientHumanBodyMeasurement(reading.rule, authored, reading.side);
      return {
        id: channel.id,
        group: channel.group,
        positive: scale(channel.positive),
        negative: channel.negative === null ? null : scale(channel.negative),
        measurement:
          rule === undefined || reading === undefined
            ? null
            : {
                id: reading.rule,
                ...(reading.side === undefined ? {} : { side: reading.side }),
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
