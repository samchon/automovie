/**
 * docs/spaces/building.md#containment의 건물 조립을 공개 built environment로
 * 낸다. 한 층의 아홉 공간 cell, 입면·내부벽·지붕·바닥·낮은 천장의 실체
 * model, host face를 가진 경계, profile을 가진 문/채광구, 서로 다른 공간을
 * 잇는 connector, 보행 support를 같은 입력에서 조립한다. 대지는 별도 소유
 * 단위 temple-site(docs/spaces/site.md)이고 외벽 하단은 그 지면의 최저 접촉을
 * 읽는다. 문짝·기둥·수반 등 독립 부재는 models 소유로 아직 포함하지 않는다.
 */
import { validateBuiltEnvironment } from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMovieBoundaryFace, IAutoMovieBuiltBoundary,
  IAutoMovieBuiltElement, IAutoMovieBuiltEnvironment, IAutoMovieBuiltOpening, IAutoMovieModel,
} from "@automovie/interface";
import { createTempleFloors, templeFloorInputs } from "../floors";
import { identityTransform, surfaceModel } from "../geometry/model-parts";
import {
  edgeInside, planeHeight, rectanglePolygon, type PlanPoint,
} from "../geometry/planar-domain";
import { cullCoincidentVerticalFaces } from "../geometry/face-culling";
import { roofSlabFaces, roofStepClosures, type UndersideRegion } from "../geometry/roof-solids";
import { clipOutlineAtHeight, wallFaces, wallHostOutline, type WallSpec } from "../geometry/wall-solids";
import { copingFaces, plinthFaces, type WallTrimInput } from "../geometry/wall-trim";
import { templeInteriorWalls } from "./boundaries";
import { templeConnectors } from "./circulation";
import { templePlan as p, templeSpaceHierarchy } from "./building";
import { templeEastWalls } from "./facades/east";
import { templeNorthWalls } from "./facades/north";
import { templePlinthRise, templeSouthWalls } from "./facades/south";
import { templeWallTrim } from "./junctions";
import { templeDadoFaces } from "./ownership";
import { templeWestWalls } from "./facades/west";
import { templeClerestories, templeDoorPassages, templeDoorProfile } from "./openings";
import { templeRoofEnvelope, templeRoofRules } from "./roofs/assembly";
import { templeAdministration, templeAdministrationCeiling, templeAdministrationPlan } from "./rooms/administration";
import { templeColonnade, templeColonnadeRegions } from "./rooms/colonnade";
import { templeCourtyard } from "./rooms/courtyard";
import { templeEntrance } from "./rooms/entrance";
import { templeOffering, templeOfferingCeiling, templeOfferingPlan } from "./rooms/offering";
import { templeRecords, templeRecordsCeiling, templeRecordsPlan } from "./rooms/records";
import { templeSanctuary, templeSanctuaryPlan } from "./rooms/sanctuary";
import { templeServiceYard } from "./rooms/service-yard";
import { createTempleSite } from "./site/assembly";
import { templeSiteContactMinimum, templeSiteGradeBreaks, templeSiteGradePlane } from "./site/extent";
import { templeStorage, templeStorageCeiling, templeStoragePlan } from "./rooms/storage";
import { templeLevels as y, templeWallBottom } from "./storey";

