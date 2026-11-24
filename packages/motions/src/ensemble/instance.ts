import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieMotionHumanActionKey,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanInstance,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { HumanRefusal } from "../law/HumanRefusal";

/**
 * An instanced member: a performer that displays a template member's placed
 * posture, read whole film frames earlier and moved rigidly by the offset it
 * stands at from the template, so a rear rank marching with its front rank
 * costs no plans and no fits of its own.
 *
 * At its start the law reads where it stands relative to the template, in the
 * template's heading frame: an offset and a turn. Each posture is the
 * template's at `t - shift / 24` with the root, every limb goal's world point
 * and bend, and every goal's rotation moved by that offset and turn about the
 * template's root; a goal's contact lies in its end joint's own rest frame and
 * turns with the joint, so it is kept; joint angles are the template's. So the
 * instance's feet are planted where the template's are, moved, and a gaze layer
 * on it still looks at its own target. The move stays rigid only while the
 * template keeps its heading, so a span in which the template turns by more
 * than `TURN` refuses (a wheel needs full members), and so does a template on
 * another body, whose limbs the instance would carry. A goal attached to a bone
 * is in that bone's frame and is kept; a goal that keeps clear of or rests on
 * world colliders is refused, since those belong to the template's place. The
 * instance gives up its own per-step draws for one whole-frame shift: the
 * declared price of `IHumanEnsemble.detail`.
 *
 * Its contact windows are none: a planted goal it carries is the template's,
 * moved, and the slip of an instance is the template's own.
 */
export namespace instance {
  /** The law's name. */
  export const name: AutoMovieMotionHumanActionKey = "instance";

  /**
   * Degrees the template may turn over the span before the move is no longer
   * rigid (provisional: a degree moves a member a metre out by under 2 cm).
   */
  export const TURN: number = 1;

  /** The film's frame rate, frames a second, the unit of `shift`. */
  export const RATE: number = 24;

  /** The cuts: any action may follow it at any instant, inertialized. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [
      {
        window: [0, 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /**
   * Plan an instance.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the template is on another body, turns over the
   *   span, or carries a goal kept clear of world colliders.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanInstance.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanInstance.IParams = context.params;
    const shift: number = p.shift ?? 0;
    if (!(p.duration > 0) || !(shift % 1 === 0 && shift >= 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis: p.duration > 0 ? "shift" : "duration",
        value: p.duration > 0 ? shift : p.duration,
        reason:
          "an instance lasts a positive time and lags by a whole number of frames",
        fix: "give a positive span and a whole, nonnegative shift",
      });
    const template: IAutoMovieMotionHumanPerformerReader = context.performer(
      p.of,
    );
    const read:
      | ((seconds: number) => IAutoMovieMotionHumanPosture)
      | undefined = template.posture?.bind(template);
    if (template.body !== context.body || read === undefined)
      throw new HumanRefusal({
        kind: "participant",
        axis: "of",
        value: p.of,
        reason:
          read === undefined
            ? `${p.of}'s placed posture cannot be read here`
            : `${p.of} is on another body, whose limbs the instance would carry`,
        fix: "instance a template of the same body from the same pool",
      });
    const lag: number = shift / RATE;
    const at = (t: number): IAutoMovieMotionHumanPosture =>
      read(context.start + t - lag);

    // The template keeps its heading over the span, read every film frame.
    const first: IAutoMovieMotionHumanPosture = at(0);
    for (let k: number = 1; k <= Math.ceil(p.duration * RATE); ++k) {
      const yaw: number = at(Math.min(p.duration, k / RATE)).yaw;
      const turned: number = Math.abs(
        ((((yaw - first.yaw + 180) % 360) + 360) % 360) - 180,
      );
      if (turned > TURN)
        throw new HumanRefusal({
          kind: "participant",
          axis: "of",
          value: p.of,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: TURN,
            unit: "degrees",
          },
          reason: `${p.of} turns ${turned.toFixed(1)} degrees ${(k / RATE).toFixed(3)} s into the span, so a rigid copy would no longer stand in its place`,
          fix: "perform the member in full through the turn",
        });
    }

    // The offset and turn the instance stands at, in the template's frame.
    const here: IAutoMovieVector3 = context.entry.posture.root;
    const turn: number = context.entry.posture.yaw - first.yaw;
    const offset: IAutoMovieVector3 = rotate(
      { x: here.x - first.root.x, y: 0, z: here.z - first.root.z },
      -first.yaw,
    );
    const spin: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      turn,
    );
    return {
      duration: p.duration,
      events: [],
      contacts: [],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: IAutoMovieMotionHumanPosture = at(
          Math.min(p.duration, Math.max(0, seconds)),
        );
        const root: IAutoMovieVector3 = add(t.root, rotate(offset, t.yaw));
        const move = (point: IAutoMovieVector3): IAutoMovieVector3 =>
          add(root, rotate(sub(point, t.root), turn));
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
        for (const [limb, goal] of Object.entries(t.limbs) as [
          AutoMovieHumanLimb,
          IAutoMovieHumanLimbGoal,
        ][]) {
          if (goal.clear !== undefined || goal.rests !== undefined)
            throw new HumanRefusal({
              kind: "participant",
              axis: "of",
              value: p.of,
              reason: `${p.of}'s ${limb} keeps clear of or rests on colliders of its own place`,
              fix: "perform the member in full while its limbs work against the scene",
            });
          limbs[limb] =
            goal.on !== undefined
              ? goal
              : {
                  ...goal,
                  point: move(goal.point),
                  bend: move(goal.bend),
                  ...(goal.rotation === undefined
                    ? {}
                    : { rotation: Quaternion.multiply(spin, goal.rotation) }),
                };
        }
        return { ...t, root, yaw: t.yaw + turn, limbs };
      },
    };
  }
}

/** A floor-plan vector turned by a heading, degrees: 90 takes +Z to +X. */
function rotate(v: IAutoMovieVector3, degrees: number): IAutoMovieVector3 {
  const h: number = (degrees * Math.PI) / 180;
  const c: number = Math.cos(h);
  const s: number = Math.sin(h);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}

/** The sum of two vectors. */
function add(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/** The difference of two vectors. */
function sub(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
