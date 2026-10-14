import {
  IAutoMovieInteractionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieHullEdge } from "../math/IAutoMovieHullEdge";
import { Vector3 } from "../math/Vector3";
import { closestPointOnSegmentXZ } from "../math/closestPointOnSegmentXZ";
import { convexHull2D } from "../math/convexHull2D";
import { nearestHullEdge } from "../math/nearestHullEdge";
import { pointHullDistance } from "../math/pointHullDistance";
import { IAutoMovieSupportResult } from "./IAutoMovieSupportResult";
import { ViolationCollector } from "./ViolationCollector";

const DEFAULT_MARGIN: number = 0.02;

/**
 * Advise a topple when an XZ center lies beyond a support hull and margin.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty support and finite nonnegative margin precede canonical convex-hull distance and nearest-edge projection; the overhang direction and excess distance become a time-zero fall event and optional pivot suggestion.
 * @evidence contracts/common.md#clear-and-simple-design Hull, segment projection and vector normalization stay with their shared math owners while this adapter joins warning, event and suggestion from one support decision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No contact geometry is invented for empty support; physicsIntent suppresses warning/suggestion but keeps the event. Finite representable input geometry remains a caller premise and point support does not prove dynamic stability.
 * @evidence contracts/common.md#meaningful-documentation States world-frame support/center, default .02m allowance, exact supported boundary, borrowed pivot endpoints, fresh event point and uninstalled motion-synthesis scope.
 * @evidence contracts/performance.md#efficient-algorithms For S support points, hull construction costs O(S log S) and distance/nearest-edge scans O(S), with O(S) hull storage and fixed result/event allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work One prepared hull serves distance and pivot queries, and one nearest point supplies event and fall direction; no stale support verdict is cached across mutable inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh findings/event/direction transfer to the caller while pivot endpoints borrow support records; no support population is otherwise retained and no physics task is acquired.
 * @author Samchon
 */
export const detectSupportToppling: (props: {
  node?: string | undefined;
  centerOfMass: IAutoMovieVector3;
  support: readonly IAutoMovieVector3[];
  margin?: number | undefined;
  physicsIntent?: string | undefined;
  path?: string | undefined;
}) => IAutoMovieSupportResult = (props: {
  /** Object node id, used to label the emitted event. */
  node?: string;
  /** Object center of mass (same frame as `support`; e.g. `bodyCenterOfMass`). */
  centerOfMass: IAutoMovieVector3;
  /** Support contact points on the ground plane (XZ used). */
  support: readonly IAutoMovieVector3[];
  /** Allowed COM overhang past the hull, meters. Defaults to `0.02`. */
  margin?: number;
  /** Marker that suppresses the warning/suggestion (intentional levitation). */
  physicsIntent?: string;
  /** JSON path of the annotation being checked. Defaults to `$input`. */
  path?: string;
}): IAutoMovieSupportResult => {
  const collector: ViolationCollector = new ViolationCollector();
  const path: string = props.path ?? "$input";
  const margin: number =
    props.margin === undefined ? DEFAULT_MARGIN : props.margin;
  const node: string | null = props.node ?? null;

  if (props.support.length === 0) {
    collector.push(
      "type",
      `${path}.support`,
      "support must contain at least one contact point",
      props.support,
    );
    return { validation: collector.toValidation(), events: [], toppling: null };
  }
  if (!Number.isFinite(margin) || margin < 0) {
    collector.push(
      "range",
      `${path}.margin`,
      `margin must be a finite number >= 0, but was ${margin}`,
      margin,
    );
    return { validation: collector.toValidation(), events: [], toppling: null };
  }

  const hull: IAutoMovieVector3[] = convexHull2D(props.support);
  const distance: number = pointHullDistance(props.centerOfMass, hull);
  if (distance <= margin)
    return { validation: collector.toValidation(), events: [], toppling: null };

  const edge: IAutoMovieHullEdge = nearestHullEdge(props.centerOfMass, hull);
  const nearest: IAutoMovieVector3 = closestPointOnSegmentXZ(
    props.centerOfMass,
    edge.start,
    edge.end,
  );
  const fallDirection: IAutoMovieVector3 = Vector3.normalize({
    x: props.centerOfMass.x - nearest.x,
    y: 0,
    z: props.centerOfMass.z - nearest.z,
  });
  const overshoot: number = distance - margin;
  const event: IAutoMovieInteractionEvent = {
    id: "fall:0",
    kind: "fall",
    source: "sampledProximity",
    time: 0,
    actor: node,
    target: null,
    object: null,
    point: { x: nearest.x, y: props.centerOfMass.y, z: nearest.z },
    actionIndex: null,
    reaction: null,
  };

  if (props.physicsIntent !== undefined)
    return {
      validation: collector.toValidation(),
      events: [event],
      toppling: null,
    };

  collector.warn(
    "physics",
    `${path}.support.overshoot`,
    `object${node === null ? "" : ` "${node}"`} center of mass overhangs its support by ${round(overshoot)}m and would topple`,
    overshoot,
    overshoot,
  );
  return {
    validation: collector.toValidation(),
    events: [event],
    toppling: {
      tipEdgeStart: edge.start,
      tipEdgeEnd: edge.end,
      fallDirection,
      overshoot,
    },
  };
};

const round: (value: number) => number = (value: number): number =>
  Math.round(value * 1_000) / 1_000;
