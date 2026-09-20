import { IAutoMovieTransform } from "@automovie/interface";

/**
 * Read a required node-local transform or fail with its node identity.
 *
 * @evidence requirements/map/scope-and-coordinates.md#map-coordinate-transform-precision Keeps each descendant's local transform explicit when rebuilding a world chain.
 * @evidence specifications/world-and-site/spatial-reference-and-identity.md#world-site-transform-lineage-precision Supplies the required local step of the ordered transform lineage.
 */
export const readLocal = (
  localById: Map<string, IAutoMovieTransform>,
  id: string,
): IAutoMovieTransform => {
  const local = localById.get(id);
  if (local === undefined)
    throw new Error(
      `world driver descendant local transform node "${id}" was not provided`,
    );
  return local;
};
