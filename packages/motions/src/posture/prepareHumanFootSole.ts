import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "./HumanFoot";

/**
 * Prepare a flat-toed foot's ankle-local sole points for changing placements.
 *
 * @param body The unchanged canonical body owning rest joints and sole frames.
 * @param side The foot.
 * @returns Fresh world sole points in the original socket-then-outline order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the unchanged-body premise, flat-toe convention, varying placement and ordered fresh world points.
 * @evidence contracts/development/implementation.md#principled-implementation HumanFoot.offset resolves each original sole socket at zero toe flexion; outline frames retain the same rest-joint-to-ankle offset arithmetic. Each queried placement still rotates and translates every point exactly as HumanFoot.sole did.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One body-local point list precedes a placement reader; HumanFoot.sole and prepared stance consumers share this same owner, while articulated displayed-bone base reading remains separate.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No socket or outline corner is removed, and no posed/world point or target is cached. Flat toes remain the existing sole contract, without replacing displayed toe articulation in base/socket readers.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear preparation in a foot's sole points once per unchanged body/side; each placement retains the original linear quaternion/translation work while omitting repeated socket/rest-frame conversions.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The immutable body's rest joints and surface/outline frames fix ankle-local points, matching HumanFootOutline's existing per-body lifetime; another body is required to adopt geometry edits.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A weak body map owns at most two side readers and their local-point lists per live body; action-owned borrowed readers release with their actions, and no angle, pose or queried-placement history grows the cache.
 */
export function prepareHumanFootSole(
  body: IAutoMovieMotionHumanBody,
  side: "left" | "right",
): (foot: IAutoMovieMotionHumanFoot.IPlacement) => IAutoMovieVector3[] {
  let sides:
    | Partial<
        Record<
          "left" | "right",
          (foot: IAutoMovieMotionHumanFoot.IPlacement) => IAutoMovieVector3[]
        >
      >
    | undefined = CACHE.get(body);
  if (sides === undefined) {
    sides = {};
    CACHE.set(body, sides);
  }
  const known:
    | ((foot: IAutoMovieMotionHumanFoot.IPlacement) => IAutoMovieVector3[])
    | undefined = sides[side];
  if (known !== undefined) return known;
  const ankle: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
  const local: IAutoMovieVector3[] = [
    ...HumanFoot.SOCKETS.map(
      (socket: IAutoMovieMotionHumanFoot.Socket): IAutoMovieVector3 =>
        HumanFoot.offset(body, side, socket),
    ),
    ...HumanFoot.outline(body, side).map(
      (frame: IAutoMovieHumanoidSurfaces.IFrame): IAutoMovieVector3 =>
        frame.bone === `${side}Foot`
          ? frame.point
          : Vector3.add(
              Vector3.subtract(body.rest.get(frame.bone)!, ankle),
              frame.point,
            ),
    ),
  ];
  const read: (
    foot: IAutoMovieMotionHumanFoot.IPlacement,
  ) => IAutoMovieVector3[] = (
    foot: IAutoMovieMotionHumanFoot.IPlacement,
  ): IAutoMovieVector3[] =>
    local.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(foot.ankle, Quaternion.rotateVector(foot.rotation, point)),
    );
  sides[side] = read;
  return read;
}

/** Intrinsic ankle-local geometry only, at most one reader for each side of a weak body. */
const CACHE: WeakMap<
  IAutoMovieMotionHumanBody,
  Partial<
    Record<
      "left" | "right",
      (foot: IAutoMovieMotionHumanFoot.IPlacement) => IAutoMovieVector3[]
    >
  >
> = new WeakMap();
