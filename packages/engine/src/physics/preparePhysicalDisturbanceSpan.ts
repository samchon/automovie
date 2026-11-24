// Closed forms ported from IHMC Open Robotics Software (Apache-2.0),
// 201903_Stable: ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/capturePoint/CapturePointTools.java
// computeDesiredCapturePointPosition, and capturePoint/
// CoMIntegrationTools.java integrateCoMPositionWithConstantCMP l.136-170 and
// integrateCoMPositionOverPolynomial l.355-370. See NOTICE.
import type { IAutoMovieVector3 } from "@automovie/interface";

import { physicalBipedPlan } from "./physicalBipedPlan";
import { physicalIcpController } from "./physicalIcpController";
import { physicalIcpPlanner } from "./physicalIcpPlanner";
import { physicalIcpPlannerTools as Tools } from "./physicalIcpPlannerTools";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";
import { physicalPushRecovery as Recovery } from "./physicalPushRecovery";

/**
 * A biped's response to a push, prepared once for the span: IHMC 201903's push
 * recovery and capture-point plans laid from the state just after the push,
 * every moving span a closed-form curve between the few branch points where the
 * response changes, and `sample(t)` a pure evaluation at any time in any
 * order.
 *
 * Branch points: the push; the step's trigger, when the capture point lies
 * outside the support and over `ICP_ERROR_THRESHOLD` from its plan
 * (`physicalPushRecovery.doubleSupport`), after the policy's reaction time; the
 * touchdown, the swing time later (`physicalBipedPlan.SWING_TIME`); the
 * standing state, once the transfer to standing is done; and the end of the
 * standing cubic.
 *
 * Between them each plan's capture point xi_d is a chain of closed forms read
 * off the built plan on fixed soles (`physicalIcpPlanner`): an exponential from
 * a constant pivot, q + r e^(omega t), or a cubic, a0 + a1 t + a2 t^2 + a3 t^3,
 * the single-support segments and the double-support cubics; the authored
 * capture point at rest is a constant. The ICP controller acts on the error e =
 * xi - xi_d (`physicalIcpController`, Zulu's gains):
 *
 * - Its proportional law, the pivot xi_d - xi_d' / omega + (1 + K_p) e, gives
 *   e(t) = e0 e^(-omega K_p t) along and across the plan's motion, split at
 *   each piece's start, a plan at rest taking the across gain both ways.
 * - Its centre-of-pressure constraint: while that pivot lies outside the support,
 *   the program holds it on the support, the projection of the unconstrained
 *   one taken as the piece starts, and the capture point is xi(t) = cmp + (xi0
 *
 *   - Cmp) e^(omega t) (`CapturePointTools .computeDesiredCapturePointPosition`)
 *       until the unconstrained pivot comes back inside, found in closed form
 *       where xi_d has a constant pivot, its path then a line; over a cubic it
 *       is held to the cubic's end.
 *
 * The centre of mass follows c' = omega (xi - c) in closed form on each piece:
 * a constant pivot's response (`CoMIntegrationTools
 * .integrateCoMPositionWithConstantCMP`), a cubic's
 * (`integrateCoMPositionOverPolynomial`), and an error term b e^(-lambda t)'s,
 * b omega / (omega - lambda) e^(-lambda t), with the homogeneous e^(-omega t)
 * term carrying the piece's initial value.
 *
 * The swing foot follows the planner's velocity-constrained cubic from its
 * place to the footstep at rest at both ends (`physicalIcpPlannerTools
 * .cubic`), on the floor as the recovery step's clearance is zero.
 *
 * Points are world floor points (x, z), metres; times local seconds.
 *
 * @param input The state just after the push.
 * @returns The prepared span.
 */
