// Closed forms ported from IHMC Open Robotics Software (Apache-2.0),
// 201903_Stable: ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/capturePoint/CapturePointTools.java
// computeDesiredCapturePointPosition, and capturePoint/
// CoMIntegrationTools.java integrateCoMPositionWithConstantCMP l.136-170 and
// integrateCoMPositionOverPolynomial l.355-370. See NOTICE.
import type { IAutoMovieVector3 } from "@automovie/interface";

import { physicalBipedPlan } from "./physicalBipedPlan";
import { physicalBipedTouchdown } from "./physicalBipedTouchdown";
import { physicalIcpController } from "./physicalIcpController";
import { physicalIcpPlanner } from "./physicalIcpPlanner";
import { physicalIcpPlannerTools as Tools } from "./physicalIcpPlannerTools";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";
import { physicalPushRecovery as Recovery } from "./physicalPushRecovery";

/**
 * A biped's response to a stated disturbance, prepared once for the span: IHMC
 * 201903's push recovery and capture-point plans laid from the state just after
 * the first push, every moving span a closed-form curve between the few branch
 * points where the response changes, and `sample(t)` a pure evaluation at any
 * time in any order.
 *
 * Branch points, and what each does as the reference's states do:
 *
 * - A push: the centre of mass's velocity jumps by the push's impulse over the
 *   mass, the capture point by that over omega. In double support the push
 *   recovery's fall test runs (`physicalPushRecovery.doubleSupport`), and a
 *   fall triggers a step the policy's reaction time after the capture point
 *   left the support; in single support the footstep is checked again against
 *   the capture region with the swing time left and, when it moves, the plan is
 *   made again from then (`WalkingSingleSupportState` l.136-163) and the swing
 *   foot's cubic re-aimed from where it is.
 * - The trigger: the footstep in the support foot's one-step capture region
 *   (`physicalPushRecovery.checkAndUpdate`, as `physicalBipedPlan` checks it)
 *   and the single-support plan to it (`physicalIcpPlanner.singleSupport`).
 * - The touchdown, the swing time after the trigger
 *   (`physicalBipedPlan.SWING_TIME`): the transfer to standing
 *   (`physicalIcpPlanner.toStanding`), done once its duration has run and the
 *   capture point is within `maxErrorToStanding` of its hold
 *   (`TransferToStandingState.isDone`), found in closed form from the error's
 *   decay.
 * - Standing: the cubic to the authored capture point
 *   (`physicalIcpPlanner.standing`), and at its end the authored capture point
 *   at rest.
 *
 * Between them each plan's capture point xi_d is a chain of closed forms read
 * off the built plan on fixed soles: an exponential from a constant pivot, q +
 * r e^(omega t), or a cubic, a0 + a1 t + a2 t^2 + a3 t^3. The ICP controller
 * acts on the error e = xi - xi_d (`physicalIcpController`, Zulu's gains):
 *
 * - Its proportional law, the pivot xi_d - xi_d' / omega + (1 + K_p) e, gives
 *   e(t) = e0 e^(-omega K_p t) along and across the plan's motion, split at
 *   each piece's start, a plan at rest taking the across gain both ways.
 * - Its centre-of-pressure constraint: while that pivot lies outside the support,
 *   the program holds it on the support, the projection of the unconstrained
 *   one taken as the piece starts, and xi(t) = cmp + (xi0 - cmp) e^(omega t)
 *   (`CapturePointTools.computeDesiredCapturePointPosition`) until the
 *   unconstrained pivot comes back inside, found in closed form where xi_d has
 *   a constant pivot, its path then a line; over a cubic it is held to the
 *   cubic's end.
 *
 * The centre of mass follows c' = omega (xi - c) in closed form on each piece:
 * a constant pivot's response (`CoMIntegrationTools
 * .integrateCoMPositionWithConstantCMP`), a cubic's
 * (`integrateCoMPositionOverPolynomial`), and an error term b e^(-lambda t)'s,
 * b omega / (omega - lambda) e^(-lambda t), with the homogeneous e^(-omega t)
 * term carrying the piece's initial value. The ground's reaction is the
 * pendulum's: m omega^2 (c - cmp) across the floor and the weight up, at the
 * pivot, shared between two planted feet by the pivot's place along the line
 * between them.
 *
 * A swing foot follows the planner's velocity-constrained cubic to its footstep
 * at rest (`physicalIcpPlannerTools.cubic`), on the floor as the recovery
 * step's clearance is zero.
 *
 * Points are world floor points (x, z), metres; times local seconds.
 *
 * @param input The state just after the first push and the pushes after it.
 * @returns The prepared span.
 */
