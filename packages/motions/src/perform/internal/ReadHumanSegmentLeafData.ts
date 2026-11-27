import type { AutoMovieHumanLimb } from "@automovie/interface";

/*
 * The arms, placed at the anchor course (`readHumanSegmentAnchors`) where the
 * plan's own course does not place them.
 */
export const ARMS: readonly AutoMovieHumanLimb[] = ["leftArm", "rightArm"];
