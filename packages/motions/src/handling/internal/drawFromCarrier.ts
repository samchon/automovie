import {
  AutoMovieEngineMotionSampling,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbReference,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDrawFromCarrier,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrehension,
  IAutoMovieMotionPropHold,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { courseArmGoal } from "../../compose/internal/courseArmGoal";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanLimbFit } from "../../posture/internal/HumanLimbFit";
import { poseBones } from "../../posture/internal/poseBones";
import { StrikingBlade } from "../../striking/internal/StrikingBlade";
import { HumanGrip } from "./HumanGrip";
import { HumanPrehension } from "./HumanPrehension";
import { drawFromCarrierJudge } from "./drawFromCarrierJudge";
import { drawFromCarrierOver } from "./drawFromCarrierOver";
import { drawFromCarrierPivot } from "./drawFromCarrierPivot";
import { drawFromCarrierPulling } from "./drawFromCarrierPulling";
import { pickUp } from "./pickUp";
import { putDownTarget } from "./putDownTarget";

/*
 * Draw a gripped object out of its carrier along a straight line, the inverse
 * of aperture placement (`putDownAperture`): a sword drawn from its scabbard.
 * Register it with `AutoMovieMotionHumanChain.extend({ drawFromCarrier })` or by name, and
 * with the performance.
 *
 * The hand has gripped the seated object (a pickup with no lift). The object
 * then rides the carrier's slide socket while the action drives the carrier's
 * slider from the seat to the opening on one minimum-jerk movement, timed as a
 * loaded carry (`HumanPrehension.carry`), so the carrier keeps it on its line
 * as a scabbard guides its blade, the parent-constraint handoff of digital prop
 * work (Autodesk Maya, Parent constraint,
 * https://help.autodesk.com/cloudhelp/2022/ENU/Maya-CharacterAnimation/files/GUID-F6785389-FAC1-429F-8783-B06B0B8AF1A8.htm).
 * The hand follows on its grip, its wrist placed through the grip's rigid
 * offset read from the displayed frames at the start, and takes the object over
 * at the opening. The rest of the body holds the posture the action was entered
 * in, so the carrier, worn or placed, holds still under the line. Adult
 * insertion trials separate the transport to an opening from the aligned
 * insertion (Ossmy et al. 2020,
 * https://pmc.ncbi.nlm.nih.gov/articles/PMC6851484/); this is the aligned part
 * run backward. The fitted hand is judged against its planned place on the grip
 * at plan time, and a draw it cannot follow is refused rather than shown with
 * the hand off the hilt. Events: `unseated` at the start and `drawn` at the
 * end. A cut to `stand` inside the draw, or to `walk` at its end, keeps the
 * grip. Over a carrier (a seated rider's draw), the draw claims only its hands
 * and arms, their goals riding the bone the carrier is worn on so they follow
 * the line as the body moves; there the fit is not judged against the line.
 * With a `pull`, a blade longer than the arm's reach, the other hand slides the
 * carrier back along its own line and then turns it about where it hangs toward
 * the drawing shoulder, each by the least that brings the drawn wrist within
 * reach (`pivoting`), while the trunk turns away, and the blade leaves low and
 * in front along the moving line.
 */
export const drawFromCarrier: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanDrawFromCarrier> =
  {
    name: "drawFromCarrier",
    // Over a carrier, a seated rider's draw: the drawing arm and hand only.
    overlay: true,
    interrupts: {
      stand: [
        {
          window: { start: "unseated", end: 1 },
          kind: "inertialize",
          entry: 0,
          blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
          keep: ["grip"],
        },
      ],
      walk: [
        {
          window: { start: "drawn", end: 1 },
          kind: "inertialize",
          entry: 0,
          blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
          keep: ["grip"],
        },
      ],
    },
    plan,
  };

