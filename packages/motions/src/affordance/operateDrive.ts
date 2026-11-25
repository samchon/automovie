import { AffordanceArticulation, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieAffordanceKind,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanOperate,
  IAutoMovieMotionHumanOperateDrive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropDrive,
  IAutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

/**
 * The part an operation moves on a prop that articulates, and the drive the
 * operation publishes for it: the hand and the part follow one function of the
 * stroke's progress, the prop posed at the articulation's travel there.
 *
 * The operated contact is the prop's articulation itself (a trigger, a button,
 * a knob) or a contact that rides one of the mechanism's kinds, however far up
 * its chain (a door's lever on its latch on its hinge, a drawer's pull on its
 * slider, `IAutoMovieAffordance.rides`). The stroke moves that articulation
 * from where the performance has it at the operation's start by the mechanism's
 * amount, converting a prior writer's coordinate of that degree through the
 * engine's articulation map, in the articulation's own unit and sign: degrees
 * for a hinge's swing or a knob's turn, metres for a slider's or a button's
 * travel. The hand's goal at a progress is the contact of the prop posed at
 * that travel, so the hand cannot drift from the part; the drive writes the
 * same travel at the same progress.
 */
export namespace operateDrive {
  /** The placement and starting state of the operated prop. */
  export type IContext = Pick<
    IAutoMovieMotionHumanActionContext,
    "prop" | "start"
  >;

  /** The stroke instants and progress that the published drive reads. */
  export type IClock = Pick<
    IAutoMovieMotionClock,
    "at" | "duration" | "progress"
  >;

  /**
   * The articulation kinds each mechanism moves: a hinge's leaf, a knob's turn
   * (a crank and a wheel turn alike), a slider's travel, a button's press (a
   * trigger's pull and a pedal's press alike).
   */
  export const KINDS: Readonly<
    Record<
      Exclude<IAutoMovieMotionHumanOperate.Mechanism["kind"], "insert">,
      ReadonlySet<AutoMovieAffordanceKind>
    >
  > = {
    hinge: new Set<AutoMovieAffordanceKind>(["hinge"]),
    knob: new Set<AutoMovieAffordanceKind>(["knob", "crank", "wheel"]),
    slider: new Set<AutoMovieAffordanceKind>(["slider"]),
    button: new Set<AutoMovieAffordanceKind>(["button", "trigger", "pedal"]),
  };

  /**
   * A mechanism's signed amount in its articulation's unit: a button's press
   * and a slider's travel in metres (a button's 0.005 when absent, as `operate`
   * presses it), a knob's turn and a hinge's swing in degrees.
   *
   * @param mechanism The mechanism, not an insertion.
   * @returns The amount.
   */
  export function amount(
    mechanism: IAutoMovieMotionHumanOperateDrive.IAmountMechanism,
  ): number {
    switch (mechanism.kind) {
      case "button":
        return mechanism.travel ?? 0.005;
      case "knob":
        return mechanism.turn;
      case "slider":
        return mechanism.travel;
      case "hinge":
        return mechanism.swing;
    }
  }

  /**
   * The operated part, when the target is a contact of a prop that articulates
   * and rides or is an articulation.
   *
   * @param context The operation's context.
   * @param at The operated contact.
   * @param amount The mechanism's signed amount in the articulation's unit.
   * @param kind The mechanism's kind, whose articulation kinds (`KINDS`) are
   *   looked for up the chain the contact rides.
   * @returns The part, or undefined for a rigid prop or a target that is not,
   *   and rides no, articulation of the mechanism's kinds.
   */
  export function part(
    context: IContext,
    at: IAutoMovieMotionTarget,
    amount: number,
    kind: Exclude<IAutoMovieMotionHumanOperate.Mechanism["kind"], "insert">,
  ): IAutoMovieMotionHumanOperateDrive.IPart | undefined {
    if (at.kind !== "prop") return undefined;
    const held: IAutoMovieMotionHumanPropReader = context.prop(at.subject);
    const articulate = held.prop.articulate;
    if (articulate === undefined) return undefined;
    const contact: IAutoMovieAffordance | undefined = (
      held.prop.affordances ?? []
    ).find((a: IAutoMovieAffordance): boolean => a.id === at.point);
    if (contact === undefined) return undefined;
    // The articulation the mechanism moves: the contact itself or the first
    // one of the mechanism's kinds up the chain it rides, so a door's lever
    // on its latch on its hinge swings the hinge and turns the latch.
    const kinds: ReadonlySet<AutoMovieAffordanceKind> = KINDS[kind];
    const byId: ReadonlyMap<string, IAutoMovieAffordance> = new Map(
      (held.prop.affordances ?? []).map(
        (a: IAutoMovieAffordance): [string, IAutoMovieAffordance] => [a.id, a],
      ),
    );
    let link: IAutoMovieAffordance | undefined = contact;
    let operated: IAutoMovieAffordance | undefined;
    const seen: Set<string> = new Set();
    const dependencies: Set<string> = new Set();
    while (link !== undefined && !seen.has(link.id)) {
      seen.add(link.id);
      const leader: string | null = AffordanceArticulation.leader(
        byId,
        link.id,
      );
      if (leader !== null) dependencies.add(leader);
      if (operated === undefined && kinds.has(link.kind)) operated = link;
      link = link.rides === undefined ? undefined : byId.get(link.rides);
    }
    if (operated === undefined) return undefined;
    const articulation: string = operated.id;
    const before: Readonly<Record<string, number>> =
      held.state?.(context.start) ?? {};
    const base: number | null = AffordanceArticulation.travel(
      byId,
      before,
      articulation,
    );
    if (base === null)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "kind",
        value: articulation,
        reason: `the current state of "${at.subject}" does not determine a valid travel of "${articulation}"`,
        fix: "give one valid input per coupled degree of freedom in the prop's current state",
      });
    const degree: string =
      AffordanceArticulation.leader(byId, articulation) ?? articulation;
    dependencies.delete(degree);

    // A prior writer may name a reversible follower. Resolve its ownership
    // once, retain unrelated opening inputs for legacy full-posing props, and
    // borrow only the current inputs capable of moving this contact.
    const leaders: ReadonlyMap<string, string | null> = new Map(
      Array.from(byId.keys(), (id: string): [string, string | null] => [
        id,
        AffordanceArticulation.leader(byId, id),
      ]),
    );
    const narrow: typeof held.prop.articulateSite = held.prop.articulateSite;
    const unrelated: Readonly<Record<string, number>> = Object.fromEntries(
      Object.entries(before).filter(([id]: [string, number]): boolean => {
        const leader: string = leaders.get(id) ?? id;
        return leader !== degree && !dependencies.has(leader);
      }),
    );
    const site = (
      id: string,
      state: Readonly<Record<string, number>>,
    ): IAutoMovieAffordance => {
      const posed: IAutoMovieAffordance | undefined =
        narrow?.(id, state) ??
        articulate({ ...unrelated, ...state }).affordances.find(
          (a: IAutoMovieAffordance): boolean => a.id === id,
        );
      if (posed === undefined)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "at",
          value: id,
          reason: `the posed ${at.subject} does not expose its declared contact`,
          fix: "keep this contact in the prop's articulation reader",
        });
      return posed;
    };
    const frame: IAutoMovieRigidTransform = held.frame(context.start);

    // A hinge's own line, read off the prop posed where the stroke starts.
    const line: IAutoMovieMotionHumanOperateDrive.ILine | undefined = (():
      | IAutoMovieMotionHumanOperateDrive.ILine
      | undefined => {
      if (operated.kind !== "hinge") return undefined;
      const pin: IAutoMovieAffordance = site(articulation, before);
      return {
        point: Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, pin.frame.translation),
        ),
        axis: Quaternion.rotateVector(
          Quaternion.multiply(frame.rotation, pin.frame.rotation),
          { x: 0, y: 1, z: 0 },
        ),
      };
    })();

    return {
      prop: at.subject,
      contact: contact.id,
      articulation,
      base,
      amount,
      ...(line === undefined ? {} : { line }),
      place: (
        progress: number,
        seconds?: number,
      ): IAutoMovieMotionHumanOperateDrive.IPlace => {
        const shown: IAutoMovieRigidTransform =
          seconds === undefined ? frame : held.frame(seconds);
        const state: Record<string, number> = {
          [articulation]: base + amount * progress,
        };
        if (dependencies.size !== 0)
          for (const [id, travel] of Object.entries(
            seconds === undefined || seconds === context.start
              ? before
              : (held.state?.(seconds) ?? before),
          ))
            if (dependencies.has(leaders.get(id) ?? id)) state[id] = travel;
        const moved: IAutoMovieAffordance = site(contact.id, state);
        const turn: IAutoMovieQuaternion = Quaternion.multiply(
          shown.rotation,
          moved.frame.rotation,
        );
        return {
          point: Vector3.add(
            shown.position,
            Quaternion.rotateVector(shown.rotation, moved.frame.translation),
          ),
          normal: Quaternion.rotateVector(turn, { x: 0, y: 1, z: 0 }),
        };
      },
    };
  }

  /**
   * A hinged leaf's line: the vertical through the point the mechanism names (a
   * door's), or else the operated prop's own hinge articulation (`IPart.line`),
   * however it lies: a gun cock's cross pin.
   *
   * @param context The operation's context.
   * @param mechanism The hinge mechanism.
   * @param part The operated part, when the prop articulates.
   * @returns The line.
   * @throws {HumanRefusal} When the mechanism names no point and the handle
   *   rides no hinge articulation.
   */
  export function hinge(
    context: IAutoMovieMotionHumanActionContext,
    mechanism: IAutoMovieMotionHumanOperateDrive.IHingeMechanism,
    part: IAutoMovieMotionHumanOperateDrive.IPart | undefined,
  ): IAutoMovieMotionHumanOperateDrive.IHinge {
    if (mechanism.hinge !== undefined)
      return { point: context.aim(mechanism.hinge, context.start).point };
    if (part?.line !== undefined) return part.line;
    throw new HumanRefusal({
      kind: "affordance",
      axis: "kind",
      value: "hinge",
      reason:
        "a hinged leaf names no hinge point and its handle rides no hinge articulation of a prop",
      fix: "give the hinge line's point, or operate a handle that rides a prop's hinge",
    });
  }

  /**
   * A point's distance from a hinge line, metres: the handle's radius about it,
   * the horizontal distance for a vertical line given by a point.
   *
   * @param line The line.
   * @param point The point.
   * @returns The radius.
   */
  export function radius(
    line: IAutoMovieMotionHumanOperateDrive.IHinge,
    point: IAutoMovieVector3,
  ): number {
    return line.axis === undefined
      ? Vector3.length(
          Vector3.subtract({ ...point, y: 0 }, { ...line.point, y: 0 }),
        )
      : Vector3.length(Vector3.subtract(point, foot(line, point)));
  }

  /**
   * The foot of a point on a hinge line: the line's point level with it for the
   * vertical line of a line given without an axis (a door's, the point's own
   * height kept exactly), its projection on the line otherwise.
   *
   * @param line The line.
   * @param point The point.
   * @returns The foot, world metres.
   */
  export function foot(
    line: IAutoMovieMotionHumanOperateDrive.IHinge,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    if (line.axis === undefined) return { ...line.point, y: point.y };
    return Vector3.add(
      line.point,
      Vector3.scale(
        line.axis,
        Vector3.dot(Vector3.subtract(point, line.point), line.axis),
      ),
    );
  }

  /**
   * The drive an operation publishes for its part: the travel at the stroke's
   * minimum-jerk progress from `strokeStart` to `strokeEnd`, the progress the
   * hand's path is read at.
   *
   * @param part The part.
   * @param clock The operation's clock.
   * @returns The drive.
   */
  export function drive(
    part: IAutoMovieMotionHumanOperateDrive.IPart,
    clock: IClock,
  ): IAutoMovieMotionPropDrive {
    return {
      prop: part.prop,
      articulation: part.articulation,
      from: clock.at("strokeStart") / clock.duration,
      to: clock.at("strokeEnd") / clock.duration,
      travel: (seconds: number): number =>
        part.base +
        part.amount * clock.progress("strokeStart", "strokeEnd", seconds),
    };
  }
}
