/**
 * The one sky luminance distribution this solver implements.
 *
 * @evidence requirements/interior/lighting-daylight-and-optics.md#interior-lighting-analysis-boundary `AUTOMOVIE_DAYLIGHT_SKY_MODEL` names the sole diffuse-sky distribution the lighting solver can truthfully evaluate.
 * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-lighting-optical-state The fixed `isotropic` identifier gates unsupported sky requests before any illuminance samples are emitted.
 */
export const AUTOMOVIE_DAYLIGHT_SKY_MODEL = "isotropic";
