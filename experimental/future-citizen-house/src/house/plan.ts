/** Metric, right-handed Y-up design inputs from spaces/002. Consumers derive
 * cuts, floor pieces and routes from these same values; no viewer plan exists. */
export const datum = { minX: -5.5, maxX: 5.5, minZ: -6, maxZ: 6,
  innerX: 5.26, innerZ: 5.76, outerWall: 0.24, wall: 0.18,
  floors: [0, 3.2], ceilings: [2.9, 6.1], roof: 6.4 } as const;
export type Rect = readonly [number, number, number, number];
export type Room = { id: string; level: 0 | 1; cells: readonly Rect[]; finish: string };
export const rooms: readonly Room[] = [
  { id: "entry", level: 0, cells: [[-2.84, 2.84, -5.76, -0.32]], finish: "plaster" },
  { id: "flex-workroom", level: 0, cells: [[3.02, 5.26, -5.76, -0.32]], finish: "felt" },
  { id: "common-room", level: 0, cells: [[-5.26, 5.26, -0.14, 5.76]], finish: "plaster" },
  { id: "powder-utility", level: 0, cells: [[-5.26, -3.02, -5.76, -2.24]], finish: "tile" },
  { id: "storage-1f", level: 0, cells: [[-5.26, -3.02, -2.06, -0.32]], finish: "plaster" },
  { id: "upper-corridor", level: 1, cells: [[-2.84, 0.12, -1.8, 2.4]], finish: "plaster" },
  { id: "primary-bedroom", level: 1, cells: [[-2.84, 5.26, 2.58, 5.76]], finish: "plaster" },
  { id: "child-bedroom-1", level: 1, cells: [[1.76, 5.26, -5.76, -0.32], [0.3, 1.76, -1.62, -0.32]], finish: "plaster" },
  { id: "child-bedroom-2", level: 1, cells: [[0.3, 5.26, -0.14, 2.4]], finish: "plaster" },
  { id: "upper-bathroom", level: 1, cells: [[-5.26, -3.02, 1.28, 5.76]], finish: "tile" },
  { id: "upper-storage", level: 1, cells: [[-5.26, -3.02, -0.14, 1.1]], finish: "plaster" },
  { id: "upper-service", level: 1, cells: [[-5.26, -1.42, -5.76, -1.98], [-5.26, -3.02, -1.98, -0.32]], finish: "plaster" },
];
export const stairHole: Rect = [-1.24, 1.58, -5.64, -1.8];
/** The front entry approach band (spaces/001#site-access): x=1.30..2.90. */
export const entryApproach: [number, number] = [1.30, 2.90];
/** The four exterior wall strips between the outline and the inner clear face;
 * the long front/rear strips carry the corner squares. */
export const exteriorWallZone = (): [string, Rect][] => [
  ["front", [datum.minX, datum.maxX, datum.minZ, -datum.innerZ]], ["rear", [datum.minX, datum.maxX, datum.innerZ, datum.maxZ]],
  ["left", [datum.innerX, datum.maxX, -datum.innerZ, datum.innerZ]], ["right", [datum.minX, -datum.innerX, -datum.innerZ, datum.innerZ]]];
