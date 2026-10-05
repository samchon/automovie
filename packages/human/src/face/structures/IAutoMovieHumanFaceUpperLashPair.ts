import type { IPortraitEyelashProfile } from "../anatomy/lash/IPortraitEyelashProfile";

/**
 * The upper lash row's profile for each eye.
 *
 * Each side takes one `IPortraitEyelashProfile`: maximum centreline length,
 * launch elevation, curl, fan, root radius, taper and per-strand variation,
 * within that profile's authoring envelopes.
 *
 * @evidence contracts/common.md#principled-implementation Each side reuses the one lash profile definition and its envelopes.
 * @evidence contracts/common.md#clear-and-simple-design Two named sides.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No asset name or subject selects behaviour; a missing registration refuses by name.
 * @evidence contracts/common.md#meaningful-documentation States units, omission and the refusal without registration.
 * @evidence contracts/modeling.md#spatial-conventions Lengths are millimetres and angles degrees in the head frame, as the profile states.
 * @evidence contracts/modeling.md#parameter-channels Seven named shape inputs per side, independent of the skin channels.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The periocular registration names the parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The face builder emits geometry.
 * @evidence contracts/modeling.md#shared-boundaries Lashes root on the registered live lid margin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The profile states its bounds are authoring envelopes, not a measured population.
 * @evidence contracts/anatomy.md#permitted-range Admission applies the profile's own envelopes.
 * @evidence contracts/anatomy.md#parametric-authority Named dimensions only; no vertex or sculpt offset.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceUpperLashPair {
  /** Lash profile of the anatomical left eye. */
  left: IPortraitEyelashProfile;

  /** Lash profile of the anatomical right eye. */
  right: IPortraitEyelashProfile;
}
