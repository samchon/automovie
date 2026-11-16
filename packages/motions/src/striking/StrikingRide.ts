import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanColliders } from "../posture/HumanColliders";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingStroke } from "./StrikingStroke";

/**
 * A stopped weapon riding the body it met: after a strike's limb has stopped
 * on another person, that person keeps moving (a cover still closing, a
 * trunk still turning), and a limb held at the world point of the contact
 * would be run through by the surface it rests on. The ride gives the limb's
 * goal way before that surface.
 *
 * The contact is one-sided: the met segment's rigid motion since the stop,
 * read at the weapon's point nearest the met body, is applied to the limb's
 * goal only along the contact normal (out of the met body toward the weapon)
 * and only outward, so the limb is pushed off by a surface advancing into it
 * from any side (a covering glove closing across the line as much as one
 * coming down it) and is never dragged after one that withdraws, the
 * non-penetration constraint of a frictionless contact. The push is what the
 * surface has advanced along the normal less what the law's own goal has
 * moved away from the contact along it since the stop: whole while the weapon
 * rests on the surface for the dwell ({@link StrikingStroke.DWELL}), gone once
 * the law's withdrawal outruns the surface, and held where the law's path
 * would carry the limb back into the surface (a guard that lies beyond a
 * contact made early, near the striker's own body).
 *
 * Two people's poses can each depend on the other's (each rides the other's
 * arm), so the met segment is read on a fixed grid of film seconds from the
 * stop, memoised in ascending order, and a pose reads the grid two steps
 * behind its own second: every read reaches strictly earlier nodes, whatever
 * the other person's pose reads back.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States one-sided normal displacement, dwell/withdrawal semantics and the ascending lagged grid that breaks mutual-read cycles.
 * @evidence contracts/development/design.md#principled-representation A ride owns an existing fixed stop contact and ascending world frames for its met bone; body/geometry queries stay with their canonical owners.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The stop, actual partner reader, own goal and weapon axis produce one carry operation without another contact or pose representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps the original 1/240-second grid, two-step lag, six finite-difference probes, nine axis samples and outward-only push; requested FK removes only frames the met-bone/contact query never reads.
 */
export namespace StrikingRide {
  /**
   * The grid's step and half the lag behind the shown second, seconds: half
   * the 1/120 s step of the performance's contact resolution, so the lag is
   * one resolution step.
   */
  export const STEP: number = 1 / 240;

  /**
   * What a ride is built from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its exact film-time reading and world-frame purpose.
   * @evidence contracts/development/design.md#principled-representation Actual stop/partner/course readers supply the fixed contact's physical inputs rather than baked body frames.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only partner, stop, own goal and axis are needed to form the ride.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses canonical performer, posture and interface vector types.
   */
  export interface IProps {
    /**
     * The person the weapon met, read at call time.
     *
     * @returns Their body and bone query.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines the call-time met performer whose body and exact-time bone reader determine the contacted surface.
     * @evidence contracts/development/implementation.md#principled-implementation The supplied strike-law closure resolves the actual stopped-against participant through its action context; create calls it for stop contact and each newly demanded frame node.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Participant resolution stays with the law/context, while create owns the contact and ascending frame-grid evaluation.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the named partner and their real pose reader rather than substituting entry bones or a frozen actor; the original lagged-time cycle rule remains.
     * @evidence contracts/development/implementation.md#efficient-algorithms Each invocation pays its context's participant lookup; requested bone ancestry is evaluated only when create subsequently asks for a frame.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The enclosing ride captures its stop/participant identity but calls this reader at actual use time; it does not keep a stale displayed pose or share another actor's result.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The ride retains the closure for its lifetime, while each returned performer reference is borrowed during contact/grid evaluation; new resources and participant histories are not acquired.
     */
    other(): IHumanActionContext.IPerformer;

    /** Film second of the stop. */
    stop: number;

