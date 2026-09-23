/**
 * docs/spaces/building.md#containment의 건물 조립을 공개 built environment로
 * 낸다. 한 층의 아홉 공간 cell, 입면·내부벽·지붕·바닥·낮은 천장의 실체
 * model, host face를 가진 경계, profile을 가진 문/채광구, 서로 다른 공간을
 * 잇는 connector, 보행 support를 같은 입력에서 조립한다. 외부 지면은 maps의
 * 소유라 여기서 만들지 않고 외벽 하단 계산에 필요한 최저 접촉만 입력으로
 * 받는다. 문짝·기둥·수반 등 독립 부재는 models 소유로 아직 포함하지 않는다.
 */
import { validateBuiltEnvironment } from "@automovie/engine";
import type {
  IAutoMovieBoundaryFace, IAutoMovieBuiltBoundary,
  IAutoMovieBuiltElement, IAutoMovieBuiltEnvironment, IAutoMovieBuiltOpening, IAutoMovieModel,
} from "@automovie/interface";
import { createTempleFloors } from "../floors";
import { identityTransform, surfaceModel } from "../geometry/model-parts";
import {
  edgeInside, planeHeight, rectanglePolygon, type PlanPoint,
} from "../geometry/planar-domain";
import { cullCoincidentVerticalFaces } from "../geometry/face-culling";
import { roofSlabFaces, roofStepClosures, type UndersideRegion } from "../geometry/roof-solids";
import { wallFaces, wallHostOutline, type WallSpec } from "../geometry/wall-solids";
import { templeInteriorWalls } from "./boundaries";
import { templeConnectors } from "./circulation";
import { templePlan as p, templeSpaceHierarchy } from "./building";
import { templeEastWalls } from "./facades/east";
import { templeNorthWalls } from "./facades/north";
import { templeSouthWalls } from "./facades/south";
import { templeWestWalls } from "./facades/west";
import { templeClerestories, templeDoorPassages, templeDoorProfile } from "./openings";
import { templeRoofEnvelope } from "./roofs/assembly";
import { templeAdministration, templeAdministrationCeiling, templeAdministrationPlan } from "./rooms/administration";
import { templeColonnade, templeColonnadeRegions } from "./rooms/colonnade";
import { templeCourtyard } from "./rooms/courtyard";
import { templeEntrance } from "./rooms/entrance";
import { templeOffering, templeOfferingCeiling, templeOfferingPlan } from "./rooms/offering";
import { templeRecords, templeRecordsCeiling, templeRecordsPlan } from "./rooms/records";
import { templeSanctuary, templeSanctuaryPlan } from "./rooms/sanctuary";
import { templeServiceYard } from "./rooms/service-yard";
import { templeStorage, templeStorageCeiling, templeStoragePlan } from "./rooms/storage";
import { templeLevels as y, templeWallBottom } from "./storey";

export interface TempleEnvironmentInput {
  /** 외벽 바깥 접촉선을 따라 읽은 지면의 최저 높이(m). maps가 공급한다. */
  exteriorContactMinimum: number;
}

