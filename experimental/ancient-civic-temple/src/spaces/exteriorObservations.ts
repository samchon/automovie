import type { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import { templeViewerLens } from "../geometry/templeViewerLens";
import { builtEnvironmentBuildingCensus } from "@automovie/engine";
import { templeObservationEye as eye } from "../geometry/templeObservationEye";
import { templeExteriorSettingView } from "../geometry/templeExteriorSettingView";
import { templePlan as p } from "./templePlan";
import { templeRoofRules } from "./roofs/templeRoofRules";
import type { TempleObservation } from "./TempleObservation";

/** Distance in meters at which width fills about 78% of the shared comparison frame. */
const fitDistance = (width: number): number => (width / 0.78) / 2 / (Math.tan(templeViewerLens.halfVerticalRadians) * templeViewerLens.aspect);
/** Orient the face normal outward, flipping it if the point 0.5 m ahead is inside the space. */
const outwardNormal = (
  environment: IAutoMovieBuiltEnvironment, space: string, at: IAutoMovieVector3, normal: IAutoMovieVector3
): IAutoMovieVector3 => {
  const probe = { x: at.x + normal.x * 0.5, y: 1.2, z: at.z + normal.z * 0.5 };
  const inside = environment.spaces.find((s) => s.id === space)?.cells.some((cell) => cell.planes.every((plane) => plane.normal.x * probe.x + plane.normal.y * probe.y + plane.normal.z * probe.z <= plane.offset)) ?? false;
  const length = Math.hypot(normal.x, normal.z) || 1;
  const sign = inside ? -1 : 1;
  return { x: sign * normal.x / length, y: 0, z: sign * normal.z / length };
};
export const exteriorObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  const census = builtEnvironmentBuildingCensus(environment)[0];
  const center = { x: 0, y: 2.2, z: 0 };
  const out: TempleObservation[] = [{
    id: "exterior.setting", group: "exterior", space: null, role: "setting", label: "Exterior setting · front-left overhead",
    position: templeExteriorSettingView.position, target: templeExteriorSettingView.target, note: null,
  }];
  for (const face of census?.facades ?? []) {
    const width = Math.max(...face.vertices.map((v) => Math.hypot(v.x - face.centroid.x, v.z - face.centroid.z))) * 2;
    const outward = outwardNormal(environment, face.space, face.centroid, face.normal);
    // View raised exterior-facing boundaries above roofs or yards from above the face at the same fit distance.
    const elevated = face.centroid.y > templeRoofRules.courtEave;
    const distance = Math.max(4, fitDistance(Math.max(width, 3)));
    // The free front ends of the two porch returns face the open porch. Their opposite
    // sides meet the south-wing wall, so an outward offset would bury the camera there.
    const porchFront = face.boundary.startsWith("boundary-entrance-return-") && face.boundary.endsWith(".front");
    const returnOuterUpper = face.boundary.startsWith("boundary-entrance-return-") && face.boundary.endsWith(".outer-upper");
    const entryEndUpper = /^boundary-entry\.(west|east)-end\.upper$/.test(face.boundary);
    const entrySideUpper = /^boundary-entry\.(west|east)-side\.upper$/.test(face.boundary);
    const entryEndLower = /^boundary-entry\.(west|east)-end$/.test(face.boundary);
    const entrySideLower = /^boundary-entry\.(west|east)-side$/.test(face.boundary);
    const streetEnd = /^boundary-entrance-return-(west|east)\.street-end$/.test(face.boundary);
    const pedimentFront = face.boundary === "boundary-porch-pediment.front";
    const pedimentBack = face.boundary === "boundary-porch-pediment.back";
    const returnSide = face.boundary.includes("west") ? -1 : 1;
    out.push({
      id: `exterior.facade.${face.boundary}`, group: "exterior", space: null, role: "facade",
      label: `Facade · ${face.boundary}`,
      position: porchFront ? {
        x: (p.westPorchInner + p.eastPorchInner) / 2, y: 3.0, z: p.southOuter + 4,
      } : returnOuterUpper ? {
        x: returnSide * 5.0, y: 6.0, z: face.centroid.z,
      } : entryEndUpper ? {
        x: face.centroid.x, y: 5.7, z: p.entranceBack - 4,
      } : entrySideUpper ? {
        x: returnSide * 5.0, y: 5.8, z: p.entranceBack - 2,
      } : entryEndLower ? {
        x: face.centroid.x, y: eye, z: (p.courtBack + p.courtFront) / 2,
      } : entrySideLower ? {
        x: returnSide * 4.2, y: 1.4, z: (p.entranceBack + p.entranceFront) / 2,
      } : streetEnd ? {
        x: face.centroid.x, y: 2.6, z: p.southOuter + 4,
      } : pedimentFront ? {
        x: 0, y: 4.8, z: p.southOuter + 4,
      } : pedimentBack ? {
        x: 0, y: 3.3, z: p.southInner - templeRoofRules.overhang,
      } : {
        x: face.centroid.x + outward.x * distance, y: elevated ? face.centroid.y + 0.8 : eye + 0.6,
        z: face.centroid.z + outward.z * distance,
      },
      target: { ...face.centroid, y: Math.max(1.2, face.centroid.y) }, note: null,
    });
  }
  for (const [id, x, z, text] of [
    ["northwest", p.westOuter, p.northOuter, "northwest"], ["northeast", p.eastOuter, p.northOuter, "northeast"],
    ["southwest", p.westOuter, p.southOuter, "southwest"], ["southeast", p.eastOuter, p.southOuter, "southeast"],
  ] as const) {
    const d = Math.hypot(x, z);
    out.push({
      id: `exterior.corner.${id}`, group: "exterior", space: null, role: "corner", label: `Exterior corner · ${text}`,
      position: { x: x + x / d * 15, y: 3, z: z + z / d * 15 }, target: { x, y: 2, z }, note: null,
    });
  }
  for (const [id, x, z, text] of [
    ["north", 0, -1, "north"], ["east", 1, 0, "east"], ["south", 0, 1, "south"], ["west", -1, 0, "west"],
  ] as const) {
    out.push({
      id: `exterior.roof.${id}`, group: "exterior", space: null, role: "roof", label: `Roof · ${text} overhead`,
      position: { x: x * 24, y: 17, z: z * 24 }, target: center, note: null,
    });
    const edge = id === "north" ? p.northOuter : id === "south" ? p.southOuter : id === "east" ? p.eastOuter : p.westOuter;
    const along = Math.abs(x) > 0 ? { x: edge + x * 3.2, z: 0 } : { x: 0, z: edge + z * 3.2 };
    out.push({
      id: `exterior.underside.${id}`, group: "exterior", space: null, role: "underside", label: `Eave underside · ${text}`,
      position: { x: along.x + (Math.abs(x) > 0 ? 0 : -6), y: eye, z: along.z + (Math.abs(z) > 0 ? 0 : 6) },
      target: { x: Math.abs(x) > 0 ? edge : 2, y: 3.3, z: Math.abs(z) > 0 ? edge : -2 }, note: null,
    });
  }
  for (const opening of environment.openings) {
    const boundary = environment.boundaries.find((b) => b.id === opening.boundary);
    const face = boundary?.face;
    if (boundary === undefined || face === undefined || boundary.spaces.length !== 1) continue;
    const xs = opening.profile?.outline.map((q) => q.x) ?? [0];
    const ys = opening.profile?.outline.map((q) => q.y) ?? [0];
    const u = (Math.min(...xs) + Math.max(...xs)) / 2;
    const v = (Math.min(...ys) + Math.max(...ys)) / 2;
    const alongZ = Math.abs(face.rotation.y) > 1e-6;
    const mouth = alongZ ? { x: face.origin.x, y: v, z: u } : { x: u, y: v, z: face.origin.z };
    const outward = outwardNormal(environment, boundary.spaces[0]!, mouth, alongZ ? { x: 1, y: 0, z: 0 } : { x: 0, y: 0, z: 1 });
    out.push({
      id: `exterior.opening.${opening.id}`, group: "exterior", space: null, role: "opening", label: `Exterior opening · ${opening.id}`,
      // View high windows above roofs or yards from nearby outside, slightly above the window.
      position: v > templeRoofRules.courtEave
        ? { x: mouth.x + outward.x * 2.5, y: v + 0.6, z: mouth.z + outward.z * 2.5 }
        : { x: mouth.x + outward.x * 7, y: Math.max(eye, v - 0.8), z: mouth.z + outward.z * 7 },
      target: mouth, note: null,
    });
  }
  const entry = environment.openings.find((o) => o.id === "door-entry");
  if (entry !== undefined) {
    out.push({
      id: "exterior.opening.door-entry", group: "exterior", space: null, role: "opening", label: "Exterior opening · door-entry (entry axis)",
      position: { x: 0, y: eye, z: p.southOuter + 7 }, target: { x: 0, y: 1.4, z: p.entranceBack }, note: null,
    });
  }
  return out;
};
