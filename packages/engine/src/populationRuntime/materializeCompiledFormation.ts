import type {
  AutoMovieFormationCapability,
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledFormationLod,
  IAutoMovieFormationBounds,
  IAutoMovieFormationDesign,
  IAutoMovieFormationGrounding,
  IAutoMovieFormationLayout,
  IAutoMovieMaterializeCompiledFormation,
  IAutoMovieModel,
  IAutoMovieModelLod,
  IAutoMoviePlacementSummary,
  IAutoMovieQuaternion,
  IAutoMovieSummarizeCompiledSlotChunks,
  IAutoMovieVector3,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

import { formationSlotPosition } from "../formationSlotPosition";
import { Quaternion } from "../math/Quaternion";
import { Transform } from "../math/Transform";
import { mixSeed } from "../math/mixSeed";
import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import { compiledPopulationRepresentation } from "./compiledPopulationRepresentation";
import { AUTOMOVIE_FORMATION_CHUNK_SIZE } from "./constants/AUTOMOVIE_FORMATION_CHUNK_SIZE";
import { summarizeCompiledSlotChunks } from "./summarizeCompiledSlotChunks";
import { summarizeCompiledSlotRange } from "./summarizeCompiledSlotRange";

/**
 * Compile one formation design into its compact, regenerable runtime record.
 *
 * The record stores what regenerates the members rather than the members: the
 * layout, anchor, heading and seed, one bounds and centroid per chunk of
 * {@link AUTOMOVIE_FORMATION_CHUNK_SIZE} slots with that chunk's anonymous count
 * once heroes are excluded, each hero's promoted base transform, the anonymous
 * representation tiers the design declares, a measured or fallback member
 * radius, a domain-separated motion phase seed, and a digest of every other
 * field.
 *
 * The terrain it snapshots is the part of the world that can be under a member:
 * the surfaces whose ground-plan extent reaches the footprint measured on level
 * ground, in declared order. Relief moves members up and down, never sideways,
 * so that footprint holds on any terrain, and a unit with nothing under it
 * reuses the level pass as its finished summary.
 *
 * Supplied member radius estimates come from the host as a table. The host owns
 * model geometry and any enclosure proof; this kernel does not verify estimates
 * against geometry. Missing tier estimates borrow the base estimate, then 0.5m.
 * The digest is SHA-256 over canonical JSON v2 computed without a Node
 * built-in, equal to the Node builder's digest of the same canonical bytes.
 */
export const materializeCompiledFormation: (
  props: IAutoMovieMaterializeCompiledFormation.IProps,
) => IAutoMovieCompiledFormation = (
  props: IAutoMovieMaterializeCompiledFormation.IProps,
): IAutoMovieCompiledFormation => {
  const formation: IAutoMovieFormationDesign = props.formation;
  const grounded: {
    formation: IAutoMovieFormationDesign & IAutoMovieFormationGrounding;
    ground: IAutoMovieWorldSurface[];
    footprint: IAutoMoviePlacementSummary | null;
  } = groundFormation(formation, props.surfaces ?? []);
  const position: (slot: number) => IAutoMovieVector3 = (
    slot: number,
  ): IAutoMovieVector3 => formationSlotPosition(grounded.formation, slot);
  const heroes: Set<number> = new Set(
    formation.heroOverrides.map(
      (hero: { slot: number; actor: string }): number => hero.slot,
    ),
  );
  const measured: IAutoMovieSummarizeCompiledSlotChunks.IResult =
    summarizeCompiledSlotChunks(
      formation.count,
      AUTOMOVIE_FORMATION_CHUNK_SIZE,
      position,
    );
  const chunks: {
    bounds: IAutoMovieFormationBounds;
    centroid: IAutoMovieVector3;
    index: number;
    start: number;
    count: number;
    anonymousCount: number;
  }[] = measured.chunks.map(
    (
      chunk: (typeof measured.chunks)[number],
    ): {
      bounds: IAutoMovieFormationBounds;
      centroid: IAutoMovieVector3;
      index: number;
      start: number;
      count: number;
      anonymousCount: number;
    } => {
      const { start, count }: { start: number; count: number } = chunk;
      let anonymousCount: number = count;
      for (const slot of heroes)
        if (slot >= start && slot < start + count) --anonymousCount;
      return { ...chunk, anonymousCount };
    },
  );
  const summary: {
    bounds: IAutoMovieFormationBounds;
    centroid: IAutoMovieVector3;
  } = grounded.footprint ?? measured.summary;
  const representation: {
    lod: IAutoMovieCompiledFormationLod[];
    projectionRadius: number;
  } = compiledPopulationRepresentation({
    model: formation.model,
    tiers: (formation.lod ?? []).filter(
      (item: IAutoMovieModelLod): boolean => item.tier !== "hero",
    ),
    models: props.models ?? new Map<string, IAutoMovieModel>(),
    projectionRadii: props.projectionRadii ?? new Map<string, number>(),
  });
  const core: {
    projectionRadius: number;
    chunks: {
      bounds: IAutoMovieFormationBounds;
      centroid: IAutoMovieVector3;
      index: number;
      start: number;
      count: number;
      anonymousCount: number;
    }[];
    heroes: {
      slot: number;
      actor: string;
      transform: {
        translation: IAutoMovieVector3;
        rotation: IAutoMovieQuaternion;
        scale: { x: number; y: number; z: number };
      };
    }[];
    lod: IAutoMovieCompiledFormationLod[];
    phase: { seed: number };
    bounds: IAutoMovieFormationBounds;
    centroid: IAutoMovieVector3;
    version: 1;
    id: string;
    count: number;
    anonymousCount: number;
    model: string;
    layout: IAutoMovieFormationLayout;
    anchor: IAutoMovieVector3;
    ground: IAutoMovieWorldSurface[];
    facingDeg: number;
    seed: number;
  } = {
    version: 1 as const,
    id: formation.id,
    count: formation.count,
    anonymousCount: formation.count - formation.heroOverrides.length,
    model: formation.model,
    layout: structuredClone(formation.layout),
    anchor: structuredClone(formation.anchor),
    ground: structuredClone(grounded.ground),
    facingDeg: formation.facingDeg,
    seed: formation.seed,
    ...summary,
    projectionRadius: representation.projectionRadius,
    chunks,
    heroes: [...formation.heroOverrides]
      .sort(
        (
          left: { slot: number; actor: string },
          right: { slot: number; actor: string },
        ): number => left.slot - right.slot,
      )
      .map(
        (hero: {
          slot: number;
          actor: string;
        }): {
          slot: number;
          actor: string;
          transform: {
            translation: IAutoMovieVector3;
            rotation: IAutoMovieQuaternion;
            scale: { x: number; y: number; z: number };
          };
        } => ({
          slot: hero.slot,
          actor: hero.actor,
          transform: Transform.of(
            position(hero.slot),
            Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, formation.facingDeg),
          ),
        }),
      ),
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
const groundFormation: (
  formation: IAutoMovieFormationDesign,
  surfaces: readonly IAutoMovieWorldSurface[],
) => {
  formation: IAutoMovieFormationDesign & IAutoMovieFormationGrounding;
  ground: IAutoMovieWorldSurface[];
  /** The finished summary, or null when terrain still has to relieve it. */ footprint: IAutoMoviePlacementSummary | null;
} = (
  formation: IAutoMovieFormationDesign,
  surfaces: readonly IAutoMovieWorldSurface[],
): {
  formation: IAutoMovieFormationDesign & IAutoMovieFormationGrounding;
  ground: IAutoMovieWorldSurface[];
  /** The finished summary, or null when terrain still has to relieve it. */
  footprint: IAutoMoviePlacementSummary | null;
} => {
  const flat: {
    ground: never[];
    id: string;
    model: string;
    count: number;
    layout: IAutoMovieFormationLayout;
    anchor: IAutoMovieVector3;
    facingDeg: number;
    seed: number;
    capabilities: AutoMovieFormationCapability[];
    heroOverrides: Array<{ slot: number; actor: string }>;
  } = { ...formation, ground: [] };
  const footprint: {
    bounds: IAutoMovieFormationBounds;
    centroid: IAutoMovieVector3;
  } = summarizeCompiledSlotRange(
    0,
    formation.count,
    (slot: number): IAutoMovieVector3 => formationSlotPosition(flat, slot),
  );
  const ground: IAutoMovieWorldSurface[] = surfaces.filter(
    (surface: IAutoMovieWorldSurface): boolean =>
      reachesFootprint(surface.polygon, footprint.bounds),
  );
  return ground.length === 0
    ? { formation: flat, ground: [], footprint }
    : { formation: { ...formation, ground }, ground, footprint: null };
};

/** Does a surface footprint's XZ extent reach a formation's XZ extent? */
const reachesFootprint: (
  polygon: IAutoMovieWorldSurface["polygon"],
  bounds: IAutoMovieCompiledFormation["bounds"],
) => boolean = (
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
