import {
  type IAutoMovieHit,
  type IAutoMovieProjectile,
  Vector3,
  projectileFirstContact,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanPerformanceRead } from "./HumanPerformanceRead";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import type { HumanPropFlight } from "./HumanPropFlight";
import type { HumanPropOutcome } from "./HumanPropOutcome";
import type { IHumanProp } from "./IHumanProp";

/**
 * The one sweep of a flying prop (`HumanPropFlight`): its flight from a
 * film second against every person but the launcher, read on their displayed
 * bones at each second and passed over while a bound around their root
 * shows them out of reach (the bounding-sphere reject of #3379), the props
 * that do not fly and the floor, through the engine's one resolver
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
   * @param departing A separately resolved bounce collider; only the engine's supported physical departure certificate can defer its initial contact, never its later entry.
   * @returns The first meeting, or null when it meets nothing before the horizon.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States film/flight clocks, the launcher and pass exclusions, separate resolved-bounce opt-in, physical certificate scope, first meeting and finite-horizon sweep.
   * @evidence contracts/development/implementation.md#principled-implementation Builds the ground plane, displayed person/prop nearest-point queries and the existing stature rejection, then delegates point-or-tip-capsule contact timing to the engine. Only its supported fixed-plane/constant-tail departure proof defers a resolved bounce pair; other colliders and later entries remain eligible.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This bridge owns performance-to-collider projection and target identity; closest geometry, departure proof, scan and TOI bisections remain with their owning engine modules.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no bounce blacklist, time epsilon or fabricated gap. The existing policy omits every prop with any published launch and ignores finger thickness; the stature rejection assumes the body fits that bound, and the scan's stated thin-contact blind spot remains.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparing P props repeats their action-segment/launch scans and scans profile shapes; C collider closures feed the engine's contact queries, whose cost also includes dynamic FK/nearest-body reads. The engine owns step/bisection cost; this method claims no measured speedup.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses shared performance posture/bone readers, physicalShapeNearest and the engine flight/contact owners, while rebuilding local collider closures for the current sweep instead of caching mutable poses.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Collider/shape arrays and their performance-capturing callbacks are call-local and released after the sweep or refusal; only the small meeting escapes, with no retained frame history, host or new cache.
   */
  export function sweep(
    self: HumanPerformanceState,
    prop: IHumanProp,
    launcher: string,
    seconds: number,
    projectile: IAutoMovieProjectile,
    horizon: number,
    leave: string | undefined,
    departing?: string,
  ): HumanPropOutcome.IMeeting | null {
    const colliders: projectileFirstContact.ICollider[] = [
      projectileFirstContact.plane(
        "ground",
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ),
    ];
    for (const person of self.people.values()) {
      const subject: string = person.performer.subject;
      if (subject === launcher || `person:${subject}` === leave) continue;
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
          const near = HumanColliders.nearest(
            person.performer.body,
            HumanPerformanceRead.bones(self, subject, at),
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
        const id: string = `prop:${other.subject}:${k}`;
        if (id === leave) return;
        solid.push(shape);
        colliders.push(
          projectileFirstContact.shape(
            id,
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
        ...(departing === undefined ? {} : { departing }),
        thickness: thinnest(self, launcher, solid),
      },
    );
    if (hit === null) return null;
    const id: string = hit.collider!;
    const at: number = seconds + hit.time;
    const struck: HumanPropFlight.Struck = id.startsWith("person:")
      ? {
          kind: "person",
          subject: id.slice("person:".length),
          bone: HumanColliders.nearest(
            HumanPerformanceRead.person(self, id.slice("person:".length))
              .performer.body,
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
    return { hit, struck, collider: id };
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

    // With no thin collider, the floor permits a whole-span scan. A resolved
    // departure's engine certificate still exposes its later plane entry.
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
}
