/**
 * docs/models 부재 source가 함께 쓰는 결정적 mesh 구성. 상자·방향 상자는 engine
 * polyhedron(평평한 면 법선, metric UV), 원형 부재는 engine revolve 옆면과 polyhedron
 * 뚜껑을 이어 극점 퇴화 없이 닫는다. 곡면 껍질(기와)은 방정식에서 직접 삼각형을
 * 만든다(법선은 소비자가 계산). 좌표는 m, 원점·축은 호출한 model 문서가 정한다.
 */
import { buildAutoMoviePolyhedron, mergeAutoMovieMeshes, revolveAutoMovieProfile, transformAutoMovieMesh } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieModel, IAutoMovieModelPart, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

export type Vec = IAutoMovieVector3;
export const vec = (x: number, y: number, z: number): Vec => ({ x, y, z });
export const add = (a: Vec, b: Vec): Vec => vec(a.x + b.x, a.y + b.y, a.z + b.z);
export const scale = (a: Vec, s: number): Vec => vec(a.x * s, a.y * s, a.z * s);
export const cross = (a: Vec, b: Vec): Vec => vec(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
export const unit = (a: Vec): Vec => scale(a, 1 / Math.hypot(a.x, a.y, a.z));

/** 축 정렬 상자. */
export const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): IAutoMovieMesh =>
  orientedBox(vec((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), [vec(1, 0, 0), vec(0, 1, 0), vec(0, 0, 1)], [(x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2]);

/**
 * 오른손 직교 축(u, v, w)과 반길이로 정한 상자. 기울어진 서까래·트러스 부재용이다.
 */
export const orientedBox = (center: Vec, axes: readonly [Vec, Vec, Vec], half: readonly [number, number, number]): IAutoMovieMesh => {
  const [u, v, w] = axes;
  const corner = (i: number, j: number, k: number) =>
    add(add(add(center, scale(u, i * half[0])), scale(v, j * half[1])), scale(w, k * half[2]));
  const faces: Vec[][] = [
    [corner(-1, 1, -1), corner(-1, 1, 1), corner(1, 1, 1), corner(1, 1, -1)],
    [corner(-1, -1, -1), corner(1, -1, -1), corner(1, -1, 1), corner(-1, -1, 1)],
    [corner(-1, -1, -1), corner(-1, 1, -1), corner(1, 1, -1), corner(1, -1, -1)],
    [corner(-1, -1, 1), corner(1, -1, 1), corner(1, 1, 1), corner(-1, 1, 1)],
    [corner(-1, -1, -1), corner(-1, -1, 1), corner(-1, 1, 1), corner(-1, 1, -1)],
    [corner(1, -1, -1), corner(1, 1, -1), corner(1, 1, 1), corner(1, -1, 1)],
  ];
  return buildAutoMoviePolyhedron(faces);
};

/** 원뿔대(반지름 r0 at y0 → r1 at y1), segments 분할, 닫힌 실체. 옆면은 부드러운 법선이다. */
export const frustum = (r0: number, r1: number, y0: number, y1: number, segments = 24): IAutoMovieMesh => {
  const side = revolveAutoMovieProfile({ profile: [{ x: r0, y: y0 }, { x: r1, y: y1 }], segments });
  const ring = (r: number, y: number) => Array.from({ length: segments }, (_, k) =>
    vec(r * Math.cos(2 * Math.PI * k / segments), y, r * Math.sin(2 * Math.PI * k / segments)));
  const caps = buildAutoMoviePolyhedron([ring(r0, y0), ring(r1, y1).reverse()]);
  return mergeAutoMovieMeshes([side, caps]);
};

/**
 * 맞닿은 축 정렬 상자들의 합집합 경계. 모든 상자 끝선으로 만든 비균일 격자에서 점유 칸의
 * 드러난 옆면만 내므로 면이 서로 맞물리고(같은 변을 세 면 이상이 공유하지 않는다) 내부 접면이
 * 없다. 문틀 안감·테, 문짝 테두리처럼 한 표면이 여러 각재로 된 부재에 쓴다. 대각선으로만
 * 닿는 칸 배치는 받지 않는다.
 */
export const boxUnion = (boxes: ReadonlyArray<readonly [number, number, number, number, number, number]>): IAutoMovieMesh => {
  const axis = (i: number, j: number) => [...new Set(boxes.flatMap((b) => [b[i]!, b[j]!]))].sort((a, b) => a - b);
  const [xs, ys, zs] = [axis(0, 1), axis(2, 3), axis(4, 5)];
  const occupied = new Set<string>();
  const key = (i: number, j: number, k: number) => `${i},${j},${k}`;
  for (let i = 0; i + 1 < xs.length; ++i) for (let j = 0; j + 1 < ys.length; ++j) for (let k = 0; k + 1 < zs.length; ++k) {
    const [cx, cy, cz] = [(xs[i]! + xs[i + 1]!) / 2, (ys[j]! + ys[j + 1]!) / 2, (zs[k]! + zs[k + 1]!) / 2];
    if (boxes.some((b) => cx > b[0] && cx < b[1] && cy > b[2] && cy < b[3] && cz > b[4] && cz < b[5])) occupied.add(key(i, j, k));
  }
  const faces: Vec[][] = [];
  for (const cell of occupied) {
    const [i, j, k] = cell.split(",").map(Number) as [number, number, number];
    const [x0, x1, y0, y1, z0, z1] = [xs[i]!, xs[i + 1]!, ys[j]!, ys[j + 1]!, zs[k]!, zs[k + 1]!];
    if (!occupied.has(key(i - 1, j, k))) faces.push([vec(x0, y0, z0), vec(x0, y0, z1), vec(x0, y1, z1), vec(x0, y1, z0)]);
    if (!occupied.has(key(i + 1, j, k))) faces.push([vec(x1, y0, z0), vec(x1, y1, z0), vec(x1, y1, z1), vec(x1, y0, z1)]);
    if (!occupied.has(key(i, j - 1, k))) faces.push([vec(x0, y0, z0), vec(x1, y0, z0), vec(x1, y0, z1), vec(x0, y0, z1)]);
    if (!occupied.has(key(i, j + 1, k))) faces.push([vec(x0, y1, z0), vec(x0, y1, z1), vec(x1, y1, z1), vec(x1, y1, z0)]);
    if (!occupied.has(key(i, j, k - 1))) faces.push([vec(x0, y0, z0), vec(x0, y1, z0), vec(x1, y1, z0), vec(x1, y0, z0)]);
    if (!occupied.has(key(i, j, k + 1))) faces.push([vec(x0, y0, z1), vec(x1, y0, z1), vec(x1, y1, z1), vec(x0, y1, z1)]);
  }
  return buildAutoMoviePolyhedron(faces);
};

/** 반지름·높이 꺾은선을 돌린 닫힌 실체(첫 점 아래 뚜껑, 끝 점 위 뚜껑). 목 띠·받침머리처럼 이어진 원형 단에 쓴다. */
export const turned = (profile: ReadonlyArray<{ x: number; y: number }>, segments = 24): IAutoMovieMesh => {
  const side = revolveAutoMovieProfile({ profile: profile.map((q) => ({ ...q })), segments });
  const ring = (r: number, y: number) => Array.from({ length: segments }, (_, k) =>
    vec(r * Math.cos(2 * Math.PI * k / segments), y, r * Math.sin(2 * Math.PI * k / segments)));
  const [first, last] = [profile[0]!, profile[profile.length - 1]!];
  return mergeAutoMovieMeshes([side, buildAutoMoviePolyhedron([ring(first.x, first.y), ring(last.x, last.y).reverse()])]);
};

/** 여러 mesh를 이은 한 part(부울 합이 아니다: 맞닿은 부재의 모음). */
export const merged = (meshes: readonly IAutoMovieMesh[]): IAutoMovieMesh => mergeAutoMovieMeshes(meshes);

export const placed = (mesh: IAutoMovieMesh, translation: Vec, rotation?: IAutoMovieQuaternion): IAutoMovieMesh =>
  transformAutoMovieMesh(mesh, rotation === undefined ? { translation } : { translation, rotation });

/** Y축 회전 쿼터니언(라디안). */
export const yaw = (angle: number): IAutoMovieQuaternion => ({ x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) });

/** 삼각형 목록에서 직접 만든 mesh. 법선·UV는 두지 않는다(소비자가 법선을 계산). */
export class TriangleSink {
  readonly positions: number[] = [];
  readonly indices: number[] = [];
  vertex(p: Vec): number {
    this.positions.push(p.x, p.y, p.z);
    return this.positions.length / 3 - 1;
  }
  quad(a: number, b: number, c: number, d: number): void {
    this.indices.push(a, b, c, a, c, d);
  }
  triangle(a: number, b: number, c: number): void {
    this.indices.push(a, b, c);
  }
  mesh(): IAutoMovieMesh {
    return { positions: [...this.positions], normals: null, uvs: null, indices: [...this.indices], skin: null };
  }
}

/** mesh의 용접(나노미터 격자) 모서리 키 집합. */
const weldedEdges = (mesh: IAutoMovieMesh): Set<string> => {
  const p = mesh.positions;
  const key = (i: number) => `${Math.round(p[i * 3]! * 1e9)},${Math.round(p[i * 3 + 1]! * 1e9)},${Math.round(p[i * 3 + 2]! * 1e9)}`;
  const indices = mesh.indices ?? Array.from({ length: p.length / 3 }, (_, i) => i);
  const edges = new Set<string>();
  for (let t = 0; t + 2 < indices.length; t += 3) {
    const k = [key(indices[t]!), key(indices[t + 1]!), key(indices[t + 2]!)];
    for (let e = 0; e < 3; ++e) {
      const [a, b] = [k[e]!, k[(e + 1) % 3]!];
      edges.add(a < b ? `${a}|${b}` : `${b}|${a}`);
    }
  }
  return edges;
};

/**
 * 맞닿은 닫힌 부재의 모음을 part로 나눈다(geometry.md: 병합은 부울 합이 아니다). 모서리를 공유하는
 * 부재끼리는 같은 part에 두지 않아 각 part mesh가 2-manifold(한 모서리에 삼각형 둘 이하)로 남는다.
 * 첫 part는 id, 나머지는 id.1, id.2 …이며 모두 같은 표면 계열이다.
 */
export const solids = (id: string, meshes: readonly IAutoMovieMesh[]): IAutoMovieModelPart[] => {
  const buckets: Array<{ edges: Set<string>; meshes: IAutoMovieMesh[] }> = [];
  for (const mesh of meshes) {
    const edges = weldedEdges(mesh);
    let bucket = buckets.find((b) => ![...edges].some((e) => b.edges.has(e)));
    if (bucket === undefined) {
      bucket = { edges: new Set(), meshes: [] };
      buckets.push(bucket);
    }
    for (const e of edges) bucket.edges.add(e);
    bucket.meshes.push(mesh);
  }
  return buckets.map((b, i) => part(i === 0 ? id : `${id}.${i}`, b.meshes.length === 1 ? b.meshes[0]! : mergeAutoMovieMeshes(b.meshes)));
};

export const part = (id: string, mesh: IAutoMovieMesh): IAutoMovieModelPart => ({
  id, name: null, material: null, attachedBone: null, transform: null, geometry: { type: "mesh", mesh },
});

export const model = (id: string, name: string, parts: readonly IAutoMovieModelPart[]): IAutoMovieModel => {
  if (parts.length === 0) throw new Error(`${id}: part가 없는 model입니다.`);
  return { id, name, origin: "generated", skeleton: null, body: null, materials: [], asset: null, parts: [...parts] };
};
