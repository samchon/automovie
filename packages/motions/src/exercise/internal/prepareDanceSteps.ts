import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareDanceFootCourse } from "./prepareDanceFootCourse";

/*
 * Prepare the ordered footfalls and rigid foot courses of a step-touch or box
 * step. Apply an optional waltz turn at each destination beat.
 * Parameter steps: The figure, beat times, entry foot anchors and step sizes.
 * Returns: Each foot's ordered falls and prepared course for posture and
 * contact planning.
 */
export function prepareDanceSteps({
  kind,
  side,
  reverse,
  beats,
  beatAt,
  period,
  distance,
  clearance,
  stance,
  leftward,
  forward,
  rotate,
}: ISteps): IPrepareDanceStepsResult {
  const first: AutoMovieHumanSide = side ?? "right";
  const second: AutoMovieHumanSide = first === "right" ? "left" : "right";

  // Each footfall: the foot, its beat and the offset from its stance
  // it lands at, `x` to the body's left and `z` forward.
  const falls: IFall[] = [];
  const offset: Record<AutoMovieHumanSide, IOffset> = {
    left: { x: 0, z: 0 },
    right: { x: 0, z: 0 },
  };

  // The second foot's own side.
  const out: number = first === "right" ? 1 : -1;
  for (let k: number = 1; k <= beats; k++) {
    let foot: AutoMovieHumanSide;
    if (kind === "stepTouch") {
      const group: number = Math.floor((k - 1) / 2);
      const leader: AutoMovieHumanSide = group % 2 === 0 ? first : second;
      foot = k % 2 === 1 ? leader : leader === "left" ? "right" : "left";
      offset[foot] = {
        x: offset[foot].x + (group % 2 === 0 ? -1 : 1) * out * distance,
        z: 0,
      };
    } else {
      // The square's corners in the order the feet take them: forward,
      // side, close, back, side, close.
      const count: number = (k - 1) % 6;
      foot = count % 2 === 0 ? first : second;
      offset[foot] = {
        x: count === 1 || count === 2 || count === 3 ? out * distance : 0,
        z: count < 3 ? (reverse ? -distance : distance) : 0,
        seconds: beatAt(k),
      };
    }
    falls.push({ foot, beat: beatAt(k), at: offset[foot] });
  }
  const paths: Record<AutoMovieHumanSide, readonly IFall[]> = {
    left: falls.filter((fall: IFall): boolean => fall.foot === "left"),
    right: falls.filter((fall: IFall): boolean => fall.foot === "right"),
  };
  const origin: IOffset = { x: 0, z: 0 };
  const placements: Record<
    AutoMovieHumanSide,
    Map<IOffset, IAutoMovieMotionHumanFoot.IPlacement>
  > = { left: new Map(), right: new Map() };
  for (const foot of ["left", "right"] as const)
    for (const at of [
      origin,
      ...paths[foot].map((fall: IFall): IOffset => fall.at),
    ]) {
      const placement: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle: AutoMovieEngineVector3.add(
          stance[foot].ankle,
          AutoMovieEngineVector3.add(
            AutoMovieEngineVector3.scale(leftward, at.x),
            AutoMovieEngineVector3.scale(forward, at.z),
          ),
        ),
        rotation: stance[foot].rotation,
      };
      placements[foot].set(
        at,
        rotate?.(placement, at.seconds ?? 0) ?? placement,
      );
    }
  const courses: Record<
    AutoMovieHumanSide,
    ReturnType<typeof prepareDanceFootCourse>
  > = {
    left: prepareDanceFootCourse(
      paths.left,
      placements.left,
      origin,
      period,
      clearance,
    ),
    right: prepareDanceFootCourse(
      paths.right,
      placements.right,
      origin,
      period,
      clearance,
    ),
  };
  return { paths, courses };
}

/*
 * A foot's offset from its stance over the floor, metres: `x` to the body's
 * left, `z` forward.
 */
interface IOffset {
  /*
   * To the body's left.
   */
  x: number;

  /*
   * Forward.
   */
  z: number;

  /*
   * The footfall's second for a rotated box placement.
   */
  seconds?: number;
}
/*
 * A landed foot, its half-beat course endpoint and its time.
 */
interface IFall {
  /*
   * Which foot lands.
   */
  foot: AutoMovieHumanSide;

  /*
   * Time of the landing, in action-local seconds.
   */
  beat: number;

  /*
   * Planned offset from the foot's entry placement, in metres.
   */
  at: IOffset;
}

/*
 * The alternatives of `StepsKind`'s site.
 */
type StepsKind = "stepTouch" | "boxStep";
/*
 * The ordered step figure and its unchanged timing and floor placement inputs.
 */
interface ISteps {
  /*
   * Which stepping pattern to trace.
   */
  kind: StepsKind;

  /*
   * First foot when the author specifies one.
   */
  side?: AutoMovieHumanSide;

  /*
   * Whether the first half of a box moves backward.
   */
  reverse: boolean;

  /*
   * Number of authored footfalls.
   */
  beats: number;

  /*
   * Action-local second of each one-based beat.
   */
  beatAt: (beat: number) => number;

  /*
   * Nominal seconds between beats, used for the half-beat travels.
   */
  period: number;

  /*
   * Step distance, in metres.
   */
  distance: number;

  /*
   * Swing clearance, in metres.
   */
  clearance: number;

  /*
   * World placement of both feet as the action starts.
   */
  stance: Readonly<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>
  >;

  /*
   * World direction toward the dancer's left at entry.
   */
  leftward: IAutoMovieVector3;

  /*
   * World direction forward from the dancer at entry.
   */
  forward: IAutoMovieVector3;

  /*
   * A waltz's shared-pivot turn at each footfall, when used.
   */
  rotate?: (
    placement: IAutoMovieMotionHumanFoot.IPlacement,
    seconds: number,
  ) => IAutoMovieMotionHumanFoot.IPlacement;
}

/*
 * The record of `IPrepareDanceStepsResult`'s site.
 */
type IPrepareDanceStepsResult = {
  /*
   * Ordered timed feet for publishing support windows.
   */
  paths: Readonly<Record<AutoMovieHumanSide, readonly IFall[]>>;

  /*
   * The two prepared course readers.
   */
  courses: Readonly<
    Record<AutoMovieHumanSide, ReturnType<typeof prepareDanceFootCourse>>
  >;
};
