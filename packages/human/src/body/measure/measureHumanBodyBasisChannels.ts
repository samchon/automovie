import type { IAutoMovieHumanEndpointScale } from "../../common/structures/IAutoMovieHumanEndpointScale";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyChannelScale } from "../structures/IAutoMovieHumanBodyChannelScale";
import type { IAutoMovieHumanBodyChannelScaleOptions } from "../structures/IAutoMovieHumanBodyChannelScaleOptions";
import type { IAutoMovieHumanBodyMeasurement } from "../structures/IAutoMovieHumanBodyMeasurement";
import { createHumanBodyMeasurementReader } from "./createHumanBodyMeasurementReader";
import { evaluateHumanBodyMeasurement } from "./evaluateHumanBodyMeasurement";
import { humanBodyChannelReading } from "./humanBodyChannelReading";
import { humanBodyMeasurementRule } from "./humanBodyMeasurementRule";
import { orientHumanBodyMeasurement } from "./orientHumanBodyMeasurement";

/**
 * Measure every channel's metric effect on an admitted body basis, in metres.
 *
 * Editors select channels with declared own/exterior-table instruments; diagnostic callers can also retain unmeasured channels. Raw target displacement gives an RMS over every resident vertex and a peak at unit target weight, counting present sparse rows. Basis admission rejects all-zero displacement rows; this diagnostic reads the admitted arrays without readmitting or rewriting them. These source-array scales differ from metric rules evaluated at the channel's actual minimum/maximum weights. Missing target rows contribute zero displacement rather than certifying endpoint availability.
 *
 * Metric readings use the shared weight/shape/instrument owners on unposed candidates, with one lazy neutral skin and separate positive/negative endpoint bodies. Missing instrument witnesses return null, while source evaluation failures propagate. Inputs must be an admitted basis with representable target arithmetic; no shape identity, performed motion or clinical/physiological acceptance is inferred. Source arrays remain unchanged, and an empty resident population refuses before RMS division.
 *
 * @evidence contracts/common.md#principled-implementation Admitted source target rows yield unit-weight whole-population RMS/peak scales while own/table/side instruments read neutral and actual channel-weight endpoints through the shared rest-body evaluator.
 * @evidence contracts/common.md#clear-and-simple-design Raw displacement diagnostics remain separate from metric rule readings, with one lazily shared neutral reader and distinct endpoint evaluations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty populations refuse and inherited target properties are not rows; missing rows are zero diagnostic displacement rather than proof of endpoint availability, and geometry metrics cannot certify physiology.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes unit target scales from actual endpoint weights, sparse row count, metre outputs, representable admitted inputs, null witnesses and propagated source failures.
 * @evidence contracts/performance.md#efficient-algorithms Each selected endpoint scans surfaces/its sparse rows and metric endpoints incur actual shape/instrument work; declared-channel filtering and side lookup add table scans without a claimed fixed source-size cost.
 * @evidence contracts/performance.md#reuse-equivalent-work All neutral instruments share one unposed candidate while changed positive/negative channel endpoints remain separate; rule/orientation owners are reused across editor and solver paths.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The lazy neutral reader and endpoint temporaries expire after this synchronous report; owned scalar records escape with no prior shape cache, external handle or worker task.
 *
 */
export function measureHumanBodyBasisChannels(
  basis: IAutoMovieHumanBodyBasis,
  options: IAutoMovieHumanBodyChannelScaleOptions = {},
): IAutoMovieHumanBodyChannelScale[] {
  const resident: number = basis.surfaces.reduce(
    (total: number, surface: typeof basis.surfaces[number]): number => total + surface.positions.length / 3,
    0,
  );
  if (resident === 0)
    throw new Error("A body basis needs resident vertices to measure.");
  const scale: (name: string) => IAutoMovieHumanEndpointScale = (name: string): IAutoMovieHumanEndpointScale => {
    let sumOfSquares: number = 0;
    let largestSquare: number = 0;
    let rowCount: number = 0;
    for (const surface of basis.surfaces) {
      const rows: number[] | undefined = Object.hasOwn(surface.targets, name) ? surface.targets[name] : undefined;
      if (rows === undefined) continue;
      for (let i: number = 0; i < rows.length; i += 4) {
        const square: number =
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
  const evaluateRule: (rule: IAutoMovieHumanBodyMeasurement, shape: Record<string, number>) => number | null = (
    rule: IAutoMovieHumanBodyMeasurement,
    shape: Record<string, number>,
  ): number | null => evaluateHumanBodyMeasurement(basis, shape, rule);
  let neutralReader:
    | ReturnType<typeof createHumanBodyMeasurementReader>
    | undefined;
  const neutralRule: (rule: IAutoMovieHumanBodyMeasurement) => number | null = (rule: IAutoMovieHumanBodyMeasurement): number | null =>
    (neutralReader ??= createHumanBodyMeasurementReader(basis, {})).read(rule);
  return basis.channels
    .filter(
      (channel: typeof basis.channels[number]): boolean =>
        options.measuredOnly !== true ||
        humanBodyChannelReading(channel.id) !== undefined,
    )
    .map((channel: typeof basis.channels[number]): IAutoMovieHumanBodyChannelScale => {
      const reading: ReturnType<typeof humanBodyChannelReading> = humanBodyChannelReading(channel.id);
      const authored: ReturnType<typeof humanBodyMeasurementRule> =
        reading === undefined
          ? undefined
          : humanBodyMeasurementRule(reading.rule);
      const rule: IAutoMovieHumanBodyMeasurement | undefined =
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
