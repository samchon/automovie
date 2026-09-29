import type { AutoMovieHumanFaceEditableOverride } from "./AutoMovieHumanFaceEditableOverride";
import type { AutoMovieHumanFaceOverride } from "./AutoMovieHumanFaceOverride";
import type { IPortraitEyeShape } from "./anatomy/eye/structures/IPortraitEyeShape";
import type { IPortraitIrisPigment } from "./anatomy/eye/structures/IPortraitIrisPigment";

/**
 * Eye shape edits stay scalar while iris RGB endpoints remain appearance data.
 * The pigment's three-channel and range admission belongs to its optical
 * component; an RGB array changes no eyelid, cornea or shared-skin vertex.
 */
export type AutoMovieHumanFaceEditableEyeOverride = Omit<
  AutoMovieHumanFaceEditableOverride<IPortraitEyeShape>,
  "irisPigment"
> & {
  irisPigment?: AutoMovieHumanFaceOverride<IPortraitIrisPigment>;
};
