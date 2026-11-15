import {
  type IAutoMovieHit,
  type IAutoMovieProjectile,
  type IAutoMovieProjectileState,
  Vector3,
  projectileContinue,
} from "@automovie/engine";
import type {
  IAutoMovieBody,
  IAutoMovieBodyContact,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanPropFlight } from "./HumanPropFlight";
import type { IHumanProp } from "./IHumanProp";

/**
 * How a prop's flight goes on after a contact (#3479), from its model body's
 * flight data (#3482): the outcome of each contact, and the legs that follow
 * the first one.
 *
 * At each contact the body decides, from the data it declares and nothing
 * else:
 *
 * - `stick` where it declares an embedding depth (`contact.embed`): its point
 *   goes that far on along its velocity and it rests there in what it
 *   struck, riding it;
 * - `pass` through a person where it declares a speed loss (`passLoss`): it
 *   flies on through that body, slower by the loss;
 * - `bounce` where it declares a restitution and a friction pair (its
 *   `kineticFriction`, else its static `friction`): Newton's restitution and
 *   Coulomb's impulse limit (`projectileContinue`), rolling on at its
 *   rolling resistance (`contact.rolling`) once a rebound would rise less
 *   than its radius, and coming to rest where it struck when it declares no
 *   rolling resistance;
 * - `roll` along the ground where it declares a rolling resistance and no
 *   restitution to bounce with;
 * - otherwise it stays where it struck, riding it: an outcome the body's data
 *   do not give is never invented.
 *
 * A body's radius is its least round shape's, or half the least extent of
 * its boxes; a body with no such shape has no rebound to measure, so it does
 * not bounce. A roll is on the ground and meets nothing on its way; a body
 * that rebounds and flies is swept again by the flight's one sweep.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each outcome, the datum that grants it, the bounce's settling rule and what a roll does not meet.
 * @evidence contracts/development/design.md#principled-representation A leg is an engine continuation segment timed from the launch with the contact that ends it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The leg, the body's drag, the decision, the chain of legs and a leg's frame; read by `HumanPropFlight`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every coefficient is the model body's; an absent datum withholds its outcome, never stands in as zero.
 */
export namespace HumanPropOutcome {
  /** A leg of a flight after its first contact. */
  export interface ILeg {
    /** Seconds since the launch it begins. */
    from: number;

    /** The engine's segment, its times since the launch. */
    segment: projectileContinue.Segment;

    /** Seconds since the launch it ends at a contact; Infinity when it does not. */
    end: number;

    /** The contact that ends it, absent when none does. */
    contact?: HumanPropFlight.IContact;
  }

  /** A meeting of a flight with what it strikes. */
  export interface IMeeting {
    /** The engine's hit, its time since the swept flight's own zero. */
    hit: IAutoMovieHit;

    /** What it struck. */
    struck: HumanPropFlight.Struck;

    /** The struck collider's id, for a pass that must leave it behind. */
    collider: string;
  }

  /**
   * The quadratic drag a prop's body declares (`IAutoMovieBody.drag`), with
   * its mass; none when it declares none.
   *
   * @param prop The prop.
   * @returns The drag.
   */
  export function drag(
    prop: IHumanProp,
  ): IAutoMovieProjectile.IDrag | undefined {
    const body: IAutoMovieBody | undefined = prop.body;
    if (!body?.drag) return undefined;
    return {
      coefficient: body.drag.coefficient,
      area: body.drag.area,
      mass: body.mass,
    };
  }

  /**
   * What a contact does by the body's data: stick, pass, bounce or roll, or
   * nothing, so it stays where it struck.
   *
   * @param prop The flying prop.
   * @param struck What it struck.
   * @returns The engine's outcome, or undefined to stay.
   */
  export function decide(
    prop: IHumanProp,
    struck: HumanPropFlight.Struck,
  ): projectileContinue.Outcome | undefined {
    const body: IAutoMovieBody | undefined = prop.body;
    if (body === undefined) return undefined;
    const contact: IAutoMovieBodyContact | undefined =
      body.contact ?? undefined;
    if (contact?.embed !== undefined)
      return { kind: "stick", depth: contact.embed };
    if (struck.kind === "person" && contact?.passLoss !== undefined)
      return { kind: "pass", loss: contact.passLoss };
    const friction: number | null | undefined =
      body.kineticFriction ?? body.friction;
    const size: number | undefined = radius(prop);
    if (
      body.restitution > 0 &&
      friction !== null &&
      friction !== undefined &&
      size !== undefined
    )
      return {
        kind: "bounce",
        restitution: body.restitution,
        friction,
        ...(contact?.rolling === undefined
          ? {}
          : { roll: { radius: size, resistance: contact.rolling } }),
      };
    if (struck.kind === "ground" && contact?.rolling !== undefined)
      return { kind: "roll", resistance: contact.rolling };
    return undefined;
  }

