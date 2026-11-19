import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPlayWindInstrument,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingRoll } from "../striking/StrikingRoll";

/** Default duration of the visible playing pose, an authoring convention in seconds. */
const PLAY_SECONDS: number = 1;

/** Small provisional angular freedom, in degrees, for the instrument's playing attitude. */
const PLAY_CONE: number = 10;

/**
 * A held bugle is lifted, held with the mouthpiece at the lips and lowered.
 * The bell faces away along the reverse of the mouthpiece socket's axis.
 * Yamaha's brass playing guide places the mouthpiece at the center of the
 * lips and shows the bell ahead of the player in its side view
 * (https://www.yamaha.com/en/musical_instrument_guide/trumpet/play/).
 * Register this law explicitly to use it. Events are lift, atMouth and
 * playEnd. The last two mark the sustained playing pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the visible action, source, event interval and registration.
 * @evidence contracts/development/design.md#principled-representation The modeled socket's point and axis specify the held object pose throughout the playing interval.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One opt-in law for a held instrument with a mouthpiece socket.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The action keeps the held frame and starts from the rendered mouthpiece.
 */
export namespace playWindInstrument {
  /** Registered name. */
  export const name = "playWindInstrument";

  /** This cue runs through its authored lowering phase. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /**
   * Plan a lift, sustained playing pose and return for the held instrument.
   *
   * @param context The entry state and authored cue.
   * @returns A plan that keeps carrying the instrument after its return.
   * @throws {HumanRefusal} For invalid timing, an absent hold or socket, or an infeasible arm pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, result and refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Fits the mouthpiece point and line together, in the mouth's frame, then carries the holding arm on a phrase clock.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the grip and mouth, validate the timed phases, fit the pose and compose the carry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The real mouthpiece socket is required and its rigid frame survives lift, hold and return.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the held-tool point and axis fit, arm trajectory and grip persistence.
   * @evidence contracts/development/implementation.md#efficient-algorithms The roll and lean search runs once, and a sampled goal reads the mouth's trunk frame.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the timing, rigid goal and held instrument data.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPlayWindInstrument.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params } = context;
    const side = params.side ?? "right";
    const tool = StrikingHeld.of(context, side, params.prop, {
      tip: "mouthpiece",
    });
    if (
      !tool.held?.affordances.some(
        (a) => a.id === "mouthpiece" && a.kind === "socket",
      )
    )
      throw new HumanRefusal({
        kind: "affordance",
        axis: "point",
        value: "mouthpiece",
        reason: `${params.prop} needs a mouthpiece socket for this cue`,
        fix: "use an instrument that declares a mouthpiece socket, such as the bugle",
      });
    const region = body.surfaces.regions.mouth;
    const mouth = (posture: IAutoMovieMotionHumanPosture) => {
      const bone = HumanTrunk.resolve(body, posture).get(region.bone)!;
      return {
        ...resolveAutoMovieHumanoidSurfaces.place(region, bone),
        rotation: bone.worldRotation,
      };
    };
    const initial = mouth(entry.posture);
    const from = context.prop(params.prop).frame(entry.seconds);
    const socket = tool.held.affordances.find((a) => a.id === "mouthpiece")!;
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
      "seconds",
      params.seconds ?? PLAY_SECONDS,
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
    const clock = AutoMovieMotionClock.of(playEnd + retract, [
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
