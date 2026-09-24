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

export const part = (id: string, mesh: IAutoMovieMesh): IAutoMovieModelPart => ({
  id, name: null, material: null, attachedBone: null, transform: null, geometry: { type: "mesh", mesh },
});

export const model = (id: string, name: string, parts: readonly IAutoMovieModelPart[]): IAutoMovieModel => {
  if (parts.length === 0) throw new Error(`${id}: part가 없는 model입니다.`);
  return { id, name, origin: "generated", skeleton: null, body: null, materials: [], asset: null, parts: [...parts] };
};
