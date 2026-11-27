import { AutoMoviePhysicalProjectile, Vector3 } from "@automovie/engine";
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

import { HumanRefusal } from "../../law/HumanRefusal";

/*
 * How a prop's flight goes on after a contact, from its model body's flight
 * data: the outcome of each contact, and the legs that follow the first one.
 *
 * At each contact the body decides, from the data it declares and nothing else:
 *
 * - `stick` where it declares an embedding depth (`contact.embed`): its point
 *   goes that far on along its velocity and it rests there in what it struck,
 *   riding it;
 * - `pass` through a person where it declares a speed loss (`passLoss`): it flies
 *   on through that body, slower by the loss;
 * - `bounce` where it declares a restitution and a friction pair (its
 *   `kineticFriction`, else its static `friction`): Newton's restitution and
 *   Coulomb's impulse limit on its velocity relative to the struck surface,
 *   whose velocity the meeting carries (`AutoMoviePhysicalProjectile.continueFlight`), rolling on at
 *   its rolling resistance (`contact.rolling`) once a rebound would rise less
 *   than its radius off that surface, and coming to rest where it struck when
 *   it declares no rolling resistance. A spherical launch bounces as a ball of
 *   its body's `contact.gyration` (a uniform solid's 2/5 when it declares
 *   none): its spin takes up part of the sliding, so friction stops where its
 *   contact point stops sliding, and the spin a bounce leaves, or the turn of a
 *   roll, is what the next bounce reads;
 * - `roll` along the ground where it declares a rolling resistance and no
 *   restitution to bounce with;
 * - A contact with a friction pair and a measurable radius, but no rebound
 *   coefficient or explicit ground roll, refuses the physical continuation
 *   instead of turning unknown restitution into zero;
 * - Otherwise it stays where it struck, riding it: an outcome the body's data do
 *   not give is never invented.
 *
 * An explicit launch sphere supplies its radius. Otherwise it is the body's
 * least round shape's radius, or half the least extent of its boxes. A body
 * with no measurable shape does not bounce. A roll is swept, while it lasts, as
 * the projectile it is (its rolling deceleration its only acceleration), so it
 * meets what stands on the ground in its way; a body that rebounds and flies is
 * swept again by the flight's one sweep.
 */
export namespace HumanPropOutcome {
  /*
   * The second a contact's time resolves to, seconds: the microsecond at which
   * the engine's contact specifications and a hit's id read it
   * (`firstAutoMovieContactImpact` brackets a contact a thousandth of this wide
   * so the reading does not depend on where its search stopped). Two contacts
   * nearer than this are one event at that resolution, and a struck surface's
   * velocity is read over it.
   */
  export const CONTACT_SECOND: number = 1e-6;

  /*
   * A ball's gyration when its body declares none: a uniform solid's 2/5, the
   * uniform density an undeclared mass distribution is taken to have
   * (`IAutoMovieBodyContact.gyration`).
   */
  export const UNIFORM: number = 2 / 5;

