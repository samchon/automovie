import type { AutoMovieEnginePhysicalBalanceTypes } from "./AutoMovieEnginePhysicalBalanceTypes";
import { physicalIcpController } from "./physicalIcpController";
import { physicalIcpPlanner } from "./physicalIcpPlanner";
import { physicalIcpPlannerTools as Tools } from "./physicalIcpPlannerTools";
import { physicalPlanarPolygon as Polygon } from "./physicalPlanarPolygon";
import { physicalSupportSpanContacts as Contacts } from "./physicalSupportSpanContacts";

/**
 * The closed forms a disturbance response is laid from
 * (`preparePhysicalDisturbanceSpan`): the plans' capture-point forms, their
 * values and the centre of mass's response to them, and the floor frame.
 */
export namespace physicalDisturbanceForm {
  /** One planted foot of a disturbance span, as the span prepares it. */
  export type Foot = AutoMovieEnginePhysicalBalanceTypes.PrepareDisturbanceSpan.IFoot;

  /**
   * Zulu's walking timing the response is laid with: its default swing time
   * (`ZuluWalkingControllerParameters` l.709-712), which IHMC 201903 gives a
   * swing out of a double-support fall (`WalkingSingleSupportState` l.206-216);
   * its controller's period (`ZuluRobotModel.DEFAULT_CONTROL_DT` l.68), over
   * which the push recovery's windows count and the program's active constraint
   * is taken again; and the shortest swing out of a fall
   * (`WalkingSingleSupportState.hasMinimumTimePassed` l.412-413).
   */
  export const ZULU: Readonly<{
    swingTime: number;
    controlDt: number;
    minimumSwingTime: number;
  }> = {
    swingTime: 0.6,
    controlDt: 0.003,
    minimumSwingTime: 0.15,
  };

  /** A capture point and centre of mass at an instant. */
  export interface IState {
    /** The capture point. */
    xi: Tools.IFloor;

    /** The centre of mass. */
    c: Tools.IFloor;
  }

  /**
   * One closed form of a plan's capture point from a start time: q + r e^(omega
   * (t - start)), or a0 + a1 u + a2 u^2 + a3 u^3 with u = t - start.
   */
  export type IForm =
    | { kind: "exp"; start: number; q: Tools.IFloor; r: Tools.IFloor }
    | {
        kind: "poly";
        start: number;
        a: readonly [Tools.IFloor, Tools.IFloor, Tools.IFloor, Tools.IFloor];
      };

  /** A plan's capture point as consecutive closed forms, each until the next. */
  export type IReference = readonly IForm[];

  /** One closed-form piece of the response. */
  export interface IPiece {
    /** When it starts, local seconds. */
    start: number;

    /** When it ends, local seconds. */
    end: number;

    /** The walking state. */
    phase: AutoMovieEnginePhysicalBalanceTypes.PrepareDisturbanceSpan.ISample["phase"];

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
  export const WORLD: Polygon.IFrame = {
    origin: { x: 0, z: 0 },
    forward: { x: 0, z: 1 },
  };

  /** A floor point in the support's world-aligned frame. */
  export function toLocal(p: Tools.IFloor): Polygon.IPoint {
    return Polygon.local(WORLD, p);
  }

  /** A point of the world-aligned frame on the floor. */
  export function toWorld(p: Polygon.IPoint): Tools.IFloor {
    return Polygon.world(WORLD, p);
  }

  /** A foot's outline on the floor. */
  export function outline(foot: Foot): Tools.IFloor[] {
    return foot.polygon.map(
      (p: Polygon.IPoint): Tools.IFloor => Polygon.world(foot.frame, p),
    );
  }

  /** A foot as a planted contact: its outline's points on the floor. */
  export function contact(foot: Foot): Contacts.IContact {
    return { bone: foot.bone, points: outline(foot) };
  }

  /** A + k b. */
  export function add(
    a: Tools.IFloor,
    b: Tools.IFloor,
    k: number = 1,
  ): Tools.IFloor {
    return { x: a.x + k * b.x, z: a.z + k * b.z };
  }

  /** K p. */
  export function scaled(p: Tools.IFloor, k: number): Tools.IFloor {
    return { x: p.x * k, z: p.z * k };
  }

  /** A capture point at rest at a point from a time. */
  export function constant(start: number, p: Tools.IFloor): IForm[] {
    return [{ kind: "exp", start, q: p, r: { x: 0, z: 0 } }];
  }

  /**
   * A cubic over a duration from one point and rate to another
   * (`physicalIcpPlannerTools.cubic`), then the final point at rest.
   */
  export function cubic(
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
  export function segmented(
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
   * A double-support plan's cubic on fixed soles: its ends carried to where
   * their frames are (`physicalIcpPlanner`), then its final point at rest.
   */
  export function transfer(
    start: number,
    plan: physicalIcpPlanner.ITransferPlan,
    soles: physicalIcpPlanner.ISoles,
  ): IReference {
    const middle: Polygon.IFrame = Tools.midFeet(
      soles.left,
      soles.right,
      plan.fallback,
    );
    const frame = (
      attachment: physicalIcpPlanner.IAttachment,
    ): Polygon.IFrame =>
      attachment === "midFeet" ? middle : soles[attachment];
    return cubic(
      start,
      plan.cubicDuration,
      Tools.detach(frame(plan.initial.frame), plan.initial.state),
      Tools.detach(frame(plan.final.frame), plan.final.state),
    );
  }

  /** The form of a reference in force at a time. */
  export function formAt(reference: IReference, seconds: number): IForm {
    let form: IForm = reference[0]!;
    for (const candidate of reference)
      if (candidate.start <= seconds) form = candidate;
    return form;
  }

  /** A form's capture point and rate at a time. */
  export function value(
    form: IForm,
    seconds: number,
    omega: number,
  ): Tools.IState {
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
  export function evaluate(
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
  export function particular(
    form: IForm,
    seconds: number,
    omega: number,
  ): Tools.IFloor {
    const u: number = seconds - form.start;
    if (form.kind === "exp")
      return add(form.q, form.r, Math.exp(omega * u) / 2);
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
  export function capture(
    piece: IPiece,
    seconds: number,
    omega: number,
  ): Tools.IState {
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
  export function center(
    piece: IPiece,
    seconds: number,
    omega: number,
  ): Tools.IFloor {
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
  export function decompose(
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
  export function shift(form: IForm, start: number, omega: number): IForm {
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
}
