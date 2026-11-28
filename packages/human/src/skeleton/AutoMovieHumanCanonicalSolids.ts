import {
  AutoMovieEngineKinematics,
  AutoMovieEnginePhysicalHullFaces,
  AutoMovieEnginePhysics,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanCanonicalSolids,
  IAutoMoviePhysicalHullFaces,
  IAutoMovieResolveHumanoidRingModules,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Build the stock polygon body's convex collision pieces from its drawing rings at
 * the canonical T-pose. The shared ring resolver receives the joints in Human
 * axes. The points return to canonical axes before their hulls and mass properties
 * are calculated.
 *
 * A run of rings stays together while its points and edge midpoints satisfy the
 * hull's surface tolerance. Runs that fail the test split at a shared ring. The
 * closing pole has one point. The physical profile builds hand phalanx capsules
 * separately for the closed-form grasp solver.
 */
export namespace AutoMovieHumanCanonicalSolids {

  /**
   * Build the convex collision pieces for the stock ring modules in module order.
   * A piece keeps the module's rig carrier and an ordered suffix when its module
   * splits. Centres and centroid-relative points use the canonical axes. Volumes
   * and unit-mass principal moments are in cubic metres and square metres,
   * respectively.
   *
   * @param joints Rest joints keyed by Human joint id and iterated parent before
   * child, with centres, tip coordinates, radii and supplied foot heel-plane
   * points in canonical metres.
   * @returns The ring-derived hulls and their mass properties. The profile
   * supplies the separate hand capsule shapes.
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
    const frame: IAutoMovieRigidTransform = {
      position: { x: 0, y: 0, z: 0 },
      rotation: AutoMovieEngineQuaternion.identity(),
    };
    // Each candidate run owns its hull. Read every ring edge midpoint on that
    // same surface, which can bury an edge even when both of its ends lie on it.
    const convex = (
      run: IAutoMovieVector3[][],
      points: IAutoMovieVector3[],
    ): boolean => {
      const hull: IAutoMoviePhysicalHullFaces.IHull =
        AutoMovieEnginePhysicalHullFaces.build(points);
      if (!(hull.buried <= hull.tolerance)) return false;
      const distance: ReturnType<
        typeof AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance
      > = AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance(frame, {
        id: "ring",
        material: "skin",
        kind: "hull",
        points,
        hull,
        transform: frame,
      });
      return run.every((ring: IAutoMovieVector3[]): boolean =>
        ring.every((p: IAutoMovieVector3, index: number): boolean => {
          const midpoint: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(
            p,
            ring[(index + 1) % ring.length]!,
            0.5,
          );
          return distance(midpoint, midpoint) >= -hull.tolerance;
        }),
      );
    };
    const solids: IAutoMovieHumanCanonicalSolids.ISolid[] = [];
    for (const module of AutoMovieEngineKinematics.resolveAutoMovieHumanoidRingModules(
      [...joints.entries()].map(
        ([bone, joint]): IAutoMovieResolveHumanoidRingModules.IBone => ({
          bone,
          parent: joint.parent,
          position: tuple(joint.position),
          tip: joint.tip === null ? null : tuple(joint.tip),
          radius: joint.radius,
          ...(joint.heel === undefined ? {} : { heel: tuple(joint.heel) }),
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
      const runs: IAutoMovieVector3[][] = [];
      let start: number = 0;
      while (start + 1 < layers.length) {
        let end: number = start + 1;

        // Keep the widest run whose points and edges meet its hull surface.
        let accepted: IAutoMovieVector3[] | null = null;
        while (end + 1 < layers.length) {
          const run: IAutoMovieVector3[][] = layers.slice(start, end + 2);
          const points: IAutoMovieVector3[] = run.flat();
          if (!convex(run, points)) break;
          accepted = points;
          end++;
        }
        runs.push(accepted ?? layers.slice(start, end + 1).flat());
        start = end;
      }
      runs.forEach((points: IAutoMovieVector3[], index: number): void => {
        const solid: ReturnType<typeof AutoMovieEnginePhysics.hullMass> =
          AutoMovieEnginePhysics.hullMass(points);
        solids.push({
          id: runs.length === 1 ? module.bone : `${module.bone}.${index}`,
          carrier,
          centre: solid.centerOfMass,
          // Store the points in the centroid frame of the computed solid.
          points: AutoMovieEnginePhysicalHullFaces.shift(points, solid.centerOfMass),
          volume: solid.volume,
          inertia: solid.inertia,
          inertiaRotation: solid.inertiaRotation,
        });
      });
    }
    return solids;
  }
}

/*
 * A phalanx of the hand, whose collider stays a capsule.
 */
const DIGIT: RegExp =
  /(?:Thumb|Index|Middle|Ring|Little)(?:Metacarpal|Proximal|Intermediate|Distal)$/;
