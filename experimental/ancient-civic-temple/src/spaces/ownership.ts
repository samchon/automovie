/**
 * docs/spaces/ownership.md#interior-dado의 실내 벽 하부 띠.
 * 주랑과 제실의 벽 마감을 각 방 완성 바닥 위 0.60m 수평선에서 나누어
 * 아래를 dado 표면으로 둔다. 벽 실체는 바꾸지 않는 같은 평면의 면 분할이며
 * 다른 방·입면 표면에는 적용하지 않는다.
 */
import { splitAtLevel } from "../geometry/face-bands";
import type { WallFace } from "../geometry/wall-solids";
import { templeLevels as y } from "./storey";

/**
 * @evidence spaces/ownership.md 주랑과 제실 벽 마감의 하부 띠 높이 0.60m와 대상 표면 이름을 둔다.
 * @evidence spaces/ownership.md#interior-dado 완성 바닥 위 0.60m 윗선과 surface.colonnade/sanctuary.wall→dado 대응을 설계 값 그대로 옮긴다.
 * @evidence spaces/ownership.md#surface-map 띠가 주랑·제실 두 owner의 벽 마감 안의 분할이며 다른 방·입면 표면을 바꾸지 않는다는 소유 경계를 대응표로 제한한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 두 표면만 대상으로 하고 높이는 층 완성면 위 값으로만 둔다.
 * @evidence principles/core/source-units.md#source-substantive-completion 높이와 대응표를 함께 가진 값으로 templeDadoFaces가 그대로 소비한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work ownership.md#interior-dado의 0.60m와 두 대상 표면을 그대로 구현했다. 문에서 끊기고 벽 전 길이에 이어지는 띠가 owner 색 검사에서 확인됐다.
 */
export const templeInteriorDado = {
  /** 완성 바닥(Y=0) 위 띠 윗선 높이(m). */
  height: 0.6,
  surfaces: {
    "surface.colonnade.wall": "surface.colonnade.dado",
    "surface.sanctuary.wall": "surface.sanctuary.dado",
  } as Readonly<Record<string, string>>,
} as const;

/**
 * 대상 벽 마감 면만 띠 윗선에서 나누고 나머지 면은 그대로 둔다.
 * @evidence spaces/ownership.md 벽 마감 면을 하부 띠 윗선에서 나눠 아래를 dado 표면으로 준다.
 * @evidence principles/core/source-units.md#source-scope-preservation 대상 두 표면만 나누고 나머지 면은 그대로 두며 벽 실체의 형상을 바꾸지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion splitAtLevel로 같은 평면의 두 볼록 면을 만들어 감김을 유지한 면 배열을 돌려준다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work ownership.md#interior-dado의 면 분할 규칙을 그대로 구현했고 분할 뒤에도 벽 model이 닫힌 실체로 결산된다.
 */
export const templeDadoFaces = (faces: readonly WallFace[]): WallFace[] => faces.flatMap((face) => {
  const dado = templeInteriorDado.surfaces[face.surface];
  return dado === undefined ? [face] : splitAtLevel(face, y.floor + templeInteriorDado.height, dado, face.surface);
});
