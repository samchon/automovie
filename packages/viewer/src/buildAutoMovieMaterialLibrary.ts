import { resolveAutoMovieMaterial } from "@automovie/engine";
import type {
  IAutoMovieImage,
  IAutoMovieMaterial,
  IAutoMovieModel,
} from "@automovie/interface";

import type { IAutoMovieMaterialLibrary } from "./IAutoMovieMaterialLibrary.js";
import type { IBuildAutoMovieMaterialLibraryProps } from "./IBuildAutoMovieMaterialLibraryProps.js";
import { buildMaterial } from "./buildMaterial.js";
import { constructAutoMovieOwnedResources } from "./constructAutoMovieOwnedResources.js";
import { materialTextureBindings } from "./materialTextureBindings.js";
import { reportAutoMovieResourceRetirement } from "./reportAutoMovieResourceRetirement.js";

/**
 * Build the exact model material identities requested by simulated surfaces.
 *
 * Model parts cite materials inside one model, but water, soft furnishing, and
 * planting records cite only a material id. Such a citation therefore resolves
 * across the compiled model population and must have exactly one definition.
 * Repeated declarations are one definition only when their complete records are
 * structurally equal. Missing and conflicting declarations are refused before
 * any material is built, so model order can never decide a visible result.
 *
 * Each admitted id is built once and shared by every borrowing surface. Texture
 * assets are primed through the shot cache before synchronous material
 * construction, together with the images carried by the models that declare
 * the requested materials; that cache owns binding-private texture clones and decoded
 * sources, while the returned library owns only the `THREE.Material` objects.
 * Construction refusal retires already-built materials independently. Disposal
 * attempts every material once, retains failed ownership and preserves the same
 * failure for repeated callers.
 *
 * @evidence contracts/common.md#principled-implementation Engine material resolution admits complete cross-model definitions before any material allocation; primed cache bindings feed synchronous construction, with immediate material ownership and failure-preserving independent retirement.
 * @evidence contracts/common.md#clear-and-simple-design One shot library coordinates requested identities while engine owns definition equivalence, buildMaterial owns material setup and the cache owns decoded sources and binding wrappers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null selects a real renderer default, while blank, absent, conflicting and unrequested ids refuse; construction or disposal failure never becomes an untextured substitute or successful empty-table claim.
 * @evidence contracts/common.md#meaningful-documentation Explains cross-model identity admission, borrowed shared materials, separate texture ownership, construction rollback and repeated-disposal failure identity.
 * @evidence contracts/performance.md#efficient-algorithms Deduplicates requested ids before engine resolution and builds each admitted material once; definition admission searches model/material declarations per requested id, texture prime deduplicates assets, and retirement visits each built material once.
 * @evidence contracts/performance.md#reuse-equivalent-work One material object per requested id is lent to all surfaces in the shot; the supplied cache shares decoded assets, and completed disposal or its stored failure is reused without native retries.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned owner retains its material Map until dispose; successful releases remove entries while failed entries and their original completion remain retained. Construction rollback attempts every earlier built material, and texture lifetimes stay with the external shot cache.
 *
 * @author Samchon
 */
export const buildAutoMovieMaterialLibrary: (
  props: IBuildAutoMovieMaterialLibraryProps,
) => Promise<IAutoMovieMaterialLibrary> = async (
  props: IBuildAutoMovieMaterialLibraryProps,
): Promise<IAutoMovieMaterialLibrary> => {
  const requested: Set<string> = new Set<string>();
  for (const id of props.materialIds) {
    if (id === null) continue;
    if (id.trim().length === 0)
      throw new Error("A requested material id must not be blank.");
    requested.add(id);
  }

  const definitions: Map<string, IAutoMovieMaterial> = new Map<
    string,
    IAutoMovieMaterial
  >(
    [...requested].map((id: string): [string, IAutoMovieMaterial] => [
      id,
      resolveAutoMovieMaterial({ models: props.models, material: id }),
    ]),
  );

  const bindings: ReturnType<typeof materialTextureBindings> = [
    ...definitions.values(),
  ].flatMap(materialTextureBindings);
  if (bindings.length !== 0 && props.textures === undefined)
    throw new Error(
      "Requested materials bind texture assets but no shot texture cache was supplied.",
    );
  // A binding resolves against the images of the models that declare it.
  await props.textures?.prime(
    bindings,
    props.models
      .filter((model: IAutoMovieModel): boolean =>
        model.materials.some((material: IAutoMovieMaterial): boolean =>
          definitions.has(material.id),
        ),
      )
      .flatMap((model: IAutoMovieModel): IAutoMovieImage[] => model.images ?? []),
  );

  const materials: Map<
    string,
    ReturnType<typeof buildMaterial>
  > = constructAutoMovieOwnedResources(
    (
      own: <Resource extends { dispose(): void }>(
        resource: Resource,
      ) => Resource,
    ): Map<string, ReturnType<typeof buildMaterial>> =>
      new Map(
        [...definitions].map(
          ([id, material]: [string, IAutoMovieMaterial]): readonly [
            string,
            ReturnType<typeof buildMaterial>,
          ] =>
            [
              id,
              own(buildMaterial(material, props.textures?.resolve)),
            ] as const,
        ),
      ),
  );
  let disposed: boolean = false;
  let disposalFailure: { error: unknown } | undefined;
  return {
    resolve: (
      id: string | null,
    ): ReturnType<typeof buildMaterial> | undefined => {
      if (disposed)
        throw new Error(
          "This shot material library has already been disposed.",
        );
      if (id === null) return undefined;
      const material: ReturnType<typeof buildMaterial> | undefined =
        materials.get(id);
      if (material === undefined)
        throw new Error(`Material "${id}" was not requested by this library.`);
      return material;
    },
    dispose: (): void => {
      if (disposed) {
        if (disposalFailure !== undefined) throw disposalFailure.error;
        return;
      }
      disposed = true;
      try {
        reportAutoMovieResourceRetirement(
          [...materials].map(
            ([id, material]: [
              string,
              ReturnType<typeof buildMaterial>,
            ]): (() => void) =>
              (): void => {
                material.dispose();
                materials.delete(id);
              },
          ),
        );
      } catch (error) {
        disposalFailure = { error };
        throw error;
      }
    },
  };
};
