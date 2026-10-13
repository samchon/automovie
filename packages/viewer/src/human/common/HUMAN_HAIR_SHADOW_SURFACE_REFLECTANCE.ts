import { HUMAN_HAIR_SHADOW_KERATIN_INDEX } from "./HUMAN_HAIR_SHADOW_KERATIN_INDEX.js";

/** Normal-incidence Fresnel reflectance of one keratin surface. */
export const HUMAN_HAIR_SHADOW_SURFACE_REFLECTANCE = ((HUMAN_HAIR_SHADOW_KERATIN_INDEX - 1) / (HUMAN_HAIR_SHADOW_KERATIN_INDEX + 1)) ** 2;