export function preparePhysicalDisturbanceSpan(
  input: preparePhysicalDisturbanceSpan.IInput,
): preparePhysicalDisturbanceSpan.ISpan {
  const { omega } = input;
  const t0: number = input.seconds;
  const authored: Tools.IState = {
    position: { ...input.authored.position },
    velocity: { ...input.authored.velocity },
  };
  const pieces: IPiece[] = [];
  const branches: preparePhysicalDisturbanceSpan.IBranch[] = [
    { kind: "push", seconds: t0 },
  ];
  const pushes: preparePhysicalDisturbanceSpan.IPush[] = [
    ...(input.pushes ?? []),
  ]
    .filter((push): boolean => push.seconds > t0)
    .sort((a, b): number => a.seconds - b.seconds);
  const reaction: number = Math.max(0, input.reactionSeconds ?? 0);
  const tolerance: number = physicalIcpPlanner.DEFAULTS.maxErrorToStanding;
  const across: number = physicalIcpController.ZULU.kpOrthogonal;

  // The feet: where each stands from when, each swing's cubic, and which
  // stand on the floor from when.
  const placed: Map<string, Foot> = new Map(
    input.feet.map((foot: Foot): [string, Foot] => [foot.bone, foot]),
  );
  const swings: ISwing[] = [];
  const contacts: { start: number; bones: string[] }[] = [
    { start: t0, bones: input.feet.map((foot: Foot): string => foot.bone) },
  ];
  const planted = (): Foot[] =>
    contacts[contacts.length - 1]!.bones.map(
      (bone: string): Foot => placed.get(bone)!,
    );
  const supportOf = (feet: readonly Foot[]): Polygon.IPoint[] =>
    Polygon.hull(
      feet.flatMap((foot: Foot): Polygon.IPoint[] =>
        outline(foot).map(toLocal),
      ),
    );
  const soles = (): physicalIcpPlanner.ISoles => {
    const feet: Foot[] = [...placed.values()];
    const left: Foot =
      feet.find((foot: Foot): boolean => foot.side === "left") ?? feet[0]!;
    const right: Foot =
      feet.find((foot: Foot): boolean => foot.side === "right") ?? feet[1]!;
    return { left: left.frame, right: right.frame };
  };

  let state: IState = {
    xi: {
      x: input.center.x + input.velocity.x / omega,
      z: input.center.z + input.velocity.z / omega,
    },
    c: { x: input.center.x, z: input.center.z },
  };
  let t: number = t0;
  let mode: IPiece["phase"] = "double";
  let reference: IReference = constant(t0, authored.position);
  let outside: number | undefined;
  let recovery: Recovery.IState = Recovery.initial();
  let trigger: { at: number; swing: string } | undefined;
  let step:
    | {
        support: Foot;
        swing: Foot;
        target: Tools.IFloor;
        touchdown: number;
        plan: physicalIcpPlanner.ISinglePlan;
        viable: boolean;
      }
    | undefined;
  let hold:
    | { reference: IReference; done: number; checked: boolean }
    | undefined;
  let standingEnd: number | undefined;
  let footstep: preparePhysicalDisturbanceSpan.ISpan["footstep"];

  // The push recovery's double-support fall test at a branch point.
  const test = (): void => {
    if (mode === "single") return;
    const feet: Foot[] = planted();
    const fall: { state: Recovery.IState; swing?: string } =
      Recovery.doubleSupport({
        state: recovery,
        capture: toLocal(state.xi),
        desired: toLocal(evaluate(reference, t, omega).position),
        support: supportOf(feet),
        feet: feet.map((foot: Foot) => ({
          bone: foot.bone,
          centroid: Polygon.centroid(supportOf([foot])),
        })),
        dt: physicalBipedPlan.CONTROL_DT,
        period: physicalBipedPlan.CONTROL_DT,
      });
    recovery = fall.state;
    if (fall.swing === undefined) {
      outside = undefined;
      trigger = undefined;
      return;
    }
    outside ??= t;
    trigger = { at: Math.max(t, outside + reaction), swing: fall.swing };
  };

  // The footstep in the support foot's one-step capture region with a swing
  // time left (`physicalBipedPlan.check`).
  const place = (
    support: Foot,
    swing: Foot,
    from: Tools.IFloor,
    remaining: number,
  ): {
    target: Tools.IFloor;
    viable: boolean;
    adjusted: boolean;
    preferred: number;
  } => {
    const frame: Polygon.IFrame = support.frame;
    const ys: number[] = support.polygon.map(
      (p: Polygon.IPoint): number => p.y,
    );
    const swinging: Polygon.IPoint = Polygon.local(frame, swing.frame.origin);
    const region: Recovery.IRegion = {
      support: swinging.y > 0 ? "right" : "left",
      capture: Polygon.local(frame, state.xi),
      omega,
      foot: Polygon.hull(support.polygon),
      footWidth: Math.max(...ys) - Math.min(...ys),
      range: input.maximumStep,
    };
    const checked: ReturnType<typeof Recovery.checkAndUpdate> =
      Recovery.checkAndUpdate({
        state: recovery,
        remaining,
        dt: physicalBipedPlan.CONTROL_DT,
        period: physicalBipedPlan.CONTROL_DT,
        region,
        position: Polygon.local(frame, from),
        outline: Polygon.hull(
          outline({ ...swing, frame: { ...swing.frame, origin: from } }).map(
            (p: Tools.IFloor): Polygon.IPoint => Polygon.local(frame, p),
          ),
        ),
      });
    recovery = checked.state;
    return {
      target: Polygon.world(frame, checked.position),
      viable: checked.region.length > 0,
      adjusted: checked.adjusted,
      preferred: Recovery.preferredSwingTime({
        remaining,
        dt: physicalBipedPlan.CONTROL_DT,
        region,
      }),
    };
  };

  // The single-support plan from a time to a footstep.
  const plan = (
    support: Foot,
    swing: Foot,
    target: Tools.IFloor,
    duration: number,
  ) => {
    const landing: Foot = {
      ...swing,
      frame: { origin: target, forward: swing.frame.forward },
    };
    return physicalIcpPlanner.singleSupport({
      support,
      footstep: landing,
      omega,
      parameters: { swing: duration },
    });
  };

  test();
  for (let guard: number = 0; guard < 256; ++guard) {
    const push: number = pushes[0]?.seconds ?? Number.POSITIVE_INFINITY;
    const event: number =
      mode === "single"
        ? step!.touchdown
        : trigger !== undefined
          ? trigger.at
          : hold !== undefined
            ? hold.done
            : (standingEnd ?? Number.POSITIVE_INFINITY);
    const next: number = Math.min(push, event);
    state = follow(pieces, {
      phase: mode,
      reference,
      support: supportOf(planted()),
      start: t,
      end: next,
      xi: state.xi,
      c: state.c,
      omega,
    });
    if (!Number.isFinite(next)) break;
    t = next;

    // A push: the velocity's jump, then the state's own test.
    if (push <= event) {
      const jump: IAutoMovieVector3 = pushes.shift()!.velocity;
      state = {
        xi: { x: state.xi.x + jump.x / omega, z: state.xi.z + jump.z / omega },
        c: state.c,
      };
      branches.push({ kind: "push", seconds: t });
      if (mode !== "single") {
        test();
        continue;
      }
      const s = step!;
      recovery = Recovery.singleSupport({
        state: recovery,
        capture: toLocal(state.xi),
        desired: toLocal(evaluate(reference, t, omega).position),
      });
      const from: Tools.IState = swingAt(swings, s.swing.bone, t);
      const moved = place(s.support, s.swing, from.position, s.touchdown - t);
      if (!moved.adjusted) continue;
      s.target = moved.target;
      s.viable = moved.viable;
      s.plan = plan(s.support, s.swing, s.target, s.touchdown - t);
      reference = segmented(t, s.plan);
      swings.push({
        bone: s.swing.bone,
        start: t,
        end: s.touchdown,
        from,
        to: s.target,
      });
      footstep = { bone: s.swing.bone, position: s.target, viable: s.viable };
      continue;
    }

    // The trigger: the step out of a fall.
    if (mode !== "single" && trigger !== undefined && t >= trigger.at) {
      const swing: Foot = placed.get(trigger.swing)!;
      const support: Foot = planted().find(
        (foot: Foot): boolean => foot.bone !== swing.bone,
      )!;
      recovery = Recovery.fall(recovery);
      const placedAt = place(
        support,
        swing,
        swing.frame.origin,
        physicalBipedPlan.SWING_TIME,
      );

      // The swing sped up to the time the capture region prefers, no shorter
      // than a recovery's minimum (`WalkingSingleSupportState
      // .requestSwingSpeedUpIfNeeded` l.364-381, `hasMinimumTimePassed`
      // l.405-414).
      const duration: number =
        placedAt.preferred > 0
          ? Math.max(
              physicalBipedTouchdown.MINIMUM_SWING_TIME,
              Math.min(physicalBipedPlan.SWING_TIME, placedAt.preferred),
            )
          : physicalBipedPlan.SWING_TIME;
      step = {
        support,
        swing,
        target: placedAt.target,
        touchdown: t + duration,
        plan: plan(support, swing, placedAt.target, duration),
        viable: placedAt.viable,
      };
      footstep = {
        bone: swing.bone,
        position: placedAt.target,
        viable: placedAt.viable,
      };
      swings.push({
        bone: swing.bone,
        start: t,
        end: step.touchdown,
        from: { position: swing.frame.origin, velocity: { x: 0, z: 0 } },
        to: placedAt.target,
      });
      contacts.push({ start: t, bones: [support.bone] });
      branches.push({ kind: "trigger", seconds: t, bone: swing.bone });
      reference = segmented(t, step.plan);
      mode = "single";
      trigger = undefined;
      outside = undefined;
      hold = undefined;
      standingEnd = undefined;
      continue;
    }

    // The touchdown: the transfer to standing.
    if (mode === "single") {
      const s = step!;
      const landing: Foot = {
        ...s.swing,
        frame: { origin: s.target, forward: s.swing.frame.forward },
      };
      placed.set(landing.bone, landing);
      contacts.push({ start: t, bones: [s.support.bone, landing.bone] });
      branches.push({ kind: "touchdown", seconds: t, bone: landing.bone });
      const last: Tools.IFloor = evaluate(reference, t, omega).position;
      const left: Foot = s.support.side === "left" ? s.support : landing;
      const right: Foot = s.support.side === "left" ? landing : s.support;
      reference = transfer(
        t,
        physicalIcpPlanner.toStanding({
          feet: { left, right },
          support: s.support.side,
          desired: last,
          center: state.c,
        }),
        soles(),
      );
      hold = {
        reference,
        done: t + physicalIcpPlanner.DEFAULTS.finalTransfer,
        checked: false,
      };
      mode = "toStanding";
      step = undefined;
      recovery = Recovery.reset(recovery);
      test();
      continue;
    }

    // The transfer to standing's exit test, then its exit.
    if (hold !== undefined) {
      const point: Tools.IFloor = evaluate(hold.reference, t, omega).position;
      const error: number = Math.hypot(
        state.xi.x - point.x,
        state.xi.z - point.z,
      );
      if (!hold.checked && !(error < tolerance)) {
        hold.checked = true;
        hold.done = t + Math.log(error / tolerance) / (omega * across);
        continue;
      }
      reference = transfer(
        t,
        physicalIcpPlanner.standing({
          soles: soles(),
          from: { position: point, velocity: { x: 0, z: 0 } },
          to: authored,
        }),
        soles(),
      );
      branches.push({ kind: "standing", seconds: t });
      standingEnd = t + physicalIcpPlanner.DEFAULTS.finalTransfer;
      mode = "standing";
      recovery = Recovery.reset(recovery);
      hold = undefined;
      test();
      continue;
    }

    // The standing cubic's end: the authored capture point at rest.
    branches.push({ kind: "end", seconds: t });
    reference = constant(t, authored.position);
    mode = "after";
    standingEnd = undefined;
    test();
  }

  // The response's settling: the last piece's error within the tolerance of
  // its plan, from its decay.
  const last: IPiece = pieces[pieces.length - 1]!;
  const residual: number = last.errors.reduce(
    (sum: number, error): number => sum + Math.hypot(error.b.x, error.b.z),
    0,
  );
  const settled: number = Math.max(
    t,
    residual > tolerance
      ? last.start + Math.log(residual / tolerance) / (omega * across)
      : last.start,
  );
  if (!branches.some((branch): boolean => branch.kind === "end"))
    branches.push({ kind: "end", seconds: settled });
  return span({
    pieces,
    branches,
    footstep,
    input,
    until: settled,
    feet: (seconds: number): Record<string, Tools.IFloor> =>
      Object.fromEntries(
        input.feet.map((foot: Foot): [string, Tools.IFloor] => [
          foot.bone,
          swings.some(
            (swing: ISwing): boolean =>
              swing.bone === foot.bone && swing.start < seconds,
          )
            ? swingAt(swings, foot.bone, seconds).position
            : foot.frame.origin,
        ]),
      ),
    contacts: (seconds: number): string[] => {
      let bones: string[] = contacts[0]!.bones;
      for (const contact of contacts)
        if (contact.start <= seconds) bones = contact.bones;
      return bones;
    },
  });
}