export function preparePhysicalDisturbanceSpan(
  input: preparePhysicalDisturbanceSpan.IInput,
): preparePhysicalDisturbanceSpan.ISpan {
  const { omega } = input;
  const t0: number = input.seconds;
  const xi0: Tools.IFloor = {
    x: input.center.x + input.velocity.x / omega,
    z: input.center.z + input.velocity.z / omega,
  };
  const c0: Tools.IFloor = { x: input.center.x, z: input.center.z };
  const both: Polygon.IPoint[] = Polygon.hull(
    input.feet.flatMap((foot: Foot): Polygon.IPoint[] =>
      outline(foot).map(toLocal),
    ),
  );
  const authored: Tools.IState = {
    position: { ...input.authored.position },
    velocity: { ...input.authored.velocity },
  };
  const pieces: IPiece[] = [];
  const branches: preparePhysicalDisturbanceSpan.IBranch[] = [
    { kind: "push", seconds: t0 },
  ];
  const fall: { state: Recovery.IState; swing?: string } =
    Recovery.doubleSupport({
      state: Recovery.initial(),
      capture: toLocal(xi0),
      desired: toLocal(authored.position),
      support: both,
      feet: input.feet.map((foot: Foot) => ({
        bone: foot.bone,
        centroid: Polygon.centroid(Polygon.hull(outline(foot).map(toLocal))),
      })),
      dt: physicalBipedPlan.CONTROL_DT,
      period: physicalBipedPlan.CONTROL_DT,
    });

  // No step: the controller returns the capture point to the authored one.
  if (fall.swing === undefined) {
    follow(pieces, {
      phase: "double",
      reference: constant(t0, authored.position),
      support: both,
      start: t0,
      end: Number.POSITIVE_INFINITY,
      xi: xi0,
      c: c0,
      omega,
    });
    branches.push({ kind: "end", seconds: t0 });
    return span(pieces, branches, undefined, input, () =>
      Object.fromEntries(
        input.feet.map((foot: Foot): [string, Tools.IFloor] => [
          foot.bone,
          foot.frame.origin,
        ]),
      ),
    );
  }

  // The reaction: the controller still on both feet.
  const trigger: number = t0 + Math.max(0, input.reactionSeconds ?? 0);
  const reacted: IState = follow(pieces, {
    phase: "double",
    reference: constant(t0, authored.position),
    support: both,
    start: t0,
    end: trigger,
    xi: xi0,
    c: c0,
    omega,
  });
  const swing: Foot = input.feet.find(
    (foot: Foot): boolean => foot.bone === fall.swing,
  )!;
  const support: Foot = input.feet.find(
    (foot: Foot): boolean => foot.bone !== fall.swing,
  )!;

  // The footstep in the support foot's one-step capture region over the swing
  // time (`physicalBipedPlan.check`).
  const frame: Polygon.IFrame = support.frame;
  const footWidth: number =
    Math.max(...support.polygon.map((p: Polygon.IPoint): number => p.y)) -
    Math.min(...support.polygon.map((p: Polygon.IPoint): number => p.y));
  const swinging: Polygon.IPoint = Polygon.local(frame, swing.frame.origin);
  const checked: ReturnType<typeof Recovery.checkAndUpdate> =
    Recovery.checkAndUpdate({
      state: Recovery.fall(fall.state),
      remaining: physicalBipedPlan.SWING_TIME,
      dt: physicalBipedPlan.CONTROL_DT,
      period: physicalBipedPlan.CONTROL_DT,
      region: {
        support: swinging.y > 0 ? "right" : "left",
        capture: Polygon.local(frame, reacted.xi),
        omega,
        foot: Polygon.hull(support.polygon),
        footWidth,
        range: input.maximumStep,
      },
      position: swinging,
      outline: Polygon.hull(
        outline(swing).map(
          (p: Tools.IFloor): Polygon.IPoint => Polygon.local(frame, p),
        ),
      ),
    });
  const target: Tools.IFloor = Polygon.world(frame, checked.position);
  const landing: Foot = {
    ...swing,
    frame: { origin: target, forward: swing.frame.forward },
  };
  const footstep: NonNullable<
    preparePhysicalDisturbanceSpan.ISpan["footstep"]
  > = { bone: swing.bone, position: target, viable: checked.region.length > 0 };
  branches.push({ kind: "trigger", seconds: trigger, bone: swing.bone });

  // Single support on the support foot: the plan from it to the footstep.
  const soles: physicalIcpPlanner.ISoles =
    support.side === "left"
      ? { left: support.frame, right: landing.frame }
      : { left: landing.frame, right: support.frame };
  const single: physicalIcpPlanner.ISinglePlan =
    physicalIcpPlanner.singleSupport({ support, footstep: landing, omega });
  const touchdown: number = trigger + physicalBipedPlan.SWING_TIME;
  const stepped: IState = follow(pieces, {
    phase: "single",
    reference: segmented(trigger, single),
    support: Polygon.hull(outline(support).map(toLocal)),
    start: trigger,
    end: touchdown,
    xi: reacted.xi,
    c: reacted.c,
    omega,
  });
  branches.push({ kind: "touchdown", seconds: touchdown, bone: swing.bone });

  // The transfer to standing holds the centre of mass projected onto the
  // support, done once its duration has run and the capture point is within
  // `maxErrorToStanding` of it (`TransferToStandingState.isDone`).
  const planted: Polygon.IPoint[] = Polygon.hull(
    [support, landing].flatMap((foot: Foot): Polygon.IPoint[] =>
      outline(foot).map(toLocal),
    ),
  );
  const last: Tools.IFloor = physicalIcpPlanner(
    single,
    physicalBipedPlan.SWING_TIME,
    soles,
  ).position;
  const hold: physicalIcpPlanner.ITransferPlan = physicalIcpPlanner.toStanding({
    feet:
      support.side === "left"
        ? { left: support, right: landing }
        : { left: landing, right: support },
    support: support.side,
    desired: last,
    center: stepped.c,
  });
  const holding: IReference = transfer(touchdown, hold, soles);
  const done: number = touchdown + physicalIcpPlanner.DEFAULTS.finalTransfer;
  const held: IState = follow(pieces, {
    phase: "toStanding",
    reference: holding,
    support: planted,
    start: touchdown,
    end: done,
    xi: stepped.xi,
    c: stepped.c,
    omega,
  });
  const point: Tools.IFloor = evaluate(holding, done, omega).position;
  const error: number = Math.hypot(held.xi.x - point.x, held.xi.z - point.z);
  const tolerance: number = physicalIcpPlanner.DEFAULTS.maxErrorToStanding;
  const standing: number =
    error < tolerance
      ? done
      : done +
        Math.log(error / tolerance) /
          (omega * physicalIcpController.ZULU.kpOrthogonal);
  const settled: IState =
    standing > done
      ? follow(pieces, {
          phase: "toStanding",
          reference: holding,
          support: planted,
          start: done,
          end: standing,
          xi: held.xi,
          c: held.c,
          omega,
        })
      : held;
  branches.push({ kind: "standing", seconds: standing });

  // Standing: the cubic from the hold to the authored capture point, then the
  // authored capture point itself.
  const cubicPlan: physicalIcpPlanner.ITransferPlan =
    physicalIcpPlanner.standing({
      soles,
      from: { position: point, velocity: { x: 0, z: 0 } },
      to: authored,
    });
  const end: number = standing + physicalIcpPlanner.DEFAULTS.finalTransfer;
  const stood: IState = follow(pieces, {
    phase: "standing",
    reference: transfer(standing, cubicPlan, soles),
    support: planted,
    start: standing,
    end,
    xi: settled.xi,
    c: settled.c,
    omega,
  });
  branches.push({ kind: "end", seconds: end });
  follow(pieces, {
    phase: "after",
    reference: constant(end, authored.position),
    support: planted,
    start: end,
    end: Number.POSITIVE_INFINITY,
    xi: stood.xi,
    c: stood.c,
    omega,
  });

  // The feet: the support planted, the swing foot on its cubic.
  const lift: Tools.IFloor = swing.frame.origin;
  return span(pieces, branches, footstep, input, (seconds: number) => ({
    [support.bone]: support.frame.origin,
    [swing.bone]:
      seconds <= trigger
        ? lift
        : seconds >= touchdown
          ? target
          : Tools.cubic(
              {
                duration: physicalBipedPlan.SWING_TIME,
                initial: lift,
                initialVelocity: { x: 0, z: 0 },
                final: target,
                finalVelocity: { x: 0, z: 0 },
              },
              seconds - trigger,
            ).position,
  }));
}

