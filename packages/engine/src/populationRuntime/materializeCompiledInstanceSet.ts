import type {
  IAutoMovieCompiledFormationLod,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieFormationBounds,
  IAutoMovieInstanceSetDesign,
  IAutoMovieInstanceSetLayout,
  IAutoMovieInstanceVariation,
  IAutoMovieModelRecipe,
  IAutoMovieVector3,
  IAutoMovieWorldDesign,
  IAutoMovieWorldRoute,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import { IAutoMovieInstanceSetPlacement } from "./IAutoMovieInstanceSetPlacement";
import { compiledPopulationRepresentation } from "./compiledPopulationRepresentation";
import { AUTOMOVIE_INSTANCE_CHUNK_SIZE } from "./constants/AUTOMOVIE_INSTANCE_CHUNK_SIZE";
import { instanceSlot } from "./instanceSlot";
import { summarizeCompiledSlotChunks } from "./summarizeCompiledSlotChunks";

/**
 * Compile one world instance set into its compact runtime without expanding it.
 *
 * The record keeps the placement and variation laws, the route snapshot a
 * route layout follows, one bounds and centroid per chunk of
 * {@link AUTOMOVIE_INSTANCE_CHUNK_SIZE} slots, the representation tiers and
 * measured or fallback radius of the base recipe and every declared prototype, and
 * a digest of every other field. A declared prototype table is compiled with
 * the base recipe's default first, which is the choice list every member is
 * regenerated against afterwards.
 *
 * Bounds are measured by regenerating each slot through {@link instanceSlot},
 * so a member whose seeded variation is non-finite, or whose route is missing
 * or has no length, refuses compilation instead of producing a set no consumer
 * can regenerate. Member radii are supplied host estimates that this kernel does not verify against geometry; missing estimates use the base then 0.5m. The digest is SHA-256 over canonical JSON v2 computed without a
 * Node built-in, equal to the Node builder's digest of the same canonical
 * bytes.
 *
 * @evidence contracts/common.md#principled-implementation Resolve the named route, prepend the default prototype once, regenerate slots into chunk/global summaries, then clone the compact laws and hash their canonical record. Host radius fallback remains approximate when measurements are absent.
 * @evidence contracts/common.md#clear-and-simple-design The compiler owns route resolution and compact snapshots; instanceSlot owns placement and the shared chunk fold owns summary arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Default choice, fixed chunk size and fallback radius are declared existing policies, not per-content compensation; regeneration refusal propagates before a compiled record is returned.
 * @evidence contracts/common.md#meaningful-documentation Docs state route snapshot, complete prototypes, metre radius policy, point bounds and canonical SHA digest; callers own cloned output rather than an expanded member array.
 * @evidence contracts/performance.md#efficient-algorithms Each of N slots is generated once for both summaries; along-route placement still costs O(NR), prototype selection/traits add their scans, and C chunks plus cloned route/prototype laws drive output storage.
 * @evidence contracts/performance.md#reuse-equivalent-work A single point feeds chunk and global folds in identical ascending order; the default prototype representation is reused in the compiled table and base fields. Mutable inputs prevent cross-call caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The compact record and cloned route/laws transfer to the caller; only current accumulators and returned chunks remain during compilation, with no task or native handle.
 */
export const materializeCompiledInstanceSet: (props: {
  /** Instance set design to compile. */ instanceSet: IAutoMovieInstanceSetDesign;
  /** World routes a route layout resolves its route from. */ world: Pick<
    IAutoMovieWorldDesign,
    "routes"
  >;
  /** Model recipes keyed by id; empty when none are declared. */ recipes?: ReadonlyMap<
    string,
    IAutoMovieModelRecipe
  >;
  /** Supplied root-centered radius estimate in metres keyed by recipe id; an id without one borrows its prototype's base recipe radius and then half a metre. */ projectionRadii?: ReadonlyMap<
    string,
    number
  >;
}) => IAutoMovieCompiledInstanceSet = (props: {
  /** Instance set design to compile. */
  instanceSet: IAutoMovieInstanceSetDesign;
  /** World routes a route layout resolves its route from. */
  world: Pick<IAutoMovieWorldDesign, "routes">;
  /** Model recipes keyed by id; empty when none are declared. */
  recipes?: ReadonlyMap<string, IAutoMovieModelRecipe>;
  /**
   * Supplied root-centered radius estimate in metres keyed by recipe id; an id without one borrows its prototype's base recipe radius and then half a metre.
   */
  projectionRadii?: ReadonlyMap<string, number>;
}): IAutoMovieCompiledInstanceSet => {
  const instanceSet: IAutoMovieInstanceSetDesign = props.instanceSet;
  const layout: IAutoMovieInstanceSetLayout = instanceSet.layout;
  const recipes: ReadonlyMap<string, IAutoMovieModelRecipe> =
    props.recipes ?? new Map<string, IAutoMovieModelRecipe>();
  const projectionRadii: ReadonlyMap<string, number> =
    props.projectionRadii ?? new Map<string, number>();
  const route: IAutoMovieWorldRoute | null =
    layout.kind === "along-route"
      ? (props.world.routes.find(
          (candidate: IAutoMovieWorldRoute): boolean =>
            candidate.id === layout.route,
        ) ?? null)
      : null;
  const placement: IAutoMovieInstanceSetPlacement = {
    id: instanceSet.id,
    count: instanceSet.count,
    modelRecipe: instanceSet.modelRecipe,
    layout,
    route,
    anchor: instanceSet.anchor,
    facingDeg: instanceSet.facingDeg,
    seed: instanceSet.seed,
    variation: instanceSet.variation,
    ...(instanceSet.prototypes === undefined
      ? {}
      : {
          prototypes: [
            { id: "default", modelRecipe: instanceSet.modelRecipe, weight: 1 },
            ...instanceSet.prototypes,
          ],
        }),
  };
  const position: (slot: number) => IAutoMovieVector3 = (
    slot: number,
  ): IAutoMovieVector3 => instanceSlot(placement, slot).position;
  const measured: ReturnType<typeof summarizeCompiledSlotChunks> =
    summarizeCompiledSlotChunks(
      instanceSet.count,
      AUTOMOVIE_INSTANCE_CHUNK_SIZE,
      position,
    );
  const chunks: typeof measured.chunks = measured.chunks;
  const summary: typeof measured.summary = measured.summary;
  const compilePrototype: (prototype: {
    id: string;
    modelRecipe: string;
    weight: number;
  }) => {
    lod: IAutoMovieCompiledFormationLod[];
    projectionRadius: number;
    id: string;
    modelRecipe: string;
    weight: number;
  } = (prototype: {
    id: string;
    modelRecipe: string;
    weight: number;
  }): {
    lod: IAutoMovieCompiledFormationLod[];
    projectionRadius: number;
    id: string;
    modelRecipe: string;
    weight: number;
  } => {
    const representation: {
      lod: IAutoMovieCompiledFormationLod[];
      projectionRadius: number;
    } = compiledPopulationRepresentation({
      modelRecipe: prototype.modelRecipe,
      tiers: recipes.get(prototype.modelRecipe)?.lod ?? [],
      recipes,
      projectionRadii,
    });
    return {
      ...prototype,
      lod: representation.lod,
      projectionRadius: representation.projectionRadius,
    };
  };
  const defaultPrototype: {
    lod: IAutoMovieCompiledFormationLod[];
    projectionRadius: number;
    id: string;
    modelRecipe: string;
    weight: number;
  } = compilePrototype({
    id: "default",
    modelRecipe: instanceSet.modelRecipe,
    weight: 1,
  });
  const prototypes:
    | {
        lod: IAutoMovieCompiledFormationLod[];
        projectionRadius: number;
        id: string;
        modelRecipe: string;
        weight: number;
      }[]
    | undefined =
    instanceSet.prototypes === undefined
      ? undefined
      : [defaultPrototype, ...instanceSet.prototypes.map(compilePrototype)];
  const core: {
    projectionRadius: number;
    chunks: {
      bounds: IAutoMovieFormationBounds;
      centroid: IAutoMovieVector3;
      index: number;
      start: number;
      count: number;
    }[];
    lod: IAutoMovieCompiledFormationLod[];
    bounds: IAutoMovieFormationBounds;
    centroid: IAutoMovieVector3;
    layout: IAutoMovieInstanceSetLayout;
    route: IAutoMovieWorldRoute | null;
    anchor: IAutoMovieVector3;
    facingDeg: number;
    seed: number;
    variation: IAutoMovieInstanceVariation;
    prototypes?:
      | {
          lod: IAutoMovieCompiledFormationLod[];
          projectionRadius: number;
          id: string;
          modelRecipe: string;
          weight: number;
        }[]
      | undefined;
    version: 1;
    id: string;
    count: number;
    modelRecipe: string;
  } = {
    version: 1 as const,
    id: instanceSet.id,
    count: instanceSet.count,
    modelRecipe: instanceSet.modelRecipe,
    ...(prototypes === undefined ? {} : { prototypes }),
    layout: structuredClone(layout),
    route: route === null ? null : structuredClone(route),
    anchor: structuredClone(instanceSet.anchor),
    facingDeg: instanceSet.facingDeg,
    seed: instanceSet.seed,
    variation: structuredClone(instanceSet.variation),
    ...summary,
    projectionRadius:
      prototypes === undefined
        ? defaultPrototype.projectionRadius
        : Math.max(
            ...prototypes.map(
              (prototype: {
                lod: IAutoMovieCompiledFormationLod[];
                projectionRadius: number;
                id: string;
                modelRecipe: string;
                weight: number;
              }): number => prototype.projectionRadius,
            ),
          ),
    chunks,
    lod: defaultPrototype.lod,
  };
  return {
    ...core,
    digest: autoMovieRenderDigest(canonicalizeAutoMovieJson(core)),
  };
};
