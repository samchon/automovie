import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanLoad } from "../perform/HumanLoad";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";

/**
 * The weight a coupled carry puts on its bearers (#3437): the bearing
 * contacts' shares of the borne weight, each bearer's load for its lean
 * (`HumanLoad.lean`) and the capacity a bearer's moment balance bounds.
 * `HumanCarriedCoupling` states the coupling these read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is computed and who states the coupling.
 * @evidence contracts/development/design.md#principled-representation Vertical reactions on point supports for the shares, the moment balance of #3431 for the lean and its bound for the capacity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three functions; the lean itself is `HumanLoad`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A mass no lean balances is refused, never clamped.
 */
export namespace HumanCarriedCouplingLoad {
  /**
   * The bearer's load for its lean (`HumanCarriedLean.layer`,
   * `HumanLoad.lean`): its own mass and centre height, and the borne mass
   * with its distance ahead of the bearer's centre along the facing.
   *
   * @param bearer The bearer's body.
   * @param coupling The coupling.
   * @param role The bearer's role; the coupling's first bearer when absent.
   * @returns The load: the share of the borne mass this bearer's contacts carry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read and the frame of the distance.
   * @evidence contracts/development/implementation.md#principled-implementation The combined centre of the pair moves `m d / (M + m)` ahead of the bearer's own; the lean that balances it is #3431's moment balance, so this returns exactly its inputs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One mass model, one centre, one difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The distance is the borne centre's in the bearer's own standing frame, not a constant of the carry.
   * @evidence contracts/development/implementation.md#efficient-algorithms One trunk resolution and one mass model.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The engine's mass model and the coupling's centre.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function load(
    bearer: IHumanBody,
    coupling: AutoMovieMotionMeeting.ICoupling,
    role: string = coupling.bearer,
  ): Parameters<typeof HumanLoad.lean>[0] {
    // This bearer's share of the borne weight, and the borne centre in its
    // own hips frame.
    const share: number = coupling.contacts
      .filter(
        (c: AutoMovieMotionMeeting.ICoupledContact): boolean =>
          c.on.role === role,
      )
      .reduce(
        (s: number, c: AutoMovieMotionMeeting.ICoupledContact): number =>
          s + c.load,
        0,
      );
    const frame:
      | { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion }
      | undefined = role === coupling.bearer ? undefined : coupling.bearers?.[role];
    const centre: IAutoMovieVector3 =
      frame === undefined
        ? coupling.centre
        : Quaternion.rotateVector(
            Quaternion.inverse(frame.rotation),
            Vector3.subtract(coupling.centre, frame.position),
          );
    const model: resolveAutoMovieCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(bearer.skeleton, bearer.profile);
    const theirs: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(bearer, HumanCarriedCouplingPose.still());
    const hips: IAutoMovieResolvedBone = theirs.get("hips")!;
    const own: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      model,
      theirs,
    );
    const borne: IAutoMovieVector3 = Vector3.add(
      hips.worldPosition,
      Quaternion.rotateVector(hips.worldRotation, centre),
    );
    return {
      mass: model.mass,
      height: own.y,
      load: coupling.mass * share,
      ahead: borne.z - own.z,
    };
  }

  /**
   * Refuse a coupling whose borne mass no lean of the bearer balances.
   *
   * @param bearer The bearer's body.
   * @param coupling The coupling.
   * @param role The bearer's role; the coupling's first bearer when absent.
   * @throws {HumanRefusal} A `participant` refusal on `mass` with the feasible mass.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the bound and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation `HumanLoad.lean` is null exactly when `m d > M h` for this bearer's share `m` of the borne mass; the feasible borne mass is `M h / |d|` over that share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One load, one test.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The mass is refused, never clamped to the bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work after `load`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `load` and `HumanLoad.lean`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure check.
   */
  export function bearable(
    bearer: IHumanBody,
    coupling: AutoMovieMotionMeeting.ICoupling,
    role: string = coupling.bearer,
  ): void {
    const props: Parameters<typeof HumanLoad.lean>[0] = load(
      bearer,
      coupling,
      role,
    );
    if (HumanLoad.lean(props) !== null) return;
    // The bound is on this bearer's share; the feasible borne mass is that
    // bound over the share.
    const share: number = props.load / coupling.mass;
    const feasible: number =
      (props.mass * props.height) / Math.abs(props.ahead) / share;
    throw new HumanRefusal({
      kind: "participant",
      axis: "mass",
      value: coupling.mass,
      feasible: { kind: "range", minimum: 0, maximum: feasible, unit: "kg" },
      reason: `a borne mass of ${coupling.mass.toFixed(1)} kg ${Math.abs(props.ahead).toFixed(2)} m from a bearer of ${props.mass.toFixed(1)} kg with its centre ${props.height.toFixed(2)} m high has a moment no lean balances`,
      fix: `carry at most ${feasible.toFixed(1)} kg in this carry, or choose a carry that holds the body closer`,
    });
  }


