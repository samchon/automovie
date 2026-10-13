/** The direct diffuse line of three's physical lighting model this replaces. */
export const SUBSURFACE_TARGET =
  "reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );";