    /**
     * The stopped limb's own goal point as its law shows it, before any ride.
     *
     * @param seconds Film seconds; read at the stop only.
     * @returns World metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines the law's uncarried world-metre goal at the exact film-time stop, the reference for later withdrawal.
     * @evidence contracts/development/implementation.md#principled-implementation The supplied punch/kick/knee reader evaluates its actual free-course goal at stop; create subtracts this reference from the current goal along the measured contact normal.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The law owns free-course geometry, and create lazily reads one held reference before the first effective carry computation.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the original law's goal and exact stop, without replacing hand/foot contact, extending dwell or scripting a partner displacement.
     * @evidence contracts/development/implementation.md#efficient-algorithms One demanded free-course goal read per fixed ride; subsequent carry calls pay only relative vector arithmetic against the held reference.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work create retains this exact fixed-stop goal only under the ride's unchanged law/stop contract; settle or changed stop replaces the ride and its reference.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources At most one held vector and the callback live with the ride, ending on ride/plan release; no sampled-time goal history grows.
     */
    goal(seconds: number): IAutoMovieVector3;

    /**
     * The met weapon's axis from the performer's own shown bones.
     *
     * @param seconds Film seconds, at or before the stop.
     * @returns The axis ends, world metres.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines the actual stopped weapon axis in world metres at the stop or an earlier film second.
     * @evidence contracts/development/implementation.md#principled-implementation Strike-law producers derive both endpoints from their own shown bone frames; create uses the exact stop axis for the body's signed-distance gradient and nearest axis point.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The law supplies limb geometry once, and create shares that pair across the fixed contact's probes and met-bone selection.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the actual limb at the stop with the original six normal probes, nine axis points and gradient threshold; no proxy axis or altered contact tolerance is supplied.
     * @evidence contracts/development/implementation.md#efficient-algorithms One axis producer call per lazy stop-contact construction; pose/FK cost remains with its law, while all contact probes share the completed endpoint pair.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Only probes at this exact body/axis/stop contact reuse endpoints; later grid frames still read the partner's actual lagged seconds and no axis-time cache is built.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary endpoints end with contact construction; the ride retains only the selected contact point/normal and met-bone metadata until release.
     */
    axis(seconds: number): readonly [IAutoMovieVector3, IAutoMovieVector3];
  }

  /**
   * A built ride.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the carried limb goal and the initial two-grid-step identity period.
   * @evidence contracts/development/design.md#principled-representation A posture transform keeps contact correction separate from the law's own free course.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One carry operation serves the stopped punch, kick and knee.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing posture and limb unions without a second actor or solver.
   */
  export interface IRide {
    /**
     * A posture with one limb's goal carried by the met segment.
     *
     * @param posture The law's posture at the second.
     * @param limb The stopped limb.
     * @param seconds Film seconds.
     * @returns The posture, unchanged until two grid steps past the stop.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines the posture/limb/film-second inputs, initial identity period and one-sided carried point/bend output.
     * @evidence contracts/development/implementation.md#principled-implementation create interpolates the met segment's rigid motion on its original two-step-lagged grid, then shifts point and bend by max(0, surface advance minus own withdrawal) along the contact normal.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Early unchanged cases precede lazy contact construction, ascending frame reads and one fresh limb-goal replacement.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves on-bound goals, zero-gradient identity, grid step, lag, outward-only correction and cycle refusal; no contact outcome or goal constraint is relaxed.
     * @evidence contracts/development/implementation.md#efficient-algorithms A call appends only missing ascending grid nodes, each requesting the selected met bone's actual pose ancestry; interpolation and shift cost are constant once nodes exist. Unsupported pose coupling keeps its complete fallback.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses only this ride's fixed contact/held goal and original ascending frame grid; each new node is evaluated at its actual film second under the lag rule and a changed stop gets a new ride.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The ride owns at most floor((last requested second-stop)/STEP)+2 frames plus one contact and held goal; finite action clocks bound callers and settle/stop replacement or plan release drops the owner.
     */
    carry(
      posture: IHumanPosture,
      limb: IHumanPosture.Limb,
      seconds: number,
    ): IHumanPosture;
  }

