/**
 * Topology ledger for model meshes sent to the actual renderer
 * (`.agents/skills/source-authoring/geometry.md`, Consequence ledger). Joins one
 * model's part meshes through engine mergeAutoMovieMeshes, reads
 * inspectAutoMovieMeshTopology (triangles, degeneracy, non-finite components,
 * open/non-manifold edges and signed volume) and validateMeshTopology (winding
 * consistency) unchanged, and adds two quantities the engine does not count.
 * (1) Open edges after T-junction resolution: splitting adjacent convex faces
 * can leave a face vertex on another face's edge, producing welded open edges
 * without a gap. Splits each edge at such vertices and counts only directed
 * subedges without an opposite partner as actual gaps.
 * (2) Connected components: unions of vertices joined by triangles and T-junctions.
 * Welding uses the engine's nanometre grid; the on-edge tolerance is 1e-6 m.
 * Ledger values are geometric facts, without judging appearance or design fit.
 */
import { inspectAutoMovieMeshTopology, mergeAutoMovieMeshes, tessellateToMesh, validateMeshTopology } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieMesh, IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";

export interface MeshAccount {
  id: string;
  parts: number;
  /** Vertex counts in the buffer before welding and after welding. */
  vertices: number;
  weldedVertices: number;
  triangles: number;
  degenerate: number;
  nonFinite: number;
  /** Welded open edges reported by the engine, including T-junctions. */
  boundaryEdges: number;
  nonManifoldEdges: number;
  /** Adjacent triangles traversing their shared edge in the same direction (engine validateMeshTopology). */
  windingErrors: number;
  /** Unpaired subedges after T-junction resolution, representing actual gaps. */
  openEdges: number;
  /** Subedges used at least three times after resolution. */
  resolvedNonManifold: number;
  /** Midpoints of the first 8 open or non-manifold subedges, for locating observations. */
  defectSamples: Array<{ kind: "open" | "non-manifold"; at: [number, number, number] }>;
  /** Vertices lying on edges of other faces. */
  tJunctionVertices: number;
  components: number;
  watertight: boolean;
  volume: number;
  bounds: { min: [number, number, number]; max: [number, number, number] };
  partsWithNormals: number;
  partsWithUvs: number;
}

const weldScale = 1e9;
const onEdge = 1e-6;

/** Measures several meshes, such as one model's parts, as one account without mutating input arrays. */
export const accountMeshes = (id: string, meshes: readonly IAutoMovieMesh[]): MeshAccount => {
  if (meshes.length === 0) throw new Error(`${id}: no meshes to account.`);
  const merged = mergeAutoMovieMeshes(meshes);
  const topology = inspectAutoMovieMeshTopology(merged);
  const validation = validateMeshTopology({ mesh: merged });
  const windingErrors = validation.success ? 0
    : validation.violations.filter((v) => /wind in opposite directions/.test(String(v.expected))).length;
  const resolved = resolveTJunctions(merged);
  const p = merged.positions;
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < p.length; i += 3) {
    for (let k = 0; k < 3; ++k) {
      min[k] = Math.min(min[k]!, p[i + k]!);
      max[k] = Math.max(max[k]!, p[i + k]!);
    }
  }
  return {
    id, parts: meshes.length, vertices: p.length / 3, weldedVertices: resolved.weldedVertices,
    triangles: topology.triangles, degenerate: topology.degenerate, nonFinite: topology.nonFinite,
    boundaryEdges: topology.boundaryEdges, nonManifoldEdges: topology.nonManifoldEdges, windingErrors,
    openEdges: resolved.openEdges, resolvedNonManifold: resolved.nonManifold, defectSamples: resolved.samples,
    tJunctionVertices: resolved.tJunctionVertices, components: resolved.components,
    watertight: topology.watertight, volume: topology.volume, bounds: { min, max },
    partsWithNormals: meshes.filter((m) => m.normals !== null && m.normals.length === m.positions.length).length,
    partsWithUvs: meshes.filter((m) => m.uvs !== null && m.uvs.length === m.positions.length / 3 * 2).length,
  };
};

/** Converts model part geometry to meshes, using public tessellation for primitives. */
const partMeshes = (model: IAutoMovieModel): IAutoMovieMesh[] => model.parts.map((part) =>
  part.geometry.type === "mesh" ? part.geometry.mesh : tessellateToMesh(part.geometry.shape));

