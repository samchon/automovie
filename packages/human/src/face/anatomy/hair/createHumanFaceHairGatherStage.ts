import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { ICreateHumanFaceHairGatherStageProps } from "./ICreateHumanFaceHairGatherStageProps";
import { createHumanFaceHairTailSpread } from "./createHumanFaceHairTailSpread";
import { evaluateHumanFaceHairDirection } from "./evaluateHumanFaceHairDirection";
import { humanFaceHairFrame } from "./humanFaceHairFrame";
import { humanFaceHairSequence } from "./humanFaceHairSequence";

const requireDirection = humanFaceHairFrame.direction;

/**
 * The stages of one lock: the field it is combed by and, when the layer
 * gathers, the tie it is drawn to and the tail it grows after it. Without a
 * gather the lock has one stage and `direction` is the ordinary comb field.
 * With one, the lock is drawn toward its scalp tie by blending the scalp
 * gathering direction into the field with the layer's strength, until it
 * enters the tie's radius; from that arc length it follows the tail direction
 * (the layer's flow replaced by the tail's, no parting, no lift) plus, when
 * the tail has a spread, the lock's own radial velocity from
 * `createHumanFaceHairTailSpread`.
 *
 * The integrator owns the walk and calls this owner at three moments:
 * `observe` at each station, which records the nearest approach to the tie and
 * enters the tail when the station is inside the radius; `crossing` for a step
 * about to be taken, which finds where the straight step first meets the tie's
 * sphere, so a step that jumps over the small radius still enters the tail at
 * the crossing and not beyond it; and `assertTied` when the lock is complete.
 * A lock that never reaches its tie refuses, naming its nearest approach,
 * instead of returning a shorter or ungathered lock.
 *
 * A lock whose root already lies inside the tie's radius starts its tail at
 * the root and never asks for the scalp field. A layer that gathers needs its
 * attached anchor and the scalp direction field; without them construction
 * refuses. Inputs stay caller-owned.
 *
 * @evidence contracts/common.md#principled-implementation The tie is a sphere of the layer's radius about the anchor, and a step from p to q enters it where |p + t (q - p) - anchor| = radius, the smaller root of a t^2 + b t + c with a = |q - p|^2, b = 2 (p - anchor) . (q - p) and c = |p - anchor|^2 - radius^2, accepted when it lies in [0, 1]. The premise is a nonzero step, and a zero one yields no root and so no crossing. A step that starts inside is not asked, because `observe` has already entered the tail there. The tail's velocity is the derivative of a smoothstep from the tie's entry offset to a sampled offset, so it adds no station and no length.
 * @evidence contracts/common.md#clear-and-simple-design One owner of the gathering state, which the integrator would otherwise hold as interleaved variables: whether the lock is tied, where, the tail's spread and the nearest approach. The integrator keeps the walk, the contact and the length.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case for a style or subject; every gathered lock meets the same tie and tail rules, a lock that cannot reach its tie refuses, and no state is shared between locks.
 * @evidence contracts/common.md#meaningful-documentation The comments state the stages, the three calls and when each happens, the crossing rule, the refusals and the root-inside-the-tie case.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function creates the state of one lock's gathering and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines no channel and reads the layer's gather fields, which the document type owns.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive; the integrator's stations are the only points.
 * @evidence contracts/modeling.md#spatial-conventions Points, anchor, radius and arc distance are metres in the head frame, the reference point is the neutral chart position the fields are read at, directions are unit vectors, and phases and angles are radians; nothing is converted.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface; contact with the skin stays with the integrator.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint and displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The gathering is an authored styling operation and carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity; assertHumanFaceHair owns admission of the gather fields.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The inputs are named angles, a radius, a strength and a tail direction that the document already names and admits; no input places a strand.
 */
