/**
 * Return a borrowed required world matrix, or throw the supplied owner/role and
 * node id on absence. The default owner is world driver; springs use their
 * existing diagnostic owner.
 */
export const readWorld: (
  world: Map<string, number[]>,
  id: string,
  role: string,
  owner?: string,
) => number[] = (
  world: Map<string, number[]>,
  id: string,
  role: string,
  /** Diagnostic owner prefix; existing world drivers use the default. */
  owner: string = "world driver",
): number[] => {
  const matrix: number[] | undefined = world.get(id);
  if (matrix === undefined)
    throw new Error(`${owner} ${role} node "${id}" was not provided`);
  return matrix;
};
