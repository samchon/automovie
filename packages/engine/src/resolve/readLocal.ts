import { IAutoMovieTransform } from "@automovie/interface";

/** Read a required node-local transform or fail with its node identity. */
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
