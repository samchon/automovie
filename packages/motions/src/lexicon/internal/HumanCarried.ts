import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCarryHumanPosture,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { carryHumanPosture } from "../../posture/internal/carryHumanPosture";
import { HumanCarriedBearing } from "./HumanCarriedBearing";
import { HumanCarriedBorne } from "./HumanCarriedBorne";
import { HumanCarriedDrag } from "./HumanCarriedDrag";

/*
 * A shoulder ride's legs: hip flexion, knee flexion and hip abduction, degrees
 * (provisional, the thighs forward over the shoulders, the shins hanging before
 * the chest).
 */
const SHOULDER_LEGS: readonly [number, number, number] = [70, 90, 30];

/*
 * Being carried by another person: on the back, in the arms or over a shoulder.
 * The carried person keeps the posture they are in and goes rigidly with one
 * bone of the carrier (the upper chest when none is named), so whatever the
 * carrier does (walk, turn, stoop) takes them along. The carrier performs their
 * own action, such as a carry of the load in both hands. Register
 * `HumanCarried.carried` to use it.
 *
 * The named carries (`CARRIES`: piggyback, cradle, over the shoulder,
 * supported) are two laws for the two people: `borne` puts the carried body in
 * the carry's posture with its resting region on the carrier's, and `bearing`,
 * performed over the carrier's own action, puts the carrier's hands where the
 * carry holds.
 *
 * First pass: the lift into the carry and the set-down are not planned, the
 * carried body does not sag or cling, and its weight does not lean the
 * carrier.
 */
