import type { IAutoMovieVector3, IAutoMovieFormationBounds, IAutoMovieCompiledFormationLod, IAutoMovieModelLodRecipe, IAutoMovieQuaternion, IAutoMovieFormationLayout, AutoMovieFormationCapability, IAutoMovieCompiledFormation, IAutoMovieFormationDesign, IAutoMovieModelRecipe, IAutoMovieWorldSurface } from "@automovie/interface";


import { IAutoMovieFormationGrounding } from "../IAutoMovieFormationGrounding";
import { formationSlotPosition } from "../formationSlotPosition";
import { Quaternion } from "../math/Quaternion";
import { mixSeed } from "../math/mixSeed";
import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import { compiledPopulationRepresentation } from "./compiledPopulationRepresentation";
import { AUTOMOVIE_FORMATION_CHUNK_SIZE } from "./constants/AUTOMOVIE_FORMATION_CHUNK_SIZE";
import { summarizeCompiledSlotRange } from "./summarizeCompiledSlotRange";
import { summarizeCompiledSlotChunks } from "./summarizeCompiledSlotChunks";

/**
 * Compile one formation design into its compact, regenerable runtime record.
 *
 * The record stores what regenerates the members rather than the members: the
 * layout, anchor, heading and seed, one bounds and centroid per chunk of
 * {@link AUTOMOVIE_FORMATION_CHUNK_SIZE} slots with that chunk's anonymous
 * count once heroes are excluded, each hero's promoted base transform, the
 * anonymous representation tiers, a measured or fallback member radius, a
 * domain-separated motion phase seed, and a digest of every other field.
 *
 * The terrain it snapshots is the part of the world that can be under a member:
 * the surfaces whose ground-plan extent reaches the footprint measured on level
 * ground, in declared order. Relief moves members up and down, never sideways,
 * so that footprint holds on any terrain, and a unit with nothing under it
 * reuses the level pass as its finished summary.
 *
 * Measured member radii come from the host as a table, because what measures a recipe,
 * a registered archetype or an adopted external proxy, is the host's
 * composition rather than this kernel's. Missing tier measurements borrow the
 * base measurement, then 0.5m; that fallback is not proof of geometric enclosure.
 * The digest is SHA-256 over canonical
 * JSON v2 computed without a Node built-in, equal to the Node builder's digest
 * of the same canonical bytes.
 *
 * @evidence contracts/common.md#principled-implementation Compile placement laws, sorted heroes, chunk/global point summaries and canonical digest, retaining only terrain whose XZ extent intersects the flat footprint. Relief changes Y only; radius fallback remains an estimate when host measurements are absent.
 * @evidence contracts/common.md#clear-and-simple-design Terrain snapshotting, member regeneration and representation composition stay in their owning helpers; compact records store laws and summaries instead of every anonymous member.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed chunk size and domain-separated phase seed are package policy; no fixture alters placement, and missing-radius fallback does not claim measured enclosure.
 * @evidence contracts/common.md#meaningful-documentation Docs describe terrain order, law snapshots, hero transforms, digest bytes and metre radius policy; summaries bound placement points rather than expanded model geometry.
 * @evidence contracts/performance.md#efficient-algorithms The flat footprint visits N slots and the grounded chunk/global pass visits each slot once, plus H hero positions; terrain polygon filtering and sampling drive extra work, and C chunks/H heroes/snapshot bytes drive retained output. Hero counting still scans H per chunk.
 * @evidence contracts/performance.md#reuse-equivalent-work The flat summary is reused when no terrain changes Y; the grounded pass shares each generated point between chunk and global folds while preserving ascending running-mean order. No cache crosses mutable designs or terrain.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Cloned placement laws and selected terrain plus C chunks/H heroes transfer to the caller; transient folds and digest bytes are call-local and no resource handle is opened.
 */
