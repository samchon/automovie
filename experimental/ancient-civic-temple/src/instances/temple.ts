/**
 * docs/models의 부재 prototype을 판정된 spaces 기준선과 합성 지붕에서 유도한 위치에 놓는다.
 * 주랑 원주(북·남 4개로 제실 문·정문 축을 비우고 동·서 5개), 주랑 보, 포치 원주·보·트림,
 * 문틀·문짝(기본 열림 90°, 방 쪽), 채광구 틀(외부 면 쪽 테), 지붕 기와·용마루, 서까래,
 * 제실 트러스, 천장 보, 분수. 높이는 지붕 하부에서, 문짝의 방 쪽은 실제 공간 cell에서 읽는다.
 * 반복 수가 많은 기와·서까래·천장 보는 world 좌표 mesh 하나로 모은다.
 */
import type { IAutoMovieBuiltElement, IAutoMovieBuiltEnvironment, IAutoMovieModel, IAutoMovieVector3 } from "@automovie/interface";
import { planeHeight, type PlanPoint, type RoofPatch } from "../geometry/planar-domain";
import { identityTransform } from "../geometry/model-parts";
import { roofCladdingModel } from "../models/cladding";
import { colonnadeColumnModel, porchColumnModel } from "../models/columns";
import { ceilingJoists, porchEntablature, rafters, sanctuaryTruss } from "../models/entablature";
import { fountainModel } from "../models/fixtures";
import { box, merged, model, part, vec, yaw } from "../models/mesh-kit";
import { doorFrameModel, doubleLeafModel, singleLeafModel, windowFrameModel } from "../models/openings";
import { templePlan as p } from "../spaces/building";
import { createTempleEnvironment } from "../spaces/environment";
import { templeClerestories, templeDoorPassages } from "../spaces/openings";
import { templeLevels as y } from "../spaces/storey";

const containsPlan = (polygon: readonly PlanPoint[], at: PlanPoint) => polygon.every((a, i) => {
  const b = polygon[(i + 1) % polygon.length]!;
  return (b.x - a.x) * (at.z - a.z) - (b.z - a.z) * (at.x - a.x) >= -1e-9;
});

/** 지정 단위 지붕의 하부 높이(점을 덮는 조각 중 가장 낮은 하부). */
const undersideAt = (roof: readonly RoofPatch[], tier: RoofPatch["tier"], at: PlanPoint): number => {
  const hits = roof.filter((r) => r.tier === tier && containsPlan(r.polygon, at)).map((r) => planeHeight(r.height, at) - r.thickness);
  if (hits.length === 0) throw new Error(`instances: (${at.x}, ${at.z})에 ${tier} 지붕이 없습니다.`);
  return Math.min(...hits);
};

const range = (from: number, to: number, step: number) => {
  const values: number[] = [];
  for (let v = from; v <= to + 1e-9; v += step) values.push(Math.round(v * 1e6) / 1e6);
  return values;
};

const placed = (id: string, kind: string, modelId: string, space: string | null, translation: IAutoMovieVector3, angle = 0): IAutoMovieBuiltElement => ({
  id, kind, parent: "temple.root", model: modelId, space,
  transform: { ...identityTransform(), translation, rotation: yaw(angle) },
});

const inSpace = (environment: IAutoMovieBuiltEnvironment, space: string, at: IAutoMovieVector3) =>
  environment.spaces.find((s) => s.id === space)?.cells.some((cell) =>
    cell.planes.every((plane) => plane.normal.x * at.x + plane.normal.y * at.y + plane.normal.z * at.z <= plane.offset + 1e-9)) ?? false;