export namespace HumanCarried {
  /*
   * Be carried by another person. It lasts `seconds`, with no lift or set-down
   * (a rigid ride on one bone); a child on a back, a passenger carried through
   * a scene.
   */
  export const carried: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCarried.IParams> =
    {
      name: "carried",
      interrupts: {
        any: [{ window: { start: 0, end: 1 }, kind: "inertialize", entry: 0 }],
      },
      yields: ["head", "leftHand", "rightHand", "leftArm", "rightArm"],
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCarried.IParams>,
      ): IAutoMovieMotionHumanActionPlan => {
        const { partner: by, hold: seconds } = context.params;
        const bone: AutoMovieHumanoidBone = context.params.on ?? "upperChest";
        HumanCarriedBorne.lasting(seconds);
        if (by === context.subject)
          throw new HumanRefusal({
            kind: "participant",
            axis: "partner",
            value: by,
            reason: "a person is carried by someone else",
            fix: "name the carrier",
          });
        const carrier: IAutoMovieMotionHumanPerformerReader =
          context.performer(by);
        const held: IAutoMovieMotionHumanPosture = context.entry.posture;
        const frame = (
          at: number,
        ): IAutoMovieMotionHumanCarryHumanPosture.IFrame => {
          const resolved: IAutoMovieResolvedBone | undefined = carrier
            .bones(context.start + at)
            .get(bone);
          if (resolved === undefined)
            throw new HumanRefusal({
              kind: "parameter",
              axis: "on",
              value: bone,
              reason: `the carrier has no bone ${bone}`,
              fix: "name a bone of the carrier's rig",
            });
          return {
            position: resolved.worldPosition,
            rotation: resolved.worldRotation,
          };
        };

        // The carrier's frame at the start, read once as the plan is made: the
        // read places the carrier first in the schedule's demand order.
        const origin: IAutoMovieMotionHumanCarryHumanPosture.IFrame = frame(0);
        return {
          duration: seconds,
          events: [],
          contacts: [
            {
              part: "seat",
              kind: "seat",
              from: 0,
              to: 1,
              support: { kind: "person", subject: by, region: "upperBack" },
            },
          ],
          posture: (at: number): IAutoMovieMotionHumanPosture => {
            return carryHumanPosture(
              held,
              origin,
              frame(Math.min(seconds, Math.max(0, at))),
            );
          },
        };
      },
    };

  /*
   * The carries. Every angle and offset is provisional, set from the carries'
   * common descriptions: piggyback, chest on the back, legs about the waist,
   * hands under the thighs; cradle, across the forearms before the chest; over
   * the shoulder, folded at the waist over one shoulder; supported, side by
   * side with an arm across the helper's shoulders (`supportedLeft` is a second
   * helper's side); the waist lift of partner dance, face to face, the lifted
   * partner's belly at the lifter's chest, hands on the lifter's shoulders, the
   * lifter's hands at the hips; the overhead lift, the lifted partner prone
   * above the lifter's head at the arms' full reach (one arm length above the
   * shoulders' middle at the nape), the lifter's hands at the hips; the
   * shoulder ride, a child astride the carrier's neck, the seat on the yoke
   * behind it, the knees either side and the hands on the carrier's head, the
   * carrier's hands on the shins before the chest; the drags are
   * `HumanCarriedDrag`'s. sources give trunk flexion and stability findings,
   * not these places.
   */
  export const CARRIES: Readonly<
    Record<
      IAutoMovieMotionHumanCarried.Carry,
      IAutoMovieMotionHumanCarried.IRow
    >
  > = {
    piggyback: {
      mine: "sternum",
      theirs: "upperBack",
      turn: 0,
      pitch: 20,
      legs: [70, 80, 25],
      straddles: true,
      clings: ["shoulderLeft", "shoulderRight"],
      holds: [
        { region: "hipLeft", offset: { out: 0.15, up: 0, forward: -0.1 } },
        { region: "hipRight", offset: { out: 0.15, up: 0, forward: -0.1 } },
      ],
    },
    cradle: {
      mine: "ribsLeft",
      theirs: "sternum",
      turn: 90,
      pitch: -50,
      legs: [80, 70, 0],
      clings: [null, null],
      holds: [
        {
          region: "sternum",
          offset: { out: 0.25, up: -0.15, forward: 0.35 },
          // Support the back with the fingers along it toward the head.
          fingers: { x: 0, y: 1, z: 0 },
          shape: "flat",
        },
        { region: "sternum", offset: { out: 0.25, up: -0.15, forward: 0.35 } },
      ],
    },
    overShoulder: {
      mine: "abdomen",
      theirs: "shoulderRight",
      turn: 180,
      pitch: 85,
      legs: [60, 10, 0],
      clings: [null, null],
      holds: [
        null,
        {
          region: "shoulderRight",
          offset: { out: 0, up: 0, forward: 0.3 },
          // The open palm supports the thigh; the fingers follow it away from the hip.
          shape: "flat",
          fingers: { x: 0, y: -1, z: 0 },
        },
      ],
    },
    supported: {
      mine: "ribsLeft",
      theirs: "ribsRight",
      turn: 0,
      pitch: 0,
      legs: [0, 5, 0],
      clings: ["shoulderLeft", null],
      holds: [
        null,
        { region: "hipRight", offset: { out: 0.45, up: 0.1, forward: 0 } },
      ],
    },
    supportedLeft: {
      mine: "ribsRight",
      theirs: "ribsLeft",
      turn: 0,
      pitch: 0,
      legs: [0, 5, 0],
      clings: [null, "shoulderRight"],
      holds: [
        { region: "hipLeft", offset: { out: 0.45, up: 0.1, forward: 0 } },
        null,
      ],
    },
    waistLift: {
      mine: "abdomen",
      theirs: "sternum",
      turn: 180,
      pitch: 0,
      legs: [20, 40, 0],
      clings: ["shoulderRight", "shoulderLeft"],
      holds: [
        { region: "sternum", offset: { out: 0.2, up: 0, forward: 0.3 } },
        { region: "sternum", offset: { out: 0.2, up: 0, forward: 0.3 } },
      ],
    },
    overheadLift: {
      mine: "abdomen",
      theirs: "nape",
      turn: 0,
      pitch: 90,
      legs: [0, 0, 0],
      clings: [null, null],
      holds: [
        { region: "shoulderLeft", offset: { out: 0, up: 1, forward: 0 } },
        { region: "shoulderRight", offset: { out: 0, up: 1, forward: 0 } },
      ],
      rise: 1,
    },
    shoulders: {
      // The seat on the yoke, the top of the back behind the neck.
      mine: "seat",
      theirs: "yoke",
      turn: 0,
      pitch: 0,
      legs: SHOULDER_LEGS,
      straddles: true,
      clings: ["templeLeft", "templeRight"],
      // The hands go to the rider's shins (`HumanCarriedCoupling.HOLDS`).
      // The places, an arm's length from the yoke, lie the way the shins
      // hang from the seat at the carry's own legs (`straddled`), so the
      // registration that turns the rider to its holds leaves it upright.
      holds: [
        { region: "yoke", offset: straddled(SHOULDER_LEGS) },
        { region: "yoke", offset: straddled(SHOULDER_LEGS) },
      ],
    },
    ...HumanCarriedDrag.CARRIES,
  };

  /*
   * Be carried in a named carry: the body takes the carry's posture and rests
   * on the carrier by every contact of the carry's coupled meeting
   * (`HumanCarriedCoupling`): its resting region on the carrier's region and
   * its held regions on the carrier's palms, each window with its load share,
   * its clinging hands on the carrier's regions. The carrier performs `bearing`
   * over their own action. The lift into the carry and the set-down are the
   * `lift` and `setDown` seconds (`HumanCarriedLift`): the lift `TAKE` and no
   * set-down when absent, the body rising before it crosses onto the carrier. A
   * second helper named by `with` takes the other side of a carry that has one
   * (`HumanCarriedCoupling.PAIRED`), and the body rests on both. A person named
   * as their own carrier is refused on `by`, a second helper on a carry with no
   * other side on `with`, and a borne mass no lean of a carrier balances on
   * `mass` with the feasible mass.
   *
   * It lasts 2 s when `seconds` is absent, the lift and set-down inside it
   * (`HumanCarriedBorne`, provisional).
   */
  export const borne: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCarried.IBorne> =
    {
      name: "borne",
      interrupts: {
        any: [{ window: { start: 0, end: 1 }, kind: "inertialize", entry: 0 }],
      },
      yields: ["head"],
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCarried.IBorne>,
      ): IAutoMovieMotionHumanActionPlan => HumanCarriedBorne.plan(context),
    };

  /*
   * Hold a person in a named carry: the carrier's hands where the carry takes
   * the carried body. Performed over the carrier's own action
   * (`carrier.walk(...).over((o) => o.registered("bearing", ...))`), it claims
   * only the arms that hold. With two helpers each names the other by `beside`,
   * the one whose carry is the other side's being the second. With the carried
   * person named and the hold performed as an action of its own, the carrier
   * tips about its feet by the pair's own balance as its hands take the body
   * (`HumanCarriedCouplingLoad.lean`); over a walk, which keeps its trunk, the
   * composition schedules that tip as a layer (`HumanCarriedLean.coupled`), and
   * with no person named the table's lean (`HumanCarriedLean.layer`).
   *
   * It lasts 2 s when `seconds` is absent; the carrier's hands take their hold
   * in 0.4 s (`HumanCarried.TAKE`, provisional).
   */
  export const bearing: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCarried.IBearing> =
    {
      name: "bearing",
      interrupts: {
        any: [{ window: { start: 0, end: 1 }, kind: "inertialize", entry: 0 }],
      },
      overlay: true,
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCarried.IBearing>,
      ): IAutoMovieMotionHumanActionPlan => HumanCarriedBearing.plan(context),
    };

  /*
   * Seconds the carrier's hands take to reach their hold (provisional).
   */
  export const TAKE: number = 0.4;
}

/*
 * Where a straddling rider's shins hang from its seat, an arm's length from the
 * carrier's resting region, toward the hand's side: the leg drawn in its own
 * sagittal plane, the thigh flexed `flexion` forward from hanging and the shin
 * `knee` back from the thigh, a mid-shin a thigh plus half a shin out for thigh
 * and shin of one length, then turned out about the forward axis by
 * `abduction`. Only the direction carries: the registration turns the rider to
 * its holds' directions from the resting point.
 * Parameter legs: The carry's hip flexion, knee flexion and hip abduction, degrees.
 * Returns: The offset, arm lengths.
 */
function straddled(
  legs: readonly [number, number, number],
): IAutoMovieMotionHumanCarried.IOffset {
  const rad: number = Math.PI / 180;
  const [flexion, knee, abduction] = legs;
  const down: number =
    -Math.cos(flexion * rad) - Math.cos((flexion - knee) * rad) / 2;
  const ahead: number =
    Math.sin(flexion * rad) + Math.sin((flexion - knee) * rad) / 2;
  const out: number = -down * Math.sin(abduction * rad);
  const up: number = down * Math.cos(abduction * rad);
  const length: number = Math.hypot(out, up, ahead);
  return { out: out / length, up: up / length, forward: ahead / length };
}
