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
 * Solve one detailed body measurement in metres while every other authored
 * parameter remains fixed.
 *
 * A named rule in `HUMAN_BODY_MEASUREMENTS` defines the instrument: a tape
 * section, landmark distance, breadth or height on the same shaped skin the
 * builder uses. The corresponding basis channel supplies a finite source
 * envelope, not an independently certified physiological interval. Rather
 * than asking the user to choose a morph weight or vertex
 * offset, this function inverts the actual body measurement along that one
 * channel. It refuses a target outside the measured reach, an unmeasurable
 * basis, or a section response that reverses inside the bracket. No endpoint
 * is extrapolated and no second channel is changed to hide an error.
 *
 * `invertHumanMeasurement` owns the bracket and 0.1 mm readout precision;
 * this owner supplies the actual section or landmark reading at each candidate
 * weight and returns a fresh shape. The caller runs it off the page thread.
 * A rule about the exterior remains an exterior measurement; it does not
 * measure internal bone or tissue volume.
 *
 * By default the instrument is the rule the solved channel names. A
 * one-sided channel with no rule of its own (`upperarmScaleHorizRight`) is
 * read by `measurement`: an authored rule oriented to the requested side by
 * `orientHumanBodyMeasurement`, so the right arm's girth is the left rule
 * read on the right arm and no rule is copied. The bracket is the channel's
 * evaluable reach (`humanBodyChannelReach`), so a basis that lacks a
 * corrective target the channel drives refuses past its onset by the reach,
 * not by the missing target.
 */
export function solveHumanBodyMeasuredChannel(
  input: IAutoMovieHumanBodyMeasuredChannelProps,
): IAutoMovieHumanBodyMeasuredChannelSolution {
  const { basis, shape, channel: id, targetMetres } = input;
  const channel = basis.channels.find((one) => one.id === id);
  // an omitted reading is the channel's own rule, or the rule and side the
  // exterior target table binds a one-sided channel to
  const measurement = input.measurement ?? humanBodyChannelReading(id);
  const reading = measurement?.rule ?? id;
  const authored = humanBodyMeasurementRule(reading);
  if (channel === undefined || authored === undefined)
    throw new Error(
      "A detailed body measurement needs a named measured channel: " +
        id +
        (reading === id ? "" : " read by " + reading),
    );
  const side = measurement?.side;
  const rule =
    side === undefined
      ? authored
      : orientHumanBodyMeasurement(reading, authored, side);
  const label = side === undefined ? id : `${id} (${side} ${reading})`;
  // a rule placed at a named skin point refuses by that name on a basis
  // that does not declare it, rather than as an unmeasurable body
  if (rule.kind !== "distance" && "level" in rule)
    humanSkinLandmark(basis, rule.level);
  const worn = (weight: number): Record<string, number> => {
    const trial = { ...shape };
    if (weight === 0) delete trial[id];
    else trial[id] = weight;
    return trial;
  };
  const read = (weight: number): number => {
    const value = evaluateHumanBodyMeasurement(basis, worn(weight), rule);
    if (value === null)
      throw new Error("The current body cannot measure " + label + ".");
    return value;
  };
  // the envelope cut where the basis lacks a target the channel would drive
  const reach = humanBodyChannelReach(basis, channel);
  const result = invertHumanMeasurement({
    range: [reach.minimum, reach.maximum],
    current: shape[id] ?? 0,
    targetMetres,
    read,
    label,
  });
  return { shape: worn(result.weight), actualMetres: result.actualMetres };
}
