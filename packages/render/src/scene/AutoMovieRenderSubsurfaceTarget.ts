/**
 * The direct diffuse line of three's physical lighting model this replaces: the
 * light's cosine-weighted irradiance through the diffuse BRDF three chose,
 * Lambert or, with diffuse roughness, Oren-Nayar.
 */
export const AutoMovieRenderSubsurfaceTarget =
  "reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );";
