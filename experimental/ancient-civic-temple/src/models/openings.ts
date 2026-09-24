/**
 * docs/models/openings.md의 석재 문틀, 양개·외개 목재 문짝, 채광구 석재 틀.
 * 문틀·창틀 로컬 원점은 void 아랫변 중심(벽 중심면), X는 벽 길이, Z는 벽 두께, +Y 위.
 * 문짝 로컬 원점은 경첩 축의 바닥 점이며 닫힌 자세에서 X 0~짝 폭, Z −0.05~0을 차지한다.
 * 한계: 외개 문짝 반대면의 세로 널 이음 홈(0.01×0.004m)은 이 표현에서 만들지 않는다.
 */
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import { box, frustum, merged, model, part, TriangleSink, vec } from "./mesh-kit";

/** 원환(고리 손잡이). 중심 (0,0,0), 고리 평면은 XY, 바깥 반지름 outer, 굵기 tube. */
const ring = (outer: number, tube: number): IAutoMovieMesh => {
  const sink = new TriangleSink();
  const major = outer - tube;
  const [nu, nv] = [16, 8];
  const index: number[][] = [];
  for (let i = 0; i < nu; ++i) {
    index.push([]);
    for (let j = 0; j < nv; ++j) {
      const u = 2 * Math.PI * i / nu, w = 2 * Math.PI * j / nv;
      const r = major + tube * Math.cos(w);
      index[i]!.push(sink.vertex(vec(r * Math.cos(u), r * Math.sin(u), tube * Math.sin(w))));
    }
  }
  for (let i = 0; i < nu; ++i) {
    for (let j = 0; j < nv; ++j) {
      const a = index[i]![j]!, b = index[(i + 1) % nu]![j]!, c = index[(i + 1) % nu]![(j + 1) % nv]!, d = index[i]![(j + 1) % nv]!;
      sink.quad(a, d, c, b);
    }
  }
  return sink.mesh();
};

/** 원통을 X축 방향으로 눕힌 짧은 막대 대신 Y축 원통(경첩 핀). */
const pin = (x: number, y: number, z: number, radius: number, height: number): IAutoMovieMesh => {
  const mesh = frustum(radius, radius, y, y + height, 12);
  const positions = mesh.positions.map((value, i) => i % 3 === 0 ? value + x : i % 3 === 2 ? value + z : value);
  return { ...mesh, positions };
};

/** 고리를 벽 법선(Z) 쪽에서 보이도록 XY 평면에 세워 옮긴다. */
const ringAt = (x: number, y: number, z: number, outer: number, tube: number): IAutoMovieMesh => {
  const mesh = ring(outer, tube);
  return { ...mesh, positions: mesh.positions.map((value, i) => value + (i % 3 === 0 ? x : i % 3 === 1 ? y : z)) };
};

/** 석재 문틀: 벽 두께 안감 세 조각과 양면 테. */
export const doorFrameModel = (width: number, height: number, depth: number): IAutoMovieModel => {
  const w = width / 2, t = depth / 2, j = 0.06, s = 0.16, p = 0.03;
  const lining = merged([
    box(-w - j, -w, 0, height + j, -t, t), box(w, w + j, 0, height + j, -t, t), box(-w, w, height, height + j, -t, t),
  ]);
  const face = (z0: number, z1: number) => [
    box(-w - j - s, -w - j, 0, height + j, z0, z1), box(w + j, w + j + s, 0, height + j, z0, z1),
    box(-w - j - s, w + j + s, height + j, height + j + s, z0, z1),
  ];
  return model(`model.door-frame.${Math.round(width * 100)}x${Math.round(height * 100)}x${Math.round(depth * 100)}`, "door-frame", [
    part("surface.door-frame.lining", lining),
    part("surface.door-frame.surround", merged([...face(t, t + p), ...face(-t - p, -t)])),
  ]);
};

