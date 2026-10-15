import { exteriorSolidsTextured } from "./exteriorSolidsTextured";
import { woodTextured } from "./woodTextured";
import { softFinishesTextured } from "./softFinishesTextured";
import { wetAndJoineryTextured } from "./wetAndJoineryTextured";


export const textured = {
  ...exteriorSolidsTextured,
  ...woodTextured,
  ...softFinishesTextured,
  ...wetAndJoineryTextured,
} as const;
