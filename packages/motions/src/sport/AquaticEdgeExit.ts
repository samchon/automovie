import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { AquaticPosture } from "./AquaticPosture";

/** Seconds of the whole exit: provisional. */
const DURATION: number = 3.2;

/** Shares of the phases: hands placed, pressed up, knee on the deck, standing. */
const PLACE: number = 0.2;
const PRESS: number = 0.5;
const KNEE: number = 0.75;

/** The highest deck above the water a swimmer presses out over unaided, metres: provisional, about a forearm. */
const FREEBOARD: number = 0.5;

/** Palms this far behind the edge on the deck and this far either side, metres: provisional. */
const PALM_BACK: number = 0.12;
const PALM_SIDE: number = 0.25;

/** The palm comes down onto the deck from this high, metres: provisional. */
const LIFT: number = 0.15;

/** The swimmer stands this far behind the edge, metres: provisional. */
const STAND_BACK: number = 0.45;

/**
 * Climb out over a pool's edge unaided, as a swimmer does at a deck a
 * forearm or less above the water: both palms go onto the deck behind the
 * edge (`hands`), the arms press the body up until the hips clear the deck
 * (`pressed`), a knee comes onto the deck (`knee`), and the swimmer stands
 * on the deck behind the edge (`standing`). The palms bear from `hands`
 * until the knee is down, so the hands load before the body rises. A deck
 * higher above the water than `FREEBOARD` is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases, the hand loading, the frames and the refusal.
 * @evidence contracts/development/design.md#principled-representation Clinical keys placed by the hips relative to the prop's own edge frame, with palm and sole goals on the deck.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the unaided exit; an assisted lift is the rescue's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The deck height and edge come from the named prop's contacts, never from parameters.
 */
