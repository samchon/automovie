import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  integrateMotionTrajectory,
  resolveAutoMovieCenterOfMass,
  resolveHydrodynamicForce,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWater,
  IAutoMoviePhysicalProfile,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolveHydrodynamicForce,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A body the water carries (#3432): the water's forces on every segment
 * (`resolveHydrodynamicForce`) summed over the posed body, the height at
 * which a still body floats, and a glide slowed by drag, integrated at plan
 * time by the engine's integrator.
 *
 * The float is the root height at which the buoyancy of the posed body
 * equals its weight (Archimedes), found by bisection on the root's height:
 * the submerged volume grows monotonically as the body is lowered. The
 * glide is the root's horizontal speed under the summed drag of the body
 * held in its shape, `m dv/dt = -Σ ½ ρ C_d A |v| v`, integrated from its
 * start (`integrateMotionTrajectory`), so it decays as quadratic drag does,
 * `v0 / (1 + k v0 t)` with `k = Σ ½ ρ C_d A / m`.
 *
 * First pass: the strokes do not yet drive the root; a swimmer's speed from
 * its strokes and its roll from its arms are the next pass, on the same
 * forces. The float holds the posture's orientation and moves the root only
 * vertically. These calculations are exported and unit-tested; the swim law
 * and the performance do not yet consume them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three readings, the laws behind them and the first pass's limits.
 * @evidence contracts/development/implementation.md#principled-implementation Archimedes' principle summed over the segments for the float, solved by bisection on a monotone function; Newton's second law under the summed quadratic drag for the glide, integrated by the engine's fixed-step integrator.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The segments' volumes once per body, one sum of forces, one bisection and one integration.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A body denser than the water is reported as sinking, never floated by a clamp.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in segments per evaluation; the bisection halves its bracket to a micrometre.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure functions of their inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the returned trajectory.
 */
export namespace HumanWater {
  /**
   * The water's forces on a posed body moving at one velocity.
   *
   * @param body The body.
   * @param bones The posed bones.
   * @param velocity The body's velocity relative to the water, m/s.
   * @param water The water.
   * @returns The summed forces.
   */
  export function sum(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    velocity: IAutoMovieVector3,
    water: IAutoMovieMotionHumanWater.IWater,
  ): IAutoMovieMotionHumanWater.ISum {
    let buoyancy: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let drag: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let submerged: number = 0;
    let volume: number = 0;
    const model: IAutoMovieResolveCenterOfMass.IModel = modelOf(body);
    body.profile.segments.forEach(
      (segment: IAutoMoviePhysicalProfile.ISegment, i: number): void => {
        const v: number = resolveHydrodynamicForce.volume(segment);
        if (!(v > 0)) return;
        const s: IAutoMovieResolveCenterOfMass.ISegment = model.segments[i]!;
        const bone: IAutoMovieResolvedBone = bones.get(s.bone)!;
        const force: IAutoMovieResolveHydrodynamicForce.IForce =
          resolveHydrodynamicForce({
            volume: v,
            centre: Vector3.add(
              bone.worldPosition,
              Quaternion.rotateVector(bone.worldRotation, s.point),
            ),
            velocity,
            surface: water.surface,
            density: water.density,
          });
        buoyancy = Vector3.add(buoyancy, force.buoyancy);
        drag = Vector3.add(drag, force.drag);
        submerged += force.submerged;
        volume += v;
      },
    );
    return { buoyancy, drag, submerged, volume };
  }

  /**
   * How far a still body must be lowered so its buoyancy equals its weight:
   * the root's vertical offset from the posed bones at which it floats.
   *
   * @param body The body.
   * @param bones The posed bones.
   * @param water The water.
   * @returns Metres to add to the root's height, or null for a body that sinks.
   */
  export function float(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    water: IAutoMovieMotionHumanWater.IWater,
  ): number | null {
    const weight: number = body.profile.mass * AutoMovieGravity.STANDARD;
    const lift = (dy: number): number =>
      sum(body, shifted(bones, dy), { x: 0, y: 0, z: 0 }, water).buoyancy.y;
    // Bracket: a stature below the highest bone sinking under the surface,
    // and a stature above the lowest bone leaving it, so every collider is
    // wholly under and wholly out.
    const heights: number[] = [...bones.values()].map(
      (r: IAutoMovieResolvedBone): number => r.worldPosition.y,
    );
    const reach: number = body.measure.stature;
    let low: number = water.surface - Math.max(...heights) - reach;
    let high: number = water.surface - Math.min(...heights) + reach;
    if (lift(low) < weight) return null;
    while (high - low > 1e-6) {
      const middle: number = (low + high) / 2;
      if (lift(middle) >= weight) low = middle;
      else high = middle;
    }
    return low;
  }

  /**
   * A glide: the horizontal speed of a body held in its shape and slowed by
   * the water's drag, integrated from `v0`.
   *
   * @param body The body.
   * @param bones The posed bones, in the water.
   * @param direction The glide's horizontal direction, unit.
   * @param v0 The starting speed, m/s.
   * @param seconds The glide's length, seconds.
   * @param water The water.
   * @returns The speed's trajectory, its state `[speed, distance]`.
   */
  export function glide(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    direction: IAutoMovieVector3,
    v0: number,
    seconds: number,
    water: IAutoMovieMotionHumanWater.IWater,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    return integrateMotionTrajectory({
      f: (
        _t: number,
        x: readonly number[],
      ): IAutoMovieIntegrateMotionTrajectory.IRate => {
        const drag: IAutoMovieVector3 = sum(
          body,
          bones,
          Vector3.scale(direction, x[0]!),
          water,
        ).drag;
        return {
          dx: [Vector3.dot(drag, direction) / body.profile.mass, x[0]!],
        };
      },
      x0: [v0, 0],
      t0: 0,
      t1: seconds,
    });
  }

  /**
   * Bones moved vertically.
   *
   * @param bones The bones.
   * @param dy Metres.
   * @returns The moved bones.
   */
  function shifted(
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    dy: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const out: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
    for (const [bone, r] of bones)
      out.set(bone, {
        ...r,
        worldPosition: { ...r.worldPosition, y: r.worldPosition.y + dy },
      });
    return out;
  }

  /** Each body's mass model, built once. */
  const MODELS: WeakMap<
    IAutoMovieMotionHumanBody,
    IAutoMovieResolveCenterOfMass.IModel
  > = new WeakMap();

  /**
   * A body's mass model, built once.
   *
   * @param body The body.
   * @returns The model, its segments in the profile's order.
   */
  function modelOf(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieResolveCenterOfMass.IModel {
    let model: IAutoMovieResolveCenterOfMass.IModel | undefined =
      MODELS.get(body);
    if (model === undefined) {
      model = resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
      MODELS.set(body, model);
    }
    return model;
  }
}
