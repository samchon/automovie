/** Construct a world point selector from its coordinates in metres. */
export const geometrySelectorTestPoint = (x: number, y: number, z: number) => ({
  kind: "point" as const,
  position: { x, y, z },
});
