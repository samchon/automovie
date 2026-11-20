import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanMartialArt,
  IAutoMovieMotionHumanPlaced,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingStance } from "../striking/StrikingStance";
import { StrikingTarget } from "../striking/StrikingTarget";

/** The linked phrases offered by the martial-art law. */
type Kind = Extract<
  IAutoMovieMotionHumanMartialArt.Kind,
  `${string}${"Transfer" | "StanceReset"}`
>;

/** Provisional blocking values for the shared entry, transfer and reset. */
interface IForm {
  /** Lead mark ahead of the rear foot in statures. */
  stride: number;

  /** Minimum knee bend under the fully opened pose, in degrees. */
  knee: number;

  /** Entry and reset duration in seconds, before manner scaling. */
  step: number;

  /** Forward and return transfer durations in seconds. */
  shift: readonly [forward: number, back: number];

  /** Initial share of the stance span, then forward and backward changes. */
  weight: readonly [ready: number, forward: number, back: number];

  /** Opening pelvis heading offset and further turn toward the second mark, in degrees. */
  turn: readonly [ready: number, back: number];

  /** A staged upper body path, or the entry's quiet carriage. */
  arms: "karate" | "taiChi" | "rest";
}

/** The four screen forms share a clock and sole fit, with independent blocking. */
const FORM: Record<Kind, IForm> = {
  karateStanceTransfer: {
    stride: 0.3,
    knee: 35,
    step: 0.55,
    shift: [0.42, 0.42],
    weight: [0.66, 0.06, 0.4],
    turn: [5, 20],
    arms: "karate",
  },
  taiChiTransfer: {
    stride: 0.35,
    knee: 23,
    step: 2,
    shift: [2.5, 2.5],
    weight: [0.43, 0.23, 0.32],
    turn: [0, 0],
    arms: "taiChi",
  },
  taekwondoStanceReset: {
    stride: 0.26,
    knee: 16,
    step: 0.64,
    shift: [0.48, 0.72],
    weight: [0.48, 0.1, 0.18],
    turn: [2, 16],
    arms: "rest",
  },
  muayThaiStanceReset: {
    stride: 0.28,
    knee: 41,
    step: 0.72,
    shift: [0.7, 0.6],
    weight: [0.46, 0.12, 0.25],
    turn: [2, 0],
    arms: "rest",
  },
};

/**
 * A lead step into two linked planted weight shifts and a return to entry.
 * The karate form links a front and back stance with a chambered fist and
 * a switching arm path. Tai chi links a forward shift and a rollback
 * with open palms and comparatively quiet torso carriage. The Shotokan
 * stepping study and the tai chi push case study distinguish the movement
 * families. The two quiet-arm screen resets contrast higher turning
 * carriage with a lower forward-facing transfer. All blocking values
 * are provisional choices for the take.
 * @see https://pubmed.ncbi.nlm.nih.gov/34269821/
 * @see https://pmc.ncbi.nlm.nih.gov/articles/PMC1724683/
 *
 * @param context The martial-art law's actual entering pose and body.
 * @param kind Which form phrase to author.
 * @param hold Seconds to hold the second stance before the return.
 * @param manner Timing and extent modifiers from the action's shared manner.
 * @returns The support and arm phrase on a single timeline.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the actual subject, support and upper body paths, time, units and provisional geometry.
 * @evidence contracts/development/implementation.md#principled-implementation Each style drives one plant clock and support-relative carriage. The two linked transfer phrases place hands relative to the displayed shoulders while the two resets keep the entry arm joints.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Schedule, support geometry, body carriage and arm placements use the same fixed phrase.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the existing leg arc, placements, clock, body lowering and arm composition.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the fixed geometry of the action remains with its returned plan.
 */
