import { Vector3, closestPointsBetweenSegments } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanBodyFitRows } from "./HumanBodyFitRows";
import { HumanJacobian } from "./HumanJacobian";

/** The alternatives of `RowStep`'s site. */
type RowStep = "at" | "motions" | "units" | "index" | "price";

/**
 * The pairs of body segments a deep fold brings together in a whole-body fit
 * (`HumanBodyFit`), each kept apart by a gap row: an arm's upper arm and
 * forearm against each thigh, its forearm against each shank, and the chest
 * against each thigh, the segments a crouch, a kneel or a hands-down landing
 * folds against one another.
 *
 * Each segment is a capsule along its bone from its joint to its child's joint,
 * at the radius the body's own measure gives it, so the gap is the distance
 * between the two axes' closest points less both radii (Ericson 2005,
 * "Real-Time Collision Detection", section 4.5.1, the capsule's distance as its
 * segment's), and its slope is the two closest points' velocities along the
 * line joining them.
 */
export namespace HumanFitPairs {
  /**
   * One capsule: a segment from a bone's joint to its child's joint, at a
   * radius.
   */
  export interface ICapsule {
    /** The bone whose joint starts the segment and whose motion carries it. */
    bone: AutoMovieHumanoidBone;

    /** The child bone whose joint ends the segment. */
    end: AutoMovieHumanoidBone;

    /** The capsule's radius, metres. */
    radius: number;
  }

  /** Two capsules kept apart. */
  export interface IPair {
    /** The first capsule. */
    a: ICapsule;

    /** The second capsule. */
    b: ICapsule;
  }

  /** A pair's reading at one posture. */
  export interface IGap {
    /**
     * The distance between the two surfaces, metres; negative where they
     * overlap.
     */
    distance: number;

    /** The closest point on the first capsule's axis, world metres. */
    a: IAutoMovieVector3;

    /** The closest point on the second capsule's axis, world metres. */
    b: IAutoMovieVector3;
  }

  /**
   * The pairs a body's deep fold brings together.
   *
   * @param body The body.
   * @returns The pairs.
   */
  export function of(body: IAutoMovieMotionHumanBody): IPair[] {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const sides: readonly ["left", "right"] = ["left", "right"];
    const capsule: (
      bone: AutoMovieHumanoidBone,
      end: AutoMovieHumanoidBone,
      radius: number,
    ) => ICapsule = (
      bone: AutoMovieHumanoidBone,
      end: AutoMovieHumanoidBone,
      radius: number,
    ): ICapsule => ({ bone, end, radius });
    const out: IPair[] = [];
    for (const s of sides)
      for (const o of sides) {
        const thigh: ICapsule = capsule(
          `${o}UpperLeg`,
          `${o}LowerLeg`,
          m.thighRadius,
        );
        const forearm: ICapsule = capsule(
          `${s}LowerArm`,
          `${s}Hand`,
          m.forearmRadius,
        );
        out.push(
          {
            a: capsule(`${s}UpperArm`, `${s}LowerArm`, m.upperArmRadius),
            b: thigh,
          },
          { a: forearm, b: thigh },
          { a: forearm, b: capsule(`${o}LowerLeg`, `${o}Foot`, m.shankRadius) },
        );
      }

    // The chest is read as a capsule from its joint to the neck's, as deep as
    // half the chest's depth, against each thigh.
    for (const o of sides)
      out.push({
        a: capsule("chest", "neck", m.chestDepth / 2),
        b: capsule(`${o}UpperLeg`, `${o}LowerLeg`, m.thighRadius),
      });
    return out;
  }

  /**
   * A pair's gap at a posture.
   *
   * @param bones The posed bones.
   * @param pair The pair.
   * @returns The gap and the closest points.
   */
  export function gap(
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    pair: IPair,
  ): IGap {
    const w: ReturnType<typeof closestPointsBetweenSegments> =
      closestPointsBetweenSegments(
        bones.get(pair.a.bone)!.worldPosition,
        bones.get(pair.a.end)!.worldPosition,
        bones.get(pair.b.bone)!.worldPosition,
        bones.get(pair.b.end)!.worldPosition,
      );
    return {
      distance: w.distance - pair.a.radius - pair.b.radius,
      a: w.pointA,
      b: w.pointB,
    };
  }

  /**
   * A pair's row of one step: its gap kept at or above minus `band`, in
   * millimetres per solved unit, linearised by the closest points' velocities
   * along the line from the second to the first.
   *
   * @param step The step's motions and units, and the reading it starts from.
   * @param pair The pair.
   * @param band How far the gap may fall below nought unpriced, metres.
   * @param mm Millimetres in a metre, the rows' unit.
   * @param prepared Optional completed gap for this exact pair and step.at's
   *   unchanged bones; freshly measured when absent.
   * @returns The row and the reading it linearises.
   */
  export function row(
    step: Pick<HumanBodyFitRows.IStep, RowStep>,
    pair: IPair,
    band: number,
    mm: number,
    prepared?: IGap,
  ): HumanBodyFitRows.IRead {
    const current: HumanBodyFitRows.IReading = step.at;
    const g: IGap = prepared ?? gap(current.bones, pair);
    const distance: number = g.distance;
    const normal: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(g.a, g.b),
    );
    return {
      row: {
        key: `pair:${pair.a.bone}:${pair.b.bone}`,
        index: step.index,
        coef: step.motions.map(
          (motion: IAutoMovieMotionHumanJacobian.IMotion, i: number): number =>
            Vector3.dot(
              Vector3.subtract(
                HumanJacobian.velocity(motion, pair.a.bone, g.a),
                HumanJacobian.velocity(motion, pair.b.bone, g.b),
              ),
              normal,
            ) *
            step.units[i]! *
            mm,
        ),
        l: (-distance - band) * mm,
        u: Infinity,
        weight: step.price,
      },
      f: (r: HumanBodyFitRows.IReading): number =>
        r === current ? distance : gap(r.bones, pair).distance,
    };
  }
}
