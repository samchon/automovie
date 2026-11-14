import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * A ladder as a climb reads it off the scene's prop: a fixture whose rungs
 * are its `rung1` upward, each a bar facing the climber (`createLadder`'s
 * contacts), placed where the scene stands it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and from where.
 * @evidence contracts/development/design.md#principled-representation The ladder is its prop's own affordances, never numbers typed beside it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The resolved ladder, its reader, a rung's place and two constants.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A ladder a grip would carry, or one that leans, is refused rather than climbed.
 */
export namespace HumanLadder {
  /** A rung's radius, metres, when the ladder's rung declares no aperture (provisional). */
  export const RUNG: number = 0.015;

  /** The most the rungs' line may lean from upright, degrees (provisional): a fixed ladder's. */
  export const UPRIGHT: number = 5;
  /**
   * A ladder as the plan resolved it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The rungs' plane and spacing in the ladder's own floor frame, read off its prop at the start.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `rung` and the capture.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain numbers, each the prop's own.
   */
  export interface ILadder {
    /** The ladder's floor frame: origin at its foot under the rungs' middle, the heading the climber faces it by. */
    frame: HumanFrame.IFrame;

    /** The rungs' distance ahead in that frame, metres: 0, the frame's origin lying in their plane. */
    ahead: number;

    /** The rung spacing, metres. */
    spacing: number;

    /** How many rungs the ladder has. */
    count: number;

    /** A rung's radius, metres. */
    radius: number;

    /** The rungs' clear width between the rails, metres; unbounded when the rung declares no length. */
    width: number;
  }

  /**
   * The ladder a prop declares, where it stands at a film second.
   *
   * @param context The action's context.
   * @param subject The ladder's prop subject.
   * @returns The ladder.
   * @throws {HumanRefusal} When the prop is no fixture, declares fewer than two rungs, leans more than `UPRIGHT` or spaces its rungs outside OSHA's band.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each rung's frame carried into the world by the prop's frame; the spacing the first two rungs' distance, the heading the rung's outward `+Y` turned round, the foot one spacing below the first rung.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read, check, then build the frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A ladder a grip would carry is refused, never climbed while it flies off.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the prop's affordances.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    context: Pick<IHumanActionContext, "prop" | "start">,
    subject: string,
  ): ILadder {
    const read: IHumanActionContext.IProp = context.prop(subject);
    if (read.prop.fixed !== true)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "ladder",
        value: subject,
        feasible: null,
        reason: `${subject} is not a fixture, so the hands that grip its rungs would carry it off`,
        fix: "place the ladder as a fixture (`fixed: true`)",
      });
    const frame: IHumanProp.IFrame = read.frame(context.start);
    const rungs: IAutoMovieAffordance[] = (read.prop.affordances ?? [])
      .filter((a: IAutoMovieAffordance): boolean => /^rung\d+$/.test(a.id))
      .sort(
        (a: IAutoMovieAffordance, b: IAutoMovieAffordance): number =>
          Number(a.id.slice(4)) - Number(b.id.slice(4)),
      );
    if (rungs.length < 2)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "ladder",
        value: subject,
        feasible: {
          kind: "alternatives",
          values: (read.prop.affordances ?? []).map(
            (a: IAutoMovieAffordance): string => a.id,
          ),
        },
        reason: `${subject} declares ${rungs.length} rungs; a ladder climbed has at least two, named rung1 upward`,
        fix: "give the ladder rungs named rung1, rung2 and up",
      });
    const world = (local: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, local),
      );
    const first: IAutoMovieVector3 = world(rungs[0]!.frame.translation);
    const rise: IAutoMovieVector3 = Vector3.subtract(
      world(rungs[1]!.frame.translation),
      first,
    );
    const spacing: number = Vector3.length(rise);
    HumanBound.within("spacing", spacing, 0.25, 0.36, "m");
    const lean: number =
      (Math.acos(Math.min(1, Math.max(-1, rise.y / spacing))) * 180) /
      Math.PI;
    HumanBound.within("lean", lean, 0, UPRIGHT, "degrees");
    const out: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(frame.rotation, rungs[0]!.frame.rotation),
      { x: 0, y: 1, z: 0 },
    );
    return {
      frame: {
        origin: { ...first, y: first.y - spacing },
        yaw: (Math.atan2(-out.x, -out.z) * 180) / Math.PI,
      },
      ahead: 0,
      spacing,
      count: rungs.length,
      radius: (rungs[0]!.aperture ?? 2 * RUNG) / 2,
      width: rungs[0]!.length ?? Number.POSITIVE_INFINITY,
    };
  }

  /**
   * A rung's centre at a lateral place.
   *
   * @param ladder The ladder.
   * @param index The rung, 1 the lowest; 0 is the floor under the rungs.
   * @param x The lateral place in the ladder's frame, metres, `x` left.
   * @returns World metres.
   */
  export function rung(
    ladder: ILadder,
    index: number,
    x: number,
  ): IAutoMovieVector3 {
    return HumanFrame.point(ladder.frame, {
      x,
      y: index * ladder.spacing,
      z: ladder.ahead,
    });
  }
}
