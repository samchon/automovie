import {
  IAutoMovieBody,
  IAutoMovieClip,
  IAutoMovieInteractionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import { convexHull2D } from "../math/convexHull2D";
import { pointHullDistance } from "../math/pointHullDistance";
import { projectileTrajectory } from "../physics/projectileTrajectory";
import { IAutoMovieFreeFallResult } from "./IAutoMovieFreeFallResult";
import { ViolationCollector } from "./ViolationCollector";

const DEFAULT_MARGIN: number = 0.02;

const DEFAULT_GRAVITY: IAutoMovieVector3 = { x: 0, y: -9.81, z: 0 };

const DEFAULT_VELOCITY: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

const DEFAULT_FALL_DURATION: number = 1;

const DEFAULT_FPS: number = 30;

/**
 * Advise free fall for an unsupported, unattached body that is not already falling.
 *
 * @evidence contracts/common.md#principled-implementation Finite nonnegative margin and positive finite fall duration precede XZ convex support-hull distance; unsupported declared bodies emit a time-zero event and, absent physicsIntent, warning plus the canonical projectile clip.
 * @evidence contracts/common.md#clear-and-simple-design Support judgment and analytic trajectory reuse their geometric owners, keeping supplied support/attachment facts separate from future scene derivation or applied motion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null body, held/falling bodies and supported centers do not fabricate a fall. PhysicsIntent retains the event but suppresses advice; malformed vector/fps or unallocatable sample populations can still throw in delegated trajectory generation.
 * @evidence contracts/common.md#meaningful-documentation Documents world support/center frame, margin .02m, default gravity/velocity, one-second 30fps proposal, node fallback and invalid-input versus warning behavior.
 * @evidence contracts/performance.md#efficient-algorithms S support points require O(S log S) hull work and O(S) distance storage; a proposed Q-interval clip adds O(Q) computation/output, while no-fall cases allocate only the result and any gate findings.
 * @evidence contracts/performance.md#reuse-equivalent-work One support hull decides the candidate and one canonical trajectory supplies its position/facing tracks; changed support or projectile inputs require a fresh evaluation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned clip/findings/events, with the event borrowing the supplied center point; temporary hull storage leaves scope and no simulation cursor or host is acquired.
 * @author Samchon
 */
export const detectFreeFall: (props: {
  node?: string | undefined;
  body: IAutoMovieBody | null;
  centerOfMass: IAutoMovieVector3;
  support: readonly IAutoMovieVector3[];
  attached: boolean;
  falling: boolean;
  margin?: number | undefined;
  gravity?: IAutoMovieVector3 | undefined;
  velocity?: IAutoMovieVector3 | undefined;
  fallDuration?: number | undefined;
  fps?: number | undefined;
  physicsIntent?: string | undefined;
  path?: string | undefined;
}) => IAutoMovieFreeFallResult = (props: {
  /** Object node id, used to label the event and the suggested clip. */
  node?: string;
  /** The object's physical body. `null` → no declared physics, never falls. */
  body: IAutoMovieBody | null;
  /** Center of mass in world space at this frame. */
  centerOfMass: IAutoMovieVector3;
  /** Support contact points on the ground plane (XZ used); empty = unsupported. */
  support: readonly IAutoMovieVector3[];
  /** Whether the body is attached to / driven by something (holds it up). */
  attached: boolean;
  /** Whether the body is already on a falling trajectory. */
  falling: boolean;
  /** Allowed COM overhang past the support hull, meters. Defaults to `0.02`. */
  margin?: number;
  /** Constant acceleration for the arc. Defaults to `{0,-9.81,0}`. */
  gravity?: IAutoMovieVector3;
  /** Inherited initial velocity for the arc. Defaults to rest. */
  velocity?: IAutoMovieVector3;
  /** Seconds of fall arc to bake. Defaults to `1`. */
  fallDuration?: number;
  /** Arc sample rate. Defaults to `30`. */
  fps?: number;
  /** Marker that opts the body out of the gravity expectation. */
  physicsIntent?: string;
  /** JSON path of the annotation being checked. Defaults to `$input`. */
  path?: string;
}): IAutoMovieFreeFallResult => {
  const collector: ViolationCollector = new ViolationCollector();
  const path: string = props.path ?? "$input";
  const margin: number =
    props.margin === undefined ? DEFAULT_MARGIN : props.margin;
  const fallDuration: number =
    props.fallDuration === undefined
      ? DEFAULT_FALL_DURATION
      : props.fallDuration;
  const node: string | null = props.node ?? null;

  if (!Number.isFinite(margin) || margin < 0) {
    collector.push(
      "range",
      `${path}.margin`,
      `margin must be a finite number >= 0, but was ${margin}`,
      margin,
    );
    return empty(collector);
  }
  if (!Number.isFinite(fallDuration) || fallDuration <= 0) {
    collector.push(
      "range",
      `${path}.fallDuration`,
      `fallDuration must be a finite number > 0, but was ${fallDuration}`,
      fallDuration,
    );
    return empty(collector);
  }

  const supported: boolean =
    props.support.length > 0 &&
    pointHullDistance(props.centerOfMass, convexHull2D(props.support)) <=
      margin;
  const expectedToFall: boolean =
    props.body !== null && !supported && !props.attached && !props.falling;
  if (!expectedToFall) return empty(collector);

  const event: IAutoMovieInteractionEvent = {
    id: "fall:0",
    kind: "fall",
    source: "sampledProximity",
    time: 0,
    actor: node,
    target: null,
    object: null,
    point: props.centerOfMass,
    actionIndex: null,
    reaction: null,
  };
  if (props.physicsIntent !== undefined)
    return {
      validation: collector.toValidation(),
      events: [event],
      trajectory: null,
    };

  collector.warn(
    "physics",
    `${path}.gravity`,
    `object${node === null ? "" : ` "${node}"`} is unsupported and would fall`,
    props.centerOfMass,
  );
  const trajectory: IAutoMovieClip = projectileTrajectory(
    node ?? "object",
    {
      origin: props.centerOfMass,
      velocity: props.velocity ?? DEFAULT_VELOCITY,
      gravity: props.gravity ?? DEFAULT_GRAVITY,
    },
    fallDuration,
    props.fps ?? DEFAULT_FPS,
  );
  return { validation: collector.toValidation(), events: [event], trajectory };
};

const empty: (collector: ViolationCollector) => IAutoMovieFreeFallResult = (
  collector: ViolationCollector,
): IAutoMovieFreeFallResult => ({
  validation: collector.toValidation(),
  events: [],
  trajectory: null,
});