/** The span's input, branch points, sample and result. */
export namespace preparePhysicalDisturbanceSpan {
  /** The state just after the push. */
  export interface IInput {
    /** The push's time, local seconds. */
    seconds: number;

    /** The centre of mass just after the push, world metres. */
    center: IAutoMovieVector3;

    /** Its velocity, metres per second, the push's impulse over the mass added. */
    velocity: IAutoMovieVector3;

    /** The pendulum's rate, per second (IHMC's omega0). */
    omega: number;

    /**
     * The two planted feet: each its endpoint bone, its side, its sole frame
     * and its contact outline in that frame, x forward and y to the left
     * (`physicalBipedDesired.foot`).
     */
    feet: readonly IFoot[];

    /** The authored capture point and its rate at the push, held for the span. */
    authored: {
      position: { x: number; z: number };
      velocity: { x: number; z: number };
    };

    /** The policy's longest step, metres. */
    maximumStep: number;

    /** The policy's reaction time before a step, seconds; zero when absent. */
    reactionSeconds?: number;

    /** The floor's height, metres. */
    floor: number;
  }

  /** A planted foot. */
  export interface IFoot {
    /** Its endpoint bone. */
    bone: string;

    /** Its side. */
    side: "left" | "right";

    /** Its sole frame, world x and z. */
    frame: {
      origin: { x: number; z: number };
      forward: { x: number; z: number };
    };

