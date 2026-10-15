
import { validateBuiltEnvironment } from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMovieBoundaryFace, IAutoMovieBuiltBoundary,
  IAutoMovieBuiltElement, IAutoMovieBuiltEnvironment, IAutoMovieBuiltOpening, IAutoMovieModel,
} from "@automovie/interface";
import { createTempleFloors } from "../createTempleFloors";
import { templeFloorInputs } from "../templeFloorInputs";
import { surfaceModel } from "../geometry/surfaceModel";
import { identityTransform } from "../geometry/identityTransform";
import { edgeInside } from "../geometry/edgeInside";
import { planeHeight } from "../geometry/planeHeight";
import { rectanglePolygon } from "../geometry/rectanglePolygon";
import { type PlanPoint } from "../geometry/PlanPoint";
import { cullCoincidentVerticalFaces } from "../geometry/cullCoincidentVerticalFaces";
import { roofSlabFaces } from "../geometry/roofSlabFaces";
import { roofStepClosures } from "../geometry/roofStepClosures";
import { type UndersideRegion } from "../geometry/UndersideRegion";
import { wallFaces } from "../geometry/wallFaces";
import { wallHostOutline } from "../geometry/wallHostOutline";
import { clipOutlineAtLine } from "../geometry/clipOutlineAtLine";
import { clipOutlineAtHeight } from "../geometry/clipOutlineAtHeight";
import { type WallSpec } from "../geometry/WallSpec";
import { type WallTrimInput } from "../geometry/WallTrimInput";
import { plinthFaces } from "../geometry/plinthFaces";
import { copingFaces } from "../geometry/copingFaces";
import { templeInteriorWalls } from "./templeInteriorWalls";
import { templeConnectors } from "./templeConnectors";
import { templePlan as p } from "./templePlan";
import { templeSpaceHierarchy } from "./templeSpaceHierarchy";
import { templeEastWalls } from "./facades/templeEastWalls";
import { templeNorthWalls } from "./facades/templeNorthWalls";
import { templeSouthWalls } from "./facades/templeSouthWalls";
import { templePlinthRise } from "./facades/templePlinthRise";
import { templeWallTrim } from "./templeWallTrim";
import { templeDadoFaces } from "./templeDadoFaces";
import { templeWestWalls } from "./facades/templeWestWalls";
import { templeClerestories } from "./templeClerestories";
import { templeDoorProfile } from "./templeDoorProfile";
import { templeDoorPassages } from "./templeDoorPassages";
import { templeRoofEnvelope } from "./roofs/templeRoofEnvelope";
import { templeRoofRules } from "./roofs/templeRoofRules";
import { templeAdministration } from "./rooms/templeAdministration";
import { templeAdministrationCeiling } from "./rooms/templeAdministrationCeiling";
import { templeAdministrationPlan } from "./rooms/templeAdministrationPlan";
import { templeColonnade } from "./rooms/templeColonnade";
import { templeColonnadeRegions } from "./rooms/templeColonnadeRegions";
import { templeCourtyard } from "./rooms/templeCourtyard";
import { templeEntrance } from "./rooms/templeEntrance";
import { templeOffering } from "./rooms/templeOffering";
import { templeOfferingCeiling } from "./rooms/templeOfferingCeiling";
import { templeOfferingPlan } from "./rooms/templeOfferingPlan";
import { templeRecords } from "./rooms/templeRecords";
import { templeRecordsCeiling } from "./rooms/templeRecordsCeiling";
import { templeRecordsPlan } from "./rooms/templeRecordsPlan";
import { templeSanctuary } from "./rooms/templeSanctuary";
import { templeSanctuaryPlan } from "./rooms/templeSanctuaryPlan";
import { templeServiceYard } from "./rooms/templeServiceYard";
import { createTempleSite } from "./site/createTempleSite";
import { templeSiteContactMinimum } from "./site/templeSiteContactMinimum";
import { templeSiteGradePlane } from "./site/templeSiteGradePlane";
import { templeSiteGradeBreaks } from "./site/templeSiteGradeBreaks";
import { templeStorage } from "./rooms/templeStorage";
import { templeStorageCeiling } from "./rooms/templeStorageCeiling";
import { templeStoragePlan } from "./rooms/templeStoragePlan";
import { templeWallBottom } from "./templeWallBottom";
import { templeLevels as y } from "./templeLevels";
/**
 * Build the temple's built environment from the space owners: roof envelope, site, floors, walls
 * with their openings, spaces, boundaries and surfaces. Returns the environment with the walls,
 * roof, wall bottom, floors, site and trim inputs it was built from.
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
  // A step closure is one sheet whose back stays exposed. After culling, add a
  // back facing the pocket under the higher patch: room ceiling or eave soffit,
  // preventing an interior view through to the exterior.
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
  type Band = { height: number; keep: "below" | "above" } | { slope: number; constant: number; keep: "below" | "above" };
  const face = (w: WallSpec, from: number, to: number, band?: Band): IAutoMovieBoundaryFace => {
    const perpendicular = w.plan.map((q) => w.axis === "x" ? q.z : q.x);
    const low = Math.min(...perpendicular);
    const high = Math.max(...perpendicular);
    const mid = (low + high) / 2;
    return {
      origin: w.axis === "x" ? { x: 0, y: 0, z: mid } : { x: mid, y: 0, z: 0 },
      rotation: w.axis === "x" ? { x: 0, y: 0, z: 0, w: 1 } : { x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
      outline: band === undefined ? wallHostOutline(w, roof, from, to, mid)
        : "height" in band ? clipOutlineAtHeight(wallHostOutline(w, roof, from, to, mid), band.height, band.keep)
          : clipOutlineAtLine(wallHostOutline(w, roof, from, to, mid), band.slope, band.constant, band.keep),
      thickness: high - low,
    };
  };
  const boundary = (
    id: string, spaceIds: string[], wallId: string, host: [number, number],
    band?: Band,
  ): IAutoMovieBuiltBoundary => ({
    id, kind: wallId.startsWith("wall.boundary") ? "interior-wall" : "exterior-wall",
    spaces: spaceIds, elements: [`element.${wallId}`], face: face(wall(wallId), host[0], host[1], band),
  });
  // Split six level hosts and two
  // return walls exposed by local slopes; a distant roof maximum must not hide local bands.
  const roofTopAlong = (points: readonly PlanPoint[]): number => Math.max(...points.map((point) => {
    const heights = roof.filter((patch) => patch.tier === "wing" && patch.polygon.every((q, i) =>
      planeHeight(edgeInside(q, patch.polygon[(i + 1) % patch.polygon.length]!), point) >= -1e-9))
      .map((patch) => planeHeight(patch.height, point));
    if (heights.length === 0) throw new Error(`temple/environment: no wing roof above (${point.x}, ${point.z}).`);
    return Math.max(...heights);
  }));
  const along = (from: number, to: number, fixed: number, axis: "x" | "z") => Array.from({ length: 41 }, (_, i) => {
    const s = from + (to - from) * i / 40;
    return axis === "x" ? { x: s, z: fixed } : { x: fixed, z: s };
  });
  const westUpper = roofTopAlong(along(p.northInner, p.sanctuaryFront, p.westRoom - 1e-3, "z"));
  const southUpper = roofTopAlong(along(p.westRing, p.eastRing, p.northRing + 1e-3, "x"));
  const eastUpper = templeRoofRules.courtEave;
  const entryUpper = roofTopAlong(along(p.westPorchOuter, p.eastPorchOuter, p.entranceBack - 1e-3, "x"));
  const entrySideUpper = roofTopAlong(along(p.entranceBack, p.entranceFront, p.westPorchOuter - 1e-3, "z"));
  const entryWall = wall("wall.facade-south.entry-back");
  const entryOutline = wallHostOutline(entryWall, roof, p.westPorchOuter, p.eastPorchOuter, p.entranceBack);
  const entryBottom = Math.min(...entryOutline.map((point) => point.y));
  const entryTop = Math.max(...entryOutline.map((point) => point.y));
  const entrySide = (side: "west" | "east", keep: "below" | "above"): IAutoMovieBuiltBoundary => {
    const west = side === "west";
    const u0 = west ? p.entranceBack : -p.entranceFront;
    const u1 = west ? p.entranceFront : -p.entranceBack;
    const outline = [
      { x: u0, y: entryBottom }, { x: u1, y: entryBottom },
      { x: u1, y: entryTop }, { x: u0, y: entryTop },
    ];
    return {
      id: `boundary-entry.${side}-side${keep === "above" ? ".upper" : ""}`,
      kind: "exterior-wall", spaces: ["colonnade"], elements: ["element.wall.facade-south.entry-back"],
      face: {
        origin: { x: west ? (p.westPorchOuter + p.westPorchInner) / 2 : (p.eastPorchOuter + p.eastPorchInner) / 2, y: 0, z: 0 },
        rotation: { x: 0, y: west ? -Math.SQRT1_2 : Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
        outline: clipOutlineAtHeight(outline, entrySideUpper, keep),
        thickness: p.eastPorchOuter - p.eastPorchInner,
      },
    };
  };
  const returnStreetEnd = (side: "west" | "east"): IAutoMovieBuiltBoundary => {
    const west = side === "west";
    const wallId = `wall.facade-south.return-${side}`;
    const segment = wallHostOutline(wall(wallId), roof, p.southInner, p.southOuter,
      west ? p.westPorch : p.eastPorch);
    const bottom = Math.min(...segment.map((point) => point.y));
    const top = Math.max(...segment.map((point) => point.y));
    const x0 = west ? p.westPorchOuter : p.eastPorchInner;
    const x1 = west ? p.westPorchInner : p.eastPorchOuter;
    return {
      id: `boundary-entrance-return-${side}.street-end`, kind: "exterior-wall",
      spaces: ["entrance"], elements: [`element.${wallId}`],
      face: {
        origin: { x: 0, y: 0, z: (p.entranceFront + p.southOuter) / 2 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        outline: [{ x: x0, y: bottom }, { x: x1, y: bottom },
          { x: x1, y: top }, { x: x0, y: top }],
        thickness: p.southOuter - p.entranceFront,
      },
    };
  };
  const pedimentFront = face(wall("wall.facade-south.pediment"), p.westPorchInner, p.eastPorchInner);
  const pedimentBack: IAutoMovieBoundaryFace = {
    ...pedimentFront,
    rotation: { x: 0, y: 1, z: 0, w: 0 },
    outline: pedimentFront.outline.map((point) => ({ x: -point.x, y: point.y })),
  };
  // At the two return walls the south canopy rises along Z. Its local roof top is lower
  // than the adjacent porch volume near entrance-front, even though its maximum is higher.
  const returnProbe = { x: p.eastPorchInner - 0.08, z: p.entranceFront + 0.05 };
  const porchAtReturn = roof.filter((patch) => patch.tier === "porch" && patch.polygon.every((q, i) =>
    planeHeight(edgeInside(q, patch.polygon[(i + 1) % patch.polygon.length]!), returnProbe) >= -1e-9));
  if (porchAtReturn.length !== 1) throw new Error("temple/environment: no unique porch roof inside the return wall.");
  const entranceCapAtReturn = planeHeight(porchAtReturn[0]!.height, returnProbe) - porchAtReturn[0]!.thickness;
  const returnSlope = Math.tan(templeRoofRules.leanSlope);
  const returnConstant = templeRoofRules.courtEave - returnSlope * p.courtFront;
  const returnCrossing = (entranceCapAtReturn - returnConstant) / returnSlope;
  if (!(returnCrossing > p.entranceFront && returnCrossing < p.southInner)) {
    throw new Error(`temple/environment: return-wall roof crossing ${returnCrossing}m is outside the entrance interval.`);
  }
  const returnBand = (keep: "below" | "above"): Band => ({ slope: returnSlope, constant: returnConstant, keep });
  const returnBoundaries = ([
    ["west", "wall.facade-south.return-west"], ["east", "wall.facade-south.return-east"],
  ] as const).flatMap(([side, wallId]) => [
    boundary(`boundary-entrance-return-${side}`, ["entrance", "colonnade"], wallId,
      [p.entranceFront, returnCrossing], returnBand("below")),
    boundary(`boundary-entrance-return-${side}.upper`, ["entrance"], wallId,
      [p.entranceFront, returnCrossing], returnBand("above")),
    boundary(`boundary-entrance-return-${side}.outer`, ["entrance", "colonnade"], wallId,
      [returnCrossing, p.southInner], { height: entranceCapAtReturn, keep: "below" }),
    boundary(`boundary-entrance-return-${side}.outer-upper`, ["colonnade"], wallId,
      [returnCrossing, p.southInner], { height: entranceCapAtReturn, keep: "above" }),
    boundary(`boundary-entrance-return-${side}.front`, ["entrance"], wallId,
      [p.southInner, p.southOuter]),
  ]);
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
    boundary("boundary-entry", ["entrance", "colonnade"], "wall.facade-south.entry-back", [p.westPorchInner, p.eastPorchInner], { height: entryUpper, keep: "below" }),
    boundary("boundary-entry.upper", ["entrance"], "wall.facade-south.entry-back", [p.westPorchInner, p.eastPorchInner], { height: entryUpper, keep: "above" }),
    boundary("boundary-entry.west-end", ["colonnade"], "wall.facade-south.entry-back", [p.westPorchOuter, p.westPorchInner], { height: entryUpper, keep: "below" }),
    boundary("boundary-entry.west-end.upper", ["colonnade"], "wall.facade-south.entry-back", [p.westPorchOuter, p.westPorchInner], { height: entryUpper, keep: "above" }),
    boundary("boundary-entry.east-end", ["colonnade"], "wall.facade-south.entry-back", [p.eastPorchInner, p.eastPorchOuter], { height: entryUpper, keep: "below" }),
    boundary("boundary-entry.east-end.upper", ["colonnade"], "wall.facade-south.entry-back", [p.eastPorchInner, p.eastPorchOuter], { height: entryUpper, keep: "above" }),
    entrySide("west", "below"), entrySide("west", "above"),
    entrySide("east", "below"), entrySide("east", "above"),
    ...returnBoundaries,
    returnStreetEnd("west"), returnStreetEnd("east"),
    { id: "boundary-porch-pediment.front", kind: "exterior-wall", spaces: ["entrance"],
      elements: ["element.wall.facade-south.pediment"], face: pedimentFront },
    { id: "boundary-porch-pediment.back", kind: "exterior-wall", spaces: ["entrance"],
      elements: ["element.wall.facade-south.pediment"], face: pedimentBack },
    boundary("boundary-west-spine.sanctuary", ["offering", "sanctuary"], "wall.boundary-west-spine", [p.northInner, p.sanctuaryFront], { height: westUpper, keep: "below" }),
    boundary("boundary-west-spine.sanctuary-upper", ["sanctuary"], "wall.boundary-west-spine", [p.northInner, p.sanctuaryFront], { height: westUpper, keep: "above" }),
    boundary("boundary-west-spine.colonnade", ["offering", "colonnade"], "wall.boundary-west-spine", [p.northRing, p.southInner]),
    boundary("boundary-east-spine.sanctuary", ["sanctuary", "service-yard"], "wall.boundary-east-spine", [p.northInner, p.sanctuaryFront], { height: eastUpper, keep: "below" }),
    boundary("boundary-east-spine.sanctuary-upper", ["sanctuary"], "wall.boundary-east-spine", [p.northInner, p.sanctuaryFront], { height: eastUpper, keep: "above" }),
    boundary("boundary-east-spine.yard", ["colonnade", "service-yard"], "wall.boundary-east-spine", [p.northRing, p.yardFront], { height: eastUpper, keep: "below" }),
    boundary("boundary-east-spine.yard-upper", ["colonnade"], "wall.boundary-east-spine", [p.northRing, p.yardFront], { height: eastUpper, keep: "above" }),
    boundary("boundary-east-spine.storage", ["colonnade", "storage"], "wall.boundary-east-spine", [p.storageBack, p.storageFront]),
    boundary("boundary-east-spine.records", ["colonnade", "records"], "wall.boundary-east-spine", [p.recordsBack, p.recordsFront]),
    boundary("boundary-east-spine.administration", ["colonnade", "administration"], "wall.boundary-east-spine", [p.officeBack, p.southInner]),
    boundary("boundary-sanctuary-south", ["sanctuary", "colonnade"], "wall.boundary-sanctuary-south", [p.westRing, p.eastRing], { height: southUpper, keep: "below" }),
    boundary("boundary-sanctuary-south.upper", ["sanctuary"], "wall.boundary-sanctuary-south", [p.westRing, p.eastRing], { height: southUpper, keep: "above" }),
    boundary("boundary-yard-storage", ["service-yard", "storage"], "wall.boundary-yard-storage", [p.eastRoom, p.eastInner], { height: eastUpper, keep: "below" }),
    boundary("boundary-yard-storage.upper", ["storage"], "wall.boundary-yard-storage", [p.eastRoom, p.eastInner], { height: eastUpper, keep: "above" }),
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

/** Newly subtracted roof faces belong to the roof owner encoded in the surface name. */
const ownerOf = (surface: string): string => {
  const owner = surface.split(".")[1]!;
  if (!owner.startsWith("roof-")) throw new Error(`temple/environment: cannot identify the roof owner of ${surface}.`);
  return owner;
};

/** Minimum finished height of floor compartments actually touching exterior or entrance walls. */
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
  if (touching.length === 0) throw new Error("temple/environment: no floor touches an exterior wall.");
  return Math.min(...touching.map((slab) => slab.floor));
};
