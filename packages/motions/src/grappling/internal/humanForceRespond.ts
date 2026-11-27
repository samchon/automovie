import { AutoMovieEngineGravity, AutoMovieEngineVector3, AutoMovieEngineMotionSampling, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanForce, IAutoMovieMotionHumanForceResponse, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSustainedForce, IAutoMovieResolveBalanceOutcome, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanLean } from "../../compose/internal/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanForce } from "../../perform/internal/HumanForce";
import { HumanArmTrajectoryTerms } from "../../posture/internal/HumanArmTrajectoryTerms";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { GymnasticsFlight } from "../../sport/internal/GymnasticsFlight";
import { HumanForceDrawn } from "./HumanForceDrawn";
import { HumanForceExchange } from "./HumanForceExchange";
import { HumanForceThrow } from "./HumanForceThrow";

/*
 * The response to a pull open at the context's start
 * (`HumanForceResponse.plan`): the pull read from the force input, the base's
 * break by the pendulum law, and the chosen resist, yield or throw built from
 * one tip of the whole body about the ankles.
 * Parameter context: The action's context.
 * Parameter chosen: The outcome to play.
 * Parameter outcome: The balance outcome the impulse at the start gives.
 * Returns: The plan.
 * When no pull is open at the start, or the outcome is
 * not one the pull can produce.
 */