    /** Its contact outline in the sole frame. */
    polygon: { x: number; y: number }[];
  }

  /** A branch point of the span. */
  export interface IBranch {
    /** What happens there. */
    kind: "push" | "trigger" | "touchdown" | "standing" | "end";

    /** When, local seconds. */
    seconds: number;

    /** The stepping foot, at a trigger or touchdown. */
    bone?: string;
  }

  /** The response at a time. */
  export interface ISample {
    /** The walking state the time falls in. */
    phase: "double" | "single" | "toStanding" | "standing" | "after";

    /** Whether the controller's pivot is held on the support. */
    saturated: boolean;

    /** The capture point, world x and z, metres. */
    capture: { x: number; z: number };

    /** Its rate, metres per second. */
    captureVelocity: { x: number; z: number };

    /** The centroidal moment pivot, world x and z, metres. */
    pivot: { x: number; z: number };

    /** The centre of mass, world metres, its height held from the push. */
    center: IAutoMovieVector3;

    /** Its velocity, metres per second, horizontal. */
    centerVelocity: IAutoMovieVector3;

    /** Each foot's endpoint on the floor, world metres, by bone. */
    feet: Record<string, IAutoMovieVector3>;
  }

  /** The prepared span. */
  export interface ISpan {
    /** Its branch points in time order. */
    branches: IBranch[];

    /** The recovery step's foot and footstep, if it steps. */
    footstep?: {
      bone: string;
      position: { x: number; z: number };
      viable: boolean;
    };

    /**
     * The response at a time: pure, in any order; before the push, the state
     * just after it.
     *
     * @param seconds Local seconds.
     * @returns The response.
     */
    sample(seconds: number): ISample;
  }
}

type Foot = preparePhysicalDisturbanceSpan.IFoot;

/** A capture point and centre of mass at an instant. */
interface IState {
  /** The capture point. */
  xi: Tools.IFloor;

  /** The centre of mass. */
  c: Tools.IFloor;
}

/**
 * One closed form of a plan's capture point from a start time: q + r e^(omega
 * (t - start)), or a0 + a1 u + a2 u^2 + a3 u^3 with u = t - start.
 */
type IForm =
  | { kind: "exp"; start: number; q: Tools.IFloor; r: Tools.IFloor }
  | {
      kind: "poly";
      start: number;
      a: readonly [Tools.IFloor, Tools.IFloor, Tools.IFloor, Tools.IFloor];
    };

/** A plan's capture point as consecutive closed forms, each until the next. */
type IReference = readonly IForm[];

/** One closed-form piece of the response. */
interface IPiece {
  /** When it starts, local seconds. */
  start: number;

  /** When it ends, local seconds. */
  end: number;

  /** The walking state. */
  phase: preparePhysicalDisturbanceSpan.ISample["phase"];

  /** Whether the pivot is held on the support. */
  saturated: boolean;

  /** The capture point's base form: the plan's, or the held pivot's. */
  form: IForm;

  /** The error's terms, b e^(-rate (t - start)). */
  errors: readonly { b: Tools.IFloor; rate: number }[];

  /** The centre of mass at the start. */
  c0: Tools.IFloor;
}

