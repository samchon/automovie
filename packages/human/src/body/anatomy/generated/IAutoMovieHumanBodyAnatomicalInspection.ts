import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import type { IAutoMovieHumanBodyAnatomicalReference } from "./IAutoMovieHumanBodyAnatomicalReference";
import type { IAutoMovieHumanBodyArticularCandidate } from "./IAutoMovieHumanBodyArticularCandidate";
import type { IAutoMovieHumanBodyUnvalidatedGeometry } from "./IAutoMovieHumanBodyUnvalidatedGeometry";

/**
 * Explicit target-radius candidates in a neutral reference rig, not resolved anatomy.
 *
 * Requested body context remains separate from the reference frame. Absence
 * creates no radius prior, and neither sphere placement nor render replay
 * supplies a registered head centre, complete bone or validated body skin.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAnatomicalInspection {
  /** Executable inspector revision, distinct from clinical validation. */
  generatorRevision: string;

  /** Exact source reference; its neutral is not the requested person's skin. */
  reference: IAutoMovieHumanBodyAnatomicalReference;

  /** Owned copy of the body document's anatomical measurements. */
  requested: IAutoMovieHumanBodyAnatomicalMeasurements;

  /** This inspector does not generate or validate a whole exterior. */
  skin: IAutoMovieHumanBodyUnvalidatedGeometry;

  /** Only explicit targets produce a candidate; omitted sides remain unknown. */
  candidates: IAutoMovieHumanBodyArticularCandidate[];
}
