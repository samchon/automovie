import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { ExerciseKey } from "../../exercise/internal/ExerciseKey";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanMaterialContact } from "../../posture/internal/HumanMaterialContact";
import { AquaticEdge } from "./AquaticEdge";
import { AquaticPosture } from "./AquaticPosture";

/*
 * An assisted removal from the water as the American Red Cross Lifeguarding
 * manual describes it: the victim faces the wall with its arms raised, the
 * rescuer on the deck beside its line squats and grips both wrists (`grip`),
 * straightens to raise the victim's hips to the deck (`lifted`), lets go as the
 * victim's trunk folds forward over the edge (`released`), and the victim lies
 * prone on the deck with its legs trailing into the water (`lying`). Both
 * performers read the same clock and the edge; the victim's path is its own,
 * and the rescuer's hands read only the victim's displayed wrists. A deck
 * higher above the water than `FREEBOARD` is refused.
 */
export namespace AquaticLiftOut {
  /*
   * The victim: faces the wall, is raised by its wrists and lies over the edge.
   */
  export function lifted(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry } = context;
    const edge: AquaticEdge.IEdge = deckOf(context, water);
    // The victim faces the wall, back along `out`.
    const turn: number = wrap(
      (Math.atan2(-edge.out.x, -edge.out.z) * 180) / Math.PI -
        entry.posture.yaw,
    );
    const shape = (
      trunk: IAutoMovieMotionHumanExerciseKey.ITrunk,
      limb: IAutoMovieMotionHumanExerciseKey.ILimb,
    ): IAutoMovieMotionHumanPosture =>
      AquaticPosture.key(
        entry.posture,
        ExerciseKey.from(body, { ...trunk, yaw: turn }, limb),
      );
    const hang: IAutoMovieMotionHumanPosture = shape(
      {},
      { shoulder: 165, raise: 12, elbow: 10, hip: 5, knee: 10, ankle: -20 },
    );
    const over: IAutoMovieMotionHumanPosture = shape(
      { pitch: 80, neck: -25 },
      { shoulder: 165, raise: 12, elbow: 15, hip: 80, knee: 10, ankle: -20 },
    );
    const lying: IAutoMovieMotionHumanPosture = shape(
      { pitch: 88, neck: -20 },
      { shoulder: 170, raise: 15, elbow: 20, hip: 25, knee: 10, ankle: -30 },
    );
    const face: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      entry.posture,
      hang,
    );
    const fold: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      hang,
      over,
    );
    const lie: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      over,
      lying,
    );
    const hipsAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["hips"]);
    const hipsOf = (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 =>
      hipsAt(posture).get("hips")!.worldPosition;
    // The hips' path: hanging at the wall, raised to just above the deck,
    // over the lip as the trunk folds, resting on it.
    const path: readonly IAutoMovieVector3[] = [
      hipsOf(entry.posture),
      AquaticEdge.at(edge, WALL, 0, water - HANG - edge.lip.y),
      AquaticEdge.at(edge, WALL, 0, 0.1),
      AquaticEdge.at(edge, 0.15, 0, 0.12),
      AquaticEdge.at(edge, 0.12, 0, 0.11),
    ];
    const marks: readonly number[] = [0, FACE, LIFT, OVER, 1];
    const plan: IAutoMovieMotionHumanActionPlan = {
      duration: DURATION,
      contacts: [],
      events: [
        { name: "facing", share: FACE },
        { name: "lifted", share: LIFT },
        { name: "over", share: OVER },
        { name: "lying", share: 1 },
      ],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const u: number = Math.max(0, Math.min(1, seconds / DURATION));
        const shaped: IAutoMovieMotionHumanPosture =
          u < FACE
            ? face(u / FACE)
            : u < LIFT
              ? hang
              : u < OVER
                ? fold((u - LIFT) / (OVER - LIFT))
                : lie((u - OVER) / (1 - OVER));
        // The path's leg under way: the last one once the lift-out is done.
        const next: number = marks.findIndex(
          (mark: number): boolean => u < mark,
        );
        const leg: number = next < 1 ? marks.length - 2 : next - 1;
        const target: IAutoMovieVector3 = Vector3.lerp(
          path[leg]!,
          path[leg + 1]!,
          AutoMovieEngineMotionSampling.minimumJerkShare(
            Math.min(1, (u - marks[leg]!) / (marks[leg + 1]! - marks[leg]!)),
          ),
        );
        return AquaticPosture.translate(
          shaped,
          Vector3.add(shaped.root, Vector3.subtract(target, hipsOf(shaped))),
        );
      },
    };
    const deck: HumanMaterialContact.ISite | undefined = AquaticEdge.deck(
      context,
      edge,
    );
    if (deck !== undefined)
      AquaticEdge.admit(
        edge,
        deck.at(context.start + DURATION),
        [HumanTrunk.region(body, plan.posture(DURATION), "sternum").point],
        "victim's chest",
      );
    return plan;
  }

  /*
   * The rescuer: squats on the deck, grips the wrists, straightens to lift and
   * lets go.
   */
  export function rescuer(
    context: AquaticPosture.Context,
    water: number,
  ): IAutoMovieMotionHumanActionPlan {
    const { body, entry, start } = context;
    const edge: AquaticEdge.IEdge = deckOf(context, water);
    const deck: HumanMaterialContact.ISite | undefined = AquaticEdge.deck(
      context,
      edge,
    );
    if (deck !== undefined) {
      const at: HumanMaterialContact.IFace = deck.at(start);
      for (const side of HumanHand.SIDES)
        AquaticEdge.admit(
          edge,
          at,
          HumanFoot.sole(body, side, entry.feet[side]),
          `${side} sole`,
        );
    }
    const partner: string = partnerOf(context);
    const victim: IAutoMovieMotionHumanPerformerReader =
      context.performer(partner);
    const size: number = body.measure.stature;
    const forward: IAutoMovieVector3 = HumanFrame.forward(entry.posture.yaw);
    const left: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.posture.yaw },
      { x: 1, y: 0, z: 0 },
    );
    const squat: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: 40, neck: -15 },
        { hip: 95, knee: 105, shoulder: 60, raise: 15, elbow: 30 },
      ),
    );
    const pull: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(
        body,
        { pitch: 12, neck: -5 },
        { hip: 25, knee: 20, shoulder: 70, raise: 15, elbow: 20 },
      ),
    );
    const stand: IAutoMovieMotionHumanPosture = AquaticPosture.key(
      entry.posture,
      ExerciseKey.from(body, { pitch: 3 }, { hip: 4, knee: 4, elbow: 15 }),
    );
    const down: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      entry.posture,
      squat,
    );
    const rise: ReturnType<typeof AquaticPosture.blend> = AquaticPosture.blend(
      squat,
      pull,
    );
    const settle: ReturnType<typeof AquaticPosture.blend> =
      AquaticPosture.blend(pull, stand);
    const hipsAt: ReturnType<typeof AquaticPosture.markers> =
      AquaticPosture.markers(body, ["hips"]);
    const hips0: IAutoMovieVector3 = hipsAt(entry.posture).get(
      "hips",
    )!.worldPosition;

    // Each hand grips the victim's wrist on its own side of the rescuer's
    // facing, read where the victim faces the wall.
    const hands: ReadonlySet<AutoMovieHumanoidBone> = new Set([
      "leftHand",
      "rightHand",
      "leftLowerArm",
      "rightLowerArm",
    ]);
    const faced: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      victim.bones(start + FACE * DURATION, hands);
    const leftward = (bone: AutoMovieHumanoidBone): number =>
      Vector3.dot(faced.get(bone)!.worldPosition, left);
    const wrists: Wrists =
      leftward("leftHand") >= leftward("rightHand")
        ? { left: "leftHand", right: "rightHand" }
        : { left: "rightHand", right: "leftHand" };
    const reach: number =
      body.measure.upperArm + body.measure.forearm + 0.4 * size;
    const far: number = Math.max(
      ...(["left", "right"] as const).map((side: AutoMovieHumanSide): number =>
        Math.hypot(
          faced.get(wrists[side])!.worldPosition.x - hips0.x,
          faced.get(wrists[side])!.worldPosition.z - hips0.z,
        ),
      ),
    );
    if (far > reach)
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "partner",
        value: partner,
        feasible: { kind: "range", minimum: 0, maximum: reach, unit: "m" },
        reason: `the victim's wrists are ${far.toFixed(2)} m from the rescuer, beyond the ${reach.toFixed(2)} m it reaches squatting`,
        fix: "stand the rescuer at the edge beside the victim's line",
      });

    const grip = (
      side: AutoMovieHumanSide,
      posture: IAutoMovieMotionHumanPosture,
      bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ): IAutoMovieHumanLimbGoal => {
      const wrist: IAutoMovieVector3 = bones.get(wrists[side])!.worldPosition;
      const elbow: IAutoMovieVector3 = bones.get(
        wrists[side] === "leftHand" ? "leftLowerArm" : "rightLowerArm",
      )!.worldPosition;
      const axis: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(wrist, elbow),
      );
      // The palm closes on the wrist from the rescuer's side of it.
      const toward: IAutoMovieVector3 = Vector3.subtract(wrist, posture.root);
      const normal: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(
          toward,
          Vector3.scale(axis, Vector3.dot(toward, axis)),
        ),
      );
      const frame: ReturnType<typeof HumanHand.offset> = HumanHand.offset(
        body,
        side,
        "grip",
      );
      const rotation: IAutoMovieQuaternion = HumanHand.align(frame, {
        normal,
        forward: axis,
      });
      const point: IAutoMovieVector3 = Vector3.subtract(
        wrist,
        Quaternion.rotateVector(rotation, frame.point),
      );
      return {
        point,
        rotation,
        contact: frame.point,
        bend: Vector3.add(point, {
          ...Vector3.scale(left, side === "left" ? 0.25 : -0.25),
          y: -0.2,
        }),
      };
    };
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      ...(["left", "right"] as const).map(
        (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
          part: `${side}Foot`,
          kind: "plant",
          from: 0,
          to: 1,
          support: deck?.support ?? { kind: "prop", subject: edge.id },
        }),
      ),
      ...(["left", "right"] as const).map(
        (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
          part: `${side}Hand`,
          kind: "grip",
          from: FACE,
          to: RELEASE,
          support: { kind: "person", subject: partner, bone: wrists[side] },
        }),
      ),
    ];
    const plan: IAutoMovieMotionHumanActionPlan = {
      duration: DURATION,
      contacts,
      events: [
        { name: "grip", share: FACE },
        { name: "lifted", share: LIFT },
        { name: "released", share: RELEASE },
        { name: "standing", share: 1 },
      ],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const u: number = Math.max(0, Math.min(1, seconds / DURATION));
        const shaped: IAutoMovieMotionHumanPosture =
          u < FACE
            ? down(u / FACE)
            : u < LIFT
              ? rise((u - FACE) / (LIFT - FACE))
              : settle((u - LIFT) / (1 - LIFT));
        // The hips sink and draw back into the squat and come up and over
        // the planted feet as the legs straighten.
        const depth: number =
          u < FACE
            ? AutoMovieEngineMotionSampling.minimumJerkShare(u / FACE)
            : u < LIFT
              ? 1 - 0.7 * AutoMovieEngineMotionSampling.minimumJerkShare((u - FACE) / (LIFT - FACE))
              : 0.3 * (1 - AutoMovieEngineMotionSampling.minimumJerkShare((u - LIFT) / (1 - LIFT)));
        const target: IAutoMovieVector3 = Vector3.add(
          Vector3.subtract(hips0, Vector3.scale(forward, BACK * size * depth)),
          { x: 0, y: -SQUAT * size * depth, z: 0 },
        );
        const placed: IAutoMovieMotionHumanPosture = AquaticPosture.translate(
          shaped,
          Vector3.add(
            shaped.root,
            Vector3.subtract(target, hipsAt(shaped).get("hips")!.worldPosition),
          ),
        );
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
          ...placed.limbs,
        };
        for (const side of ["left", "right"] as const)
          limbs[`${side}Leg`] = AutoMovieMotionHumanLeg.goal(
            body,
            placed,
            side,
            entry.feet[side],
            true,
          );
        if (u <= (RELEASE + 1) / 2) {
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            victim.bones(start + seconds, hands);
          for (const side of ["left", "right"] as const)
            limbs[`${side}Arm`] = grip(side, placed, bones);
        }
        return { ...placed, limbs };
      },
    };

    // Both hands reach from the entered arms onto the wrists as one course,
    // hold them through the lift and return to the standing key's arms.
    return courseArmGoal({
      context,
      plan,
      side: "left",
      rest: AquaticPosture.rest(body, entry.posture, "left"),
      with: [
        {
          side: "right",
          rest: AquaticPosture.rest(body, entry.posture, "right"),
        },
      ],
      span: {
        start: 0,
        ready: FACE * DURATION,
        relax: RELEASE * DURATION,
        end: ((RELEASE + 1) / 2) * DURATION,
      },
    });
  }

  /*
   * The named edge, or a refusal when its deck is too high to lift onto.
   */
  function deckOf(
    context: AquaticPosture.Context,
    water: number,
  ): AquaticEdge.IEdge {
    const edge: AquaticEdge.IEdge = AquaticEdge(context);
    const freeboard: number = edge.lip.y - water;
    if (freeboard > FREEBOARD)
      throw new AutoMovieMotionHumanRefusal({
        kind: "reach",
        axis: "support",
        value: freeboard,
        feasible: { kind: "range", minimum: 0, maximum: FREEBOARD, unit: "m" },
        reason: `the deck is ${freeboard.toFixed(2)} m above the water, too high to lift a victim onto`,
        fix: "lift out at a lower edge, or use a ladder or a backboard",
      });
    return edge;
  }

  /*
   * The named partner's subject id, or a refusal.
   */
  function partnerOf(context: AquaticPosture.Context): string {
    const partner: string | undefined = context.params.partner;
    if (partner === undefined)
      throw new AutoMovieMotionHumanRefusal({
        kind: "participant",
        axis: "partner",
        value: null,
        reason:
          "a lift-out joins a rescuer on the deck and a victim in the water",
        fix: "name the victim in partner",
      });
    return partner;
  }

  /*
   * An angle wrapped to (-180, 180] degrees.
   */
  function wrap(degrees: number): number {
    return degrees - 360 * Math.ceil((degrees - 180) / 360);
  }
}

