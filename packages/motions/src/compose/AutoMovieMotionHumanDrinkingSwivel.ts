import { type IAutoMovieResolvedBone, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanDrinkingArm } from "./AutoMovieMotionHumanDrinkingArm";
import { AutoMovieMotionHumanSwivelBound } from "./AutoMovieMotionHumanSwivelBound";

/**
 * The drinking range as a bound on an elbow's swivel: the places on the
 * circle a wrist's place leaves the elbow whose shoulder lies in the range
 * healthy drinkers use (`AutoMovieMotionHumanDrinkingArm`), in closed form,
 * which the drinking search hints each candidate arm within.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is bounded, where it is read and who reads it.
 * @evidence contracts/development/design.md#principled-representation The range as four half-planes on the elbow, the form `AutoMovieMotionHumanSwivelBound` keeps an elbow in.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by `AutoMovieMotionHumanTouchDrink`; split from the arm's readings so each file holds one responsibility.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The bounds and the measure are `AutoMovieMotionHumanDrinkingArm`'s; nothing is restated.
 */
export namespace AutoMovieMotionHumanDrinkingSwivel {
  /**
   * An elbow hint moved into the drinking range: on the circle a wrist's
   * place leaves the elbow (the swivel of Tolani, Goswami and Badler 2000),
   * the place nearest the hint's swivel whose shoulder `AutoMovieMotionHumanDrinkingArm.measured` reads at
   * most `AutoMovieMotionHumanDrinkingArm.FLEXION` and `ABDUCTION`, or the hint itself when its swivel lies
   * in the range. Each bound is exact: the elbow on the circle is
   * `C + ρ(u cos ψ + v sin ψ)`, its projection on a plane of the source's
   * measure is linear in it, and an unsigned angle of at most `B` < 90
   * degrees from the projected hip is the meet of two half-planes (the hip
   * turned `B` either way, each side toward the hip), so each bound is one
   * sinusoid of the swivel kept non-negative, whose refused arc is between
   * its roots (`swivelArcs`). The hint keeps its swivel when no place on the
   * circle lies in the range, or the wrist leaves no circle.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The arm.
   * @returns From the wrist's place and a hint, world metres, the hint in the range, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the circle, why each bound is a sinusoid, the choice and the cases that keep the hint.
   * @evidence contracts/development/implementation.md#principled-implementation The range constrains the hint the arm is fitted with, in the source's own measure, solved in closed form on the swivel circle: the hint inside it is kept, one outside it moves to the nearest end of its refused arc.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The trunk once, the four bounds once; per hint one call of the shared bound.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sweep and no sampling beyond the exact three-point fit; a wrist out of the arm's reach and a fully refused circle keep the hint for the admission to judge.
   * @evidence contracts/development/implementation.md#efficient-algorithms One actual limb-free canonical solve and ordered joint admission request only shoulder/elbow/wrist/hip FK ancestry/output, then constant work per hint. Proven unrelated digit fits may be omitted by the shared selector.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The canonical observation and final FK share one exact local reader; all numerical projection/fit work remains actual. The closed-form bound and drinking measure retain their existing owners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader and four-name demand end when preparation returns/throws; the returned function retains only the original numerical arm/bounds, without poses, body history or the reader.
   */
  export function bounded(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
  ): (point: IAutoMovieVector3, hint: IAutoMovieVector3) => IAutoMovieVector3 {
    return ranged(body, posture, side).hint;
  }

  /**
   * The drinking range on one posture's arm, read once: the hint `bounded`
   * gives, and whether a wrist's place leaves any reaching elbow inside the
   * range at all (`AutoMovieMotionHumanSwivelBound.admits`), which a drink's
   * search reads before fitting a candidate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it reads.
   * @evidence contracts/development/design.md#principled-representation Two readers of one arm and one set of bounds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, read by the drink's pool.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both read the same bounds, built once.
   */
  export interface IRanged {
    /** From the wrist's place and a hint, world metres, the hint in the range (`bounded`). */
    hint: (point: IAutoMovieVector3, hint: IAutoMovieVector3) => IAutoMovieVector3;

    /** Whether the wrist's place, world metres, leaves a reaching elbow in the range. */
    admits: (point: IAutoMovieVector3) => boolean;
  }

