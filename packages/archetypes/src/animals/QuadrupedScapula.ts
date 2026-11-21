import type { IAutoMovieVector3 } from "@automovie/interface";

import type { QuadrupedBody } from "./QuadrupedBody";
import type { QuadrupedLimb } from "./QuadrupedLimb";

/**
 * A fore limb's shoulder blade, turning in the sagittal plane about its upper third so the shoulder joint follows a planted hoof's reach.
 *
 * The scapula bar runs from its rotation centre, one third down the blade from its dorsal border, to the shoulder joint. At rest it is unturned, so every species' rest pose, tack and attachment stay as they were. In a stance the blade turns only as far as the hoof's reach requires, never beyond half the scapula's measured range of motion either way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bar, its centre, its rest and the only-as-needed turning law.
 * @evidence contracts/development/design.md#principled-representation A turn about the model X axis through the rotation centre moves the shoulder joint on an arc; the root-height bound and the least turn are closed forms on that arc.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the scapula's dimensions and arc; the root interval and the ride pose read it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prismatic slide or stretched bone; the blade turns rigidly within the cited range.
 */
export namespace QuadrupedScapula {
  /** A fore limb, the limbs with a shoulder blade. */
  export type Fore = Extract<QuadrupedBody.Limb, "leftFore" | "rightFore">;

  /** A shoulder blade's bone, between the trunk and the humerus. */
  export type Bone = `${Fore}Scapula`;

  /** Each fore limb's shoulder blade, which is also the id of the part that draws it. */
  export const BONES: Readonly<Record<Fore, Bone>> = {
    leftFore: "leftForeScapula",
    rightFore: "rightForeScapula",
  };

  /** The scapula's length as a fraction of the height at the withers: the horse's (Matsuura 2008), provisional for other species. */
  export const LENGTH: number = 0.311;

  /** The rotation centre's share of the blade's length below its dorsal border (Back et al. 1995: the scapula rotates about its upper part, synchronous with the distal limb). */
  export const CENTRE: number = 1 / 3;

  /** The blade's spine's slope above the horizontal at rest, degrees: the traditional reference shoulder slope, provisional. */
  export const SLOPE: number = 45;

  /** The scapula's range of motion at the trot, degrees, by biplanar fluoroscopy (Wagner et al. 2026, J Equine Vet Sci 106094: 23.3 at trot, 27.6 at walk); the smaller bounds every gait. */
  export const RANGE: number = 23.3;

