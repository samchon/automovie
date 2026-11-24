import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanLadder,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";

/** The alternatives of `OfContext`'s site. */
type OfContext = "prop" | "start";

/**
 * A ladder as a climb reads it off the scene's prop: a fixture whose rungs are
 * its `rung1` upward, each a bar facing the climber (`createLadder`'s
 * contacts), placed where the scene stands it.
 */
export namespace HumanLadder {
  /**
   * A rung's radius, metres, when the ladder's rung declares no aperture
   * (provisional).
   */
  export const RUNG: number = 0.015;

  /**
   * The most the rungs' line may lean from upright, degrees (provisional): a
   * fixed ladder's.
   */
  export const UPRIGHT: number = 5;

  /**
   * The ladder a prop declares, where it stands at a film second.
   *
   * @param context The action's context.
   * @param subject The ladder's prop subject.
   * @returns The ladder.
   * @throws {HumanRefusal} When the prop is no fixture, declares fewer than two
   *   rungs, leans more than `UPRIGHT` or spaces its rungs outside OSHA's
   *   band.
   */
  export function of(
    context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
    subject: string,
  ): IAutoMovieMotionHumanLadder.ILadder {
    const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
    if (read.prop.fixed !== true)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "ladder",
        value: subject,
        feasible: null,
        reason: `${subject} is not a fixture, so the hands that grip its rungs would carry it off`,
        fix: "place the ladder as a fixture (`fixed: true`)",
      });
    const frame: IAutoMovieRigidTransform = read.frame(context.start);
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
    const world: (local: IAutoMovieVector3) => IAutoMovieVector3 = (
      local: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
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
      (Math.acos(Math.min(1, Math.max(-1, rise.y / spacing))) * 180) / Math.PI;
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
    ladder: IAutoMovieMotionHumanLadder.ILadder,
    index: number,
    x: number,
  ): IAutoMovieVector3 {
    return HumanFrame.point(ladder.frame, {
      x,
      y: index * ladder.spacing,
      z: ladder.ahead,
    });
  }

  /**
   * Prepare the fixed rung grid read by one climb's footprint/handhold plan.
   *
   * @param ladder The unchanged resolved ladder at the action's start.
   * @returns A fresh world-metre rung centre for a rung index and local lateral
   *   x in metres.
   */
  export function prepareRung(
    ladder: IAutoMovieMotionHumanLadder.ILadder,
  ): (index: number, x: number) => IAutoMovieVector3 {
    const frame: HumanFrame.IPrepared = HumanFrame.prepare(ladder.frame);
    const spacing: number = ladder.spacing;
    const ahead: number = ladder.ahead;
    return (index: number, x: number): IAutoMovieVector3 =>
      frame.point({ x, y: index * spacing, z: ahead });
  }
}
