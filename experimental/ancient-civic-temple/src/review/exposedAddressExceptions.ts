import { templePlan as p } from "../spaces/templePlan";
import { AddressException } from "./AddressException";

const strip = (wall: string, face: number, axis: "x" | "z", from: number, to: number,
  observation: string, minY?: number,
  lowerEdge?: AddressException["lowerEdge"]): AddressException =>
  ({ wall, face, axis, from, to, observation, minY, lowerEdge });

/** Each interval comes from a named outside corner or wall junction in templePlan. */
const outerWallHalf = (p.westInner - p.westOuter) / 2;
/** Named junction strips outside a facade host's centre-line outline. They remain inspection questions. */
export const exposedAddressExceptions: readonly AddressException[] = [
  strip("wall.facade-north", 0, "x", p.westOuter, p.westOuter + outerWallHalf, "exterior.corner.northwest"),
  strip("wall.facade-west", 3, "z", p.northOuter, p.northOuter + outerWallHalf, "exterior.corner.northwest"),
  strip("wall.facade-north", 0, "x", p.eastOuter - outerWallHalf, p.eastOuter, "exterior.corner.northeast"),
  strip("wall.facade-east", 1, "z", p.northOuter, p.northOuter + outerWallHalf, "exterior.corner.northeast"),
  strip("wall.facade-south.west", 2, "x", p.westOuter, p.westOuter + outerWallHalf, "exterior.corner.southwest"),
  strip("wall.facade-west", 3, "z", p.southOuter - outerWallHalf, p.southOuter, "exterior.corner.southwest"),
  strip("wall.facade-south.east", 2, "x", p.eastOuter - outerWallHalf, p.eastOuter, "exterior.corner.southeast"),
  strip("wall.facade-east", 1, "z", p.southInner, p.southOuter, "exterior.corner.southeast", undefined,
    { untilZ: 9.95, atZ: 9.70, atY: 3.60, rise: 4.25 }),
  strip("wall.facade-north", 0, "x", p.westRoom, p.westRing, "section.tee.west-spine-north"),
  strip("wall.facade-north", 0, "x", p.eastRing, p.eastRoom, "section.tee.east-spine-north"),
  strip("wall.facade-east", 1, "z", p.yardFront, p.storageBack, "section.tee.yard-storage-east-wall"),
  strip("wall.facade-east", 1, "z", p.storageFront, p.recordsBack, "section.tee.storage-records-east-wall"),
  strip("wall.facade-east", 1, "z", p.recordsFront, p.officeBack, "section.tee.records-office-east-wall"),
  strip("wall.facade-south.west", 2, "x", p.westRoom, p.westRing, "section.tee.west-spine-south"),
  strip("wall.facade-south.east", 2, "x", p.eastRing, p.eastRoom, "section.tee.east-spine-south"),
  strip("wall.facade-south.west", 0, "x", p.westRoom, p.westRing, "junction.parapet.south", 3.8),
  strip("wall.facade-south.east", 0, "x", p.eastRing, p.eastRoom, "junction.parapet.east-gable-ridge", 3.8),
  strip("wall.boundary-west-spine", 3, "z", p.sanctuaryFront, p.northRing,
    "section.tee.sanctuary-south-west", 3.7),
  strip("wall.boundary-east-spine", 1, "z", p.sanctuaryFront, p.northRing,
    "section.tee.sanctuary-south-east", 3.2),
  strip("wall.boundary-east-spine", 1, "z", p.yardFront - 0.35, p.yardFront - 0.15,
    "section.tee.yard-storage-east-spine", 3.5),
];

