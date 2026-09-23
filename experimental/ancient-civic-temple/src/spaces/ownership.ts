/**
 * docs/spaces/ownership.md#interior-dado의 실내 벽 하부 띠.
 * 주랑과 제실의 벽 마감을 각 방 완성 바닥 위 0.60m 수평선에서 나누어
 * 아래를 dado 표면으로 둔다. 벽 실체는 바꾸지 않는 같은 평면의 면 분할이며
 * 다른 방·입면 표면에는 적용하지 않는다.
 */
import { splitAtLevel } from "../geometry/face-bands";
import type { WallFace } from "../geometry/wall-solids";
import { templeLevels as y } from "./storey";

export const templeInteriorDado = {
  /** 완성 바닥(Y=0) 위 띠 윗선 높이(m). */
  height: 0.6,
  surfaces: {
    "surface.colonnade.wall": "surface.colonnade.dado",
    "surface.sanctuary.wall": "surface.sanctuary.dado",
  } as Readonly<Record<string, string>>,
} as const;

/** 대상 벽 마감 면만 띠 윗선에서 나누고 나머지 면은 그대로 둔다. */
export const templeDadoFaces = (faces: readonly WallFace[]): WallFace[] => faces.flatMap((face) => {
  const dado = templeInteriorDado.surfaces[face.surface];
  return dado === undefined ? [face] : splitAtLevel(face, y.floor + templeInteriorDado.height, dado, face.surface);
});
