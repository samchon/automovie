import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../AutoMovieArchetypeFrame";

/**
 * Read a wheel pair's shared transverse axis without guessing part names.
 *
 * @param left Producer-declared left wheel spin contact.
 * @param right Producer-declared right wheel spin contact.
 * @returns A fresh model-space midpoint, metres, at the neutral wheel
 *   clearance.
 * @throws {RangeError} For nonfinite/noncollinear centres, unsupported spin
 *   axes or nonpositive clearance.
 */
export function towingAxle(
  left: IAutoMovieAffordance,
  right: IAutoMovieAffordance,
): IAutoMovieVector3 {
  const a: IAutoMovieVector3 = left.frame.translation;
  const b: IAutoMovieVector3 = right.frame.translation;
  if (!(a.y > 0 && b.y > 0))
    throw new RangeError(
      "Towing requires actual finite wheel centres with positive ground clearance",
    );
  const scale: number = Math.max(
    Math.abs(a.x),
    Math.abs(a.y),
    Math.abs(a.z),
    Math.abs(b.x),
    Math.abs(b.y),
    Math.abs(b.z),
  );
  if (
    Math.abs(a.y - b.y) > 64 * Number.EPSILON * scale ||
    Math.abs(a.z - b.z) > 64 * Number.EPSILON * scale ||
    a.x === b.x
  )
    throw new RangeError(
      "The declared towing wheels must share one transverse axle",
    );
  for (const contact of [left, right]) {
    const axis: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
      contact.frame,
      "y",
    );
    if (
      contact.kind !== "knob" ||
      Math.abs(Math.abs(axis.x) - 1) > 64 * Number.EPSILON ||
      Math.abs(axis.y) > 64 * Number.EPSILON ||
      Math.abs(axis.z) > 64 * Number.EPSILON
    )
      throw new RangeError(
        "Declared towing wheel spins must rotate about the transverse axle",
      );
  }
  return { x: a.x / 2 + b.x / 2, y: a.y / 2 + b.y / 2, z: a.z / 2 + b.z / 2 };
}
