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