  /**
   * One shoulder blade at rest in model space, before the shared root translation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Both points in metres, model frame, root at zero.
   * @evidence contracts/development/design.md#principled-representation The arc's centre and the shoulder joint fix its radius and rest direction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read from the actual neutral FK frames.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IJoint {
    /** The rotation centre. */
    pivot: IAutoMovieVector3;
    /** The shoulder joint at rest. */
    glenoid: IAutoMovieVector3;
  }

  /**
   * The drawn bar of a blade: from its rotation centre halfway to the shoulder joint, so it stays within the trunk; the humerus hangs from the blade at the shoulder joint.
   *
   * @param glenoid The shoulder joint at rest, model space.
   * @param withers The height at the withers, metres.
   * @returns The bar's ends; `from` is the rotation centre, the blade's joint origin.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the ends and why the bar stops short of the joint.
   * @evidence contracts/development/implementation.md#principled-implementation The centre lies two thirds of the blade's length up and back from the shoulder joint along the rest slope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two points.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The shoulder joint itself never moves at rest.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns two points.
   */
  export function bar(glenoid: IAutoMovieVector3, withers: number): IBar {
    const reach: number = (1 - CENTRE) * LENGTH * withers;
    const slope: number = (SLOPE * Math.PI) / 180;
    const from: IAutoMovieVector3 = {
      x: glenoid.x,
      y: glenoid.y + reach * Math.sin(slope),
      z: glenoid.z - reach * Math.cos(slope),
    };
    return {
      from,
      to: {
        x: glenoid.x,
        y: (from.y + glenoid.y) / 2,
        z: (from.z + glenoid.z) / 2,
      },
    };
  }

  /**
   * A drawn bar's two ends, model space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Metres, model frame.
   * @evidence contracts/development/design.md#principled-representation Two points.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the body's layout.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IBar {
    /** The upper end, the joint origin. */
    from: IAutoMovieVector3;
    /** The lower end. */
    to: IAutoMovieVector3;
  }

  /**
   * The shoulder joint after turning the blade by an angle about model X.
   *
   * @param joint The blade at rest.
   * @param angle The turn, radians, right-handed about +X.
   * @returns The moved shoulder joint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and sign.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid rotation of the rest offset about the centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one point.
   */
  export function glenoid(joint: IJoint, angle: number): IAutoMovieVector3 {
    const y: number = joint.glenoid.y - joint.pivot.y;
    const z: number = joint.glenoid.z - joint.pivot.z;
    const c: number = Math.cos(angle);
    const s: number = Math.sin(angle);
    return {
      x: joint.glenoid.x,
      y: joint.pivot.y + y * c - z * s,
      z: joint.pivot.z + y * s + z * c,
    };
  }

  /**
   * The highest root translation at which the shoulder joint, on its arc within range, still reaches the ankle goal.
   *
   * @param joint The blade at rest.
   * @param goal The limb's ankle goal, model space.
   * @param reach The limb's radial reach.
   * @returns The bound, metres; negative infinity when no turn reaches.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bound and the unreachable case.
   * @evidence contracts/development/implementation.md#principled-implementation Unturned, the bound is the goal height less the joint height plus the vertical leg of the planar reach. Over turns it is unimodal and peaks where the joint lies on the line from the lifted centre to the goal, the centre then at reach plus radius from the goal; the peak's turn is clamped to the range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Peak turn, clamp, one evaluation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sampling of turns; nothing is padded.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number.
   */
  export function high(
    joint: IJoint,
    goal: IAutoMovieVector3,
    reach: QuadrupedLimb.IRange,
  ): number {
    const planar: number = leg(reach.maximum, goal.x - joint.glenoid.x);
    if (!(planar >= 0)) return -Infinity;
    const radius: number = Math.hypot(
      joint.glenoid.y - joint.pivot.y,
      joint.glenoid.z - joint.pivot.z,
    );
    const along: number = goal.z - joint.pivot.z;
    const span: number = planar + radius;
    if (!(Math.abs(along) <= span)) return -Infinity;
    const lift: number = goal.y - joint.pivot.y + leg(span, along);
    const angle: number = clamp(
      turn(joint, { y: goal.y - joint.pivot.y - lift, z: along }),
    );
    const moved: IAutoMovieVector3 = glenoid(joint, angle);
    const dz: number = goal.z - moved.z;
    if (!(Math.abs(dz) <= planar)) return -Infinity;
    return goal.y - moved.y + leg(planar, dz);
  }

  /**
   * The least turn within range bringing the shoulder joint within reach of the ankle goal at a root translation.
   *
   * @param joint The blade at rest.
   * @param goal The limb's ankle goal, model space.
   * @param reach The limb's radial reach.
   * @param height The chosen root translation, metres.
   * @param margin The coordinate roundoff budget, metres: a turned joint is aimed this far inside the reach so the exact limb solve admits it.
   * @returns The turn, radians; zero when the rest joint already reaches.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the only-as-needed law.
   * @evidence contracts/development/implementation.md#principled-implementation The joint lies on a circle about the lifted centre; it reaches where its angle to the goal's direction is within the law-of-cosines half-angle, so the least turn is the nearer end of that window, clamped to the range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Rest check, window, nearer end.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The root and the goal never move; the turn is exact.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one number.
   */
  export function least(
    joint: IJoint,
    goal: IAutoMovieVector3,
    reach: QuadrupedLimb.IRange,
    height: number,
    margin: number,
  ): number {
    const planar: number = leg(reach.maximum, goal.x - joint.glenoid.x);
    const y: number = goal.y - joint.glenoid.y - height;
    const z: number = goal.z - joint.glenoid.z;
    if (!(Math.hypot(y, z) > planar)) return 0;
    const radius: number = Math.hypot(
      joint.glenoid.y - joint.pivot.y,
      joint.glenoid.z - joint.pivot.z,
    );
    const toward: IPlanar = {
      y: goal.y - joint.pivot.y - height,
      z: goal.z - joint.pivot.z,
    };
    const distance: number = Math.hypot(toward.y, toward.z);
    const cosine: number =
      (radius * radius + distance * distance - (planar - margin) ** 2) /
      (2 * radius * distance);
    const window: number = Math.acos(Math.max(-1, Math.min(1, cosine)));
    const centre: number = turn(joint, toward);
    return clamp(Math.max(centre - window, Math.min(centre + window, 0)));
  }

  /** A sagittal vector: model Y and Z. */
  interface IPlanar {
    /** Model Y, metres. */
    y: number;
    /** Model Z, metres. */
    z: number;
  }

  /** The turn about +X taking the rest offset's direction to a planar direction. */
  function turn(joint: IJoint, toward: IPlanar): number {
    const y: number = joint.glenoid.y - joint.pivot.y;
    const z: number = joint.glenoid.z - joint.pivot.z;
    return Math.atan2(y * toward.z - z * toward.y, y * toward.y + z * toward.z);
  }

  /** Clamp a turn to half the range either way. */
  function clamp(angle: number): number {
    const half: number = (RANGE * Math.PI) / 360;
    return Math.max(-half, Math.min(half, angle));
  }

  /** The leg of a right triangle, NaN when the side exceeds the hypotenuse. */
  function leg(hypotenuse: number, side: number): number {
    return Math.sqrt(hypotenuse * hypotenuse - side * side);
  }
}
