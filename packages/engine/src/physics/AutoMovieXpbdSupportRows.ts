import type { IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMovieXpbdArticulation } from "./AutoMovieXpbdArticulation";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import type { solveXpbdArticulationContacts as Contacts } from "./solveXpbdArticulationContacts";
import { solveXpbdContacts } from "./solveXpbdContacts";

/**
 * The support rows of one articulation: which contacts take part, the rows
 * each patch gives, and how a row reads and moves the tree.
 *
 * A patch takes part when one side is a body of the tree and the other is
 * not dynamic (the floor, a kinematic prop), with its points the step
 * pressed (`normalLambda > 0`) and those touching inside the allowed depth,
 * which a sequential-impulse solver's velocity rows also cover (Catto 2006,
 * "Fast and Simple Physics using Sequential Impulses"). Each such point
 * gives a normal row along its push direction; each patch gives two
 * tangential rows at its points' centroid (patch friction).
 */
export namespace AutoMovieXpbdSupportRows {
  /**
   * The tree's pressed and touching supports on non-dynamic bodies, as rows.
   *
   * @param tree The tree.
   * @param contacts The step's contacts.
   * @param h The substep, seconds.
   * @returns The rows and patches, normals then tangents per patch.
   */
  export function collect(
    tree: AutoMovieXpbdArticulation.ITree,
    contacts: readonly solveXpbdContacts.IContact[],
    h: number,
  ): Contacts.ISet {
    const index: Map<AutoMovieXpbdBody, number> = new Map();
    tree.states.forEach(
      (state: AutoMovieXpbdArticulation.IState, i: number): void => {
        if (state.body.dynamic) index.set(state.body, i);
      },
    );
    const set: Contacts.ISet = { rows: [], patches: [] };
    for (const patch of solveXpbdContacts.manifolds(contacts)) {
      const head: solveXpbdContacts.IContact = patch[0]!;
      const first: number | undefined = index.get(head.a.body);
      const second: number | undefined = index.get(head.b.body);
      const onFirst: boolean = first !== undefined && !head.b.body.dynamic;
      const onSecond: boolean = second !== undefined && !head.a.body.dynamic;
      if (!onFirst && !onSecond) continue;
      const pressed: solveXpbdContacts.IContact[] = patch.filter(
        (contact: solveXpbdContacts.IContact): boolean =>
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
        (contact: solveXpbdContacts.IContact): IAutoMovieVector3 =>
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
          (sum: IAutoMovieVector3, point: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.add(sum, point),
          { x: 0, y: 0, z: 0 },
        ),
        1 / points.length,
      );
      const entry: Contacts.IPatch = {
        friction: head.friction,
        normal: pressed.reduce(
          (sum: number, contact: solveXpbdContacts.IContact): number =>
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
        (contact: solveXpbdContacts.IContact, i: number): void => {
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
      set.patches.push(entry);
    }
    return set;
  }

  /**
   * A row's unit spatial impulse on its body: a force along the direction
   * at the point.
   *
   * @param row The row.
   * @returns The spatial impulse, moment then force, about the tree origin.
   */
  export function impulse(row: Contacts.IRow): number[] {
    return AutoMovieXpbdArticulation.spatialImpulse(row.point, row.direction);
  }

  /**
   * A row's velocity change under a response, along its direction: the
   * point's linear change.
   *
   * @param row The row.
   * @param response The response.
   * @returns Metres per second.
   */
  export function along(
    row: Contacts.IRow,
    response: AutoMovieXpbdArticulation.IResponse,
  ): number {
    const change: number[] = response.change[row.state]!;
    return Vector3.dot(
          row.direction,
          AutoMovieXpbdArticulation.pointChange(change, row.point),
        );
  }

  /** Two unit tangents completing a unit normal to a right-handed basis. */
  function tangents(n: IAutoMovieVector3): IAutoMovieVector3[] {
    const seed: IAutoMovieVector3 =
      Math.abs(n.x) < Math.SQRT1_2 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    const t1: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(n, seed));
    return [t1, Vector3.cross(n, t1)];
  }
}
