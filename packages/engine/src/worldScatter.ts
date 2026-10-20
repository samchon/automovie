import { IAutoMovieInstanceSetDesign } from "@automovie/interface";

/**
 * Copy a compact instance design with an authored disk-scatter layout.
 *
 * @evidence contracts/common.md#principled-implementation Independent structuredClone calls preserve base fields, authored seed and scatter radius by value; the canonical instanceSlot sampler owns seeded disk placement.
 * @evidence contracts/common.md#clear-and-simple-design The helper assembles the existing design arm without its own random source or scatter algorithm; repository helper calls remain test-only.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No radius/count/seed admission, unseeded randomness or generated member array is added, and unsupported cloning input fails through structuredClone.
 * @evidence contracts/common.md#meaningful-documentation Documents copied graphs, retained authored seed values and deferred placement/admission responsibility.
 * @evidence contracts/performance.md#efficient-algorithms Traversal and allocation follow base/layout graph size, not the declared scatter population; no sample is taken here.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied graphs are each cloned once and not retained in a result cache; downstream generation decides equivalence of placement inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned cloned design, with no retained sampler cursor, source graph, process or GPU resource.
 */
export const worldScatter: (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: { kind: "scatter"; radius: number },
) => IAutoMovieInstanceSetDesign = (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: Extract<IAutoMovieInstanceSetDesign["layout"], { kind: "scatter" }>,
): IAutoMovieInstanceSetDesign => ({
  ...structuredClone(base),
  layout: structuredClone(layout),
});
