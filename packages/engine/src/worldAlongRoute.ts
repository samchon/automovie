import { IAutoMovieInstanceSetDesign } from "@automovie/interface";
/**
 * Copy a compact instance design with an authored along-route layout.
 *
 * @evidence contracts/common.md#principled-implementation Independent structuredClone calls preserve the supplied base fields and along-route discriminator by value; route resolution, seeded lateral jitter and actual placement belong to instanceSlot rather than this constructor.
 * @evidence contracts/common.md#clear-and-simple-design The convenience constructor assembles the existing design union without a second route solver or stored member population; repository calls are tests, with no production authoring host wired through this helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No route identity, count or numeric admission is performed and cloning failures propagate; the function does not synthesize seed values or claim that a copied design is geometrically valid.
 * @evidence contracts/common.md#meaningful-documentation Documents fresh copied ownership, along-route design output and deferred route/placement validation.
 * @evidence contracts/performance.md#efficient-algorithms Work and allocation scale with the cloned base and layout graphs, not the declared instance count; no member coordinates are generated.
 * @evidence contracts/performance.md#reuse-equivalent-work Each input graph is cloned once and no mutable design is cached between calls; actual route-placement reuse is owned by downstream materialization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns both cloned graphs in the result, while source references are not deliberately retained; no route watcher, host handle or task is acquired.
 * @author Samchon
 */
export const worldAlongRoute: (base: Omit<IAutoMovieInstanceSetDesign, "layout">, layout: { kind: "along-route"; route: string; lateralJitter: number; }) => IAutoMovieInstanceSetDesign = (
  base: Omit<IAutoMovieInstanceSetDesign, "layout">,
  layout: Extract<
    IAutoMovieInstanceSetDesign["layout"],
    { kind: "along-route" }
  >,
): IAutoMovieInstanceSetDesign => ({
  ...structuredClone(base),
  layout: structuredClone(layout),
});
