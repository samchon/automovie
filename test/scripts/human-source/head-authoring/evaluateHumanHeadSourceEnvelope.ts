import type { IHumanHeadSourceAuthoring } from "./structures/IHumanHeadSourceAuthoring.ts";
import type { IHumanHeadSourceRecipe } from "./structures/IHumanHeadSourceRecipe.ts";
import { readHumanHeadSourceNativeState } from "./readHumanHeadSourceNativeState.ts";

/** Evaluate the existing shared cranial/facial/cervical source chart in native XYZ.
 * Compact smooth supports are source conventions, not an anthropometric inverse.
 * The licensed neck endpoint moves skin and joint witnesses together. Requests
 * remain unchanged; nonfinite quantities and unsupported joint span refuse.
 * Millimetres/degrees convert here to native metres/radians exactly once.
 */
export function evaluateHumanHeadSourceEnvelope(
  positions: Float64Array,
  joints: Float64Array,
  authoring: IHumanHeadSourceAuthoring,
  request: IHumanHeadSourceRecipe["head"],
): [Float64Array, Float64Array, Record<string, unknown>] {
  const { cranial, facial, cervical } = request;
  if (![cranial, facial, cervical].every((group) => Object.values(group).every(Number.isFinite)))
    throw new Error("Head source dimensions must be finite; caller values are not clamped.");
  const guide = authoring.profiles.sourceGuide;
  const landmark = (name: string): number[] => {
    const index = guide.landmarkNativeIds[name];
    if (!Number.isSafeInteger(index) || index < 0 || 3 * index >= positions.length)
      throw new Error("Head envelope needs an exact native landmark: " + name);
    return Array.from(positions.slice(3 * index, 3 * index + 3));
  };
  const glabella = landmark("glabella"), menton = landmark("menton"),
    subnasale = landmark("subnasale"), cheilion = landmark("cheilion-left"),
    tragion = landmark("tragion-left");
  let posterior = -Infinity, superior = -Infinity;
  for (const index of guide.headNativeIds) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= positions.length / 3)
      throw new Error("Head envelope has an invalid original source support.");
    posterior = Math.max(posterior, positions[3 * index + 1]);
    superior = Math.max(superior, positions[3 * index + 2]);
  }
  const jointIndex = (name: string): number => {
    const index = authoring.sample.manifest.landmarkIds.indexOf(name);
    if (index < 0) throw new Error("Head envelope lacks source joint: " + name);
    return index;
  };
  const headJoint = jointIndex("joint-head"), neckJoint = jointIndex("joint-neck");
  const neck = Array.from(joints.slice(3 * neckJoint, 3 * neckJoint + 3));
  const clavicle = Array.from(joints.slice(3 * jointIndex("joint-l-clavicle"), 3 * jointIndex("joint-l-clavicle") + 3));
  const radius = Math.abs(tragion[0]);
  if (superior <= glabella[2] || posterior <= glabella[1] || radius <= 0 || menton[2] <= clavicle[2])
    throw new Error("Head source supports do not form positive anatomical chart intervals.");
  const requestedSpan = cervical.cervicalJointSpanOffsetMillimetres / 1000;
  const endpointName = "neck/measure-neck-height-" + (requestedSpan >= 0 ? "incr" : "decr");
  const endpoint = readHumanHeadSourceNativeState(authoring.sample, endpointName);
  const endpointSpan = endpoint.landmarks[3 * headJoint + 2] - endpoint.landmarks[3 * neckJoint + 2];
  if (endpointSpan === 0 || !Number.isFinite(endpointSpan))
    throw new Error("Licensed cervical endpoint has no finite source-joint axial span.");
  const neckScale = requestedSpan / endpointSpan;
  if (neckScale < 0 || neckScale > 1)
    throw new Error("Requested cervical joint-span difference exceeds the licensed source endpoint envelope.");
  const skinNeckDelta = new Float64Array(positions.length);
  endpoint.vertices.forEach((vertex, row) => skinNeckDelta.set(endpoint.deltas.subarray(3 * row, 3 * row + 3), 3 * vertex));
  const step = (value: number): number => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  const band = (value: number, lower: number, upper: number): number => {
    const t = Math.max(0, Math.min(1, (value - lower) / (upper - lower)));
    return 16 * t * t * (1 - t) * (1 - t);
  };
  const evaluate = (points: Float64Array, wholeNeckDelta: Float64Array): Float64Array => {
    const result = points.slice();
    for (let at = 0; at < points.length; at += 3) {
      const x = points[at], y = points[at + 1], z = points[at + 2], lateral = Math.sign(x);
      const above = step((z - glabella[2]) / (superior - glabella[2]));
      const back = step((y - glabella[1]) / (posterior - glabella[1])), front = 1 - back;
      const high = step((z - neck[2]) / (glabella[2] - neck[2]));
      result[at] += lateral * cranial.vaultBreadthOffsetMillimetres / 2000 * above;
      result[at + 2] += cranial.vaultHeightOffsetMillimetres / 1000 * above;
      result[at + 1] += cranial.occipitalProjectionOffsetMillimetres / 1000 * back * high;
      const lean = Math.tan(cranial.foreheadInclinationOffsetDegrees * Math.PI / 180);
      result[at + 1] -= lean * Math.max(z - glabella[2], 0) * above * front;
      const temporal = band(z, subnasale[2], glabella[2]) * step(Math.abs(x) / radius);
      result[at] += lateral * cranial.temporalBreadthOffsetMillimetres / 2000 * temporal;
      const cheekX = band(Math.abs(x), Math.abs(cheilion[0]), radius);
      const malar = band(z, subnasale[2], glabella[2]) * cheekX * front;
      const buccal = band(z, cheilion[2], subnasale[2]) * cheekX * front;
      const jaw = band(z, menton[2], cheilion[2]) * step(Math.abs(x) / radius) * front;
      const malarValue = x >= 0 ? facial.leftMalarProjectionOffsetMillimetres : facial.rightMalarProjectionOffsetMillimetres;
      const hollowValue = x >= 0 ? facial.leftBuccalHollowOffsetMillimetres : facial.rightBuccalHollowOffsetMillimetres;
      const jawValue = x >= 0 ? facial.leftMandibularBreadthOffsetMillimetres : facial.rightMandibularBreadthOffsetMillimetres;
      result[at + 1] += (hollowValue * buccal - malarValue * malar) / 1000;
      result[at] += lateral * jawValue * jaw / 1000;
      const chin = band(z, neck[2], cheilion[2]) * (1 - step(Math.abs(x) / Math.abs(cheilion[0]))) * front;
      result[at + 1] -= facial.chinProjectionOffsetMillimetres / 1000 * chin;
      result[at + 2] -= facial.chinHeightOffsetMillimetres / 1000 * chin;
      const radial = Math.hypot(x, y - neck[1]), neckLocal = 1 - step(radial / radius);
      const throat = band(z, clavicle[2], menton[2]) * neckLocal;
      const anterior = step((neck[1] - y) / radius), posteriorWeight = step((y - neck[1]) / radius);
      result[at + 1] += (cervical.posteriorFullnessOffsetMillimetres * posteriorWeight - cervical.anteriorFullnessOffsetMillimetres * anterior) / 1000 * throat;
      const submental = band(z, neck[2], subnasale[2]) * neckLocal * anterior;
      result[at + 1] -= cervical.cervicomentalProjectionOffsetMillimetres / 1000 * submental;
      for (let axis = 0; axis < 3; axis++) result[at + axis] += neckScale * wholeNeckDelta[at + axis];
    }
    if (!result.every(Number.isFinite)) throw new Error("The requested head source dimensions produce nonfinite geometry.");
    return result;
  };
  const shaped = evaluate(positions, skinNeckDelta), shapedJoints = evaluate(joints, endpoint.landmarks);
  const maximum = [0, 0, 0];
  let affectedVertices = 0, affectedJoints = 0;
  for (let at = 0; at < positions.length; at += 3) {
    if ([0, 1, 2].some((axis) => shaped[at + axis] !== positions[at + axis])) affectedVertices++;
    for (let axis = 0; axis < 3; axis++) maximum[axis] = Math.max(maximum[axis], Math.abs(shaped[at + axis] - positions[at + axis]) * 1000);
  }
  for (let at = 0; at < joints.length; at += 3)
    if ([0, 1, 2].some((axis) => shapedJoints[at + axis] !== joints[at + axis])) affectedJoints++;
  if (!maximum.every(Number.isFinite))
    throw new Error("Head source displacement observations are not representable finite millimetres.");
  return [shaped, shapedJoints, {
    schema: "automovie-authored-head-envelope/1", stage: "shared exterior source authoring", basis: guide.basis,
    recipe: structuredClone(request), frame: "Blender metres, +X left, +Z up, -Y anterior",
    supports: { glabella, menton, subnasale, cheilionLeft: cheilion, tragionLeft: tragion, jointNeck: neck, leftClavicle: clavicle },
    qualification: "smooth source-envelope chart, not bone/fat reconstruction, measured clinical angle or population range",
    cervicalJointSpan: { sourceEndpoint: endpointName, sourceRecipe: authoring.sample.states.get(endpointName)!.recipe,
      definition: "joint-head minus joint-neck Blender Z; neither clinical neck height nor girth", endpointDifferenceMillimetres: endpointSpan * 1000, endpointFraction: neckScale },
    affectedNativeVertices: affectedVertices, affectedSourceJoints: affectedJoints, maxCoordinateDisplacementMillimetres: maximum,
    pending: ["ocular/oral attachment admission", "source cut/tree/endpoint/normal/UV/hair/contact regeneration", "actual same-person motion/editor/save/staticF32/GPU"],
  }];
}
