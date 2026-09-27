/**
 * Directions toward a round light source of angular radius `halfAngle`
 * centred on `direction`, as `count` point lights of equal solid angle.
 *
 * A photographic key light has an extent. A softbox subtends tens of degrees
 * at the face, and a shadow's penumbra is as wide as the occluder's distance
 * times the source's angular diameter, so under it the nose's shadow fades
 * over a centimetre while a point light draws it with a hard edge. The source
 * is sampled on its spherical cap along Vogel's golden-angle spiral (Vogel,
 * Math Biosci 1979;44:179-189): the k-th of `count` directions sits at the
 * polar angle whose cap holds (k + 1/2) / `count` of the source's solid angle
 * and turns from the one before by the golden angle, so each stands for an
 * equal share of the source and together they cover it without rows. Each
 * direction keeps the length of `direction`.
 *
 * Pure: returns new arrays.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Keeps the inspected face readable under a photographically exposed, white-balanced light rig.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Exposes and white balances the preview on a key-lit grey card without changing the saved anatomical document.
 */
export function humanPreviewSoftbox(
  direction: readonly [number, number, number],
  halfAngle: number,
  count: number,
): [number, number, number][] {
  const length = Math.hypot(...direction);
  if (!(length > 0)) throw new Error("A light direction needs a length.");
  if (!(halfAngle > 0 && halfAngle < Math.PI / 2))
    throw new Error("A source's half angle lies between 0 and a right angle.");
  if (!(Number.isInteger(count) && count >= 1))
    throw new Error("A source needs one sample or more.");
  const w = direction.map((value) => value / length) as [
    number,
    number,
    number,
  ];
  // The axis least aligned with the direction spans the cap's plane.
  const least = [0, 1, 2].reduce((best, k) =>
    Math.abs(w[k]!) < Math.abs(w[best]!) ? k : best,
  );
  const axis: [number, number, number] = [0, 0, 0];
  axis[least] = 1;
  const cross = (
    a: readonly number[],
    b: readonly number[],
  ): [number, number, number] => [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
  const u0 = cross(w, axis);
  const norm = Math.hypot(...u0);
  const u = u0.map((value) => value / norm);
  const v = cross(w, u);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const cap = 1 - Math.cos(halfAngle);
  return Array.from({ length: count }, (_, k) => {
    const polar = Math.acos(1 - ((k + 0.5) / count) * cap);
    const turn = k * golden;
    const [s, c] = [Math.sin(polar), Math.cos(polar)];
    return [0, 1, 2].map(
      (axis) =>
        length *
        (c * w[axis]! +
          s * (Math.cos(turn) * u[axis]! + Math.sin(turn) * v[axis]!)),
    ) as [number, number, number];
  });
}
