import {
  AutoMovieEngineMotionSampling,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanHand } from "../../compose/internal/AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { motionHumanElbowPlace } from "../../compose/internal/motionHumanElbowPlace";
import { ExerciseKey } from "../../exercise/internal/ExerciseKey";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanMaterialContact } from "../../posture/internal/HumanMaterialContact";
import { AquaticEdge } from "./AquaticEdge";
import { AquaticPosture } from "./AquaticPosture";

/*
 * Climb out over a pool's edge unaided, as a swimmer does at a deck a forearm
 * or less above the water: both palms go onto the deck behind the edge
 * (`hands`), the arms press the body up until the hips clear the deck
 * (`pressed`), a knee comes onto the deck (`knee`), and the swimmer stands on
 * the deck behind the edge (`standing`). The palms bear from `hands` until the
 * knee is down, so the hands load before the body rises. A deck higher above
 * the water than `FREEBOARD` is refused.
 */
export namespace AquaticEdgeExit {
  /*
   * Plan the exit at the named pool edge.
   */
  export function plan(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry } = context;
    const edge: AquaticEdge.IEdge = AquaticEdge(context);
    const { id, lip, out } = edge;
    const deck: HumanMaterialContact.ISite | undefined = AquaticEdge.deck(
      context,
      edge,
    );
    const support: IAutoMovieMotionHumanContactWindow.Support =
      deck?.support ?? { kind: "prop", subject: id };
    const freeboard: number = lip.y - water;
    if (freeboard > FREEBOARD)
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "support",
        value: freeboard,
        feasible: { kind: "range", minimum: 0, maximum: FREEBOARD, unit: "m" },
        reason: `the deck is ${freeboard.toFixed(2)} m above the water, too high to press out unaided`,
        fix: "exit by a ladder or a lower edge, or be lifted out",
      });

    // The swimmer faces into the deck from the water. Their left hand is on
    // the negative side of the edge's transverse axis.
    const on = (back: number, side: number): IAutoMovieVector3 =>
      AquaticEdge.at(edge, -back, side, 0);
    const palms: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: on(PALM_BACK, -PALM_SIDE),
      right: on(PALM_BACK, PALM_SIDE),
    };
    const stand: IAutoMovieVector3 = on(STAND_BACK, 0);
    const markers: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["hips", "leftLowerLeg", "rightLowerLeg"]);
    const hips0: IAutoMovieVector3 = markers(entry.posture).get(
      "hips",
    )!.worldPosition;
    const press: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: 15, neck: -10 },
        { hip: 40, knee: 30, shoulder: 20, raise: 15, elbow: 5 },
      ),
    );
    const kneel: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: 78 },
        { hip: 121, knee: 125, shoulder: 30, raise: 15, elbow: 15 },
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

    // Slide toward the edge at the entry depth before the palms bear.
    const staged: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      hips0,
      AutoMovieEngineVector3.scale(
        out,
        -Math.max(
          0,
          AutoMovieEngineVector3.dot(
            AutoMovieEngineVector3.subtract(hips0, lip),
            out,
          ) - Math.max(body.measure.chestDepth, body.measure.footLength * 0.85),
        ),
      ),
    );
    const pressed: IAutoMovieVector3 = AutoMovieEngineVector3.add(on(-0.2, 0), {
      x: 0,
      y: 0.05,
      z: 0,
    });
    const kneesOf = (
      posture: IAutoMovieMotionHumanPosture,
    ): IAutoMovieVector3 => {
      const posed = markers(posture);
      return AutoMovieEngineVector3.lerp(
        posed.get("leftLowerLeg")!.worldPosition,
        posed.get("rightLowerLeg")!.worldPosition,
        0.5,
      );
    };
    const shift = (
      posture: IAutoMovieMotionHumanPosture,
      point: IAutoMovieVector3,
      to: IAutoMovieVector3,
    ): IAutoMovieMotionHumanPosture =>
      AquaticPosture.translate(
        posture,
        AutoMovieEngineVector3.add(
          posture.root,
          AutoMovieEngineVector3.subtract(to, point),
        ),
      );
    const hipsOf = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
      markers(posture).get("hips")!.worldPosition;
    const firstKnee: IAutoMovieVector3 = kneesOf(
      shift(press, hipsOf(press), pressed),
    );
    const restedKnee: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      on(0.16, 0),
      {
        x: 0,
        y: body.measure.shankRadius,
        z: 0,
      },
    );
    // The knees clear the lip on the water side before crossing it.
    const raisedKnee: IAutoMovieVector3 = {
      ...firstKnee,
      y: restedKnee.y + 0.035,
    };
    const kneelPlaced: IAutoMovieMotionHumanPosture = shift(
      kneel,
      kneesOf(kneel),
      restedKnee,
    );
    const armRest = AquaticPosture.markers(body, [
      "leftHand",
      "rightHand",
      "leftLowerArm",
      "rightLowerArm",
    ]);
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
          support,
        }),
      ),
      ...(["left", "right"] as const).map(
        (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
          part: `${side}Foot`,
          kind: "plant",
          from: STANCE,
          to: 1,
          support,
        }),
      ),
    ];
    // The palms' goals, written through the hands' whole courses.
    const left: ReturnType<typeof palm> = palm(body, "left", palms.left, out);
    const right: ReturnType<typeof palm> = palm(
      body,
      "right",
      palms.right,
      out,
    );
    const feet: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["leftFoot", "rightFoot"]);
    const nominal: ReturnType<typeof feet> = feet(upright);
    if (deck !== undefined) {
      const opening: HumanMaterialContact.IFace = deck.at(
        context.start + PLACE * DURATION,
      );
      const end: HumanMaterialContact.IFace = deck.at(context.start + DURATION);

      for (const side of HumanHand.SIDES) {
        const goal: IAutoMovieHumanLimbGoal = (side === "left" ? left : right)(
          1,
        );
        const palm: IAutoMovieVector3[] = (
          ["palm", "thumbPad", "indexPad", "littlePad"] as const
        ).map(
          (site): IAutoMovieVector3 =>
            AutoMovieEngineVector3.add(
              goal.point,
              AutoMovieEngineQuaternion.rotateVector(
                goal.rotation!,
                HumanHand.offset(body, side, site, "flat").point,
              ),
            ),
        );
        AquaticEdge.admit(edge, opening, palm, `${side} palm`);
        const ankle: IAutoMovieResolvedBone = nominal.get(`${side}Foot`)!;
        AquaticEdge.admit(
          edge,
          end,
          HumanFoot.sole(body, side, {
            ankle: ankle.worldPosition,
            rotation: ankle.worldRotation,
          }),
          `${side} sole`,
        );
      }
    }

    // The feet arrive at their standing sockets before the plant opens and
    // retain those places as the hips finish rising.
    const landFeet = (
      posture: IAutoMovieMotionHumanPosture,
      progress: number,
    ): IAutoMovieMotionHumanPosture => {
      const shown = feet(posture);
      const settled: boolean = progress >= 1;
      const transfer: number =
        AutoMovieEngineMotionSampling.minimumJerkShare(progress);
      const limbs = { ...posture.limbs };
      for (const side of HumanHand.SIDES) {
        const name = side === "left" ? "leftFoot" : "rightFoot";
        const from = shown.get(name)!;
        const finish = nominal.get(name)!;
        limbs[side === "left" ? "leftLeg" : "rightLeg"] =
          AutoMovieMotionHumanLeg.goal(
            body,
            posture,
            side,
            settled
              ? { ankle: finish.worldPosition, rotation: finish.worldRotation }
              : AutoMovieMotionHumanLeg.arc(
                  { ankle: from.worldPosition, rotation: from.worldRotation },
                  {
                    ankle: finish.worldPosition,
                    rotation: finish.worldRotation,
                  },
                  body.measure.footLength * 0.2,
                  transfer,
                ),
            settled,
          );
      }
      return { ...posture, limbs };
    };
    const arms = (
      u: number,
      posture?: IAutoMovieMotionHumanPosture,
    ): IAutoMovieMotionHumanPosture["limbs"] => {
      const reach: number = Math.min(1, u / PLACE);
      const aim = (
        side: AutoMovieHumanSide,
        target: IAutoMovieHumanLimbGoal,
      ): IAutoMovieHumanLimbGoal => {
        // The hand can roll about its palm once the body transfers forward
        // toward the raised knees. Keep the wider pad contact during the press.
        const frame = u > PRESS ? { ...target, limits: undefined } : target;
        return posture === undefined || u < PLACE || u > KNEE
          ? frame
          : motionHumanElbowPlace(body, posture, side, frame, () =>
              AutoMovieEngineVector3.add(
                out,
                AutoMovieEngineVector3.scale(
                  edge.across,
                  side === "left" ? -0.8 : 0.8,
                ),
              ),
            );
      };
      return {
        leftArm: aim("left", left(reach)),
        rightArm: aim("right", right(reach)),
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
        const plant = (
          posture: IAutoMovieMotionHumanPosture,
        ): IAutoMovieMotionHumanPosture =>
          u < STANCE_PREP
            ? posture
            : landFeet(
                posture,
                Math.min(1, (u - STANCE_PREP) / (STANCE - STANCE_PREP)),
              );
        if (u >= KNEE) {
          const shaped = rise((u - KNEE) / (1 - KNEE));
          if (seconds > LET_GO * DURATION) return plant(shaped);
          if (seconds === LET_GO * DURATION) {
            const shown = armRest(shaped);
            const neutral = (
              side: AutoMovieHumanSide,
            ): IAutoMovieHumanLimbGoal => ({
              point: shown.get(side === "left" ? "leftHand" : "rightHand")!
                .worldPosition,
              rotation: shown.get(side === "left" ? "leftHand" : "rightHand")!
                .worldRotation,
              bend: shown.get(
                side === "left" ? "leftLowerArm" : "rightLowerArm",
              )!.worldPosition,
            });
            return plant({
              ...shaped,
              limbs: { leftArm: neutral("left"), rightArm: neutral("right") },
            });
          }
          return plant({ ...shaped, limbs: { ...shaped.limbs, ...arms(u) } });
        }
        let posture: IAutoMovieMotionHumanPosture;
        if (u <= PRESS) {
          const advance = AutoMovieEngineMotionSampling.minimumJerkShare(
            Math.min(1, u / PLACE),
          );
          const load = Math.max(0, (u - PLACE) / (PRESS - PLACE));
          const shaped = up(load);
          const hips =
            u < PLACE
              ? AutoMovieEngineVector3.lerp(hips0, staged, advance)
              : AutoMovieEngineVector3.lerp(
                  staged,
                  pressed,
                  AutoMovieEngineMotionSampling.minimumJerkShare(load),
                );
          posture = shift(shaped, hipsOf(shaped), hips);
        } else {
          const overDeck = (u - PRESS) / (KNEE - PRESS);
          const shaped = over(Math.min(1, 2 * overDeck));
          const knee =
            overDeck < 0.5
              ? AutoMovieEngineVector3.lerp(
                  firstKnee,
                  raisedKnee,
                  AutoMovieEngineMotionSampling.minimumJerkShare(2 * overDeck),
                )
              : AutoMovieEngineVector3.lerp(
                  raisedKnee,
                  restedKnee,
                  AutoMovieEngineMotionSampling.minimumJerkShare(
                    2 * overDeck - 1,
                  ),
                );
          posture = shift(shaped, kneesOf(shaped), knee);
        }
        return { ...posture, limbs: { ...posture.limbs, ...arms(u, posture) } };
      },
    };

    // Each arm reaches from the entered arm onto the deck as one admitted
    // course, bears there until the knee is down, and returns to the
    // rising key's arm by `LET_GO` (`courseArmGoal`).
    const course = courseArmGoal({
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
    const leftFingers = AutoMovieMotionHumanHand.prepareFingers("left", "flat");
    const rightFingers = AutoMovieMotionHumanHand.prepareFingers(
      "right",
      "flat",
    );
    return {
      ...course,
      posture: (...args): IAutoMovieMotionHumanPosture => {
        const posture = course.posture(...args);
        const [seconds, channels] = args;
        const u = seconds / DURATION;
        if (u <= 0 || u >= LET_GO) return posture;
        const weight = AutoMovieEngineMotionSampling.minimumJerkShare(
          Math.max(0, Math.min(1, u / PLACE, (LET_GO - u) / (LET_GO - KNEE))),
        );
        const joints = { ...posture.joints };
        if (channels === undefined || channels.includes("leftHand"))
          Object.assign(joints, leftFingers(0, weight));
        if (channels === undefined || channels.includes("rightHand"))
          Object.assign(joints, rightFingers(0, weight));
        return { ...posture, joints };
      },
    };
  }

  /*
   * A palm flat on the deck with the fingers away from the water, lowered onto
   * it over the first share.
   */
  function palm(
    body: AquaticPosture.Context["body"],
    side: AutoMovieHumanSide,
    point: IAutoMovieVector3,
    out: IAutoMovieVector3,
  ): (reach: number) => IAutoMovieHumanLimbGoal {
    const frame: ReturnType<typeof HumanHand.offset> = HumanHand.offset(
      body,
      side,
      "palm",
    );
    const rotation: IAutoMovieQuaternion = HumanHand.align(frame, {
      normal: { x: 0, y: -1, z: 0 },
      forward: AutoMovieEngineVector3.scale(out, -1),
    });
    const wrist: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      point,
      AutoMovieEngineQuaternion.rotateVector(rotation, frame.point),
    );

    // The elbow bends back toward the water, behind the pressing hand.
    const lateral = AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.cross(out, { x: 0, y: 1, z: 0 }),
      (side === "left" ? 1 : -1) * body.measure.shoulderHalfWidth * 0.8,
    );
    const bend: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      wrist,
      AutoMovieEngineVector3.add(
        AutoMovieEngineVector3.add(AutoMovieEngineVector3.scale(out, 0.25), {
          x: 0,
          y: 0.05,
          z: 0,
        }),
        lateral,
      ),
    );
    const pad = (region: "thumbPad" | "indexPad" | "littlePad") => ({
      contact: HumanHand.offset(body, side, region, "flat").point,
      bound: 0.01,
    });
    const limits = [pad("thumbPad"), pad("indexPad"), pad("littlePad")];
    return (reach: number): IAutoMovieHumanLimbGoal => {
      const lift: number = LIFT * (1 - reach);
      return {
        point: { ...wrist, y: wrist.y + lift },
        rotation: { ...rotation },
        contact: { ...frame.point },
        ...(reach < 1 ? {} : { limits }),
        bend: { ...bend, y: bend.y + lift },
      };
    };
  }
}

/*
 * Seconds of the whole exit: provisional.
 */
const DURATION: number = 3.2;
/*
 * Shares of the phases: hands placed, pressed up, knee on the deck, standing.
 */
const PLACE: number = 0.2;
const PRESS: number = 0.5;

const KNEE: number = 0.75;

/*
 * The share by which the hands have left the deck for the rising key's arms.
 */
const LET_GO: number = 0.88;
const STANCE_PREP: number = 0.83;
const STANCE: number = 0.95;

/*
 * The highest deck above the water a swimmer presses out over unaided, metres:
 * provisional, about a forearm.
 */
const FREEBOARD: number = 0.5;
/*
 * Palms this far behind the edge on the deck and this far either side, metres:
 * provisional.
 */
const PALM_BACK: number = 0.12;

const PALM_SIDE: number = 0.25;

/*
 * The palm comes down onto the deck from this high, metres: provisional.
 */
const LIFT: number = 0.15;

/*
 * The swimmer stands this far behind the edge, metres: provisional.
 */
const STAND_BACK: number = 0.45;
