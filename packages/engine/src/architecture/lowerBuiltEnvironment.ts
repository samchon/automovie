import { IAutoMovieBuiltEnvironment, IAutoMovieSpace } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { IAutoMovieSubjectContribution } from "../IAutoMovieSubjectContribution";
import { validateBuiltEnvironment } from "./validateBuiltEnvironment";

/**
 * Lower one building record to ordinary subject contributions.
 *
 * Visible element transforms are composed parent-to-child and flattened into
 * world-space set pieces because staged scene nodes are world TRS. The original
 * hierarchy remains in `builtEnvironments` for spatial queries and evidence.
 *
 * An opening's current operating state is applied on the way down, so a door
 * authored open is staged open. Without that, "the door is open" would be a
 * fact of the record that the render contradicts, which is exactly the drift
 * between the declared passage and the visible hole this graph exists to close.
 * A record that declares no operation lowers byte-for-byte as it always did,
 * because the joint displacement it would contribute is the identity.
 *
 * A declared population leaves as the compact instance set it already is, never
 * expanded into set pieces. That is what makes the building the one owner of its
 * own repeated parts: the set the production world stages and the set a space
 * query measures are the same record, so no second copy of a placement law can
 * drift away from the first.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `lowerBuiltEnvironment` lowers one building record to ordinary subject contributions. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `lowerBuiltEnvironment` performs built environment lowering when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @evidence requirements/building-exterior/coordinates-and-shared-boundaries.md#building-coordinate-transform-chain `lowerBuiltEnvironment` composes every building root and child element's declared local translation, rotation, and scale in parent-to-child order into deterministic world transforms.
 * @evidence specifications/building-envelope/identity-scope-and-coordinates.md#building-envelope-coordinate-input-output The lowering implements the building-root and child-transform composition subset without claiming CRS, control-point residual, or source-frame receipts.
 * @evidence requirements/building-exterior/facades-and-walls.md#building-facade-placement-basis `lowerBuiltEnvironment` preserves each facade element's authored parent-local transform and resolves it through the building coordinate root rather than applying a view-dependent offset.
 * @evidence specifications/building-envelope/facade-roof-and-openings.md#building-envelope-facade-placement-input The lowering contributes deterministic local-to-world facade placement while face-region selection, corners, and panel rules remain authored facts.
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group `lowerBuiltEnvironment` contributes each space-owned compact population as the same instance-set record instead of expanding it or duplicating its placement law.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality `lowerBuiltEnvironment` preserves a compressed population's stable set identity, count, seed, and selectable-member regeneration contract in the production world.
 */
export const lowerBuiltEnvironment = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieSubjectContribution => {
  const validated = validateBuiltEnvironment({ environment });
  if (validated.success === false) {
    const first = validated.violations[0]!;
    throw new Error(
      `built environment "${environment.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }

  const matrices = worldMatricesOf(environment, operationDeltas(environment));
  const populations = environment.populations ?? [];
  const spaces: IAutoMovieSpace[] = environment.spaces.map((space) => {
    const surfaces = environment.surfaces
      .filter((entry) => entry.space === space.id)
      .map((entry) => entry.surface);
    const surfaceIds = new Set(surfaces.map((surface) => surface.id));
    return {
      id: `${environment.id}/${space.id}`,
      surfaces,
      walkable: environment.walkable.filter((id) => surfaceIds.has(id)),
    };
  });

  return {
    models: environment.models,
    set: environment.elements
      .filter((element) => element.model !== null)
      .map((element) => {
        const world = Matrix4.decompose(matrices.get(element.id)!);
        return {
          node: `${environment.id}/${element.id}`,
          model: element.model!,
          position: world.position,
          rotation: Quaternion.normalize(world.rotation),
          scale: world.scale,
        };
      }),
    spaces,
    builtEnvironments: [environment],
    // A population is contributed as the compact set it already is, never
    // expanded into set pieces: the whole point of declaring 2,392 slates as
    // one record is that nothing downstream has to hold 2,392 of anything. The
    // key is omitted rather than emitted empty so a record without populations
    // merges byte-for-byte as it did before the field existed.
    ...(populations.length === 0
      ? {}
      : { instanceSets: populations.map((population) => population.set) }),
  };
};
