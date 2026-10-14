import {
  IAutoMovieCompiledShotSource,
  IAutoMovieFluidDomain,
  IAutoMoviePlantingCluster,
  IAutoMoviePlantingDomain,
  IAutoMoviePlantingInstallation,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftFurnishing,
  IAutoMovieWaterFeature,
} from "@automovie/interface";

import { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import type { IAutoMovieRenderTextureResidency } from "./IAutoMovieRenderTextureResidency";
import { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";
import { autoMovieRenderSubjectOfShot } from "./autoMovieRenderSubjectOfShot";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

/**
 * Read a compiled shot as the complete drawable world one frame commits to.
 *
 * {@link autoMovieRenderSubjectOfShot} leaves the simulated drawables to its
 * caller, because it was written while the compiled shot carried none. It
 * carries them now: the artifact holds every fluid, cloth and planting domain
 * beside the bindings that place them, and this is the one conversion that
 * reads both. Anywhere else, and the colour a pond is painted in the mask and
 * the cost a report prices for it would come from two different readings of one
 * artifact.
 *
 * Every declared domain becomes one drawable, bound or not. A fluid domain no
 * water feature claims is still a free surface somebody staged, and a palette
 * that skipped it would have no colour to notice its absence with; what the
 * binding adds is the owning space, which is how a colour resolves to a room.
 *
 * Branch and leaf prototype costs stay `null` on purpose. The solid a renderer
 * sweeps along a branch is the renderer's own choice and is in no compiled
 * record, so the geometry metrics report `not-run` rather than approve a
 * triangle count this repository invented.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Read every compiled fluid/soft domain and planting cluster, index binding ownership by smallest id and join planting recipes; missing planting recipes refuse. Domain rows carry ownership while unknown renderer prototype geometry stays null.
 * @evidence contracts/common.md#clear-and-simple-design One canonical compiled-shot conversion delegates ordinary scene/population fields to autoMovieRenderSubjectOfShot and adds simulated drawables once for mask and inventory consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lexical binding tie resolution keeps malformed duplicate-binding input deterministic but does not repair the upstream contradiction; no unbound declared domain is silently omitted and no tessellation cost is invented.
 * @evidence contracts/common.md#meaningful-documentation Docs distinguish unbound domains, semantic space ownership, null branch/leaf cost and caller-supplied decoded texture/residency facts.
 * @evidence contracts/performance.md#efficient-algorithms Binding lists cost O(K log K) sorting/indexing and domains/clusters cost linear conversion; recipe lookup is map-based and output storage scales with declared simulated drawables.
 * @evidence contracts/performance.md#reuse-equivalent-work Each binding/recipe index is built once per conversion and used by all related rows; mutable compiled artifacts and host texture observations prevent a cross-call identity-only cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned rows reference compiled laws and host facts rather than owning simulations; local indices disappear after completion/failure and no renderer handle is retained.
 */
export const autoMovieRenderSubjectOfCompiledShot: (props: {
  compiled: IAutoMovieCompiledShotSource;
  textures?: readonly IAutoMovieRenderTextureSource[];
  textureResidency?: IAutoMovieRenderTextureResidency;
}) => IAutoMovieRenderSubject = (props: {
  /** Fully builder-owned shot artifact. */
  compiled: IAutoMovieCompiledShotSource;
  /** Actual host-decoded upload and sharing facts for resolved source assets. */
  textures?: readonly IAutoMovieRenderTextureSource[];
  /** Other live scopes and context-retained texture storage, when not fresh. */
  textureResidency?: IAutoMovieRenderTextureResidency;
}): IAutoMovieRenderSubject => {
  const {
    compiled,
  }: {
    compiled: IAutoMovieCompiledShotSource;
    textures?: readonly IAutoMovieRenderTextureSource[];
    textureResidency?: IAutoMovieRenderTextureResidency;
  } = props;
  const waterOwner: Map<string, IAutoMovieWaterFeature> = bindingOf(
    compiled.waterFeatures ?? [],
    (feature: IAutoMovieWaterFeature): string => feature.domain,
  );
  const softOwner: Map<string, IAutoMovieSoftFurnishing> = bindingOf(
    compiled.softFurnishings ?? [],
    (furnishing: IAutoMovieSoftFurnishing): string => furnishing.domain,
  );
  const plantingOwner: Map<string, IAutoMoviePlantingInstallation> = bindingOf(
    compiled.plantingInstallations ?? [],
    (installation: IAutoMoviePlantingInstallation): string =>
      installation.cluster,
  );
  const recipes: Map<string, IAutoMoviePlantingDomain> = new Map(
    (compiled.plantingDomains ?? []).map(
      (
        domain: IAutoMoviePlantingDomain,
      ): [string, IAutoMoviePlantingDomain] => [domain.id, domain],
    ),
  );
  return autoMovieRenderSubjectOfShot({
    compiled,
    textures: props.textures,
    textureResidency: props.textureResidency,
    waterBodies: (compiled.fluidDomains ?? []).map(
      (
        domain: IAutoMovieFluidDomain,
      ): {
        id: string;
        owner: string | null;
        nodes: never[];
        domain: IAutoMovieFluidDomain;
        cells: null;
        particles: null;
        material: string | null;
      } => {
        const feature: IAutoMovieWaterFeature | undefined = waterOwner.get(
          domain.id,
        );
        return {
          id: domain.id,
          owner: spaceOwner(feature?.environment, feature?.space),
          // The bound domain draws its own free surface, which the mask joins by
          // the viewer's name for it. Naming a scene node here as well would bill
          // the same water twice.
          nodes: [],
          domain,
          cells: null,
          particles: null,
          material: feature?.material ?? null,
        };
      },
    ),
    softBodies: (compiled.softBodyDomains ?? []).map(
      (
        domain: IAutoMovieSoftBodyDomain,
      ): {
        domain: IAutoMovieSoftBodyDomain;
        owner: string | null;
        material: string | null;
      } => {
        const furnishing: IAutoMovieSoftFurnishing | undefined = softOwner.get(
          domain.id,
        );
        return {
          domain,
          owner: spaceOwner(furnishing?.environment, furnishing?.space),
          material: furnishing?.material ?? null,
        };
      },
    ),
    plantings: (compiled.plantingClusters ?? []).map(
      (
        cluster: IAutoMoviePlantingCluster,
      ): {
        domain: IAutoMoviePlantingDomain;
        cluster: IAutoMoviePlantingCluster;
        owner: string | null;
        branchMaterial: string | null;
        leafMaterial: string | null;
        branch: null;
        leaf: null;
      } => {
        const domain: IAutoMoviePlantingDomain | undefined = recipes.get(
          cluster.domain,
        );
        if (domain === undefined)
          throw new Error(
            `render subject cannot stage planting cluster "${cluster.id}": recipe "${cluster.domain}" is absent from the compiled shot`,
          );
        const installation: IAutoMoviePlantingInstallation | undefined =
          plantingOwner.get(cluster.id);
        return {
          domain,
          cluster,
          owner: spaceOwner(installation?.environment, installation?.space),
          branchMaterial: installation?.branchMaterial ?? null,
          leafMaterial: installation?.leafMaterial ?? null,
          branch: null,
          leaf: null,
        };
      },
    ),
  });
};

/**
 * Index one binding list by the drawable it places, keeping the smallest id.
 *
 * Two bindings naming one drawable is an authoring contradiction the builder
 * refuses, but the subject still has to be a function of the design rather than
 * of array order, or two runs of the same shot would attribute one pond to two
 * rooms and derive two different palettes for one frame.
 */
const bindingOf: <Entry extends { id: string }>(
  entries: readonly Entry[],
  drawable: (entry: Entry) => string,
) => Map<string, Entry> = <Entry extends { id: string }>(
  entries: readonly Entry[],
  drawable: (entry: Entry) => string,
): Map<string, Entry> => {
  const index: Map<string, Entry> = new Map<string, Entry>();
  for (const entry of [...entries].sort((left: Entry, right: Entry): number =>
    compareAutoMovieRenderIds(left.id, right.id),
  ))
    if (!index.has(drawable(entry))) index.set(drawable(entry), entry);
  return index;
};

/** The semantic id of the building space a binding hangs its drawable in. */
const spaceOwner: (
  environment: string | undefined,
  space: string | undefined,
) => string | null = (
  environment: string | undefined,
  space: string | undefined,
): string | null =>
  environment === undefined || space === undefined
    ? null
    : `space:${environment}/${space}`;
