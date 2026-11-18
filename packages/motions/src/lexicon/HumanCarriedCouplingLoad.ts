import {
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionCoupling,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarriedCouplingLoad,
  IAutoMovieMotionHumanLoad,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanLoad } from "../perform/HumanLoad";
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
   * @evidence contracts/development/implementation.md#efficient-algorithms One fitted stance resolution gives the anchor, the centre of mass and the feet; the mass model is the body's own.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The stance is `HumanCarriedCouplingPose.stood`, the resolution the coupling's frames were stated on, and the mass model `IHumanBody.massModel`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function load(
    bearer: IAutoMovieMotionHumanBody,
    coupling: IAutoMovieMotionCoupling,
    role: string = coupling.bearer,
  ): IAutoMovieMotionHumanLoad.ILeanProps {
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
   * @evidence contracts/development/implementation.md#principled-implementation Static balance of a rigid inverted pendulum: the borne body rides the bearer's anchor bone, so the whole pair turns about the feet, and the combined centre `(M c + m s) / (M + m)`, `s` the share-weighted point the bearer's contacts press it at, lies over the pivot once turned by `-atan2(z, y)` forward and `atan2(x, y)` toward the right, its offsets ahead and to the left over its height above the pivot.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One standing read, one combined centre, two angles.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The angles are the balance's, never bounded here; a mass no lean of the bearer holds is `bearable`'s refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fitted stance resolution gives the anchor, the centre of mass and the feet; the mass model is the body's own.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The standing read is the one `load` takes; nothing is shared between calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function lean(
    bearer: IAutoMovieMotionHumanBody,
    coupling: IAutoMovieMotionCoupling,
    role: string = coupling.bearer,
  ): IAutoMovieMotionHumanCarriedCouplingLoad.ILeanResult {
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

  /** A bearer at the origin facing +Z in the coupling's stance, upright for a further bearer: its mass and centre, its share of the borne mass with the point its contacts press it at (the share-weighted contact points, the borne centre for a coupling without them), and its feet's midpoint. */
  interface IStanding {
    mass: number;
    own: IAutoMovieVector3;
    load: number;
    borne: IAutoMovieVector3;
    pivot: IAutoMovieVector3;
  }

  /** The bearer standing still with its share of the coupled load, read once for the lean and the capacity. */
  const standing = (
    bearer: IAutoMovieMotionHumanBody,
    coupling: IAutoMovieMotionCoupling,
    role: string,
  ): IStanding => {
    // This bearer's share of the borne weight, and where it presses: each
    // contact's share at the contact (the reactions the bearer bears), which
    // is the borne centre only where the contacts' line passes under it.
    const own: IAutoMovieMotionCoupling.IContact[] = coupling.contacts.filter(
      (c: IAutoMovieMotionCoupling.IContact): boolean => c.on.role === role,
    );
    const share: number = own.reduce(
      (s: number, c: IAutoMovieMotionCoupling.IContact): number => s + c.load,
      0,
    );
    const pressed: IAutoMovieVector3 =
      share > 0 &&
      own.every(
        (c: IAutoMovieMotionCoupling.IContact): boolean =>
          c.load === 0 || c.at !== undefined,
      )
        ? Vector3.scale(
            own.reduce(
              (
                s: IAutoMovieVector3,
                c: IAutoMovieMotionCoupling.IContact,
              ): IAutoMovieVector3 =>
                c.load === 0 ? s : Vector3.add(s, Vector3.scale(c.at!, c.load)),
              { x: 0, y: 0, z: 0 },
            ),
            1 / share,
          )
        : coupling.centre;
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
        ? pressed
        : Quaternion.rotateVector(
            Quaternion.inverse(frame.rotation),
            Vector3.subtract(pressed, frame.position),
          );
    const model: IAutoMovieResolveCenterOfMass.IModel =
      bearer.massModel;

    // The first bearer stands in the stance the key pose was placed on; a
    // further one stands upright. Both are read on the same fitted stance
    // `HumanCarriedCoupling.couple` stated the coupling's frames on, so the
    // anchor, the centre and the feet are one posture's.
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanCarriedCouplingPose.stood(
        bearer,
        frame === undefined ? coupling.key.stance : { incline: 0, depth: 0 },
      );
    const anchor: IAutoMovieResolvedBone = bones.get(
      frame?.anchor ?? coupling.anchor,
    )!;
    return {
      mass: model.mass,
      own: resolveAutoMovieCenterOfMass.place(model, bones),
      load: coupling.mass * share,
      borne: Vector3.add(
        anchor.worldPosition,
        Quaternion.rotateVector(anchor.worldRotation, centre),
      ),
      pivot: Vector3.scale(
        Vector3.add(
          bones.get("leftFoot")!.worldPosition,
          bones.get("rightFoot")!.worldPosition,
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
    bearer: IAutoMovieMotionHumanBody,
    coupling: IAutoMovieMotionCoupling,
    role: string = coupling.bearer,
  ): void {
    const props: IAutoMovieMotionHumanLoad.ILeanProps = load(
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
   * The load shares of point supports under a borne centre: the least-norm
   * shares that sum to one with their weighted centre under the centre,
   * `w = A^T (A A^T)^+ b` for the rows (1, x, z) in plan. Collinear supports
   * share by the lever rule along their line, coincident ones equally. A
   * support the solution would have pull is dropped and the rest solved
   * again, so every share is a push.
   *
   * @param points The bearing points, world metres.
   * @param centre The borne centre of mass, world metres.
   * @returns One share per point, none negative, summing to one; none for no point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the law, its degenerate cases, the sign rule and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The vertical reactions of a body at rest on point supports satisfy the force sum and the two horizontal moment balances; among redundant supports the least-norm solution spreads the weight evenly. About the supports' mean the force row is orthogonal to the moment rows, so each share is `1/n` plus the moment part, solved on the two-by-two moment matrix, or on the supports' principal line when that matrix is singular (the pseudo-inverse: a centre off a line of supports cannot be balanced across it, and only its place along the line is). A resting contact pushes only, so the most negative share's support is dropped and the rest solved again, a greedy active set.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The active set and its loop, over one least-norm solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No share is clamped and renormalised: a support that would pull bears nothing and the rest carry the weight in balance. With the centre outside every subset of the supports the loop ends on fewer supports, down to one that bears it all.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each round is linear in the supports and drops one, so at most n rounds and O(n^2) work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its points.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function; it holds O(n) numbers during the call.
   */
  export function shares(
    points: readonly IAutoMovieVector3[],
    centre: IAutoMovieVector3,
  ): number[] {
    let active: number[] = points.map(
      (_: IAutoMovieVector3, i: number): number => i,
    );
    for (;;) {
      const w: number[] = leastNorm(
        active.map((i: number): IAutoMovieVector3 => points[i]!),
        centre,
      );
      let worst: number = -1;
      for (let k: number = 0; k < w.length; k++)
        if (w[k]! < 0 && (worst < 0 || w[k]! < w[worst]!)) worst = k;
      if (worst < 0) {
        const out: number[] = points.map((): number => 0);
        active.forEach((i: number, k: number): void => {
          out[i] = w[k]!;
        });
        return out;
      }
      active = active.filter((_: number, k: number): boolean => k !== worst);
    }
  }

  /** The least-norm shares of points, summing to one, whose weighted centre lies under a centre in plan (`shares` states the method); one point bears all. */
  const leastNorm = (
    points: readonly IAutoMovieVector3[],
    centre: IAutoMovieVector3,
  ): number[] => {
    const n: number = points.length;
    if (n <= 1) return points.map((): number => 1);

    // About the points' mean, the force row is orthogonal to the moment
    // rows, and the equations keep their precision far from the origin.
    let mx: number = 0;
    let mz: number = 0;
    for (const p of points) {
      mx += p.x / n;
      mz += p.z / n;
    }
    let sxx: number = 0;
    let sxz: number = 0;
    let szz: number = 0;
    for (const p of points) {
      sxx += (p.x - mx) ** 2;
      sxz += (p.x - mx) * (p.z - mz);
      szz += (p.z - mz) ** 2;
    }
    const cx: number = centre.x - mx;
    const cz: number = centre.z - mz;
    const det: number = sxx * szz - sxz * sxz;
    const trace: number = sxx + szz;

    // Spread in plan: both moment balances.
    if (det > Number.EPSILON * trace * trace) {
      const lx: number = (szz * cx - sxz * cz) / det;
      const lz: number = (sxx * cz - sxz * cx) / det;
      return points.map(
        (p: IAutoMovieVector3): number =>
          1 / n + lx * (p.x - mx) + lz * (p.z - mz),
      );
    }

    // Collinear: the lever rule along the principal line; coincident: equal.
    if (!(trace > 0)) return points.map((): number => 1 / n);
    const angle: number = Math.atan2(2 * sxz, sxx - szz) / 2;
    const ux: number = Math.cos(angle);
    const uz: number = Math.sin(angle);
    const along = (x: number, z: number): number => x * ux + z * uz;
    let sss: number = 0;
    for (const p of points) sss += along(p.x - mx, p.z - mz) ** 2;
    const ls: number = along(cx, cz) / sss;
    return points.map(
      (p: IAutoMovieVector3): number => 1 / n + ls * along(p.x - mx, p.z - mz),
    );
  };
}