/** The world-aligned frame the support's polygons use. */
const WORLD: Polygon.IFrame = {
  origin: { x: 0, z: 0 },
  forward: { x: 0, z: 1 },
};

/** A floor point in the support's world-aligned frame. */
function toLocal(p: Tools.IFloor): Polygon.IPoint {
  return Polygon.local(WORLD, p);
}

/** A point of the world-aligned frame on the floor. */
function toWorld(p: Polygon.IPoint): Tools.IFloor {
  return Polygon.world(WORLD, p);
}

/** A foot's outline on the floor. */
function outline(foot: Foot): Tools.IFloor[] {
  return foot.polygon.map(
    (p: Polygon.IPoint): Tools.IFloor => Polygon.world(foot.frame, p),
  );
}

/** A + k b. */
function add(a: Tools.IFloor, b: Tools.IFloor, k: number = 1): Tools.IFloor {
  return { x: a.x + k * b.x, z: a.z + k * b.z };
}

/** K p. */
function scaled(p: Tools.IFloor, k: number): Tools.IFloor {
  return { x: p.x * k, z: p.z * k };
}

/** A capture point at rest at a point from a time. */
function constant(start: number, p: Tools.IFloor): IForm[] {
  return [{ kind: "exp", start, q: p, r: { x: 0, z: 0 } }];
}

/**
 * A cubic over a duration from one point and rate to another
 * (`physicalIcpPlannerTools.cubic`), then the final point at rest.
 */
function cubic(
  start: number,
  duration: number,
  from: Tools.IState,
  to: Tools.IState,
): IForm[] {
  if (!(duration > 0)) return constant(start, to.position);
  const T: number = duration;
  const axis = (key: "x" | "z"): [number, number, number, number] => {
    const z0: number = from.position[key];
    const v0: number = from.velocity[key];
    const z1: number = to.position[key];
    const v1: number = to.velocity[key];
    return [
      z0,
      v0,
      (3 * (z1 - z0)) / (T * T) - (2 * v0 + v1) / T,
      (2 * (z0 - z1)) / (T * T * T) + (v0 + v1) / (T * T),
    ];
  };
  const x: [number, number, number, number] = axis("x");
  const z: [number, number, number, number] = axis("z");
  return [
    {
      kind: "poly",
      start,
      a: [
        { x: x[0], z: z[0] },
        { x: x[1], z: z[1] },
        { x: x[2], z: z[2] },
        { x: x[3], z: z[3] },
      ],
    },
    ...constant(start + T, to.position),
  ];
}

/**
 * A single-support plan on its own soles as closed forms: the divergence from
 * the entry pivot, the cubic across the pivot switch, and the divergence from
 * the exit pivot after (`physicalIcpPlannerSegments`), its world copies being
 * its sole copies on the soles it was made on.
 */
function segmented(
  start: number,
  plan: physicalIcpPlanner.ISinglePlan,
): IReference {
  const s = plan.segments;
  const w = s.world;
  return [
    {
      kind: "exp",
      start,
      q: w.initialCmp,
      r: add(w.initialIcp, w.initialCmp, -1),
    },
    ...cubic(
      start + s.startOfSpline,
      s.endOfSpline - s.startOfSpline,
      w.start,
      w.end,
    ).slice(0, 1),
    {
      kind: "exp",
      start: start + s.endOfSpline,
      q: w.finalCmp,
      r: add(w.end.position, w.finalCmp, -1),
    },
  ];
}

/**
 * A double-support plan's cubic on fixed soles: its ends carried to where their
 * frames are (`physicalIcpPlanner`), then its final point at rest.
 */
function transfer(
  start: number,
  plan: physicalIcpPlanner.ITransferPlan,
  soles: physicalIcpPlanner.ISoles,
): IReference {
  const middle: Polygon.IFrame = Tools.midFeet(
    soles.left,
    soles.right,
    plan.fallback,
  );
  const frame = (attachment: physicalIcpPlanner.IAttachment): Polygon.IFrame =>
    attachment === "midFeet" ? middle : soles[attachment];
  return cubic(
    start,
    plan.cubicDuration,
    Tools.detach(frame(plan.initial.frame), plan.initial.state),
    Tools.detach(frame(plan.final.frame), plan.final.state),
  );
}

