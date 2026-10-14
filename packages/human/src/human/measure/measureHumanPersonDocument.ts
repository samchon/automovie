import { HUMAN_PERSON_MEASUREMENTS } from "../constants/HUMAN_PERSON_MEASUREMENTS";
import type { IAutoMovieHumanPersonDocumentMeasurementProps } from "../structures/IAutoMovieHumanPersonDocumentMeasurementProps";
import type { IAutoMovieHumanPersonMeasurementReading } from "../structures/IAutoMovieHumanPersonMeasurementReading";
import { readHumanPersonGirth } from "./readHumanPersonGirth";
import { readHumanPersonRest } from "./readHumanPersonRest";
import { restHumanPersonDocument } from "./restHumanPersonDocument";

/**
 * Read the person protocol registered for a body channel in metres. Stature uses the source-rest shortcut, which clears explicit body motion goals and omits later closure/contact production. Girth instead builds the document after clearing only body pose/shoulders and face expression, so its other motion/closure controls remain. Neither route establishes an unconditional standing-neutral equivalence. Source head orientation and landmark acquisition retain their registry qualifications.
 *
 * @evidence contracts/common.md#principled-implementation The channel's actual registered stature/girth rule determines the reader and source-owned final geometry/landmarks answer it.
 * @evidence contracts/common.md#clear-and-simple-design Dispatch owns protocol selection only; rest preparation, paired geometry and contour measurement remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown protocols and unavailable girths refuse by name, and no body-only proxy or unconditional clinical/rest qualification substitutes for the actual instrument.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes shortcut/full-build routes, retained controls, metres and source acquisition limits.
 * @evidence contracts/performance.md#efficient-algorithms Protocol lookup is fixed registry access; stature pays paired rest geometry and girth pays full build plus its actual source/section scans.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This dispatcher owns no performed-document cache; every reading delegates the supplied trial to the selected reader/build context.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Built geometry is call-local and only scalar/section reading escapes; no worker, source fetch or continuing render resource is acquired.
 */
export function measureHumanPersonDocument(
  props: IAutoMovieHumanPersonDocumentMeasurementProps,
): IAutoMovieHumanPersonMeasurementReading {
  const rule: (typeof HUMAN_PERSON_MEASUREMENTS)[string] | undefined =
    Object.hasOwn(HUMAN_PERSON_MEASUREMENTS, props.channel)
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
  const built: ReturnType<typeof props.build> = props.build(
    restHumanPersonDocument(props.document),
  );
  const reading: ReturnType<typeof readHumanPersonGirth> = readHumanPersonGirth(
    built.model,
    built.body.landmarks,
    rule,
    props.compiled.generation.body,
  );
  if (reading === null)
    throw new Error("The current person cannot measure " + props.channel + ".");
  return reading;
}
