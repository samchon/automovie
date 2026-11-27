/*
 * Adapt a scalar ground height or preserve a supplied ground callback.
 */
export const groundFunction: (
  ground: number | ((x: number, z: number) => number),
) => (x: number, z: number) => number = (
  ground: number | ((x: number, z: number) => number),
): ((x: number, z: number) => number) =>
  typeof ground === "number" ? (): number => ground : ground;