export function MartialArtStancePhrase(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanMartialArt.IParams>,
  kind: Kind,
  hold: number,
  manner: IAutoMovieMotionManner.IModifiers,
): IAutoMovieMotionHumanActionPlan {
  const { body, entry, params } = context;
  const m: typeof body.measure = body.measure;
  const form: IForm = FORM[kind];
  const karate: boolean = form.arms === "karate";
  const lead: "left" | "right" = params.lead ?? "left";
  const rear: "left" | "right" = StrikingStance.rear({ lead });
  const feet: ReturnType<typeof StrikingTarget.feet> =
    StrikingTarget.feet(entry);
  const sole: Record<"left" | "right", IAutoMovieVector3> = {
    left: HumanFoot.offset(body, "left", "ball"),
    right: HumanFoot.offset(body, "right", "ball"),
  };
  const start: IAutoMovieMotionHumanPosture = entry.posture;
  const axis: IAutoMovieMotionHumanFrame = {
    origin: feet[rear].ankle,
    yaw: start.yaw,
  };
  const oldLead: IAutoMovieVector3 = HumanFrame.local(axis, feet[lead].ankle);
  const stride: number = Math.max(
    oldLead.z,
    form.stride * m.stature * manner.extent,
  );
  const finish: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: HumanFrame.point(axis, { ...oldLead, z: stride }),
    rotation: HumanFoot.rotation(
      start.yaw,
      HumanFoot.pitch(feet[lead].rotation),
    ),
  };
  const clock: IAutoMovieMotionClock = AutoMovieMotionManner.time(
    AutoMovieMotionClock.phrase({
      prepare: form.step,
      attack: form.shift[0],
      follow: form.shift[1],
      hold,
      retract: form.step,
    }),
    manner,
  );
  const open: (seconds: number) => number =
    AutoMovieMotionClock.prepareEnvelope(
      clock,
      ["start", "ready"],
      ["relax", "end"],
    );
  const fore: ReturnType<typeof AutoMovieMotionClock.prepare> =
    AutoMovieMotionClock.prepare(clock, "strokeStart", "stroke");
  const back: ReturnType<typeof AutoMovieMotionClock.prepare> =
    AutoMovieMotionClock.prepare(clock, "stroke", "strokeEnd");
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: clock.at("start"),
    ready: clock.at("ready"),
    relax: clock.at("relax"),
    end: clock.at("end"),
  };
  const contact: IAutoMovieMotionHumanContactWindow[] = [
    {
      part: `${rear}Foot`,
      kind: "plant",
      from: 0,
      to: 1,
      support: { kind: "ground" },
    },
    {
      part: `${lead}Foot`,
      kind: "plant",
      from: span.ready / clock.duration,
      to: span.relax / clock.duration,
      support: { kind: "ground" },
    },
  ];
  const legs: IAutoMovieMotionHumanPrimitive = {
    channels: ["root", "trunk", "leftLeg", "rightLeg"],
    from: 0,
    to: clock.duration,
    write: (
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      _before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<typeof resolveHumanPosture.lower>[3],
    ): IAutoMovieMotionHumanPosture => {
      const shown: number = open(seconds);
      const advance: number = fore.progress(seconds);
      const recover: number = back.progress(seconds);
      const transfer: number =
        form.weight[0] + form.weight[1] * advance - form.weight[2] * recover;
      const ankles: ReturnType<typeof StrikingTarget.feet> = {
        ...feet,
        [lead]: AutoMovieMotionHumanLeg.arc(
          feet[lead],
          finish,
          0.025 * m.stature,
          shown,
        ),
      };
      const centre: IAutoMovieVector3 = Vector3.lerp(
        feet[rear].ankle,
        finish.ankle,
        transfer,
      );
      const yaw: number =
        start.yaw +
        (lead === "left" ? -1 : 1) *
          (form.turn[0] + form.turn[1] * recover) *
          shown;
      const horizontal: IAutoMovieVector3 = Vector3.lerp(
        posture.root,
        { ...centre, y: posture.root.y },
        shown,
      );
      const sink: number = StrikingStance.sink(
        body,
        centre,
        yaw,
        {
          left: feet.left.ankle,
          right: feet.right.ankle,
          [lead]: finish.ankle,
        },
        form.knee,
      );
      const joints: IAutoMovieMotionHumanPosture["joints"] =
        StrikingStance.facing(posture.joints, yaw - start.yaw);
      const goals: ReturnType<typeof StrikingStance.legs> = StrikingStance.legs(
        body,
        ankles,
        {
          left: rear === "left" || shown === 0 || shown === 1,
          right: rear === "right" || shown === 0 || shown === 1,
        },
      );

      // These forms bear on the visible sole. The generic striking goals
      // lock the MTP joint above it, so an ankle rotated by the range fit
      // can leave that joint fixed while shifting the ball on the floor.
      for (const side of ["left", "right"] as const) {
        const key = `${side}Leg` as const;
        const goal = goals[key];
        if (goal?.planted) goals[key] = { ...goal, contact: sole[side] };
      }
      const minimumKnee: number =
        resolveHumanPosture.KNEE +
        shown * (form.knee - resolveHumanPosture.KNEE);
      return resolveHumanPosture.lower(
        body,
        {
          ...posture,
          root: {
            ...horizontal,
            y: horizontal.y + Math.min(0, sink - start.root.y) * shown,
          },
          yaw,
          joints,
          limbs: { ...posture.limbs, ...goals },
        },
        minimumKnee,
        resolution,
      );
    },
  };
  const primitives: IAutoMovieMotionHumanPrimitive[] = [legs];
  const armSides: readonly ("left" | "right")[] =
    form.arms === "rest" ? [] : ["left", "right"];
  for (const side of armSides)
    primitives.push(
      ...AutoMovieMotionHumanPlaced.arm({
        body,
        side,
        from: 0,
        to: clock.duration,
        span,
        rest: AutoMovieMotionHumanArm.angles(entry.pose, side),
        weight: open,
        surface: karate ? "fist" : "palm",
        shape: karate ? "fist" : "flat",
        bend: karate ? "tucked" : "front",
        place: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
          resolution?: Parameters<
            IAutoMovieMotionHumanActionPlan["posture"]
          >[2],
        ): ReturnType<IAutoMovieMotionHumanPlaced.IArm["place"]> => {
          // Hand sites ride the lowering torso. The shared grid's standing
          // heights would lift the hands relative to the shoulders as the
          // stance sinks, especially when the fist leaves the waist chamber.
          const frame: IAutoMovieMotionHumanFrame = {
            origin: AutoMovieMotionHumanPlaced.joint(
              body,
              posture,
              `${side}UpperArm`,
              resolution,
            ),
            yaw: posture.yaw,
          };
          const arm: number = m.upperArm + m.forearm;
          const outward: number = side === "left" ? 1 : -1;
          const near: IAutoMovieVector3 = {
            x: (karate ? 0.75 : -0.5) * outward * m.forearmRadius,
            y: (karate ? -0.72 : -0.34) * m.upperArm,
            z: (karate ? 0.25 : 0.32) * arm,
          };
          const far: IAutoMovieVector3 = {
            x: (karate ? -0.5 : 0) * outward * m.forearmRadius,
            y: -0.22 * m.upperArm,
            z: (karate ? 0.62 : 0.65) * arm,
          };
          const advance: number = fore.progress(seconds);
          const recover: number = back.progress(seconds);
          const swing: number = karate
            ? side === lead
              ? 1 - recover
              : recover
            : advance * (1 - recover);
          const rollBack: number = karate
            ? 0
            : outward * 4 * recover * (1 - recover) * m.forearmRadius;
          const site: IAutoMovieVector3 = Vector3.lerp(near, far, swing);
          return {
            point: HumanFrame.point(frame, { ...site, x: site.x + rollBack }),
            facing: HumanFrame.point(
              { ...frame, origin: { x: 0, y: 0, z: 0 } },
              { x: 0, y: 0, z: 1 },
            ),
            ...(karate ? {} : { forward: { x: 0, y: 1, z: 0 } }),
          };
        },
      }),
    );
  return composeAutoMovieMotionHumanAction({
    base: AutoMovieMotionHumanBase.still(clock.duration, start, contact),
    clock,
    primitives,
  });
}