export namespace AquaticEdgeExit {
  /** Plan the exit at the named pool edge. */
  export function plan(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, params, start } = context;
    const id: string | undefined = params.support;
    if (id === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "support",
        value: null,
        reason: "an exit climbs out over a named edge",
        fix: "give the pool edge's subject id in support",
      });
    const edge: IAutoMovieMotionHumanPropReader = context.prop(id);
    const frame: IAutoMovieRigidTransform = edge.frame(start);
    const contact: IAutoMovieAffordance | undefined = (
      edge.prop.affordances ?? []
    ).find((a: IAutoMovieAffordance): boolean => a.id === "edge");
    if (contact === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "support",
        value: id,
        reason: "the support declares no edge",
        fix: "use a pool edge with an `edge` contact",
      });
    const world = (local: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, local),
      );
    const lip: IAutoMovieVector3 = world(contact.frame.translation);
    const out: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    const across: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    const freeboard: number = lip.y - water;
    if (freeboard > FREEBOARD)
      throw new HumanRefusal({
        kind: "reach",
        axis: "support",
        value: freeboard,
        feasible: { kind: "range", minimum: 0, maximum: FREEBOARD, unit: "m" },
        reason: `the deck is ${freeboard.toFixed(2)} m above the water, too high to press out unaided`,
        fix: "exit by a ladder or a lower edge, or be lifted out",
      });

    // Places on the deck, behind the edge.
    const on = (back: number, side: number): IAutoMovieVector3 =>
      Vector3.add(
        lip,
        Vector3.add(Vector3.scale(out, -back), Vector3.scale(across, side)),
      );
    const palms: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: on(PALM_BACK, PALM_SIDE),
      right: on(PALM_BACK, -PALM_SIDE),
    };
    const stand: IAutoMovieVector3 = on(STAND_BACK, 0);
    const hipsAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["hips"]);
    const hips0: IAutoMovieVector3 = hipsAt(entry.posture).get(
      "hips",
    )!.worldPosition;
    const press: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: 35, neck: -10 },
        { hip: 40, knee: 30, shoulder: 20, raise: 15, elbow: 5 },
      ),
    );
    const kneel: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: 40 },
        { hip: 95, knee: 120, shoulder: 30, raise: 15, elbow: 15 },
      ),
    );
    const upright: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(body, {}, {}),
      { ...stand },
    );
    const up: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      entry.posture,
      press,
    );
    const over: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      press,
      kneel,
    );

    // The hips' path: at the wall below the deck, over the edge just above
    // the deck, above the knee on the deck.
    const pressed: IAutoMovieVector3 = Vector3.add(on(-0.05, 0), {
      x: 0,
      y: 0.05,
      z: 0,
    });
    const kneeling: IAutoMovieVector3 = Vector3.add(on(0.3, 0), {
      x: 0,
      y: 0.45,
      z: 0,
    });
    const hipsOf = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
      hipsAt(posture).get("hips")!.worldPosition;
    const kneelPlaced: IAutoMovieMotionHumanPosture = AquaticPosture.translate(
      kneel,
      Vector3.add(kneel.root, Vector3.subtract(kneeling, hipsOf(kneel))),
    );
    const rise: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      kneelPlaced,
      upright,
    );
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      ...(["left", "right"] as const).map(
        (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
          part: `${side}Hand`,
          kind: "bear",
          from: PLACE,
          to: KNEE,
          support: { kind: "prop", subject: id },
        }),
      ),
      ...(["left", "right"] as const).map(
        (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
          part: `${side}Foot`,
          kind: "plant",
          from: 0.95,
          to: 1,
          support: { kind: "prop", subject: id },
        }),
      ),
    ];
    return {
      duration: DURATION,
      contacts,
      events: [
        { name: "hands", share: PLACE },
        { name: "pressed", share: PRESS },
        { name: "knee", share: KNEE },
        { name: "standing", share: 1 },
      ],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const u: number = Math.max(0, Math.min(1, seconds / DURATION));
        const shaped: IAutoMovieMotionHumanPosture =
          u < PRESS
            ? up(Math.max(0, (u - PLACE) / (PRESS - PLACE)))
            : u < KNEE
              ? over((u - PRESS) / (KNEE - PRESS))
              : rise((u - KNEE) / (1 - KNEE));
        if (u >= KNEE) return shaped;
        const target: IAutoMovieVector3 =
          u < PRESS
            ? Vector3.lerp(
                hips0,
                pressed,
                Math.max(0, (u - PLACE) / (PRESS - PLACE)),
              )
            : Vector3.lerp(pressed, kneeling, (u - PRESS) / (KNEE - PRESS));
        const hips: IAutoMovieVector3 = hipsOf(shaped);
        const posture: IAutoMovieMotionHumanPosture = AquaticPosture.translate(
          shaped,
          Vector3.add(shaped.root, Vector3.subtract(target, hips)),
        );
        const reach: number = Math.min(1, u / PLACE);
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            leftArm: palm(body, "left", palms.left, out, reach),
            rightArm: palm(body, "right", palms.right, out, reach),
          },
        };
      },
    };
  }

  /**
   * A palm flat on the deck with the fingers away from the water, lowered
   * onto it over the first share.
   */
  function palm(
    body: AquaticPosture.Context["body"],
    side: AutoMovieHumanSide,
    point: IAutoMovieVector3,
    out: IAutoMovieVector3,
    reach: number,
  ): IAutoMovieHumanLimbGoal {
    const frame: ReturnType<typeof HumanHand.offset> = HumanHand.offset(
      body,
      side,
      "palm",
    );
    const rotation: IAutoMovieQuaternion = HumanHand.align(frame, {
      normal: { x: 0, y: -1, z: 0 },
      forward: Vector3.scale(out, -1),
    });
    const placed: IAutoMovieVector3 = {
      ...point,
      y: point.y + LIFT * (1 - reach),
    };
    const wrist: IAutoMovieVector3 = Vector3.subtract(
      placed,
      Quaternion.rotateVector(rotation, frame.point),
    );

    // The elbow bends back toward the water, behind the pressing hand.
    return {
      point: wrist,
      rotation,
      contact: frame.point,
      bend: Vector3.add(
        wrist,
        Vector3.add(Vector3.scale(out, 0.25), { x: 0, y: 0.05, z: 0 }),
      ),
    };
  }
}
