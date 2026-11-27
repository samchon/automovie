import { DEFAULT_HUMANOID_ROM, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAngleRange,
  IAutoMovieBodyMeasure,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTrunk } from "../../compose/internal/AutoMovieMotionHumanTrunk";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanWeaponPresent } from "./HumanWeaponPresent";

/*
 * A mounted presentation: a rider seated in the saddle turns the trunk toward a
 * target before the arms present to it, since the seat and the legs keep the
 * pelvis facing the horse's travel.
 *
 * A standing presentation reaches `HumanWeaponPresent.TURN` off the heading by
 * the arms alone. In the saddle the trunk adds its own axial rotation, which
 * `StrikingBlade.turned` splits `AutoMovieMotionHumanTrunk.CHEST` to the chest
 * and the rest to the lumbar spine, so a rider presents as far off the horse's
 * heading as the chest's and the spine's axial ranges (`DEFAULT_HUMANOID_ROM`,
 * the bound `HumanSupportAim` keeps a moving support's aim within) allow plus
 * the arms' own `TURN`, which reaches behind the rider's shoulders, short of
 * dead astern: there the horse must turn.
 */
export namespace HumanMountedPresentation {
  /*
   * The trunk turn a body can take to each side.
   */
  export interface IRange {
    /*
     * The largest turn to the performer's left, degrees, at least 0.
     */
    left: number;

    /*
     * The largest turn to the performer's right, degrees, at most 0.
     */
    right: number;
  }

  /*
   * The trunk turn the chest's and the spine's axial ranges allow to each side.
   * Returns: Each side's largest turn.
   * When the range-of-motion table gives the chest or the spine
   * no twist.
   */
  export function range(): IRange {
    const chest: IAutoMovieAngleRange = twist("chest");
    const spine: IAutoMovieAngleRange = twist("spine");
    const share: number = AutoMovieMotionHumanTrunk.CHEST;
    return {
      left: Math.max(0, Math.min(chest.max / share, spine.max / (1 - share))),
      right: Math.min(0, Math.max(chest.min / share, spine.min / (1 - share))),
    };
  }

  /*
   * A target's signed bearing off a heading on the floor.
   * Parameter heading: The heading, degrees about `+Y` from `+Z`, positive toward
   * `+X`.
   * Parameter from: The point the bearing is read from, world metres.
   * Parameter target: The target, world metres.
   * Returns: Degrees from -180 to 180, positive toward the performer's left.
   */
  export function bearing(
    heading: number,
    from: IAutoMovieVector3,
    target: IAutoMovieVector3,
  ): number {
    const h: number = (heading * Math.PI) / 180;
    const dx: number = target.x - from.x;
    const dz: number = target.z - from.z;
    const ahead: number = dx * Math.sin(h) + dz * Math.cos(h);
    const left: number = dx * Math.cos(h) - dz * Math.sin(h);
    return (Math.atan2(left, ahead) * 180) / Math.PI;
  }

