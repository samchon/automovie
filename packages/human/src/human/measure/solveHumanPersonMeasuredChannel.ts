import { humanBodyMeasurementRule } from "../../body/measure/humanBodyMeasurementRule";
import { invertHumanMeasurement } from "../../common/measure/invertHumanMeasurement";
import { HUMAN_PERSON_MEASUREMENTS } from "../constants/HUMAN_PERSON_MEASUREMENTS";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonMeasuredChannelProps } from "../structures/IAutoMovieHumanPersonMeasuredChannelProps";
import type { IAutoMovieHumanPersonMeasuredChannelSolution } from "../structures/IAutoMovieHumanPersonMeasuredChannelSolution";
import type { IAutoMovieHumanPersonMeasurementReading } from "../structures/IAutoMovieHumanPersonMeasurementReading";
import { measureHumanPersonDocument } from "./measureHumanPersonDocument";

/**
 * Solve one person measurement in metres along its body channel, every other
 * authored value fixed.
 *
 * `HUMAN_PERSON_MEASUREMENTS` names the instrument, keyed by the body channel
 * that moves it. Each trial weight is read by `measureHumanPersonDocument`:
 * the actual person built at rest on the one-skin evaluator, its final
 * Float32 skin measured. The returned document
 * keeps the caller's pose and expression and changes only that channel.
 * `invertHumanMeasurement` owns the bracket, the 0.1 mm readout precision
 * and the refusals: a target outside the channel's reach, a reversing
 * response, or a skin that cannot be measured. No second channel moves to
 * hide a miss.
 *
 * The channel must move the whole skin it measures. A body endpoint whose
 * source rows reach the head partition acts there only through the head
 * view's driver of that endpoint. If the generation carries no such driver,
 * the solve refuses by name rather than fit a half-moved neck. A target
 * outside the measurement's source sample is solved and reported as
 * `outside-source-sample`, because that range describes the population the
 * source measured, not a limit on a person.
 *
 * @evidence contracts/common.md#principled-implementation One instrument, one channel and the shared inverse; the solve reads the actual final skin at every trial.
 * @evidence contracts/common.md#clear-and-simple-design Admission, a trial reader, the shared inverse and one final reading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A generation without the head rows is refused by name, and a target outside the source population is reported, not clamped.
 * @evidence contracts/common.md#meaningful-documentation States the instrument, the rest trial, what the result keeps and every refusal.
 * @evidence contracts/modeling.md#parameter-channels Changes only the one named body channel of the document.
 * @evidence contracts/modeling.md#spatial-conventions The target and the reading are metres.
 * @evidence contracts/anatomy.md#anatomical-source Reports whether the target lies within the source sample the measurement cites.
 * @evidence contracts/anatomy.md#permitted-range The reach is the channel's evaluated envelope on the actual skin; the population range bounds nothing.
 * @evidence contracts/anatomy.md#parametric-authority Converts a measured target into the channel weight that produces it.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The solver defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The evaluator emits the geometry; the solver only reads it.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The evaluator owns the boundary; the instrument reads across it.
 * @evidenceExclude contracts/modeling.md#rendered-observation The solver displays nothing.
 */
export function solveHumanPersonMeasuredChannel(
  props: IAutoMovieHumanPersonMeasuredChannelProps,
): IAutoMovieHumanPersonMeasuredChannelSolution {
  const { compiled, document, channel: id, targetMetres } = props;
  const generation = compiled.generation;
  const rule = Object.hasOwn(HUMAN_PERSON_MEASUREMENTS, id)
    ? HUMAN_PERSON_MEASUREMENTS[id]
    : undefined;
  const channel = generation.body.channels.find((one) => one.id === id);
  // one instrument per channel: a channel the body rule table measures is the body's
  if (
    rule === undefined ||
    channel === undefined ||
    humanBodyMeasurementRule(id) !== undefined
  )
    throw new Error(
      "A person measurement needs a body channel with a person measurement rule: " +
        id,
    );
  for (const endpoint of [channel.positive, channel.negative])
    if (
      endpoint !== null &&
      !(generation.drivers ?? []).some((driver) => driver.endpoint === endpoint)
    )
      throw new Error(
        `The generation ${generation.id} carries no head-partition rows of ${endpoint}, so ${id} would move only the body side of the measured site.`,
      );
  const worn = (weight: number): IAutoMovieHumanPersonDocument => {
    const next = structuredClone(document);
    if (weight === 0) delete next.body.shape[id];
    else next.body.shape[id] = weight;
    return next;
  };
  const read = (weight: number): IAutoMovieHumanPersonMeasurementReading =>
    measureHumanPersonDocument({
      compiled,
      build: props.build,
      document: worn(weight),
      channel: id,
    });
  const solved = invertHumanMeasurement({
    range: [channel.minimum, channel.maximum],
    current: document.body.shape[id] ?? 0,
    targetMetres,
    read: (weight) => read(weight).metres,
    label: id,
  });
  return {
    document: worn(solved.weight),
    reading: read(solved.weight),
    population:
      targetMetres >= rule.sampleMinimumMetres &&
      targetMetres <= rule.sampleMaximumMetres
        ? "within-source-sample"
        : "outside-source-sample",
  };
}
