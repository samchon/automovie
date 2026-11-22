import { DEFAULT_HUMANOID_ROM, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAngleRange,
  IAutoMovieBodyMeasure,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanWeaponPresent } from "./HumanWeaponPresent";

/**
 * A mounted presentation: a rider seated in the saddle turns the trunk toward a target before the arms present to it, since the seat and the legs keep the pelvis facing the horse's travel.
 *
 * A standing presentation reaches `HumanWeaponPresent.TURN` off the heading by the arms alone. In the saddle the trunk adds its own axial rotation, which `StrikingBlade.turned` splits `AutoMovieMotionHumanTrunk.CHEST` to the chest and the rest to the lumbar spine, so a rider presents as far off the horse's heading as the chest's and the spine's axial ranges (`DEFAULT_HUMANOID_ROM`, the bound `HumanSupportAim` keeps a moving support's aim within) allow plus the arms' own `TURN`, which reaches behind the rider's shoulders, short of dead astern: there the horse must turn.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what turns, why the pelvis stays and how far the presentation reaches.
 * @evidence contracts/development/design.md#principled-representation Degrees of turn and of bearing, positive toward the performer's left, from the range-of-motion table's twist limits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `range`, `bearing`, `turn` and `station`: a seated weapon presentation reads the turn (`HumanWeaponPose`), a mounted arm reads the station.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No typed turn: the range is the range-of-motion table's chest and spine twists.
 */
export namespace HumanMountedPresentation {
  /**
   * The trunk turn a body can take to each side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each side's unit and sign.
   * @evidence contracts/development/design.md#principled-representation Two degrees, the left positive and the right negative.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `range` and read by `turn`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRange {
    /** The largest turn to the performer's left, degrees, at least 0. */
    left: number;

    /** The largest turn to the performer's right, degrees, at most 0. */
    right: number;
  }

  /**
   * The trunk turn the chest's and the spine's axial ranges allow to each side.
   *
   * @returns Each side's largest turn.
   * @throws {Error} When the range-of-motion table gives the chest or the spine no twist.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the sides and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation A turn of T twists the chest by CHEST times T and the spine by the rest, so the largest turn is the lesser of each joint's limit over its share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bound per side from two joint limits.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A table without a trunk twist fails rather than assuming one.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read of a constant table.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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

  /**
   * A target's signed bearing off a heading on the floor.
   *
   * @param heading The heading, degrees about `+Y` from `+Z`, positive toward `+X`.
   * @param from The point the bearing is read from, world metres.
   * @param target The target, world metres.
   * @returns Degrees from -180 to 180, positive toward the performer's left.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the convention and the range.
   * @evidence contracts/development/implementation.md#principled-implementation The floor direction to the target, read against the heading's forward and its left.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One arctangent.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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

  /**
   * The trunk turn a seated presentation takes so a target lies within the arms' presentation.
   *
   * @param off The target's signed bearing off the seat's heading, degrees, positive to the left.
   * @param held The trunk turn the presentation already takes, degrees, such as a shouldered long gun's blade; the sum stays within `range`.
   * @param side The presenting arm.
   * @param axis The refused parameter's name.
   * @returns The turn, degrees, positive to the left, toward the target: on the presenting arm's side, 0 within the arms' `TURN` and the excess past it; across the body, the whole bearing as far as the trunk's range allows, the arms taking the rest.
   * @throws {HumanRefusal} A `reach` refusal on `axis` when the bearing lies past the trunk's range and the arms' `TURN` on its side, naming the bearing and the feasible bearings.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result, its sign, both sides and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The arms present within `TURN` of the chest's facing on their own side, so the trunk turns by whatever of the bearing exceeds it there; an arm does not present across the chest, so for a target on the other side the trunk turns toward it by its whole bearing up to its range, and only the rest is the arms'; with the turn already held, the sum stays within the range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One side test, one turn and one bound.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target beyond the reach is refused, never presented to at a clamped bearing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
      throw new HumanRefusal({
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

  /**
   * A mounted arm's station toward a target in the seat frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The trunk's turn and three seat-frame vectors.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `station`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IStation {
    /** The trunk's turn toward the target, degrees, positive to the left (`turn`). */
    turn: number;

    /** The arm's shoulder on the turned trunk, seat-frame metres. */
    shoulder: IAutoMovieVector3;

    /** The hand's place `reach` along the line from the shoulder to the target, seat-frame metres. */
    grip: IAutoMovieVector3;

    /** The unit line from the shoulder to the target, in the seat frame. */
    axis: IAutoMovieVector3;
  }

  /**
   * Where a seated arm presents toward a target: the trunk turned by `turn` about the seat's vertical through the root, the arm's shoulder on it, and the hand `reach` along the line from that shoulder to the target.
   *
   * @param measure The rider's measures.
   * @param root The seated root, seat-frame metres (forward `+Z`, left `+X`, up `+Y`).
   * @param side The presenting arm.
   * @param target The target, seat-frame metres.
   * @param reach How far along the line the hand lies, metres.
   * @param axis The refused parameter's name.
   * @returns The station.
   * @throws {HumanRefusal} As `turn` does, on the target's bearing from the root.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, each step and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The bearing off the seat's forward gives the trunk's turn; the shoulder sits half the shoulders' width to its side at the shoulders' height over the hips, turned with the trunk; the hand lies on the shoulder's line to the target.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Bearing, turn, shoulder, line.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target past the trunk's turn is refused by `turn`, never clamped; a target at the shoulder has no line and fails.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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

  /** A trunk joint's axial range from the range-of-motion table. */
  function twist(bone: "chest" | "spine"): IAutoMovieAngleRange {
    const range: IAutoMovieAngleRange | null | undefined =
      DEFAULT_HUMANOID_ROM[bone]?.twist;
    if (range === null || range === undefined)
      throw new Error(`The range-of-motion table gives the ${bone} no twist`);
    return range;
  }
}