/** The span's input, branch points, sample and result. */
export namespace preparePhysicalDisturbanceSpan {
  /** The state just after the first push and the pushes after it. */
  export interface IInput {
    /** The first push's time, local seconds. */
    seconds: number;

    /** The centre of mass just after it, world metres. */
    center: IAutoMovieVector3;

    /** Its velocity, metres per second, the push's impulse over the mass added. */
    velocity: IAutoMovieVector3;

    /** The pendulum's rate, per second (IHMC's omega0). */
    omega: number;

    /** The body's mass, kilograms. */
    mass: number;

    /** Gravity's magnitude, metres per second squared. */
    gravity: number;

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

    /** The pushes after the first, each its time and velocity jump. */
    pushes?: readonly IPush[];

    /** The policy's longest step, metres. */
    maximumStep: number;

    /** The policy's reaction time before a step, seconds; zero when absent. */
    reactionSeconds?: number;

    /** The floor's height, metres. */
    floor: number;
  }

  /** A later push of the stated disturbance. */
  export interface IPush {
    /** When, local seconds. */
    seconds: number;

    /** The centre of mass's velocity jump, metres per second. */
    velocity: IAutoMovieVector3;
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

    /**
     * The ground's reaction, newtons, at the pivot on the floor: m omega^2 (c -
     * cmp) across and the weight up.
     */
    reaction: { point: IAutoMovieVector3; force: IAutoMovieVector3 };

