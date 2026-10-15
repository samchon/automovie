import { exteriorSolidsSolid } from "./exteriorSolidsSolid";
import { wetAndJoinerySolid } from "./wetAndJoinerySolid";


/** Every untextured finish recipe, `[colour, roughness, metallic, clearcoat]` by finish id. */
export const solid = { ...exteriorSolidsSolid, ...wetAndJoinerySolid } as const;
