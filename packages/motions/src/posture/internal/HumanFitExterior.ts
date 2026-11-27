import { type AutoMovieEnginePhysicsGjkTypes, Vector3, AutoMovieEnginePhysics } from "@automovie/engine";

import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapePairContact,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { HumanBodyFitMerit } from "./HumanBodyFitMerit";
import type { HumanBodyFitRows } from "./HumanBodyFitRows";
import { HumanJacobian } from "./HumanJacobian";

/** The midpoint of the accepted nonpenetrating contact interval, metres. */
const HELD_GOAL: number = HumanBodyFitMerit.REQUIRED_TOLERANCE / 2;

/**
 * Signed separation between actual posed body and fixed exterior colliders.
 * Drake's `MinimumDistanceLowerBoundConstraint` restricts signed gaps to
 * influencing collision candidates. This fit uses the same influence rule
 * with its existing elastic L1 rows and shares one narrow-phase witness
 * between the merit, linearization and final feasibility. A named held
 * contact also reads far pairs and constrains the smallest actual gap.
 *
 * @see https://drake.mit.edu/doxygen_cxx/classdrake_1_1multibody_1_1_minimum_distance_lower_bound_constraint.html
 */
export namespace HumanFitExterior {
  /** A measured pair at the fit's current pose. */
  export interface IPair {
    /** The name of this shape-pair row, stable across the fit's iterations. */
    key: string;

    /** The moving bone that carries the body's collider. */
    bone: AutoMovieHumanoidBone;

    /** The obstacle's owning scene subject. */
    subject: string;

    /** The obstacle's material part. */
    part: string;

    /** Actual signed gap and the two world surface witnesses, in metres. */
    contact: IAutoMoviePhysicalShapePairContact;

    /** This pair is the minimum of one named held contact group. */
    held?: true;

    /** The target interior clearance of this ordinary pair, in metres. */
    clearance?: number;
  }

  /** An interior search target for selected nonbearing bones. */
  export interface IClearance {
    /** The bones whose ordinary exterior pairs aim inside nonpenetration. */
    bones: ReadonlySet<AutoMovieHumanoidBone>;

    /** The solver precision, metres. */
    distance: number;
  }

  /** Reads influencing signed gaps from the current body frames. */
  export type Reader = (
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ) => IPair[];

