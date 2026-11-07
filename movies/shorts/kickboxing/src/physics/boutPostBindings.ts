import type {
  IAutoMoviePhysicalContactBinding as Binding,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { boutLimbClearanceBindings } from "./boutLimbClearanceBindings";

/** Keep every posting-arm collider clear of the receiver's complete declared geometry, using only that arm's joint coordinates. */
export function boutPostBindings(
  profile: P,
  receiver: { body: string; profile: P },
  side: "left" | "right",
): Binding[] {
  return boutLimbClearanceBindings(
    profile,
    receiver,
    `${side}UpperArm`,
    `post:${side}`,
  );
}