/*
 * Read the line on the carrier and move the gripped object along it.
 * Parameter context: The entry with the object gripped and seated.
 * Returns: The draw.
 * On `prop` when the hand does not hold it or the drawn
 * wrist lies beyond the arm, on `from` when the carrier is not named, on
 * `from.aperture` when the two affordances are not a straight aligned line or
 * the fitted hand leaves its planned place on the grip by more than
 * `drawFromCarrierJudge.GRIP`, and on `from.point` when the object is not
 * seated there.
 */
function plan(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDrawFromCarrier>,
): IAutoMovieMotionHumanActionPlan {
  const { prop, from } = context.params;
  const side: AutoMovieHumanSide = context.params.hand ?? "right";
  if (!prop || context.entry.holds[side] !== prop)
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "prop",
      value: prop,
      feasible: {
        kind: "alternatives",
        values: [context.entry.holds[side] ?? "none"],
      },
      reason:
        "a draw starts with the seated object gripped by the drawing hand",
      fix: "grip the object with that hand first, with a pickup of no lift",
    });
  if (
    from === undefined ||
    !from.prop ||
    !from.aperture ||
    !from.point ||
    from.prop === prop
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "from",
      value: from?.prop ?? "absent",
      feasible: { kind: "alternatives", values: ["a separate carrier"] },
      reason: "a draw needs a seat and an opening on a separate carrier",
      fix: "name the carrier and both of its affordances",
    });

  // The object's world frame on the seat and at the opening.
  const at = (point: string): IAutoMovieRigidTransform =>
    putDownTarget(
      { ...context, params: { prop, onto: { prop: from.prop, point } } },
      (): IAutoMoviePose => context.entry.pose,
    )!;
  const seat: IAutoMovieRigidTransform = at(from.point);
  const opening: IAutoMovieRigidTransform = at(from.aperture);
  const line: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    opening.position,
    seat.position,
  );
  if (
    !(AutoMovieEngineVector3.length(line) > Number.EPSILON) ||
    !(AutoMovieEngineQuaternion.angle(opening.rotation, seat.rotation) <= 1e-6)
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "from.aperture",
      value: from.aperture,
      feasible: {
        kind: "alternatives",
        values: ["a distinct aligned opening"],
      },
      reason:
        "the opening and seat must share an attitude at distinct positions",
      fix: "author the seat and opening along a straight draw line",
    });

  // The object must be seated where the line starts.
  const shown: IAutoMovieRigidTransform = context
    .prop(prop)
    .frame(context.start);
  if (AutoMovieEngineVector3.distance(shown.position, seat.position) > SEATED)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "from.point",
      value: from.point,
      feasible: { kind: "alternatives", values: ["the object seated there"] },
      reason: `${prop} is ${AutoMovieEngineVector3.distance(shown.position, seat.position).toFixed(3)} m from ${from.prop}.${from.point}`,
      fix: "draw the object from the carrier it is seated in",
    });

  // The grip's rigid offset, from the displayed frames now.
  const limb: AutoMovieHumanLimb = side === "left" ? "leftArm" : "rightArm";
  const bone: AutoMovieHumanoidBone = `${side}Hand`;
  const hand: IAutoMovieResolvedBone = poseBones(
    context.body,
    context.entry.pose,
    undefined,
    new Set<AutoMovieHumanoidBone>([bone]),
  ).get(bone)!;
  const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(hand.worldRotation);
  const offset: IAutoMovieRigidTransform = {
    position: AutoMovieEngineQuaternion.rotateVector(
      inverse,
      AutoMovieEngineVector3.subtract(shown.position, hand.worldPosition),
    ),
    rotation: AutoMovieEngineQuaternion.multiply(inverse, shown.rotation),
  };
  const wrist = (frame: IAutoMovieRigidTransform): IAutoMovieRigidTransform => {
    const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(
      AutoMovieEngineQuaternion.multiply(frame.rotation, AutoMovieEngineQuaternion.inverse(offset.rotation)),
    );
    return {
      position: AutoMovieEngineVector3.subtract(
        frame.position,
        AutoMovieEngineQuaternion.rotateVector(rotation, offset.position),
      ),
      rotation,
    };
  };
  const start: IAutoMovieRigidTransform = wrist(shown);
  const direction: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(line);
  const pulled: drawFromCarrierPulling.IPulled | null = drawFromCarrierPulling(
    context,
    side,
  );
  // The drawn wrist is reached by the body as the draw leaves it: a long
  // draw's trunk has turned away from the drawing side by then.
  const turnedAway: IAutoMovieMotionHumanPosture =
    pulled === null || context.carrier !== undefined
      ? context.entry.posture
      : StrikingBlade.turned(context.entry.posture, pulled.turn);
  // A pulled carrier slides back along its line and turns about where it
  // hangs while the slider runs, so the blade leaves low and in front along
  // the moving line; otherwise the line holds.
  const pivot: drawFromCarrierPivot.IPivot | null =
    pulled === null
      ? null
      : drawFromCarrierPivot(
          context,
          from,
          side,
          pulled,
          turnedAway,
          wrist,
          AutoMovieEngineVector3.length(line),
        );
  const bladeAt: (p: number) => IAutoMovieRigidTransform = (
    p: number,
  ): IAutoMovieRigidTransform =>
    pivot === null
      ? {
          position: AutoMovieEngineVector3.add(shown.position, AutoMovieEngineVector3.scale(line, p)),
          rotation: shown.rotation,
        }
      : pivot.blade(p, AutoMovieEngineVector3.length(line) * p);
  const end: IAutoMovieRigidTransform =
    pivot === null ? wrist(opening) : wrist(bladeAt(1));
  pickUp.reachable(context, side, end.position, turnedAway);

  // One loaded, aligned movement along the line: straight for a carrier
  // that holds still, along the pivoting line for a pulled one, on the
  // same minimum-jerk progress as the slider.
  const held: IAutoMovieMotionHumanPosture = context.entry.posture;
  const carried: number = HumanPrehension.carry(
    AutoMovieEngineVector3.distance(start.position, end.position),
  );
  const progress: (t: number) => number = (t: number): number =>
    AutoMovieEngineMotionSampling.minimumJerk(
      Math.min(1, Math.max(0, t / carried)),
    ).s;
  const transport: IAutoMovieMotionHumanPrehension.ITransport =
    pivot === null
      ? HumanPrehension.transport(
          start.position,
          end.position,
          direction,
          0,
          { from: start.rotation, to: end.rotation },
          carried,
        )
      : {
          duration: carried,
          wrist: (t: number): IAutoMovieVector3 =>
            wrist(bladeAt(progress(t))).position,
          turn: (t: number): IAutoMovieQuaternion =>
            wrist(bladeAt(progress(t))).rotation,
        };
  const retreat: IAutoMovieMotionHumanPrehension.ITransport | null =
    pivot === null || pulled === null
      ? null
      : {
          duration: carried,
          wrist: (t: number): IAutoMovieVector3 =>
            pivot.carry(pulled.wrist, progress(t)).position,
          turn: (t: number): IAutoMovieQuaternion =>
            pivot.carry(pulled.wrist, progress(t)).rotation,
        };
  if (pivot !== null && pulled !== null)
    pickUp.reachable(
      context,
      pulled.side,
      pivot.carry(pulled.wrist, 1).position,
      turnedAway,
    );
  const duration: number = transport.duration;
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    context.body,
    held,
    side,
  );
  const reference: IAutoMovieHumanLimbReference = HumanLimbFit.reference(
    context.entry.pose,
    limb,
  );
  const part: IAutoMovieMotionHumanContactWindow["part"] =
    side === "left" ? "leftHand" : "rightHand";

  // The hand keeps the object, its closed fingers and its use, through the draw.
  const use: IAutoMovieMotionPropHold["use"] = context.entry.uses[side];
  if (context.carrier !== undefined)
    return drawFromCarrierOver({
      context,
      side,
      prop,
      from,
      line,
      duration,
      transport,
      bend,
      use,
      pulled,
      retreat,
    });
  const plan: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: [
      { name: "unseated", share: 0 },
      { name: "drawn", share: 1 },
    ],
    contacts: [
      {
        part: "leftFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
      {
        part: "rightFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
      // The hand follows the object on its grip without carrying it: the
      // carrier's slide guides it until the hand takes it at the opening.
      {
        part,
        kind: "grip",
        from: 0,
        to: 1,
        support: { kind: "prop", subject: prop, carries: false },
      },
      {
        part,
        kind: "grip",
        from: 1,
        to: 1,
        support: { kind: "prop", subject: prop },
      },
      // The pulling hand carries the carrier through its turn and lets it
      // hang again.
      ...(pulled === null
        ? []
        : [
            {
              part: pulled.part,
              kind: "grip" as const,
              from: 0,
              to: 1,
              support: { kind: "prop" as const, subject: from.prop },
            },
          ]),
    ],
    mounts: [{ prop, onto: from.prop, point: from.slide, from: 0 }],
    ...(pulled === null
      ? {}
      : { wears: [{ prop: from.prop, bone: pulled.bone, from: 1 }] }),
    drives: [
      {
        prop: from.prop,
        articulation: from.slider,
        from: 0,
        to: 1,
        travel: (seconds: number): number =>
          AutoMovieEngineVector3.length(line) *
          AutoMovieEngineMotionSampling.minimumJerk(
            Math.min(1, Math.max(0, seconds / duration)),
          ).s,
      },
    ],
    holds: [
      {
        side,
        prop,
        from: 1,
        fingers: HumanGrip.fingers(context.entry.pose, side),
        ...(use === undefined ? {} : { use }),
      },
    ],
    posture: (seconds: number): IAutoMovieMotionHumanPosture => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      const body: IAutoMovieMotionHumanPosture =
        pulled === null
          ? held
          : StrikingBlade.turned(
              held,
              pulled.turn *
                AutoMovieEngineMotionSampling.minimumJerk(t / duration).s,
            );
      return {
        ...body,
        limbs: {
          ...body.limbs,
          ...(pulled === null || retreat === null
            ? {}
            : {
                [pulled.limb]: {
                  point: retreat.wrist(t),
                  rotation: retreat.turn(t),
                  bend: pulled.bend,
                  planted: true,
                },
              }),
          [limb]: {
            point: transport.wrist(t),
            rotation: transport.turn(t),
            bend,
            // The arm leaves the grip's configuration as the draw moves the
            // hand away from it, so its pull fades with the draw's progress
            // instead of costing the hand its attitude at the top.
            reference: {
              ...reference,
              weight:
                1 - AutoMovieEngineMotionSampling.minimumJerk(t / duration).s,
            },
            planted: true,
          },
        },
      };
    },
  };

  // The fitted hand must stay on the guided object's grip.
  drawFromCarrierJudge(
    context,
    plan,
    bone,
    transport,
    pulled,
    retreat,
    prop,
    from.aperture,
  );
  // Each moving hand is planned as one admitted course over the draw, not
  // fitted afresh at every second, where two nearly tied arm solutions let
  // one instant take the other branch; the judgement above reads the goals.
  // The arm entered on its grip, so the hold spans the whole draw.
  const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
    start: 0,
    ready: 0,
    relax: duration,
    end: duration,
  };
  const drawing: IAutoMovieMotionHumanActionPlan = courseArmGoal({
    context,
    plan,
    side,
    span,
  });
  return pulled === null
    ? drawing
    : courseArmGoal({
        context,
        plan: drawing,
        side: pulled.side,
        span,
      });
}

/*
 * How far the gripped object's frame may sit from the seat when the draw
 * starts, metres: aperture placement's 15 mm seat tolerance.
 */
const SEATED: number = 0.015;
