import type {
  IAutoMovieCompiledFormationLod,
  IAutoMovieCompiledInstanceSet,
  IAutoMovieFormationBounds,
  IAutoMovieInstanceSetDesign,
  IAutoMovieInstanceSetLayout,
  IAutoMovieInstanceSetPlacement,
  IAutoMovieInstanceVariation,
  IAutoMovieMaterializeCompiledInstanceSet,
  IAutoMovieModel,
  IAutoMovieModelLod,
  IAutoMovieSummarizeCompiledSlotChunks,
  IAutoMovieVector3,
  IAutoMovieWorldRoute,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "../render/autoMovieRenderDigest";
import { canonicalizeAutoMovieJson } from "../text/canonicalizeAutoMovieJson";
import { compiledPopulationRepresentation } from "./compiledPopulationRepresentation";
import { AUTOMOVIE_INSTANCE_CHUNK_SIZE } from "./constants/AUTOMOVIE_INSTANCE_CHUNK_SIZE";
import { instanceSlot } from "./instanceSlot";
import { summarizeCompiledSlotChunks } from "./summarizeCompiledSlotChunks";

/**
 * Compile one world instance set into its compact runtime without expanding it.
 *
 * The record keeps the placement and variation laws, the route snapshot a route
 * layout follows, one bounds and centroid per chunk of
 * {@link AUTOMOVIE_INSTANCE_CHUNK_SIZE} slots, the representation tiers and
 * measured or fallback radius of the base model group and every declared
 * prototype, and a digest of every other field. A declared prototype table is
 * compiled with the base group's default first, which is the choice list every
 * member is regenerated against afterwards.
 *
 * Bounds are measured by regenerating each slot through {@link instanceSlot}, so
 * a member whose seeded variation is non-finite, or whose route is missing or
 * has no length, refuses compilation instead of producing a set no consumer can
 * regenerate. Member radii are supplied host estimates that this kernel does
 * not verify against geometry; missing estimates use the base then 0.5m. The
 * digest is SHA-256 over canonical JSON v2 computed without a Node built-in,
 * equal to the Node builder's digest of the same canonical bytes.
 */
export function materializeCompiledInstanceSet(
  props: IAutoMovieMaterializeCompiledInstanceSet.IProps,
): IAutoMovieCompiledInstanceSet {
  const instanceSet: IAutoMovieInstanceSetDesign = props.instanceSet;
  const layout: IAutoMovieInstanceSetLayout = instanceSet.layout;
  const models: ReadonlyMap<string, IAutoMovieModel> =
    props.models ?? new Map<string, IAutoMovieModel>();
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
    model: instanceSet.model,
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
            { id: "default", model: instanceSet.model, weight: 1 },
            ...instanceSet.prototypes,
          ],
        }),
  };
  const position: (slot: number) => IAutoMovieVector3 = (
    slot: number,
  ): IAutoMovieVector3 => instanceSlot(placement, slot).position;
  const measured: IAutoMovieSummarizeCompiledSlotChunks.IResult =
    summarizeCompiledSlotChunks(
      instanceSet.count,
      AUTOMOVIE_INSTANCE_CHUNK_SIZE,
      position,
    );
  const chunks: typeof measured.chunks = measured.chunks;
  const summary: typeof measured.summary = measured.summary;
  const compilePrototype: (prototype: {
    id: string;
    model: string;
    weight: number;
    lod?: IAutoMovieModelLod[] | undefined;
  }) => {
    lod: IAutoMovieCompiledFormationLod[];
    projectionRadius: number;
    id: string;
    model: string;
    weight: number;
  } = (prototype: {
    id: string;
    model: string;
    weight: number;
    lod?: IAutoMovieModelLod[] | undefined;
  }): {
    lod: IAutoMovieCompiledFormationLod[];
    projectionRadius: number;
    id: string;
    model: string;
    weight: number;
  } => {
    const representation: {
      lod: IAutoMovieCompiledFormationLod[];
      projectionRadius: number;
    } = compiledPopulationRepresentation({
      model: prototype.model,
      tiers: prototype.lod ?? [],
      models,
      projectionRadii,
    });
    return {
      id: prototype.id,
      model: prototype.model,
      weight: prototype.weight,
      lod: representation.lod,
      projectionRadius: representation.projectionRadius,
    };
  };
  const defaultPrototype: {
    lod: IAutoMovieCompiledFormationLod[];
    projectionRadius: number;
    id: string;
    model: string;
    weight: number;
  } = compilePrototype({
    id: "default",
    model: instanceSet.model,
    weight: 1,
    lod: instanceSet.lod,
  });
  const prototypes:
    | {
        lod: IAutoMovieCompiledFormationLod[];
        projectionRadius: number;
        id: string;
        model: string;
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
          model: string;
          weight: number;
        }[]
      | undefined;
    version: 1;
    id: string;
    count: number;
    model: string;
  } = {
    version: 1 as const,
    id: instanceSet.id,
    count: instanceSet.count,
    model: instanceSet.model,
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
                model: string;
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
}