export type Wall = { id: string; axis: "x" | "z"; plane: number; a: number; b: number; level: 0 | 1; adjacent: string[] };
export type Portal = { id: string; wall: string; from: string; to: string; center: number; width: number; height: number; pocket?: boolean; passage?: boolean };
export const portals: readonly Portal[] = [
  { id: "front-entry", wall: "front-face", from: "citizen-site", to: "entry", center: 2.22, width: 1.05, height: 2.3 },
  { id: "entry-flex", wall: "wall-entry-flex", from: "entry", to: "flex-workroom", center: -1.1, width: 1.2, height: 2.2, pocket: true },
  { id: "entry-common", wall: "wall-entry-common", from: "entry", to: "common-room", center: 2.05, width: 1.3, height: 2.2, passage: true },
  { id: "entry-powder", wall: "wall-entry-powder", from: "entry", to: "powder-utility", center: -3.2, width: 0.9, height: 2.2 },
  { id: "common-storage", wall: "wall-common-storage", from: "common-room", to: "storage-1f", center: -4.14, width: 0.9, height: 2.2 },
  { id: "corridor-primary", wall: "wall-corridor-primary", from: "upper-corridor", to: "primary-bedroom", center: -0.58, width: 0.9, height: 2.2 },
  { id: "corridor-child-one", wall: "wall-corridor-child-one", from: "upper-corridor", to: "child-bedroom-1", center: -0.95, width: 0.9, height: 2.2 },
  { id: "corridor-child-two", wall: "wall-corridor-child-two", from: "upper-corridor", to: "child-bedroom-2", center: 1.05, width: 0.9, height: 2.2 },
  { id: "corridor-bathroom", wall: "wall-corridor-bathroom", from: "upper-corridor", to: "upper-bathroom", center: 1.86, width: 0.9, height: 2.2 },
  { id: "corridor-storage", wall: "wall-corridor-storage", from: "upper-corridor", to: "upper-storage", center: 0.48, width: 0.9, height: 2.2 },
  { id: "corridor-service", wall: "wall-corridor-service", from: "upper-corridor", to: "upper-service", center: -0.95, width: 0.9, height: 2.2 },
];
export const roomById = (id: string): Room => {
  const room = rooms.find((candidate) => candidate.id === id);
  if (!room) throw new Error("Unknown room " + id);
  return room;
};
/** Shared walls use the overlap of opposing clear faces, including L-cell seams. */
export function sharedWalls(): Wall[] {
  const walls: Wall[] = [];
  for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) {
    const left = rooms[i], right = rooms[j];
    if (left.level !== right.level) continue;
    for (const a of left.cells) for (const b of right.cells) {
      for (const axis of ["x", "z"] as const) {
        const lo = axis === "x" ? 0 : 2, cross = axis === "x" ? 2 : 0;
        const forward = Math.abs(b[lo] - a[lo + 1] - datum.wall) < 1e-7;
        const reverse = Math.abs(a[lo] - b[lo + 1] - datum.wall) < 1e-7;
        const start = Math.max(a[cross], b[cross]), end = Math.min(a[cross + 1], b[cross + 1]);
        if ((!forward && !reverse) || end - start < 1e-7) continue;
        const portal = portals.find((p) => [p.from, p.to].includes(left.id) && [p.from, p.to].includes(right.id));
        const fits = portal && portal.center - portal.width / 2 - 0.06 >= start - 1e-7 && portal.center + portal.width / 2 + 0.06 <= end + 1e-7;
        const pair = [left.id, right.id].sort((a, b) => a.localeCompare(b)).join("/");
        const names: Record<string, string> = { "powder-utility/storage-1f": "wall-powder-storage", "common-room/flex-workroom": "wall-flex-common", "child-bedroom-1/child-bedroom-2": "wall-child-one-two", "child-bedroom-2/primary-bedroom": "wall-child-two-primary", "upper-service/upper-storage": "wall-service-storage", "upper-bathroom/upper-storage": "wall-storage-bath", "primary-bedroom/upper-bathroom": "wall-bath-primary", "upper-corridor/upper-service": "wall-service-corridor-front", "entry/storage-1f": "wall-entry-storage" };
        const id = fits ? portal.wall : names[pair] ?? "wall-" + pair.replace("/", "-");
        const plane = forward ? (a[lo + 1] + b[lo]) / 2 : (b[lo + 1] + a[lo]) / 2;
        const prior = walls.find((w) => w.id === id && w.axis === axis && Math.abs(w.plane - plane) < 1e-7 && start <= w.b + 1e-7 && end >= w.a - 1e-7);
        if (prior) { prior.a = Math.min(prior.a, start); prior.b = Math.max(prior.b, end); }
        else walls.push({ id, axis, plane, a: start, b: end, level: left.level, adjacent: [left.id, right.id] });
      }
    }
  }
  return walls;
}
