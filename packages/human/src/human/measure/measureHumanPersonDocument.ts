import { HUMAN_PERSON_MEASUREMENTS } from "../constants/HUMAN_PERSON_MEASUREMENTS";
import type { IAutoMovieHumanPersonDocumentMeasurementProps } from "../structures/IAutoMovieHumanPersonDocumentMeasurementProps";
import type { IAutoMovieHumanPersonMeasurementReading } from "../structures/IAutoMovieHumanPersonMeasurementReading";
import { readHumanPersonGirth } from "./readHumanPersonGirth";
import { readHumanPersonRest } from "./readHumanPersonRest";
import { restHumanPersonDocument } from "./restHumanPersonDocument";

/**
 * Measure a person document with the person measurement named by a body
 * channel, at rest.
 *
 * The protocols measure a standing person, so the person is read at rest. A
 * girth builds the document in that posture (`restHumanPersonDocument`) on
 * the caller's one-skin evaluator and reads the final Float32 skin
 * (`readHumanPersonGirth`). Stature reads the closed rest skin
 * (`readHumanPersonRest`), whose Float32 positions equal the full
 * evaluator's at every source sample.
 * The editor's current reading and every trial of
 * `solveHumanPersonMeasuredChannel` take this same reading. An unknown
 * measurement, or a skin the instrument cannot close, refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation One rest reading serves the display and the solve, so both read the same instrument on the same posture.
 * @evidence contracts/common.md#clear-and-simple-design Look up, rest, build, read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A posed or expressive document is measured at rest, never on its posed skin, and an unreadable skin refuses.
 * @evidence contracts/common.md#meaningful-documentation States the posture, the instrument, its consumers and the refusals.
 * @evidence contracts/modeling.md#spatial-conventions The reading is metres in the model frame.
 * @evidence contracts/anatomy.md#anatomical-source Measures in the standing posture the cited protocol states.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The channel id names a rule; no channel is changed.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The evaluator emits the geometry; the function reads it.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The instrument reads across the boundary but builds none.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function measureHumanPersonDocument(
  props: IAutoMovieHumanPersonDocumentMeasurementProps,
): IAutoMovieHumanPersonMeasurementReading {
  const rule = Object.hasOwn(HUMAN_PERSON_MEASUREMENTS, props.channel)
    ? HUMAN_PERSON_MEASUREMENTS[props.channel]
    : undefined;
  if (rule === undefined)
    throw new Error(
      "No person measurement is named by the body channel " +
        props.channel +
        ".",
    );
  if (rule.kind === "stature")
    return {
      metres: readHumanPersonRest(props.compiled, props.document).statureMetres,
    };
  const built = props.build(restHumanPersonDocument(props.document));
  const reading = readHumanPersonGirth(
    built.model,
    built.body.landmarks,
    rule,
    props.compiled.generation.body,
  );
  if (reading === null)
    throw new Error("The current person cannot measure " + props.channel + ".");
  return reading;
}
