import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "./AutoMovieArchetypeFrame";

/**
 * Read an actual wheel pair's shared transverse axis without guessing part names.
 *
 * @param left Producer-declared left wheel spin contact.
 * @param right Producer-declared right wheel spin contact.
 * @returns A fresh model-space midpoint, metres, at the neutral wheel clearance.
 * @throws {RangeError} For nonfinite/noncollinear centres, unsupported spin axes or nonpositive clearance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names actual producer-owned wheel contacts, metre midpoint/clearance and transverse-axis refusals.
 * @evidence contracts/development/implementation.md#principled-implementation Two actual wheel-rotation frames define one transverse axle; their shared Y/Z and midpoint X provide its source coordinate.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit finite centres and actual spin axes, then copy the midpoint.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The producer supplies identities; no nearest wheel search, dimension surrogate, kind heuristic or altered frame creates support geometry.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two frame/axis reads and constant scalar arithmetic.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Cart and cannon geometry readers share this axle admission owner.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no input frame/contact and returns one independent point.
 */
export function towingAxle(
  left: IAutoMovieAffordance,
  right: IAutoMovieAffordance,
): IAutoMovieVector3 {
  const a: IAutoMovieVector3 = left.frame.translation;
  const b: IAutoMovieVector3 = right.frame.translation;
  if (
    ![a.x, a.y, a.z, b.x, b.y, b.z].every(Number.isFinite) ||
    !(a.y > 0 && b.y > 0)
  )
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
      ![axis.x, axis.y, axis.z].every(Number.isFinite) ||
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