/**
 * @evidence spaces/building.md 건물 하나·한 층·아홉 공간의 cell과 입면·내부벽·지붕·바닥·천장 model, host face 경계, profile 개구부, connector, 보행 support를 한 generation으로 조립해 공개 built environment로 돌려준다.
 * @evidence spaces/building.md#approach-contacts 정문 계단과 외부 서비스 문의 두 connector가 temple-site에서 건물 접점으로 들어오도록 대지 unit·공간과 같은 environment에 싣는다.
 * @evidence spaces/junctions.md#gable-closures 합성 지붕 조각을 culling하고 높이 차이 막음의 앞면과 주머니 쪽 뒷면을 더해 지붕 아래·위의 닫힘을 표면으로 낸다.
 * @evidence principles/core/source-units.md#source-scope-preservation 공간·경계·개구부·지붕·대지를 각 owner 함수에서 받아 조립만 하며 방 치수나 지붕 높이를 여기서 새로 정하지 않고, 독립 부재(문짝·기둥·수반)는 넣지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 반환값은 validateBuiltEnvironment를 통과한 실제 environment와 walls·roof·wallBottom·floors·site·trim이며 검증 실패는 경로와 기대값을 담은 오류로 던진다.
 * @evidence upstream/design/space-sources.md#design-revision-from-space-source-work 구현이 부모 두 곳을 먼저 고치게 했다: 채광구가 인접 지붕 위로 열리는데 경계가 방 사이로만 나뉘어 외부 창 주소가 없던 openings.md#boundary-ownership(위쪽 외부 향 경계 분할, c7af729c), 높이 차이 막음 뒷면이 없어 주랑에서 바깥이 비치던 roofs/assembly.md#roof-junctions(앞·뒷면 소유, 0cd21642).
 * @evidence obligations/design/space-sources.md#space-source-invalid-topology 조립한 environment를 validateBuiltEnvironment로 검증해 실패하면 위반 경로와 기대를 모두 적은 오류로 멈추고 부분 결과를 돌려주지 않는다.
 * @evidence obligations/design/space-sources.md#space-source-stable-identities 공간·경계·개구부·model·element ID를 설계 주소(boundary-*, window-*, model.wall.*, element.*)에서 만들고 시계·난수·파일 상태를 쓰지 않아 같은 입력은 같은 environment를 낸다.
 * @evidence obligations/design/space-sources.md#space-source-design-ownership environment의 모든 공간·경계·개구부·지붕·대지 사실은 각자 한 spaces 설계 파일을 인용하는 owner export에서 오며, 막음 뒷면처럼 source가 먼저 드러낸 결정은 부모 H2를 고친 뒤에만 실었다.
 */
