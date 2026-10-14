import { HUMAN_HAIR_SHADOW_KERATIN_INDEX } from "./HUMAN_HAIR_SHADOW_KERATIN_INDEX.js";

/**
 * Normal-incidence Fresnel reflectance against air for the conventional model
 * index: ((n-1)/(n+1)) squared. This scalar approximation omits incidence-angle
 * and wavelength variation; CPU and generated shader share it at module scope
 * without retaining a material or GPU resource.
 */
export const HUMAN_HAIR_SHADOW_SURFACE_REFLECTANCE: number =
  ((HUMAN_HAIR_SHADOW_KERATIN_INDEX - 1) /
    (HUMAN_HAIR_SHADOW_KERATIN_INDEX + 1)) **
  2;
