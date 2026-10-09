/** Signed PL-chain quantity and its optional original-vertex gradient. @author Samchon */
interface SignedIntegralReading { value: number; gradient?: Float64Array }

/**
 * Complete emitted oriented PL-chain integral in cubic metres and its optional
 * vertex derivative. Cavities subtract and opposite facets cancel. Intersecting
 * source shells retain their algebraic contribution; this is not union volume.
 * A shared local mean includes unreferenced vertices. Its derivative is carried
 * through the mean correction, while compensated summation reduces cancellation.
 */
export function readHumanBodyMaterialSignedIntegral(
  positions: ArrayLike<number>, indices: ArrayLike<number>, derivative = false,
): SignedIntegralReading {
  if (positions.length === 0 || positions.length % 3 || indices.length % 3)
    throw new Error("Signed source quantity needs complete XYZ and triangle ordinals.");
  const count = positions.length / 3;
  const center = [0, 0, 0];
  for (let i = 0; i < positions.length; i++) {
    if (!Number.isFinite(positions[i])) throw new Error("Signed source quantity has nonfinite coordinates.");
    center[i % 3] += positions[i] / count;
  }
  const gradient = derivative ? new Float64Array(positions.length) : undefined;
  let value = 0, correction = 0;
  for (let at = 0; at < indices.length; at += 3) {
    const ids = [indices[at], indices[at + 1], indices[at + 2]];
    if (ids.some((id) => !Number.isSafeInteger(id) || id < 0 || id >= count))
      throw new Error("Signed source quantity has an invalid triangle ordinal.");
    const a = ids.map((id) => [positions[3 * id] - center[0], positions[3 * id + 1] - center[1], positions[3 * id + 2] - center[2]]);
    const bc = cross(a[1], a[2]);
    const term = (a[0][0] * bc[0] + a[0][1] * bc[1] + a[0][2] * bc[2]) / 6;
    const adjusted = term - correction;
    const next = value + adjusted;
    correction = next - value - adjusted;
    value = next;
    if (gradient !== undefined) {
      const rows = [bc, cross(a[2], a[0]), cross(a[0], a[1])];
      for (let corner = 0; corner < 3; corner++)
        for (let axis = 0; axis < 3; axis++) gradient[3 * ids[corner] + axis] += rows[corner][axis] / 6;
    }
  }
  if (!Number.isFinite(value)) throw new Error("Signed source integral exceeds finite arithmetic.");
  if (gradient !== undefined) {
    const mean = [0, 0, 0];
    for (let i = 0; i < gradient.length; i++) mean[i % 3] += gradient[i] / count;
    for (let i = 0; i < gradient.length; i++) gradient[i] -= mean[i % 3];
  }
  return { value, gradient };
}

function cross(a: readonly number[], b: readonly number[]): number[] {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
