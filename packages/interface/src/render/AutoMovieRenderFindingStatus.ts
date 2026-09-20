/**
 * How one metric came out.
 *
 * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-compile-render-distinction Exposes `AutoMovieRenderFindingStatus` as the portable data boundary for the rendering compile render distinction requirement.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-artifact-lifecycle Types `AutoMovieRenderFindingStatus` for the spec render artifact lifecycle system contract.
 */
export type AutoMovieRenderFindingStatus =
  | "within"
  | "over"
  | "unbudgeted"
  | "unsupported"
  | "not-run";
