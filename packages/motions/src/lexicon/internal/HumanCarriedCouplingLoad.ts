import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieMotionCoupling, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanCarriedCouplingLoad, IAutoMovieMotionHumanLoad, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanLoad } from "../../perform/internal/HumanLoad";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";

/**
 * The weight a coupled carry puts on its bearers: the bearing contacts' shares
 * of the borne weight, each bearer's load for a layer's lean
 * (`HumanLoad.lean`), the tip that balances a bearer the borne body rides, and
 * the capacity a bearer's moment balance bounds. `HumanCarriedCoupling` states
 * the coupling these read.
 */
export namespace HumanCarriedCouplingLoad {
  /**
   * The bearer's load for its lean (`HumanCarriedLean.layer`,
   * `HumanLoad.lean`): its own mass and centre height, and the borne mass with
   * its distance ahead of the bearer's centre along the facing.
   *
   * @param bearer The bearer's body.
   * @param coupling The coupling.
   * @param role The bearer's role; the coupling's first bearer when absent.
   * @param bones The actual key bones already resolved for this bearer and
   *   coupling, when available.
   * @returns The load: the share of the borne mass this bearer's contacts
   *   carry.
   */
  export function load(
    bearer: IAutoMovieMotionHumanBody,
    coupling: IAutoMovieMotionCoupling,
    role: string = coupling.bearer,
    bones?: Bones,
  ): IAutoMovieMotionHumanLoad.ILeanProps {
    const at: IStanding = standing(bearer, coupling, role, bones);
    return {
      mass: at.mass,
      height: at.own.y,
      load: at.load,
      ahead: at.borne.z - at.own.z,
    };
  }

  /**
   * The tip of a bearer standing still in the coupling's stance that brings its
   * own centre and its share of the borne load over the midpoint of its feet.
   *
   * @param bearer The bearer's body.
   * @param coupling The coupling.
   * @param role The bearer's role; the coupling's first bearer when absent.
   * @returns Degrees forward (`pitch`) and toward the bearer's right (`roll`),
   *   as `HumanCarriedLean.tipped` takes them.
   */
  export function lean(
    bearer: IAutoMovieMotionHumanBody,
    coupling: IAutoMovieMotionCoupling,
    role: string = coupling.bearer,
  ): IAutoMovieMotionHumanCarriedCouplingLoad.ILeanResult {
    // For one bearer the borne mass centre sets the gravitational moment
    // of the pair about the floor. Shared loads act at their support contacts.
    const sole: boolean =
      coupling.contacts.some(
        (contact: IAutoMovieMotionCoupling.IContact): boolean =>
          contact.load > 0,
      ) &&
      coupling.contacts.every(
        (contact: IAutoMovieMotionCoupling.IContact): boolean =>
          contact.load === 0 || contact.on.role === role,
      );
    const at: IStanding = standing(
      bearer,
      coupling,
      role,
      undefined,
      sole ? coupling.centre : undefined,
    );
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
      pitch: (-Math.atan2(pair.z, Math.hypot(pair.x, pair.y)) * 180) / Math.PI,
      roll: (Math.atan2(pair.x, pair.y) * 180) / Math.PI,
    };
  }

  /**
   * The bearer standing still with its share of the coupled load, read once for
   * the lean and the capacity.
   */
  const standing = (
    bearer: IAutoMovieMotionHumanBody,
    coupling: IAutoMovieMotionCoupling,
    role: string,
    key?: Bones,
    massCentre?: IAutoMovieVector3,
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
      massCentre ??
      (share > 0 &&
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
        : coupling.centre);
    const frame:
      | NonNullable<IAutoMovieMotionCoupling["bearers"]>[string]
      | undefined =
      role === coupling.bearer ? undefined : coupling.bearers?.[role];
    const centre: IAutoMovieVector3 =
      frame === undefined
        ? pressed
        : Quaternion.rotateVector(
            Quaternion.inverse(frame.rotation),
            Vector3.subtract(pressed, frame.position),
          );
    const model: IAutoMovieResolveCenterOfMass.IModel = bearer.massModel;

    // The first bearer stands in the stance the key pose was placed on; a
    // further one stands upright. Both are read on the same fitted stance
    // `HumanCarriedCoupling.couple` stated the coupling's frames on, so the
    // anchor, the centre and the feet are one posture's.
    const bones: Bones =
      key ??
      HumanCarriedCouplingPose.stood(
        bearer,
        frame === undefined ? coupling.key.stance : { incline: 0, depth: 0 },
      );
    const anchor: IAutoMovieResolvedBone = bones.get(
      frame?.anchor ?? coupling.anchor,
    )!;
    return {
      mass: model.mass,
      own: AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(model, bones),
      load: coupling.mass * share,
      borne: Vector3.add(
        anchor.worldPosition,
        Quaternion.rotateVector(anchor.worldRotation, centre),
      ),
      get pivot(): IAutoMovieVector3 {
        return Vector3.scale(
          Vector3.add(
            bones.get("leftFoot")!.worldPosition,
            bones.get("rightFoot")!.worldPosition,
          ),
          0.5,
        );
      },
    };
  };

  /**
   * Refuse a coupling whose borne mass no lean of the bearer balances.
   *
   * @param bearer The bearer's body.
   * @param coupling The coupling.
   * @param role The bearer's role; the coupling's first bearer when absent.
   * @param bones The actual fitted key bones for this bearer and coupling, when
   *   available.
   * @throws {HumanRefusal} A `participant` refusal on `mass` with the feasible
   *   mass.
   */
  export function bearable(
    bearer: IAutoMovieMotionHumanBody,
    coupling: IAutoMovieMotionCoupling,
    role: string = coupling.bearer,
    bones?: Bones,
  ): void {
    const props: IAutoMovieMotionHumanLoad.ILeanProps = load(
      bearer,
      coupling,
      role,
      bones,
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
   * shares that sum to one with their weighted centre under the centre, `w =
   * A^T (A A^T)^+ b` for the rows (1, x, z) in plan. Collinear supports share
   * by the lever rule along their line, coincident ones equally. A support the
   * solution would have pull is dropped and the rest solved again, so every
   * share is a push.
   *
   * @param points The bearing points, world metres.
   * @param centre The borne centre of mass, world metres.
   * @returns One share per point, none negative, summing to one; none for no
   *   point.
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

  /**
   * The least-norm shares of points, summing to one, whose weighted centre lies
   * under a centre in plan (`shares` states the method); one point bears all.
   */
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

  /**
   * A bearer at the origin facing +Z in the coupling's stance, upright for a
   * further bearer: its mass and centre, its share of the borne mass with the
   * point its contacts press it at (the share-weighted contact points, the
   * borne centre for a coupling without them), and its feet's midpoint.
   */
  interface IStanding {
    mass: number;
    own: IAutoMovieVector3;
    load: number;
    borne: IAutoMovieVector3;
    pivot: IAutoMovieVector3;
  }
}

/** The attachment and mass-placement frames from the actual bearer key. */
type Bones = ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
