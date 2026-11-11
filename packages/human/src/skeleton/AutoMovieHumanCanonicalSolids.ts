import {
  Vector3,
  physicalHullFaces,
  physicalHullMass,
  physicalHullNearest,
  resolveAutoMovieHumanoidRingModules,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The convex solids of a polygon man at the canonical T-pose rest: the
 * convex hulls of the ring points its drawing is lofted through.
 *
 * The rings come from `resolveAutoMovieHumanoidRingModules`, the one owner
 * the drawing reads too, so a solid's vertices are the drawn vertices. The
 * owner works in Human's frame, so the canonical joints are reflected into
 * it by `(x, y, z) -> (z, y, x)` and every ring point reflected back; a
 * reflection keeps a convex hull a convex hull.
 *
 * A module is one hull while every ring point and every ring edge lies on
 * that hull. Where a ring is narrower than the straight run between its
 * neighbours the drawn surface is concave there, so the stack is cut at that
 * ring and each run becomes its own hull, down to one hull for each pair of
 * rings, which is always convex. A closing pole counts as a last ring of one
 * point.
 *
 * The digits of the hand carry no solid here: a phalanx is a capsule, which
 * a curl needs for its closed form contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the single ring owner, the frame reflection, when a module is cut into more than one hull and why the fingers are left out.
 * @evidence contracts/development/design.md#principled-representation A solid is its hull points about its own centroid with the uniform solid's volume and principal inertia, on the rig bone that carries it; nothing is optional.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the canonical profile, its one consumer, which reads every member to make shapes and mass properties.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No `any`, `unknown`, index signature or cast beyond naming a carrier; ring geometry and hull mathematics stay with their engine owners.
 */
export namespace AutoMovieHumanCanonicalSolids {
  /** One drawn joint at the canonical rest. */
  export interface IJoint {
    /** Parent Human joint, or null at the root. */
    parent: string | null;

    /** The rig bone that carries this joint rigidly. */
    carrier: AutoMovieHumanoidBone;

    /** Rest joint centre, canonical metres. */
    position: IAutoMovieVector3;

    /** Rest tip of a leaf segment, canonical metres. */
    tip: IAutoMovieVector3 | null;

    /** Girth radius, metres. */
    radius: number;
  }

  /** One convex solid of the body. */
  export interface ISolid {
    /** Unique shape id: the module's joint, numbered when the module is cut. */
    id: string;

    /** The rig bone that carries the solid. */
    carrier: AutoMovieHumanoidBone;

    /** The solid's centroid, canonical metres. */
    centre: IAutoMovieVector3;

    /** The hull's points about the centroid, canonical axes, metres. */
    points: IAutoMovieVector3[];

    /** Volume, cubic metres. */
    volume: number;

    /** Principal moments of the uniform solid per unit mass, square metres. */
    inertia: IAutoMovieVector3;

    /** Rotation from the principal frame to the canonical axes. */
    inertiaRotation: IAutoMovieQuaternion;
  }

  /**
   * Build every solid of the body.
   *
   * @param joints Every drawn Human joint by id, parent before child.
   * @returns The solids in the ring owner's module order.
   */
  export function build(joints: ReadonlyMap<string, IJoint>): ISolid[] {
    const tuple = (p: IAutoMovieVector3): [number, number, number] => [
      p.z,
      p.y,
      p.x,
    ];
    const reflect = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: p.z,
      y: p.y,
      z: p.x,
    });
    // A run of rings is one hull when the hull's surface passes through
    // every ring: no ring point is buried, and no ring edge either, since
    // two points can lie on a hull whose surface cuts across between them.
    const convex = (run: IAutoMovieVector3[][]): boolean => {
      const points: IAutoMovieVector3[] = run.flat();
      const hull: physicalHullFaces.IHull = physicalHullFaces(points);
      return (
        hull.buried <= hull.tolerance &&
        run.every((ring: IAutoMovieVector3[]): boolean =>
          ring.every(
            (p: IAutoMovieVector3, index: number): boolean =>
              physicalHullNearest(
                points,
                Vector3.lerp(p, ring[(index + 1) % ring.length]!, 0.5),
              ).distance >= -hull.tolerance,
          ),
        )
      );
    };
    const solids: ISolid[] = [];
    for (const module of resolveAutoMovieHumanoidRingModules(
      [...joints.entries()].map(
        ([bone, joint]): resolveAutoMovieHumanoidRingModules.IBone => ({
          bone,
          parent: joint.parent,
          position: tuple(joint.position),
          tip: joint.tip === null ? null : tuple(joint.tip),
          radius: joint.radius,
        }),
      ),
    )) {
      if (DIGIT.test(module.bone)) continue;
      const carrier: AutoMovieHumanoidBone = joints.get(module.bone)!.carrier;
      const layers: IAutoMovieVector3[][] = [
        ...module.rings.map(
          (
            ring: resolveAutoMovieHumanoidRingModules.IRing,
          ): IAutoMovieVector3[] => ring.points.map(reflect),
        ),
        ...(module.pole === null ? [] : [[reflect(module.pole)]]),
      ];
      const runs: IAutoMovieVector3[][] = [];
      let start: number = 0;
      while (start + 1 < layers.length) {
        let end: number = start + 1;
        while (end + 1 < layers.length && convex(layers.slice(start, end + 2)))
          end++;
        runs.push(layers.slice(start, end + 1).flat());
        start = end;
      }
      runs.forEach((points: IAutoMovieVector3[], index: number): void => {
        const solid: ReturnType<typeof physicalHullMass> =
          physicalHullMass(points);
        solids.push({
          id: runs.length === 1 ? module.bone : `${module.bone}.${index}`,
          carrier,
          centre: solid.centerOfMass,
          points: points.map(
            (p: IAutoMovieVector3): IAutoMovieVector3 => ({
              x: p.x - solid.centerOfMass.x,
              y: p.y - solid.centerOfMass.y,
              z: p.z - solid.centerOfMass.z,
            }),
          ),
          volume: solid.volume,
          inertia: solid.inertia,
          inertiaRotation: solid.inertiaRotation,
        });
      });
    }
    return solids;
  }
}

/** A phalanx of the hand, whose collider stays a capsule. */
const DIGIT: RegExp =
  /(?:Thumb|Index|Middle|Ring|Little)(?:Metacarpal|Proximal|Intermediate|Distal)$/;