export const materializeCompiledFormation: (props: { /** Formation design to compile. */ formation : IAutoMovieFormationDesign ; /** Model recipes keyed by id; empty when none are declared. */ recipes ? : ReadonlyMap < string , IAutoMovieModelRecipe > ; /** Conservative member radius in metres keyed by recipe id; an id without one borrows the base recipe's radius and then half a metre. */ projectionRadii ? : ReadonlyMap < string , number > ; /** World terrain in declared order; empty when the world has none. */ surfaces ? : readonly IAutoMovieWorldSurface [ ] ; }) => IAutoMovieCompiledFormation = (props: {
  /** Formation design to compile. */
  formation: IAutoMovieFormationDesign;
  /** Model recipes keyed by id; empty when none are declared. */
  recipes?: ReadonlyMap<string, IAutoMovieModelRecipe>;
  /**
   * Conservative member radius in metres keyed by recipe id; an id without one
   * borrows the base recipe's radius and then half a metre.
   */
  projectionRadii?: ReadonlyMap<string, number>;
  /** World terrain in declared order; empty when the world has none. */
  surfaces?: readonly IAutoMovieWorldSurface[];
}): IAutoMovieCompiledFormation => {
  const formation: IAutoMovieFormationDesign = props.formation;
  const recipes: ReadonlyMap<string, IAutoMovieModelRecipe> = props.recipes ?? new Map<string, IAutoMovieModelRecipe>();
  const grounded: { formation: IAutoMovieFormationDesign & IAutoMovieFormationGrounding; ground: IAutoMovieWorldSurface[]; footprint: ReturnType<typeof summarizeCompiledSlotRange> | null; } = groundFormation(formation, props.surfaces ?? []);
  const position: (slot: number) => IAutoMovieVector3 = (slot: number) : IAutoMovieVector3 =>
    formationSlotPosition(grounded.formation, slot);
  const heroes: Set<number> = new Set(formation.heroOverrides.map((hero: { slot: number; actor: string; }) : number => hero.slot));
  const measured: ReturnType<typeof summarizeCompiledSlotChunks> = summarizeCompiledSlotChunks(
    formation.count,
    AUTOMOVIE_FORMATION_CHUNK_SIZE,
    position,
  );
  const chunks: { bounds: IAutoMovieFormationBounds; centroid: IAutoMovieVector3; index: number; start: number; count: number; anonymousCount: number; }[] = measured.chunks.map(
    (chunk: typeof measured.chunks[number]): { bounds: IAutoMovieFormationBounds; centroid: IAutoMovieVector3; index: number; start: number; count: number; anonymousCount: number; } => {
      const { start, count }: { start: number; count: number } = chunk;
      let anonymousCount: number = count;
      for (const slot of heroes)
        if (slot >= start && slot < start + count) --anonymousCount;
      return { ...chunk, anonymousCount };
    },
  );
  const summary: { bounds: IAutoMovieFormationBounds; centroid: IAutoMovieVector3; } =
    grounded.footprint ??
    measured.summary;
  const representation: { lod: IAutoMovieCompiledFormationLod[]; projectionRadius: number; } = compiledPopulationRepresentation({
    modelRecipe: formation.modelRecipe,
    tiers:
      recipes
        .get(formation.modelRecipe)
        ?.lod.filter((item: IAutoMovieModelLodRecipe) : boolean => item.tier !== "hero") ?? [],
    recipes,
    projectionRadii: props.projectionRadii ?? new Map<string, number>(),
  });
  const core: { projectionRadius: number; chunks: { bounds: IAutoMovieFormationBounds; centroid: IAutoMovieVector3; index: number; start: number; count: number; anonymousCount: number; }[]; heroes: { slot: number; actor: string; transform: { translation: IAutoMovieVector3; rotation: IAutoMovieQuaternion; scale: { x: number; y: number; z: number; }; }; }[]; lod: IAutoMovieCompiledFormationLod[]; phase: { seed: number; }; bounds: IAutoMovieFormationBounds; centroid: IAutoMovieVector3; version: 1; id: string; count: number; anonymousCount: number; modelRecipe: string; layout: IAutoMovieFormationLayout; anchor: IAutoMovieVector3; ground: IAutoMovieWorldSurface[]; facingDeg: number; seed: number; } = {
    version: 1 as const,
    id: formation.id,
    count: formation.count,
    anonymousCount: formation.count - formation.heroOverrides.length,
    modelRecipe: formation.modelRecipe,
    layout: structuredClone(formation.layout),
    anchor: structuredClone(formation.anchor),
    ground: structuredClone(grounded.ground),
    facingDeg: formation.facingDeg,
    seed: formation.seed,
    ...summary,
    projectionRadius: representation.projectionRadius,
    chunks,
    heroes: [...formation.heroOverrides]
      .sort((left: { slot: number; actor: string; }, right: { slot: number; actor: string; }) : number => left.slot - right.slot)
      .map((hero: { slot: number; actor: string; }) : { slot: number; actor: string; transform: { translation: IAutoMovieVector3; rotation: IAutoMovieQuaternion; scale: { x: number; y: number; z: number; }; }; } => ({
        slot: hero.slot,
        actor: hero.actor,
        transform: {
          translation: position(hero.slot),
          rotation: Quaternion.fromAxisAngle(
            { x: 0, y: 1, z: 0 },
            formation.facingDeg,
          ),
          scale: { x: 1, y: 1, z: 1 },
        },
      })),
    lod: representation.lod,
    // Phase only. A cycle length compiled here would be a number nothing in the
    // unit produced: cadence is the ground a unit's cues cover, and a seeded
    // period made a halted crowd march in place and a marching one skate.
    phase: {
      seed: mixSeed(formation.seed, 0x70686173),
    },
  };
  return {
    ...core,
    digest: autoMovieRenderDigest(canonicalizeAutoMovieJson(core)),
  };
};

