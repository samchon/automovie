/**
 * Whether an extension identity is about materials or textures at all.
 *
 * Decided from the name's own segments rather than from a list of known
 * offenders, because a denylist is silent about the extension published
 * tomorrow. Geometry, lighting and container extensions that name neither
 * (`KHR_draco_mesh_compression`, `KHR_mesh_quantization`,
 * `KHR_lights_punctual`, `VRMC_vrm`) are not this gate's business and are left
 * to theirs. One that DOES name a texture stays this gate's business even when
 * it only changes an encoding: `KHR_texture_basisu` needs a transcoder the
 * viewer installs no loader for, so an asset declaring it does not render at
 * all, and saying so beside the material extensions is more useful than staying
 * silent because the bytes are "only" compressed.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-validation-gap `isAutoMovieMaterialExtension` recognizes material or texture extension namespaces without treating unrelated imported features as parity gaps.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-status-failures `isAutoMovieMaterialExtension` bounds unsupported classification to extensions whose own identity declares surface semantics.
 */
export const isAutoMovieMaterialExtension = (name: string): boolean =>
  name
    .split("_")
    .some((segment) => MATERIAL_SEGMENTS.has(segment.toLowerCase()));

const MATERIAL_SEGMENTS: ReadonlySet<string> = new Set([
  "material",
  "materials",
  "texture",
  "textures",
]);

const MATERIAL_SEGMENTS: ReadonlySet<string> = new Set([
  "material",
  "materials",
  "texture",
  "textures",
]);
