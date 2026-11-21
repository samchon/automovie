import { Vector3, projectileFirstContact } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHit,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropFlight,
  IAutoMovieMotionHumanPropOutcome,
  IAutoMovieMotionPropLaunch,
  IAutoMoviePhysicalShape,
  IAutoMovieProjectile,
  IAutoMovieProjectileFirstContact,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBendRepeat } from "../compose/AutoMovieMotionHumanBendRepeat";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import { HumanPropCatchHands } from "./HumanPropCatchHands";

/**
 * The one sweep of a flying prop (`HumanPropFlight`): its flight from a
 * film second against every person but the launcher, read on their displayed
 * bones at each second and passed over while a bound around their root
 * shows them out of reach (the bounding-sphere reject of #3379), the props
 * that do not fly but those the launcher holds or wears as the flight starts
 * (they go with the launcher) and, through its fitted approach, those a later
 * launch that ends the flight holds (a bat striking the incoming ball), and
 * the floor, through the engine's one resolver
 * (`projectileFirstContact`). The step keeps the prop from crossing the
 * thinnest collider it may meet in one step, finger bones aside: a finger is
 * the stated blind spot. A pass leaves the body it passes through behind.
 * A bounce separately names its resolved collider for the engine's physical
 * departure certificate; that collider stays eligible for later entry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a flight meets, the reject, the step and its blind spot, and what a pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A meeting is the engine's hit with what it struck.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The sweep alone, read by `HumanPropFlight`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The sweep is the engine's one resolver; colliders are the displayed bones and the props' own shapes.
 */
