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
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanLoad } from "../perform/HumanLoad";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";

/**
 * The weight a coupled carry puts on its bearers (#3437): the bearing
 * contacts' shares of the borne weight, each bearer's load for a layer's
 * lean (`HumanLoad.lean`), the tip that balances a bearer the borne body
 * rides, and the capacity a bearer's moment balance bounds.
 * `HumanCarriedCoupling` states the coupling these read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is computed and who states the coupling.
 * @evidence contracts/development/design.md#principled-representation Vertical reactions on point supports for the shares, the moment balance of #3431 for the layer's lean and its bound for the capacity, and the rigid pair's static balance for the coupled tip.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four functions; the layer's lean itself is `HumanLoad`'s.
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolution and one mass model.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The engine's mass model and the coupling's centre, through the standing read `lean` uses too.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function load(
    bearer: IHumanBody,
    coupling: AutoMovieMotionMeeting.ICoupling,
    role: string = coupling.bearer,
  ): Parameters<typeof HumanLoad.lean>[0] {
    const at: IStanding = standing(bearer, coupling, role);
    return {
      mass: at.mass,
      height: at.own.y,
      load: at.load,
      ahead: at.borne.z - at.own.z,
    };
  }

  /**
   * The tip of a bearer standing still in the coupling's stance that brings its own centre and its
   * share of the borne centre, the borne body riding it, over the midpoint
   * of its feet.
   *
   * @param bearer The bearer's body.
   * @param coupling The coupling.
   * @param role The bearer's role; the coupling's first bearer when absent.
   * @returns Degrees forward (`pitch`) and toward the bearer's right (`roll`), as `HumanCarriedLean.tipped` takes them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the balance, who rides and the angles' senses.
   * @evidence contracts/development/implementation.md#principled-implementation Static balance of a rigid inverted pendulum: the borne body rides the bearer's anchor bone, so the whole pair turns about the feet, and the combined centre `(M c + m s) / (M + m)` lies over the pivot once turned by `-atan2(z, y)` forward and `atan2(x, y)` toward the right, its offsets ahead and to the left over its height above the pivot.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One standing read, one combined centre, two angles.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The angles are the balance's, never bounded here; a mass no lean of the bearer holds is `bearable`'s refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture resolution and one mass model.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The standing read `load` uses too.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function lean(
    bearer: IHumanBody,
    coupling: AutoMovieMotionMeeting.ICoupling,
    role: string = coupling.bearer,
  ): { pitch: number; roll: number } {
    const at: IStanding = standing(bearer, coupling, role);
    const pair: IAutoMovieVector3 = Vector3.subtract(
      Vector3.scale(
        Vector3.add(
          Vector3.scale(at.own, at.mass),
          Vector3.scale(at.borne, at.load),
        ),
        1 / (at.mass + at.load),
      ),
      at.pivot,
    );
    return {
      pitch: (-Math.atan2(pair.z, pair.y) * 180) / Math.PI,
      roll: (Math.atan2(pair.x, pair.y) * 180) / Math.PI,
    };
  }

  /** A bearer at the origin facing +Z in the coupling's stance, upright for a further bearer: its mass and centre, its share of the borne mass with the borne centre, and its feet's midpoint. */
  interface IStanding {
    mass: number;
    own: IAutoMovieVector3;
    load: number;
    borne: IAutoMovieVector3;
    pivot: IAutoMovieVector3;
  }

  /** The bearer standing still with its share of the coupled load, read once for the lean and the capacity. */
  const standing = (
    bearer: IHumanBody,
    coupling: AutoMovieMotionMeeting.ICoupling,
    role: string,
  ): IStanding => {
    // This bearer's share of the borne weight, and the borne centre in its
    // own anchor frame.
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
      | {
          position: IAutoMovieVector3;
          rotation: IAutoMovieQuaternion;
          anchor: AutoMovieHumanoidBone;
        }
      | undefined =
      role === coupling.bearer ? undefined : coupling.bearers?.[role];
    const centre: IAutoMovieVector3 =
      frame === undefined
        ? coupling.centre
        : Quaternion.rotateVector(
            Quaternion.inverse(frame.rotation),
            Vector3.subtract(coupling.centre, frame.position),
          );
    const model: resolveAutoMovieCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(bearer.skeleton, bearer.profile);
    // The first bearer stands in the stance the key pose was placed on; a
    // further one stands upright.
    const posture: IHumanPosture =
      frame === undefined
        ? HumanCarriedCouplingPose.stance(bearer, coupling.key.stance)
        : HumanCarriedCouplingPose.stance(bearer, { incline: 0, depth: 0 });
    const anchor: IAutoMovieResolvedBone = HumanCarriedCouplingPose.bones(
      bearer,
      posture,
      frame?.anchor ?? coupling.anchor,
    ).get(frame?.anchor ?? coupling.anchor)!;
    const feet: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanCarriedCouplingPose.bones(bearer, posture, "leftFoot");
    return {
      mass: model.mass,
      own: resolveAutoMovieCenterOfMass.place(model, feet),
      load: coupling.mass * share,
      borne: Vector3.add(
        anchor.worldPosition,
        Quaternion.rotateVector(anchor.worldRotation, centre),
      ),
      pivot: Vector3.scale(
        Vector3.add(
          feet.get("leftFoot")!.worldPosition,
          feet.get("rightFoot")!.worldPosition,
        ),
        0.5,
      ),
    };
  };

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
    const lambda: number[] = [0, 1, 2].map(
      (column: number): number =>
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