/** Accounts for the part geometry of one model. */
export const accountModel = (model: IAutoMovieModel): MeshAccount => accountMeshes(model.id, partMeshes(model));

/** Accounts for every model in one environment generation in declaration order. */
export const accountEnvironment = (environment: IAutoMovieBuiltEnvironment): MeshAccount[] =>
  environment.models.map(accountModel);

/**
 * Temple model closure contract. The soil, paving, neighbor floors and distant
 * ridge in docs/spaces/site.md are open top-only surfaces
 * (src/spaces/site/ground.ts and ridge.ts). The three wing-roof owners are culled
 * together: their touching side faces hide inside adjacent slabs
 * (src/geometry/roof-solids.ts), so each owner model is open at those interfaces
 * and the union of all three is a closed solid. Every other model is individually
 * closed. After T-junction resolution, a closed solid has 0 open edges,
 * 0 non-manifold edges, 0 winding errors and positive volume.
 */
export const templeOpenSurfaceModels: ReadonlySet<string> = new Set(["model.site-ground", "model.site-distant"]);
/**
 * Among docs/models members, tile shells and tegula boards are open shells laid
 * on slabs. Columns, beams, door frames, leaves, window frames, rafters, trusses,
 * ceiling joists and basins are assemblies of touching closed members, without
 * a Boolean union. Assemblies require only 0 degeneracy/non-finite components
 * and positive volume, ruling out inverted members.
 */
export const templeContractOf = (id: string): LedgerRow["contract"] =>
  templeOpenSurfaceModels.has(id) || id.startsWith("model.cladding-") ? "open-surface"
    : /^model.(column|beam|porch-entablature|door|window|rafters|truss|joists|fountain)/.test(id) ? "solid-assembly" : "closed";
export const templeCompositeSolids: ReadonlyArray<{ id: string; models: readonly string[] }> = [
  { id: "composite.wing-roofs", models: ["model.roof-west", "model.roof-east", "model.roof-colonnade"] },
];

/**
 * Named interface: wing-roof step closures (docs/spaces/junctions.md#gable-closures,
 * "height differences within a wing unit") are zero-thickness double-sided sheets.
 * The composite-solid ledger excludes their triangles before measuring closure
 * and reports the sheets' front and back face counts separately.
 */
export interface NamedSheet { id: string; corners: readonly IAutoMovieVector3[] }

const onSheet = (sheets: readonly NamedSheet[], points: ReadonlyArray<readonly [number, number, number]>): boolean => sheets.some((sheet) =>
  points.every((point) => sheet.corners.some((corner) =>
    Math.hypot(point[0] - corner.x, point[1] - corner.y, point[2] - corner.z) < 1e-6)));

/** Measurement mesh retaining only vertices referenced by selected triangles and all their static attributes. */
const selectTriangles = (mesh: IAutoMovieMesh, triangles: readonly number[]): IAutoMovieMesh | null => {
  if (triangles.length === 0) return null;
  if (mesh.skin !== null) throw new Error("Named closure-sheet accounts require rigid meshes.");
  const oldToNew = new Map<number, number>();
  const positions: number[] = [];
  const normals: number[] | null = mesh.normals === null ? null : [];
  const uvs: number[] | null = mesh.uvs === null ? null : [];
  const colors: number[] | undefined = mesh.colors === undefined ? undefined : [];
  const indices = triangles.map((old) => {
    let next = oldToNew.get(old);
    if (next === undefined) {
      next = oldToNew.size;
      oldToNew.set(old, next);
      positions.push(...mesh.positions.slice(old * 3, old * 3 + 3));
      if (normals !== null) normals.push(...mesh.normals!.slice(old * 3, old * 3 + 3));
      if (uvs !== null) uvs.push(...mesh.uvs!.slice(old * 2, old * 2 + 2));
      if (colors !== undefined) colors.push(...mesh.colors!.slice(old * 3, old * 3 + 3));
    }
    return next;
  });
  return { positions, normals, uvs, ...(colors === undefined ? {} : { colors }), indices, skin: null };
};