  /*
   * The trunk turn a seated presentation takes so a target lies within the
   * arms' presentation.
   * Parameter off: The target's signed bearing off the seat's heading, degrees,
   * positive to the left.
   * Parameter held: The trunk turn the presentation already takes, degrees, such as
   * a shouldered long gun's blade; the sum stays within `range`.
   * Parameter side: The presenting arm.
   * Parameter axis: The refused parameter's name.
   * Returns: The turn, degrees, positive to the left, toward the target: on the
   * presenting arm's side, 0 within the arms' `TURN` and the excess past it;
   * across the body, the whole bearing as far as the trunk's range allows,
   * the arms taking the rest.
   * A `reach` refusal on `axis` when the bearing lies
   * past the trunk's range and the arms' `TURN` on its side, naming the
   * bearing and the feasible bearings.
   */
  export function turn(
    off: number,
    held: number,
    side: AutoMovieHumanSide,
    axis: string,
  ): number {
    const reach: IRange = range();
    const arms: number = HumanWeaponPresent.TURN;
    // The presenting arm's own side: the right arm's to the right, negative.
    const across: boolean = side === "right" ? off > 0 : off < 0;
    const most: number = off > 0 ? reach.left - held : reach.right - held;
    const taken: number = across
      ? off > 0
        ? Math.max(0, Math.min(off, most))
        : Math.min(0, Math.max(off, most))
      : Math.abs(off) <= arms
        ? 0
        : off - Math.sign(off) * arms;
    if (
      held + taken > reach.left ||
      held + taken < reach.right ||
      Math.abs(off - taken) > arms
    )
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis,
        value: off,
        feasible: {
          kind: "range",
          minimum: reach.right - held - arms,
          maximum: reach.left - held + arms,
          unit: "deg",
        },
        reason: `the target lies ${off.toFixed(0)} degrees off the seat's heading, beyond the trunk's turn and the arms' ${arms} degrees`,
        fix: "turn the horse toward the target or move the target within the rider's reach",
      });
    return taken;
  }

  /*
   * A mounted arm's station toward a target in the seat frame.
   */
  export interface IStation {
    /*
     * The trunk's turn toward the target, degrees, positive to the left
     * (`turn`).
     */
    turn: number;

    /*
     * The arm's shoulder on the turned trunk, seat-frame metres.
     */
    shoulder: IAutoMovieVector3;

    /*
     * The hand's place `reach` along the line from the shoulder to the target,
     * seat-frame metres.
     */
    grip: IAutoMovieVector3;

    /*
     * The unit line from the shoulder to the target, in the seat frame.
     */
    axis: IAutoMovieVector3;
  }

  /*
   * Where a seated arm presents toward a target: the trunk turned by `turn`
   * about the seat's vertical through the root, the arm's shoulder on it, and
   * the hand `reach` along the line from that shoulder to the target.
   * Parameter measure: The rider's measures.
   * Parameter root: The seated root, seat-frame metres (forward `+Z`, left `+X`, up
   * `+Y`).
   * Parameter side: The presenting arm.
   * Parameter target: The target, seat-frame metres.
   * Parameter reach: How far along the line the hand lies, metres.
   * Parameter axis: The refused parameter's name.
   * Returns: The station.
   * As `turn` does, on the target's bearing from the
   * root.
   */
  export function station(
    measure: IAutoMovieBodyMeasure,
    root: IAutoMovieVector3,
    side: AutoMovieHumanSide,
    target: IAutoMovieVector3,
    reach: number,
    axis: string,
  ): IStation {
    const t: number = turn(bearing(0, root, target), 0, side, axis);
    const shoulder: IAutoMovieVector3 = Vector3.add(
      root,
      Quaternion.rotateVector(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, t),
        {
          x: (side === "left" ? 1 : -1) * measure.shoulderHalfWidth,
          y: measure.shoulderHeight - measure.hipHeight,
          z: 0,
        },
      ),
    );
    const line: IAutoMovieVector3 = Vector3.subtract(target, shoulder);
    if (Vector3.length(line) === 0)
      throw new Error("A mounted station's target lies at its shoulder");
    const along: IAutoMovieVector3 = Vector3.normalize(line);
    return {
      turn: t,
      shoulder,
      grip: Vector3.add(shoulder, Vector3.scale(along, reach)),
      axis: along,
    };
  }

  /*
   * A trunk joint's axial range from the range-of-motion table.
   */
  function twist(bone: TwistBone): IAutoMovieAngleRange {
    const range: IAutoMovieAngleRange | null | undefined =
      DEFAULT_HUMANOID_ROM[bone]?.twist;
    if (range === null || range === undefined)
      throw new Error(`The range-of-motion table gives the ${bone} no twist`);
    return range;
  }
}

/*
 * The alternatives of `TwistBone`'s site.
 */
type TwistBone = "chest" | "spine";
