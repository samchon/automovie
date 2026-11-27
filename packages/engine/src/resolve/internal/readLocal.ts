import { IAutoMovieTransform } from "@automovie/interface";

/**
 * Return a borrowed required local transform from the supplied map, or throw
 * its diagnostic role and node id on absence. The default role preserves
 * world-driver descendant errors; springs supply their own role.
 */
export const readLocal: (
  localById: Map<string, IAutoMovieTransform>,
  id: string,
  role?: string,
) => IAutoMovieTransform = (
  localById: Map<string, IAutoMovieTransform>,
  id: string,
  /** Diagnostic role that owns this required lookup. */
  role: string = "world driver descendant local transform",
): IAutoMovieTransform => {
  const local: IAutoMovieTransform | undefined = localById.get(id);
  if (local === undefined)
    throw new Error(`${role} node "${id}" was not provided`);
  return local;
};
