import {
  type IAutoMovieDetectSupportToppling,
  type IAutoMovieHullEdge,
  IAutoMovieInteractionEvent,
  type IAutoMovieSupportResult,
  IAutoMovieVector3,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { closestPointOnSegmentXZ } from "../math/closestPointOnSegmentXZ";
import { convexHull2D } from "../math/convexHull2D";
import { nearestHullEdge } from "../math/nearestHullEdge";
import { pointHullDistance } from "../math/pointHullDistance";
import { AutoMovieEngineViolationCollector } from "./AutoMovieEngineViolationCollector";

const DEFAULT_MARGIN: number = 0.02;

/** Advise a topple when an XZ center lies beyond a support hull and margin. */
export function detectSupportToppling(
  props: IAutoMovieDetectSupportToppling.IProps,
): IAutoMovieSupportResult {
  const collector: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
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
  if (margin < 0) {
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
}

const round: (value: number) => number = (value: number): number =>
  Math.round(value * 1_000) / 1_000;
