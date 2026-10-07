import type { IAutoMovieHumanFaceAttachmentPoint } from "@automovie/human/face/structures/IAutoMovieHumanFaceAttachmentPoint";
import { readHumanSourceAttachmentLoops } from "./readHumanSourceAttachmentLoops.ts";
import { readHumanSourceAttachmentTopology } from "./readHumanSourceAttachmentTopology.ts";
import type { IHumanSourceTongueAttachmentLoop } from "./structures/IHumanSourceTongueAttachmentLoop.ts";
import type { IHumanSourceTongueRestProblem } from "./structures/IHumanSourceTongueRestProblem.ts";

/**
 * Register the source's attached root versus free tongue material boundary.
 * The selected source material is a connected ventral triangle patch, not a
 * transverse ring through the dorsum. Negative outward apical normals define
 * ventral faces. Triangle centres behind the authored 40% tip-to-back station
 * and between the actual first-molar lingual source extents define its coarse
 * material domain. Its native boundary is read from actual incidence. Source
 * resolution therefore limits its position; it claims no measured frenulum
 * boundary or physical hyoid insertion. Every boundary station retains an
 * exact native vertex and host-triangle seat for shared runtime floor geometry.
 */
export function defineHumanSourceTongueAttachmentLoop(problem: IHumanSourceTongueRestProblem, positions: readonly number[]): IHumanSourceTongueAttachmentLoop {
  const projection = (point: readonly number[], direction: readonly number[]): number => direction.reduce((sum, value, axis) => sum + value * (point[axis] - problem.upper.origin[axis]), 0);
  const read = (vertex: number): number[] => positions.slice(3 * vertex, 3 * vertex + 3);
  const values = Array.from({ length: positions.length / 3 }, (_, vertex) => projection(read(vertex), problem.upper.forward));
  const station = Math.max(...values) - 0.4 * (Math.max(...values) - Math.min(...values));
  const dental = problem.face.surfaces.find((surface) => surface.id === "Human.teeth_base")!;
  const bounds = ["46", "36"].map((id) => {
    const crown = problem.crowns.find((one) => one.id === id);
    if (crown === undefined) throw new Error("Tongue attachment needs both actual first-molar source supports.");
    const coordinates = crown.vertices.map((vertex) => projection(dental.positions.slice(3 * vertex, 3 * vertex + 3), problem.upper.lateral));
    return id === "46" ? Math.max(...coordinates) : Math.min(...coordinates);
  });
  if (!(bounds[1] > bounds[0])) throw new Error("Tongue attachment first-molar supports have no lingual interval.");
  const topology = readHumanSourceAttachmentTopology(problem.indices, positions.length / 3);
  if ([...topology.edges.values()].some((faces) => faces.length !== 2)) throw new Error("Source tongue needs its actual closed native topology before ventral orientation can be registered.");
  const origin = read(0);
  let volume = 0;
  for (let at = 0; at < problem.indices.length; at += 3) {
    const [a, b, c] = problem.indices.slice(at, at + 3).map((vertex) => read(vertex).map((value, axis) => value - origin[axis]));
    volume += a[0] * (b[1] * c[2] - b[2] * c[1]) + a[1] * (b[2] * c[0] - b[0] * c[2]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  }
  if (volume === 0 || !Number.isFinite(volume)) throw new Error("Source tongue has no oriented native volume.");
  const selected = new Set<number>(), centres = new Map<number, number>();
  for (let triangle = 0; triangle < problem.indices.length / 3; triangle++) {
    const [a, b, c] = problem.indices.slice(3 * triangle, 3 * triangle + 3).map(read);
    const u = b.map((value, axis) => value - a[axis]), v = c.map((value, axis) => value - a[axis]);
    const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const apical = normal.reduce((sum, value, axis) => sum + value * problem.upper.apical[axis], 0) * Math.sign(volume);
    const centre = a.map((value, axis) => (value + b[axis] + c[axis]) / 3);
    const lateral = projection(centre, problem.upper.lateral), forward = projection(centre, problem.upper.forward);
    if (apical < 0 && forward <= station && lateral >= bounds[0] && lateral <= bounds[1]) { selected.add(triangle); centres.set(triangle, forward); }
  }
  if (selected.size === 0) throw new Error("Source tongue supplies no ventral attachment material in the declared domain.");
  const seed = [...selected].reduce((best, triangle) => centres.get(triangle)! < centres.get(best)! ? triangle : best);
  const patch = new Set<number>([seed]), queue = [seed];
  for (let at = 0; at < queue.length; at++) for (const neighbor of topology.faceNeighbors[queue[at]])
    if (selected.has(neighbor) && !patch.has(neighbor)) { patch.add(neighbor); queue.push(neighbor); }
  const loops = readHumanSourceAttachmentLoops(problem.indices, patch);
  if (loops.length !== 1 || loops[0].length < 3) throw new Error("Source ventral attachment patch needs one actual simple native boundary.");
  const nativeVertices = loops[0];
  const points: IAutoMovieHumanFaceAttachmentPoint[] = nativeVertices.map((vertex) => {
    const triangle = [...topology.vertexFaces[vertex]].find((face) => patch.has(face))!;
    return { triangle, weights: problem.indices.slice(3 * triangle, 3 * triangle + 3).map((corner) => corner === vertex ? 1 : 0) };
  });
  return { surface: "Human.tongue01", nativeVertices, points, attachedTriangles: [...patch].sort((a, b) => a - b),
    attachedSourceVertices: [...new Set([...patch].flatMap((triangle) => problem.indices.slice(3 * triangle, 3 * triangle + 3)))].sort((a, b) => a - b),
    frame: "head-metres-y-up-z-anterior",
    qualification: "Authored connected native ventral material patch behind the 40% tip-to-back source station and between actual first-molar lingual extents. Source resolution limits that boundary. Native physical correspondence is exact; clinical frenulum and hyoid insertion remain unknown." };
}
