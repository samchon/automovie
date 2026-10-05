import type { IAutoMovieHumanFaceLowerLashProfile } from "../anatomy/lash/IAutoMovieHumanFaceLowerLashProfile";

/**
 * The lower lash row's profile for each eye.
 *
 * Each side takes one `IAutoMovieHumanFaceLowerLashProfile`, whose angles use
 * the lower row's mirrored frame and whose bounds are a stated convention.
 *
 * @evidence contracts/common.md#principled-implementation Each side reuses the one lower-lash profile definition and its envelope.
 * @evidence contracts/common.md#clear-and-simple-design Two named sides.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No asset name or subject selects behaviour; a missing registration refuses by name.
 * @evidence contracts/common.md#meaningful-documentation States the frame and the convention.
 * @evidence contracts/modeling.md#spatial-conventions The profile states its mirrored head-frame angles and units.
 * @evidence contracts/modeling.md#parameter-channels Seven named shape inputs per side, independent of the skin channels.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The periocular registration names the parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The lash generator emits geometry.
 * @evidence contracts/modeling.md#shared-boundaries Lashes root on the registered live lower margin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The profile states its conventional bounds.
 * @evidence contracts/anatomy.md#permitted-range Admission applies the lower-lash convention envelope.
 * @evidence contracts/anatomy.md#parametric-authority Named dimensions only; no vertex or sculpt offset.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLowerLashPair {
  /** Lower lash profile of the anatomical left eye. */
  left: IAutoMovieHumanFaceLowerLashProfile;

  /** Lower lash profile of the anatomical right eye. */
  right: IAutoMovieHumanFaceLowerLashProfile;
}
