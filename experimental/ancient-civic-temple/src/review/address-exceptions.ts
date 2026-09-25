/** Named junction strips outside a facade host's centre-line outline. They remain inspection questions. */
import { templePlan as p } from "../spaces/building";

export interface AddressException {
  wall: string;
  face: number;
  axis: "x" | "z";
  from: number;
  to: number;
  minY?: number;
  lowerEdge?: { untilZ: number; atZ: number; atY: number; rise: number };
  observation: string;
  evidence: string;
}

const strip = (wall: string, face: number, axis: "x" | "z", from: number, to: number,
  observation: string, evidence: string, minY?: number,
  lowerEdge?: AddressException["lowerEdge"]): AddressException =>
  ({ wall, face, axis, from, to, observation, evidence, minY, lowerEdge });

/** Each interval comes from a named outside corner or a 0.30/0.60 m wall junction in templePlan. */
export const exposedAddressExceptions: readonly AddressException[] = [
  strip("wall.facade-north", 0, "x", p.westOuter, p.westOuter + 0.3, "exterior.corner.northwest", "spaces/observations.md#geometry-observations"),
  strip("wall.facade-west", 3, "z", p.northOuter, p.northOuter + 0.3, "exterior.corner.northwest", "spaces/observations.md#geometry-observations"),
  strip("wall.facade-north", 0, "x", p.eastOuter - 0.3, p.eastOuter, "exterior.corner.northeast", "spaces/observations.md#geometry-observations"),
  strip("wall.facade-east", 1, "z", p.northOuter, p.northOuter + 0.3, "exterior.corner.northeast", "spaces/observations.md#geometry-observations"),
  strip("wall.facade-south.west", 2, "x", p.westOuter, p.westOuter + 0.3, "exterior.corner.southwest", "spaces/observations.md#geometry-observations"),
  strip("wall.facade-west", 3, "z", p.southOuter - 0.3, p.southOuter, "exterior.corner.southwest", "spaces/observations.md#geometry-observations"),
  strip("wall.facade-south.east", 2, "x", p.eastOuter - 0.3, p.eastOuter, "exterior.corner.southeast", "spaces/observations.md#geometry-observations"),
  strip("wall.facade-east", 1, "z", p.southInner, p.southOuter, "exterior.corner.southeast", "spaces/observations.md#geometry-observations", undefined,
    { untilZ: 9.95, atZ: 9.70, atY: 3.60, rise: 4.25 }),
  strip("wall.facade-north", 0, "x", p.westRoom, p.westRing, "section.tee.west-spine-north", "spaces/observations.md#geometry-observations"),
  strip("wall.facade-north", 0, "x", p.eastRing, p.eastRoom, "section.tee.east-spine-north", "spaces/observations.md#geometry-observations"),
  strip("wall.facade-east", 1, "z", p.yardFront, p.storageBack, "section.tee.yard-storage-east-wall", "spaces/observations.md#geometry-observations"),
  strip("wall.facade-east", 1, "z", p.storageFront, p.recordsBack, "section.tee.storage-records-east-wall", "spaces/observations.md#geometry-observations"),
  strip("wall.facade-east", 1, "z", p.recordsFront, p.officeBack, "section.tee.records-office-east-wall", "spaces/observations.md#geometry-observations"),
  strip("wall.facade-south.west", 2, "x", p.westRoom, p.westRing, "section.tee.west-spine-south", "spaces/observations.md#geometry-observations"),
  strip("wall.facade-south.east", 2, "x", p.eastRing, p.eastRoom, "section.tee.east-spine-south", "spaces/observations.md#geometry-observations"),
  strip("wall.facade-south.west", 0, "x", p.westRoom, p.westRing, "junction.parapet.south", "spaces/observations.md#geometry-observations", 3.8),
  strip("wall.facade-south.east", 0, "x", p.eastRing, p.eastRoom, "junction.parapet.east-gable-ridge", "spaces/observations.md#geometry-observations", 3.8),
  strip("wall.boundary-west-spine", 3, "z", p.sanctuaryFront, p.northRing,
    "section.tee.sanctuary-south-west", "spaces/observations.md#geometry-observations", 3.7),
  strip("wall.boundary-east-spine", 1, "z", p.sanctuaryFront, p.northRing,
    "section.tee.sanctuary-south-east", "spaces/observations.md#geometry-observations", 3.2),
  strip("wall.boundary-east-spine", 1, "z", p.yardFront - 0.35, p.yardFront - 0.15,
    "section.tee.yard-storage-east-spine", "spaces/observations.md#geometry-observations", 3.5),
];

export const exposedAddressExceptionFor = (wall: string, face: number, point: { x: number; y: number; z: number }): AddressException | undefined =>
  exposedAddressExceptions.find((entry) => entry.wall === wall && entry.face === face &&
    (entry.axis === "x" ? point.x : point.z) > entry.from + 1e-6 &&
    (entry.axis === "x" ? point.x : point.z) < entry.to - 1e-6 &&
    (entry.minY === undefined || point.y > entry.minY) &&
    (entry.lowerEdge === undefined || point.z >= entry.lowerEdge.untilZ ||
      point.y > entry.lowerEdge.atY + entry.lowerEdge.rise * (point.z - entry.lowerEdge.atZ)));
