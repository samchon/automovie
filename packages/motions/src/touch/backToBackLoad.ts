import type { IAutoMovieResolveCenterOfMass } from "@automovie/interface";

/**
 * The share of the body's weight a trunk leaning back lays on its partner: the
 * trunk's mass share (the spine, chest, upper chest, neck and head) times the
 * tangent of the lean, at most the whole weight.
 *
 * @param body The body's mass model, made with the body.
 * @param pitch The trunk's lean from upright, degrees, either way.
 * @returns The share, 0 to 1.
 */
export function backToBackLoad(
  body: backToBackLoad.IBody,
  pitch: number,
): number {
  const trunk: number = body.massModel.segments
    .filter((s: backToBackLoad.ISegment): boolean =>
      backToBackLoad.TRUNK.has(s.bone),
    )
    .reduce(
      (sum: number, s: backToBackLoad.ISegment): number => sum + s.mass,
      0,
    );
  return Math.min(
    1,
    (trunk / body.massModel.mass) * Math.tan((Math.abs(pitch) * Math.PI) / 180),
  );
}

/** What the lean's load reads of a body. */
export namespace backToBackLoad {
  /** The trunk's segments above the pelvis. */
  export const TRUNK: ReadonlySet<string> = new Set([
    "spine",
    "chest",
    "upperChest",
    "neck",
    "head",
  ]);

  /** A segment's bone and mass. */
  export type ISegment = Pick<
    IAutoMovieResolveCenterOfMass.ISegment,
    "bone" | "mass"
  >;

  /** The body's whole mass and its segments' masses. */
  export interface IBody {
    /** The mass model, made with the body. */
    massModel: { mass: number; segments: readonly ISegment[] };
  }
}