export namespace HumanPropSweep {
  /**
   * Sweep a flight from a film second against everyone but the launcher, the
   * props that do not fly and the floor, leaving one collider behind.
   *
   * @param self The performance.
   * @param prop The flying prop.
   * @param launcher The launcher's subject, who is no collider.
   * @param seconds The film second of the flight's zero.
   * @param projectile The flight.
   * @param horizon Seconds after its zero the film still runs.
   * @param leave A collider's id to leave out: the body a pass goes through.
   * @param departing The collider whose existing support or rebound contact the projectile is leaving. Only the engine's certificate can defer its initial contact and it continues to check later entry.
   * @param radius An opt-in spherical radius in metres. Its supplied projectile travels by its centre. Absent, use the prop's point or tip.
   * @param captureHands Gripping hands owned by a staged capture during their final approach. The remaining body surfaces continue to participate.
   * @param handback The later launch that ends this flight, when one does. The props its performer holds at that launch are left out from the start of the launching action, whose own fit owns the meeting, to the end of the sweep.
   * @returns The first meeting, or null when it meets nothing before the horizon.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States film/flight clocks, the launcher and pass exclusions, support departure and rebound opt-in, physical certificate scope, first meeting and finite-horizon sweep.
   * @evidence contracts/development/implementation.md#principled-implementation Builds the ground plane and displayed person/prop nearest queries, including the spherical radius in the stature rejection. A staged receive excludes only its assigned hand and fingers during its fitted approach, with actual closure checked separately. Likewise a later launch that ends the flight owns its meeting from its action's start: the props its performer holds at that launch are absent from then on, while before it they remain colliders. The engine still resolves all other surface contacts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This bridge owns performance-to-collider projection and target identity; closest geometry, departure proof, scan and TOI bisections remain with their owning engine modules.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no bounce blacklist, time epsilon or fabricated gap; a handed-back prop reads as absent (an infinite gap) only inside its launch's fitted approach, as leaving it out would, since the collider list is fixed for one resolver call. The existing policy omits every prop with any published launch and ignores finger thickness; the stature rejection assumes the body fits that bound, and the scan's stated thin-contact blind spot remains.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparing P props repeats their action-segment/launch scans and scans profile shapes; C collider closures feed the engine's contact queries, whose cost also includes dynamic FK/nearest-body reads. The engine owns step/bisection cost; this method claims no measured speedup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each person keeps fixed FK prerequisites only. Props use their exact current carrier. The sweep constructs full contact witnesses only for the chosen impact.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Collider/shape arrays and their performance-capturing callbacks are call-local and released after the sweep or refusal; only the small meeting escapes, with no retained frame history, host or new cache.
   */
  export function sweep(
    self: IAutoMovieMotionHumanPerformanceState,
    prop: IAutoMovieMotionHumanProp,
    launcher: string,
    seconds: number,
    projectile: IAutoMovieProjectile,
    horizon: number,
    leave: string | undefined,
    departing?: string,
    radius?: number,
    captureHands: readonly HumanPropCatchHands.IApproach[] = [],
    handback?: IHandback,
  ): IAutoMovieMotionHumanPropOutcome.IMeeting | null {
    const bend: AutoMovieMotionHumanBendRepeat =
      new AutoMovieMotionHumanBendRepeat();
    const colliders: IAutoMovieProjectileFirstContact.ICollider[] = [
      projectileFirstContact.plane(
        "ground",
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ),
    ];
    const maskedBones:
      | Map<string, ReturnType<typeof HumanPerformanceRead.prepareBones>>
      | undefined = captureHands.length === 0 ? undefined : new Map();
    for (const person of self.people.values()) {
      const subject: string = person.performer.subject;
      if (subject === launcher || `person:${subject}` === leave) continue;
      const body: typeof person.performer.body = person.performer.body;
      const reach: number = body.measure.stature;
      const allBones: ReturnType<typeof HumanPerformanceRead.prepareBones> =
        HumanPerformanceRead.prepareBones(self, subject);
      const reserved: readonly HumanPropCatchHands.IApproach[] | undefined =
        maskedBones === undefined
          ? undefined
          : captureHands.filter((grip): boolean => grip.subject === subject);
      const bones: typeof allBones =
        reserved === undefined || reserved.length === 0
          ? allBones
          : (at: number): ReturnType<typeof allBones> =>
              HumanPropCatchHands.omit(allBones(at), reserved, at);
      if (bones !== allBones) maskedBones?.set(subject, bones);
      /** The original root-based rejection, with its centre for a full witness. */
      const frame = (t: number): IAutoMovieVector3 =>
        HumanPerformanceRead.projectileRoot(self, subject, seconds + t, bend);
      /** The original signed lower bound before querying the collider union. */
      const distanceFromRoot = (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        root: IAutoMovieVector3,
      ): number =>
        Math.min(
          Vector3.length(Vector3.subtract(a, root)),
          Vector3.length(Vector3.subtract(b, root)),
        ) - reach;
      colliders.push({
        id: `person:${subject}`,
        distance: (a, b, t): number => {
          const bound: number = distanceFromRoot(a, b, frame(t));
          if (bound > (radius ?? 0)) return bound;
          return HumanColliders.distanceToSegment(
            body,
            bones(seconds + t),
            a,
            b,
          ).distance;
        },
        nearest: (
          a: IAutoMovieVector3,
          b: IAutoMovieVector3,
          t: number,
        ): IAutoMovieProjectileFirstContact.INearest => {
          const root: IAutoMovieVector3 = frame(t);
          const bound: number = distanceFromRoot(a, b, root);
          if (bound > (radius ?? 0))
            return {
              distance: bound,
              point: root,
              normal: { x: 0, y: 1, z: 0 },
            };
          const near = HumanColliders.nearest(body, bones(seconds + t), a, b);
          return {
            distance: near.distance,
            point: near.point,
            normal: near.normal,
          };
        },
      });
    }
    const solid: IAutoMoviePhysicalShape[] = [];
    for (const other of self.props.values()) {
      if (other.subject === prop.subject || other.shapes === undefined)
        continue;
      if (launched(self, other.subject)) continue;

      // What the launcher holds or wears as the flight starts goes with the
      // launcher, who is no collider: a ball leaving a gun's muzzle starts
      // on the gun's own shape, and read as a collider the gun held the
      // sweep's step at the muzzle's zero gap, each step a fresh read of
      // the shooter's displayed pose (firearm_shot_launch ran 7 minutes).
      const grips: IAutoMovieMotionHumanPerformanceState.IGrip[] =
        HumanPerformanceRead.grips(self, other.subject);
      if (
        grips.some(
          (g): boolean =>
            g.subject === launcher &&
            g.from <= seconds &&
            g.to >= seconds - 1e-6,
        )
      )
        continue;

      // What the next launcher holds as its launch ends this flight is that
      // launch's own instrument: a bat fitted to the incoming ball at the
      // strike. Its fitted approach owns the meeting, as a staged catch's
      // hands own theirs, so the sweep leaves the instrument out from the
      // launching action's start. Read as a collider, it closed the gap at
      // the horizon itself, each step a fresh read of the striker's fitted
      // arm (baseball pitch to bat stalled past three minutes).
      const handedBack: boolean =
        handback !== undefined &&
        grips.some(
          (g): boolean =>
            g.subject === handback.subject &&
            g.from <= handback.at &&
            g.to >= handback.at - 1e-6,
        );
      const pose = (t: number): IAutoMovieRigidTransform =>
        HumanPerformanceRead.prop(self, other.subject, seconds + t);
      other.shapes.forEach(
        (shape: IAutoMoviePhysicalShape, k: number): void => {
          const id: string = `prop:${other.subject}:${k}`;
          if (id === leave) return;
          solid.push(shape);
          const collider: IAutoMovieProjectileFirstContact.ICollider =
            projectileFirstContact.shape(id, shape, pose);
          colliders.push(
            handedBack ? until(collider, handback!.from - seconds) : collider,
          );
        },
      );
    }
    const tip: IAutoMovieVector3 | undefined =
      radius === undefined ? prop.points["tip"]?.point : undefined;
    const hit: IAutoMovieHit | null = projectileFirstContact(
      projectile,
      colliders,
      { from: 0, to: horizon },
      {
        radius: radius ?? 0,
        ...(tip === undefined ? {} : { tail: tip }),
        ...(departing === undefined ? {} : { departing }),
        thickness: thinnest(self, launcher, solid),
      },
    );
    if (hit === null) return null;
    const id: string = hit.collider!;
    const at: number = seconds + hit.time;
    const struck: IAutoMovieMotionHumanPropFlight.Struck = id.startsWith(
      "person:",
    )
      ? {
          kind: "person",
          subject: id.slice("person:".length),
          bone: personBone(id.slice("person:".length), hit.point),
        }
      : id.startsWith("prop:")
        ? {
            kind: "prop",
            subject: id.slice("prop:".length, id.lastIndexOf(":")),
          }
        : { kind: "ground" };
    return { hit, struck, collider: id };

    /** Resolve the struck bone with the same receiving-hand filter as the sweep. */
    function personBone(
      subject: string,
      point: IAutoMovieVector3,
    ): AutoMovieHumanoidBone {
      return HumanColliders.nearest(
        HumanPerformanceRead.person(self, subject).performer.body,
        maskedBones?.get(subject)?.(at) ??
          HumanPerformanceRead.bones(self, subject, at),
        point,
        point,
      ).bone;
    }
  }

