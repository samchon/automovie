import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { stand } from "./stand";

/**
 * Where a jump comes down, at the height of what it lands on (the floor's
 * 0, a box's top, a step's): both feet flat on footprints at the
 * destination, at the body's rest separation and turned out by the stance
 * angle, and the root's three places of the landing: stood upright as the
 * standing law places a root over those feet, touched down 0.03 hip heights
 * below that and 0.1 back of the feet, and absorbed 0.12 below it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the footprints and the three roots with their offsets.
 * @evidence contracts/development/design.md#principled-representation The landing's places, apart from the paths between them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record and its builder, read by the jump.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every offset is a share of the hip height or the body's own lean.
 */
export namespace jumpLanding {
  /**
   * The landing's places.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its place and frame.
   * @evidence contracts/development/design.md#principled-representation The feet and the root at the landing's three instants.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by the jump.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The heights include the surface's.
   */
  export interface ILanding {
    /** Each foot flat on its footprint, world metres. */
    feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>;

    /** The root at touchdown, world metres. */
    touched: IAutoMovieVector3;

    /** The root absorbed, world metres. */
    absorbed: IAutoMovieVector3;

    /** The root stood upright, world metres. */
    stood: IAutoMovieVector3;
  }

  /**
   * The landing's places at a destination.
   *
   * @param body The body.
   * @param to The floor point under the destination, its height ignored.
   * @param heading The jump's heading, degrees about +Y.
   * @param rise The landing surface's height, metres.
   * @param lean The upright stand's forward lean, metres.
   * @returns The places.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The footprints are offsets in the heading's frame at the destination, lifted by the surface's height; the stood root is the standing law's root over them (`stand.root`), and touchdown and absorption are heading-frame offsets from it with its lean removed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two footprints, the standing root over them, then two offsets from it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The footprints keep the body's rest separation and the final root is stand's, so the landing ends in the quiet stance a following stand holds.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size work: two prepared heading frames serve the two footprints and two root offsets; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses stand.root for the standing root and HumanFoot.rotation for each turned-out foot's quaternion.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local frames and footprint reader release on return or throw; only fresh footprint and root vectors escape, without frames, callbacks or history.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    to: IAutoMovieVector3,
    heading: number,
    rise: number,
    lean: number,
  ): ILanding {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const l: number = m.hipHeight;
    const frame: HumanFrame.IPrepared = HumanFrame.prepare({ origin: { ...to, y: 0 }, yaw: heading });
    const turn: HumanFrame.IPrepared = HumanFrame.prepare({ origin: { x: 0, y: 0, z: 0 }, yaw: heading });
    const footprint: (s: "left" | "right") => IAutoMovieMotionHumanFoot.IPlacement = (s: "left" | "right"): IAutoMovieMotionHumanFoot.IPlacement => ({
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
    const feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> = {
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
      touched: offset({ x: 0, y: -TOUCH_DROP * l, z: -TOUCH_BACK * l - lean }),
      stood,
      absorbed: offset({
        x: 0,
        y: -ABSORB_DROP * l,
        z: (ABSORB_LEAN - 1) * lean,
      }),
    };
  }
}

/** How far below the standing root the root touches down, hip heights (provisional). */
const TOUCH_DROP: number = 0.03;

/** How far behind the footprints' middle the root touches down, hip heights (provisional). */
const TOUCH_BACK: number = 0.1;

/** How far below the standing root the absorption bottoms out, hip heights (provisional). */
const ABSORB_DROP: number = 0.12;

/** The share of the standing lean the root has reached at the absorption's bottom (provisional). */
const ABSORB_LEAN: number = 0.3;
