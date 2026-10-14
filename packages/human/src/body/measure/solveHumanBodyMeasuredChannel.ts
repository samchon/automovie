import { humanSkinLandmark } from "../../common/basis/humanSkinLandmark";
import { invertHumanMeasurement } from "../../common/measure/invertHumanMeasurement";
import type { IAutoMovieHumanBodyMeasuredChannelProps } from "../structures/IAutoMovieHumanBodyMeasuredChannelProps";
import type { IAutoMovieHumanBodyMeasuredChannelSolution } from "../structures/IAutoMovieHumanBodyMeasuredChannelSolution";
import { evaluateHumanBodyMeasurement } from "./evaluateHumanBodyMeasurement";
import { humanBodyChannelReach } from "./humanBodyChannelReach";
import { humanBodyChannelReading } from "./humanBodyChannelReading";
import { humanBodyMeasurementRule } from "./humanBodyMeasurementRule";
import { orientHumanBodyMeasurement } from "./orientHumanBodyMeasurement";

/**
 * Solve one detailed body measurement in metres while other authored parameters stay fixed.
 *
 * An own or exterior-table-bound rule supplies the actual rest-skin instrument, optionally oriented to a requested side. The channel's source envelope is clipped before missing corrective activation; this remains an evaluability interval rather than an independently certified physiological range. A missing channel/rule or named skin level refuses, and each trial copies the shape while changing only that channel, deleting its zero entry.
 *
 * The shared invertHumanMeasurement owner requires a finite nondegenerate ordered bracket, retains equivalent current readings and uses half the 0.1mm editor interval for numerical acceptance. It refuses unreachable endpoint targets, unavailable/nonfinite readings and sampled reversals; sampled checks do not prove global monotonicity, unique solutions or biological validity. No endpoint is extrapolated or second channel changed to conceal a failed target. The worker runs this synchronous geometric solve off the page thread.
 *
 * @evidence contracts/common.md#principled-implementation Named channel and own/table/explicit instrument admission precede optional side orientation, source-reach clipping and shared scalar inversion over actual freshly evaluated rest-skin trials.
 * @evidence contracts/common.md#clear-and-simple-design This owner supplies one channel's copied trial shapes and instrument readings while rule lookup, orientation, reach and numerical bracketing remain dedicated shared owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing instruments/witnesses and unreachable or sampled-reversing responses refuse; no extrapolated endpoint, secondary channel or geometric reading can certify physiological range or global monotonicity.
 * @evidence contracts/common.md#meaningful-documentation The prose gives metre target, half-readout numerical policy, nondegenerate bracket premise, zero-entry deletion, fixed other parameters and exterior versus clinical scope.
 * @evidence contracts/performance.md#efficient-algorithms Declaration/reach scans precede K inverse trials, each paying shape copying, actual weight/skin evaluation and the selected instrument cost; numerical inverse state stays scalar.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing rule/orientation/reach and inverse owners are shared with editors and exterior solvers, while each changed trial shape receives its own measurement geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Trial readers/arrays expire between synchronous readings and only the owned solved shape plus actual metre value escape, without source handles, prior candidate cache or background task.
 */
export function solveHumanBodyMeasuredChannel(
  input: IAutoMovieHumanBodyMeasuredChannelProps,
): IAutoMovieHumanBodyMeasuredChannelSolution {
  const {
    basis,
    shape,
    channel: id,
    targetMetres,
  }: IAutoMovieHumanBodyMeasuredChannelProps = input;
  const channel: (typeof basis.channels)[number] | undefined =
    basis.channels.find(
      (one: (typeof basis.channels)[number]): boolean => one.id === id,
    );
  // an omitted reading is the channel's own rule, or the rule and side the
  // exterior target table binds a one-sided channel to
  const measurement: IAutoMovieHumanBodyMeasuredChannelProps["measurement"] =
    input.measurement ?? humanBodyChannelReading(id);
  const reading: string = measurement?.rule ?? id;
  const authored: ReturnType<typeof humanBodyMeasurementRule> =
    humanBodyMeasurementRule(reading);
  if (channel === undefined || authored === undefined)
    throw new Error(
      "A detailed body measurement needs a named measured channel: " +
        id +
        (reading === id ? "" : " read by " + reading),
    );
  const side: NonNullable<typeof measurement>["side"] = measurement?.side;
  const rule: NonNullable<typeof authored> =
    side === undefined
      ? authored
      : orientHumanBodyMeasurement(reading, authored, side);
  const label: string = side === undefined ? id : `${id} (${side} ${reading})`;
  // a rule placed at a named skin point refuses by that name on a basis
  // that does not declare it, rather than as an unmeasurable body
  if (rule.kind !== "distance" && "level" in rule)
    humanSkinLandmark(basis, rule.level);
  const worn: (weight: number) => Record<string, number> = (
    weight: number,
  ): Record<string, number> => {
    const trial: Record<string, number> = { ...shape };
    if (weight === 0) delete trial[id];
    else trial[id] = weight;
    return trial;
  };
  const read: (weight: number) => number = (weight: number): number => {
    const value: number | null = evaluateHumanBodyMeasurement(
      basis,
      worn(weight),
      rule,
    );
    if (value === null)
      throw new Error("The current body cannot measure " + label + ".");
    return value;
  };
  // the envelope cut where the basis lacks a target the channel would drive
  const reach: ReturnType<typeof humanBodyChannelReach> = humanBodyChannelReach(
    basis,
    channel,
  );
  const result: ReturnType<typeof invertHumanMeasurement> =
    invertHumanMeasurement({
      range: [reach.minimum, reach.maximum],
      current: shape[id] ?? 0,
      targetMetres,
      read,
      label,
    });
  return { shape: worn(result.weight), actualMetres: result.actualMetres };
}
