import {
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
  superposeMinimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanSword,
  IAutoMovieMotionTarget,
  IAutoMovieSuperposeMinimumJerk,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * How a blade's landing follows a target that moves after the attack is
 * planned: the displacement to add to the hand at an action second so the
 * landing part meets the target where it is at the decisive instant.
 *
 * The attack is planned on the target as it stands at the action's start.
 * Its outcome is the author's (`IAutoMovieMotionHumanSword.IAttack.outcome`):
 * a landing is declared, so the blade meets the target where the target
 * stands at the decisive instant, as a choreographed exchange is rehearsed.
 * The target is read again there, on the displayed body of the person or on
 * the prop, and the change from the planned point is carried in by one
 * minimum-jerk unit over the attack (Flash and Henis 1991: a second unit
 * superposed on the first, not a re-planned movement), so the displacement
 * is zero at the start, continuous throughout and whole at the contact. The
 * row fixes no number: its only value is the attack's own duration, which is
 * the sword timing model's (`IAutoMovieMotionHumanSword`), and the follower
 * takes all of it, a minimum-jerk unit from the start to the contact. A
 * fixed point, or no target, is not followed.
 *
 * Two performers attacking each other read each other's bodies at the same
 * instant. The following moves only the hand, never the region a target
 * names on the trunk, so a read of this performer made while its own
 * following is being evaluated sees its body without that hand correction,
 * and the mutual reads end there. Reads made during schedule resolution can
 * see a half-placed performance, so the plan's settle drops them.
 *
 * @param context The attack's context.
 * @param planned The target point the attack was planned on, read at its start, world metres.
 * @param contact The decisive instant, seconds since the action's start; positive.
 * @returns The follower: the displacement at a second since the action's start, world metres, and the settle that drops its read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is followed, why the target is read at the decisive instant, the continuity, the mutual-read rule and the unfollowed targets.
 * @evidence contracts/development/implementation.md#principled-implementation A declared landing meets the target where it is at contact; the difference from the planned point is superposed as one minimum-jerk unit over the attack.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One read of the target at the contact, one superposed unit, a re-entrancy guard and a settle.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A stationary target gives a zero unit and the planned landing unchanged; a point target is not read at all.
 * @evidence contracts/development/implementation.md#efficient-algorithms One target read per settled plan, then constant work per second.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's surface placement and superposed minimum-jerk reader; the contact read is kept until the plan settles.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The follower retains one unit at most, dropped on settle and released with the plan.
 */
export function HumanSwordFollow(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSword.IAttack>,
  planned: IAutoMovieVector3,
  contact: number,
): HumanSwordFollow.IFollower {
  const target: IAutoMovieMotionTarget | undefined = context.params.target;
  if (target === undefined || target.kind === "point" || target.kind === "none")
    return {
      at: (): IAutoMovieVector3 => ({ x: 0, y: 0, z: 0 }),
      settle: (): void => {},
    };

  // A person's region is read on their displayed bones; a prop's point
  // through the context.
  let region: IAutoMovieHumanoidSurfaces.IFrame | undefined;
  const read = (at: number): IAutoMovieVector3 => {
    if (target.kind !== "person") return context.aim(target, at).point;
    const other: IAutoMovieMotionHumanPerformerReader = context.performer(
      target.subject,
    );
    region ??= other.body.surfaces.regions[target.region];
    return resolveAutoMovieHumanoidSurfaces.place(
      region,
      other
        .bones(at, new Set<AutoMovieHumanoidBone>([region.bone]))
        .get(region.bone)!,
    ).point;
  };
  let unit: IAutoMovieSuperposeMinimumJerk.IUnit | undefined;
  let busy: boolean = false;
  return {
    at: (seconds: number): IAutoMovieVector3 => {
      if (seconds <= 0 || busy) return { x: 0, y: 0, z: 0 };
      busy = true;
      try {
        unit ??= {
          displacement: Vector3.subtract(
            read(context.start + contact),
            planned,
          ),
          start: 0,
          duration: contact,
        };
        return superposeMinimumJerk.position(
          { x: 0, y: 0, z: 0 },
          [unit],
          seconds,
        );
      } finally {
        busy = false;
      }
    },
    settle: (): void => {
      unit = undefined;
    },
  };
}

/**
 * Companion types of {@link HumanSwordFollow}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the follower's two members.
 * @evidence contracts/development/design.md#principled-representation A displacement reader in world metres by action seconds and a settle with no inputs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The thrust and the cut give the displacement to their stroke and forward their plan's settle.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector.
 */
export namespace HumanSwordFollow {
  /** A blade's landing follower. */
  export interface IFollower {
    /** The displacement to add to the hand at a second since the action's start, world metres. */
    at: (seconds: number) => IAutoMovieVector3;

    /** Drop the read made before the performance settled. */
    settle: () => void;
  }
}