/** The form of a reference in force at a time. */
function formAt(reference: IReference, seconds: number): IForm {
  let form: IForm = reference[0]!;
  for (const candidate of reference)
    if (candidate.start <= seconds) form = candidate;
  return form;
}

/** A form's capture point and rate at a time. */
function value(form: IForm, seconds: number, omega: number): Tools.IState {
  const u: number = seconds - form.start;
  if (form.kind === "exp") {
    const grow: number = Math.exp(omega * u);
    return {
      position: add(form.q, form.r, grow),
      velocity: scaled(form.r, omega * grow),
    };
  }
  const [a0, a1, a2, a3] = form.a;
  return {
    position: {
      x: a0.x + u * (a1.x + u * (a2.x + u * a3.x)),
      z: a0.z + u * (a1.z + u * (a2.z + u * a3.z)),
    },
    velocity: {
      x: a1.x + u * (2 * a2.x + 3 * u * a3.x),
      z: a1.z + u * (2 * a2.z + 3 * u * a3.z),
    },
  };
}

/** A reference's capture point and rate at a time. */
function evaluate(
  reference: IReference,
  seconds: number,
  omega: number,
): Tools.IState {
  return value(formAt(reference, seconds), seconds, omega);
}

/**
 * A form's particular centre of mass under c' = omega (xi - c): the constant
 * pivot's, q + r / 2 e^(omega u) (`integrateCoMPositionWithConstantCMP`), or
 * the cubic's (`integrateCoMPositionOverPolynomial` l.355-370).
 */
function particular(form: IForm, seconds: number, omega: number): Tools.IFloor {
  const u: number = seconds - form.start;
  if (form.kind === "exp") return add(form.q, form.r, Math.exp(omega * u) / 2);
  const [a0, a1, a2, a3] = form.a;
  const axis = (key: "x" | "z"): number =>
    a3[key] * u * u * u +
    (a2[key] - (3 * a3[key]) / omega) * u * u +
    (a1[key] - (2 * a2[key]) / omega + (6 * a3[key]) / (omega * omega)) * u +
    (a0[key] -
      a1[key] / omega +
      (2 * a2[key]) / (omega * omega) -
      (6 * a3[key]) / (omega * omega * omega));
  return { x: axis("x"), z: axis("z") };
}

/** A piece's capture point and rate at a time. */
function capture(piece: IPiece, seconds: number, omega: number): Tools.IState {
  const base: Tools.IState = value(piece.form, seconds, omega);
  const u: number = seconds - piece.start;
  let position: Tools.IFloor = base.position;
  let velocity: Tools.IFloor = base.velocity;
  for (const error of piece.errors) {
    const decay: number = Math.exp(-error.rate * u);
    position = add(position, error.b, decay);
    velocity = add(velocity, error.b, -error.rate * decay);
  }
  return { position, velocity };
}

/** A piece's centre of mass at a time, its homogeneous term from c0. */
function center(piece: IPiece, seconds: number, omega: number): Tools.IFloor {
  const at = (u: number): Tools.IFloor => {
    let c: Tools.IFloor = particular(piece.form, piece.start + u, omega);
    for (const error of piece.errors)
      c = add(
        c,
        error.b,
        (omega / (omega - error.rate)) * Math.exp(-error.rate * u),
      );
    return c;
  };
  const u: number = seconds - piece.start;
  return add(at(u), add(piece.c0, at(0), -1), Math.exp(-omega * u));
}

/** The error's split along and across the plan's motion, with their gains. */
function decompose(
  motion: Tools.IFloor,
  error: Tools.IFloor,
  omega: number,
): { b: Tools.IFloor; rate: number; gain: number }[] {
  const length: number = Math.hypot(motion.x, motion.z);
  const across: number = physicalIcpController.ZULU.kpOrthogonal;
  if (!(length > Tools.EPSILON))
    return [{ b: error, rate: omega * across, gain: across }];
  const u: Tools.IFloor = scaled(motion, 1 / length);
  const along: Tools.IFloor = scaled(u, error.x * u.x + error.z * u.z);
  const parallel: number = physicalIcpController.ZULU.kpParallel;
  return [
    { b: along, rate: omega * parallel, gain: parallel },
    { b: add(error, along, -1), rate: omega * across, gain: across },
  ];
}

