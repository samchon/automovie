import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieAffordance, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanHeld, IAutoMovieMotionHumanPlayWindInstrument, IAutoMovieMotionHumanPosture } from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { StrikingRoll } from "../../striking/internal/StrikingRoll";

/*
 * Default duration of the visible playing pose, an authoring convention in
 * seconds.
 */
const PLAY_SECONDS: number = 1;

/*
 * Small provisional angular freedom, in degrees, for the instrument's playing
 * attitude.
 */
const PLAY_CONE: number = 10;

/*
 * A held bugle is lifted, held with the mouthpiece at the lips and lowered. The
 * bell faces away along the reverse of the mouthpiece socket's axis. Yamaha's
 * brass playing guide places the mouthpiece at the center of the lips and shows
 * the bell ahead of the player in its side view
 * (https://www.yamaha.com/en/musical_instrument_guide/trumpet/play/). Register
 * this law explicitly to use it. Events are lift, atMouth and playEnd. The last
 * two mark the sustained playing pose.
 */
export namespace playWindInstrument {
  /*
   * Read the first mouthpiece socket in the held prop's local frame.
   */
  export function mouthpiece(
    held: Pick<IAutoMovieMotionHumanHeld.IHeld, "affordances"> | undefined,
    subject: string,
  ): IAutoMovieAffordance {
    const socket: IAutoMovieAffordance | undefined = held?.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === "mouthpiece" && a.kind === "socket",
    );
    if (socket === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "point",
        value: "mouthpiece",
        reason: `${subject} needs a mouthpiece socket for this cue`,
        fix: "use an instrument that declares a mouthpiece socket, such as the bugle",
      });
    return socket;
  }
  /*
   * Registered name.
   */
  export const name = "playWindInstrument";

  /*
   * This cue runs through its authored lowering phase.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /*
   * Plan a lift, sustained playing pose and return for the held instrument.
   * Parameter context: The entry state and authored cue.
   * Returns: A plan that keeps carrying the instrument after its return.
   * For invalid timing, an absent hold or socket, or an
   * infeasible arm pose.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPlayWindInstrument.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const side = params.hand ?? "right";
    const tool = StrikingHeld(context, side, params.prop, {
      tip: "mouthpiece",
    });
    const socket: IAutoMovieAffordance = mouthpiece(tool.held, params.prop);
    const region = body.surfaces.regions.mouth;

    // Every goal read places the mouth only, so the trunk is resolved for
    // the mouth's bone and its ancestry alone.
    const lips: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([region.bone]);
    const mouth = (posture: IAutoMovieMotionHumanPosture) => {
      const bone = HumanTrunk.resolve(
        body,
        posture,
        undefined,
        undefined,
        lips,
      ).get(region.bone)!;
      return {
        ...AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(region, bone),
        rotation: bone.worldRotation,
      };
    };
    const initial = mouth(entry.posture);
    const from = context.prop(params.prop).frame(entry.seconds);
    const distance = Vector3.length(
      Vector3.subtract(
        initial.point,
        Vector3.add(
          from.position,
          Quaternion.rotateVector(from.rotation, socket.frame.translation),
        ),
      ),
    );
    const delay = HumanBound.least("delay", params.delay ?? 0, 0, "s");
    const prepare = HumanBound.above(
      "prepare",
      params.prepare ?? AutoMovieMotionHumanTiming.transport(distance),
      0,
      "s",
    );
    const seconds = HumanBound.above(
      "hold",
      params.hold ?? PLAY_SECONDS,
      0,
      "s",
    );
    const retract = HumanBound.above(
      "retract",
      params.retract ?? prepare,
      0,
      "s",
    );
    const atMouth = delay + prepare;
    const playEnd = atMouth + seconds;
    const clock = AutoMovieMotionClock(playEnd + retract, [
      { name: "lift", seconds: delay },
      { name: "atMouth", seconds: atMouth },
      { name: "playEnd", seconds: playEnd },
      { name: "relax", seconds: playEnd },
    ]);
    const base = AutoMovieMotionHumanBase.under(context, clock.duration);
    const posture = base.posture(atMouth);
    const site = mouth(posture);
    const frame = StrikingRoll.hand(
      context,
      tool,
      0,
      site.point,
      Vector3.scale(site.normal, -1),
      PLAY_CONE,
      posture,
    );
    const missed = StrikingRoll.miss(context, tool, frame, 0, posture);
    if (missed > StrikingRoll.MISS)
      throw new HumanRefusal({
        kind: "reach",
        axis: "grasp",
        value: missed,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: StrikingRoll.MISS,
          unit: "m",
        },
        reason: `the ${side} arm cannot bring ${params.prop} to the lips facing outward in this grip`,
        fix: "take the instrument by its grip for use at the mouth, or try the other hand",
      });

    const inverse = Quaternion.inverse(site.rotation);
    const local = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(frame.point, site.point),
    );
    const rotation = Quaternion.multiply(inverse, frame.rotation);
    const arm = AutoMovieMotionHumanArm.carried({
      body,
      side,
      from: 0,
      to: clock.duration,
      rest: AutoMovieMotionHumanArm.angles(entry.pose, side),
      span: {
        start: delay,
        ready: atMouth,
        relax: playEnd,
        end: clock.duration,
      },
      weight: (t) => clock.envelope(["lift", "atMouth"], ["playEnd", "end"], t),
      goal: (posture) => {
        const at = mouth(posture);
        return StrikingHeld.goal(
          context,
          tool,
          {
            point: Vector3.add(
              at.point,
              Quaternion.rotateVector(at.rotation, local),
            ),
            rotation: Quaternion.multiply(at.rotation, rotation),
          },
          0,
          AutoMovieMotionHumanBend.hang(body, posture, side),
        );
      },
    });
    const plan = composeAutoMovieMotionHumanAction({
      base,
      clock,
      primitives: [arm],
      contact: "atMouth",
    });
    return {
      ...plan,
      contacts: [...plan.contacts, ...StrikingHeld.grips(tool)],
      holds: StrikingHeld.holds(context, tool),
    };
  }
}
