import {
  IAutoMovieCompiledShotSource,
  IAutoMovieFluidDomain,
  IAutoMoviePlantingCluster,
  IAutoMoviePlantingDomain,
  IAutoMoviePlantingInstallation,
  type IAutoMovieRenderSubject,
  type IAutoMovieRenderSubjectOfCompiledShot,
  type IAutoMovieRenderTextureResidency,
  type IAutoMovieRenderTextureSource,
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftFurnishing,
  IAutoMovieWaterFeature,
} from "@automovie/interface";

import { renderSubjectOfShot } from "./renderSubjectOfShot";
import { compareRenderIds } from "./compareRenderIds";

/*
 * Read a compiled shot as the complete drawable world one frame commits to.
 *
 * renderSubjectOfShot leaves the simulated drawables to its
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
 */
export function renderSubjectOfCompiledShot(
  props: IAutoMovieRenderSubjectOfCompiledShot.IProps,
): IAutoMovieRenderSubject {
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
  return renderSubjectOfShot({
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
}

/*
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
    compareRenderIds(left.id, right.id),
  ))
    if (!index.has(drawable(entry))) index.set(drawable(entry), entry);
  return index;
};

/*
 * The semantic id of the building space a binding hangs its drawable in.
 */
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
