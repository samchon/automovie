/**
 * Room record shape and the two solids every room owner emits: its floor
 * finish and the partitions `07-boundary-assembly.md#interior-boundary-ownership`
 * assigns to it.
 *
 * Heights follow the layer splits: a ground-storey finish fills the top
 * 0.025 m above the support base (`10-ground-floor.md`), an upper-storey finish
 * the top 0.025 m of the interstorey reservation (`08-floor-assembly.md`).
 * A ceiling finish fills the 0.015 m above the finished ceiling (08 for the
 * ground storey, `09-ceiling-assembly.md#upper-ceiling-closure` for the
 * upper). A partition runs from its storey's finished floor to its finished
 * ceiling (`07-boundary-assembly.md#interior-boundary-ownership`); under a
 * door void each room's floor finish reaches the partition mid-plane
 * (`#interior-boundary-junctions`) through `doorFloor`.
 *
 * Consumers: the fifteen `rooms/*.ts` owners. This helper owns no surface.
 */
import { PALETTE } from "../palette";
import { type IHousePart, type IPlanPoint, type IWallHole, part, slab, straightWall } from "../solids";
import { CEILING_FINISH, GROUND_LAYERS, INTERSTOREY_FLOOR_FINISH, type StoreyId, ceilingOf, floorOf } from "../storeys";

/**
 * A plan zone a room reserves for one use, world metres: furniture or a
 * fixture body, a storage body, the floor a person uses in front of them, a
 * clear route, or the sweep of a door, drawer or appliance door. The zone is
 * a spaces decision later instances and observations consume; the object in it
 * is not authored here.
 */
export interface IRoomReservation {
  /** Stable id, unique within the house. */
  id: string;
  kind: "furniture" | "fixture" | "storage" | "use" | "route" | "swing";
  x: readonly [number, number];
  z: readonly [number, number];
  /** World height range of a body or a wall-hung item; absent for a floor area kept clear. */
  y?: readonly [number, number];
}

/** One interior space as its plan owner declares it. */
export interface IRoomSpace {
  /** Space id used by the route table (05) and the storey records (01). */
  id: string;
  /** Source owner path under `src/spaces`. */
  owner: string;
  storey: StoreyId;
  /** Finished inner outline, world X/Z metres, in order. */
  outline: readonly IPlanPoint[];
  /** Base colour of the floor finish (visual-grammar use split). */
  floor: number;
  /**
   * Finished floor and ceiling heights when they differ from the storey's
   * datums (the garage, 01 ground-threshold-datums); absent for every room
   * that stands on its storey's finished floor.
   */
  levels?: readonly [number, number];
  /** The use zones the room design reserves, in the design order. */
  reservations?: readonly IRoomReservation[];
}

