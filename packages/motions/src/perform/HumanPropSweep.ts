import { Vector3, projectileFirstContact } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
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
   * @param handback The later launch that ends this flight, when one does. The props its performer holds at that launch are left out from the start of the launching action, whose own fit owns the meeting, to the end of the sweep, and the hands that hold or touch them through that action's approach.
   * @returns The first meeting, or null when it meets nothing before the horizon.
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
    // A later launch's touching hands (a deliberate deflection) and the hands
    // holding its instrument (a racket's grip) are left to that launch through
    // its action, as a staged catch's hands are: its fit owns the meeting of
    // the instrument and the hand that carries it.
    const handedSides: readonly AutoMovieHumanSide[] =
      handback === undefined ? [] : handbackSides(self, handback);
    const approaches: readonly HumanPropCatchHands.IApproach[] =
      handback === undefined || handedSides.length === 0
        ? captureHands
        : [
            ...captureHands,
            ...handedSides.map(
              (side: AutoMovieHumanSide): HumanPropCatchHands.IApproach => ({
                subject: handback.subject,
                side,
                from: handback.from,
                until: handback.at,
              }),
            ),
          ];
    const maskedBones:
      | Map<string, ReturnType<typeof HumanPerformanceRead.prepareBones>>
      | undefined = approaches.length === 0 ? undefined : new Map();
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
          : approaches.filter((grip): boolean => grip.subject === subject);
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
   */
  export interface IHandback {
    /** The performer whose later launch ends the flight. */
    subject: string;

    /** The film second of that launch, where its own fit meets the prop. */
    at: number;

    /** The film second the launching action starts, from which its fit owns the approach. */
    from: number;

    /** The launcher's hands that meet the prop at that launch (`IAutoMovieMotionPropLaunch.touching`); none for a launch made with a held instrument, whose holding hands the sweep reads from the grips. */
    hands: readonly AutoMovieHumanSide[];
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

  /**
   * The handback launcher's hands its fit owns at the launch: the hands that
   * touch the prop and the hands that hold a prop then (the instrument that
   * strikes), each side once.
   */
  function handbackSides(
    self: IAutoMovieMotionHumanPerformanceState,
    handback: IHandback,
  ): AutoMovieHumanSide[] {
    const sides: Set<AutoMovieHumanSide> = new Set(handback.hands);
    for (const other of self.props.values())
      for (const grip of HumanPerformanceRead.grips(self, other.subject))
        if (
          grip.subject === handback.subject &&
          grip.bone === undefined &&
          grip.mount === undefined &&
          grip.from <= handback.at &&
          grip.to >= handback.at - 1e-6
        )
          sides.add(grip.side);
    return [...sides];
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