/** 양개 문짝 한 짝: 선대·가로대 테두리, 들어간 두 판, 양면 고리 손잡이, 핀 경첩 둘. */
export const doubleLeafModel = (leafWidth: number, clearHeight: number): IAutoMovieModel => {
  const W = leafWidth, H = clearHeight, T = 0.05, y0 = 0.01;
  const frame = merged([
    box(0, 0.1, y0, H, -T, 0), box(W - 0.1, W, y0, H, -T, 0),
    box(0.1, W - 0.1, H - 0.1, H, -T, 0), box(0.1, W - 0.1, 1.0, 1.1, -T, 0), box(0.1, W - 0.1, y0, y0 + 0.16, -T, 0),
  ]);
  const panel = merged([box(0.1, W - 0.1, y0 + 0.16, 1.0, -0.035, -0.015), box(0.1, W - 0.1, 1.1, H - 0.1, -0.035, -0.015)]);
  return model(`model.door-leaf-double.${Math.round(W * 100)}x${Math.round(H * 100)}`, "door-leaf-double", [
    part("surface.door-leaf-double.frame", frame),
    part("surface.door-leaf-double.panel", panel),
    part("surface.door-leaf-double.ring", merged([
      ringAt(W - 0.16, 1.05, 0.018, 0.06, 0.012), ringAt(W - 0.16, 1.05, -T - 0.018, 0.06, 0.012),
      box(W - 0.2, W - 0.12, 1.07, 1.13, 0, 0.006), box(W - 0.2, W - 0.12, 1.07, 1.13, -T - 0.006, -T),
    ])),
    part("surface.door-leaf-double.hinge", merged([pin(0, 0.3, -T / 2, 0.02, 0.1), pin(0, H - 0.4, -T / 2, 0.02, 0.1)])),
  ]);
};

/** 외개 문짝: 판, 여는 쪽 면의 가로 띠 둘과 쇠 띠 경첩, 양면 고리. opening은 여는 쪽 면의 Z 부호. */
export const singleLeafModel = (width: number, clearHeight: number): IAutoMovieModel => {
  const W = width, H = clearHeight, T = 0.05, y0 = 0.01;
  const battenAt = (y: number) => box(0.04, W - 0.04, y, y + 0.12, 0, 0.025);
  const strapAt = (y: number) => box(0, W * 0.6, y + 0.04, y + 0.08, 0.025, 0.031);
  return model(`model.door-leaf-single.${Math.round(W * 100)}x${Math.round(H * 100)}`, "door-leaf-single", [
    part("surface.door-leaf-single.board", box(0, W, y0, H, -T, 0)),
    part("surface.door-leaf-single.batten", merged([battenAt(0.25), battenAt(H - 0.4)])),
    part("surface.door-leaf-single.strap", merged([strapAt(0.25), strapAt(H - 0.4)])),
    part("surface.door-leaf-single.ring", merged([ringAt(W - 0.12, 1.05, 0.04, 0.05, 0.01), ringAt(W - 0.12, 1.05, -T - 0.015, 0.05, 0.01)])),
  ]);
};

/** 채광구 석재 틀: 벽 두께 안감 넷과 외부 면(+Z)의 테. */
export const windowFrameModel = (depth: number): IAutoMovieModel => {
  const w = 0.2, j = 0.06, t = depth / 2, s = 0.1, p = 0.03, h = 0.4;
  const lining = merged([
    box(-w - j, -w, 0, h + 2 * j, -t, t), box(w, w + j, 0, h + 2 * j, -t, t),
    box(-w, w, 0, j, -t, t), box(-w, w, h + j, h + 2 * j, -t, t),
  ]);
  const surround = merged([
    box(-w - j - s, -w - j, -s, h + 2 * j + s, t, t + p), box(w + j, w + j + s, -s, h + 2 * j + s, t, t + p),
    box(-w - j, w + j, -s, 0, t, t + p), box(-w - j, w + j, h + 2 * j, h + 2 * j + s, t, t + p),
  ]);
  return model(`model.window-frame.${Math.round(depth * 100)}`, "window-frame", [
    part("surface.window-frame.lining", lining), part("surface.window-frame.surround", surround),
  ]);
};
