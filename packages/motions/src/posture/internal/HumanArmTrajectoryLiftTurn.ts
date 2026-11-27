import {
  AutoMovieEngineVector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";

/*
 * Where on a straight transport a hand that starts low over a surface may begin
 * to turn: once the path has lifted its tracked point off the surface by the
 * hand's own extent below that point, so the curled digits, which a turn swings
 * round the hand, cannot sweep into what the hand lay over. It mirrors a reach
 * to grasp's approach, which ends its turn before the hand comes down to its
 * target (`HumanPrehension.transport`).
 *
 * The surface is the shape nearest the hand's probes at the transport's start,
 * its outward normal at the hand's lowest probe the direction; the hand starts
 * over it when that probe lies within the hand's extent of it. The extent is
 * the hand's colliders' farthest probe below the tracked point along that
 * normal, in the hand's shape at the start. The share is the extent over the
 * path's rise along the normal; the turn starts at once where the hand is far
 * from any surface or the path does not rise that far.
 * Parameter at: The transport's start frame.
 * Parameter start: The arm placed at the start, with its collider probes.
 * Parameter from: The tracked point at the start, world metres.
 * Parameter to: The tracked point at the end, world metres.
 * Returns: The share of the transport's progress the turn starts at, in [0, 1).
 */
export function HumanArmTrajectoryLiftTurn(
  at: IAutoMovieMotionHumanArmGeometry.IFrame,
  start: IAutoMovieMotionHumanArmGeometry.IPlaced,
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): number {
  const hand: IAutoMovieVector3[] = [];
  for (let probe: number = G.SURFACE; probe < start.probes.length; ++probe)
    if (at.owners[probe - G.SURFACE] === "hand")
      hand.push(start.probes[probe]![0]);
  if (hand.length === 0) return 0;

  // The hand's extent from the tracked point: the farthest of its probes,
  // the most any digit can swing below it whatever the turn.
  const reach: number = Math.max(
    ...hand.map((p: IAutoMovieVector3): number => AutoMovieEngineVector3.distance(p, from)),
  );

  // The nearest shape to any probe of the hand, within that extent.
  let nearest: number = Infinity;
  let point: IAutoMovieVector3 | undefined;
  let shape: IAutoMovieMotionHumanArmGeometry.IShape | undefined;
  for (const s of at.shapes)
    for (const p of hand) {
      if (AutoMovieEngineVector3.distance(p, s.centre) - s.radius > reach) continue;
      const gap: number = AutoMovieEnginePhysics.physicalShapeSegmentDistance(s.pose, s.shape, p, p);
      if (gap < nearest) {
        nearest = gap;
        point = p;
        shape = s;
      }
    }
  if (shape === undefined || point === undefined) return 0;
  const normal: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEnginePhysics.physicalShapeNormal(
      shape.pose,
      shape.shape,
      point,
      AutoMovieEngineVector3.normalize(AutoMovieEngineVector3.subtract(point, shape.centre)),
    ),
  );

  // The hand's extent below the tracked point along that normal, and the
  // path's rise along it.
  const extent: number = Math.max(
    0,
    ...hand.map((p: IAutoMovieVector3): number =>
      AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(from, p), normal),
    ),
  );
  if (nearest > extent) return 0;
  const rise: number = AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(to, from), normal);
  return rise > extent ? extent / rise : 0;
}
