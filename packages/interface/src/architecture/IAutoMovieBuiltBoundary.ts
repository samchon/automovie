import { IAutoMovieBoundaryFace } from "./IAutoMovieBoundaryFace";

/**
 * A separation shared by one interior/exterior region or a pair of regions.
 *
 * @evidence requirements/building-exterior/validation-and-interior-consistency.md#building-exterior-interior-shared-validation Exposes `IAutoMovieBuiltBoundary` as the portable data boundary for the building exterior interior shared validation requirement.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-linked-building-shared-facts Types `IAutoMovieBuiltBoundary` for the interior space linked building shared facts system contract.
 */
export interface IAutoMovieBuiltBoundary {
  /**
   * Stable boundary identity.
   *
   * @evidence requirements/building-exterior/validation-and-interior-consistency.md#building-exterior-interior-shared-validation Exposes `id` as the portable data boundary for the building exterior interior shared validation requirement.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-linked-building-shared-facts Types `id` for the interior space linked building shared facts system contract.
   */
  id: string;

  /**
   * Open semantic label such as `wall`, `floor`, `ceiling`, or `threshold`.
   *
   * @evidence requirements/building-exterior/validation-and-interior-consistency.md#building-exterior-interior-shared-validation Exposes `kind` as the portable data boundary for the building exterior interior shared validation requirement.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-linked-building-shared-facts Types `kind` for the interior space linked building shared facts system contract.
   */
  kind: string;

  /**
   * One enclosing space, or the two spaces this boundary separates.
   *
   * @evidence requirements/building-exterior/validation-and-interior-consistency.md#building-exterior-interior-shared-validation Exposes `spaces` as the portable data boundary for the building exterior interior shared validation requirement.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-linked-building-shared-facts Types `spaces` for the interior space linked building shared facts system contract.
   */
  spaces: string[];

  /**
   * Visible elements realizing the boundary; empty for a logical boundary.
   *
   * @evidence requirements/building-exterior/validation-and-interior-consistency.md#building-exterior-interior-shared-validation Exposes `elements` as the portable data boundary for the building exterior interior shared validation requirement.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-linked-building-shared-facts Types `elements` for the interior space linked building shared facts system contract.
   */
  elements: string[];

  /**
   * Where the separation actually is, when it is somewhere at all.
   *
   * A boundary without a face stays the purely relational record it has always
   * been, so an environment written before this field keeps validating
   * unchanged. Stating a face is what lets an opening be placed on the
   * separation and checked against it, because there is finally a surface for
   * "on the wall" and "off the wall" to mean something.
   *
   * @evidence requirements/building-exterior/validation-and-interior-consistency.md#building-exterior-interior-shared-validation Exposes `face` as the portable data boundary for the building exterior interior shared validation requirement.
   * @evidence specifications/interior-space/scope-and-host.md#interior-space-linked-building-shared-facts Types `face` for the interior space linked building shared facts system contract.
   */
  face?: IAutoMovieBoundaryFace;
}