export const createTempleEnvironment = () => {
  const roof = templeRoofEnvelope();
  const site = createTempleSite();
  const bottom = templeWallBottom(templeSiteContactMinimum(), exteriorFloorMinimum(templeFloorInputs(null)));
  const floors = createTempleFloors(bottom);
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
  const closures = roofStepClosures(roof);
  // 높이 차이 막음은 한 장의 면이라 뒷면이 가려지지 않는다. 높은 조각 아래 주머니 쪽(방이면 그 방의
  // 천장, 아니면 처마 하부)을 향한 뒷면을 culling 뒤에 더해 실내에서 바깥이 비쳐 보이지 않게 한다.
  const closureBacks = closures.map((face) => {
    const [a, b, c] = face.corners as [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3];
    const nx = (b.y - a.y) * (c.z - a.z) - (b.z - a.z) * (c.y - a.y);
    const nz = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    const length = Math.hypot(nx, nz) || 1;
    const cx = face.corners.reduce((sum, q) => sum + q.x, 0) / face.corners.length;
    const cz = face.corners.reduce((sum, q) => sum + q.z, 0) / face.corners.length;
    const probe = { x: cx - nx / length * 0.05, z: cz - nz / length * 0.05 };
    const owner = ownerOf(face.surface);
    const region = regions.find((r) => r.polygon.every((q, i) => planeHeight(edgeInside(q, r.polygon[(i + 1) % r.polygon.length]!), probe) >= -1e-9));
    return { owner, face: { surface: region === undefined ? `surface.${owner}.soffit` : region.surface(owner), corners: [...face.corners].reverse() } };
  });
  const roofVisible = [...cullCoincidentVerticalFaces([...roofFaces.flatMap((r) => r.faces), ...closures]), ...closureBacks.map((back) => back.face)];
  const roofOwner = new Map([
    ...roofFaces.flatMap((r) => r.faces.map((f) => [f, r.owner] as const)),
    ...closureBacks.map((back) => [back.face, back.owner] as const),
  ]);
  const trim: WallTrimInput = {
    walls, roof,
    profile: { ...templeWallTrim, plinthRise: templePlinthRise },
    outline: { west: p.westOuter, east: p.eastOuter, north: p.northOuter, south: p.southOuter },
    grade: (at) => templeSiteGradePlane(at.z),
    gradeBreaks: templeSiteGradeBreaks,
    plinthSurface: (outer) => outer.replace(/.outer$/, ".plinth"),
  };
  const models: IAutoMovieModel[] = [
    ...walls.map((w) => surfaceModel(`model.${w.id}`, w.id, templeDadoFaces(cullCoincidentVerticalFaces(wallFaces(w, roof))))),
    ...["roof-sanctuary", "roof-west", "roof-east", "roof-colonnade", "roof-porch"].map((owner) =>
      surfaceModel(`model.${owner}`, owner, roofVisible.filter((f) => (roofOwner.get(f) ?? ownerOf(f.surface)) === owner))),
    surfaceModel("model.trim-coping", "trim-coping", copingFaces(trim)),
    surfaceModel("model.trim-plinth", "trim-plinth", plinthFaces(trim)),
    surfaceModel("model.floors", "floors", floors.faces.map((f) => ({ surface: f.surface, corners: f.corners }))),
    surfaceModel("model.ceilings", "ceilings", [
      ...templeOfferingCeiling(), ...templeAdministrationCeiling(),
      ...templeRecordsCeiling(), ...templeStorageCeiling(),
    ]),
  ];
  const kinds: Record<string, string> = { wall: "wall", roof: "roof", floors: "floor", ceilings: "ceiling", trim: "trim" };
  const elements: IAutoMovieBuiltElement[] = [
    { id: "temple.root", kind: "building", parent: null, transform: identityTransform(), model: null, space: y.building },
    ...models.map((m) => ({
      id: m.id.replace(/^model\./, "element."),
      kind: kinds[m.id.split(".")[1]!.split("-")[0]!] ?? "envelope",
      parent: "temple.root", transform: identityTransform(), model: m.id, space: y.storey,
    })),
  ];
  const spaces = [...templeSpaceHierarchy([
    templeEntrance(roof), templeCourtyard(), templeColonnade(roof),
    templeSanctuary(roof), templeOffering(), templeAdministration(),
    templeRecords(), templeStorage(), templeServiceYard(),
  ]), site.space];
  const wall = (id: string) => walls.find((w) => w.id === id)!;
  const face = (w: WallSpec, from: number, to: number, band?: { height: number; keep: "below" | "above" }): IAutoMovieBoundaryFace => {
    const perpendicular = w.plan.map((q) => w.axis === "x" ? q.z : q.x);
    const low = Math.min(...perpendicular);
    const high = Math.max(...perpendicular);
    const mid = (low + high) / 2;
    return {
      origin: w.axis === "x" ? { x: 0, y: 0, z: mid } : { x: mid, y: 0, z: 0 },
      rotation: w.axis === "x" ? { x: 0, y: 0, z: 0, w: 1 } : { x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
      outline: band === undefined ? wallHostOutline(w, roof, from, to, mid)
        : clipOutlineAtHeight(wallHostOutline(w, roof, from, to, mid), band.height, band.keep),
      thickness: high - low,
    };
  };
  const boundary = (
    id: string, spaceIds: string[], wallId: string, host: [number, number],
    band?: { height: number; keep: "below" | "above" },
  ): IAutoMovieBuiltBoundary => ({
    id, kind: wallId.startsWith("wall.boundary") ? "interior-wall" : "exterior-wall",
    spaces: spaceIds, elements: [`element.${wallId}`], face: face(wall(wallId), host[0], host[1], band),
  });
  // docs/spaces/openings.md#boundary-ownership: 다른 쪽 부피가 끝나고 그 위가 외부로 드러나는
  // 제실 세 벽은 그 높이에서 두 경계로 나눈다. 지붕 있는 방은 벽 면을 따라 가장 높은 그 방 쪽
  // 날개 지붕 상면, 지붕 없는 마당은 논리 상한(주랑 처마 높이)이다.
  const roofTopAlong = (points: readonly PlanPoint[]): number => Math.max(...points.map((point) => {
    const heights = roof.filter((patch) => patch.tier === "wing" && patch.polygon.every((q, i) =>
      planeHeight(edgeInside(q, patch.polygon[(i + 1) % patch.polygon.length]!), point) >= -1e-9))
      .map((patch) => planeHeight(patch.height, point));
    if (heights.length === 0) throw new Error(`temple/environment: (${point.x}, ${point.z}) 위 날개 지붕을 찾지 못했습니다.`);
    return Math.max(...heights);
  }));
  const along = (from: number, to: number, fixed: number, axis: "x" | "z") => Array.from({ length: 41 }, (_, i) => {
    const s = from + (to - from) * i / 40;
    return axis === "x" ? { x: s, z: fixed } : { x: fixed, z: s };
  });
  const westUpper = roofTopAlong(along(p.northInner, p.sanctuaryFront, p.westRoom - 1e-3, "z"));
  const southUpper = roofTopAlong(along(p.westRing, p.eastRing, p.northRing + 1e-3, "x"));
  const eastUpper = templeRoofRules.courtEave;
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
    boundary("boundary-west-spine.sanctuary", ["offering", "sanctuary"], "wall.boundary-west-spine", [p.northInner, p.sanctuaryFront], { height: westUpper, keep: "below" }),
    boundary("boundary-west-spine.sanctuary-upper", ["sanctuary"], "wall.boundary-west-spine", [p.northInner, p.sanctuaryFront], { height: westUpper, keep: "above" }),
    boundary("boundary-west-spine.colonnade", ["offering", "colonnade"], "wall.boundary-west-spine", [p.northRing, p.southInner]),
    boundary("boundary-east-spine.sanctuary", ["sanctuary", "service-yard"], "wall.boundary-east-spine", [p.northInner, p.sanctuaryFront], { height: eastUpper, keep: "below" }),
    boundary("boundary-east-spine.sanctuary-upper", ["sanctuary"], "wall.boundary-east-spine", [p.northInner, p.sanctuaryFront], { height: eastUpper, keep: "above" }),
    boundary("boundary-east-spine.yard", ["colonnade", "service-yard"], "wall.boundary-east-spine", [p.northRing, p.yardFront]),
    boundary("boundary-east-spine.storage", ["colonnade", "storage"], "wall.boundary-east-spine", [p.storageBack, p.storageFront]),
    boundary("boundary-east-spine.records", ["colonnade", "records"], "wall.boundary-east-spine", [p.recordsBack, p.recordsFront]),
    boundary("boundary-east-spine.administration", ["colonnade", "administration"], "wall.boundary-east-spine", [p.officeBack, p.southInner]),
    boundary("boundary-sanctuary-south", ["sanctuary", "colonnade"], "wall.boundary-sanctuary-south", [p.westRing, p.eastRing], { height: southUpper, keep: "below" }),
    boundary("boundary-sanctuary-south.upper", ["sanctuary"], "wall.boundary-sanctuary-south", [p.westRing, p.eastRing], { height: southUpper, keep: "above" }),
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
    buildings: [{ id: y.building, element: "temple.root", space: y.building }, site.unit],
    models: [...models, ...site.models], modelReferences: [], elements: [...elements, ...site.elements],
    spaces, boundaries, openings, connectors,
    surfaces: [...floors.supports, ...site.supports],
    walkable: [...floors.supports.map((s) => s.surface.id), ...site.walkable],
  };
  const validation = validateBuiltEnvironment({ environment });
  if (!validation.success) {
    throw new Error(`temple/environment: ${validation.violations.map((v) => `${v.path}: ${v.expected}`).join("\n")}`);
  }
  return { environment, walls, roof, wallBottom: bottom, floors, site, trim };
};

/** 차집합으로 새로 만든 지붕 면의 owner는 surface 이름의 roof owner다. */
const ownerOf = (surface: string): string => {
  const owner = surface.split(".")[1]!;
  if (!owner.startsWith("roof-")) throw new Error(`temple/environment: ${surface}의 지붕 owner를 알 수 없습니다.`);
  return owner;
};

/** 외벽·현관 벽에 실제로 맞닿는 바닥 구획의 최저 완성면. */
const exteriorFloorMinimum = (inputs: ReturnType<typeof templeFloorInputs>): number => {
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
