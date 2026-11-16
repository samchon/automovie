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
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
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
  /**
   * One engine continuation and its optional terminating contact, with
   * every time measured in seconds from the original launch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines launch-relative from/end, the engine segment and the absent-contact/infinite-end case.
   * @evidence contracts/development/design.md#principled-representation Couples the original typed engine segment with its real contact boundary so playback and hit reporting share one physical trajectory.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Flight construction, frame playback and hit reporting consume these four fields without a second sampled trajectory representation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An absent contact remains unended rather than a fabricated rest or a separate resolved flag; segment kind retains the engine's motion law.
   */
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

  /**
   * The first engine hit of one swept flight, its actual struck carrier,
   * and the collider identity needed for a later pass-through query.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the hit's swept-flight-relative clock, struck carrier and collider identity used to leave a passed body.
   * @evidence contracts/development/design.md#principled-representation Preserves the engine hit together with the performance carrier and exact collider id rather than conflating contact geometry with a subject name.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Continuation construction needs the hit, outcome selection needs the carrier and pass exclusion needs the collider; no parallel collision result is introduced.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains actual sweep results and identities without manufacturing an outcome, contact time or target frame.
   */
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines optional declared quadratic drag and its coefficient, square-metre area and kilogram mass; absence returns undefined.
   * @evidence contracts/development/implementation.md#principled-implementation Copies the body's authored drag coefficient/area with its own mass into the engine projectile contract.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional-body/drag branch precedes one numeric record construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Supplies no default coefficient, area or mass and leaves numerical drag admission and integration to the engine.
   * @evidence contracts/development/implementation.md#efficient-algorithms Performs constant field reads and allocates one fixed-size record only when drag is declared.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the existing body declaration directly without a second aerodynamic model or a retained prop-identity result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns copied numeric data and retains no source body, prop, reader, handle or query history.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines prop/carrier inputs, closed engine outcome records and undefined for the existing stay policy.
   * @evidence contracts/development/implementation.md#principled-implementation Applies authored embedding first, passage through a person next, positive restitution with declared friction and measurable radius next, then ground rolling; the engine owns the selected physical law.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered policy branch list delegates supported-shape radius reduction to its private owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves kinetic-then-static friction precedence and supported sphere/capsule/box radii. This policy does not add coefficient admission or infer missing rebound data; selected parameters are admitted by the engine continuation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Uses fixed policy work plus O(S) shape scanning for a rebound radius when earlier embedding/passage branches do not return.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the body's existing declarations and the shared radius owner; every call reads current inputs without a policy-result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns only a fresh fixed-size numeric outcome or undefined and retains no body, geometry, target history or resource.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines launch-relative segments, the supplied physical sweep/settlement callbacks, film horizon and empty/still-moving termination cases.
   * @evidence contracts/development/implementation.md#principled-implementation Applies the engine impact continuation at each real meeting, shifts its clock to the original launch, and sweeps rebound/pass flights again; rolling retains the engine segment and performs no further collision sweep.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One contact loop selects an outcome, builds the engine continuation, handles rest/roll/settling/horizon, and appends the next actual meeting.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the existing rebound-height settling test and pass-only collider exclusion. This version adds no bounce cap or clock nudge and relies on supplied meetings to progress; it does not certify progress for an arbitrary callback.
   * @evidence contracts/development/implementation.md#efficient-algorithms For C progressing contacts, performs C outcome/continuation steps and at most C actual sweeps, plus O(C*S) supported-radius scans. The callback determines sweep cost; this owner imposes no independent contact-count bound.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses decide, the engine continuation and the supplied single sweep/contact owners; subsequent projectiles preserve their actual computed velocity and attitude rather than rebuilding a second law.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns the returned O(C) segment/contact list and fixed loop state. Callbacks and original arguments are borrowed only during construction; no global history or handle is retained.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the existing launch-relative time premise and the engine centre-state result.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the original segment and exact requested time to projectileContinue.at for its flight, roll or rest law.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One engine delegation owns the numerical state calculation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not shift the clock, clamp the request or replace the original segment with a sampled surrogate.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds constant delegation overhead to the actual engine state sampler, whose flight/drag or roll cost remains unchanged.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the existing continuation representation and numerical owner; no second trajectory formula or timestamp cache is introduced.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains neither the leg nor the returned state after this synchronous call and acquires no resource handle.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines prop/carrier policy inputs, contact state and the world-metre embedded or unchanged contact point.
   * @evidence contracts/development/implementation.md#principled-implementation For a declared sticking depth and positive speed, advances along the velocity by that depth; every other case retains the original contact position.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the shared outcome and speed, then selects one directed offset or the supplied point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps declared depth and original positive-speed guard without inventing a direction at rest or adding an offset for a non-sticking outcome.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds constant vector work to decide's existing supported-radius scan when its policy reaches that branch.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares outcome selection with continuation construction and uses the actual contact state rather than reevaluating a projectile.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new offset point or the borrowed supplied position and retains no state, source prop or query history.
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
    for (const shape of prop.shapes ?? []) least = Math.min(least, half(shape));
    return Number.isFinite(least) ? least : undefined;
  }

  /** A shape's half thickness, metres; a hull is not counted. */
  function half(shape: P.IShape): number {
    return shape.kind === "sphere" || shape.kind === "capsule"
      ? shape.radius
      : shape.kind === "box"
        ? Math.min(
            shape.halfExtents.x,
            shape.halfExtents.y,
            shape.halfExtents.z,
          )
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
