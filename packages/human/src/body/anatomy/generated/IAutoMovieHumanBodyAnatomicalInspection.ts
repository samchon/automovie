import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import type { IAutoMovieHumanBodyAnatomicalReference } from "./IAutoMovieHumanBodyAnatomicalReference";
import type { IAutoMovieHumanBodyArticularCandidate } from "./IAutoMovieHumanBodyArticularCandidate";
import type { IAutoMovieHumanBodyUnvalidatedGeometry } from "./IAutoMovieHumanBodyUnvalidatedGeometry";

/**
 * Explicit target-radius candidates in a neutral reference rig, not resolved anatomy.
 *
 * Requested body context remains separate from the reference frame. Absence creates no radius prior, and neither sphere placement nor render replay supplies a registered head centre, complete bone or validated body skin.
 *
 * @evidence contracts/common.md#principled-implementation Target-radius candidates stay separate from neutral rig provenance, owned requested measurements and unavailable whole-skin resolution.
 * @evidence contracts/common.md#clear-and-simple-design Executable revision/reference/qualification remain grouped without conflating requested person context and evaluated source frame.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted sides create no prior, and replay certifies neither registered centres, complete bones nor validated skin.
 * @evidence contracts/common.md#meaningful-documentation Members explain inspector revision, owned requests, neutral provenance and target-only candidates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Inspection records construct no spheres or body-rig evaluations themselves.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reference provenance qualifies output without owning shared neutral-rig caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owned measurements/candidates belong to their producer; this type owns no renderer/basis-loader lifetime.
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
