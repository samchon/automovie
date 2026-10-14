import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPopulation,
  IAutoMovieBuiltSpace,
  IAutoMovieConstraintViolation,
  IAutoMovieQuaternion,
  IAutoMovieSpace,
  IAutoMovieStageSetPiece,
  IAutoMovieSurface,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieSubjectContribution } from "../IAutoMovieSubjectContribution";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { builtEnvironmentWorldMatrices } from "./builtEnvironmentWorldMatrices";
import { validateBuiltEnvironment } from "./validateBuiltEnvironment";

/**
 * Lower one building record to ordinary subject contributions.
 *
 * Visible element transforms are composed parent-to-child and flattened into world-space set pieces because staged scene nodes are world TRS. The original hierarchy remains in `builtEnvironments` for spatial queries and evidence.
 *
 * An opening's current operating state contributes its joint displacement during lowering. A record without operations contributes no such displacement; its authored transforms still compose through the hierarchy.
 *
 * A declared population leaves as the compact instance set it already is, never expanded into set pieces. That is what makes the building the one owner of its own repeated parts: the set the production world stages and the set a space query measures are the same record, so no second copy of a placement law can drift away from the first. The `instanceSets` key is omitted rather than emitted empty when the record has no population, so such a record merges exactly as it did before populations existed.
 *
 * Node ids are `<environment id>/<element id>` and stage space ids are `<environment id>/<space id>`; only elements with a model become set pieces, in element order. Each stage space carries its own surfaces in record order and the walkable ids among them in the record's walkable order. The returned contribution shares the environment's own model, surface and population objects rather than copying them. A record that fails `validateBuiltEnvironment` throws an `Error` naming its first violation.
 *
 * @param environment Building record to lower.
 * @returns The models, set pieces, stage spaces, building record and compact populations the building contributes.
 *
 * @evidence contracts/common.md#principled-implementation Validates first, including finite world-TRS representability of authored operating configurations, then decomposes the shared current-state world matrices with normalized rotations. Validation permits its stated round-trip tolerance, so lowering is not an exact-arithmetic inverse for arbitrary sheared matrices.
 * @evidence contracts/common.md#clear-and-simple-design Lowering only maps an accepted record onto contribution fields; staging is owned by `builtEnvironmentWorldMatrices` instead of a private copy, and populations pass through as their own set records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no building, element or space; the omitted `instanceSets` key is the contribution contract's way of saying "none", kept so a population-free record merges unchanged rather than to satisfy a fixture.
 * @evidence contracts/common.md#meaningful-documentation States the world flattening, the applied operating state, why populations stay compact, the id formats, the orders of set pieces, surfaces and walkable ids, the shared objects, the omitted key, and the thrown refusal.
 * @evidence contracts/performance.md#efficient-algorithms Pays full `validateBuiltEnvironment` cost, including Cartesian products of interacting operation states and its geometry checks, then one world-staging pass and linear contribution mapping/grouping. Validation is not a linear pass in the record size; the final stage-space grouping is linear in spaces, surfaces and walkable ids.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Lowers one record per call from the caller's mutable data; nothing is cached because no key could prove an earlier lowering still matches the record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Holds the staged matrices and the per-space groupings only for the call; the caller owns the returned contribution, which shares the record's own models, surfaces and population sets.
 */
export const lowerBuiltEnvironment: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieSubjectContribution = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieSubjectContribution => {
  const validated: IAutoMovieValidation = validateBuiltEnvironment({
    environment,
  });
  if (validated.success === false) {
    const first: IAutoMovieConstraintViolation = validated.violations[0]!;
    throw new Error(
      `built environment "${environment.id}" is invalid at ${first.path}: ${first.expected}`,
    );
  }

  const matrices: Map<string, number[]> =
    builtEnvironmentWorldMatrices(environment);
  const populations: IAutoMovieBuiltPopulation[] =
    environment.populations ?? [];
  return {
    models: environment.models,
    set: environment.elements
      .filter(
        (element: IAutoMovieBuiltElement): boolean => element.model !== null,
      )
      .map((element: IAutoMovieBuiltElement): IAutoMovieStageSetPiece => {
        const world: {
          position: IAutoMovieVector3;
          rotation: IAutoMovieQuaternion;
          scale: IAutoMovieVector3;
        } = Matrix4.decompose(matrices.get(element.id)!);
        return {
          node: `${environment.id}/${element.id}`,
          model: element.model!,
          position: world.position,
          rotation: Quaternion.normalize(world.rotation),
          scale: world.scale,
        };
      }),
    spaces: stageSpaces(environment),
    builtEnvironments: [environment],
    ...(populations.length === 0
      ? {}
      : {
          instanceSets: populations.map(
            (
              population: IAutoMovieBuiltPopulation,
            ): IAutoMovieBuiltPopulation["set"] => population.set,
          ),
        }),
  };
};

/** One stage space per logical space, carrying its own support patches. */
const stageSpaces: (
  environment: IAutoMovieBuiltEnvironment,
) => IAutoMovieSpace[] = (
  environment: IAutoMovieBuiltEnvironment,
): IAutoMovieSpace[] => {
  const surfaces: Map<string, IAutoMovieSurface[]> = new Map();
  const owner: Map<string, string> = new Map();
  for (const entry of environment.surfaces) {
    const list: IAutoMovieSurface[] | undefined = surfaces.get(entry.space);
    if (list === undefined) surfaces.set(entry.space, [entry.surface]);
    else list.push(entry.surface);
    owner.set(entry.surface.id, entry.space);
  }
  const walkable: Map<string, string[]> = new Map();
  for (const id of environment.walkable) {
    const space: string | undefined = owner.get(id);
    if (space === undefined) continue;
    const list: string[] | undefined = walkable.get(space);
    if (list === undefined) walkable.set(space, [id]);
    else list.push(id);
  }
  return environment.spaces.map(
    (space: IAutoMovieBuiltSpace): IAutoMovieSpace => ({
      id: `${environment.id}/${space.id}`,
      surfaces: surfaces.get(space.id) ?? [],
      walkable: walkable.get(space.id) ?? [],
    }),
  );
};
