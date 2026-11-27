import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Read a sole point in ankle-local metres with its actual toe articulation.
 * Parameter body: The canonical body owning rest joints and sole sockets.
 * Parameter side: The foot.
 * Parameter point: The sole socket, or the metatarsophalangeal joint itself.
 * Parameter toes: Toe flexion in degrees, positive lifting the toes; zero when
 * absent.
 * Returns: The original ankle-local offset; a foot-owned socket keeps its
 * borrowed point, while articulated/joint offsets are fresh.
 */
export function humanFootOffset(
  body: humanFootOffset.IBody,
  side: AutoMovieHumanSide,
  point: HumanFootOffsetPoint,
  toes: number = 0,
): IAutoMovieVector3 {
  const foot: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
  if (point === "mtp")
    return AutoMovieEngineVector3.subtract(body.rest.get(`${side}Toes`)!, foot);
  const socket: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.sockets[`${point}${side === "left" ? "Left" : "Right"}`];
  if (socket.bone === `${side}Foot`) return socket.point;
  const joint: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    body.rest.get(socket.bone)!,
    foot,
  );
  return articulated(joint, socket.point, toes);
}

/*
 * Fixed ankle-local socket preparation for an action's changing toe angles.
 */
export namespace humanFootOffset {
  /*
   * What a sole point reads of a body: its rest joints and its sockets.
   */
  export type IBody = Pick<IAutoMovieMotionHumanBody, "rest" | "surfaces">;

  /*
   * Resolve actual rest/socket geometry once, then evaluate actual toe flexion.
   * MTP queries return fresh subtraction values and foot-owned sockets retain
   * their ordinary borrowed point. The body geometry must stay unchanged until
   * the caller releases this bounded reader with its action; no query is
   * stored.
   */
  export function prepare(
    body: IBody,
    side: AutoMovieHumanSide,
    point: HumanFootOffsetPreparePoint,
  ): (toes: number) => IAutoMovieVector3 {
    const foot: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
    if (point === "mtp") {
      const joint: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
        body.rest.get(`${side}Toes`)!,
        foot,
      );
      return (_toes: number): IAutoMovieVector3 => ({ ...joint });
    }
    const socket: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.sockets[`${point}${side === "left" ? "Left" : "Right"}`];
    if (socket.bone === `${side}Foot`)
      return (_toes: number): IAutoMovieVector3 => socket.point;
    const joint: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      body.rest.get(socket.bone)!,
      foot,
    );
    return (toes: number): IAutoMovieVector3 =>
      articulated(joint, socket.point, toes);
  }
}
/*
 * The unchanged joint translation after the socket's actual toe rotation.
 */
function articulated(
  joint: IAutoMovieVector3,
  point: IAutoMovieVector3,
  toes: number,
): IAutoMovieVector3 {
  return AutoMovieEngineVector3.add(joint, AutoMovieEngineQuaternion.rotateVector(FLEXION(toes), point));
}

/*
 * The private unchanged negative lateral toe-flexion axis.
 */
const FLEXION: ReturnType<typeof AutoMovieEngineQuaternion.prepareAxisAngle> =
  AutoMovieEngineQuaternion.prepareAxisAngle({ x: -1, y: 0, z: 0 });

/*
 * The alternatives of `HumanFootOffsetPoint`'s site.
 */
type HumanFootOffsetPoint = "heel" | "ball" | "toe" | "sole" | "mtp";

/*
 * The alternatives of `HumanFootOffsetPreparePoint`'s site.
 */
type HumanFootOffsetPreparePoint = "heel" | "ball" | "toe" | "sole" | "mtp";
