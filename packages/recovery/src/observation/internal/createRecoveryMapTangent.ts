/*
 * Construct two raw coefficient directions for an admitted seed translation.
 */
export function createRecoveryMapTangent(
  t: readonly [number, number, number],
): [number, number, number][] {
  if (Math.abs(Math.hypot(...t) - 1) > 1e-10)
    throw new Error("camera-map: unit seed translation required");
  let least: number = 0;
  for (let at: number = 1; at < 3; at++)
    if (Math.abs(t[at]!) < Math.abs(t[least]!)) least = at;
  const a: [number, number, number] = [0, 0, 0];
  for (let at: number = 0; at < 3; at++)
    a[at] = (at === least ? 1 : 0) - t[at]! * t[least]!;
  const norm: number = Math.hypot(...a);
  for (let at: number = 0; at < 3; at++) a[at] = a[at]! / norm;
  return [
    a,
    [
      t[1] * a[2] - t[2] * a[1],
      t[2] * a[0] - t[0] * a[2],
      t[0] * a[1] - t[1] * a[0],
    ],
  ];
}