/**
 * Bind one formation to the terrain its members stand on.
 *
 * The snapshot is the surfaces whose extent reaches the formation's own
 * footprint, in declared order. Reaching is decided on the ground plan alone: a
 * surface whose XZ extent misses the footprint box cannot be under any member,
 * so dropping it is sound, and keeping the rest whole is what lets a consumer
 * answer heights from the compiled record without the world beside it.
 *
 * The footprint is measured with no terrain, which is exactly right: relief
 * moves members up and down, never sideways, so the ground plan is the same
 * before and after. That flat pass is also the finished summary whenever
 * nothing relieves it, so a production on level ground pays for no extra work.
 */
const groundFormation: (formation: IAutoMovieFormationDesign, surfaces: readonly IAutoMovieWorldSurface [ ]) => { formation : IAutoMovieFormationDesign & IAutoMovieFormationGrounding ; ground : IAutoMovieWorldSurface [ ] ; /** The finished summary, or null when terrain still has to relieve it. */ footprint : ReturnType < typeof summarizeCompiledSlotRange > | null ; } = (
  formation: IAutoMovieFormationDesign,
  surfaces: readonly IAutoMovieWorldSurface[],
): {
  formation: IAutoMovieFormationDesign & IAutoMovieFormationGrounding;
  ground: IAutoMovieWorldSurface[];
  /** The finished summary, or null when terrain still has to relieve it. */
  footprint: ReturnType<typeof summarizeCompiledSlotRange> | null;
} => {
  const flat: { ground: never[]; id: string; modelRecipe: string; count: number; layout: IAutoMovieFormationLayout; anchor: IAutoMovieVector3; facingDeg: number; seed: number; capabilities: AutoMovieFormationCapability[]; heroOverrides: Array<{ slot: number; actor: string; }>; } = { ...formation, ground: [] };
  const footprint: { bounds: IAutoMovieFormationBounds; centroid: IAutoMovieVector3; } = summarizeCompiledSlotRange(0, formation.count, (slot: number) : IAutoMovieVector3 =>
    formationSlotPosition(flat, slot),
  );
  const ground: IAutoMovieWorldSurface[] = surfaces.filter((surface: IAutoMovieWorldSurface) : boolean =>
    reachesFootprint(surface.polygon, footprint.bounds),
  );
  return ground.length === 0
    ? { formation: flat, ground: [], footprint }
    : { formation: { ...formation, ground }, ground, footprint: null };
};

/** Does a surface footprint's XZ extent reach a formation's XZ extent? */
const reachesFootprint: (polygon: IAutoMovieWorldSurface [ "polygon" ], bounds: IAutoMovieCompiledFormation [ "bounds" ]) => boolean = (
  polygon: IAutoMovieWorldSurface["polygon"],
  bounds: IAutoMovieCompiledFormation["bounds"],
): boolean => {
  let minX: number = Infinity;
  let maxX: number = -Infinity;
  let minZ: number = Infinity;
  let maxZ: number = -Infinity;
  for (const point of polygon) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minZ = Math.min(minZ, point.z);
    maxZ = Math.max(maxZ, point.z);
  }
  return (
    minX <= bounds.max.x &&
    maxX >= bounds.min.x &&
    minZ <= bounds.max.z &&
    maxZ >= bounds.min.z
  );
};