  /*
   * The quadratic drag a prop's body declares (`IAutoMovieBody.drag`), with its
   * mass; none when it declares none.
   * Parameter prop: The prop.
   * Returns: The drag.
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

  /*
   * What a contact does by the body's data: stick, pass, bounce or roll, or
   * nothing, so it stays where it struck.
   * Parameter prop: The flying prop.
   * Parameter struck: What it struck.
   * Returns: The engine's outcome, or undefined to stay.
   * When a potential rebound has no declared normal
   * restitution or an invalid ratio.
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
      if (!(restitution >= 0 && restitution <= 1))
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

  /*
   * The legs after a first contact, each swept again until the prop sticks,
   * rests, rolls or the film ends.
   * Parameter props: The prop, the flight that struck, its meeting, the film's
   * seconds left after the launch, the sweep (flight, absolute base, optional
   * passed collider and separately the resolved bounce collider) and the
   * contact record of a meeting. A passed collider is left behind; a bounced
   * collider remains eligible for later entry after certified departure.
   * Returns: The legs, none when the first contact ends the flight.
   * For a nonfinite or negative horizon/first contact,
   * or a later contact whose finite absolute second does not advance.
   */
  export function legs(
    props: IAutoMovieMotionHumanPropOutcome.ILegsProps,
  ): IAutoMovieMotionHumanPropOutcome.ILeg[] {
    if (!(props.horizon >= 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "horizon",
        value: props.horizon,
        feasible: { kind: "range", minimum: 0, maximum: null, unit: "s" },
        reason: `prop ${props.prop.subject} needs a finite nonnegative continuation horizon`,
        fix: "give the finite seconds remaining after the launch",
      });
    if (!(props.meeting.hit.time >= 0))
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

    // A spherical launch turns as a ball: its spin, none at the release, is
    // what its last bounce left, and the next bounce reads it.
    const gyration: number =
      props.prop.body?.contact?.gyration ?? HumanPropOutcome.UNIFORM;
    let spin: IAutoMovieVector3 | undefined;
    for (;;) {
      const decided: IAutoMovieProjectileContinue.Outcome | undefined = decide(
        props.prop,
        meeting.struck,
        size,
      );
      if (decided === undefined || decided.kind === "stick") return out;
      const outcome: IAutoMovieProjectileContinue.Outcome =
        decided.kind !== "bounce"
          ? decided
          : {
              ...decided,
              ...(meeting.surface === undefined
                ? {}
                : { surface: meeting.surface }),
              ...(props.sphereRadius === undefined
                ? {}
                : {
                    ball: {
                      radius: props.sphereRadius,
                      gyration,
                      ...(spin === undefined ? {} : { spin }),
                    },
                  }),
            };
      const next: IAutoMovieProjectileContinue.Segment = shift(
        AutoMoviePhysicalProjectile.continueFlight(projectile, meeting.hit, outcome),
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
        // the roll's state there, a ball turning as it rolled: its contact
        // point at rest on the ground, `w = n x v / r`.
        const state: IAutoMovieProjectileState = AutoMoviePhysicalProjectile.continuedAt(
          next,
          end,
        );
        if (props.sphereRadius !== undefined)
          spin = Vector3.scale(
            Vector3.cross(
              Vector3.normalize(meeting.hit.normal!),
              state.velocity,
            ),
            1 / props.sphereRadius,
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
      const leaving: IAutoMovieVector3 =
        meeting.surface === undefined
          ? next.projectile.velocity
          : Vector3.subtract(next.projectile.velocity, meeting.surface);
      const rise: number =
        pull > 0 ? Vector3.dot(leaving, n) ** 2 / (2 * pull) : Infinity;
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
        (!(met.hit.time >= 0) || !(end > next.from + CONTACT_SECOND))
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

      // A pass keeps the spin it had; a bounce leaves the ball's own.
      spin = next.spin ?? (outcome.kind === "pass" ? spin : undefined);
      projectile = next.projectile;
      meeting = met;
      base = next.from;
    }
  }

  /*
   * The state of a leg at a second since the launch.
   * Parameter leg: The leg.
   * Parameter seconds: Seconds since the launch, at or after the leg's start and
   * before its end.
   * Returns: The centre's state.
   */
  export function at(
    leg: IAutoMovieMotionHumanPropOutcome.ILeg,
    seconds: number,
  ): IAutoMovieProjectileState {
    return AutoMoviePhysicalProjectile.continuedAt(leg.segment, seconds);
  }

  /*
   * The point a body sticks at: its contact carried its embedding depth on
   * along its velocity; the contact itself for any other outcome.
   * Parameter prop: The prop.
   * Parameter struck: What it struck.
   * Parameter state: Its state at the contact.
   * Returns: World metres.
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

  /*
   * A body's radius: its least round shape's, or half its boxes' least extent;
   * none without such a shape.
   */
  function radius(prop: IAutoMovieMotionHumanProp): number | undefined {
    let least: number = Infinity;
    for (const shape of prop.shapes ?? []) least = Math.min(least, half(shape));
    return least === Infinity ? undefined : least;
  }

  /*
   * A shape's half thickness, metres; a hull is not counted.
   */
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

  /*
   * A segment of a flight whose zero is `base` seconds after the launch, timed
   * from the launch.
   */
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
