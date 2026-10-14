import type { IAutoMovieCompiledInstanceSet } from "@automovie/interface";

/**
 * The existing hand-built window instance set with requested slot/chunk counts and one near tier.
 *
 * @evidence contracts/testing.md#behavioral-verification Existing semantic, instancing and render-budget cases pass this compact record through real consumers and assert their observed population behavior; no compiler result is fabricated as an expectation here.
 * @evidence contracts/testing.md#independent-expectations Grid columns equal count, chunk starts use ceil(count/chunks), and each chunk count is the remaining count capped by that size. Bounds and both repeated-character digests are authored fixtures, not measured or cryptographically sealed production evidence.
 * @evidence contracts/testing.md#distinguishing-cases The caller selects id, count, chunks and an optional model; omission selects window-model. Values retain the original unvalidated arithmetic, including partial/empty or malformed requests, and all chunk bounds share one local object.
 * @evidence contracts/testing.md#execution-ownership Portable numerical input for existing discovered units, with no model build, GPU allocation, host, worker or dynamic case registration.
 */
export const instanceSetFixture: (props: { id: string; count: number; chunks: number; model?: string; }) => IAutoMovieCompiledInstanceSet = (props: {
  id: string;
  count: number;
  chunks: number;
  model?: string;
}): IAutoMovieCompiledInstanceSet => {
  const size: number = Math.ceil(props.count / props.chunks);
  const bounds: IAutoMovieCompiledInstanceSet["bounds"] = {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 1, y: 1, z: 1 },
  };
  return {
    version: 1,
    id: props.id,
    count: props.count,
    modelRecipe: "window",
    layout: {
      kind: "grid",
      rows: 1,
      columns: props.count,
      spacing: { x: 1, z: 1 },
    },
    route: null,
    anchor: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
    seed: 1,
    variation: { scale: { min: 1, max: 1 }, palette: ["#FFFFFF"], traits: [] },
    bounds,
    centroid: { x: 0.5, y: 0.5, z: 0.5 },
    projectionRadius: 1,
    chunks: Array.from({ length: props.chunks }, (_: unknown, index: number) : IAutoMovieCompiledInstanceSet["chunks"][number] => ({
      index,
      start: index * size,
      count: Math.min(size, props.count - index * size),
      bounds,
      centroid: { x: 0.5, y: 0.5, z: 0.5 },
    })),
    lod: [
      {
        tier: "near",
        maxDistance: null,
        recipe: "window",
        recipeDigest: `sha256:${"0".repeat(64)}`,
        model: props.model ?? "window-model",
      },
    ],
    digest: `sha256:${"1".repeat(64)}`,
  };
};
