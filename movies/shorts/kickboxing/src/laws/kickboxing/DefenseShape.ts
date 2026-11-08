import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IBoutPosture } from "./IBoutPosture";
import type { IFighterMeasure } from "./IFighterMeasure";
import type { KickboxingAction } from "./KickboxingAction";
import { KickboxingTechnique } from "./KickboxingTechnique";
import { KickboxingTiming } from "./KickboxingTiming";
import { blendPosture } from "./blendPosture";

/**
 * Shape priors of the answers in the receiver's own root frame: the defending
 * limb closes the attacked corridor, or the body leaves the punch's line, and
 * everything returns to the guard after the attack. A landed blow (`take`)
 * moves the struck region away from the blow and shows strain on the face.
 * The engagement rises from the answer's onset, the attack's launch plus its
 * drawn lateness, to the instant its class needs it complete (the contact,
 * or a habit's earlier instant), up to its drawn coverage; it holds while a
 * feint returns and falls over the answer's own return.
 *
 * ```ts
 * DefenseShape.posture({ measure, guard, rest, answer, attack, lead, seconds, scale, onset, ready, coverage });
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#defenses The body-frame shape of each defense.
 * @evidence docs/research/kickboxing/exchanges.md#outcomes A landed blow moves the struck region away from it.
 * @evidence docs/body/settings/cast/fighter-b.md#defense Parries return to the cheek; covers close the head corridor; body blocks turn the near elbow and forearm onto the ribs; slips and rolls use knees, hips and trunk with the eyes on the opponent.
 */
export namespace DefenseShape {
  /** Side bend of a slip, degrees: the thoracic range's limit, so the head clears a glove width. */
  const SLIP_BEND: number = 15;

  /** Trunk flexion of a roll under a hook, degrees: two thirds of the thoracic range. */
  const ROLL_FLEXION: number = 20;

  /** Trunk extension of a sway, degrees: the thoracic range's limit. */
  const SWAY_EXTENSION: number = 10;

  /** Check: hip flexion and abduction of the raised lead leg, degrees (Evolve checking guide: lift and turn the shin out). */
  const CHECK_HIP: { flexion: number; abduction: number } = {
    flexion: 60,
    abduction: 20,
  };

  /** Reaction of a landed blow: cervical turn and side bend away from a head blow, trunk flexion over a body blow, degrees, at full strength. */
  const REACTION: { neck: number; trunk: number } = { neck: 20, trunk: 15 };

  /** Inputs of one answer's posture. */
  export interface IInput {
    /** The receiver's measure. */
    measure: IFighterMeasure;

    /** His guard posture. */
    guard: IBoutPosture;

    /** Body-frame ankle points of his planted feet now. */
    rest: Record<"left" | "right", IAutoMovieVector3>;

    /** The answer. */
    answer: KickboxingAction.Answer;

    /** The attack it answers. */
    attack: KickboxingTechnique.Name;

    /** Seconds from the attack's launch to its contact. */
    lead: number;

    /** Seconds since the answer began, at the attack's launch. */
    seconds: number;

    /** Strength of a landed blow's reaction in [0, 1], drawn by the caller within the variation law. */
    scale: number;

    /** Seconds after the attack's launch the answer starts moving: its drawn lateness. */
    onset: number;

    /** Seconds after the attack's launch by which the answer is complete: the contact, or a habit's earlier instant. */
    ready: number;

    /** Share of the full defensive shape reached, drawn by the caller within the variation law. */
    coverage: number;
  }

  /**
   * The receiver's posture during an answer, or null after it.
   *
   * @param input The answer and the instant.
   * @returns The posture.
   * @evidence docs/research/kickboxing/techniques.md#defenses A defense begins at the attack's launch and completes by its contact.
   */
  export function posture(input: IInput): IBoutPosture | null {
    const spec: KickboxingTechnique.ISpec =
      KickboxingTechnique.table[input.attack];
    const tail: number = KickboxingTiming.answerTail(
      input.answer,
      input.attack,
    );
    const hold: number = spec.shows
      ? KickboxingTiming.delivery(input.attack)
      : 0;
    const t: number = input.seconds;
    if (t >= input.lead + tail) return null;
    const engagement: number =
      input.answer === "take"
        ? t < input.lead
          ? 0
          : 1 - ease((t - input.lead) / tail)
        : t < input.ready
          ? ease((t - input.onset) / (input.ready - input.onset))
          : t < input.lead + hold
            ? 1
            : 1 - ease((t - input.lead - hold) / (tail - hold));
    return blendPosture(
      input.guard,
      shape(input, KickboxingTechnique.performed(spec)),
      engagement * (input.answer === "take" ? 1 : input.coverage),
      input.rest,
    );
  }