  /**
   * The legs after a first contact, each swept again until the prop sticks,
   * rests, rolls or the film ends.
   *
   * @param props The prop, the flight that struck, its meeting, the film's seconds left after the launch, the sweep (a flight from a second since the launch, leaving a collider behind) and the contact record of a meeting.
   * @returns The legs, none when the first contact ends the flight.
   */
  export function legs(props: {
    prop: IHumanProp;
    projectile: IAutoMovieProjectile;
    meeting: IMeeting;
    horizon: number;
    meet: (
      projectile: IAutoMovieProjectile,
      base: number,
      leave?: string,
    ) => IMeeting | null;
    settle: (
      meeting: IMeeting,
      projectile: IAutoMovieProjectile,
      base: number,
    ) => HumanPropFlight.IContact;
  }): ILeg[] {
    const out: ILeg[] = [];
    let projectile: IAutoMovieProjectile = props.projectile;
    let meeting: IMeeting = props.meeting;
    let base: number = 0;
    for (;;) {
      const outcome: projectileContinue.Outcome | undefined = decide(
        props.prop,
        meeting.struck,
      );
      if (outcome === undefined || outcome.kind === "stick") return out;
      const next: projectileContinue.Segment = shift(
        projectileContinue(projectile, meeting.hit, outcome),
        base,
      );
      if (next.kind === "rest") return out;
      if (next.kind === "roll") {
        out.push({ from: next.from, segment: next, end: Infinity });
        return out;
      }

      // A rebound that cannot rise the body's radius settles where it struck.
      const n: IAutoMovieVector3 = Vector3.normalize(meeting.hit.normal!);
      const pull: number = Math.abs(Vector3.dot(projectile.gravity, n));
      const rise: number =
        pull > 0
          ? Vector3.dot(next.projectile.velocity, n) ** 2 / (2 * pull)
          : Infinity;
      if (outcome.kind === "bounce" && rise < radius(props.prop)!) return out;
      if (!(next.from < props.horizon)) return out;
      const met: IMeeting | null = props.meet(
        next.projectile,
        next.from,
        outcome.kind === "pass" ? meeting.collider : undefined,
      );
      out.push({
        from: next.from,
        segment: next,
        end: met === null ? Infinity : next.from + met.hit.time,
        ...(met === null
          ? {}
          : { contact: props.settle(met, next.projectile, next.from) }),
      });
      if (met === null) return out;
      projectile = next.projectile;
      meeting = met;
      base = next.from;
    }
  }

  /**
   * The state of a leg at a second since the launch.
   *
   * @param leg The leg.
   * @param seconds Seconds since the launch, at or after the leg's start and before its end.
   * @returns The centre's state.
   */
  export function at(leg: ILeg, seconds: number): IAutoMovieProjectileState {
    return projectileContinue.at(leg.segment, seconds);
  }

  /**
   * The point a body sticks at: its contact carried its embedding depth on
   * along its velocity; the contact itself for any other outcome.
   *
   * @param prop The prop.
   * @param struck What it struck.
   * @param state Its state at the contact.
   * @returns World metres.
   */
  export function rest(
    prop: IHumanProp,
    struck: HumanPropFlight.Struck,
    state: IAutoMovieProjectileState,
  ): IAutoMovieVector3 {
    const outcome: projectileContinue.Outcome | undefined = decide(
      prop,
      struck,
    );
    const speed: number = Vector3.length(state.velocity);
    return outcome?.kind === "stick" && speed > 0
      ? Vector3.add(
          state.position,
          Vector3.scale(state.velocity, outcome.depth / speed),
        )
      : state.position;
  }

  /** A body's radius: its least round shape's, or half its boxes' least extent; none without such a shape. */
  function radius(prop: IHumanProp): number | undefined {
    let least: number = Infinity;
    for (const shape of prop.shapes ?? [])
      least = Math.min(least, half(shape));
    return Number.isFinite(least) ? least : undefined;
  }

  /** A shape's half thickness, metres; a hull is not counted. */
  function half(shape: P.IShape): number {
    return shape.kind === "sphere" || shape.kind === "capsule"
      ? shape.radius
      : shape.kind === "box"
        ? Math.min(shape.halfExtents.x, shape.halfExtents.y, shape.halfExtents.z)
        : Infinity;
  }

  /** A segment of a flight whose zero is `base` seconds after the launch, timed from the launch. */
  function shift(
    segment: projectileContinue.Segment,
    base: number,
  ): projectileContinue.Segment {
    switch (segment.kind) {
      case "flight":
        return { ...segment, from: segment.from + base };
      case "roll":
        return {
          ...segment,
          from: segment.from + base,
          until: segment.until + base,
        };
      case "rest":
        return { ...segment, from: segment.from + base };
    }
  }
}
