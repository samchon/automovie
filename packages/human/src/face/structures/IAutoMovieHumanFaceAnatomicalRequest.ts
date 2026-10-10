import type { IAutoMovieHumanFaceAnatomicalParameters } from "../parameters/IAutoMovieHumanFaceAnatomicalParameters";
import type { IAutoMovieHumanFaceMeasurementTarget } from "./IAutoMovieHumanFaceMeasurementTarget";

/**
 * A face document's anatomical record: requested measurement targets and
 * clinical observations, resolved by the face anatomical resolver.
 *
 * Each target is solved by the editor onto existing channels and stored with
 * them; each observation field is either kept as an observation that does not
 * change shape or refused by name where the basis cannot represent it. A
 * field the resolver has no rule for is refused rather than ignored. Omission
 * changes nothing; a static asset does not restore this record.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceAnatomicalRequest {
  /** Requested measurement values, solved onto existing channels by the editor. */
  targets?: IAutoMovieHumanFaceMeasurementTarget[];

  /** Clinical observations, kept unchanged or refused by name. */
  observations?: IAutoMovieHumanFaceAnatomicalParameters;
}
