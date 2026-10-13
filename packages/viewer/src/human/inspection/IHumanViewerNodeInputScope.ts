/**
 * The checked Node loader's maintained source roots and explicit inputs.
 * The same scope feeds numerical startup witnesses and browser admission
 * revision recovery; numerical model cache dependencies remain independent.
 *
 * @evidence contracts/common.md#principled-implementation One explicit scope supplies the actual byte and membership witnesses used by checked numerical startup and its recovery notifications.
 * @evidence contracts/common.md#clear-and-simple-design Source roots and non-root configuration/loader files share one immutable input description.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No consumer-specific file exception or private compiler manifest substitutes for the existing source witness owner.
 * @evidence contracts/common.md#meaningful-documentation Separates checked-loader admission dependencies from face, body and person computation-cache inputs.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Names loader admission inputs whose errors or repairs can change which source generation can be displayed.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Keeps checked source closure explicit while numerical-domain cache identities remain separately owned.
 * @author Samchon
 */
export interface IHumanViewerNodeInputScope {
  /**
   * Actual maintained source directories, including their dynamic file membership.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Names source membership that can change checked loader admission even without a runtime import edge.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Supplies explicit checked source roots for browser admission freshness while numerical-cache graphs stay distinct.
   */
  directories: readonly string[];

  /**
   * Configuration, package and public loader files read outside those directories.
   *
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Names declared loader and configuration bytes outside maintained source roots.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Includes explicit non-root admission inputs without borrowing a private compiler runtime manifest.
   */
  files: readonly string[];
}
