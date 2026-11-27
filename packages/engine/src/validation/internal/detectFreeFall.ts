import {
  IAutoMovieClip,
  type IAutoMovieDetectFreeFall,
  type IAutoMovieFreeFallResult,
  IAutoMovieInteractionEvent,
  IAutoMovieVector3,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { convexHull2D } from "../../math/internal/convexHull2D";
import { pointHullDistance } from "../../math/internal/pointHullDistance";
import { AutoMovieGravity } from "../../physics/AutoMovieGravity";
import { projectileTrajectory } from "../../physics/internal/projectileTrajectory";
import { AutoMovieEngineViolationCollector } from "../AutoMovieEngineViolationCollector";

/*
 * Advise free fall for an unsupported, unattached body that is not already
 * falling.
 */
export function detectFreeFall(
  props: IAutoMovieDetectFreeFall.IProps,
): IAutoMovieFreeFallResult {
  const collector: IAutoMovieViolationCollector =
    new AutoMovieEngineViolationCollector();
  const path: string = props.path ?? "$input";
  const margin: number =
    props.margin === undefined ? DEFAULT_MARGIN : props.margin;
  const fallDuration: number =
    props.fallDuration === undefined
      ? DEFAULT_FALL_DURATION
      : props.fallDuration;
  const node: string | null = props.node ?? null;

  if (margin < 0) {
    collector.push(
      "range",
      `${path}.margin`,
      `margin must be a finite number >= 0, but was ${margin}`,
      margin,
    );
    return empty(collector);
  }
  if (fallDuration <= 0) {
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
}

const DEFAULT_MARGIN: number = 0.02;

const DEFAULT_GRAVITY: IAutoMovieVector3 = AutoMovieGravity.DOWN;

const DEFAULT_VELOCITY: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

const DEFAULT_FALL_DURATION: number = 1;

const DEFAULT_FPS: number = 30;

const empty: (
  collector: IAutoMovieViolationCollector,
) => IAutoMovieFreeFallResult = (
  collector: IAutoMovieViolationCollector,
): IAutoMovieFreeFallResult => ({
  validation: collector.toValidation(),
  events: [],
  trajectory: null,
});