  /**
   * The step of the central differences that read the met surface's normal,
   * metres: 1 mm, well under every collider radius, so both samples lie on
   * the same side of the surface the weapon touches.
   */
  const NORMAL_STEP: number = 0.001;

  /** The intervals the weapon's axis is sampled in for its point nearest the met body. */
  const AXIS_SAMPLES: number = 8;

  /** Where the weapon touched the met body at the stop. */
  interface IContact {
    /** The weapon's axis point nearest the met body, world metres. */
    point: IAutoMovieVector3;

    /** The unit normal out of the met body toward the weapon. */
    normal: IAutoMovieVector3;
  }

  /** The met segment's world frame at a grid node. */
  interface IFrame {
    /** Its joint, world metres. */
    position: IAutoMovieVector3;

    /** Its world rotation. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * Build a ride.
   *
   * @param props The stop, the met person and the weapon's axis.
   * @returns The ride, memoising the met segment's frames for its life.
   * @throws {Error} From `carry`, when a grid node is read before the nodes under it are known, which the two-step lag excludes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States contact construction, lagged frame ownership and cycle refusal; namespace documents actual normal/push geometry.
   * @evidence contracts/development/implementation.md#principled-implementation Retains the signed-distance normal, nearest axis sample and frictionless outward-only relative surface displacement, interpolating the same ascending lagged rigid frames.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy stop-contact query selects the met bone and one original frame grid serves all carry calls.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps all original probes, samples, grid seconds, lag, normal threshold and one-sided withdrawal law; contact construction and first met-bone selection share the same fixed stop geometry instead of evaluating that axis twice.
   * @evidence contracts/development/implementation.md#efficient-algorithms Stop contact pays the original actual shape queries but prepares its fixed collider frames once. Later grid nodes demand only the actual met bone and required ancestry; their underlying supported pose dependencies still execute, with full fallback for unsupported coupling. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Same-call signed-distance probes share the immutable stop-bones placement/shape frames, never query results. The existing ascending grid retains the actual met-bone frames only under its original fixed-stop/two-step-lag contract, and settle/stop replacement creates a new ride.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources At most floor((last requested film second minus stop)/STEP)+2 frames, one contact, one own goal and one bone set live with the ride; finite action clocks bound callers. Fixed collider readers end when contact returns, and the enclosing law releases the ride on settle/changed stop or plan release.
   */
  export function create(props: IProps): IRide {
    const frames: IFrame[] = [];
    let bone: AutoMovieHumanoidBone | undefined;
    let requested: ReadonlySet<AutoMovieHumanoidBone> | undefined;
    let touch: IContact | null | undefined;
    let held: IAutoMovieVector3 | undefined;
    let filling: boolean = false;

    // Nodes are filled in ascending order: filling a node reads the other
    // person at that node's second, and whatever that read asks of this ride
    // lies at least one node earlier.
    const frame = (index: number): IFrame => {
      if (index < frames.length) return frames[index]!;
      if (filling)
        throw new Error("A ride's frame was read before the frames under it");
      filling = true;
      try {
        while (frames.length <= index) {
          const other: IHumanActionContext.IPerformer = props.other();
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            other.bones(props.stop + frames.length * STEP, requested);
          const resolved: IAutoMovieResolvedBone = bones.get(bone!)!;
          frames.push({
            position: resolved.worldPosition,
            rotation: resolved.worldRotation,
          });
        }
      } finally {
        filling = false;
      }
      return frames[index]!;
    };

    // The contact at the stop: the point of the weapon's axis nearest the met
    // body, and the unit normal out of that body toward the weapon, the
    // gradient of the body's signed distance as the axis is translated
    // (central differences of NORMAL_STEP). Null when the gradient vanishes,
    // where no side of the surface is defined and nothing is carried.
    const contact = (): IContact | null => {
      if (touch !== undefined) return touch;
      const other: IHumanActionContext.IPerformer = props.other();
      const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        other.bones(props.stop, HumanColliders.bones(other.body));
      const geometry: ReturnType<typeof HumanColliders.reading> =
        HumanColliders.reading(other.body, bones);
      const [a, b] = props.axis(props.stop);
      const gap = (shift: IAutoMovieVector3): number =>
        geometry.segment(
          Vector3.add(a, shift),
          Vector3.add(b, shift),
        ).distance;
      const axis = (k: 0 | 1 | 2): IAutoMovieVector3 => ({
        x: k === 0 ? NORMAL_STEP : 0,
        y: k === 1 ? NORMAL_STEP : 0,
        z: k === 2 ? NORMAL_STEP : 0,
      });
      const slope = (k: 0 | 1 | 2): number =>
        gap(axis(k)) - gap(Vector3.scale(axis(k), -1));
      const gradient: IAutoMovieVector3 = {
        x: slope(0),
        y: slope(1),
        z: slope(2),
      };
      let point: IAutoMovieVector3 = a;
      let least: number = Number.POSITIVE_INFINITY;
      for (let i: number = 0; i <= AXIS_SAMPLES; i++) {
        const at: IAutoMovieVector3 = Vector3.lerp(a, b, i / AXIS_SAMPLES);
        const d: number = geometry.segment(at, at).distance;
        if (d < least) {
          least = d;
          point = at;
        }
      }
      touch =
        Vector3.length(gradient) > 1e-9
          ? { point, normal: Vector3.normalize(gradient) }
          : null;
      if (touch !== null) {
        bone = geometry.segment(a, b).bone;
        requested = new Set<AutoMovieHumanoidBone>([bone]);
      }
      return touch;
    };

    // A world point moved by the met segment's rigid motion from the stop to
    // a node.
    const moved = (
      point: IAutoMovieVector3,
      from: IFrame,
      to: IFrame,
    ): IAutoMovieVector3 =>
      Vector3.add(
        to.position,
        Quaternion.rotateVector(
          Quaternion.multiply(to.rotation, Quaternion.inverse(from.rotation)),
          Vector3.subtract(point, from.position),
        ),
      );

    return {
      carry: (
        posture: IHumanPosture,
        limb: IHumanPosture.Limb,
        seconds: number,
      ): IHumanPosture => {
        const goal: IHumanPosture.IGoal | undefined = posture.limbs[limb];
        const lagged: number = seconds - 2 * STEP - props.stop;
        if (goal === undefined || goal.on !== undefined || !(lagged > 0))
          return posture;
        const met: IContact | null = contact();
        if (met === null) return posture;

        // How far the surface has come toward the weapon along the normal,
        // less how far the law's own goal has gone away from it.
        const index: number = Math.floor(lagged / STEP);
        const share: number = lagged / STEP - index;
        const first: IFrame = frame(0);
        const low: IFrame = frame(index);
        const high: IFrame = frame(index + 1);
        const advanced: number = Vector3.dot(
          Vector3.subtract(
            Vector3.lerp(
              moved(met.point, first, low),
              moved(met.point, first, high),
              share,
            ),
            met.point,
          ),
          met.normal,
        );
        held ??= props.goal(props.stop);
        const withdrawn: number = Vector3.dot(
          Vector3.subtract(goal.point, held),
          met.normal,
        );
        const pushed: number = Math.max(0, advanced - withdrawn);
        if (pushed === 0) return posture;
        const shift: IAutoMovieVector3 = Vector3.scale(met.normal, pushed);
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            [limb]: {
              ...goal,
              point: Vector3.add(goal.point, shift),
              bend: Vector3.add(goal.bend, shift),
            },
          },
        };
      },
    };
  }
}
