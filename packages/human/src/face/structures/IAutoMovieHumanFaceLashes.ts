import type { IAutoMovieHumanFaceLowerLashPair } from "./IAutoMovieHumanFaceLowerLashPair";
import type { IAutoMovieHumanFaceUpperLashPair } from "./IAutoMovieHumanFaceUpperLashPair";

/**
 * A document's independent lash profiles, upper and lower rows separately.
 *
 * A present row replaces that row's lash cards with numerical lashes rooted on
 * the registered live anterior lid edge, distinct from the posterior contact
 * margin. Count is explicit for each side, including zero. It needs the
 * basis's periocular and anterior root registrations; without them the builder refuses the document by name. An
 * omitted row keeps the basis's cards byte for byte.
 *
 * @evidence contracts/common.md#principled-implementation Upper and lower rows are separate inputs with their own profile types, matching their separate registered regions.
 * @evidence contracts/common.md#clear-and-simple-design Two optional named rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No asset name or subject selects behaviour; a missing registration refuses by name.
 * @evidence contracts/common.md#meaningful-documentation States units, omission and the refusal without registration.
 * @evidence contracts/modeling.md#spatial-conventions Each row's profile states its units and frame; the lower profile mirrors the upper angle frame.
 * @evidence contracts/modeling.md#parameter-channels Each row's profiles are named shape inputs independent of the skin channels.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The periocular registration names the parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The face builder emits geometry.
 * @evidence contracts/modeling.md#shared-boundaries Both rows root on the registered margins shared with the lids.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The upper profile states authoring envelopes and the lower profile a mirrored convention.
 * @evidence contracts/anatomy.md#permitted-range Admission applies each row's own envelope to every present side.
 * @evidence contracts/anatomy.md#parametric-authority Named dimensions only; no vertex or sculpt offset.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLashes {
  /** Upper lash row, or omitted to keep the basis's upper cards. */
  upper?: IAutoMovieHumanFaceUpperLashPair;

  /** Lower lash row, or omitted to keep the basis's lower cards. */
  lower?: IAutoMovieHumanFaceLowerLashPair;
}
