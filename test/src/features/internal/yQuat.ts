
/** A rotation of `deg` about +Y, as the value a rotation track carries. */
export function yQuat (deg: number): number[] {
  const half: number = (deg * Math.PI) / 360;
  return [0, Math.sin(half), 0, Math.cos(half)];
}
