import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidSocket,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A body socket's displayed world point in a capture: the socket's bone-local
 * point placed on that bone as the performance shows it at a film second.
 *
 * @param body The body's surfaces.
 * @param performance The performance's bones.
 * @param subject The performer.
 * @param seconds Film seconds.
 * @param name The socket.
 * @returns World metres.
 */
export function motionCaseSocket(
  body: Pick<IAutoMovieMotionHumanBody, "surfaces">,
  performance: Pick<IAutoMovieMotionHumanPerformance, "bones">,
  subject: string,
  seconds: number,
  name: AutoMovieHumanoidSocket,
): IAutoMovieVector3 {
  const frame: IAutoMovieHumanoidSurfaces.IFrame = body.surfaces.sockets[name];
  return resolveAutoMovieHumanoidSurfaces.place(
    frame,
    performance.bones(subject, seconds).get(frame.bone)!,
  ).point;
}
