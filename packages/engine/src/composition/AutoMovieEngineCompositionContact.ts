import { type IAutoMovieMeasureContact, type IAutoMovieResolveContactEvents, type IAutoMovieMark, type IAutoMovieMarkContacts, type IAutoMovieMarkSupportWrenches } from "@automovie/interface";
import { measureContact as measureContactImplementation } from "./internal/measureContact";
import { resolveContactEvents as resolveContactEventsImplementation } from "./internal/resolveContactEvents";
import { markContacts as markContactsImplementation } from "./internal/markContacts";
import { markSupportWrenches as markSupportWrenchesImplementation } from "./internal/markSupportWrenches";

/** Public operations for Auto Movie Engine Composition Contact. */
export namespace AutoMovieEngineCompositionContact {
  /**
   * Measure whether two displayed bodies meet: the least signed separation, in
   * metres, between every declared collider of one body's named segments (an
   * effector, such as a striking surface) and every declared collider of the
   * other's (a region), at their displayed world poses, by the native geometric
   * contact query. Negative is compression. A pair beyond the prediction distance
   * reads as no contact. The measurement is of the displayed bodies, never of two
   * landmarks, so a refused contact means the bodies did not meet.
   *
   * @returns The least separation and its colliders, and the contact record
   *   `auditOutcome` reads when the separation is within `tolerance` (an
   *   impulse of zero: a geometric touch, not a solved one).
   */
  export function measure(input: IAutoMovieMeasureContact.IInput): IAutoMovieMeasureContact.IResult {
    return measureContactImplementation(input);
  }

  /**
   * The contacts of several moving weapons with several bodies that may each
   * carry one of those weapons, resolved together and in time order: who meets
   * what, and when.
   *
   * Every weapon is a sphere whose centre moves on its free path (the path it
   * takes until it meets something), or a capsule, a segment swept by that
   * radius, when it also gives the axis's other end: a shin, a forearm, any limb
   * segment that strikes along its length, so another body crossing the segment
   * between its ends is met, not passed between sparse points; a tapered
   * capsule's radius runs linearly from one end to the other, as a limb narrows
   * from one joint to the next. Every body is a signed distance at a second, from
   * a point and, for capsule weapons, from a segment (the least signed distance
   * over the segment's points). Both may depend on which weapons have already
   * stopped, because a stopped weapon changes the pose of the body that carries
   * it. The method is the event loop of impulse-based simulation (Mirtich 1996,
   * Impulse-based Dynamic Simulation of Rigid Body Systems, ch. 3) with
   * continuous collision detection for each candidate (Redon, Kheddar and
   * Coquillart 2002): find every moving weapon's first time of impact against the
   * bodies it does not belong to, stop only the earliest, and re-evaluate every
   * other weapon against the poses that stop produces, until no weapon meets
   * anything. Each first impact is found by a fixed-step scan of the signed gap
   * and a bracketed root search of the first crossing to a nanosecond
   * (`firstContactImpact`), so the result is deterministic; a contact
   * shorter than one step (a weapon and a body passing through each other within
   * it) is the scan's stated blind spot, so the step must stay below the time
   * either needs to cross the other's thickness. A weapon that states the span it
   * is live in (`from`, `to`) is scanned only on the scan's own steps that reach
   * into that span, since outside it the weapon meets nothing; the steps are the
   * same as a scan of the whole span, so the result is too, and a performance of
   * many strikes scans each strike over its own window instead of over the whole
   * performance. Since only the earliest impact is stopped, each round reads the
   * moving weapons' scans together, one grid step at a time and in the order the
   * weapons become live: the step at which a first scan finds a contact ends the
   * round, so no weapon is read past the earliest impact, and one that becomes
   * live after it cannot be earlier. Ties in time are broken by the weapons' ids,
   * and a weapon that touches the moment another stops is stopped at that same
   * second, so the result does not depend on the order the weapons are listed
   * in.
   *
   * A weapon may produce both endpoints together through `sample`; this replaces
   * its separate endpoint calls for that exact query. The declared presence of
   * `tail` still fixes its sphere or capsule kind. Samples are recomputed at
   * every query and after each committed stop, including when two events share
   * the same second.
   *
   * Initial penetration or touch is a contact. A body may explicitly certify that
   * this initial episode was resolved and is departing: either no new entry
   * occurs in this search, or a finite positive-gap witness precedes any new
   * entry. Only that pair is deferred until its witness; the scan clock, other
   * bodies and later entry remain unchanged. Unknown departure retains initial
   * reporting. The body's physical model owns this information because signed
   * distance alone cannot establish it.
   *
   * A contact is mutual. A weapon and the body that carries it are two measures
   * of one limb (a capsule and that body's signed distance), and they need not
   * agree to the millimetre, so of two limbs swung into each other one weapon
   * touches the other body before the other weapon touches back. When the part a
   * weapon meets carries a weapon of its own that is still moving (the body says
   * so through `carried`), that weapon stops at the same second against the
   * striker's body: neither limb is driven on into the one that has already
   * stopped on it.
   *
   * Weapons may be the capsules of one rigid part (`group`): an arm's upper arm,
   * forearm and fist. The part stops where any of its capsules first meets a
   * body, so once one stops, the others are scanned no more and give no event:
   * what they touch afterwards is the stopped part resting on the body it met,
   * not a second strike.
   *
   * This resolves simultaneous strikes consistently: two fists crossing each
   * other's arms, two shins meeting, a block that arrives first. It is a
   * kinematic resolution of contact times, not a force simulation.
   *
   * @param input The weapons, the bodies and the span.
   * @returns The stops, in time order.
   * @throws {Error} When the span or the step is not positive, the span or step
   *   is not finite or the scan grid's step count over the span is not a safe
   *   integer (a RangeError from the scan), a weapon id repeats, a weapon's live
   *   span is not finite or ends before it begins, a tail radius is given without
   *   a tail or is not a finite non-negative length, a sample changes its
   *   declared sphere/capsule kind, a capsule weapon meets a body that measures
   *   no segment, a departure witness is invalid, or a body names a carried
   *   weapon that is not its own.
   */
  export function resolveEvents(input: IAutoMovieResolveContactEvents.IInput): IAutoMovieResolveContactEvents.IEvent[] {
    return resolveContactEventsImplementation(input);
  }