    /** Each planted foot's share of the reaction, by bone, summing to one. */
    loads: Record<string, number>;
  }

  /** The prepared span. */
  export interface ISpan {
    /** Its branch points in time order. */
    branches: IBranch[];

    /** The last recovery step's foot and footstep, if it steps. */
    footstep?: {
      bone: string;
      position: { x: number; z: number };
      viable: boolean;
    };

    /**
     * When the response has settled within `maxErrorToStanding` of its plan
     * after its last branch point, local seconds.
     */
    until: number;

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

/** A swing foot's cubic to its footstep. */
interface ISwing {
  /** The swinging foot's endpoint bone. */
  bone: string;

  /** When the cubic starts and lands, local seconds. */
  start: number;

  /** When it lands. */
  end: number;

  /** Where and how fast the foot is as the cubic starts. */
  from: Tools.IState;

  /** The footstep. */
  to: Tools.IFloor;
}

/** A swing foot's place and rate at a time on its latest cubic. */
function swingAt(
  swings: readonly ISwing[],
  bone: string,
  seconds: number,
): Tools.IState {
  let swing: ISwing | undefined;
  for (const candidate of swings)
    if (candidate.bone === bone && candidate.start <= seconds)
      swing = candidate;
  if (swing === undefined) throw new Error(`No swing of ${bone}.`);
  if (seconds >= swing.end)
    return { position: swing.to, velocity: { x: 0, z: 0 } };
  return Tools.cubic(
    {
      duration: swing.end - swing.start,
      initial: swing.from.position,
      initialVelocity: swing.from.velocity,
      final: swing.to,
      finalVelocity: { x: 0, z: 0 },
    },
    seconds - swing.start,
  );
}

/** The span from its pieces. */
function span(input: {
  pieces: readonly IPiece[];
  branches: preparePhysicalDisturbanceSpan.IBranch[];
  footstep: preparePhysicalDisturbanceSpan.ISpan["footstep"];
  input: preparePhysicalDisturbanceSpan.IInput;
  until: number;
  feet: (seconds: number) => Record<string, Tools.IFloor>;
  contacts: (seconds: number) => string[];
}): preparePhysicalDisturbanceSpan.ISpan {
  const { pieces } = input;
  const { omega, mass, gravity, floor } = input.input;
  return {
    branches: input.branches,
    ...(input.footstep ? { footstep: input.footstep } : {}),
    until: input.until,
    sample: (seconds: number): preparePhysicalDisturbanceSpan.ISample => {
      const piece: IPiece | undefined =
        pieces.find((p: IPiece): boolean => seconds < p.end) ??
        pieces[pieces.length - 1];
      if (piece === undefined) throw new Error("A span has no piece.");
      const at: number = Math.max(piece.start, seconds);
      const xi: Tools.IState = capture(piece, at, omega);
      const c: Tools.IFloor = center(piece, at, omega);
      const cmp: Tools.IFloor = add(xi.position, xi.velocity, -1 / omega);
      const feet: Record<string, Tools.IFloor> = input.feet(seconds);
      const planted: string[] = input.contacts(seconds);

      // The pivot's share along the line between two planted feet.
      const loads: Record<string, number> = {};
      if (planted.length === 1) loads[planted[0]!] = 1;
      else if (planted.length >= 2) {
        const a: Tools.IFloor = feet[planted[0]!]!;
        const b: Tools.IFloor = feet[planted[1]!]!;
        const line: Tools.IFloor = add(b, a, -1);
        const length: number = line.x * line.x + line.z * line.z;
        const share: number =
          length > 0
            ? Math.max(
                0,
                Math.min(
                  1,
                  ((cmp.x - a.x) * line.x + (cmp.z - a.z) * line.z) / length,
                ),
              )
            : 0.5;
        loads[planted[0]!] = 1 - share;
        loads[planted[1]!] = share;
      }
      return {
        phase: piece.phase,
        saturated: piece.saturated,
        capture: xi.position,
        captureVelocity: xi.velocity,
        pivot: cmp,
        center: { x: c.x, y: input.input.center.y, z: c.z },
        centerVelocity: {
          x: omega * (xi.position.x - c.x),
          y: 0,
          z: omega * (xi.position.z - c.z),
        },
        feet: Object.fromEntries(
          Object.entries(feet).map(
            ([bone, p]: [string, Tools.IFloor]): [
              string,
              IAutoMovieVector3,
            ] => [bone, { x: p.x, y: floor, z: p.z }],
          ),
        ),
        reaction: {
          point: { x: cmp.x, y: floor, z: cmp.z },
          force: {
            x: mass * omega * omega * (c.x - cmp.x),
            y: mass * gravity,
            z: mass * omega * omega * (c.z - cmp.z),
          },
        },
        loads,
      };
    },
  };
}
