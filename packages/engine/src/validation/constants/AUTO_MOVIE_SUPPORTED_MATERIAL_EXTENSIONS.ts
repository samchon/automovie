/**
 * Extension identities whose semantics an automovie material can restate.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-validation-gap `AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS` enumerates the extension semantics automovie can restate instead of silently claiming unknown material parity.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-status-failures `AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS` supplies the supported set used to classify an imported extension as representable or unsupported.
 */
export const AUTO_MOVIE_SUPPORTED_MATERIAL_EXTENSIONS: ReadonlySet<string> =
  new Set([
    "KHR_texture_transform",
    "KHR_materials_transmission",
    "KHR_materials_ior",
    "KHR_materials_clearcoat",
  ]);
