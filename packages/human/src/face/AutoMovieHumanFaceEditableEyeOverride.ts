import type { AutoMovieHumanFaceEditableOverride } from "./AutoMovieHumanFaceEditableOverride";
import type { AutoMovieHumanFaceOverride } from "./AutoMovieHumanFaceOverride";
import type { IPortraitEyeShape } from "./anatomy/eye/structures/IPortraitEyeShape";
import type { IPortraitIrisPigment } from "./anatomy/eye/structures/IPortraitIrisPigment";

/**
 * Eye shape edits stay scalar while iris RGB endpoints remain appearance data.
 * The pigment's three-channel and range admission belongs to its optical
 * component; an RGB array changes no eyelid, cornea or shared-skin vertex.
 *
 * @evidence contracts/common.md#principled-implementation Eye scalar edits use the geometry-restricting override while iris pigment retains its RGB appearance population shape.
 * @evidence contracts/common.md#clear-and-simple-design Omit removes the general irisPigment branch before the optical component's appearance override is reintroduced.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The iris exception changes no eyelid, cornea or shared skin vertices; optical pigment admission still owns channel ranges.
 * @evidence contracts/common.md#meaningful-documentation The introduction explains why RGB array edits are appearance exceptions rather than editable geometry coordinates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Editable eye appearance type is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Editable eye appearance type specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Editable eye appearance type acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 */
export type AutoMovieHumanFaceEditableEyeOverride = Omit<
  AutoMovieHumanFaceEditableOverride<IPortraitEyeShape>,
  "irisPigment"
> & {
  irisPigment?: AutoMovieHumanFaceOverride<IPortraitIrisPigment>;
};
