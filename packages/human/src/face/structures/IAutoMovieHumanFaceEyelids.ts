import type { IAutoMovieHumanFaceLidSections } from "./IAutoMovieHumanFaceLidSections";

/**
 * Bilateral coarse lid-section identity; source blink, squint and gaze keep their existing motion owners.
 *
 * @evidence contracts/common.md#principled-implementation Independent authored section identity modifies the registered shared rest skin before source residual motion; actual cage incidence and assembled geometry remain the support/admission premises.
 * @evidence contracts/common.md#clear-and-simple-design Two optional LidSections owners assign laterality without mixing source blink/squint/gaze into identity fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coarse sections are not clinical wrinkle grades or independent tissue samples; missing source cage/row refuses and same-side prototype morphology cannot duplicate these controls.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies retained motion owners and members state anatomical sides and publisher-qualified shared skin.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type performs no section deformation or cage validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Side grouping defines no source-row or rest-geometry cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The document owns section records and no lid mesh/resource is acquired here.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEyelids {
  /** Anatomical left section identity on its publisher-qualified shared skin cage. */
  left?: IAutoMovieHumanFaceLidSections;

  /** Anatomical right section identity, independent of the left controls. */
  right?: IAutoMovieHumanFaceLidSections;
}