  /**
   * The later launch that ends a flight, as the sweep leaves out the props
   * its performer holds at that launch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the performer, the launch's film second and the start of its fitted approach.
   * @evidence contracts/development/design.md#principled-representation One performer subject and two film seconds, the approach start no later than the launch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by HumanPropFlight from the next published launch and read only by this sweep.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Names no prop: the held props are read from the performance's grips at the launch, as the launcher's own are.
   */
  export interface IHandback {
    /** The performer whose later launch ends the flight. */
    subject: string;

    /** The film second of that launch, where its own fit meets the prop. */
    at: number;

    /** The film second the launching action starts, from which its fit owns the approach. */
    from: number;
  }

  /**
   * A collider present only before a flight second: from it on, the
   * handback's fitted approach owns the meeting, so the collider is absent.
   */
  function until(
    collider: IAutoMovieProjectileFirstContact.ICollider,
    from: number,
  ): IAutoMovieProjectileFirstContact.ICollider {
    return {
      id: collider.id,
      distance: (a, b, t): number =>
        t >= from
          ? Infinity
          : collider.distance === undefined
            ? collider.nearest(a, b, t).distance
            : collider.distance(a, b, t),
      nearest: (
        a: IAutoMovieVector3,
        b: IAutoMovieVector3,
        t: number,
      ): IAutoMovieProjectileFirstContact.INearest =>
        t >= from
          ? { distance: Infinity, point: a, normal: { x: 0, y: 1, z: 0 } }
          : collider.nearest(a, b, t),
    };
  }

  /** Whether any action launches a prop. */
  function launched(
    self: IAutoMovieMotionHumanPerformanceState,
    subject: string,
  ): boolean {
    for (const person of self.people.values())
      for (const segment of [...person.segments, ...person.overlays])
        if (
          (segment.plan.launches ?? []).some(
            (l: IAutoMovieMotionPropLaunch): boolean => l.prop === subject,
          )
        )
          return true;
    return false;
  }

  /**
   * The thinnest collider a flight may meet, metres: the least diameter of a
   * round shape or least full extent of a box among the people but the
   * launcher, finger bones aside, and the props that do not fly; a hull is
   * not counted.
   */
  function thinnest(
    self: IAutoMovieMotionHumanPerformanceState,
    launcher: string,
    props: readonly IAutoMoviePhysicalShape[],
  ): number {
    let least: number = Infinity;
    for (const shape of props) least = Math.min(least, size(shape));
    for (const person of self.people.values()) {
      if (person.performer.subject === launcher) continue;
      for (const segment of person.performer.body.profile.segments) {
        if (FINGER.test(segment.bone)) continue;
        for (const shape of segment.shapes ?? [])
          least = Math.min(least, size(shape));
      }
    }

    // With no thin collider, the floor permits a whole-span scan. A resolved
    // departure's engine certificate still exposes its later plane entry.
    return Number.isFinite(least) ? least : Number.MAX_VALUE;
  }

  /** A shape's least thickness, metres: a round shape's diameter, a box's least full extent; a hull is not counted. */
  function size(shape: IAutoMoviePhysicalShape): number {
    return shape.kind === "sphere" || shape.kind === "capsule"
      ? 2 * shape.radius
      : shape.kind === "box"
        ? 2 *
          Math.min(
            shape.halfExtents.x,
            shape.halfExtents.y,
            shape.halfExtents.z,
          )
        : Infinity;
  }

  /** The finger bones, whose colliders a fast flight may pass. */
  const FINGER: RegExp = /(Thumb|Index|Middle|Ring|Little)/;
}
