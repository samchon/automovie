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

/**
 * The pairs of body segments a deep fold brings together in a whole-body
 * fit (`HumanBodyFit`), each kept apart by a gap row: an arm's upper arm and
 * forearm against each thigh, its forearm against each shank, and the chest
 * against each thigh, the segments a crouch, a kneel or a hands-down landing
 * folds against one another.
 *
 * Each segment is a capsule along its bone from its joint to its child's
 * joint, at the radius the body's own measure gives it, so the gap is the
 * distance between the two axes' closest points less both radii (Ericson
 * 2005, "Real-Time Collision Detection", section 4.5.1, the capsule's
 * distance as its segment's), and its slope is the two closest points'
 * velocities along the line joining them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pairs, the capsule model with its source and the slope.
 * @evidence contracts/development/design.md#principled-representation A pair is two capsules, each a bone, its child joint's bone and a radius from the body's measure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The pair, the body's pairs, a pair's gap and its row, read by the whole-body fit alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every radius is the body's measure; the distance is the engine's segment distance.
 */
export namespace HumanFitPairs {
  /**
   * One capsule: a segment from a bone's joint to its child's joint, at a radius.
   *
   * @evidence contracts/development/design.md#principled-representation Names the capsule's two resolved joint endpoints and its radius in metres; finite body measures and available bones remain caller premises.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The pair gap and row readers consume each endpoint and radius directly; no copied mesh or action-specific geometry is stored.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Retains the existing measured capsule proxy without claiming a full-surface collision certificate or changing a radius.
   * @evidence contracts/development/common.md#meaningful-documentation States endpoint ownership, radius units, caller premises and the capsule-proxy scope.
   */
  export interface ICapsule {
    /** The bone whose joint starts the segment and whose motion carries it. */
    bone: AutoMovieHumanoidBone;

    /** The child bone whose joint ends the segment. */
    end: AutoMovieHumanoidBone;

    /** The capsule's radius, metres. */
    radius: number;
  }

  /**
   * Two capsules kept apart.
   *
   * @evidence contracts/development/design.md#principled-representation Couples the two owning capsule records whose surface gap is constrained.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both members are read by gap and its analytic relative-velocity row.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the same capsule representation on both sides with no fixture category or precomputed answer.
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the two constrained capsule owners.
   */
  export interface IPair {
    /** The first capsule. */
    a: ICapsule;

    /** The second capsule. */
    b: ICapsule;
  }

  /**
   * A pair's reading at one posture.
   *
   * @evidence contracts/development/design.md#principled-representation Couples the signed surface distance in metres with the two closest axis witnesses on the same current resolved posture.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Near-row selection reads distance and the row's relative velocity reads both witnesses; all come from the same engine segment-distance result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reports the existing capsule gap, including negative overlap, rather than a predicted step or acceptance flag.
   * @evidence contracts/development/common.md#meaningful-documentation States distance sign, world-frame witness units and shared-posture scope.
   */
  export interface IGap {
    /** The distance between the two surfaces, metres; negative where they overlap. */
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Instantiates the existing deep-fold capsule-pair policy from the body's own thigh, shank, arm and chest measures.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two side loops build limb pairs and one builds chest-thigh pairs through a local capsule constructor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves all fourteen existing proxy pairs and measured radii, including the documented half chest depth, without adding a physical tolerance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(1) time and storage for this fixed fourteen-pair policy, independent of the body's surface resolution.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares each local thigh and forearm capsule across the pairs that use it; the fit owns one pair list rather than rebuilding it per reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one caller-owned bounded pair list and retains no body or geometry globally.
   * @evidence contracts/development/common.md#meaningful-documentation Names the capsule policy, measure source, pair count, shared local records and ownership.
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
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the engine's closest points between two current axis segments, then subtracts each capsule radius in the existing order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One segment-distance call supplies both witnesses and the signed surface gap.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads actual resolved joint positions without dropping a pair or replacing its distance; valid bones and measures remain caller premises.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(1) map queries and segment-distance work per pair, with one returned gap record.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares one closest-segment result between the distance and both derivative witnesses; a different posture requires a new reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the engine's witness values in a new record without retaining the bones or pair.
   * @evidence contracts/development/common.md#meaningful-documentation Defines current endpoints, radius subtraction order, witness frame and signed distance.
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
   * millimetres per solved unit, linearised by the closest points'
   * velocities along the line from the second to the first.
   *
   * @param step The step's motions and units, and the reading it starts from.
   * @param pair The pair.
   * @param band How far the gap may fall below nought unpriced, metres.
   * @param mm Millimetres in a metre, the rows' unit.
   * @param prepared Optional completed gap for this exact pair and step.at's unchanged bones; freshly measured when absent.
   * @returns The row and the reading it linearises.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Projects the two closest witnesses' analytic rigid-point velocities onto their normalized separation, preserving the existing capsule-gap linearisation and lower bound.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One actual supplied or freshly measured gap serves the bound, witnesses and current-reading callback; variable columns use the owning Jacobian.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original normalized-separation convention, including its coincident-witness behavior, and every price, band and scaling expression; no fabricated separating direction is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Performs two velocity queries per n variables and stores O(n) row data; a supplied actual current gap removes the repeated closest-segment query, otherwise gap incurs its original constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fit supplies its evaluation's completed gap only for the identical ordered pair and unchanged current bones; witnesses feed current derivatives, the callback shares its scalar at that same reading, and another trial always invokes the actual gap owner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows a supplied gap without mutation and owns row coefficients/read-only-index references; rows retain their pair, current reading and one scalar until release, while witness ownership stays with the evaluation or temporary constructor.
   * @evidence contracts/development/common.md#meaningful-documentation States the derivative, units, current-reading reuse, degeneracy convention, retained inputs and actual-trial evaluation.
   */
  export function row(
    step: Pick<HumanBodyFitRows.IStep, "at" | "motions" | "units" | "index" | "price">,
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
