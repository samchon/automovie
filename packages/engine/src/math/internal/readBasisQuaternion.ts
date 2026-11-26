/**
 * Read raw X/Y/Z/W quaternion components from the three columns of an admitted
 * right-handed orthonormal basis. Shepperd's trace and dominant-diagonal
 * branches keep the denominator away from zero. For tied dominant diagonals,
 * the later axis in X/Y/Z order wins.
 *
 * The synchronous reader receives the components once, with the caller's
 * context and optional scalar offset. It controls output storage and any
 * normalization. Passing the coordinates by value allows the reader to write
 * over the source buffer without losing an unread component.
 */
export function readBasisQuaternion<Result, Context>(
  m00: number,
  m10: number,
  m20: number,
  m01: number,
  m11: number,
  m21: number,
  m02: number,
  m12: number,
  m22: number,
  read: (
    x: number,
    y: number,
    z: number,
    w: number,
    context: Context,
    offset: number,
  ) => Result,
  context: Context,
  offset: number = 0,
): Result {
  const trace: number = m00 + m11 + m22;
  if (trace > 0) {
    const s: number = Math.sqrt(trace + 1) * 2;
    return read(
      (m21 - m12) / s,
      (m02 - m20) / s,
      (m10 - m01) / s,
      s / 4,
      context,
      offset,
    );
  }
  if (m00 > m11 && m00 > m22) {
    const s: number = Math.sqrt(1 + m00 - m11 - m22) * 2;
    return read(
      s / 4,
      (m01 + m10) / s,
      (m02 + m20) / s,
      (m21 - m12) / s,
      context,
      offset,
    );
  }
  if (m11 > m22) {
    const s: number = Math.sqrt(1 + m11 - m00 - m22) * 2;
    return read(
      (m01 + m10) / s,
      s / 4,
      (m12 + m21) / s,
      (m02 - m20) / s,
      context,
      offset,
    );
  }
  const s: number = Math.sqrt(1 + m22 - m00 - m11) * 2;
  return read(
    (m02 + m20) / s,
    (m12 + m21) / s,
    s / 4,
    (m10 - m01) / s,
    context,
    offset,
  );
}