/*
 * Seconds of the whole lift-out, shared by the rescuer and the victim:
 * provisional.
 */
const DURATION: number = 5;
/*
 * Shares of the phases: the victim faces the wall with its arms up and the
 * rescuer takes its wrists, the hips rise to the deck, the trunk folds over
 * onto it, the victim lies.
 */
const FACE: number = 0.2;
const LIFT: number = 0.55;

const OVER: number = 0.75;

/*
 * The share by which the rescuer has let go and stands.
 */
const RELEASE: number = 0.65;

/*
 * The highest deck above the water a rescuer lifts a victim onto, metres:
 * provisional, about a standing rescuer's knee.
 */
const FREEBOARD: number = 0.6;

/*
 * The victim's hips out from the wall as it hangs and rises, metres:
 * provisional, the chest clear of the wall.
 */
const WALL: number = 0.25;

/*
 * The hanging victim's hips below the surface, metres: provisional, the chest
 * at the surface.
 */
const HANG: number = 0.3;
/*
 * How far the rescuer's hips sink at the deepest squat and draw back, over
 * stature: provisional.
 */
const SQUAT: number = 0.22;

const BACK: number = 0.06;

/*
 * The victim's hand bone each rescuer hand grips at the wrist.
 */
type Wrists = Readonly<Record<AutoMovieHumanSide, AutoMovieHumanoidBone>>;
