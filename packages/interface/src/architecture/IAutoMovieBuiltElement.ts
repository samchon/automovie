import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";

/**
 * One transformable member of the visible building hierarchy.
 *
 * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `IAutoMovieBuiltElement` as the portable data boundary for the building external multi building connection requirement.
 * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `IAutoMovieBuiltElement` for the building envelope multibuilding connector failures system contract.
 */
export interface IAutoMovieBuiltElement {
  /**
   * Stable element identity.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `id` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `id` for the building envelope multibuilding connector failures system contract.
   */
  id: string;

  /**
   * Open semantic label such as `building`, `storey`, `wall`, `coffer`, `roof`,
   * or a production-specific term.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `kind` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `kind` for the building envelope multibuilding connector failures system contract.
   */
  kind: string;

  /**
   * Parent element id, or null for an environment root.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `parent` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `parent` for the building envelope multibuilding connector failures system contract.
   */
  parent: string | null;

  /**
   * Local transform in the parent element's frame.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `transform` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `transform` for the building envelope multibuilding connector failures system contract.
   */
  transform: IAutoMovieTransform;

  /**
   * Visible model id, or null for a transform-only group.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `model` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `model` for the building envelope multibuilding connector failures system contract.
   */
  model: string | null;

  /**
   * Primary logical space occupied by this element, or null.
   *
   * @evidence requirements/building-exterior/external-circulation-and-attached-elements.md#building-external-multi-building-connection Exposes `space` as the portable data boundary for the building external multi building connection requirement.
   * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-multibuilding-connector-failures Types `space` for the building envelope multibuilding connector failures system contract.
   */
  space: string | null;
}
