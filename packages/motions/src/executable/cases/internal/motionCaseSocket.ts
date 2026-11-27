
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidSocket, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance, IAutoMovieVector3 } from "@automovie/interface";

/*
 * A body socket's displayed world point in a capture: the socket's bone-local
 * point placed on that bone as the performance shows it at a film second.
 * Parameter body: The body's surfaces.
 * Parameter performance: The performance's bones.
 * Parameter subject: The performer.
 * Parameter seconds: Film seconds.
 * Parameter name: The socket.
 * Returns: World metres.
 */
export function motionCaseSocket(
  body: Pick<IAutoMovieMotionHumanBody, "surfaces">,
  performance: Pick<IAutoMovieMotionHumanPerformance, "bones">,
  subject: string,
  seconds: number,
  name: AutoMovieHumanoidSocket,
): IAutoMovieVector3 {
  const frame: IAutoMovieHumanoidSurfaces.IFrame = body.surfaces.sockets[name];
  return AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
    frame,
    performance.bones(subject, seconds).get(frame.bone)!,
  ).point;
}
