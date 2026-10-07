import { measureAutoMovieMeshCrossings, triangulateAutoMovieRegion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import type { IAutoMovieHumanFaceTonguePassageSummary } from "../../structures/IAutoMovieHumanFaceTonguePassageSummary";
import { measureHumanFaceTongueSection } from "../../basis/measureHumanFaceTongueSection";
import type { IHumanFaceOralPassageProps } from "./IHumanFaceOralPassageProps";

/**
 * Judge generated tongue passage from actual retained teeth and final lips.
 * No clinical incisor landmark or absent native tooth is required. Existing
 * rigid contact already enforces present-crown clearance floors. A tongue
 * extending beyond the actual lower-lip port additionally needs its complete
 * triangle/slab section inside the projected upper/lower lip opening, and may
 * add no crown/tongue triangle crossing absent from the same shaped reference.
 *
 * The lip-plane projection and unchanged source slab/tolerance are coarse
 * geometric conventions, not a clinical incisal acquisition, full 3D lip seal
 * certificate, constant-volume mechanics or pharyngeal reconstruction. Source
 * baseline crossings are retained by exact triangle-pair identity rather than
 * forgiven by an aggregate count. Absent crowns supply no query or crossing.
 * @evidence contracts/common.md#principled-implementation Actual lip chains bound the measured tongue triangle/slab section, while complete present-crown crossing witnesses compare stable actual incidence against the same shaped reference.
 * @evidence contracts/common.md#clear-and-simple-design One generated oral passage owner separates geometric passage from unavailable clinical incisal measurements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No virtual tooth, inferred missing incisal edge, measured zero, added tolerance or aggregate crossing exemption enters.
 * @evidence contracts/common.md#meaningful-documentation States projection/slab conventions, complete section and crossing scope, rest-reference ownership and clinical limits.
 * @evidence contracts/modeling.md#spatial-conventions Source head-frame metres and jaw-axis unit directions are used throughout.
 * @evidence contracts/anatomy.md#anatomical-source Actual retained enamel and final lip ports supply geometric constraints without a clinical incisal protocol or muscle claim.
 * @author Samchon
 */
export function evaluateHumanFaceOralPassage(props: IHumanFaceOralPassageProps): IAutoMovieHumanFaceTonguePassageSummary | null {
  const { basis, assembly, positions, reference, up, forward } = props;
  const contact = basis.contact;
  if (contact?.margin === undefined || assembly.dentalColliders === undefined)
    throw new Error("Generated oral passage needs actual retained crowns and complete source lip ports.");
  const skin = positions.get(contact.lips.surface), tongue = positions.get(contact.passage.surface);
  const tongueRest = reference.get(contact.passage.surface);
  const sourceTongue = basis.surfaces.find(surface => surface.id === contact.passage.surface);
  if (skin === undefined || tongue === undefined || tongueRest === undefined || sourceTongue === undefined)
    throw new Error("Generated oral passage needs actual performed and shape-only tongue geometry.");
  const lower = contact.margin.lower.map(vertex => Vector3.create(...skin.slice(3 * vertex, 3 * vertex + 3)));
  const origin = Vector3.scale(lower.reduce((sum, point) => Vector3.add(sum, point), Vector3.create(0, 0, 0)), 1 / lower.length);
  const section = measureHumanFaceTongueSection(tongue, sourceTongue.indices, { origin, forward, up, slabMetres: contact.passage.slabMetres });
  if (section.protrudingMetres <= contact.toleranceMetres) return null;
  if (section.thicknessMetres === null) throw new Error("The protruding tongue has no actual lip-port slab section.");
  const across = Vector3.cross(up, forward);
  const projected = (point: readonly number[]): number[] => {
    const delta = Vector3.subtract(Vector3.create(...point), origin);
    return [Vector3.dot(delta, across), Vector3.dot(delta, up), Vector3.dot(delta, forward)];
  };
  const upper = contact.margin.upper.map(vertex => projected(skin.slice(3 * vertex, 3 * vertex + 3)));
  const bottom = contact.margin.lower.map(vertex => projected(skin.slice(3 * vertex, 3 * vertex + 3)));
  if ((upper[upper.length - 1][0] - upper[0][0]) * (bottom[bottom.length - 1][0] - bottom[0][0]) > 0) bottom.reverse();
  const opening = [...upper, ...bottom].filter((point, at, points) => at === 0 || point[0] !== points[at - 1][0] || point[1] !== points[at - 1][1]);
  if (opening.length > 1 && opening[0][0] === opening[opening.length - 1][0] && opening[0][1] === opening[opening.length - 1][1]) opening.pop();
  triangulateAutoMovieRegion({ outer: opening.map(point => ({ x: point[0], y: point[1] })) });
  const inside = (point: readonly number[]): boolean => {
    let contained = false;
    for (let at = 0; at < opening.length; at++) {
      const a = opening[at], b = opening[(at + 1) % opening.length];
      const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
      if (length > 0) {
        const t = ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / (length * length);
        if (t >= 0 && t <= 1 && Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy) <= contact.toleranceMetres) return true;
      }
      if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < a[0] + (point[1] - a[1]) * dx / dy) contained = !contained;
    }
    return contained;
  };
  const crossesBoundary = (a: readonly number[], b: readonly number[]): boolean => {
    const orientation = (p: readonly number[], q: readonly number[], r: readonly number[]): number =>
      (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    for (let at = 0; at < opening.length; at++) {
      const c = opening[at], d = opening[(at + 1) % opening.length];
      const ab = Math.hypot(b[0] - a[0], b[1] - a[1]), cd = Math.hypot(d[0] - c[0], d[1] - c[1]);
      const toleranceAB = contact.toleranceMetres * ab, toleranceCD = contact.toleranceMetres * cd;
      const ca = orientation(a, b, c), da = orientation(a, b, d), ac = orientation(c, d, a), bc = orientation(c, d, b);
      if (((ca > toleranceAB && da < -toleranceAB) || (da > toleranceAB && ca < -toleranceAB)) &&
        ((ac > toleranceCD && bc < -toleranceCD) || (bc > toleranceCD && ac < -toleranceCD))) return true;
    }
    return false;
  };
  const projectedTongue = Array.from({ length: tongue.length / 3 }, (_, vertex) => projected(tongue.slice(3 * vertex, 3 * vertex + 3)));
  for (let at = 0; at < sourceTongue.indices.length; at += 3) {
    let polygon = sourceTongue.indices.slice(at, at + 3).map(vertex => projectedTongue[vertex]);
    for (const direction of [-1, 1]) {
      const next: number[][] = [];
      for (let k = 0; k < polygon.length; k++) {
        const a = polygon[k], b = polygon[(k + 1) % polygon.length];
        const first = direction * a[2] <= contact.passage.slabMetres, second = direction * b[2] <= contact.passage.slabMetres;
        if (first) next.push(a);
        if (first !== second) {
          const t = (direction * contact.passage.slabMetres - a[2]) / (b[2] - a[2]);
          next.push(a.map((value, axis) => value + t * (b[axis] - value)));
        }
      }
      polygon = next;
    }
    if (polygon.some(point => !inside(point)) || polygon.some((point, k) => crossesBoundary(point, polygon[(k + 1) % polygon.length])))
      throw new Error("The performed tongue triangle/slab section does not fit the actual lip opening.");
  }
  const performedMesh: IAutoMovieMesh = { positions: [...tongue], indices: sourceTongue.indices, normals: null, uvs: null, skin: null };
  const referenceMesh: IAutoMovieMesh = { ...performedMesh, positions: [...tongueRest] };
  for (const crown of assembly.dentalColliders) {
    const known = new Set(measureAutoMovieMeshCrossings(referenceMesh, crown.rest, { allPairs: true }).map(pair => pair.triangle + ":" + pair.other + ":" + pair.coplanar));
    const additional = measureAutoMovieMeshCrossings(performedMesh, crown.posed, { allPairs: true }).find(pair => !known.has(pair.triangle + ":" + pair.other + ":" + pair.coplanar));
    if (additional !== undefined) throw new Error("The performed tongue adds a crossing of an actual retained crown at tongue triangle " + additional.triangle + ".");
  }
  return { plane: "lip-port", protrudingMetres: section.protrudingMetres, thicknessMetres: section.thicknessMetres };
}
