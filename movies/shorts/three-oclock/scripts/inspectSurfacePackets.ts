import { createAutoMovieMeshCrossingQuery, createAutoMovieMeshSeparationQuery, createAutoMovieSignedMeshQuery, inspectAutoMovieMeshTopology } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import * as THREE from "three";

/** Original retained vertex/index data, before any current world transform. */
interface Geometry { positions: number[][]; indices: number[] | null; rawPositionBytes: number[]; }
/** One real displayed part and its exact captured scene matrix. */
interface Part { bone?: string; side?: string; kind: string; meshId: string; geometry: string; matrixWorld: number[]; }
/** The fixed actual-Viewer observation population; this script never seeks it. */
interface Packet { frame: number; actors: { carina: { parts: Part[] }; harry: { parts: Part[] } }; paper: Part; }
/** One immutable world snapshot compiled only for this captured transform. */
interface Surface {
  mesh: IAutoMovieMesh; vertices: { x: number; y: number; z: number }[];
  separation: ReturnType<typeof createAutoMovieMeshSeparationQuery>;
  crossing: ReturnType<typeof createAutoMovieMeshCrossingQuery>;
  inverse: THREE.Matrix4; geometry: string;
}

/**
 * Classify the complete ambiguous hover and turn from original Viewer triangles.
 *
 * @evidence contracts/common.md#implementation-and-ownership Reads frozen original geometry/matrices without building Human or changing any source/pose. Installed Engine crossing supplies strict original-triangle witnesses; signed queries retain closed-surface admission/refusal and original vertex observations. Whole-part convex-feature separation is only a conservative certificate, never penetration on failure. Uncertified hulls refine with each original triangle, sharing one unchanged work budget; exhaustion stays unknown. World meshes remain original surfaces, not a hand-wide hull or proxy.
 * @evidence contracts/common.md#authoring-interface Run from production after actual-viewer-data.json exists. Writes surface-detail.json with source digest, every observed pair result and API limitations. Examines all753–805 hand/paper and606–648 opposite-leg/foot/shoe pairs, memoizing only exact geometry+matrix signatures. Static24fps evidence is not a swept or continuous-watch certificate; oriented sign still assumes the caller's embedded outward closed surface. Queries/point arrays are bounded to the fixed packet and released at exit.
 */