  /**
   * Bind the scene geometry once and query candidate pairs at each pose.
   *
   * @param obstacles The fixed world scene shapes, unchanged during the fit.
   * @param influence Positive distance above which a pair has no row, metres.
   * @param contacts Named groups whose closest pair must remain at contact.
   * @param clearance An interior search target for selected ordinary pairs.
   * @returns A reader of current influencing pairs from the selected bones.
   */
  export function prepare(
    obstacles: readonly IAutoMovieMotionHumanColliders.IExternal[],
    influence: number,
    contacts?: readonly IAutoMovieMotionHumanBodyFitTypes.IExteriorContact[],
    clearance?: IClearance,
  ): Reader {
    const scene: IObstacle[] = [];
    for (const segment of obstacles) {
      const pose: IAutoMovieRigidTransform = {
        position: { ...segment.pose.position },
        rotation: { ...segment.pose.rotation },
      };
      for (const shape of segment.shapes)
        scene.push({
          index: scene.length,
          subject: segment.subject,
          part: segment.part,
          pose,
          shape,
          bounds: AutoMovieEnginePhysics.physicalShapeBounds(pose, shape),
          solid: AutoMovieEnginePhysics.physicalShapeGjkSolid(pose, shape),
        });
    }
    scene.sort(
      (a: IObstacle, b: IObstacle): number => a.bounds.min.x - b.bounds.min.x,
    );
    const held: IHeld | undefined =
      contacts === undefined || contacts.length === 0
        ? undefined
        : bindContacts(scene, contacts);

    return (
      placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    ): IPair[] => {
      const result: IPair[] = [];
      const nearest: (IPair | undefined)[] | undefined =
        held === undefined ? undefined : new Array(held.groups.length);
      for (const [s, segment] of placed.entries()) {
        const selected: Map<number, IHeldMember> | undefined = held?.bones.get(
          segment.bone,
        );
        const margin: number | undefined =
          clearance?.bones.has(segment.bone) === true
            ? clearance.distance
            : undefined;
        for (const [i, shape] of segment.shapes.entries()) {
          if (selected !== undefined)
            for (const { groups, obstacle } of selected.values()) {
              const pair: IPair = measurePair(segment, shape, s, i, obstacle);
              for (const group of groups) {
                const previous: IPair | undefined = nearest![group];
                if (
                  previous === undefined ||
                  pair.contact.distance < previous.contact.distance
                )
                  nearest![group] = pair;
              }
              if (!(pair.contact.distance >= influence)) result.push(pair);
            }
          const bounds: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeBounds> =
            AutoMovieEnginePhysics.physicalShapeBounds(segment.pose, shape);
          let solid: AutoMovieEnginePhysicsGjkTypes.ISolid | undefined;
          for (const obstacle of scene) {
            const { min, max }: IObstacle["bounds"] = obstacle.bounds;
            if (min.x - bounds.max.x >= influence) break;
            if (
              selected?.has(obstacle.index) === true ||
              bounds.min.x - max.x >= influence ||
              min.y - bounds.max.y >= influence ||
              bounds.min.y - max.y >= influence ||
              min.z - bounds.max.z >= influence ||
              bounds.min.z - max.z >= influence
            )
              continue;

            // A positive GJK query target lets zero-radius cores find a
            // separator. An uncertified bound reaches the signed query.
            solid ??= AutoMovieEnginePhysics.physicalShapeGjkSolid(segment.pose, shape);
            if (
              AutoMovieEnginePhysics.physicalShapeGjk(solid, obstacle.solid, influence).lower >=
              influence
            )
              continue;
            const pair: IPair = measurePair(
              segment,
              shape,
              s,
              i,
              obstacle,
              margin,
            );
            if (pair.contact.distance >= influence) continue;
            result.push(pair);
          }
        }
      }
      if (held !== undefined)
        for (const [group, requested] of held.groups.entries()) {
          const pair: IPair | undefined = nearest![group];
          if (pair === undefined)
            throw new Error(
              `Exterior contact bone ${[...requested.bones].join(", ")} has no posed collider`,
            );
          if (pair.held === true) continue;
          pair.held = true;
          if (pair.contact.distance >= influence) result.push(pair);
        }
      return result;
    };
  }

  /** The physical miss of the same target used by the pair's model row. */
  export function miss(pair: IPair): number {
    const delta: number = goal(pair) - pair.contact.distance;
    return pair.held === true ? Math.abs(delta) : Math.max(0, delta);
  }

  /**
   * Keep an ordinary pair clear or aim at the midpoint of a selected contact's
   * numerical interval. The moving witness contributes minus its velocity
   * along the measured normal from body to the fixed obstacle.
   *
   * @param step The current geometric Jacobian and the step's units.
   * @param pair The actual gap and witnesses already read at this iterate.
   * @param mm Millimetres per metre, the quadratic program's row unit.
   * @returns The linearized signed gap row in millimetres.
   */
  export function row(
    step: Pick<HumanBodyFitRows.IStep, ExteriorStep>,
    pair: IPair,
    mm: number,
  ): IAutoMovieMotionHumanQuadraticProgram.IRow {
    const { distance, normal, pointA }: IAutoMoviePhysicalShapePairContact =
      pair.contact;
    const target: number = goal(pair);
    const lower: number =
      (target === 0 ? -distance : target - distance) * mm;
    return {
      key: pair.key,
      index: step.index,
      coef: step.motions.map(
        (motion: IAutoMovieMotionHumanJacobian.IMotion, i: number): number =>
          -Vector3.dot(HumanJacobian.velocity(motion, pair.bone, pointA), normal) *
          step.units[i]! *
          mm,
      ),
      l: lower,
      u: pair.held === true ? lower : Infinity,
      weight: step.price,
    };
  }
}

