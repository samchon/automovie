/**
 * Convert source-authored Blender XYZ to the canonical body metre frame.
 * The extraction offset belongs to the recorded source convention, never a
 * caller's anatomical value. A zero offset converts displacement vectors.
 * Both original sampling and authored providers consume this single formula.
 */
export function convertHumanSourceCoordinates(native: Float64Array, offset: number): Float64Array {
  if (native.length % 3 !== 0 || !Number.isFinite(offset))
    throw new Error("Source coordinates need complete XYZ triples and a finite extraction offset.");
  const canonical = new Float64Array(native.length);
  for (let vertex = 0; vertex < native.length / 3; vertex++) {
    const at = 3 * vertex;
    if (!Number.isFinite(native[at]) || !Number.isFinite(native[at + 1]) || !Number.isFinite(native[at + 2]))
      throw new Error(`Source vertex ${vertex} has nonfinite native coordinates.`);
    canonical[at] = native[at];
    canonical[at + 1] = native[at + 2] - offset;
    canonical[at + 2] = -native[at + 1];
  }
  return canonical;
}
