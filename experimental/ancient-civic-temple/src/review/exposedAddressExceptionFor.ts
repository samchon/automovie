import { exposedAddressExceptions } from "./exposedAddressExceptions";
import { AddressException } from "./AddressException";


/** Exception covering a point on a wall face, or undefined when none does. */
export const exposedAddressExceptionFor = (wall: string, face: number, point: { x: number; y: number; z: number; }): AddressException | undefined => exposedAddressExceptions.find((entry) => entry.wall === wall && entry.face === face &&
  (entry.axis === "x" ? point.x : point.z) > entry.from + 1e-6 &&
  (entry.axis === "x" ? point.x : point.z) < entry.to - 1e-6 &&
  (entry.minY === undefined || point.y > entry.minY) &&
  (entry.lowerEdge === undefined || point.z >= entry.lowerEdge.untilZ ||
    point.y > entry.lowerEdge.atY + entry.lowerEdge.rise * (point.z - entry.lowerEdge.atZ)));
