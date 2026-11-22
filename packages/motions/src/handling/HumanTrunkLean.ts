import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { pickUp } from "./pickUp";

/**
 * A trunk leaned forward from the hips to bring work within the arms: the
 * spine and the chest flexed together by the least of a set of steps that
 * puts every asked wrist within its arm's reach from the leaned shoulder.
 * A potter leans over the wheel, a kneeling helper over the person lying
 * before them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the lean, how it is shared and how its depth is chosen.
 * @evidence contracts/development/design.md#principled-representation Degrees of trunk flexion and the wrists a law asks, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The lean, its steps and the search the laws share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Work beyond the deepest step is refused by the reach owner, never clamped.
 */
export namespace HumanTrunkLean {
  /** The leans tried, degrees, least first: provisional steps up to a deep seated or kneeling lean. */
  export const LEANS: readonly number[] = [0, 10, 20, 30, 40, 50, 60];

  /** The deepest of `LEANS`. */
  export const DEEPEST: number = 60;

  /**
   * A posture with its trunk flexed forward, shared between the spine and the chest.
   *
   * @param posture The posture.
   * @param degrees The added flexion, degrees.
   * @returns The leaned posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the split.
   * @evidence contracts/development/implementation.md#principled-implementation Half the flexion on each of the two trunk bones, added to what they hold.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two additions.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every law that leans into work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function lean(
    posture: IAutoMovieMotionHumanPosture,
    degrees: number,
  ): IAutoMovieMotionHumanPosture {
    const add: (bone: TrunkBone) => readonly [number, number, number] = (
      bone: TrunkBone,
    ): readonly [number, number, number] => {
      const was: readonly [number, number, number] = posture.joints[bone] ?? [
        0, 0, 0,
      ];
      return [was[0] + degrees / 2, was[1], was[2]];
    };
    return {
      ...posture,
      joints: { ...posture.joints, spine: add("spine"), chest: add("chest") },
    };
  }

  /**
   * The least lean that brings every asked wrist within its arm, refused
   * at the deepest when none does.
   *
   * @param context The action's context.
   * @param wrists The wrists asked, each with its arm and attitude.
   * @returns The lean, degrees.
   * @throws {HumanRefusal} When even the deepest lean leaves a wrist beyond its arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the search and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The reach owner's predicate on the leaned entry posture, step by step.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the first step that reaches, else refuse from the deepest.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refused by the reach owner, never clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most the steps times the wrists.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `pickUp.reaches` and `pickUp.reachable`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function least(
    context: IAutoMovieMotionHumanActionContext<object>,
    wrists: readonly IWrist[],
  ): number {
    const reaches: (degrees: number) => boolean = (degrees: number): boolean =>
      wrists.every((w: IWrist): boolean =>
        pickUp.reaches(
          context,
          w.side,
          lean(context.entry.posture, degrees),
        )({
          point: w.point,
          rotation: w.rotation,
        }),
      );
    const found: number | undefined = LEANS.find(reaches);
    if (found !== undefined) return found;
    for (const w of wrists)
      pickUp.reachable(
        context,
        w.side,
        w.point,
        lean(context.entry.posture, DEEPEST),
      );
    return DEEPEST;
  }

  /**
   * The trunk's bones a lean flexes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two bones.
   * @evidence contracts/development/design.md#principled-representation A closed union of skeleton bone names.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What lean flexes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only the two trunk bones.
   */
  export type TrunkBone = "spine" | "chest";

  /**
   * A wrist a law asks of an arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the arm, the point and the attitude.
   * @evidence contracts/development/design.md#principled-representation World metres and a world attitude.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `least` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every member is required.
   */
  export interface IWrist {
    /** The arm. */
    side: AutoMovieHumanSide;

    /** The wrist, world metres. */
    point: IAutoMovieVector3;

    /** The hand's attitude, world. */
    rotation: IAutoMovieQuaternion;
  }
}
