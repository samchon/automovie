import {
  Quaternion,
  Vector3,
  type resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Read a sole point in ankle-local metres with its actual toe articulation.
 *
 * @param body The canonical body owning rest joints and sole sockets.
 * @param side The foot.
 * @param point The sole socket, or the metatarsophalangeal joint itself.
 * @param toes Toe flexion in degrees, positive lifting the toes; zero when absent.
 * @returns The original ankle-local offset; a foot-owned socket keeps its borrowed point, while articulated/joint offsets are fresh.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States body/socket provenance, ankle-local metres, positive toe convention, default and original result ownership; the prepare companion binds unchanged geometry while varying only toe flexion.
 * @evidence contracts/development/implementation.md#principled-implementation Keeps the original foot-rest lookup, MTP subtraction and actual socket-owner branch. A non-foot socket uses the same rest-joint subtraction, negative lateral axis-angle rotation of its point and joint addition, without changing operation grouping.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared articulated transform serves raw HumanFoot.offset and a fixed-geometry prepare reader; HumanFoot and height-only consumers delegate to this owner rather than duplicating toe geometry.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Raw reads still inspect the current body in their original order. Preparation binds only actual rest/socket geometry, never a posed point, toe angle, query result, sampled approximation or caller-provided derived offset.
 * @evidence contracts/development/implementation.md#efficient-algorithms Raw work stays constant. A fixed body/side/socket reader resolves rest joints and socket membership once, then each varying toe angle retains its actual quaternion articulation; the module shares only one private canonical axis reader.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The prepared reader requires unchanged body/rest/surface geometry. Foot-owned and MTP points remain angle-independent; every articulated angle runs the same shared transform and changing geometry requires another reader.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A caller-owned reader retains one bounded joint/socket description until released with its action; the private axis has module lifetime. No body-keyed cache, pose, query angle/result history, handle or task is retained.
 */
export function humanFootOffset(
  body: IAutoMovieMotionHumanBody,
  side: "left" | "right",
  point: "heel" | "ball" | "toe" | "sole" | "mtp",
  toes: number = 0,
): IAutoMovieVector3 {
  const foot: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
  if (point === "mtp") return Vector3.subtract(body.rest.get(`${side}Toes`)!, foot);
  const socket: IAutoMovieHumanoidSurfaces.IFrame = body.surfaces.sockets[`${point}${side === "left" ? "Left" : "Right"}`];
  if (socket.bone === `${side}Foot`) return socket.point;
  const joint: IAutoMovieVector3 = Vector3.subtract(body.rest.get(socket.bone)!, foot);
  return articulated(joint, socket.point, toes);
}

/**
 * Fixed ankle-local socket preparation for an action's changing toe angles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines fixed body/side/socket binding and original articulation/ownership for the varying-angle reader.
 * @evidence contracts/development/design.md#principled-representation One toe-angle reader retains actual ankle-local joint/socket geometry; it does not represent a placed foot or solved pose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The prepare member serves repeated foot-height queries under one unchanged body's geometry; HumanFoot exposes the same owner as its offset facade.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The raw path and prepared path share the actual articulated transform and canonical axis, with no alternate foot convention, numerical verdict or angle cache.
 */
export namespace humanFootOffset {
  /**
   * Resolve actual rest/socket geometry once, then evaluate actual toe flexion.
   * MTP queries return fresh subtraction values and foot-owned sockets retain
   * their ordinary borrowed point. The body geometry must stay unchanged until
   * the caller releases this bounded reader with its action; no query is stored.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    point: "heel" | "ball" | "toe" | "sole" | "mtp",
  ): (toes: number) => IAutoMovieVector3 {
    const foot: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
    if (point === "mtp") {
      const joint: IAutoMovieVector3 = Vector3.subtract(body.rest.get(`${side}Toes`)!, foot);
      return (_toes: number): IAutoMovieVector3 => ({ ...joint });
    }
    const socket: IAutoMovieHumanoidSurfaces.IFrame = body.surfaces.sockets[`${point}${side === "left" ? "Left" : "Right"}`];
    if (socket.bone === `${side}Foot`) return (_toes: number): IAutoMovieVector3 => socket.point;
    const joint: IAutoMovieVector3 = Vector3.subtract(body.rest.get(socket.bone)!, foot);
    return (toes: number): IAutoMovieVector3 => articulated(joint, socket.point, toes);
  }
}

/** The unchanged joint translation after the socket's actual toe rotation. */
function articulated(joint: IAutoMovieVector3, point: IAutoMovieVector3, toes: number): IAutoMovieVector3 {
  return Vector3.add(joint, Quaternion.rotateVector(FLEXION(toes), point));
}

/** The private unchanged negative lateral toe-flexion axis. */
const FLEXION: ReturnType<typeof Quaternion.prepareAxisAngle> = Quaternion.prepareAxisAngle({ x: -1, y: 0, z: 0 });