  /**
   * Turn the solved contacts acting at one second into inspection marks: for each
   * contact, one arrow per collider at the contact point, along the force that
   * collider receives, as long as the mean force times a stated scale.
   *
   * A receipt acts at `seconds` when the solver measured it: its latest completed
   * step at or before `seconds`, within that step's duration, has a positive
   * finite impulse and no positive separation. Both arrows start at that step's
   * point and are `metresPerNewton` times the step's mean force, its impulse over
   * its duration, long. The first collider's arrow points against the step's
   * normal and the second collider's along it, because the normal runs from the
   * first toward the second and each is pushed away from the other. Geometric
   * receipts, which assert no impulse, draw nothing.
   *
   * Each mark has kind `contact`, label `contact force`, colour teal `00c2a8` and
   * the path `<body>/<bone>/contact/<receipt id>` of the collider it acts on,
   * first collider first, in world metres and unanchored, so selecting a body
   * selects the force it received whatever order the receipt names the pair in. A
   * collider's mark is flagged when `ownership` shows its segment dynamic at the
   * step, its segment's latest event at or before the step being `dynamic`, and
   * the step states that it received none of the solved impulse, as when an
   * exaggerated mode's response rounds the impulse to zero: the solver measured a
   * force that body never felt. The compliant solver gives a static or kinematic
   * side no impulse by design and states zero for it, so such a side, including a
   * segment without history such as the floor, is never flagged; a step without
   * the statement is a direct native measurement and is not flagged; without
   * `ownership` no mark is flagged, because a stated zero alone cannot tell a
   * rounded dynamic body from a static one.
   *
   * A rigid impact arrests a body within one step, so its mean force can be tens
   * of times its resting weight and no single scale draws both inside a frame.
   * With `maximumLength`, an arrow that would be longer keeps its direction and
   * is drawn at that length under kind `contact/clamped`, colour dark teal
   * `007a6a` and label `contact force clamped at <length> m (at least <length /
   * metresPerNewton> N)`, so a clamped arrow is never read at its drawn length;
   * `marks=contact` still selects it, because the kind lies beneath `contact`.
   * Clamping is not an anomaly and leaves the flag to the transfer rule.
   *
   * It throws for a scale or a maximum length that is not positive and
   * for an acting step without a positive duration.
   *
   * @param props.receipts Contact episodes, as the composition's contact
   *   measurement and the solver record them.
   * @param props.seconds The drawn film second.
   * @param props.metresPerNewton Arrow length per newton of mean force.
   * @param props.maximumLength Optional longest drawn arrow in metres.
   * @param props.ownership Optional ownership history of the same performance,
   *   which decides which sides are dynamic.
   * @returns Two marks per acting contact, in the receipts' order.
   */
  export function markContacts(props: IAutoMovieMarkContacts.IProps): IAutoMovieMark[] {
    return markContactsImplementation(props);
  }

  /**
   * Turn the support wrenches governing one second into inspection marks: the
   * force the controller allocated to actual floor witnesses, and any shortfall
   * from what it requested.
   *
   * A body's wrench governs `seconds` when it is that body's latest record at or
   * before `seconds` and `seconds` lies before its instant plus `interval`, the
   * cache step the controller allocated it for. Its allocated force is an arrow
   * from the recorded centre of mass, `metresPerNewton` times the force; a zero
   * allocation draws no such arrow. When the residual force exceeds the
   * optimisation error the allocator itself admits, 1e-6 of its scale, taken here
   * as the larger of 1 N and the requested force because the record keeps no
   * lever to restore the moment term, a second arrow starts at the allocated
   * arrow's tip, so the two arrows add up to the requested force. A body with no
   * witnesses therefore draws only its whole request as shortfall. Moments are
   * not drawn. Both quantities are motor demand before native caps and
   * integration, not measured load; `markContacts` draws the force
   * contacts actually transferred.
   *
   * The allocated mark has kind `support/allocated`, label `allocated support
   * force`, colour slate blue `7b68ee` and path `<body>/support/allocated`. The
   * shortfall mark has kind `support/shortfall`, label `support force shortfall`,
   * colour dark orange `ff8c00`, path `<body>/support/shortfall` and is flagged,
   * because a request the floor witnesses could not carry is an anomaly. Both are
   * in world metres and unanchored, in the order each body's first record
   * appears.
   *
   * It throws for an interval or a scale that is not positive.
   *
   * @param props.wrenches Support wrench records of a physics cache or playback.
   * @param props.seconds The drawn film second.
   * @param props.interval The cache step each record governs.
   * @param props.metresPerNewton Arrow length per newton.
   * @returns Up to two marks per governed body.
   */
  export function markSupportWrenches(props: IAutoMovieMarkSupportWrenches.IProps): IAutoMovieMark[] {
    return markSupportWrenchesImplementation(props);
  }
}
