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
 * The attack is planned on the target as it stands at the action's start. Its
 * outcome is the author's (`IAutoMovieMotionHumanSword.IAttack.outcome`): a
 * landing is declared, so the blade meets the target where the target stands at
 * the decisive instant, as a choreographed exchange is rehearsed. The target is
 * read again there, on the displayed body of the person or on the prop, and the
 * change from the planned point is carried in by one minimum-jerk unit over the
 * attack (Flash and Henis 1991: a second unit superposed on the first, not a
 * re-planned movement), so the displacement is zero at the start, continuous
 * throughout and whole at the contact. The row fixes no number: its only value
 * is the attack's own duration, which is the sword timing model's
 * (`IAutoMovieMotionHumanSword`), and the follower takes all of it, a
 * minimum-jerk unit from the start to the contact. A fixed point, or no target,
 * is not followed.
 *
 * Two performers attacking each other read each other's bodies at the same
 * instant. The following moves only the hand, never the region a target names
 * on the trunk, so a read of this performer made while its own following is
 * being evaluated sees its body without that hand correction, and the mutual
 * reads end there. The target is read once, as the plan is made, the read
 * placing the partner first in the schedule's demand order; settle keeps
 * nothing to drop.
 *
 * @param context The attack's context.
 * @param planned The target point the attack was planned on, read at its start,
 *   world metres.
 * @param contact The decisive instant, seconds since the action's start;
 *   positive.
 * @returns The follower: the displacement at a second since the action's start,
 *   world metres, and a settle with nothing left to drop.
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

  // The target where it is at the decisive instant, read once as the plan is
  // made: a person's region on their displayed bones (the read places that
  // person first in the schedule's demand order), a prop's point through the
  // context.
  const point: IAutoMovieVector3 = ((): IAutoMovieVector3 => {
    if (target.kind !== "person")
      return context.aim(target, context.start + contact).point;
    const other: IAutoMovieMotionHumanPerformerReader = context.performer(
      target.subject,
    );
    const region: IAutoMovieHumanoidSurfaces.IFrame =
      other.body.surfaces.regions[target.region];
    return resolveAutoMovieHumanoidSurfaces.place(
      region,
      other
        .bones(
          context.start + contact,
          new Set<AutoMovieHumanoidBone>([region.bone]),
        )
        .get(region.bone)!,
    ).point;
  })();
  const unit: IAutoMovieSuperposeMinimumJerk.IUnit = {
    displacement: Vector3.subtract(point, planned),
    start: 0,
    duration: contact,
  };
  return {
    at: (seconds: number): IAutoMovieVector3 =>
      seconds <= 0
        ? { x: 0, y: 0, z: 0 }
        : superposeMinimumJerk.position({ x: 0, y: 0, z: 0 }, [unit], seconds),
    settle: (): void => {},
  };
}

/** Companion types of {@link HumanSwordFollow}. */
export namespace HumanSwordFollow {
  /** A blade's landing follower. */
  export interface IFollower {
    /**
     * The displacement to add to the hand at a second since the action's start,
     * world metres.
     */
    at: (seconds: number) => IAutoMovieVector3;

    /** Drop the read made before the performance settled. */
    settle: () => void;
  }
}