/** Separates actual mesh triangles into named double-sided sheets and the remainder, preserving their attributes and bounds. */
export const partitionNamedSheetTriangles = (
  mesh: IAutoMovieMesh, sheets: readonly NamedSheet[],
): { body: IAutoMovieMesh | null; sheet: IAutoMovieMesh | null; removed: number } => {
  const p = mesh.positions;
  const indices = mesh.indices ?? Array.from({ length: p.length / 3 }, (_, i) => i);
  const kept: number[] = [];
  const removed: number[] = [];
  for (let t = 0; t + 2 < indices.length; t += 3) {
    const tri = [0, 1, 2].map((k) => [p[indices[t + k]! * 3]!, p[indices[t + k]! * 3 + 1]!, p[indices[t + k]! * 3 + 2]!] as const);
    const target = onSheet(sheets, tri) ? removed : kept;
    target.push(indices[t]!, indices[t + 1]!, indices[t + 2]!);
  }
  return { body: selectTriangles(mesh, kept), sheet: selectTriangles(mesh, removed), removed: removed.length / 3 };
};

export interface LedgerRow {
  account: MeshAccount;
  contract: "closed" | "open-surface" | "composite-member" | "solid-assembly";
  findings: string[];
}

/** Accounts for every environment model and composite solid with its contract. */
export const templeTopologyLedger = (environment: IAutoMovieBuiltEnvironment, sheets: readonly NamedSheet[] = []): LedgerRow[] => {
  const members = new Set(templeCompositeSolids.flatMap((c) => c.models));
  const rows: LedgerRow[] = environment.models.map((model) => {
    const account = accountModel(model);
    const contract = members.has(model.id) ? "composite-member" : templeContractOf(model.id);
    const findings = contract === "solid-assembly"
      ? [...account.degenerate > 0 ? [`degenerate triangles ${account.degenerate}`] : [], ...account.nonFinite > 0 ? [`non-finite components ${account.nonFinite}`] : [],
        ...account.volume > 0 ? [] : [`signed volume ${account.volume} (inverted member)`]]
      : contract === "open-surface" || contract === "composite-member" ? [...account.degenerate > 0 ? [`degenerate triangles ${account.degenerate}`] : [], ...account.nonFinite > 0 ? [`non-finite components ${account.nonFinite}`] : []]
      : closureFindings(account, contract === "closed");
    return { account, contract, findings };
  });
  for (const composite of templeCompositeSolids) {
    const models = composite.models.map((id) => {
      const model = environment.models.find((m) => m.id === id);
      if (model === undefined) throw new Error(`${composite.id}: model ${id} is missing.`);
      return model;
    });
    const stripped = models.flatMap(partMeshes).map((mesh) => partitionNamedSheetTriangles(mesh, sheets));
    const account = accountMeshes(composite.id, stripped.flatMap((s) => s.body === null ? [] : [s.body]));
    const removed = stripped.reduce((sum, s) => sum + s.removed, 0);
    rows.push({ account, contract: "closed", findings: closureFindings(account, true) });
    if (sheets.length > 0) {
      const expected = sheets.reduce((sum, sheet) => sum + 2 * (sheet.corners.length - 2), 0);
      const faces = removed;
      const sheetMeshes = stripped.flatMap((s) => s.sheet === null ? [] : [s.sheet]);
      if (sheetMeshes.length === 0) throw new Error(`${composite.id}: named closure-sheet triangles are missing.`);
      const sheetAccount = accountMeshes(`${composite.id}.named-sheets`, sheetMeshes);
      rows.push({
        account: sheetAccount,
        contract: "open-surface",
        findings: [...closureFindings(sheetAccount, false).filter((finding) =>
          finding.startsWith("degenerate") || finding.startsWith("non-finite")),
        ...(faces === expected ? [] : [`${faces} of ${expected} front/back triangles for ${sheets.length} named closure sheets`])],
      });
    }
  }
  return rows;
};

/** Reasons the account violates its closure contract; an empty array satisfies it. */
export const closureFindings = (account: MeshAccount, closed: boolean): string[] => {
  const findings: string[] = [];
  if (account.degenerate > 0) findings.push(`degenerate triangles ${account.degenerate}`);
  if (account.nonFinite > 0) findings.push(`non-finite components ${account.nonFinite}`);
  if (account.nonManifoldEdges > 0 || account.resolvedNonManifold > 0) {
    findings.push(`non-manifold edges ${account.nonManifoldEdges}/${account.resolvedNonManifold}`);
  }
  if (account.windingErrors > 0) findings.push(`winding errors ${account.windingErrors}`);
  if (closed && account.openEdges > 0) findings.push(`open edges after T-junction resolution ${account.openEdges}`);
  if (closed && !(account.volume > 0)) findings.push(`signed volume of closed solid ${account.volume}`);
  return findings;
};

