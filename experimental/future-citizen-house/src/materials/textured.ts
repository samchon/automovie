import { exteriorSolidsTextured } from "./exteriorSolidsTextured";
import { woodTextured } from "./woodTextured";
import { softFinishesTextured } from "./softFinishesTextured";
import { wetAndJoineryTextured } from "./wetAndJoineryTextured";


/**
 * Every textured finish recipe, `[colour, roughness, texture asset, tile U, tile V]` by finish id.
 */
export const textured = {
  ...exteriorSolidsTextured,
  ...woodTextured,
  ...softFinishesTextured,
  ...wetAndJoineryTextured,
} as const;
