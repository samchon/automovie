/**
 * 실제 렌더에 가는 model mesh의 topology 결산(`.agents/skills/source-authoring/geometry.md`
 * Consequence ledger). 한 model의 part mesh를 engine `mergeAutoMovieMeshes`로 이어
 * `inspectAutoMovieMeshTopology`(삼각형·퇴화·비유한·열린/비다양체 모서리·부호 체적)와
 * `validateMeshTopology`(감김 일관성)를 그대로 읽고, 엔진이 세지 않는 두 값을 더한다.
 * (1) T 접합 해소 뒤의 열린 모서리: 인접 볼록 조각의 면 분할은 한 면의 변 위에 다른 면의
 * 꼭짓점을 남겨 용접 기준의 열린 모서리를 만들지만 틈은 아니다. 각 변을 그 위에 놓인
 * 꼭짓점에서 나눈 뒤 방향 있는 부분 변이 양방향으로 짝을 이루지 않는 것만 실제 틈으로 센다.
 * (2) 연결 성분: 삼각형과 T 접합으로 이어진 꼭짓점의 합집합 수.
 * 용접은 engine과 같은 나노미터 격자, 변 위 판정은 1e-6 m다. 결산은 기하 사실이며
 * 외관이나 설계 적합의 판정이 아니다.
 */
import { inspectAutoMovieMeshTopology, mergeAutoMovieMeshes, tessellateToMesh, validateMeshTopology } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

export interface MeshAccount {
  id: string;
  parts: number;
  /** 버퍼의 꼭짓점 수(용접 전)와 용접 뒤 수. */
  vertices: number;
  weldedVertices: number;
  triangles: number;
  degenerate: number;
  nonFinite: number;
  /** 용접 기준 열린 모서리(engine). T 접합도 여기에 들어간다. */
  boundaryEdges: number;
  nonManifoldEdges: number;
  /** 인접 삼각형이 공유 변을 같은 방향으로 도는 경우(engine validateMeshTopology). */
  windingErrors: number;
  /** T 접합을 해소한 뒤에도 짝이 없는 부분 변 = 실제 틈. */
  openEdges: number;
  /** 해소 뒤 세 번 이상 쓰인 부분 변. */
  resolvedNonManifold: number;
  /** 틈·비다양체 부분 변의 중점(앞의 8개). 위치를 찾아 관찰하기 위한 값이다. */
  defectSamples: Array<{ kind: "open" | "non-manifold"; at: [number, number, number] }>;
  /** 다른 면의 변 위에 놓인 꼭짓점 수. */
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

/** 여러 mesh(한 model의 part들)를 한 결산으로 잰다. 입력 배열은 바꾸지 않는다. */
export const accountMeshes = (id: string, meshes: readonly IAutoMovieMesh[]): MeshAccount => {
  if (meshes.length === 0) throw new Error(`${id}: 결산할 mesh가 없습니다.`);
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

/** model의 part geometry를 mesh로(primitive는 공개 tessellation). */
const partMeshes = (model: IAutoMovieModel): IAutoMovieMesh[] => model.parts.map((part) =>
  part.geometry.type === "mesh" ? part.geometry.mesh : tessellateToMesh(part.geometry.shape));

/** model 하나의 part geometry를 결산한다. */
export const accountModel = (model: IAutoMovieModel): MeshAccount => accountMeshes(model.id, partMeshes(model));

/** 한 generation의 environment가 가진 모든 model을 선언 순서대로 결산한다. */
export const accountEnvironment = (environment: IAutoMovieBuiltEnvironment): MeshAccount[] =>
  environment.models.map(accountModel);

/**
 * 신전 model의 닫힘 계약. docs/spaces/site.md의 흙·포장·이웃 바닥과 먼 능선은 윗면만
 * 있는 열린 표면이다(src/spaces/site/ground.ts, ridge.ts). 날개 지붕 세 owner는 함께
 * culling돼 서로 맞닿은 옆면이 이웃 slab 안에 숨으므로(src/geometry/roof-solids.ts) owner별
 * model은 그 접면에서 열려 있고, 세 model의 합이 닫힌 실체다. 나머지 model은 각각 닫힌
 * 실체다. 닫힌 실체는 T 접합 해소 뒤 열린 모서리 0, 비다양체 0, 감김 오류 0, 양의 체적이다.
 */
export const templeOpenSurfaceModels: ReadonlySet<string> = new Set(["model.site-ground", "model.site-distant"]);
export const templeCompositeSolids: ReadonlyArray<{ id: string; models: readonly string[] }> = [
  { id: "composite.wing-roofs", models: ["model.roof-west", "model.roof-east", "model.roof-colonnade"] },
];

export interface LedgerRow {
  account: MeshAccount;
  contract: "closed" | "open-surface" | "composite-member";
  findings: string[];
}

/** environment의 모든 model과 합성 실체를 계약과 함께 결산한다. */
export const templeTopologyLedger = (environment: IAutoMovieBuiltEnvironment): LedgerRow[] => {
  const members = new Set(templeCompositeSolids.flatMap((c) => c.models));
  const rows: LedgerRow[] = environment.models.map((model) => {
    const account = accountModel(model);
    const contract = templeOpenSurfaceModels.has(model.id) ? "open-surface" : members.has(model.id) ? "composite-member" : "closed";
    return { account, contract, findings: closureFindings(account, contract === "closed") };
  });
  for (const composite of templeCompositeSolids) {
    const models = composite.models.map((id) => {
      const model = environment.models.find((m) => m.id === id);
      if (model === undefined) throw new Error(`${composite.id}: model ${id}가 없습니다.`);
      return model;
    });
    const account = accountMeshes(composite.id, models.flatMap(partMeshes));
    rows.push({ account, contract: "closed", findings: closureFindings(account, true) });
  }
  return rows;
};

/** 결산이 닫힘 계약을 어긴 이유 목록(빈 배열이면 계약 충족). */
export const closureFindings = (account: MeshAccount, closed: boolean): string[] => {
  const findings: string[] = [];
  if (account.degenerate > 0) findings.push(`퇴화 삼각형 ${account.degenerate}`);
  if (account.nonFinite > 0) findings.push(`비유한 성분 ${account.nonFinite}`);
  if (account.nonManifoldEdges > 0 || account.resolvedNonManifold > 0) {
    findings.push(`비다양체 모서리 ${account.nonManifoldEdges}/${account.resolvedNonManifold}`);
  }
  if (account.windingErrors > 0) findings.push(`감김 오류 ${account.windingErrors}`);
  if (closed && account.openEdges > 0) findings.push(`T 접합 해소 뒤 열린 모서리 ${account.openEdges}`);
  if (closed && !(account.volume > 0)) findings.push(`닫힌 실체의 부호 체적 ${account.volume}`);
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

/** 용접·T 접합 해소·짝 검사·연결 성분. */
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