export async function inspectSurfacePackets(): Promise<void> {
  const sourcePath: string = ".cache/motion-viewer/post-rollback-round/actual-viewer-data.json";
  const bytes: Buffer = await readFile(sourcePath);
  const input: { geometry: Record<string, Geometry>; packets: Packet[] } = JSON.parse(bytes.toString("utf8"));
  const locals: Map<string, { mesh: IAutoMovieMesh; topology: ReturnType<typeof inspectAutoMovieMeshTopology>; signed?: ReturnType<typeof createAutoMovieSignedMeshQuery>; refusal?: string }> = new Map();
  for (const [id, geometry] of Object.entries(input.geometry)) {
    const mesh: IAutoMovieMesh = { positions: geometry.positions.flat(), indices: geometry.indices, normals: null, uvs: null, skin: null };
    const value: { mesh: IAutoMovieMesh; topology: ReturnType<typeof inspectAutoMovieMeshTopology>; signed?: ReturnType<typeof createAutoMovieSignedMeshQuery>; refusal?: string } = { mesh, topology: inspectAutoMovieMeshTopology(mesh) };
    try { value.signed = createAutoMovieSignedMeshQuery(mesh); }
    catch (error) { value.refusal = error instanceof Error ? error.message : String(error); }
    locals.set(id, value);
  }
  const worlds: Map<string, Surface> = new Map();
  const verdicts: Map<string, object> = new Map();
  const pairs: object[] = [];

  /** Compile exact original vertices in one retained scene-world metre frame. */
  function surface(part: Part): Surface {
    const key: string = `${part.geometry}|${JSON.stringify(part.matrixWorld)}`;
    const existing: Surface | undefined = worlds.get(key);
    if (existing !== undefined) return existing;
    const matrix: THREE.Matrix4 = new THREE.Matrix4().fromArray(part.matrixWorld);
    const geometry: Geometry = input.geometry[part.geometry]!;
    const positions: number[] = geometry.positions.flatMap((row: number[]): number[] => new THREE.Vector3(...row).applyMatrix4(matrix).toArray());
    const mesh: IAutoMovieMesh = { positions, indices: geometry.indices, normals: null, uvs: null, skin: null };
    const unique: Map<string, { x: number; y: number; z: number }> = new Map();
    for (let at: number = 0; at < positions.length; at += 3) unique.set(`${positions[at]},${positions[at + 1]},${positions[at + 2]}`, { x: positions[at]!, y: positions[at + 1]!, z: positions[at + 2]! });
    const value: Surface = { mesh, vertices: [...unique.values()], separation: createAutoMovieMeshSeparationQuery(mesh, "source"), crossing: createAutoMovieMeshCrossingQuery(mesh), inverse: matrix.clone().invert(), geometry: part.geometry };
    worlds.set(key, value);
    return value;
  }

  /** A signed observation is used only when the actual part admits closed queries. */
  function contained(first: Surface, second: Surface): { minimum?: number; insideVertices: number; refusal?: string } {
    const host: NonNullable<ReturnType<typeof locals.get>> = locals.get(second.geometry)!;
    if (host.signed === undefined || !(host.topology.volume > 0)) return { insideVertices: 0, refusal: host.refusal ?? "Positive outward volume not established" };
    let minimum: number = Infinity;
    let insideVertices: number = 0;
    for (const point of first.vertices) {
      const local: THREE.Vector3 = new THREE.Vector3(point.x, point.y, point.z).applyMatrix4(second.inverse);
      const distance: number = host.signed(local.toArray()).signedDistance;
      minimum = Math.min(minimum, distance);
      if (distance < 0) insideVertices++;
    }
    return { minimum, insideVertices };
  }

  /** Refine only with source triangles; a new budget is never supplied mid-pair. */
  function triangles(first: Surface, second: Surface, budget: { remaining: number }): boolean {
    const indices: number[] = first.mesh.indices ?? Array.from({ length: first.mesh.positions.length / 3 }, (_value: unknown, index: number): number => index);
    for (let at: number = 0; at < indices.length; at += 3) {
      const feature: { x: number; y: number; z: number }[] = [0, 1, 2].map((offset: number): { x: number; y: number; z: number } => {
        const index: number = indices[at + offset]! * 3;
        return { x: first.mesh.positions[index]!, y: first.mesh.positions[index + 1]!, z: first.mesh.positions[index + 2]! };
      });
      if (!second.separation.separated(feature, { clearance: 0.002, budget }).certified) return false;
    }
    return true;
  }

  /** Keep strict witnesses, conservative unknowns and conditional inside signs distinct. */
  function inspect(first: Part, second: Part): object {
    const key: string = JSON.stringify([first.geometry, first.matrixWorld, second.geometry, second.matrixWorld]);
    const old: object | undefined = verdicts.get(key);
    if (old !== undefined) return old;
    const a: Surface = surface(first);
    const b: Surface = surface(second);
    const budget: { remaining: number } = { remaining: 1_000_000 };
    let hullSeparated: boolean = false;
    let surfaceSeparated: boolean = false;
    let error: string | undefined;
    let crossings: ReturnType<typeof b.crossing> = [];
    let insideA: ReturnType<typeof contained> | undefined;
    let insideB: ReturnType<typeof contained> | undefined;
    try {
      const forward: boolean = b.separation.separated(a.vertices, { clearance: 0.002, budget }).certified;
      const reverse: boolean = a.separation.separated(b.vertices, { clearance: 0.002, budget }).certified;
      hullSeparated = forward && reverse;
      if (!hullSeparated) {
        crossings = b.crossing(a.mesh, { allPairs: true });
        insideA = contained(a, b); insideB = contained(b, a);
        if (crossings.length === 0) surfaceSeparated = triangles(a, b, budget) && triangles(b, a, budget);
      } else surfaceSeparated = true;
    } catch (failure) { error = failure instanceof Error ? failure.message : String(failure); }
    const value: object = { hullSeparated, surfaceSeparated, strictCrossings: crossings, insideA, insideB, error, workSpent: 1_000_000 - budget.remaining };
    verdicts.set(key, value);
    return value;
  }
  for (const packet of input.packets) {
    if (packet.frame >= 753 && packet.frame <= 805) {
      const giver: Part[] = packet.actors.carina.parts.filter((part: Part): boolean => part.kind === "hand-skin");
      const receiver: Part[] = packet.actors.harry.parts.filter((part: Part): boolean => part.kind === "hand-skin");
      for (const hand of receiver) pairs.push({ frame: packet.frame, role: "paper-receiver", a: packet.paper, b: hand, result: inspect(packet.paper, hand) });
      for (const a of giver) for (const b of receiver) pairs.push({ frame: packet.frame, role: "giver-receiver", a, b, result: inspect(a, b) });
    }
    if (packet.frame >= 606 && packet.frame <= 648) {
      const left: Part[] = packet.actors.carina.parts.filter((part: Part): boolean => part.side === "left");
      const right: Part[] = packet.actors.carina.parts.filter((part: Part): boolean => part.side === "right");
      for (const a of left) for (const b of right) pairs.push({ frame: packet.frame, role: "opposite-legs", a, b, result: inspect(a, b) });
    }
  }
  await writeFile(".cache/motion-viewer/post-rollback-round/surface-detail.json", JSON.stringify({ scope: "Fixed actual Viewer triangles at declared24fps frames; no source/pose changes or swept certificate", source: { path: sourcePath, sha256: createHash("sha256").update(bytes).digest("hex") },
    semantics: { hull: "Bidirectional convex-feature certificate is conservative; failure is not penetration", crossings: "Original strict transverse/coplanar witnesses; touching and containment are separate", sign: "Conditional on admitted embedded outward closed part; refusals retained", clearance: 0.002, budgetPerPair: 1_000_000 },
    geometry: [...locals].map(([id, value]): object => ({ id, topology: value.topology, signedAdmitted: value.signed !== undefined, signedRefusal: value.refusal })), pairs, uniqueWorlds: worlds.size, uniquePairs: verdicts.size }, null, 2) + "\n");
  console.log(`Inspected ${pairs.length} original-surface pairs (${verdicts.size} unique exact-transform requests).`);
}

void inspectSurfacePackets().catch((error: unknown): void => { console.error(error); process.exitCode = 1; });
