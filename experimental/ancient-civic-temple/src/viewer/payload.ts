/**
 * 뷰어 전송값. 실제 production producer와 공개 engine lowering을 CJS에서
 * 한 번 실행하고, 결과 geometry·배치·공간·관찰을 그대로 클라이언트에 넘긴다.
 * 건물을 다시 만들지 않으며 재료가 결속되지 않은 part는 null로 전달한다.
 * 대지(temple-site)의 지면·경계석·먼 능선도 같은 environment의 model로 온다.
 */
import { builtEnvironmentBuildingCensus, lowerBuiltEnvironment, tessellateToMesh } from "@automovie/engine";
import type { IAutoMovieHeightRule, IAutoMovieMesh, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { templeViewerLens } from "../geometry/observation-datum";
import { createTempleEnvironment } from "../spaces/environment";
import { templeObservations, templeSpaceNames } from "../spaces/observations";

export interface ViewerPart {
  id: string;
  material: string | null;
  mesh: IAutoMovieMesh;
}

export interface ViewerPlacement {
  node: string;
  model: string;
  position: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
  scale: IAutoMovieVector3;
}

export const createViewerPayload = () => {
  const built = createTempleEnvironment();
  const environment = built.environment;
  const lowered = lowerBuiltEnvironment(environment);
  const models = environment.models.map((model) => ({
    id: model.id,
    name: model.name,
    materials: model.materials,
    parts: model.parts.map((part): ViewerPart => {
      if (part.transform !== null) throw new Error(`${model.id}/${part.id}: part 변환은 이 전달 경로에서 지원하지 않습니다.`);
      return {
        id: part.id, material: part.material,
        mesh: part.geometry.type === "mesh" ? part.geometry.mesh : tessellateToMesh(part.geometry.shape),
      };
    }),
  }));
  const placements: ViewerPlacement[] = (lowered.set ?? []).map((entry) => ({
    node: entry.node, model: entry.model, position: entry.position,
    rotation: entry.rotation ?? { x: 0, y: 0, z: 0, w: 1 },
    scale: typeof entry.scale === "number" ? { x: entry.scale, y: entry.scale, z: entry.scale }
      : entry.scale ?? { x: 1, y: 1, z: 1 },
  }));
  for (const placement of placements) {
    if (!models.some((m) => m.id === placement.model)) throw new Error(`${placement.node}: model ${placement.model} 누락`);
  }
  const census = builtEnvironmentBuildingCensus(environment)[0];
  const triangles = models.reduce((sum, m) => sum + m.parts.reduce((s, part) =>
    s + (part.mesh.indices?.length ?? part.mesh.positions.length / 3) / 3, 0), 0);
  return {
    environmentId: environment.id,
    lens: { verticalDegrees: templeViewerLens.verticalDegrees, aspect: templeViewerLens.aspect,
      near: templeViewerLens.near, far: templeViewerLens.far },
    models,
    placements,
    spaces: environment.spaces.filter((s) => s.cells.length > 0).map((s) => ({
      id: s.id, kind: s.kind, name: templeSpaceNames[s.id] ?? s.id, cellCount: s.cells.length,
    })),
    supports: environment.surfaces.map((entry) => ({
      space: entry.space, id: entry.surface.id, polygon: entry.surface.polygon, holes: entry.surface.holes ?? [],
      plane: supportPlane(entry.surface.id, entry.surface.height),
    })),
    openings: environment.openings.map((o) => ({ id: o.id, kind: o.kind, boundary: o.boundary, fill: o.fill })),
    observations: templeObservations(environment),
    census: {
      facades: census?.facades.length ?? 0, corners: census?.corners.length ?? 0,
      roofs: census?.roofs.length ?? 0, undersides: census?.undersides.length ?? 0,
      entrances: census?.entrances.length ?? 0, spaces: census?.spaces.length ?? 0,
      connectors: census?.connectors.length ?? 0,
      boundaries: environment.boundaries.length, openings: environment.openings.length,
      models: models.length, triangles,
    },
    notices: [
      "재료 미결속: materials 층이 아직 열리지 않아 모든 표면을 중성 클레이로 표시합니다.",
      "이웃·수목 없음: 배치 구역만 있고 개체는 instances 층 소유로 아직 없습니다. 외벽 하단 " + built.wallBottom.toFixed(2) + "m는 대지 지면의 최저 접촉에서 유도했습니다.",
      "독립 부재 없음: 기둥·문짝·문틀·기와·수반·집기는 models 층 소유로 아직 없습니다.",
      "조명 미결정: systems 층 미개시. 뷰어는 설정 주광의 방향·고도(정면 좌측 위 45°)만 따르고 강도·노출은 검토용 기본값입니다.",
    ],
  };
};

/** 검사 표시용 support 높이 평면. 격자 높이장은 이 전달 경로에서 쓰지 않는다. */
const supportPlane = (id: string, rule: IAutoMovieHeightRule | undefined) => {
  if (rule === undefined) return { origin: 0, slopeX: 0, slopeZ: 0 };
  if (rule.kind === "constant") return { origin: rule.value, slopeX: 0, slopeZ: 0 };
  if (rule.kind === "plane") return { origin: rule.originHeight, slopeX: rule.slopeX, slopeZ: rule.slopeZ };
  throw new Error(`${id}: 격자 높이장 support는 이 전달 경로에서 지원하지 않습니다.`);
};

export type ViewerPayload = ReturnType<typeof createViewerPayload>;
