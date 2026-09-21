import { IAutoMovieCompiledShotSource } from "@automovie/interface";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";
import { autoMovieRenderSubjectOfShot } from "./autoMovieRenderSubjectOfShot";

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
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Reads every compiled fluid, cloth, planting, instance, scene, and model contribution into the drawable cost closure.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Converts builder-owned domains and bindings into explicit measured or not-run preflight inputs.
 * @author Samchon
 */
export const autoMovieRenderSubjectOfCompiledShot = (props: {
  /** Fully builder-owned shot artifact. */
  compiled: IAutoMovieCompiledShotSource;
  /** Known texture dimensions, if the caller resolved the assets. */
  textures?: readonly IAutoMovieRenderTextureSource[];
}): IAutoMovieRenderSubject => {
  const { compiled } = props;
  const waterOwner = bindingOf(
    compiled.waterFeatures ?? [],
    (feature) => feature.domain,
  );
  const softOwner = bindingOf(
    compiled.softFurnishings ?? [],
    (furnishing) => furnishing.domain,
  );
  const plantingOwner = bindingOf(
    compiled.plantingInstallations ?? [],
    (installation) => installation.cluster,
  );
  const recipes = new Map(
    (compiled.plantingDomains ?? []).map((domain) => [domain.id, domain]),
  );
  return autoMovieRenderSubjectOfShot({
    compiled,
    textures: props.textures,
    waterBodies: (compiled.fluidDomains ?? []).map((domain) => {
      const feature = waterOwner.get(domain.id);
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
    }),
    softBodies: (compiled.softBodyDomains ?? []).map((domain) => {
      const furnishing = softOwner.get(domain.id);
      return {
        domain,
        owner: spaceOwner(furnishing?.environment, furnishing?.space),
        material: furnishing?.material ?? null,
      };
    }),
    plantings: (compiled.plantingClusters ?? []).map((cluster) => {
      const domain = recipes.get(cluster.domain);
      if (domain === undefined)
        throw new Error(
          `render subject cannot stage planting cluster "${cluster.id}": recipe "${cluster.domain}" is absent from the compiled shot`,
        );
      const installation = plantingOwner.get(cluster.id);
      return {
        domain,
        cluster,
        owner: spaceOwner(installation?.environment, installation?.space),
        branchMaterial: installation?.branchMaterial ?? null,
        leafMaterial: installation?.leafMaterial ?? null,
        branch: null,
        leaf: null,
      };
    }),
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
const bindingOf = <Entry extends { id: string }>(
  entries: readonly Entry[],
  drawable: (entry: Entry) => string,
): Map<string, Entry> => {
  const index = new Map<string, Entry>();
  for (const entry of [...entries].sort((left, right) =>
    compareAutoMovieRenderIds(left.id, right.id),
  ))
    if (!index.has(drawable(entry))) index.set(drawable(entry), entry);
  return index;
};

/** The semantic id of the building space a binding hangs its drawable in. */
const spaceOwner = (
  environment: string | undefined,
  space: string | undefined,
): string | null =>
  environment === undefined || space === undefined
    ? null
    : `space:${environment}/${space}`;