  /** The fully engaged answer. */
  function shape(input: IInput, spec: KickboxingTechnique.ISpec): IBoutPosture {
    const { measure, guard } = input;
    // The attacked side faces the throwing limb: the receiver's opposite side.
    const side: "left" | "right" = KickboxingTechnique.opposite(spec.side);
    const sign: 1 | -1 = side === "left" ? 1 : -1;
    const head: number = measure.head - guard.drop;
    const cheek = guard.hands[side];
    switch (input.answer) {
      case "parry":
        // The rear glove meets the incoming line across the face and turns it aside.
        return {
          ...guard,
          hands: {
            ...guard.hands,
            right: {
              point: Vector3.add(guard.hands.right.point, {
                x: measure.gloveRadius * 2,
                y: 0,
                z: measure.headRadius,
              }),
            },
          },
        };
      case "cover":
        return {
          ...guard,
          hands: {
            ...guard.hands,
            [side]: {
              point: {
                x: measure.headRadius * 0.5,
                y: head - (spec.line === "rising" ? measure.headRadius : 0),
                z: sign * (measure.headRadius + measure.gloveRadius * 0.5),
              },
              elbow: {
                x: measure.headRadius,
                y: measure.shoulder - guard.drop - measure.headRadius * 2,
                z: sign * measure.shoulderHalfWidth * 0.8,
              },
            },
          },
        };
      case "elbow-block":
        return {
          ...guard,
          thoracic: {
            ...guard.thoracic,
            lateralFlexion:
              guard.thoracic.lateralFlexion + (sign * SLIP_BEND) / 2,
          },
          hands: {
            ...guard.hands,
            [side]: {
              point: {
                x: cheek.point.x * 0.6,
                y: measure.shoulder - guard.drop,
                z: sign * measure.shoulderHalfWidth * 0.6,
              },
              elbow: {
                x: measure.headRadius * 0.5,
                y:
                  measure.hip -
                  guard.drop +
                  (measure.shoulder - measure.hip) * 0.4,
                z: sign * measure.shoulderHalfWidth,
              },
            },
          },
        };
      case "high-block":
        return {
          ...guard,
          hands: {
            ...guard.hands,
            [side]: {
              point: {
                x: measure.headRadius * 0.3,
                y: head + measure.headRadius,
                z: sign * (measure.headRadius + measure.gloveRadius),
              },
              elbow: {
                x: measure.headRadius,
                y: measure.shoulder - guard.drop,
                z: sign * (measure.shoulderHalfWidth + measure.headRadius),
              },
            },
          },
        };
      case "slip": {
        // Outside the punch: toward the side of the throwing arm.
        return {
          ...guard,
          drop: guard.drop + measure.headRadius * 0.5,
          shift: { forward: 0, left: sign * measure.headRadius },
          thoracic: { ...guard.thoracic, lateralFlexion: sign * SLIP_BEND },
          lumbar: { ...guard.lumbar, lateralFlexion: (sign * SLIP_BEND) / 2 },
          cervical: {
            ...guard.cervical,
            lateralFlexion: (-sign * SLIP_BEND) / 2,
          },
        };
      }
      case "roll":
        return {
          ...guard,
          drop: guard.drop + measure.headRadius * 1.5,
          thoracic: {
            ...guard.thoracic,
            flexion: ROLL_FLEXION,
            lateralFlexion: (-sign * SLIP_BEND) / 2,
          },
          lumbar: { ...guard.lumbar, flexion: ROLL_FLEXION / 2 },
          cervical: { ...guard.cervical, flexion: -ROLL_FLEXION / 2 },
        };
      case "sway":
        return {
          ...guard,
          shift: { forward: -measure.headRadius, left: 0 },
          thoracic: { ...guard.thoracic, flexion: -SWAY_EXTENSION },
          lumbar: { ...guard.lumbar, flexion: -SWAY_EXTENSION },
        };
      case "check": {
        const f: number = (CHECK_HIP.flexion * Math.PI) / 180;
        const a: number = (CHECK_HIP.abduction * Math.PI) / 180;
        const hip: IAutoMovieVector3 = {
          x: 0,
          y: measure.hip - guard.drop,
          z: measure.hipHalfWidth,
        };
        const knee: IAutoMovieVector3 = Vector3.add(
          hip,
          Vector3.scale(
            Vector3.normalize({
              x: Math.sin(f),
              y: -Math.cos(f),
              z: Math.sin(a),
            }),
            measure.thigh,
          ),
        );
        return {
          ...guard,
          feet: {
            ...guard.feet,
            left: {
              point: Vector3.add(knee, {
                x: -measure.shank * 0.2,
                y: -measure.shank,
                z: measure.shank * 0.2,
              }),
              knee,
            },
          },
        };
      }
      case "take": {
        // The struck region gives way from the blow.
        const s: number = input.scale;
        if (spec.level === "head")
          return {
            ...guard,
            cervical: {
              ...guard.cervical,
              rotation: guard.cervical.rotation - sign * REACTION.neck * s,
              lateralFlexion:
                -sign *
                REACTION.neck *
                s *
                (spec.line === "descending" ? 1.5 : 0.5),
              flexion:
                guard.cervical.flexion -
                (spec.line === "straight" || spec.line === "rising"
                  ? REACTION.neck * s
                  : 0),
            },
            shift: { forward: -measure.headRadius * s, left: 0 },
            wince: s,
          };
        if (spec.level === "body")
          return {
            ...guard,
            thoracic: {
              ...guard.thoracic,
              flexion: guard.thoracic.flexion + REACTION.trunk * s,
              lateralFlexion: sign * REACTION.trunk * s * 0.5,
            },
            hands: {
              ...guard.hands,
              [side]: {
                point: {
                  x: cheek.point.x * 0.5,
                  y: measure.shoulder - guard.drop,
                  z: sign * measure.shoulderHalfWidth * 0.6,
                },
              },
            },
            jaw: 10 * s,
            wince: s,
          };
        return {
          ...guard,
          drop: guard.drop + measure.headRadius * 0.5 * s,
          shift: { forward: 0, left: -sign * measure.headRadius * 0.5 * s },
          wince: s * 0.6,
        };
      }
    }
  }

  /** Smoothstep easing of a progress in [0, 1]. */
  function ease(t: number): number {
    const x: number = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }
}
