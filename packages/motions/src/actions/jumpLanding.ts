import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { stand } from "./stand";

/**
 * The landing's places at a destination.
 *
 * @param body The body.
 * @param to The floor point under the destination, its height ignored.
 * @param heading The jump's heading, degrees about +Y.
 * @param rise The landing surface's height, metres.
 * @param lean The upright stand's forward lean, metres.
 * @param turned Whether the footprints receive the flight's fractional yaw.
 * @param back How far behind the footprints' middle the root touches down,
 *   metres: the flight's capture offset (jump).
 * @returns The places.
 */
export function jumpLanding(
  body: IAutoMovieMotionHumanBody,
  to: IAutoMovieVector3,
  heading: number,
  rise: number,
  lean: number,
  turned: boolean,
  back: number,
): jumpLanding.ILanding {
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const l: number = m.hipHeight;
  const frame: HumanFrame.IPrepared = HumanFrame.prepare({
    origin: { ...to, y: 0 },
    yaw: heading,
  });
  const turn: HumanFrame.IPrepared = HumanFrame.prepare({
    origin: { x: 0, y: 0, z: 0 },
    yaw: heading,
  });
  const footprint: (
    s: AutoMovieHumanSide,
  ) => IAutoMovieMotionHumanFoot.IPlacement = (
    s: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanFoot.IPlacement => ({
    ankle: frame.point({
      x: (s === "left" ? 1 : -1) * Math.abs(body.rest.get(`${s}Foot`)!.x),
      y: m.ankleHeight + rise,
      z: 0,
    }),
    rotation: HumanFoot.rotation(
      heading + (s === "left" ? stand.TOE_OUT : -stand.TOE_OUT),
      0,
    ),
  });
  const feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement> =
    {
      left: footprint("left"),
      right: footprint("right"),
    };

  // The landing ends in the quiet stance over these feet, so it ends at
  // the root the standing law places there; touchdown and absorption are
  // offsets from that root with its lean taken out.
  const stood: IAutoMovieVector3 = stand.root(
    body,
    { left: feet.left.ankle, right: feet.right.ankle },
    heading,
  );
  const offset: (local: IAutoMovieVector3) => IAutoMovieVector3 = (
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const d: IAutoMovieVector3 = turn.point(local);
    return { x: stood.x + d.x, y: stood.y + d.y, z: stood.z + d.z };
  };
  return {
    feet,
    touched: offset({
      x: 0,
      y: -TOUCH_DROP * l,
      z: -back - lean,
    }),
    stood,
    absorbed: offset({
      x: 0,
      y: -ABSORB_DROP * l,
      z: turned ? -lean : (ABSORB_LEAN - 1) * lean,
    }),
  };
}

/**
 * Where a jump comes down, at the height of what it lands on (the floor's 0, a
 * box's top, a step's): both feet flat on footprints at the destination, at the
 * body's rest separation and turned out by the stance angle, and the root's
 * three places of the landing: stood upright as the standing law places a root
 * over those feet, touched down 0.03 hip heights below that and back of the
 * feet by the flight's capture offset (jump: its speed over the pendulum
 * frequency, so the extrapolated centre lands over the feet), and absorbed 0.12
 * below it.
 */
export namespace jumpLanding {
  /** The landing's places. */
  export interface ILanding {
    /** Each foot flat on its footprint, world metres. */
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;

    /** The root at touchdown, world metres. */
    touched: IAutoMovieVector3;

    /** The root absorbed, world metres. */
    absorbed: IAutoMovieVector3;

    /** The root stood upright, world metres. */
    stood: IAutoMovieVector3;
  }
}

/**
 * How far below the standing root the root touches down, hip heights
 * (provisional).
 */
const TOUCH_DROP: number = 0.03;

/**
 * How far below the standing root the absorption bottoms out, hip heights
 * (provisional).
 */
const ABSORB_DROP: number = 0.12;

/**
 * Share of upright lean reached at the ordinary landing's absorption bottom
 * (provisional).
 */
const ABSORB_LEAN: number = 0.3;
