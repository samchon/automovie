import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { humanSkinLandmark } from "../../common/basis/humanSkinLandmark";
import { evaluateHumanBodyMeasurement } from "./evaluateHumanBodyMeasurement";
import { humanBodyMeasurementRule } from "./humanBodyMeasurementRule";
import { invertHumanBodyMeasurement } from "./invertHumanBodyMeasurement";

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
 * `invertHumanBodyMeasurement` owns the bracket and 0.1 mm readout precision;
 * this owner supplies the actual section or landmark reading at each candidate
 * weight and returns a fresh shape. The caller runs it off the page thread.
 * A rule about the exterior remains an exterior measurement; it does not
 * measure internal bone or tissue volume.
 *
 * @evidence contracts/common.md#principled-implementation The named rule defines the instrument and the actual shaped-skin reading at each candidate weight is inverted along the one channel by the bracketing inverse, so the returned weight reproduces the target within half the 0.1 mm readout whenever the response is bracket-consistent. A zero weight deletes the key so a neutral channel stays absent from the shape. A flat, reversing, discontinuous or out-of-reach response is refused by the inverse instead of extrapolated, and the rest of the shape stays fixed.
 * @evidence contracts/common.md#clear-and-simple-design One adapter supplies the rule's reading to the numerical inverse and returns a fresh shape; bracket logic, rule lookup and skin evaluation have separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No second channel is changed to hide an error and no target, channel or person is special-cased; an unmeasured id is refused.
 * @evidence contracts/common.md#meaningful-documentation States the instrument, the refusals, the one-channel scope, that the source envelope is not a certified physiological interval, and that the call returns a fresh shape and is run off the page thread.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part or group.
 * @evidence contracts/modeling.md#parameter-channels It reads the one channel's source envelope as its weight range, the neutral zero as an absent key and the current weight as the starting point, and it changes no other weight. Other channels that move the same reading remain as the shape gives them, so a coupled request belongs to the simultaneous solver. It establishes no independence between channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits a shape record and no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Targets and readings are metres on the shaped rest skin and weights are dimensionless; no frame or unit is converted.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no surface or boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part or joint; the builder displays the body this weight shapes.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The measurement rule owns the instrument's definition and source; this solver carries no anatomical value.
 * @evidence contracts/anatomy.md#permitted-range A metric target is admitted only inside the reach the actual readings span over the channel's source envelope and is otherwise refused with that reach and no clamping. The envelope is a source range and not a certified physiological interval, and combinations with other channels are read on the shape as given rather than bounded here.
 * @evidence contracts/anatomy.md#parametric-authority It converts a named measurement in metres into the named channel's weight by inverting the actual rule deterministically, and it refuses a channel with no rule. Only a measured channel id and a metric target enter, so no input addresses a vertex, curve, strand or patch.
 */
export function solveHumanBodyMeasuredChannel(input: {
  basis: IAutoMovieHumanBodyBasis;
  shape: Readonly<Record<string, number>>;
  channel: string;
  targetMetres: number;
}): { shape: Record<string, number>; actualMetres: number } {
  const { basis, shape, channel: id, targetMetres } = input;
  const channel = basis.channels.find((one) => one.id === id);
  const rule = humanBodyMeasurementRule(id);
  if (channel === undefined || rule === undefined)
    throw new Error(
      "A detailed body measurement needs a named measured channel: " + id,
    );
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
      throw new Error("The current body cannot measure " + id + ".");
    return value;
  };
  const result = invertHumanBodyMeasurement({
    range: [channel.minimum, channel.maximum],
    current: shape[id] ?? 0,
    targetMetres,
    read,
    label: id,
  });
  return { shape: worn(result.weight), actualMetres: result.actualMetres };
}
