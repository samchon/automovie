import { Vector3, projectileContinue } from "@automovie/engine";
import type {
  IAutoMovieBody,
  IAutoMovieBodyContact,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanPropOutcome,
  IAutoMoviePhysicalShape,
  IAutoMovieProjectile,
  IAutoMovieProjectileContinue,
  IAutoMovieProjectileState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";

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
 * - a contact with a friction pair and a measurable radius, but no rebound
 *   coefficient or explicit ground roll, refuses the physical continuation
 *   instead of turning unknown restitution into zero;
 * - otherwise it stays where it struck, riding it: an outcome the body's data
 *   do not give is never invented.
 *
 * An explicit launch sphere supplies its radius. Otherwise it is the body's
 * least round shape's radius, or half the least extent of its boxes. A body
 * with no measurable shape does not bounce. A roll is swept, while it lasts,
 * as the projectile it is (its rolling deceleration its only acceleration),
 * so it meets what stands on the ground in its way; a body that rebounds and
 * flies is swept again by the flight's one sweep.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each outcome, the datum that grants it, the bounce's settling rule and what a roll does not meet.
 * @evidence contracts/development/design.md#principled-representation A leg is an engine continuation segment timed from the launch with the contact that ends it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The leg, the body's drag, the decision, the chain of legs and a leg's frame; read by `HumanPropFlight`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every coefficient is the model body's; an absent datum withholds its outcome, never stands in as zero.
 */
export namespace HumanPropOutcome {
  /**
   * The quadratic drag a prop's body declares (`IAutoMovieBody.drag`), with
   * its mass; none when it declares none.
   *
   * @param prop The prop.
   * @returns The drag.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the body's quadratic coefficient, cross-sectional area and mass and distinguishes absent drag from a zero coefficient.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the admitted body's coefficient, SI area and mass directly into the engine drag record, leaving model-range admission to its existing owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional-body gate and one three-field projection own the conversion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not guess drag from visual geometry or invent a coefficient when the body declares none.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant reads and at most one small record allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the existing body declaration without re-estimating area, mass or aerodynamic behaviour.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh scalar record and retains no prop, callback or host resource.
   */
  export function drag(
    prop: IAutoMovieMotionHumanProp,
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
   * @throws {HumanRefusal} When a potential rebound has no declared normal restitution or an invalid ratio.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States ordered embed, person-pass, rebound, ground-roll and rest decisions; unknown restitution refuses a potential rebound while explicit zero, embed, pass and ground roll remain distinct.
   * @evidence contracts/development/implementation.md#principled-implementation Prioritizes explicit embedding and person passage, then uses the body's normal restitution and kinetic-or-static friction with the smallest supported collider radius; no measured specimen is flattened into a live coefficient.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Outcome selection stays in one ordered decision tree and delegates collider-size projection to radius; the physics equations remain in projectileContinue.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing rebound coefficients and invalid ratios produce a prop-specific refusal; an absent friction or supported radius still withholds bouncing, and an explicit ground-roll declaration needs no inferred rebound.
   * @evidence contracts/development/implementation.md#efficient-algorithms A scan of S prop colliders costs O(S) time and constant auxiliary storage, followed by at most one outcome allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads current body data and shared collider definitions without retaining mutable outcome caches; bounce and roll use the engine's existing continuation representation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns an owned small outcome or refusal and retains no prop, collider or external resource.
   */
  export function decide(
    prop: IAutoMovieMotionHumanProp,
    struck: IAutoMovieMotionHumanPropFlight.Struck,
    size: number | undefined = radius(prop),
  ): IAutoMovieProjectileContinue.Outcome | undefined {
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
    const restitution: number | undefined = body.restitution;
    if (friction !== null && friction !== undefined && size !== undefined) {
      if (restitution === undefined) {
        if (struck.kind === "ground" && contact?.rolling !== undefined)
          return { kind: "roll", resistance: contact.rolling };
        throw new HumanRefusal({
          kind: "parameter",
          axis: "restitution",
          value: restitution,
          feasible: null,
          reason: `prop ${prop.subject} needs a measured or explicitly authored restitution for the contacting materials before a physical rebound`,
          fix: "declare the prop body's normal restitution before asking it to rebound",
        });
      }
      if (!Number.isFinite(restitution) || restitution < 0 || restitution > 1)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "restitution",
          value: restitution,
          feasible: { kind: "range", minimum: 0, maximum: 1, unit: "" },
          reason: `prop ${prop.subject} needs a finite normal speed ratio from zero through one`,
          fix: "declare a finite restitution in that interval",
        });
      if (restitution > 0)
        return {
          kind: "bounce",
          restitution,
          friction,
          ...(contact?.rolling === undefined
            ? {}
            : { roll: { radius: size, resistance: contact.rolling } }),
        };
    }
    if (struck.kind === "ground" && contact?.rolling !== undefined)
      return { kind: "roll", resistance: contact.rolling };
    return undefined;
  }

  /**
   * The legs after a first contact, each swept again until the prop sticks,
   * rests, rolls or the film ends.
   *
   * @param props The prop, the flight that struck, its meeting, the film's seconds left after the launch, the sweep (flight, absolute base, optional passed collider and separately the resolved bounce collider) and the contact record of a meeting. A passed collider is left behind; a bounced collider remains eligible for later entry after certified departure.
   * @returns The legs, none when the first contact ends the flight.
   * @throws {HumanRefusal} For a nonfinite or negative horizon/first contact, or a later contact whose finite absolute second does not advance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the finite nonnegative launch-relative horizon/first contact, strictly advancing later contacts, empty continuation at the horizon, callbacks, settlement and structured time/coefficient refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Admits the initial clock and each later finite absolute contact time before settlement, without changing time. A later contact must fall beyond CONTACT_SECOND, the microsecond a hit's second resolves to, so a converging exchange of contacts refuses instead of looping. Each engine continuation reads the declared outcome, shifts its clock once and sweeps again. Under the existing fixed-surface response approximation, only inward gravity supports a returning normal arc; v_n squared over twice that acceleration is its drag-free height and a conservative upper bound with dissipative drag. Outward or tangent gravity cannot trigger radius-based settlement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop owns contact continuation while engine integration, sweeping and settlement remain separate owners supplied through typed inputs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not duplicate projectile equations, clamp callback times, advance by a guessed epsilon or impose an arbitrary bounce count. Nonprogressing, negative, overflowing and nonfinite contact clocks refuse explicitly instead of looping or fabricating a continuation.
   * @evidence contracts/development/implementation.md#efficient-algorithms For K admitted contacts, S colliders, engine continuation costs P_i and sweep costs C_i, work is O(K*S + sum(P_i + C_i)) and returned storage O(K), plus engine-owned drag-flight storage. Contacts at least CONTACT_SECOND apart bound K by the horizon over a microsecond; there is no smaller uniform contact-count bound or callback execution-time guarantee.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each continuation segment is constructed once and retained for later sampling; the engine owns optional drag-flight integration reuse, and this loop installs no callback or cross-flight cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned legs retain only their segments and contacts; local projectile and meeting references are released on return or refusal, and no host task is started.
   */
  export function legs(
    props: IAutoMovieMotionHumanPropOutcome.ILegsProps,
  ): IAutoMovieMotionHumanPropOutcome.ILeg[] {
    if (!Number.isFinite(props.horizon) || props.horizon < 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "horizon",
        value: props.horizon,
        feasible: { kind: "range", minimum: 0, maximum: null, unit: "s" },
        reason: `prop ${props.prop.subject} needs a finite nonnegative continuation horizon`,
        fix: "give the finite seconds remaining after the launch",
      });
    if (!Number.isFinite(props.meeting.hit.time) || props.meeting.hit.time < 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "contact.time",
        value: props.meeting.hit.time,
        feasible: { kind: "range", minimum: 0, maximum: null, unit: "s" },
        reason: `prop ${props.prop.subject} needs a finite nonnegative first contact time`,
        fix: "supply the contact's seconds after this flight's launch",
      });
    if (props.meeting.hit.time >= props.horizon) return [];
    const out: IAutoMovieMotionHumanPropOutcome.ILeg[] = [];
    let projectile: IAutoMovieProjectile = props.projectile;
    let meeting: IAutoMovieMotionHumanPropOutcome.IMeeting = props.meeting;
    let base: number = 0;
    const size: number | undefined = props.sphereRadius ?? radius(props.prop);
    for (;;) {
      const outcome: IAutoMovieProjectileContinue.Outcome | undefined = decide(
        props.prop,
        meeting.struck,
        size,
      );
      if (outcome === undefined || outcome.kind === "stick") return out;
      const next: IAutoMovieProjectileContinue.Segment = shift(
        projectileContinue(projectile, meeting.hit, outcome),
        base,
      );
      if (next.kind === "rest") return out;
      if (next.kind === "roll") {
        // While it lasts a roll is a projectile whose only acceleration is
        // its rolling deceleration against its velocity, exact up to `until`,
        // so the flight's one sweep meets what stands in its way (a keeper's
        // pad, a stick, a person) as it would a flight. The ground it rolls on
        // is left behind; a meeting at or after `until` is not on the roll.
        const speed: number = Vector3.length(next.velocity);
        const rolling: IAutoMovieProjectile | undefined =
          speed > 0 && next.from < props.horizon
            ? {
                origin: next.origin,
                velocity: next.velocity,
                gravity: Vector3.scale(
                  next.velocity,
                  -next.deceleration / speed,
                ),
              }
            : undefined;
        const met: IAutoMovieMotionHumanPropOutcome.IMeeting | null =
          rolling === undefined
            ? null
            : props.meet(rolling, next.from, undefined, meeting.collider);
        const end: number = met === null ? Infinity : next.from + met.hit.time;
        if (
          met === null ||
          !(end < next.until) ||
          !(end > next.from + CONTACT_SECOND)
        ) {
          out.push({ from: next.from, segment: next, end: Infinity });
          return out;
        }
        out.push({
          from: next.from,
          segment: next,
          end,
          contact: props.settle(met, rolling!, next.from),
        });
        // The contact goes on as a flight under the prop's own gravity from
        // the roll's state there.
        const state: IAutoMovieProjectileState = projectileContinue.at(
          next,
          end,
        );
        projectile = {
          ...props.projectile,
          origin: state.position,
          velocity: state.velocity,
        };
        meeting = { ...met, hit: { ...met.hit, time: 0 } };
        base = end;
        continue;
      }

      // A gravity-return height applies only when acceleration presses inward.
      // Outward or tangent gravity must not attach a departing prop to it.
      const n: IAutoMovieVector3 = Vector3.normalize(meeting.hit.normal!);
      const pull: number = Math.max(0, -Vector3.dot(projectile.gravity, n));
      const rise: number =
        pull > 0
          ? Vector3.dot(next.projectile.velocity, n) ** 2 / (2 * pull)
          : Infinity;
      if (outcome.kind === "bounce" && rise < size!) return out;
      if (!(next.from < props.horizon)) return out;
      const met: IAutoMovieMotionHumanPropOutcome.IMeeting | null = props.meet(
        next.projectile,
        next.from,
        outcome.kind === "pass" ? meeting.collider : undefined,
        outcome.kind === "bounce" ? meeting.collider : undefined,
      );
      const end: number = met === null ? Infinity : next.from + met.hit.time;

      // A contact within the microsecond a hit's second resolves to is the
      // same event, not a later one. Admitting it lets a prop and a surface
      // moving into it trade contacts at ever-shorter intervals that never
      // reach the horizon, each a full sweep.
      if (
        met !== null &&
        (!Number.isFinite(met.hit.time) ||
          met.hit.time < 0 ||
          !Number.isFinite(end) ||
          !(end > next.from + CONTACT_SECOND))
      )
        throw new HumanRefusal({
          kind: "parameter",
          axis: "contact.time",
          value: end,
          feasible: {
            kind: "range",
            minimum: next.from + CONTACT_SECOND,
            maximum: null,
            unit: "s",
            open: "minimum",
          },
          reason: `prop ${props.prop.subject} contact with ${met.collider} after relative ${met.hit.time} s reaches absolute ${end} s, which does not advance finitely beyond ${next.from} s by more than the ${CONTACT_SECOND} s contact resolution`,
          fix: "supply the next strictly later contact; resolve departing or simultaneous contacts before continuing the flight",
        });
      out.push({
        from: next.from,
        segment: next,
        end,
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
   * @evidence contracts/development/common.md#meaningful-documentation States launch-relative seconds, the caller's segment-window precondition and the centre-state result.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates directly to the engine continuation sampler, preserving its segment-specific equations and admission semantics.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation keeps frame reading with the engine owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not interpolate stored screenshots, clamp time or invent an alternate trajectory.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds constant call overhead to the engine segment sampler.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Samples the retained segment without rebuilding contact sweeps or its outcome.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Acquires no task or resource and retains neither leg nor returned state.
   */
  export function at(
    leg: IAutoMovieMotionHumanPropOutcome.ILeg,
    seconds: number,
  ): IAutoMovieProjectileState {
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
   * @evidence contracts/development/common.md#meaningful-documentation States velocity-aligned embedding depth in metres, zero-speed handling and that an unshifted result borrows the input state's position.
   * @evidence contracts/development/implementation.md#principled-implementation Moves a sticking point along the normalized nonzero velocity by the declared depth; all other admitted outcomes use the actual contact position.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses decide for the body's contact policy and shared vector arithmetic for the one embedding offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not invent penetration depth or direction for zero speed; missing physical rebound data keeps decide's refusal rather than becoming an artificial rest.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S) collider inspection through decide and constant vector work, with at most two small vectors allocated by the embedding branch.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares outcome policy with continuation planning instead of independently reinterpreting body coefficients.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no prop or state and returns either a fresh embedded point or the borrowed contact position.
   */
  export function rest(
    prop: IAutoMovieMotionHumanProp,
    struck: IAutoMovieMotionHumanPropFlight.Struck,
    state: IAutoMovieProjectileState,
    sphereRadius?: number,
  ): IAutoMovieVector3 {
    const outcome: IAutoMovieProjectileContinue.Outcome | undefined = decide(
      prop,
      struck,
      sphereRadius,
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
  function radius(prop: IAutoMovieMotionHumanProp): number | undefined {
    let least: number = Infinity;
    for (const shape of prop.shapes ?? []) least = Math.min(least, half(shape));
    return Number.isFinite(least) ? least : undefined;
  }

  /** A shape's half thickness, metres; a hull is not counted. */
  function half(shape: IAutoMoviePhysicalShape): number {
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
    segment: IAutoMovieProjectileContinue.Segment,
    base: number,
  ): IAutoMovieProjectileContinue.Segment {
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

/**
 * The second a contact's time resolves to, seconds: the microsecond at
 * which the engine's contact specifications and a hit's id read it
 * (`firstAutoMovieContactImpact` brackets a contact a thousandth of this
 * wide so the reading does not depend on where its search stopped). Two
 * contacts nearer than this are one event at that resolution.
 */
const CONTACT_SECOND: number = 1e-6;
