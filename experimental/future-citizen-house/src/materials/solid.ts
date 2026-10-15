import { exteriorSolidsSolid } from "./exteriorSolidsSolid";
import { wetAndJoinerySolid } from "./wetAndJoinerySolid";


export const solid = { ...exteriorSolidsSolid, ...wetAndJoinerySolid } as const;
