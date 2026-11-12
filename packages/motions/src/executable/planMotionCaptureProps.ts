import type { IAutoMoviePose } from "@automovie/interface";

import { planMotionCaptureInstants } from "../capture/planMotionCaptureInstants";
import type { IMotionCaptureCase } from "./IMotionCaptureCase";
import type { IMotionCaptureProps } from "./IMotionCaptureProps";

/**
 * Frames per second of a case's grid: 32, a power of two, so every frame second `k / 32` and the clock `N / 32` are exact binary fractions, which a video's whole-frame check needs and a seek's match of seconds relies on.
 */
const FPS: number = 32;

/**
 * Turn a built motion case into the data its draw page receives: every performer and ghost posed at each of the case's instants and at every frame of a 32 fps grid up to the last instant, so stills draw the case's beats and a video draws every frame of its clock; the clock, `N / 32` seconds with `N` the frames up to the last instant; the instants drawn with their labels from `planMotionCaptureInstants`; and the case's overlays as they are.
 *
 * @param capture The built case.
 * @param raster Width and height in pixels of every still.
 * @returns The page's props.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is sampled and what is copied.
 * @evidence contracts/development/implementation.md#principled-implementation A performer is a function of film seconds, so sampling it at exactly the instants the capture draws loses nothing the stills show.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One map per member.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Poses come from the case's own functions; nothing is interpolated or adjusted.
 * @evidence contracts/development/implementation.md#efficient-algorithms Figures times (instants plus grid frames) pose evaluations.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built once per case.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns plain data and keeps nothing.
 */
export function planMotionCaptureProps(
  capture: IMotionCaptureCase,
  raster: { width: number; height: number },
): IMotionCaptureProps {
  // The case's own instants, then every frame of the grid up to the last of them that is not one already.
  const instants: number[] = capture.times.map((time: IMotionCaptureCase.ITime): number => time.seconds);
  const frames: number = Math.floor(Math.max(...instants) * FPS) + 1;
  const known: Set<number> = new Set(instants);
  const seconds: number[] = [
    ...instants,
    ...Array.from({ length: frames }, (_: unknown, k: number): number => k / FPS).filter(
      (grid: number): boolean => !known.has(grid),
    ),
  ];
  const figure: (performer: IMotionCaptureCase.IPerformer) => IMotionCaptureProps.IFigure = (
    performer: IMotionCaptureCase.IPerformer,
  ): IMotionCaptureProps.IFigure => ({
    id: performer.id,
    body: performer.body,
    color: performer.color ?? null,
    poses: seconds.map((at: number): IAutoMoviePose => performer.pose(at)),
  });
  return {
    name: capture.name,
    fps: FPS,
    durationSeconds: frames / FPS,
    seconds,
    instants: planMotionCaptureInstants(capture.times),
    raster,
    performers: capture.performers.map(figure),
    ghosts: (capture.ghosts ?? []).map(
      (ghost: IMotionCaptureCase.IGhost): IMotionCaptureProps["ghosts"][number] => ({
        ...figure(ghost),
        opacity: ghost.opacity,
      }),
    ),
    trails: capture.trails ?? [],
    targets: capture.targets ?? [],
    drift: capture.drift ?? [],
    boxes: capture.boxes ?? [],
  };
}
