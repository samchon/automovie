import type { IAutoMovieMaterial } from "@automovie/interface";

/**
 * One authored gray, rough, nonmetallic material and its optional base-color path.
 *
 * @evidence contracts/testing.md#behavioral-verification Existing material-library and texture-budget tests pass this real numerical material into production builders and assert resolution, cache ownership and measured facts; this helper only supplies input.
 * @evidence contracts/testing.md#independent-expectations The chosen id, texture path, opaque gray color, roughness one and metallic zero are authored values, not snapshots of builder output.
 * @evidence contracts/testing.md#distinguishing-cases Undefined texture becomes null while a supplied string is retained unchanged, including malformed values for callers' refusal cases; admission belongs to the tested consumer.
 * @evidence contracts/testing.md#execution-ownership Returns a fresh in-memory numerical record for existing test entries with no Three, file, worker or GPU allocation and no dynamic cases.
 */
export const material: (id: string, texture?: string) => IAutoMovieMaterial = (id: string, texture?: string): IAutoMovieMaterial => ({
  id,
  name: null,
  baseColor: { r: 0.5, g: 0.5, b: 0.5, a: 1, hex: null },
  metallic: 0,
  roughness: 1,
  emissive: null,
  opacity: 1,
  baseColorTexture: texture ?? null,
});