/** The local model and merit share this same signed separation target. */
function goal(pair: HumanFitExterior.IPair): number {
  return pair.held === true ? HELD_GOAL : (pair.clearance ?? 0);
}

/** Resolve each named part to its actual shapes independently of AABB order. */
function bindContacts(
  scene: readonly IObstacle[],
  contacts: readonly IAutoMovieMotionHumanBodyFitTypes.IExteriorContact[],
): IHeld {
  const groups: IHeld["groups"] = [];
  const bones: IHeld["bones"] = new Map();
  for (const declared of contacts) {
    const names: Set<AutoMovieHumanoidBone> = new Set(
      typeof declared.bone === "string" ? [declared.bone] : declared.bone,
    );
    if (
      groups.some(
        (other: IHeldGroup): boolean =>
          other.subject === declared.subject &&
          other.part === declared.part &&
          other.bones.size === names.size &&
          [...names].every((bone) => other.bones.has(bone)),
      )
    )
      continue;
    const matching: IObstacle[] = scene.filter(
      (obstacle: IObstacle): boolean =>
        obstacle.subject === declared.subject && obstacle.part === declared.part,
    );
    if (matching.length === 0)
      throw new Error(
        `Exterior contact part ${declared.subject}.${declared.part} has no collider`,
      );
    const group: number = groups.length;
    groups.push({ subject: declared.subject, part: declared.part, bones: names });
    for (const bone of names) {
      let selected: Map<number, IHeldMember> | undefined = bones.get(bone);
      if (selected === undefined) {
        selected = new Map();
        bones.set(bone, selected);
      }
      for (const obstacle of matching) {
        const member: IHeldMember | undefined = selected.get(obstacle.index);
        if (member === undefined)
          selected.set(obstacle.index, { groups: [group], obstacle });
        else member.groups.push(group);
      }
    }
  }
  return { groups, bones };
}

/** Read one exact signed witness for both ordinary and designated pairs. */
function measurePair(
  segment: IAutoMovieMotionHumanColliders.IPlaced,
  shape: IAutoMoviePhysicalShape,
  s: number,
  i: number,
  obstacle: IObstacle,
  clearance?: number,
): HumanFitExterior.IPair {
  return {
    key: `exterior:${s}:${i}:${obstacle.index}`,
    bone: segment.bone,
    subject: obstacle.subject,
    part: obstacle.part,
    ...(clearance === undefined ? {} : { clearance }),
    contact: AutoMovieEnginePhysics.shapePairContact(
      segment.pose,
      shape,
      obstacle.pose,
      obstacle.shape,
    ),
  };
}

/** A fixed scene shape and the geometry shared by the fit's trial poses. */
interface IObstacle {
  /** Stable ordinal of the shape in the supplied scene. */
  index: number;

  /** The owning subject in the scene. */
  subject: string;

  /** The material part of that subject. */
  part: string;

  /** The world frame and its shape. */
  pose: IAutoMovieRigidTransform;

  /** The actual physical shape in that frame. */
  shape: IAutoMoviePhysicalShape;

  /** World axis bounds for conservative influence filtering. */
  bounds: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeBounds>;

  /** The fixed world core and radius used for GJK. */
  solid: AutoMovieEnginePhysicsGjkTypes.ISolid;
}

/** The parts of a fit step that write a row from a measured gap. */
type ExteriorStep = "motions" | "units" | "index" | "price";

/** A designated collider and the groups whose minima it can supply. */
interface IHeldMember {
  groups: number[];
  obstacle: IObstacle;
}

/** One prepared group, irrespective of the order the caller named its bones. */
type IHeldGroup = Pick<
  IAutoMovieMotionHumanBodyFitTypes.IExteriorContact,
  "subject" | "part"
> & {
  /** Each of the distinct bones allowed to carry the contact. */
  bones: ReadonlySet<AutoMovieHumanoidBone>;
};

/** Contact declarations indexed by the moving bone and material shape. */
interface IHeld {
  groups: IHeldGroup[];
  bones: Map<AutoMovieHumanoidBone, Map<number, IHeldMember>>;
}