  /**
   * The drinking range's two readers on one posture's arm (`IRanged`), the
   * trunk solved and the four bounds built once for both.
   *
   * @param body The body.
   * @param posture The posture the arm is solved on.
   * @param side The arm.
   * @returns The hint and the admission.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built once and what is returned.
   * @evidence contracts/development/implementation.md#principled-implementation The bounds are `bounded`'s; the admission is their exact union on the wrist's circle (`AutoMovieMotionHumanSwivelBound.admits`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The trunk, the four bounds, two readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No sweep and no sampling.
   * @evidence contracts/development/implementation.md#efficient-algorithms One limb-free canonical solve, then constant work per reading.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both readers share the one solve and bounds.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The readers retain the arm and the bounds only.
   */
  export function ranged(
    body: IHumanBody,
    posture: IHumanPosture,
    side: HumanHand.Side,
  ): IRanged {
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>([
      `${side}UpperArm`, `${side}LowerArm`, `${side}Hand`, `${side}UpperLeg`,
    ]);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture.seeded(body, { ...posture, limbs: {} }, undefined, undefined,
        resolution, requested).pose,
      resolution(),
      requested,
    );
    const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      bones.get(bone)!.worldPosition;
    const shoulder: IAutoMovieVector3 = at(`${side}UpperArm`);
    const hip: IAutoMovieVector3 = Vector3.subtract(
      at(`${side}UpperLeg`),
      shoulder,
    );
    const upper: number = Vector3.length(
      Vector3.subtract(at(`${side}LowerArm`), shoulder),
    );
    const lower: number = Vector3.length(
      Vector3.subtract(at(`${side}Hand`), at(`${side}LowerArm`)),
    );
    const heading: number = (posture.yaw * Math.PI) / 180;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const planes: [IAutoMovieVector3, number][] = [
      [
        { x: Math.sin(heading), y: 0, z: Math.cos(heading) },
        AutoMovieMotionHumanDrinkingArm.FLEXION,
      ],
      [
        { x: Math.cos(heading), y: 0, z: -Math.sin(heading) },
        AutoMovieMotionHumanDrinkingArm.ABDUCTION,
      ],
    ];
    // Each bound's two inward normals, as world directions whose dot with
    // the shoulder-to-elbow vector is its projected normal's dot.
    const normals: IAutoMovieVector3[] = planes.flatMap(
      ([along, bound]: [IAutoMovieVector3, number]): IAutoMovieVector3[] => {
        const h: [number, number] = [
          Vector3.dot(hip, along),
          Vector3.dot(hip, up),
        ];
        if (!(Math.hypot(...h) > 1e-9)) return [];
        const turn = (by: number): [number, number] => [
          h[0] * Math.cos(by) - h[1] * Math.sin(by),
          h[0] * Math.sin(by) + h[1] * Math.cos(by),
        ];
        const b: number = (bound * Math.PI) / 180;
        const p: [number, number] = turn(b);
        const q: [number, number] = turn(-b);
        const sides: [number, number][] = [
          [p[1], -p[0]],
          [-q[1], q[0]],
        ];
        return sides.map(
          ([x, y]: [number, number]): IAutoMovieVector3 =>
            Vector3.add(Vector3.scale(along, x), Vector3.scale(up, y)),
        );
      },
    );
    const of: AutoMovieMotionHumanSwivelBound.IArm = { shoulder, upper, lower };
    const bounds: AutoMovieMotionHumanSwivelBound.IHalfPlane[] = normals.map(
      (
        normal: IAutoMovieVector3,
      ): AutoMovieMotionHumanSwivelBound.IHalfPlane => ({
        normal,
        point: shoulder,
        margin: 0,
      }),
    );
    return {
      hint: hints(of, bounds),
      admits: (point: IAutoMovieVector3): boolean =>
        AutoMovieMotionHumanSwivelBound.admits(of, point, bounds),
    };
  }
}

/** Keep the numerical bound reader outside the canonical/FK preparation scope. */
function hints(arm: AutoMovieMotionHumanSwivelBound.IArm,
  bounds: readonly AutoMovieMotionHumanSwivelBound.IHalfPlane[]):
  (point: IAutoMovieVector3, hint: IAutoMovieVector3) => IAutoMovieVector3 {
  return (point: IAutoMovieVector3, hint: IAutoMovieVector3): IAutoMovieVector3 =>
    AutoMovieMotionHumanSwivelBound.bounded(arm, point, hint, bounds);
}