export function createHumanFaceHairGatherStage(
  props: ICreateHumanFaceHairGatherStageProps,
) {
  const { layer } = props;
  const gather = layer.gather;
  if (
    gather !== undefined &&
    (props.anchor === undefined || props.gatherDirection === undefined)
  )
    throw new Error("Gathered hair needs its attached scalp anchor.");
  const phase = 2 * Math.PI * humanFaceHairSequence(props.sequence, 11);
  const tailLayer =
    gather === undefined
      ? undefined
      : {
          ...layer,
          flow: gather.tail.direction,
          part: undefined,
          lift: { ...layer.lift, strength: 0 },
        };
  let tied = false;
  let tieDistance = 0;
  let spread: ((distance: number) => IAutoMovieVector3) | undefined;
  const enter = (point: IAutoMovieVector3, distance: number): void => {
    tied = true;
    tieDistance = distance;
    if (gather?.tail.spread !== undefined)
      spread = createHumanFaceHairTailSpread({
        axis: Vector3.create(...gather.tail.direction),
        anchor: props.anchor!,
        entry: point,
        root: props.root,
        phase: 2 * Math.PI * humanFaceHairSequence(props.sequence, 23),
        radialFraction: Math.sqrt(humanFaceHairSequence(props.sequence, 29)),
        ...gather.tail.spread,
      });
  };
  const gap = (point: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(props.anchor!, point));
  let nearest = gather === undefined ? Infinity : gap(props.root);
  let nearestPoint = props.root;
  if (gather !== undefined && nearest <= gather.radius) enter(props.root, 0);
  return {
    /** Whether a gathered lock has yet to enter its tie. */
    pending: (): boolean => gather !== undefined && !tied,
    /** The direction the lock is combed in at a station. */
    direction(
      point: IAutoMovieVector3,
      normal: IAutoMovieVector3,
      distance: number,
    ): IAutoMovieVector3 {
      if (tied) {
        const tail = evaluateHumanFaceHairDirection({
          layer: tailLayer!,
          root: props.reference,
          normal,
          distance: distance - tieDistance,
          phase,
        });
        return spread === undefined
          ? tail
          : requireDirection(Vector3.add(tail, spread(distance - tieDistance)));
      }
      const ordinary = evaluateHumanFaceHairDirection({
        layer,
        root: props.reference,
        normal,
        distance,
        phase,
      });
      if (gather === undefined) return ordinary;
      return requireDirection(
        Vector3.add(
          Vector3.scale(ordinary, 1 - gather.strength),
          Vector3.scale(props.gatherDirection!(point), gather.strength),
        ),
      );
    },
    /** Record a station's approach to the tie and enter the tail inside it. */
    observe(point: IAutoMovieVector3, distance: number): void {
      if (gather === undefined) return;
      const approach = gap(point);
      if (approach < nearest) {
        nearest = approach;
        nearestPoint = point;
      }
      if (!tied && approach <= gather.radius) enter(point, distance);
    },
    /**
     * Where the straight step from `from` to `to` first meets the tie's
     * sphere, as a fraction of that step, or `undefined` when it does not
     * before `to`. Only a lock that has not yet entered asks.
     */
    crossing(
      from: IAutoMovieVector3,
      to: IAutoMovieVector3,
    ): number | undefined {
      const segment = Vector3.subtract(to, from);
      const fromTie = Vector3.subtract(from, props.anchor!);
      const a = Vector3.dot(segment, segment);
      const b = 2 * Vector3.dot(fromTie, segment);
      const c = Vector3.dot(fromTie, fromTie) - gather!.radius ** 2;
      const discriminant = b * b - 4 * a * c;
      if (discriminant < 0) return undefined;
      const fraction = (-b - Math.sqrt(discriminant)) / (2 * a);
      return fraction >= 0 && fraction <= 1 ? fraction : undefined;
    },
    /** Enter the tail at a crossing found by `crossing`. */
    enter,
    /** Refuse a finished lock that never reached its tie. */
    assertTied(last: IAutoMovieVector3): void {
      if (gather !== undefined && !tied)
        throw new Error(
          `A gathered lock ended before it reached its scalp tie: sequence ${props.sequence}, nearest ${nearest} m at ${JSON.stringify(nearestPoint)}, anchor ${JSON.stringify(props.anchor)}, final ${gap(last)} m.`,
        );
    },
  };
}