/** Whether a plan point lies inside or on a rectilinear outline. */
const inOutline = (outline: readonly IPlanPoint[], x: number, z: number): boolean => {
  const eps = 1e-9;
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const a = outline[i]!;
    const b = outline[j]!;
    const onEdge = (a.x === b.x && Math.abs(x - a.x) < eps && z >= Math.min(a.z, b.z) - eps && z <= Math.max(a.z, b.z) + eps) || (a.z === b.z && Math.abs(z - a.z) < eps && x >= Math.min(a.x, b.x) - eps && x <= Math.max(a.x, b.x) + eps);
    if (onEdge) return true;
    if (a.z > z !== b.z > z && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
};

/**
 * Refuse a room whose reservations leave its outline, or whose clear route
 * crosses a furniture, fixture or storage body. Door and appliance sweeps may
 * cross routes: operating a door and walking through are separate states (05).
 */
export const checkReservations = (room: IRoomSpace): void => {
  const zones = room.reservations ?? [];
  for (const r of zones) {
    if (!(r.x[0] < r.x[1] && r.z[0] < r.z[1])) throw new Error(`${room.owner}: reservation "${r.id}" has an empty plan`);
    const samples = [r.x[0], (r.x[0] + r.x[1]) / 2, r.x[1]].flatMap((x) => [r.z[0], (r.z[0] + r.z[1]) / 2, r.z[1]].map((z) => [x, z] as const));
    if (samples.some(([x, z]) => !inOutline(room.outline, x, z))) throw new Error(`${room.owner}: reservation "${r.id}" leaves room "${room.id}"`);
  }
  const bodies = zones.filter((r) => r.kind === "furniture" || r.kind === "fixture" || r.kind === "storage");
  for (const route of zones.filter((r) => r.kind === "route"))
    for (const b of bodies)
      if (route.x[0] < b.x[1] - 1e-9 && b.x[0] < route.x[1] - 1e-9 && route.z[0] < b.z[1] - 1e-9 && b.z[0] < route.z[1] - 1e-9)
        throw new Error(`${room.owner}: route "${route.id}" crosses "${b.id}"`);
};

/** Finished floor and ceiling heights of a room. */
export const roomLevels = (room: IRoomSpace): readonly [number, number] => room.levels ?? [floorOf(room.storey), ceilingOf(room.storey)];

/**
 * A closed storage volume a room owns and uses through a real opening (coat
 * closet, linen closet): a logical space of its own, never a route node.
 */
export interface IStorageSpace {
  id: string;
  /** World box of the usable interior, metres. */
  x: readonly [number, number];
  y: readonly [number, number];
  z: readonly [number, number];
}

/** What one room owner emits: its space record and the solids it owns. */
export interface IRoomBuild {
  /** The room's space record, consumed by the route table and observations. */
  space: IRoomSpace;
  /** Floor finish, partitions and other solids this room owns. */
  parts: IHousePart[];
  /** Storage volumes this room owns, if any. */
  storages?: IStorageSpace[];
}

/** Depth of the floor finish bundle below a storey's finished floor. */
const finishDepth = (storey: StoreyId): number => (storey === "ground-storey" ? GROUND_LAYERS.finish : INTERSTOREY_FLOOR_FINISH);

/** Floor finish of one room: its outline over the top finish layer. */
export const roomFloor = (room: IRoomSpace): IHousePart => {
  const top = floorOf(room.storey);
  return part(`${room.id}-floor`, room.owner, "floor", room.floor, slab({ outline: room.outline, bottom: top - finishDepth(room.storey), top }));
};

/**
 * The room's share of the floor finish under one interior door void: the
 * rectangle from the room's partition face to the partition mid-plane across
 * the door width, in the room's finish layer.
 */
export const doorFloor = (room: IRoomSpace, doorId: string, x: readonly [number, number], z: readonly [number, number]): IHousePart => {
  const top = floorOf(room.storey);
  return part(`${room.id}-${doorId}-floor`, room.owner, "floor", room.floor, slab({ outline: box(x, z), bottom: top - finishDepth(room.storey), top }));
};

/**
 * Visible ceiling finish of one room: its outline over the 0.015 m above its
 * storey's finished ceiling, under the interstorey structure (ground) or the
 * upper ceiling base (upper).
 */
export const roomCeiling = (room: IRoomSpace): IHousePart => {
  const [, bottom] = roomLevels(room);
  return part(`${room.id}-ceiling`, room.owner, "ceiling", PALETTE.ceiling, slab({ outline: room.outline, bottom, top: bottom + CEILING_FINISH }));
};

/** Height range of a full-height partition on a storey: finished floor to finished ceiling. */
export const partitionSpan = (storey: StoreyId): readonly [number, number] => [floorOf(storey), ceilingOf(storey)];

/**
 * A straight 0.15 m interior partition with its door voids.
 *
 * `axis` is the world axis the wall runs along, `across` its thickness range,
 * `along` its length range. Door holes are given in the same `along`
 * coordinate with world heights.
 */
export const partition = (props: {
  id: string;
  owner: string;
  storey: StoreyId;
  axis: "x" | "z";
  across: readonly [number, number];
  along: readonly [number, number];
  holes?: readonly IWallHole[];
}): IHousePart => {
  const [bottom, top] = partitionSpan(props.storey);
  return part(
    props.id,
    props.owner,
    "partition",
    PALETTE.interiorWall,
    straightWall({ axis: props.axis, across: props.across, along: props.along, bottom, top, holes: props.holes }),
  );
};

/** A door void of standard head 2.20 m above the storey floor. */
export const door = (id: string, storey: StoreyId, from: number, to: number, head = 2.2): IWallHole => ({
  id,
  from,
  to,
  bottom: floorOf(storey),
  top: floorOf(storey) + head,
});

/** Plan rectangle helper for room outlines. */
export const box = (x: readonly [number, number], z: readonly [number, number]): IPlanPoint[] => [
  { x: x[0], z: z[0] },
  { x: x[1], z: z[0] },
  { x: x[1], z: z[1] },
  { x: x[0], z: z[1] },
];
