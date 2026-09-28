import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
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
    throw new Error("A detailed body measurement needs a named measured channel: " + id);
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
