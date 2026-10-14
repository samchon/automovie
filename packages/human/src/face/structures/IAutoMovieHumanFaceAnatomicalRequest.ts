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
 * @evidence contracts/common.md#principled-implementation Requested registered measurement targets remain distinct from clinical observations. Existing resolver/admission rules solve supported targets onto existing channels, retain observed-only fields or refuse named unsupported paths.
 * @evidence contracts/common.md#clear-and-simple-design Two optional owners keep targets and observations separate, with no parallel geometry or clinical fitting layer inside the record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown fields do not silently disappear, observed-only values do not change shape, and this type itself establishes no physical numeric ranges or supported inverse for every clinical quantity.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies editor resolution, kept/refused observations, omission and static-asset loss; each field states its distinct role.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This request shape runs no inverse solve, admission rule or measurement instrument.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Target/observation grouping defines no channel-solve cache or source correspondence reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The document owns its target list and observations; this declaration acquires no mesh or solver task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceAnatomicalRequest {
  /** Requested measurement values, solved onto existing channels by the editor. */
  targets?: IAutoMovieHumanFaceMeasurementTarget[];

  /** Clinical observations, kept unchanged or refused by name. */
  observations?: IAutoMovieHumanFaceAnatomicalParameters;
}