  /**
   * The least-norm load shares of points whose weighted centre lies under a
   * centre: `w = A^T (A A^T)^-1 b` for the rows (1, x, z); equal shares when
   * the points are collinear in plan; a negative share set to none and the
   * rest renormalized.
   *
   * @param points The bearing points, world metres.
   * @param centre The borne centre of mass, world metres.
   * @returns One share per point, summing to one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the law, its degenerate cases and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The vertical reactions of a body at rest on point supports satisfy the force sum and the two horizontal moment balances; the least-norm solution spreads the weight evenly among redundant supports.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Three rows, one three-by-three solve by Cramer's rule, then the non-negative cut.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A negative share, a pull a resting contact cannot give, is cut to none and the rest renormalized; singular rows share equally. Both are stated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the points.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function shares(
    points: readonly IAutoMovieVector3[],
    centre: IAutoMovieVector3,
  ): number[] {
    const n: number = points.length;
    const equal: number[] = points.map((): number => 1 / n);
    if (n === 1) return [1];
    const rows: number[][] = [
      points.map((): number => 1),
      points.map((p: IAutoMovieVector3): number => p.x),
      points.map((p: IAutoMovieVector3): number => p.z),
    ];
    const g: number[][] = rows.map((a: number[]): number[] =>
      rows.map((b: number[]): number =>
        a.reduce((s: number, v: number, i: number): number => s + v * b[i]!, 0),
      ),
    );
    const det = (m: number[][]): number =>
      m[0]![0]! * (m[1]![1]! * m[2]![2]! - m[1]![2]! * m[2]![1]!) -
      m[0]![1]! * (m[1]![0]! * m[2]![2]! - m[1]![2]! * m[2]![0]!) +
      m[0]![2]! * (m[1]![0]! * m[2]![1]! - m[1]![1]! * m[2]![0]!);
    const d: number = det(g);

    // Collinear points in plan: the three equations are singular.
    const scale: number = Math.max(...g.flat().map(Math.abs));
    if (!(Math.abs(d) > Number.EPSILON * scale * scale * scale)) return equal;
    const b: number[] = [1, centre.x, centre.z];
    const lambda: number[] = [0, 1, 2].map((column: number): number =>
      det(
        g.map((r: number[], i: number): number[] =>
          r.map((v: number, j: number): number => (j === column ? b[i]! : v)),
        ),
      ) / d,
    );
    const raw: number[] = points.map(
      (_: IAutoMovieVector3, i: number): number =>
        lambda[0]! * rows[0]![i]! +
        lambda[1]! * rows[1]![i]! +
        lambda[2]! * rows[2]![i]!,
    );
    const kept: number[] = raw.map((w: number): number => Math.max(0, w));
    const sum: number = kept.reduce((s: number, w: number): number => s + w, 0);
    return sum > 0 ? kept.map((w: number): number => w / sum) : equal;
  }
}