export const templeMembers = (environment: IAutoMovieBuiltEnvironment, roof: readonly RoofPatch[]) => {
  const models: IAutoMovieModel[] = [];
  const elements: IAutoMovieBuiltElement[] = [];
  const notes: string[] = [];

  // 주랑 원주와 보: 축선은 중정 경계에서 0.175m 안쪽, 보 윗면은 보 중정 쪽 면의 가장 낮은 지붕 하부 − 서까래 0.12m.
  const [ax, zn, zs] = [p.eastCourt + 0.175, p.courtBack - 0.175, p.courtFront + 0.175];
  const samples: PlanPoint[] = [
    ...range(-ax - 0.17, ax + 0.17, 0.1).flatMap((x) => [{ x, z: zn + 0.13 }, { x, z: zs - 0.13 }]),
    ...range(zn, zs, 0.1).flatMap((z) => [{ x: -ax + 0.13, z }, { x: ax - 0.13, z }]),
  ];
  const beamTop = Math.min(...samples.map((s) => undersideAt(roof, "wing", s))) - 0.12;
  const beamBottom = beamTop - 0.28;
  const column = colonnadeColumnModel(beamBottom - y.floor);
  models.push(column);
  const positions: Array<[number, number]> = [
    ...[-ax, -1.225, 1.225, ax].flatMap((x) => [[x, zn], [x, zs]] as Array<[number, number]>),
    ...range(zn, zs, (zs - zn) / 4).slice(1, -1).flatMap((z) => [[-ax, z], [ax, z]] as Array<[number, number]>),
  ];
  positions.forEach(([x, z], i) => elements.push(placed(`element.column-colonnade.${i}`, "column", column.id, "colonnade", vec(x, y.floor, z))));
  models.push(model("model.beam-colonnade", "beam-colonnade", [part("surface.beam-colonnade.timber", merged([
    box(-ax - 0.17, ax + 0.17, beamBottom, beamTop, zn - 0.13, zn + 0.13), box(-ax - 0.17, ax + 0.17, beamBottom, beamTop, zs - 0.13, zs + 0.13),
    box(-ax - 0.13, -ax + 0.13, beamBottom, beamTop, zn + 0.13, zs - 0.13), box(ax - 0.13, ax + 0.13, beamBottom, beamTop, zn + 0.13, zs - 0.13),
  ]))]));
  elements.push(placed("element.beam-colonnade", "beam", "model.beam-colonnade", "colonnade", vec(0, 0, 0)));
  notes.push(`주랑 원주 ${positions.length}개, 높이 ${(beamBottom - y.floor).toFixed(3)}m, 보 윗면 ${beamTop.toFixed(3)}m`);

  // 포치 원주 둘과 보·코니스·경사 트림.
  const porch = porchColumnModel();
  models.push(porch);
  for (const x of [-1.35, 1.35]) elements.push(placed(`element.column-porch.${x < 0 ? "west" : "east"}`, "column", porch.id, "entrance", vec(x, y.floor, 10)));
  const porchRoof = roof.find((r) => r.tier === "porch")!;
  const apex = planeHeight(porchRoof.height, { x: 0, z: p.southOuter }) - porchRoof.thickness;
  const ent = porchEntablature(p.eastPorchInner, p.southOuter, 3.2, apex);
  models.push(model("model.porch-entablature", "porch-entablature", [
    part("surface.porch-entablature.beam", ent.beam), part("surface.porch-entablature.cornice", ent.cornice),
    part("surface.porch-entablature.raking-trim", ent.raking),
  ]));
  elements.push(placed("element.porch-entablature", "beam", "model.porch-entablature", "entrance", vec(0, 0, 0)));

  // 문틀과 문짝.
  for (const door of templeDoorPassages) {
    const t = door.wallHigh - door.wallLow;
    const c = (door.wallLow + door.wallHigh) / 2;
    const alongX = door.axis === "x";
    const world = (along: number, across: number, height: number) => alongX ? vec(along, height, across) : vec(across, height, along);
    const frame = doorFrameModel(door.width, door.height, t);
    if (!models.some((m) => m.id === frame.id)) models.push(frame);
    elements.push(placed(`element.door-frame.${door.id}`, "door-frame", frame.id, door.room, world(door.center, c, y.floor), alongX ? 0 : -Math.PI / 2));
    const probe = (sign: number) => inSpace(environment, door.room, world(door.center, c + sign * (t / 2 + 0.3), y.floor + 1));
    const sign = probe(1) ? 1 : probe(-1) ? -1 : 0;
    if (sign === 0) {
      notes.push(`${door.id}: 방 쪽을 공간 cell에서 찾지 못해 문짝을 놓지 않음(unverified)`);
      continue;
    }
    const normal = world(0, sign, 0);
    const angle = Math.atan2(-normal.z, normal.x);
    const hingeAcross = c + sign * (t / 2 - 0.05);
    const hinges = door.swing === "room-double" ? [door.center - door.width / 2, door.center + door.width / 2]
      : [door.swing === "room-north" ? door.center - door.width / 2 : door.center + door.width / 2];
    const leaf = door.swing === "room-double" ? doubleLeafModel(door.width / 2, door.height) : singleLeafModel(door.width, door.height);
    if (!models.some((m) => m.id === leaf.id)) models.push(leaf);
    hinges.forEach((along, i) => elements.push(placed(`element.door-leaf.${door.id}.${i}`, "door-leaf", leaf.id, door.room, world(along, hingeAcross, y.floor), angle)));
  }

  // 채광구 틀: 외부 면(+Z local)을 바깥으로.
  for (const window of templeClerestories()) {
    const t = window.wallHigh - window.wallLow;
    const c = (window.wallLow + window.wallHigh) / 2;
    const xs = window.profile.outline.map((q) => q.x);
    const center = (Math.min(...xs) + Math.max(...xs)) / 2;
    const frame = windowFrameModel(t);
    if (!models.some((m) => m.id === frame.id)) models.push(frame);
    const side = window.id.split("-")[2]!;
    const at = side === "north" || side === "south" ? vec(center, window.sill - 0.06, c) : vec(c, window.sill - 0.06, center);
    const angle = side === "north" ? Math.PI : side === "south" ? 0 : side === "west" ? -Math.PI / 2 : Math.PI / 2;
    elements.push(placed(`element.window-frame.${window.id}`, "window-frame", frame.id, "sanctuary", at, angle));
  }

  // 기와와 용마루.
  const ridgeOf = (owner: string, clipSouth?: number): Array<[IAutoMovieVector3, IAutoMovieVector3]> => {
    const lows = roof.filter((r) => r.owner === owner && r.id.includes(".low"));
    const highs = roof.filter((r) => r.owner === owner && r.id.includes(".high"));
    if (lows.length === 0 || highs.length === 0) return [];
    const [a, b] = [lows[0]!.height, highs[0]!.height];
    const x = (b.constant - a.constant) / (a.x - b.x);
    const zs = lows.flatMap((r) => r.polygon.filter((q) => Math.abs(q.x - x) < 1e-3).map((q) => q.z));
    const z1 = clipSouth === undefined ? Math.max(...zs) : Math.min(Math.max(...zs), clipSouth);
    const h = planeHeight(a, { x, z: 0 }) + 0.02;
    return [[vec(x, h, Math.min(...zs)), vec(x, h, z1)]];
  };
  for (const owner of ["roof-sanctuary", "roof-west", "roof-east", "roof-colonnade", "roof-porch"]) {
    const ridges = owner === "roof-east" ? ridgeOf(owner, p.southInner - 0.06) : ridgeOf(owner);
    const cladding = roofCladdingModel(owner, roof.filter((r) => r.owner === owner), ridges);
    models.push(cladding.model);
    elements.push(placed(`element.cladding-${owner}`, "roof-tile", cladding.model.id, null, vec(0, 0, 0)));
    notes.push(`${owner} 기와 단위 ${cladding.units}`);
  }

  // 주랑 서까래(모서리 골 칸은 빼는 표현 한계).
  const plane = (owner: string, probe: PlanPoint) => {
    const r = roof.find((q) => q.owner === owner && containsPlan(q.polygon, probe))!;
    return { ...r.height, constant: r.height.constant - r.thickness };
  };
  const west = range(p.courtBack + 0.25, p.courtFront - 0.25, 0.5).map((z): [PlanPoint, PlanPoint] => [{ x: p.westCourt + 0.35, z }, { x: p.westRing, z }]);
  const east = range(p.courtBack + 0.25, p.courtFront - 0.25, 0.5).map((z): [PlanPoint, PlanPoint] => [{ x: p.eastCourt - 0.35, z }, { x: p.eastRing, z }]);
  const north = range(p.westCourt + 0.25, p.eastCourt - 0.25, 0.5).map((x): [PlanPoint, PlanPoint] => [{ x, z: p.courtBack + 0.35 }, { x, z: p.northRing }]);
  const south = range(p.westCourt + 0.25, p.eastCourt - 0.25, 0.5).map((x): [PlanPoint, PlanPoint] =>
    [{ x, z: p.courtFront - 0.35 }, { x, z: Math.abs(x) < p.eastPorchOuter ? p.entranceBack : p.southInner }]);
  models.push(model("model.rafters-colonnade", "rafters-colonnade", [part("surface.rafters-colonnade.timber", merged([
    rafters(west, plane("roof-west", { x: -4.5, z: 2 })), rafters(east, plane("roof-east", { x: 4.5, z: 2 })),
    rafters(north, plane("roof-colonnade", { x: 0, z: -2.5 })), rafters(south, plane("roof-colonnade", { x: 0, z: 7 })),
  ]))]));
  elements.push(placed("element.rafters-colonnade", "rafter", "model.rafters-colonnade", "colonnade", vec(0, 0, 0)));

  // 제실 트러스 둘.
  const sanctuaryRoof = roof.find((r) => r.tier === "sanctuary")!;
  const sanctuaryUnder = (x: number) => planeHeight(sanctuaryRoof.height, { x: -Math.abs(x), z: -7 }) - sanctuaryRoof.thickness;
  const trusses = [-8.3, -5.5].map((z) => sanctuaryTruss(z, p.eastRing, sanctuaryUnder));
  models.push(model("model.truss-sanctuary", "truss-sanctuary", [
    part("surface.truss-sanctuary.tie-beam", merged(trusses.map((t) => t.tie))),
    part("surface.truss-sanctuary.principal", merged(trusses.map((t) => t.principal))),
    part("surface.truss-sanctuary.king-post", merged(trusses.map((t) => t.king))),
    part("surface.truss-sanctuary.strut", merged(trusses.map((t) => t.strut))),
  ]));
  elements.push(placed("element.truss-sanctuary", "truss", "model.truss-sanctuary", "sanctuary", vec(0, 0, 0)));

  // 천장 보(0.60m 간격).
  const bottom = y.lowCeiling - y.exposedBeamDepth;
  const joists = (from: number, to: number) => range(from + 0.3, to - 0.3, 0.6);
  models.push(model("model.joists", "joists", [part("surface.joists.timber", merged([
    ceilingJoists(p.westInner, p.westRoom, joists(p.northInner, p.southInner), bottom, y.lowCeiling),
    ceilingJoists(p.eastRoom, p.eastInner, joists(p.storageBack, p.storageFront), bottom, y.lowCeiling),
    ceilingJoists(p.eastRoom, p.eastInner, joists(p.recordsBack, p.recordsFront), bottom, y.lowCeiling),
    ceilingJoists(p.eastRoom, p.eastInner, joists(p.officeBack, p.southInner), bottom, y.lowCeiling),
  ]))]));
  elements.push(placed("element.joists", "joist", "model.joists", null, vec(0, 0, 0)));

  // 분수: 중정 중심.
  const fountain = fountainModel();
  models.push(fountain);
  elements.push(placed("element.fountain", "fixture", fountain.id, "courtyard", vec(0, y.courtyard, (p.courtBack + p.courtFront) / 2)));

  return { models, elements, notes };
};

/** spaces environment에 부재 model과 배치를 더한 장면. 뷰어·관찰·결산이 같은 값을 쓴다. */
export const createTempleScene = () => {
  const built = createTempleEnvironment();
  const members = templeMembers(built.environment, built.roof);
  return {
    ...built,
    members,
    environment: {
      ...built.environment,
      models: [...built.environment.models, ...members.models],
      elements: [...built.environment.elements, ...members.elements],
    },
  };
};
