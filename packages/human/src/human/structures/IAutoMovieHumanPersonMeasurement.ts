import type { IAutoMovieHumanPersonGirthMeasurement } from "./IAutoMovieHumanPersonGirthMeasurement";
import type { IAutoMovieHumanPersonStatureMeasurement } from "./IAutoMovieHumanPersonStatureMeasurement";

/**
 * A measurement rule the person evaluates on its whole connected skin: a tape girth across the head/body cut, or the stature of the closed skin.
 *
 * @evidence contracts/common.md#principled-implementation A kind-discriminated union separates joined-skin tape girth from closed-rest-skin stature so each instrument receives its own required protocol metadata.
 * @evidence contracts/common.md#clear-and-simple-design The two existing rule interfaces retain their respective fields without one flat record of irrelevant optional landmarks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supported instruments are closed to girth and stature rather than permitting a test-specific arbitrary measurement callback.
 * @evidence contracts/common.md#meaningful-documentation The union comment names whole connected skin, cross-cut tape girth and closed-skin stature; variants document their protocol details.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The discriminated whole-person instrument union specify data and signatures; numerical producers own their traversal strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Request equivalence is not implemented by the discriminated whole-person instrument union; consuming operations decide dependency-sensitive reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The discriminated whole-person instrument union acquire no external resource or running task; their containing value owns ordinary data retention.
 *
 * @author Samchon
 */
export type IAutoMovieHumanPersonMeasurement =
  | IAutoMovieHumanPersonGirthMeasurement
  | IAutoMovieHumanPersonStatureMeasurement;