/** A form restarted at a time, its values unchanged. */
function shift(form: IForm, start: number, omega: number): IForm {
  const u: number = start - form.start;
  if (form.kind === "exp")
    return { ...form, start, r: scaled(form.r, Math.exp(omega * u)) };
  const [a0, a1, a2, a3] = form.a;
  const axis = (key: "x" | "z"): [number, number, number, number] => [
    a0[key] + u * (a1[key] + u * (a2[key] + u * a3[key])),
    a1[key] + u * (2 * a2[key] + 3 * u * a3[key]),
    a2[key] + 3 * u * a3[key],
    a3[key],
  ];
  const x: [number, number, number, number] = axis("x");
  const z: [number, number, number, number] = axis("z");
  return {
    kind: "poly",
    start,
    a: [
      { x: x[0], z: z[0] },
      { x: x[1], z: z[1] },
      { x: x[2], z: z[2] },
      { x: x[3], z: z[3] },
    ],
  };
}

/**
 * The response over an interval tracking a reference on a support, piece by
 * piece: at each form's start the error is split again; while the unconstrained
 * pivot lies outside the support the pivot is held there. Pushes its pieces and
 * returns the state at the interval's end.
 */
function follow(
  pieces: IPiece[],
  input: {
    phase: IPiece["phase"];
    reference: IReference;
    support: readonly Polygon.IPoint[];
    start: number;
    end: number;
    xi: Tools.IFloor;
    c: Tools.IFloor;
    omega: number;
  },
): IState {
  const { omega } = input;
  let t: number = input.start;
  let state: IState = { xi: input.xi, c: input.c };
  const push = (piece: IPiece): void => {
    pieces.push(piece);
    if (Number.isFinite(piece.end))
      state = {
        xi: capture(piece, piece.end, omega).position,
        c: center(piece, piece.end, omega),
      };
  };
  for (let guard: number = 0; guard < 64 && t < input.end; ++guard) {
    const form: IForm = formAt(input.reference, t);
    const next: number | undefined = input.reference.find(
      (candidate: IForm): boolean => candidate.start > t,
    )?.start;
    const until: number = Math.min(input.end, next ?? Number.POSITIVE_INFINITY);
    const desired: Tools.IState = value(form, t, omega);
    const split: { b: Tools.IFloor; rate: number; gain: number }[] = decompose(
      desired.velocity,
      add(state.xi, desired.position, -1),
      omega,
    );
    const unconstrained: Tools.IFloor = split.reduce(
      (sum: Tools.IFloor, term): Tools.IFloor =>
        add(sum, term.b, 1 + term.gain),
      add(desired.position, desired.velocity, -1 / omega),
    );
    if (
      input.support.length < 3 ||
      Polygon.inside(input.support, toLocal(unconstrained))
    ) {
      push({
        start: t,
        end: until,
        phase: input.phase,
        saturated: false,
        form: shift(form, t, omega),
        errors: split.map((term) => ({ b: term.b, rate: term.rate })),
        c0: state.c,
      });
      t = until;
      continue;
    }

    // The pivot held on the support: xi = cmp + (xi0 - cmp) e^(omega u).
    const held: Tools.IFloor = toWorld(
      Polygon.project(input.support, toLocal(unconstrained)),
    );
    const d: Tools.IFloor = add(state.xi, held, -1);
    const exit: number =
      form.kind === "exp"
        ? reentry(
            {
              ...form,
              start: t,
              r: scaled(form.r, Math.exp(omega * (t - form.start))),
            },
            held,
            d,
            split,
            input.support,
            omega,
          )
        : until;
    const stop: number = exit > t && exit < until ? exit : until;
    push({
      start: t,
      end: stop,
      phase: input.phase,
      saturated: true,
      form: { kind: "exp", start: t, q: held, r: d },
      errors: [],
      c0: state.c,
    });
    t = stop;
  }
  return state;
}

/**
 * When the unconstrained pivot comes back inside the support while the pivot is
 * held, over a reference form with a constant pivot q from the same start: with
 * xi = cmp + d s and xi_d = q + r s, s = e^(omega u), the pivot q + K (cmp
 *
 * - Q + (d - r) s) moves along a line in s, inside a convex polygon over an
 *   interval of s found edge by edge. Never, when it stays outside.
 */
