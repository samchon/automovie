import type { IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMovieXpbdArticulation } from "./AutoMovieXpbdArticulation";
import { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { AutoMovieEnginePhysics } from "./AutoMovieEnginePhysics";
import { solveXpbdSupportCascade as Cascade } from "./internal/solveXpbdSupportCascade";
import { solveXpbdSupportComplementarity as Complementarity } from "./internal/solveXpbdSupportComplementarity";
import { solveXpbdSupportLevels as Levels } from "./internal/solveXpbdSupportLevels";

/**
 * The support rows of one articulation: which contacts take part, the rows each
 * patch gives, and how a row reads and moves the tree.
 *
 * A patch takes part when one side is a body of the tree and the other is not
 * dynamic (the floor, a kinematic prop), with its points the step pressed
 * (`normalLambda > 0`) and those touching inside the allowed depth, which a
 * sequential-impulse solver's velocity rows also cover (Catto 2006, "Fast and
 * Simple Physics using Sequential Impulses"). Each such point gives a normal
 * row along its push direction; each patch gives two tangential rows at its
 * points' centroid (patch friction) and, when asked, a torsional row, a unit
 * moment about its normal. A sole's friction resists its turning about the
 * normal through the lever of each pressed point, as TSID's six-dimensional
 * contact models a sole by its four corner points, each in its own friction
 * cone, and sums their moments into the contact wrench (`contact-6d.cpp`,
 * `updateForceGeneratorMatrix` and `updateForceInequalityConstraints`); the
 * torsional row carries that moment, bounded by the points' levers and never
 * held, as the patch's turning is the contact passes'
 * (`solveXpbdSupportCascade`).
 */
export namespace AutoMovieXpbdSupportRows {
  /**
   * The tree's pressed and touching supports on non-dynamic bodies, as rows.
   *
   * @param tree The tree.
   * @param contacts The step's contacts.
   * @param h The substep, seconds.
   * @param torsion Whether each patch also gives its torsional row.
   * @returns The rows and patches, normals then tangents then the torsional row
   *   per patch.
  */
  export function collect(
    tree: AutoMovieXpbdArticulation.ITree,
    contacts: readonly AutoMovieXpbdWorld.IContact[],
    h: number,
    torsion: boolean = false,
  ): AutoMovieXpbdArticulation.ISet {
    const index: Map<AutoMovieXpbdBody, number> = new Map();
    tree.states.forEach(
      (state: AutoMovieXpbdArticulation.IState, i: number): void => {
        if (state.body.dynamic) index.set(state.body, i);
      },
    );
    const set: AutoMovieXpbdArticulation.ISet = { rows: [], patches: [] };
    for (const patch of AutoMovieXpbdWorld.manifolds(contacts)) {
      const head: AutoMovieXpbdWorld.IContact = patch[0]!;
      const first: number | undefined = index.get(head.a.body);
      const second: number | undefined = index.get(head.b.body);
      const onFirst: boolean = first !== undefined && !head.b.body.dynamic;
      const onSecond: boolean = second !== undefined && !head.a.body.dynamic;
      if (!onFirst && !onSecond) continue;
      const pressed: AutoMovieXpbdWorld.IContact[] = patch.filter(
        (contact: AutoMovieXpbdWorld.IContact): boolean =>
          contact.normalLambda > 0 || contact.separation <= 0,
      );
      if (pressed.length === 0) continue;
      const state: number = onFirst ? first! : second!;
      const body: AutoMovieXpbdBody = tree.states[state]!.body;
      const other: AutoMovieXpbdBody = onFirst ? head.b.body : head.a.body;
      // The normal points from the first collider toward the second.
      const push: IAutoMovieVector3 = Vector3.scale(
        head.normal,
        onFirst ? -1 : 1,
      );
      // The contact passes' friction on the first body: the positional
      // multiplier over the substep and the velocity passes' impulse.
      const prior: IAutoMovieVector3 = Vector3.scale(
        Vector3.add(
          Vector3.scale(head.tangentLambda, 1 / h),
          head.frictionImpulse,
        ),
        onFirst ? 1 : -1,
      );
      // The tree body's present velocity at a point, relative to the other
      // side's, along a direction: what a hold must bring to rest.
      const relative = (
        point: IAutoMovieVector3,
        direction: IAutoMovieVector3,
      ): number => {
        const at: IAutoMovieVector3 = Vector3.add(point, tree.origin);
        return Vector3.dot(
          direction,
          Vector3.subtract(body.velocityAtPoint(at), other.velocityAtPoint(at)),
        );
      };
      const basis: IAutoMovieVector3[] = tangents(push);
      const points: IAutoMovieVector3[] = pressed.map(
        (contact: AutoMovieXpbdWorld.IContact): IAutoMovieVector3 =>
          Vector3.subtract(
            Vector3.add(
              body.center,
              Quaternion.rotateVector(
                body.orientation,
                onFirst ? contact.localA : contact.localB,
              ),
            ),
            tree.origin,
          ),
      );
      const centroid: IAutoMovieVector3 = Vector3.scale(
        points.reduce(
          (
            sum: IAutoMovieVector3,
            point: IAutoMovieVector3,
          ): IAutoMovieVector3 => Vector3.add(sum, point),
          { x: 0, y: 0, z: 0 },
        ),
        1 / points.length,
      );
      const entry: AutoMovieXpbdArticulation.IPatch = {
        friction: head.friction,
        normal: pressed.reduce(
          (sum: number, contact: AutoMovieXpbdWorld.IContact): number =>
            sum + contact.normalLambda / h + contact.velocityImpulse,
          0,
        ),
        prior: {
          first: Vector3.dot(prior, basis[0]!),
          second: Vector3.dot(prior, basis[1]!),
        },
        normals: [],
        tangents: [],
      };
      pressed.forEach(
        (contact: AutoMovieXpbdWorld.IContact, i: number): void => {
          const point: IAutoMovieVector3 = points[i]!;
          entry.normals.push(set.rows.length);
          set.rows.push({
            state,
            point,
            direction: push,
            lower: -(contact.normalLambda / h + contact.velocityImpulse),
            velocity: relative(point, push),
            contact,
          });
        },
      );
      for (const tangent of basis) {
        entry.tangents.push(set.rows.length);
        set.rows.push({
          state,
          point: centroid,
          direction: tangent,
          velocity: relative(centroid, tangent),
          contact: head,
        });
      }
      // Only a patch whose cone is open has torsional friction to give: its
      // moment comes from the levers between its pressed points (TSID
      // `contact-6d.cpp`, `updateForceGeneratorMatrix`, each point's
      // `skew(p_i)`), so the capacity mu sum_i (|r_i . t1| + |r_i . t2|) N_i
      // of the contact passes' normal impulses must be positive. A patch
      // pressed at one point, or loaded only where it has no lever, has a
      // cone that is the single point zero, its two bounds and its normals'
      // lower bounds all active and linearly dependent, which the dual
      // active-set method cannot take; TSID's contact keeps a least normal
      // force for the same reason (`updateForceInequalityConstraints`,
      // `m_fMin`).
      if (
        torsion &&
        head.friction *
          capacity(
            points.map(
              (point: IAutoMovieVector3): IAutoMovieVector3 =>
                Vector3.subtract(point, centroid),
            ),
            basis,
            pressed.map(
              (contact: AutoMovieXpbdWorld.IContact): number =>
                contact.normalLambda / h + contact.velocityImpulse,
            ),
          ) >
          0
      ) {
        entry.torsion = set.rows.length;
        set.rows.push({
          state,
          point: centroid,
          direction: push,
          moment: true,
          velocity: Vector3.dot(
            push,
            Vector3.subtract(body.angvel(), other.angvel()),
          ),
          contact: head,
        });
      }
      set.patches.push(entry);
    }
    return set;
  }

  /**
   * A row's unit spatial impulse on its body: a force along the direction at
   * the point, or a torsional row's moment about the direction.
   *
   * @param row The row.
   * @returns The spatial impulse, moment then force, about the tree origin.
  */
  export function impulse(
    row: Pick<AutoMovieXpbdArticulation.IRow, "moment" | "direction" | "point">,
  ): number[] {
    return row.moment === true
      ? [row.direction.x, row.direction.y, row.direction.z, 0, 0, 0]
      : AutoMovieXpbdArticulation.spatialImpulse(row.point, row.direction);
  }

  /**
   * A row's velocity change under a response, along its direction: the point's
   * linear change, or a torsional row's angular change about the direction.
   *
   * @param row The row.
   * @param response The response.
   * @returns Metres per second, or radians per second for a torsional row.
  */
  export function along(
    row: Pick<AutoMovieXpbdArticulation.IRow, "state" | "moment" | "direction" | "point">,
    response: AutoMovieXpbdArticulation.IResponse,
  ): number {
    const change: number[] = response.change[row.state]!;
    if (row.moment === true)
      return (
        row.direction.x * change[0]! +
        row.direction.y * change[1]! +
        row.direction.z * change[2]!
      );
    return Vector3.dot(
      row.direction,
      AutoMovieXpbdArticulation.pointChange(change, row.point),
    );
  }

  /**
   * A patch's torsional capacity per unit friction coefficient: each pressed
   * point's normal impulse on its pyramid lever from the centroid, sum_i (|r_i
   * . t1| + |r_i . t2|) N_i, the most moment about the normal its points'
   * linearized cones give (TSID `contact-6d.cpp`); zero for a patch pressed at
   * one point or loaded only where it has no lever.
   *
   * @param levers Each pressed point's offset from the centroid, metres.
   * @param tangents The patch's two unit tangents.
   * @param normals Each point's normal impulse, newton seconds; a negative one
   *   counts as none.
   * @returns The capacity, newton metre seconds.
  */
  export function capacity(
    levers: readonly IAutoMovieVector3[],
    tangents: readonly IAutoMovieVector3[],
    normals: readonly number[],
  ): number {
    return levers.reduce(
      (sum: number, lever: IAutoMovieVector3, i: number): number =>
        sum +
        (Math.abs(Vector3.dot(lever, tangents[0]!)) +
          Math.abs(Vector3.dot(lever, tangents[1]!))) *
          Math.max(0, normals[i] ?? 0),
      0,
    );
  }

  /** What the cascade reads of one support row. */
  export type IRow = Cascade.IRow;

  /** What the cascade reads of the support set. */
  export type ISet = Cascade.ISet;

  /** One tree's support-cascade program. */
  export type IInput = Cascade.IInput;

  /** One motion row in a support-cascade objective. */
  export type IMotion = Cascade.IMotion;

  /** A group's maximum added normal impulse. */
  export type IBound = Cascade.IBound;

  /** The active sets retained between support substeps. */
  export type IWarm = Cascade.IWarm;
  /**
   * The strict cascade of hierarchical inverse dynamics (Herzog, Rotella, Mason,
   * Grimminger, Schaal and Righetti 2016, eq. 5) over one tree's support rows and
   * actuated axes, each level one quadratic program over the same feasible set:
   * the support rows bring their contacts to rest, the row's velocity after the
   * step zero as in sticking contact (Mirtich 1996), through the independent
   * ones, a normal row's impulse stays at or above its Signorini bound, each
   * patch's whole friction, the contact passes' plus the rows', stays inside the
   * inscribed pyramid `|t1| + |t2| <= mu (N + sum lambda_n)` the wrench
   * allocation uses, a patch's torsional moment within its points' friction on
   * their levers, every joint impulse within its motor's cap on its own direction
   * (Herzog et al. 2016, Section 2.1), and each bounded group's summed normal
   * impulse within its bound, the ramp a leaving contact's force follows to zero
   * (Section 5.3).
   *
   * - Level one minimizes the task's residual `e = G x - g`, regularized by
   *   `sqrt(eps)` as the allocation is, each row by its weight when the task is
   *   IHMC's weighted objective: develop
   *   `InverseDynamicsOptimizationControlModule` adds the centre-of-pressure
   *   inputs (l.422-424) and the momentum rate command (l.620-625) to one program
   *   as weighted objectives.
   * - Level two fixes that residual at its optimum and minimizes the motion rows'
   *   residual `m = W x - w`: the posture's joint rates and the root's spin after
   *   the step against what their servos ask, a task in motion, as whole-body
   *   controllers rank posture (Herzog et al. 2016; TSID's `TaskJointPosture`),
   *   the joint impulses left free within their caps so the torques the support
   *   needs come out of the solve. A torque-space posture, the motors' own
   *   impulses as targets, lets every wrench change bend the stance unopposed.
   * - When level one has no feasible point, the holds that cannot be met within the
   *   caps and cones are kept as nearly as they can: a level zero minimizes their
   *   velocity residual, fixed below the wrench and the motion, so every level
   *   stays feasible (hierarchical least squares; Escande, Mansard and Wieber
   *   2014) and the support never falls back to a solve without its task.
   *
   * Every objective is diagonal and positive, a fixed residual's weight changing
   * nothing. Each level is solved by the dual active-set method (Goldfarb and
   * Idnani 1983, `solveXpbdDualActiveSet`), warm-started from the active set the
   * same level ended with on the previous substep, as whole-body controllers
   * solve their per-cycle programs; the engine's interior-point solver is the
   * cold fallback when the active-set solve reports no solution.
   *
   * @param input The rows, the task, the actuators, the motion rows, the bounds
   *   and the warm start.
   * @returns The rows' and joint impulses, or null when even the relaxed holds
   *   leave no feasible point.
  */
  export function cascade(input: IInput): number[] | null {
    return Cascade.run(input);
  }

  /**
   * One level: the warm active-set solve, else the interior-point solve; the warm
   * keys become the level's active set, or none after the fallback.
  */
  export function level(
    diagonal: number[],
    linear: number[],
    equalities: AutoMovieEnginePhysics.ISolveXpbdDualActiveSetRow[],
    inequalities: AutoMovieEnginePhysics.ISolveXpbdDualActiveSetRow[],
    keys: readonly string[],
    warm: string[],
  ): number[] | null {
    return Levels.level(diagonal, linear, equalities, inequalities, keys, warm);
  }

  /**
   * The rows whose holds are independent. A row reads its body's velocity change
   * through its own unit impulse, `(r x d, d)`, so the rows of one patch on one
   * rigid body are dependent exactly when those functionals are: four coplanar
   * points span three. Gram-Schmidt over each patch's functionals, normals first,
   * keeps a row whose functional leaves more than `sqrt(eps)` of itself outside
   * the ones kept; the others hold with them, and leaving them out keeps the
   * program's equality rows of full rank.
  */
  export function independent(set: ISet): Set<number> {
    return Levels.independent(set);
  }

  /** The dot product of two equal-length arrays. */
  export function product(a: readonly number[], b: readonly number[]): number {
    return Levels.product(a, b);
  }

  /** One tree's coupled normal and tangential rows for complementarity. */
  export type IComplementarityInput = Complementarity.IInput;

  /**
   * The support rows of a tree without a root task, solved as a complementarity
   * problem by active set (Mirtich 1996, "Impulse-based Dynamic Simulation of
   * Rigid Body Systems", chapter 6), every condition inside the one linear system
   * of each round:
   *
   * - A free row holds its velocity: `(K lambda + u)_r = 0`;
   * - A normal row below its bound is held at it, `lambda_r = lower_r`, and
   *   released again when, held, its point would approach (`(K lambda + u)_r <
   *   0`), the Signorini complementarity;
   * - A patch whose total friction, the contact passes' `F` plus the rows'
   *   `lambda_t`, leaves its cone `mu (N + sum lambda_n)` slides along the
   *   direction `d` the total left in: `F + lambda_t = d mu (N + sum lambda_n)`,
   *   linear in the patch's normal impulses (Coulomb's law, sliding branch, on
   *   the substep's whole friction).
   *
   * A round that changes no row's state is the answer. Every change holds or
   * releases one normal or starts one patch sliding, so the rounds are bounded by
   * twice the rows; the last round's solution stands if the bound is reached.
   *
   * @param input The rows' coupling matrix, the motors' velocity change at them
   *   and the rows.
   * @returns The rows' impulses, or null when a round's system is singular.
  */
  export function complementarity(
    input: IComplementarityInput,
  ): number[] | null {
    return Complementarity.run(input);
  }

  /** Two unit tangents completing a unit normal to a right-handed basis. */
  function tangents(n: IAutoMovieVector3): IAutoMovieVector3[] {
    const seed: IAutoMovieVector3 =
      Math.abs(n.x) < Math.SQRT1_2
        ? { x: 1, y: 0, z: 0 }
        : { x: 0, y: 1, z: 0 };
    const t1: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(n, seed));
    return [t1, Vector3.cross(n, t1)];
  }
}
