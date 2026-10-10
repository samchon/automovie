import type { IHumanHeadSourceGuide } from "./structures/IHumanHeadSourceGuide.ts";
import type { IHumanHeadNasalEnvelopeRecipe } from "./structures/IHumanHeadNasalEnvelopeRecipe.ts";

/** Evaluate connected native nasal exterior supports on skin and joint witnesses.
 * Compact ellipsoidal fields retain the original source convention and authored
 * tip identity. They establish no clinical nasion/pronasale or hidden cartilage.
 * Caller coordinates and requested millimetres remain unchanged.
 */
export function evaluateHumanHeadSourceNasalEnvelope(
  positions: Float64Array,
  joints: Float64Array,
  guide: IHumanHeadSourceGuide,
  request: IHumanHeadNasalEnvelopeRecipe,
): [Float64Array, Float64Array, Record<string, unknown>] {
  if (Object.entries(request).some(([name, value]) => name !== "qualification" && !Number.isFinite(value)))
    throw new Error("Nasal source dimensions must be finite; caller values are not clamped.");
  const source = guide.landmarkNativeIds;
  const point = (index: number | undefined): number[] => {
    if (!Number.isSafeInteger(index) || index! < 0 || 3 * index! >= positions.length)
      throw new Error("Nasal source exterior requires its actual original native support.");
    return Array.from(positions.slice(3 * index!, 3 * index! + 3));
  };
  const root = point(source.sellion), base = point(source.subnasale),
    left = point(source["alar-curvature-left"]), right = point(source["alar-curvature-right"]),
    tip = point(guide.nasalTipNativeSupport);
  const halfWidth = Math.max(Math.abs(left[0]), Math.abs(right[0]));
  const height = root[2] - base[2], depth = base[1] - tip[1];
  if (halfWidth <= 0 || height <= 0 || depth <= 0)
    throw new Error("Nasal source witnesses lack positive section spans.");
  const support = (xyz: readonly number[], centre: readonly number[], radii: readonly number[]): number => {
    let squared = 0;
    for (let axis = 0; axis < 3; axis++) squared += ((xyz[axis] - centre[axis]) / radii[axis]) ** 2;
    return Math.max(1 - squared, 0) ** 2;
  };
  const dorsumCentre = root.map((value, axis) => (value + tip[axis]) / 2);
  const evaluate = (points: Float64Array): Float64Array => {
    const result = points.slice();
    for (let at = 0; at < points.length; at += 3) {
      const xyz = Array.from(points.subarray(at, at + 3));
      const rootField = support(xyz, root, [halfWidth, depth, height / 2]);
      const dorsum = support(xyz, dorsumCentre, [halfWidth, depth, height / 2]);
      const bulb = support(xyz, tip, [halfWidth, depth, height / 2]);
      const columella = support(xyz, base, [halfWidth / 2, depth, height / 3]);
      result[at + 1] -= (request.rootProjectionOffsetMillimetres * rootField + request.dorsumProjectionOffsetMillimetres * dorsum + request.tipProjectionOffsetMillimetres * bulb + request.columellarProjectionOffsetMillimetres * columella) / 1000;
      result[at] += xyz[0] / halfWidth * request.tipBreadthOffsetMillimetres / 2000 * bulb;
      result[at] += xyz[0] / (halfWidth / 2) * request.columellarBreadthOffsetMillimetres / 2000 * columella;
      result[at + 2] += request.tipHeightOffsetMillimetres / 1000 * bulb;
      for (const [sign, centre, breadth, rise] of [
        [1, left, request.leftAlarBreadthOffsetMillimetres, request.leftAlarHeightOffsetMillimetres],
        [-1, right, request.rightAlarBreadthOffsetMillimetres, request.rightAlarHeightOffsetMillimetres],
      ] as const) {
        const weight = support(xyz, centre, [halfWidth, depth, height / 3]);
        result[at] += sign * breadth / 1000 * weight;
        result[at + 2] += rise / 1000 * weight;
      }
    }
    if (!result.every(Number.isFinite)) throw new Error("Nasal source dimensions produce nonfinite geometry.");
    return result;
  };
  const shaped = evaluate(positions), shapedJoints = evaluate(joints);
  const affected = (before: Float64Array, after: Float64Array): number => {
    let count = 0;
    for (let at = 0; at < before.length; at += 3)
      if ([0, 1, 2].some((axis) => before[at + axis] !== after[at + axis])) count++;
    return count;
  };
  return [shaped, shapedJoints, {
    request: structuredClone(request),
    supports: { sellionNative: source.sellion, tipNativeAuthored: guide.nasalTipNativeSupport,
      subnasaleNative: source.subnasale, alarNativeLeft: source["alar-curvature-left"], alarNativeRight: source["alar-curvature-right"] },
    qualification: "compact source-sectional exterior; neither clinical nasion/pronasale nor cartilage/airway reconstruction",
    affectedNativeVertices: affected(positions, shaped), affectedJointWitnesses: affected(joints, shapedJoints),
  }];
}