export function humanForceRespond(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanForceResponse.IParams>,
  chosen: IAutoMovieMotionHumanForceResponse.Outcome,
  outcome: IAutoMovieResolveBalanceOutcome.IOutcome,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanBody = context.body;
  const model: IAutoMovieResolveCenterOfMass.IModel =
    GymnasticsFlight.model(body);
  const w: number = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassFrequency(
    AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPendulum(body.measure.hipHeight),
  );

  // The pull open at the start.
  const open: IAutoMovieMotionHumanSustainedForce[] = (
    context.forces?.(0, 0) ?? []
  ).filter(
    (f: IAutoMovieMotionHumanForce): f is IAutoMovieMotionHumanSustainedForce =>
      f.kind === "sustained",
  );
  const sum: IAutoMovieVector3 = open.reduce(
    (
      s: IAutoMovieVector3,
      f: IAutoMovieMotionHumanSustainedForce,
    ): IAutoMovieVector3 => AutoMovieEngineVector3.add(s, HumanForce.at(f, context.start)),
    { x: 0, y: 0, z: 0 },
  );
  const force: number = Math.hypot(sum.x, sum.z);
  if (open.length === 0 || !(force > 0))
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "outcome",
      value: chosen,
      feasible: null,
      reason: `a ${chosen} answers a pull, and no sustained force acts on ${context.subject} at the start`,
      fix: "give the pull as a sustained force on the performer at the start",
    });
  const direction: IAutoMovieVector3 = {
    x: sum.x / force,
    y: 0,
    z: sum.z / force,
  };
  const span: number =
    Math.min(
      ...open.map((f: IAutoMovieMotionHumanSustainedForce): number => f.to),
    ) - context.start;

  // The centre, the planted base and the pivot at the ankles.
  const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    context.entry.pose,
  );
  const centre: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
    model,
    bones,
  );
  const base: IAutoMovieVector3[] = HumanFoot.base(body, bones);
  const feet = context.entry.feet;
  const pivot: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
    AutoMovieEngineVector3.add(feet.left.ankle, feet.right.ankle),
    0.5,
  );
  const height: number = centre.y - pivot.y;
  const forward: IAutoMovieVector3 = {
    x: Math.sin((entry.yaw * Math.PI) / 180),
    y: 0,
    z: Math.cos((entry.yaw * Math.PI) / 180),
  };
  // The body's right: +X is its left when it faces +Z.
  const right: IAutoMovieVector3 = { x: -forward.z, y: 0, z: forward.x };

  // The whole body tipped forward about the ankles by an angle: the pull's
  // part along the facing pitches it, and its part across moves the root
  // (`drawn`). The pivot is read in the posture's own root frame, so no tip
  // is the posture itself and the root never jumps when the response
  // begins (`AutoMovieMotionHumanLean.about`).
  const tipped: (
    posture: IAutoMovieMotionHumanPosture,
    degrees: number,
  ) => IAutoMovieMotionHumanPosture = (
    posture: IAutoMovieMotionHumanPosture,
    degrees: number,
  ): IAutoMovieMotionHumanPosture =>
    AutoMovieMotionHumanLean.about(posture, pivot, {
      pitch: degrees,
      roll: 0,
    });
  const lean = (offset: number): number =>
    (Math.asin(Math.max(-1, Math.min(1, offset / height))) * 180) / Math.PI;

  // Standing with the feet side by side, the centre moves along the facing
  // by the ankles' tip of the whole body, and across it by the hips'
  // load and unload, the pelvis carried sideways over legs that keep their
  // feet (Winter 1995, "Human balance and posture control during standing
  // and walking", Gait Posture 3:193): so the pull's part along the facing
  // tips the body about the ankles, and its part across moves the root,
  // by the centre's own shift per shift of the root, read on the entry
  // posture with its legs solved. The centre is read through an iterative
  // leg fit, whose error is its place tolerance, not machine rounding: a
  // forward difference over a reading of relative error e takes a step of
  // about sqrt(e) of its scale (Nocedal and Wright, Numerical Optimization,
  // 2nd ed., section 8.1), here sqrt(tolerance / height) of the centre's
  // height.
  const across: number = (() => {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    const shown = (root: IAutoMovieVector3): IAutoMovieVector3 =>
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
        model,
        poseBones(
          body,
          resolveHumanPosture.seeded(
            body,
            { ...entry, root },
            undefined,
            {},
            resolution,
            undefined,
            projection,
          ).pose,
          resolution(),
        ),
      );
    const h: number = Math.sqrt(
      (HumanArmTrajectoryTerms.TOLERANCE / 1000) * height,
    );
    return (
      AutoMovieEngineVector3.dot(
        AutoMovieEngineVector3.subtract(
          shown(AutoMovieEngineVector3.add(entry.root, AutoMovieEngineVector3.scale(right, h))),
          shown(entry.root),
        ),
        right,
      ) / h
    );
  })();
  const drawn: (
    along: IAutoMovieVector3,
  ) => (
    posture: IAutoMovieMotionHumanPosture,
    offset: number,
  ) => IAutoMovieMotionHumanPosture = (
    along: IAutoMovieVector3,
  ): ((
    posture: IAutoMovieMotionHumanPosture,
    offset: number,
  ) => IAutoMovieMotionHumanPosture) => {
    const alongForward: number = AutoMovieEngineVector3.dot(along, forward);
    const alongRight: number = AutoMovieEngineVector3.dot(along, right);
    return (
      posture: IAutoMovieMotionHumanPosture,
      offset: number,
    ): IAutoMovieMotionHumanPosture => {
      const tip: IAutoMovieMotionHumanPosture = tipped(
        posture,
        lean(offset * alongForward),
      );
      return {
        ...tip,
        root: AutoMovieEngineVector3.add(
          tip.root,
          AutoMovieEngineVector3.scale(right, (offset * alongRight) / across),
        ),
      };
    };
  };

  // The grips' mean height, where the pull acts.
  const sites: number[] = open.map(
    (f: IAutoMovieMotionHumanSustainedForce): number =>
      HumanForceThrow.site(body, bones, f.at).y,
  );
  const grip: number =
    sites.reduce((s: number, y: number): number => s + y, 0) / sites.length;

  if (chosen === "resist") {
    // An impulse at the start that already fells the body leaves nothing
    // to resist the pull with.
    if (outcome.outcome === "fall")
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "outcome",
        value: chosen,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: outcome.bounds.step,
          unit: "N s",
        },
        reason:
          "an impulse at the start fells the body, which cannot then resist the pull",
        fix: "give a smaller impulse, or let the body fall",
      });
    const back: IAutoMovieVector3 = AutoMovieEngineVector3.scale(direction, -1);
    const behind: number = HumanForceExchange.edge(centre, back, base);
    const shift: number | null = HumanForceExchange.resisted({
      mass: model.mass,
      force,
      height: grip,
      edge: behind,
    });
    if (shift === null)
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "outcome",
        value: chosen,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: (model.mass * AutoMovieEngineGravity.STANDARD * behind) / grip,
          unit: "N",
        },
        reason: `a pull of ${force.toFixed(0)} N at ${grip.toFixed(2)} m moves the centre of pressure past the base ${behind.toFixed(2)} m behind`,
        fix: "pull with less force, or let the body yield",
      });
    const duration: number = Math.max(span, 1 / w);
    const plan: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, duration);
    const drawBack: ReturnType<typeof drawn> = drawn(back);
    return {
      ...plan,
      events: [{ name: "braced", share: Math.min(1, 1 / w / duration) }],
      posture: (seconds: number): IAutoMovieMotionHumanPosture =>
        drawBack(
          plan.posture(seconds),
          shift * AutoMovieEngineMotionSampling.minimumJerkShare(Math.min(1, Math.max(0, seconds * w))),
        ),
    };
  }

  // The base breaks where the extrapolated centre leaves it.
  const edge: number = HumanForceExchange.edge(centre, direction, base);
  const broken: number = HumanForceExchange.broken({
    mass: model.mass,
    frequency: w,
    edge,
    force,
  });
  if (!(broken <= span))
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "outcome",
      value: chosen,
      feasible: {
        kind: "range",
        minimum:
          span > 0
            ? HumanForceExchange.breaking({
                mass: model.mass,
                frequency: w,
                edge: Math.max(edge, Number.MIN_VALUE),
                seconds: span,
              })
            : null,
        maximum: null,
        unit: "N",
      },
      reason: `a pull of ${force.toFixed(0)} N for ${span.toFixed(2)} s breaks the base only after ${broken.toFixed(2)} s`,
      fix: "pull harder or for longer, or let the body resist",
    });
  const yielded: IAutoMovieMotionHumanActionPlan =
    AutoMovieMotionHumanBase.under(context, broken);
  const motion: HumanForceDrawn.IMotion = HumanForceDrawn.prepare({
    mass: model.mass,
    frequency: w,
    force,
  });
  const drawYield: ReturnType<typeof drawn> = drawn(direction);
  const yieldAt: (seconds: number) => IAutoMovieMotionHumanPosture = (
    seconds: number,
  ): IAutoMovieMotionHumanPosture =>
    drawYield(
      yielded.posture(Math.min(broken, seconds)),
      motion.offset(Math.min(broken, seconds)),
    );
  const plant = (
    part: HumanForceRespondPlantPart,
    to: number,
  ): IAutoMovieMotionHumanContactWindow => ({
    part,
    kind: "plant",
    from: 0,
    to,
    support: { kind: "ground" },
  });
  if (chosen === "yield")
    return {
      ...yielded,
      events: [{ name: "kuzushi", share: 1 }],
      contacts: [plant("leftFoot", 1), plant("rightFoot", 1)],
      posture: yieldAt,
    };
  const postureAtBreak: IAutoMovieMotionHumanPosture = yielded.posture(broken);
  const motionAtBreak: HumanForceDrawn.IState = motion.sample(broken);
  const frozenAtBreak: IAutoMovieMotionHumanPosture = GymnasticsFlight.frozen(
    body,
    drawYield(postureAtBreak, motionAtBreak.offset),
  );
  return HumanForceThrow.plan(context, {
    model,
    direction,
    broken,
    frozen: frozenAtBreak,
    speed: motionAtBreak.speed,
    force,
    grip,
    remaining: span - broken,
    yieldAt,
    plant,
  });
}

/*
 * The alternatives of `HumanForceRespondPlantPart`'s site.
 */
type HumanForceRespondPlantPart = "leftFoot" | "rightFoot";
