/**
 * Room record shape and the two solids every room owner emits: its floor
 * finish and the partitions `07-boundary-assembly.md#interior-boundary-ownership`
 * assigns to it.
 *
 * Heights follow the layer splits: a ground-storey finish fills the top
 * 0.025 m above the support base (`10-ground-floor.md`), an upper-storey finish
 * the top 0.025 m of the interstorey reservation (`08-floor-assembly.md`).
 * A partition stands on the structure top under the finishes and reaches its
 * storey's finished ceiling, so no finish slab and wall share a face.
 *
 * Consumers: the fifteen `rooms/*.ts` owners. This helper owns no surface.
 */
import { PALETTE } from "../palette";
import { type IHousePart, type IPlanPoint, type IWallHole, part, slab, straightWall } from "../solids";
import { LAYERS, type StoreyId, ceilingOf, floorOf } from "../storeys";

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
}

/** Floor finish of one room: its outline over the top finish layer. */
export const roomFloor = (room: IRoomSpace): IHousePart => {
  const top = floorOf(room.storey);
  const depth = room.storey === "ground-storey" ? LAYERS.groundFinish : LAYERS.interstoreyFloorFinish;
  return part(`${room.id}-floor`, room.owner, "floor", room.floor, slab({ outline: room.outline, bottom: top - depth, top }));
};

/** Height range of a full-height partition on a storey. */
export const partitionSpan = (storey: StoreyId): readonly [number, number] => [
  floorOf(storey) - (storey === "ground-storey" ? LAYERS.groundFinish : LAYERS.interstoreyFloorFinish),
  ceilingOf(storey),
];

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