export const createTempleEnvironment = (input: TempleEnvironmentInput) => {
  const roof = templeRoofEnvelope();
  const floors = createTempleFloors();
  const bottom = templeWallBottom(input.exteriorContactMinimum, exteriorFloorMinimum(floors.inputs));
  const walls: WallSpec[] = [
    ...templeNorthWalls(bottom), ...templeWestWalls(bottom), ...templeEastWalls(bottom),
    ...templeSouthWalls(bottom), ...templeInteriorWalls(),
  ];
  const regions: UndersideRegion[] = [
    { polygon: rectanglePolygon(templeSanctuaryPlan), surface: () => "surface.sanctuary.ceiling" },
    ...templeColonnadeRegions.map((r) => ({ polygon: rectanglePolygon(r), surface: () => "surface.colonnade.ceiling" })),
    ...[templeOfferingPlan, templeAdministrationPlan, templeRecordsPlan, templeStoragePlan]
      .map((r) => ({ polygon: rectanglePolygon(r), surface: (owner: string) => `surface.${owner}.concealed` })),
    ...walls.map((w) => ({ polygon: w.plan, surface: (owner: string) => `surface.${owner}.bearing` })),
  ];
  const roofFaces = roof.map((patch) => ({
    owner: patch.owner, faces: roofSlabFaces([patch], regions),
  }));
  const roofVisible = cullCoincidentVerticalFaces([...roofFaces.flatMap((r) => r.faces), ...roofStepClosures(roof)]);
  const roofOwner = new Map(roofFaces.flatMap((r) => r.faces.map((f) => [f, r.owner] as const)));
  const models: IAutoMovieModel[] = [
    ...walls.map((w) => surfaceModel(`model.${w.id}`, w.id, cullCoincidentVerticalFaces(wallFaces(w, roof)))),
    ...["roof-sanctuary", "roof-west", "roof-east", "roof-colonnade", "roof-porch"].map((owner) =>
      surfaceModel(`model.${owner}`, owner, roofVisible.filter((f) => (roofOwner.get(f) ?? ownerOf(f.surface)) === owner))),
    surfaceModel("model.floors", "floors", floors.faces.map((f) => ({ surface: f.surface, corners: f.corners }))),
    surfaceModel("model.ceilings", "ceilings", [
      ...templeOfferingCeiling(), ...templeAdministrationCeiling(),
      ...templeRecordsCeiling(), ...templeStorageCeiling(),
    ]),
  ];
  const kinds: Record<string, string> = { wall: "wall", roof: "roof", floors: "floor", ceilings: "ceiling" };
  const elements: IAutoMovieBuiltElement[] = [
    { id: "temple.root", kind: "building", parent: null, transform: identityTransform(), model: null, space: y.building },
    ...models.map((m) => ({
      id: m.id.replace(/^model\./, "element."),
      kind: kinds[m.id.split(".")[1]!.split("-")[0]!] ?? "envelope",
      parent: "temple.root", transform: identityTransform(), model: m.id, space: y.storey,
    })),
  ];
  const spaces = templeSpaceHierarchy([
    templeEntrance(roof), templeCourtyard(), templeColonnade(roof),
    templeSanctuary(roof), templeOffering(), templeAdministration(),
    templeRecords(), templeStorage(), templeServiceYard(),
  ]);
  const wall = (id: string) => walls.find((w) => w.id === id)!;
  const face = (w: WallSpec, from: number, to: number): IAutoMovieBoundaryFace => {
    const perpendicular = w.plan.map((q) => w.axis === "x" ? q.z : q.x);
    const low = Math.min(...perpendicular);
    const high = Math.max(...perpendicular);
    const mid = (low + high) / 2;
    return {
      origin: w.axis === "x" ? { x: 0, y: 0, z: mid } : { x: mid, y: 0, z: 0 },
      rotation: w.axis === "x" ? { x: 0, y: 0, z: 0, w: 1 } : { x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
      outline: wallHostOutline(w, roof, from, to, mid),
      thickness: high - low,
    };
  };
  const boundary = (id: string, spaceIds: string[], wallId: string, host: [number, number]): IAutoMovieBuiltBoundary => ({
    id, kind: wallId.startsWith("wall.boundary") ? "interior-wall" : "exterior-wall",
    spaces: spaceIds, elements: [`element.${wallId}`], face: face(wall(wallId), host[0], host[1]),
  });
  const boundaries: IAutoMovieBuiltBoundary[] = [
    boundary("boundary-north.offering", ["offering"], "wall.facade-north", [p.westOuter, p.westRoom]),
    boundary("boundary-north.sanctuary", ["sanctuary"], "wall.facade-north", [p.westRing, p.eastRing]),
    boundary("boundary-north.service-yard", ["service-yard"], "wall.facade-north", [p.eastRoom, p.eastOuter]),
    boundary("boundary-west.offering", ["offering"], "wall.facade-west", [p.northOuter, p.southOuter]),
    boundary("boundary-east.service-yard", ["service-yard"], "wall.facade-east", [p.northOuter, p.yardFront]),
    boundary("boundary-east.storage", ["storage"], "wall.facade-east", [p.storageBack, p.storageFront]),
    boundary("boundary-east.records", ["records"], "wall.facade-east", [p.recordsBack, p.recordsFront]),
    boundary("boundary-east.administration", ["administration"], "wall.facade-east", [p.officeBack, p.southOuter]),
    boundary("boundary-south.offering", ["offering"], "wall.facade-south.west", [p.westOuter, p.westRoom]),
    boundary("boundary-south.colonnade-west", ["colonnade"], "wall.facade-south.west", [p.westRing, p.westPorchOuter]),
    boundary("boundary-south.colonnade-east", ["colonnade"], "wall.facade-south.east", [p.eastPorchOuter, p.eastRing]),
    boundary("boundary-south.administration", ["administration"], "wall.facade-south.east", [p.eastRoom, p.eastOuter]),
    boundary("boundary-entry", ["entrance", "colonnade"], "wall.facade-south.entry-back", [p.westPorchOuter, p.eastPorchOuter]),
    boundary("boundary-entrance-return-west", ["entrance", "colonnade"], "wall.facade-south.return-west", [p.entranceFront, p.southOuter]),
    boundary("boundary-entrance-return-east", ["entrance", "colonnade"], "wall.facade-south.return-east", [p.entranceFront, p.southOuter]),
    boundary("boundary-west-spine.sanctuary", ["offering", "sanctuary"], "wall.boundary-west-spine", [p.northInner, p.sanctuaryFront]),
    boundary("boundary-west-spine.colonnade", ["offering", "colonnade"], "wall.boundary-west-spine", [p.northRing, p.southInner]),
    boundary("boundary-east-spine.sanctuary", ["sanctuary", "service-yard"], "wall.boundary-east-spine", [p.northInner, p.sanctuaryFront]),
    boundary("boundary-east-spine.yard", ["colonnade", "service-yard"], "wall.boundary-east-spine", [p.northRing, p.yardFront]),
    boundary("boundary-east-spine.storage", ["colonnade", "storage"], "wall.boundary-east-spine", [p.storageBack, p.storageFront]),
    boundary("boundary-east-spine.records", ["colonnade", "records"], "wall.boundary-east-spine", [p.recordsBack, p.recordsFront]),
    boundary("boundary-east-spine.administration", ["colonnade", "administration"], "wall.boundary-east-spine", [p.officeBack, p.southInner]),
    boundary("boundary-sanctuary-south", ["sanctuary", "colonnade"], "wall.boundary-sanctuary-south", [p.westRing, p.eastRing]),
    boundary("boundary-yard-storage", ["service-yard", "storage"], "wall.boundary-yard-storage", [p.eastRoom, p.eastInner]),
    boundary("boundary-storage-records", ["storage", "records"], "wall.boundary-storage-records", [p.eastRoom, p.eastInner]),
    boundary("boundary-records-office", ["records", "administration"], "wall.boundary-records-office", [p.eastRoom, p.eastInner]),
  ];
  const openings: IAutoMovieBuiltOpening[] = [
    ...templeDoorPassages.map((door) => ({
      id: door.id, kind: "door", boundary: door.boundary, fill: null, profile: templeDoorProfile(door),
    })),
    ...templeClerestories().map((window) => ({
      id: window.id, kind: "window", boundary: window.boundary, fill: null, profile: window.profile,
    })),
  ];
  const connectors = templeConnectors(spaces, roof);
  const environment: IAutoMovieBuiltEnvironment = {
    version: 1, id: "temple", units: "meter",
    buildings: [{ id: y.building, element: "temple.root", space: y.building }],
    models, modelReferences: [], elements, spaces, boundaries, openings, connectors,
    surfaces: floors.supports, walkable: floors.supports.map((s) => s.surface.id),
  };
  const validation = validateBuiltEnvironment({ environment });
  if (!validation.success) {
    throw new Error(`temple/environment: ${validation.violations.map((v) => `${v.path}: ${v.expected}`).join("\n")}`);
  }
  return { environment, walls, roof, wallBottom: bottom, floors };
};

/** 차집합으로 새로 만든 지붕 면의 owner는 surface 이름의 roof owner다. */
const ownerOf = (surface: string): string => {
  const owner = surface.split(".")[1]!;
  if (!owner.startsWith("roof-")) throw new Error(`temple/environment: ${surface}의 지붕 owner를 알 수 없습니다.`);
  return owner;
};

/** 외벽·현관 벽에 실제로 맞닿는 바닥 구획의 최저 완성면. */
const exteriorFloorMinimum = (inputs: ReturnType<typeof createTempleFloors>["inputs"]): number => {
  const hosts = [
    ...templeNorthWalls(0), ...templeWestWalls(0), ...templeEastWalls(0), ...templeSouthWalls(0),
  ].map((w) => w.plan);
  const inside = (polygon: readonly PlanPoint[], point: PlanPoint) => polygon.every((q, i) =>
    planeHeight(edgeInside(q, polygon[(i + 1) % polygon.length]!), point) > 0);
  const touching = inputs.flatMap((input) => input.slabs).filter((slab) => [
    { x: slab.west - 1e-4, z: (slab.north + slab.south) / 2 },
    { x: slab.east + 1e-4, z: (slab.north + slab.south) / 2 },
    { x: (slab.west + slab.east) / 2, z: slab.north - 1e-4 },
    { x: (slab.west + slab.east) / 2, z: slab.south + 1e-4 },
  ].some((point) => hosts.some((polygon) => inside(polygon, point))));
  if (touching.length === 0) throw new Error("temple/environment: 외벽에 닿는 바닥이 없습니다.");
  return Math.min(...touching.map((slab) => slab.floor));
};