function reentry(
  form: Extract<IForm, { kind: "exp" }>,
  held: Tools.IFloor,
  d: Tools.IFloor,
  split: readonly { b: Tools.IFloor; gain: number }[],
  support: readonly Polygon.IPoint[],
  omega: number,
): number {
  // The gain operator of the split: K v = sum (1 + k_i) (v . u_i) u_i over
  // its unit directions, or (1 + k) v for a single gain.
  const units: { u: Tools.IFloor; k: number }[] = split
    .filter((term) => Math.hypot(term.b.x, term.b.z) > 0)
    .map((term) => ({
      u: scaled(term.b, 1 / Math.hypot(term.b.x, term.b.z)),
      k: 1 + term.gain,
    }));
  const gain = (v: Tools.IFloor): Tools.IFloor =>
    split.length === 1 || units.length < 2
      ? scaled(v, 1 + (split[0]?.gain ?? 0))
      : units.reduce(
          (sum: Tools.IFloor, unit): Tools.IFloor =>
            add(sum, unit.u, unit.k * (v.x * unit.u.x + v.z * unit.u.z)),
          { x: 0, z: 0 },
        );
  const base: Tools.IFloor = add(form.q, gain(add(held, form.q, -1)));
  const slope: Tools.IFloor = gain(add(d, form.r, -1));
  const b0: Polygon.IPoint = toLocal(base);
  const b1: Polygon.IPoint = toLocal(add(base, slope));
  const direction: Polygon.IPoint = { x: b1.x - b0.x, y: b1.y - b0.y };
  const centre: Polygon.IPoint = Polygon.centroid([...support]);
  let lower: number = 1;
  let upper: number = Number.POSITIVE_INFINITY;
  for (let i: number = 0; i < support.length; ++i) {
    const a: Polygon.IPoint = support[i]!;
    const b: Polygon.IPoint = support[(i + 1) % support.length]!;
    const cross = (p: Polygon.IPoint): number =>
      (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
    const sign: number = cross(centre) >= 0 ? 1 : -1;
    const alpha: number = sign * cross(b0);
    const beta: number =
      sign * ((b.x - a.x) * direction.y - (b.y - a.y) * direction.x);
    if (beta > 0) lower = Math.max(lower, -alpha / beta);
    else if (beta < 0) upper = Math.min(upper, -alpha / beta);
    else if (alpha < 0) upper = Number.NEGATIVE_INFINITY;
  }
  if (!(lower <= upper) || !Number.isFinite(lower))
    return Number.POSITIVE_INFINITY;
  return form.start + Math.log(lower) / omega;
}

/** The span from its pieces. */
function span(
  pieces: readonly IPiece[],
  branches: preparePhysicalDisturbanceSpan.IBranch[],
  footstep: preparePhysicalDisturbanceSpan.ISpan["footstep"],
  input: preparePhysicalDisturbanceSpan.IInput,
  feet: (seconds: number) => Record<string, Tools.IFloor>,
): preparePhysicalDisturbanceSpan.ISpan {
  const { omega } = input;
  return {
    branches,
    ...(footstep ? { footstep } : {}),
    sample: (seconds: number): preparePhysicalDisturbanceSpan.ISample => {
      const piece: IPiece | undefined =
        pieces.find((p: IPiece): boolean => seconds < p.end) ??
        pieces[pieces.length - 1];
      if (piece === undefined) throw new Error("A span has no piece.");
      const at: number = Math.max(piece.start, seconds);
      const xi: Tools.IState = capture(piece, at, omega);
      const c: Tools.IFloor = center(piece, at, omega);
      return {
        phase: piece.phase,
        saturated: piece.saturated,
        capture: xi.position,
        captureVelocity: xi.velocity,
        pivot: add(xi.position, xi.velocity, -1 / omega),
        center: { x: c.x, y: input.center.y, z: c.z },
        centerVelocity: {
          x: omega * (xi.position.x - c.x),
          y: 0,
          z: omega * (xi.position.z - c.z),
        },
        feet: Object.fromEntries(
          Object.entries(feet(seconds)).map(
            ([bone, p]: [string, Tools.IFloor]): [
              string,
              IAutoMovieVector3,
            ] => [bone, { x: p.x, y: input.floor, z: p.z }],
          ),
        ),
      };
    },
  };
}
