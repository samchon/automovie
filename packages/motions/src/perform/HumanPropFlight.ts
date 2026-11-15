import {
  AutoMovieGravity,
  type IAutoMovieHit,
  type IAutoMovieProjectile,
  type IAutoMovieProjectileState,
  type IAutoMovieResolvedBone,
  Vector3,
  projectileAt,
  projectileFirstContact,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import { HumanPropFrame } from "./HumanPropFrame";
import type { HumanSegment } from "./HumanSegment";
import type { IHumanProp } from "./IHumanProp";

/**
 * Props that fly: every launch an action publishes (`IHumanActionPlan.launches`)
 * turns its prop into the engine's flight (`projectileAt`) from the launch
 * until the flight's first contact, against the people, the props that do
 * not fly themselves and the floor, found by the engine's one sweep
 * (`projectileFirstContact`), and then into where the flight ends.
 *
 * A launched prop leaves from its displayed frame at the launch second (the
 * hand that held it lets go there) with the launch's velocity; a prop the
 * action sets on its way without holding it (a ball in a barrel) leaves from
 * the launch's point. Its rotation is kept, turned by the launch's attitude
 * when it gives one. A prop that names a `tip` point flies as a capsule from
 * its origin to its tip, so an arrow meets a body with its head; any other
 * flies as its origin's point, so a bottle meets the floor with its base.
 *
 * Every person but the launcher is a collider, read on their displayed bones
 * at each second and passed over while a bound around their root shows them
 * out of reach (the bounding-sphere reject of #3379). The sweep's step keeps
 * the prop from crossing the thinnest collider it may meet in one step,
 * finger bones aside: a finger is the stated blind spot. Flights do not meet
 * each other, and a flying prop is no collider.
 *
 * The flight ends at its first contact: on the floor or a prop it rests
 * where it struck, riding that prop; on a person it stays where it struck
 * that person's bone, riding the bone. This is the outcome of a prop whose
 * model declares no flight data (#3479: it comes to rest on first contact);
 * the bounce, roll, pass and embedding of props that declare them read the
 * model body's contact data (#3482) once it is given. A flight still in the
 * air at the film's end is unended.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where a flight starts, what it can meet, the step and its blind spot, and how it ends with the outcome's source.
 * @evidence contracts/development/design.md#principled-representation A flight is its launch, its engine projectile and its first contact; the prop's frame after it is a rest in the frame of what it struck.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The flights of a prop and its frame by flight; the hits they make are `HumanPerformanceHits`'.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The flight is the engine's, never a second closed form; the sweep is the engine's one resolver.
 */
export namespace HumanPropFlight {
  /** What a flight struck. */
  export type Struck =
    | { kind: "person"; subject: string; bone: AutoMovieHumanoidBone }
    | { kind: "prop"; subject: string }
    | { kind: "ground" };

  /** One flight of a prop. */
  export interface IFlight {
    /** The prop. */
    prop: string;

    /** Film second of the launch. */
    launch: number;

    /** The launching action, with its performer. */
    source: HumanSegment.ISegment & { subject: string };

    /** The launch as the action published it. */
    published: IHumanActionPlan.ILaunch;

    /** The flight, its time zero at `launch`. */
    projectile: IAutoMovieProjectile;

    /** Film second of its first contact; Infinity when it is still in the air at the film's end. */
    end: number;

    /** Its first contact, absent while unended. */
    contact?: IContact;
  }

  /** Where and how a flight struck. */
  export interface IContact {
    /** What it struck. */
    struck: Struck;

    /** The contact point on the struck surface, world metres. */
    point: IAutoMovieVector3;

    /** The struck surface's outward unit normal. */
    normal: IAutoMovieVector3;

    /** The prop's velocity at contact, m/s. */
    velocity: IAutoMovieVector3;

    /** The prop's frame at contact, in the frame of what it struck (the bone, the prop, or the world). */
    offset: IHumanProp.IFrame;
  }

  /**
   * A prop's flights in film order, found once the performance is placed.
   *
   * @param self The performance.
   * @param subject The prop.
   * @returns The flights.
   */
  export function flights(
    self: HumanPerformanceState,
    subject: string,
  ): readonly IFlight[] {
    const kept: readonly IFlight[] | undefined = KEPT.get(self)?.get(subject);
    if (kept !== undefined) return kept;
    const building: IFlight[] | undefined = BUILDING.get(self)?.get(subject);
    if (building !== undefined) return building;
    const prop: IHumanProp | undefined = self.props.get(subject);
    if (prop === undefined) return [];
    const launches: {
      seconds: number;
      source: IFlight["source"];
      launch: IHumanActionPlan.ILaunch;
    }[] = [];
    for (const person of self.people.values())
      for (const segment of [...person.segments, ...person.overlays])
        for (const launch of segment.plan.launches ?? []) {
          if (launch.prop !== subject) continue;
          const seconds: number = segment.start + launch.seconds;
          if (
            seconds < segment.entryTime - 1e-9 ||
            seconds > segment.end + 1e-9
          )
            continue;
          launches.push({
            seconds,
            source: { ...segment, subject: person.performer.subject },
            launch,
          });
        }
    launches.sort((a, b): number => a.seconds - b.seconds);
    if (launches.length === 0) return [];
    const out: IFlight[] = [];
    const map: Map<string, IFlight[]> = BUILDING.get(self) ?? new Map();
    map.set(subject, out);
    BUILDING.set(self, map);
    try {
      for (const { seconds, source, launch } of launches)
        out.push(fly(self, prop, seconds, source, launch));
    } finally {
      map.delete(subject);
    }
    if (!self.resolving) {
      const done: Map<string, readonly IFlight[]> = KEPT.get(self) ?? new Map();
      done.set(subject, out);
      KEPT.set(self, done);
    }
    return out;
  }

  /**
   * A prop's world frame at a film second from its latest flight launched
   * at or after `since` (the latest grip's start, which a launch after it
   * ends), or undefined when no such flight has been launched by then.
   *
   * @param self The performance.
   * @param subject The prop.
   * @param seconds Film seconds.
   * @param since Film second before which a launch is overtaken by a later grip.
   * @returns The frame, or undefined.
   */
  export function frame(
    self: HumanPerformanceState,
    subject: string,
    seconds: number,
    since: number,
  ): IHumanProp.IFrame | undefined {
    let latest: IFlight | undefined;
    for (const f of flights(self, subject))
      if (f.launch <= seconds && f.launch >= since) latest = f;
    if (latest === undefined) return undefined;
    if (seconds < latest.end) {
      const state: IAutoMovieProjectileState = projectileAt(
        latest.projectile,
        seconds - latest.launch,
      );
      return { position: state.position, rotation: state.rotation! };
    }
    const contact: IContact = latest.contact!;
    const carrier: IHumanProp.IFrame | undefined = struckFrame(
      self,
      contact.struck,
      seconds,
    );
    return carrier === undefined
      ? contact.offset
      : HumanPropFrame.compose(carrier, contact.offset);
  }

  /** Fly one launch to its first contact. */
  function fly(
    self: HumanPerformanceState,
    prop: IHumanProp,
    seconds: number,
    source: IFlight["source"],
    launch: IHumanActionPlan.ILaunch,
  ): IFlight {
    // The prop leaves from where it is shown at the launch, when a grip
    // shows it there; a prop set on its way leaves from the launch's point.
    const held: boolean = HumanPerformanceRead.grips(self, prop.subject).some(
      (g: HumanPerformanceState.IGrip): boolean =>
        g.from < seconds && g.to >= seconds - 1e-6,
    );
    const shown: IHumanProp.IFrame = HumanPerformanceRead.prop(
      self,
      prop.subject,
      seconds,
    );
    const origin: IAutoMovieVector3 = held ? shown.position : launch.point;
    const rotation: IAutoMovieQuaternion =
      launch.rotation ?? (held ? shown.rotation : prop.frame.rotation);
    const projectile: IAutoMovieProjectile = {
      origin,
      velocity: launch.velocity,
      gravity: AutoMovieGravity.DOWN,
      attitude:
        launch.attitude === undefined
          ? { kind: "fixed", rotation }
          : launch.attitude.kind === "velocity"
            ? launch.attitude
            : { ...launch.attitude, rotation },
    };
    const horizon: number = self.duration - seconds;
    const flight: IFlight = {
      prop: prop.subject,
      launch: seconds,
      source,
      published: launch,
      projectile,
      end: Infinity,
    };
    if (!(horizon > 0)) return flight;

    // The colliders: everyone but the launcher, the props that do not fly,
    // and the floor.
    const colliders: projectileFirstContact.ICollider[] = [
      projectileFirstContact.plane(
        "ground",
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ),
    ];
    const people: Map<string, HumanSegment.IPerson> = new Map();
    for (const person of self.people.values()) {
      const subject: string = person.performer.subject;
      if (subject === source.subject) continue;
      people.set(`person:${subject}`, person);
      const reach: number = person.performer.body.measure.stature;
      colliders.push({
        id: `person:${subject}`,
        nearest: (
          a: IAutoMovieVector3,
          b: IAutoMovieVector3,
          t: number,
        ): projectileFirstContact.INearest => {
          const at: number = seconds + t;
          const root: IAutoMovieVector3 = HumanPerformanceRead.posture(
            self,
            subject,
            at,
          ).root;
          const bound: number =
            Math.min(
              Vector3.length(Vector3.subtract(a, root)),
              Vector3.length(Vector3.subtract(b, root)),
            ) - reach;
          if (bound > 0)
            return {
              distance: bound,
              point: root,
              normal: { x: 0, y: 1, z: 0 },
            };
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            HumanPerformanceRead.bones(self, subject, at);
          const near = HumanColliders.nearest(
            person.performer.body,
            bones,
            a,
            b,
          );
          return {
            distance: near.distance,
            point: near.point,
            normal: near.normal,
          };
        },
      });
    }
    const solid: P.IShape[] = [];
    for (const other of self.props.values()) {
      if (other.subject === prop.subject || other.shapes === undefined)
        continue;
      if (launched(self, other.subject)) continue;
      other.shapes.forEach((shape: P.IShape, k: number): void => {
        solid.push(shape);
        colliders.push(
          projectileFirstContact.shape(
            `prop:${other.subject}:${k}`,
            shape,
            (t: number): P.ITransform =>
              HumanPerformanceRead.prop(self, other.subject, seconds + t),
          ),
        );
      });
    }
    const tip: IAutoMovieVector3 | undefined = prop.points["tip"]?.point;
    const hit: IAutoMovieHit | null = projectileFirstContact(
      projectile,
      colliders,
      { from: 0, to: horizon },
      {
        radius: 0,
        ...(tip === undefined ? {} : { tail: tip }),
        thickness: thinnest(self, source.subject, solid),
      },
    );
    if (hit === null) return flight;

    // It stays where it struck, in the frame of what it struck.
    const state: IAutoMovieProjectileState = projectileAt(projectile, hit.time);
    const at: number = seconds + hit.time;
    const world: IHumanProp.IFrame = {
      position: state.position,
      rotation: state.rotation!,
    };
    const id: string = hit.collider!;
    const struck: Struck = id.startsWith("person:")
      ? {
          kind: "person",
          subject: id.slice("person:".length),
          bone: HumanColliders.nearest(
            people.get(id)!.performer.body,
            HumanPerformanceRead.bones(self, id.slice("person:".length), at),
            hit.point,
            hit.point,
          ).bone,
        }
      : id.startsWith("prop:")
        ? {
            kind: "prop",
            subject: id.slice("prop:".length, id.lastIndexOf(":")),
          }
        : { kind: "ground" };
    const carrier: IHumanProp.IFrame | undefined = struckFrame(
      self,
      struck,
      at,
    );
    return {
      ...flight,
      end: at,
      contact: {
        struck,
        point: hit.point,
        normal: hit.normal!,
        velocity: state.velocity,
        offset:
          carrier === undefined
            ? world
            : HumanPropFrame.relative(carrier, world),
      },
    };
  }

  /** The world frame of what a flight struck at a second: a bone's, a prop's, or none for the floor. */
  function struckFrame(
    self: HumanPerformanceState,
    struck: Struck,
    seconds: number,
  ): IHumanProp.IFrame | undefined {
    switch (struck.kind) {
      case "person":
        return HumanPropFrame.bone(
          HumanPerformanceRead.bones(self, struck.subject, seconds).get(
            struck.bone,
          )!,
        );
      case "prop":
        return HumanPerformanceRead.prop(self, struck.subject, seconds);
      case "ground":
        return undefined;
    }
  }

  /** Whether any action launches a prop. */
  function launched(self: HumanPerformanceState, subject: string): boolean {
    for (const person of self.people.values())
      for (const segment of [...person.segments, ...person.overlays])
        if (
          (segment.plan.launches ?? []).some(
            (l: IHumanActionPlan.ILaunch): boolean => l.prop === subject,
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
    self: HumanPerformanceState,
    launcher: string,
    props: readonly P.IShape[],
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

    // With nothing thin to meet, the floor alone: a falling flight crosses a
    // plane once, so one step may span the whole flight.
    return Number.isFinite(least) ? least : Number.MAX_VALUE;
  }

  /** A shape's least thickness, metres: a round shape's diameter, a box's least full extent; a hull is not counted. */
  function size(shape: P.IShape): number {
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

  /** The flights found, per placed performance and prop. */
  const KEPT: WeakMap<
    HumanPerformanceState,
    Map<string, readonly IFlight[]>
  > = new WeakMap();

  /** The flights being found, so a launch reading its prop sees the flights before it. */
  const BUILDING: WeakMap<
    HumanPerformanceState,
    Map<string, IFlight[]>
  > = new WeakMap();
}