interface Resolution {
  samples: MeshAccount["defectSamples"];
  weldedVertices: number;
  openEdges: number;
  nonManifold: number;
  tJunctionVertices: number;
  components: number;
}

/** Welding, T-junction resolution, directed pairing and connected components. */
const resolveTJunctions = (mesh: IAutoMovieMesh): Resolution => {
  const p = mesh.positions;
  const index = new Map<string, number>();
  const points: Array<[number, number, number]> = [];
  const remap: number[] = [];
  for (let i = 0; i < p.length; i += 3) {
    const key = `${Math.round(p[i]! * weldScale)},${Math.round(p[i + 1]! * weldScale)},${Math.round(p[i + 2]! * weldScale)}`;
    let id = index.get(key);
    if (id === undefined) {
      id = points.length;
      index.set(key, id);
      points.push([p[i]!, p[i + 1]!, p[i + 2]!]);
    }
    remap.push(id);
  }
  const indices = mesh.indices ?? Array.from({ length: p.length / 3 }, (_, i) => i);
  const parent = points.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]!]!;
    return i;
  };
  const union = (a: number, b: number) => { parent[find(a)] = find(b); };
  const directed: Array<[number, number]> = [];
  for (let t = 0; t + 2 < indices.length; t += 3) {
    const [a, b, c] = [remap[indices[t]!]!, remap[indices[t + 1]!]!, remap[indices[t + 2]!]!];
    if (a === b || b === c || c === a) continue;
    directed.push([a, b], [b, c], [c, a]);
    union(a, b);
    union(b, c);
  }
  const splits = new Map<string, number[]>();
  const tVertices = new Set<number>();
  const interior = (a: number, b: number): number[] => {
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    const cached = splits.get(key);
    if (cached !== undefined) return a < b ? cached : [...cached].reverse();
    const [lo, hi] = a < b ? [a, b] : [b, a];
    const A = points[lo]!;
    const B = points[hi]!;
    const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    const length2 = d[0]! ** 2 + d[1]! ** 2 + d[2]! ** 2;
    const found: Array<[number, number]> = [];
    points.forEach((q, i) => {
      if (i === lo || i === hi) return;
      for (let k = 0; k < 3; ++k) {
        if (q[k]! < Math.min(A[k]!, B[k]!) - onEdge || q[k]! > Math.max(A[k]!, B[k]!) + onEdge) return;
      }
      const t = ((q[0] - A[0]) * d[0]! + (q[1] - A[1]) * d[1]! + (q[2] - A[2]) * d[2]!) / length2;
      if (t <= 0 || t >= 1) return;
      const distance = Math.hypot(A[0] + d[0]! * t - q[0], A[1] + d[1]! * t - q[1], A[2] + d[2]! * t - q[2]);
      if (distance < onEdge) found.push([t, i]);
    });
    const ordered = found.sort((x, y) => x[0] - y[0]).map(([, i]) => i);
    splits.set(key, ordered);
    for (const i of ordered) {
      tVertices.add(i);
      union(i, lo);
    }
    return a < b ? ordered : [...ordered].reverse();
  };
  const counts = new Map<string, number>();
  for (const [a, b] of directed) {
    const chain = [a, ...interior(a, b), b];
    for (let k = 0; k + 1 < chain.length; ++k) {
      const key = `${chain[k]},${chain[k + 1]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  let openEdges = 0;
  let nonManifold = 0;
  const samples: MeshAccount["defectSamples"] = [];
  const sample = (kind: "open" | "non-manifold", a: number, b: number) => {
    if (samples.length >= 8) return;
    const [A, B] = [points[a]!, points[b]!];
    samples.push({ kind, at: [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2] });
  };
  const seen = new Set<string>();
  for (const key of counts.keys()) {
    const [a, b] = key.split(",").map(Number) as [number, number];
    const undirected = a < b ? `${a},${b}` : `${b},${a}`;
    if (seen.has(undirected)) continue;
    seen.add(undirected);
    const forward = counts.get(`${a},${b}`) ?? 0;
    const backward = counts.get(`${b},${a}`) ?? 0;
    if (forward !== backward) {
      ++openEdges;
      sample("open", a, b);
    }
    if (forward + backward > 2) {
      ++nonManifold;
      sample("non-manifold", a, b);
    }
  }
  const used = new Set<number>();
  for (const [a] of directed) used.add(find(a));
  return { samples, weldedVertices: points.length, openEdges, nonManifold, tJunctionVertices: tVertices.size, components: used.size };
};
