import { Vector3 } from "@automovie/engine";
import type { IAutoMovieHumanFaceHairFinish as ImportedIAutoMovieHumanFaceHairFinish } from "@automovie/human";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Region as ImportedRegion } from "../../structures/IAutoMovieHumanFaceHair/Region";
import type { IAutoMovieHumanFaceHairFall as ImportedIAutoMovieHumanFaceHairFall } from "../../structures/IAutoMovieHumanFaceHairFall";
import type { IHumanFaceHairLayerCurl as ImportedIHumanFaceHairLayerCurl } from "../../structures/IHumanFaceHairLayerCurl";
import type { IHumanFaceHairLayerGather as ImportedIHumanFaceHairLayerGather } from "../../structures/IHumanFaceHairLayerGather";
import type { IHumanFaceHairLayerGuides as ImportedIHumanFaceHairLayerGuides } from "../../structures/IHumanFaceHairLayerGuides";
import type { IHumanFaceHairLayerHairline as ImportedIHumanFaceHairLayerHairline } from "../../structures/IHumanFaceHairLayerHairline";
import type { IHumanFaceHairLayerTaper as ImportedIHumanFaceHairLayerTaper } from "../../structures/IHumanFaceHairLayerTaper";
import type { ICreateHumanFaceHairGatherStageProps } from "./ICreateHumanFaceHairGatherStageProps";
import { createHumanFaceHairTailSpread } from "./createHumanFaceHairTailSpread";
import { evaluateHumanFaceHairDirection } from "./evaluateHumanFaceHairDirection";
import { humanFaceHairFrame } from "./humanFaceHairFrame";
import { humanFaceHairSequence } from "./humanFaceHairSequence";

const requireDirection: (value: IAutoMovieVector3) => IAutoMovieVector3 =
  humanFaceHairFrame.direction;

/**
 * The stages of one lock: the field it is combed by and, when the layer gathers, the tie it is drawn to and the tail it grows after it. Without a gather the lock has one stage and `direction` is the ordinary comb field. With one, the lock is drawn toward its scalp tie by blending the scalp gathering direction into the field with the layer's strength, until it enters the tie's radius; from that arc length it follows the tail direction (the layer's flow replaced by the tail's, no parting, no lift) plus, when the tail has a spread, the lock's own radial velocity from `createHumanFaceHairTailSpread`.
 *
 * The integrator owns the walk and calls this owner at three moments: `observe` at each station, which records the nearest approach to the tie and enters the tail when the station is inside the radius; `crossing` for a step about to be taken, which finds where the straight step first meets the tie's sphere, so a step that jumps over the small radius still enters the tail at the crossing and not beyond it; and `assertTied` when the lock is complete. A lock that never reaches its tie refuses, naming its nearest approach, instead of returning a shorter or ungathered lock.
 *
 * A lock whose root already lies inside the tie's radius starts its tail at the root and never asks for the scalp field. A layer that gathers needs its attached anchor and the scalp direction field; without them construction refuses. Inputs stay caller-owned.
 *
 * @evidence contracts/common.md#principled-implementation Ordinary scalp combing blends toward the attached tie until station or segment-sphere entry starts the tail field.
 * @evidence contracts/common.md#clear-and-simple-design observe, crossing, direction and final assertTied expose the existing integrator's gather lifecycle.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing attached anchors/fields and unreached ties refuse; no shorter or ungathered curve substitutes for a requested tie.
 * @evidence contracts/common.md#meaningful-documentation Distances are metres and tieDistance records actual walked arc length when entry occurs.
 * @evidence contracts/performance.md#efficient-algorithms Per-station field, nearest-approach and quadratic crossing work is constant aside from the supplied field query.
 * @evidence contracts/performance.md#reuse-equivalent-work One tail layer and optional spread field are prepared per lock and reused after entry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The lock closure retains nearest approach, tie state and borrowed layer/anchor until that integration finishes.
 */
export function createHumanFaceHairGatherStage(
  props: ICreateHumanFaceHairGatherStageProps,
): {
  pending: () => boolean;
  direction(
    point: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    distance: number,
  ): IAutoMovieVector3;
  observe(point: IAutoMovieVector3, distance: number): void;
  crossing(from: IAutoMovieVector3, to: IAutoMovieVector3): number | undefined;
  enter: (point: IAutoMovieVector3, distance: number) => void;
  assertTied(last: IAutoMovieVector3): void;
} {
  const { layer }: ICreateHumanFaceHairGatherStageProps = props;
  const gather: ImportedIHumanFaceHairLayerGather | undefined = layer.gather;
  if (
    gather !== undefined &&
    (props.anchor === undefined || props.gatherDirection === undefined)
  )
    throw new Error("Gathered hair needs its attached scalp anchor.");
  const phase: number = 2 * Math.PI * humanFaceHairSequence(props.sequence, 11);
  const tailLayer:
    | {
        flow: [number, number, number];
        part: undefined;
        lift: { strength: number; reach: number };
        id: string;
        surface: string;
        domain: string;
        count: number;
        seed: number;
        hairline: ImportedIHumanFaceHairLayerHairline;
        rootRegion?: ImportedRegion;
        terminalShaftDiameter?: number;
        emergenceAngleDegrees?: number;
        lengthAxes: [number, number, number, number, number, number];
        frontScale?: number;
        lengthVariation: number;
        guides?: ImportedIHumanFaceHairLayerGuides;
        gather?: ImportedIHumanFaceHairLayerGather;
        samplingStep: number;
        clearance: number;
        fall?: ImportedIAutoMovieHumanFaceHairFall;
        curl: ImportedIHumanFaceHairLayerCurl;
        taper: ImportedIHumanFaceHairLayerTaper;
        finish: ImportedIAutoMovieHumanFaceHairFinish;
      }
    | undefined =
    gather === undefined
      ? undefined
      : {
          ...layer,
          flow: gather.tail.direction,
          part: undefined,
          lift: { ...layer.lift, strength: 0 },
        };
  let tied: boolean = false;
  let tieDistance: number = 0;
  let spread: ((distance: number) => IAutoMovieVector3) | undefined;
  const enter: (point: IAutoMovieVector3, distance: number) => void = (
    point: IAutoMovieVector3,
    distance: number,
  ): void => {
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
  const gap: (point: IAutoMovieVector3) => number = (
    point: IAutoMovieVector3,
  ): number => Vector3.length(Vector3.subtract(props.anchor!, point));
  let nearest: number = gather === undefined ? Infinity : gap(props.root);
  let nearestPoint: IAutoMovieVector3 = props.root;
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
        const tail: IAutoMovieVector3 = evaluateHumanFaceHairDirection({
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
      const ordinary: IAutoMovieVector3 = evaluateHumanFaceHairDirection({
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
      const approach: number = gap(point);
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
      const segment: IAutoMovieVector3 = Vector3.subtract(to, from);
      const fromTie: IAutoMovieVector3 = Vector3.subtract(from, props.anchor!);
      const a: number = Vector3.dot(segment, segment);
      const b: number = 2 * Vector3.dot(fromTie, segment);
      const c: number = Vector3.dot(fromTie, fromTie) - gather!.radius ** 2;
      const discriminant: number = b * b - 4 * a * c;
      if (discriminant < 0) return undefined;
      const fraction: number = (-b - Math.sqrt(discriminant)) / (2 * a);
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
