import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { courseArmGoal } from "../compose/courseArmGoal";
import { ExerciseKey } from "../exercise/ExerciseKey";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { AquaticEdge } from "./AquaticEdge";
import { AquaticPosture } from "./AquaticPosture";

/** Seconds of the whole exit: provisional. */
const DURATION: number = 3.2;

/** Shares of the phases: hands placed, pressed up, knee on the deck, standing. */
const PLACE: number = 0.2;
const PRESS: number = 0.5;
const KNEE: number = 0.75;

/** The share by which the hands have left the deck for the rising key's arms. */
const LET_GO: number = 0.88;

/**
 * The highest deck above the water a swimmer presses out over unaided, metres:
 * provisional, about a forearm.
 */
const FREEBOARD: number = 0.5;

/**
 * Palms this far behind the edge on the deck and this far either side, metres:
 * provisional.
 */
const PALM_BACK: number = 0.12;
const PALM_SIDE: number = 0.25;

/** The palm comes down onto the deck from this high, metres: provisional. */
const LIFT: number = 0.15;

/** The swimmer stands this far behind the edge, metres: provisional. */
const STAND_BACK: number = 0.45;

/**
 * Climb out over a pool's edge unaided, as a swimmer does at a deck a forearm
 * or less above the water: both palms go onto the deck behind the edge
 * (`hands`), the arms press the body up until the hips clear the deck
 * (`pressed`), a knee comes onto the deck (`knee`), and the swimmer stands on
 * the deck behind the edge (`standing`). The palms bear from `hands` until the
 * knee is down, so the hands load before the body rises. A deck higher above
 * the water than `FREEBOARD` is refused.
 */
export namespace AquaticEdgeExit {
  /** Plan the exit at the named pool edge. */
  export function plan(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry } = context;
    const edge: AquaticEdge.IEdge = AquaticEdge(context);
    const { id, lip, out } = edge;
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
      AquaticEdge.at(edge, -back, side, 0);
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
    // The palms' goals, written through the hands' whole courses.
    const arms = (u: number): IAutoMovieMotionHumanPosture["limbs"] => {
      const reach: number = Math.min(1, u / PLACE);
      return {
        leftArm: palm(body, "left", palms.left, out, reach),
        rightArm: palm(body, "right", palms.right, out, reach),
      };
    };
    const plan: IAutoMovieMotionHumanActionPlan = {
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
        if (u >= KNEE)
          return u > LET_GO
            ? shaped
            : { ...shaped, limbs: { ...shaped.limbs, ...arms(u) } };
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
        return { ...posture, limbs: { ...posture.limbs, ...arms(u) } };
      },
    };

    // Each arm reaches from the entered arm onto the deck as one admitted
    // course, bears there until the knee is down, and returns to the
    // rising key's arm by `LET_GO` (`courseArmGoal`).
    return courseArmGoal({
      context,
      plan,
      side: "left",
      rest: AutoMovieMotionHumanArm.angles(entry.pose, "left"),
      with: [
        {
          side: "right",
          rest: AutoMovieMotionHumanArm.angles(entry.pose, "right"),
        },
      ],
      span: {
        start: 0,
        ready: PLACE * DURATION,
        relax: KNEE * DURATION,
        end: LET_GO * DURATION,
      },
    });
  }

  /**
   * A palm flat on the deck with the fingers away from the water, lowered onto
   * it over the first share.
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
