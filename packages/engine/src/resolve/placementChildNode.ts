import { placementNodePrefix } from "./placementNodePrefix";

/**
 * Name one bone or articulation child by the shared placement prefix followed
 * by its child id. Clips, bound profiles and viewer lookup use the same
 * concrete string.
 */
export const placementChildNode: (
  placement: string,
  child: string,
) => string = (placement: string, child: string): string =>
  `${placementNodePrefix(placement)}${child}`;
