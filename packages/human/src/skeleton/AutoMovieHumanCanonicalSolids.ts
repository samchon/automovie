import {
  Vector3,
  physicalHullFaces,
  physicalHullFacesMass,
  physicalHullNearest,
  resolveAutoMovieHumanoidRingModules,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanCanonicalSolids,
  IAutoMoviePhysicalHullFaces,
  IAutoMovieResolveHumanoidRingModules,
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

  /**
   * Build every solid of the body.
   *
   * @param joints Every drawn Human joint by id, parent before child.
   * @returns The solids in the ring owner's module order.
   */
  export function build(joints: ReadonlyMap<string, IAutoMovieHumanCanonicalSolids.IJoint>): IAutoMovieHumanCanonicalSolids.ISolid[] {
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
    const convex = (
      run: IAutoMovieVector3[][],
      hull: IAutoMoviePhysicalHullFaces.IHull,
    ): boolean => {
      if (!(hull.buried <= hull.tolerance)) return false;
      const nearest: ReturnType<typeof physicalHullNearest.prepare> =
        physicalHullNearest.prepare(hull);
      return run.every((ring: IAutoMovieVector3[]): boolean =>
        ring.every(
          (p: IAutoMovieVector3, index: number): boolean =>
            nearest(Vector3.lerp(p, ring[(index + 1) % ring.length]!, 0.5)) >=
            -hull.tolerance,
        ),
      );
    };
    const solids: IAutoMovieHumanCanonicalSolids.ISolid[] = [];
    for (const module of resolveAutoMovieHumanoidRingModules(
      [...joints.entries()].map(
        ([bone, joint]): IAutoMovieResolveHumanoidRingModules.IBone => ({
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
            ring: IAutoMovieResolveHumanoidRingModules.IRing,
          ): IAutoMovieVector3[] => ring.points.map(reflect),
        ),
        ...(module.pole === null ? [] : [[reflect(module.pole)]]),
      ];
      const runs: IRun[] = [];
      let start: number = 0;
      while (start + 1 < layers.length) {
        let end: number = start + 1;

        // The accepted run keeps the supporting faces its edge reads used.
        let accepted: IRun | null = null;
        while (end + 1 < layers.length) {
          const run: IAutoMovieVector3[][] = layers.slice(start, end + 2);
          const points: IAutoMovieVector3[] = run.flat();
          const hull: IAutoMoviePhysicalHullFaces.IHull =
            physicalHullFaces(points);
          if (!convex(run, hull)) break;
          accepted = { points, hull };
          end++;
        }
        if (accepted === null) {
          const points: IAutoMovieVector3[] = layers.slice(start, end + 1).flat();
          accepted = { points, hull: physicalHullFaces(points) };
        }
        runs.push(accepted);
        start = end;
      }
      runs.forEach(({ points, hull }: IRun, index: number): void => {
        const solid: ReturnType<typeof physicalHullFacesMass> =
          physicalHullFacesMass(hull);
        solids.push({
          id: runs.length === 1 ? module.bone : `${module.bone}.${index}`,
          carrier,
          centre: solid.centerOfMass,
          points: points.map(
            (point: IAutoMovieVector3): IAutoMovieVector3 =>
              Vector3.subtract(point, solid.centerOfMass),
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

/** One ring run and the supporting faces its solid uses. */
interface IRun {
  /** Ordered source ring and pole points in metres. */
  points: IAutoMovieVector3[];
  /** Supporting faces of those actual points. */
  hull: IAutoMoviePhysicalHullFaces.IHull;
}

/** A phalanx of the hand, whose collider stays a capsule. */
const DIGIT: RegExp =
  /(?:Thumb|Index|Middle|Ring|Little)(?:Metacarpal|Proximal|Intermediate|Distal)$/;
