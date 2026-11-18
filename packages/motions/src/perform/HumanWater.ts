import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  integrateMotionTrajectory,
  resolveHydrodynamicForce,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanWater,
  IAutoMoviePhysicalSegment,
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
 * The registered swimImmersed law uses the same segment model for a held
 * supine shape and for an opt-in breaststroke. The stroke uses each segment's
 * own motion relative to still water and constrains travel to the heading at
 * its initial buoyant trim. Free heave and rotation remain outside this model.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three readings, the laws behind them and the first pass's limits.
 * @evidence contracts/development/implementation.md#principled-implementation Archimedes' principle summed over the segments for the float, solved by bisection on a monotone function; Newton's second law under the summed quadratic drag for the glide, integrated by the engine's fixed-step integrator.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One segment-force sum for each posed evaluation. The stroke samples centre paths and volumes before integration.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A body denser than the water is reported as sinking, never floated by a clamp.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in segments per evaluation. Float bisects to a micrometre or adjacent representable heights, whichever is coarser. The stroke samples one bounded phase grid.
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
    water: IAutoMovieMotionHumanWater,
  ): IAutoMovieMotionHumanWater.ISum {
    let buoyancy: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let drag: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let submerged: number = 0;
    let volume: number = 0;
    const model: IAutoMovieResolveCenterOfMass.IModel = body.massModel;
    body.profile.segments.forEach(
      (segment: IAutoMoviePhysicalSegment, i: number): void => {
        const v: number = resolveHydrodynamicForce.volume(segment);
        if (!(v > 0)) return;
        const s: IAutoMovieResolveCenterOfMass.ISegment = model.segments[i]!;
        const bone: IAutoMovieResolvedBone = bones.get(s.bone)!;
        const force: IAutoMovieResolveHydrodynamicForce.IForce =
          resolveHydrodynamicForce({
            volume: v,
            centre: centre(bone, s.point),
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
    water: IAutoMovieMotionHumanWater,
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

    // A micrometre or the heights' own resolution, whichever is coarser: a
    // surface past 2^33 m spaces adjacent heights wider than a micrometre,
    // and there the midpoint rounds onto an end, so the bisection also ends
    // there: after log2 of the bracket over the coarser of the two, at most
    // 2098 halvings of any finite bracket (binary64 spans 2^1024 down to
    // spacings of 2^-1074).
    while (high - low > 1e-6) {
      const middle: number = (low + high) / 2;
      if (middle === low || middle === high) break;
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
    water: IAutoMovieMotionHumanWater,
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
   * Integrate the longitudinal travel of one keyed stroke from rest.
   *
   * Positions on a uniformly sampled stroke phase are differentiated at the
   * knots. Interpolate those derivatives and the submerged drag coefficients
   * during integration. With quadratic drag in still water, changing the
   * duration scales all velocities by its inverse and accelerations by its
   * inverse square. The trajectory therefore stores metres and metres per
   * unit phase. The model uses the body mass for the translating hip target
   * and omits longitudinal momentum redistribution from the posed limbs.
   *
   * @param body The swimming body.
   * @param bonesAt The resolved stroke skeleton on [0,1], with the hip target fixed and prescribed movement at rest at both endpoints.
   * @param direction World horizontal heading, unit.
   * @param water The horizontal surface and medium density.
   * @returns Longitudinal trajectory with state [distance, phase velocity].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the coordinate system, initial conditions, sample inputs, duration scaling and returned state.
   * @evidence contracts/development/implementation.md#principled-implementation Samples collider-equivalent centres and unit-flow drag through the existing segment model, then integrates the heading projection of the sum of quadratic drag under common translation plus each segment's local velocity.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepares uniformly timed centres and local derivatives before running one scalar trajectory.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The stroke's keyed poses supply the local movement and the medium supplies the force. Only heading translation is free; no preset thrust or cruise speed is applied.
   * @evidence contracts/development/implementation.md#efficient-algorithms Uses one skeleton per phase sample and one volume per segment. Integration stages interpolate the cached samples without recalculating poses or volumes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The integration uses the same centre transform, drag primitive and trajectory integrator as the passive operations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Sampled centres and coefficients are local to planning. The returned trajectory retains only its own knots.
   */
  export function stroke(
    body: IAutoMovieMotionHumanBody,
    bonesAt: (
      phase: number,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    direction: IAutoMovieVector3,
    water: IAutoMovieMotionHumanWater,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    const intervals: number = 120;
    const volumes: readonly number[] = body.profile.segments.map(
      resolveHydrodynamicForce.volume,
    );
    const segments: readonly IAutoMovieResolveCenterOfMass.ISegment[] =
      modelOf(body).segments;
    const centres: (readonly IAutoMovieVector3[])[] = [];
    const coefficients: (readonly number[])[] = [];
    for (let index: number = 0; index <= intervals; ++index) {
      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        bonesAt(index / intervals);
      const positions: readonly IAutoMovieVector3[] = segments.map(
        (segment: IAutoMovieResolveCenterOfMass.ISegment): IAutoMovieVector3 =>
          centre(bones.get(segment.bone)!, segment.point),
      );
      centres.push(positions);
      coefficients.push(
        positions.map((position: IAutoMovieVector3, i: number): number => {
          const volume: number = volumes[i]!;
          if (!(volume > 0)) return 0;
          const force: IAutoMovieResolveHydrodynamicForce.IForce =
            resolveHydrodynamicForce({
              volume,
              centre: position,
              velocity: direction,
              surface: water.surface,
              density: water.density,
            });
          return -Vector3.dot(force.drag, direction);
        }),
      );
    }

    // Minimum-jerk keys start and finish this cycle at rest in the held frame.
    const local: (readonly IAutoMovieVector3[])[] = centres.map(
      (
        positions: readonly IAutoMovieVector3[],
        index: number,
      ): readonly IAutoMovieVector3[] =>
        positions.map(
          (_position: IAutoMovieVector3, i: number): IAutoMovieVector3 =>
            index === 0 || index === intervals
              ? { x: 0, y: 0, z: 0 }
              : Vector3.scale(
                  Vector3.subtract(
                    centres[index + 1]![i]!,
                    centres[index - 1]![i]!,
                  ),
                  intervals / 2,
                ),
        ),
    );
    return integrateMotionTrajectory({
      x0: [0, 0],
      t0: 0,
      t1: 1,
      h: 1 / intervals,
      f: (
        phase: number,
        x: readonly number[],
      ): IAutoMovieIntegrateMotionTrajectory.IRate => {
        const speed: number = x[1]!;
        const travel: IAutoMovieVector3 = Vector3.scale(direction, speed);
        const position: number = Math.min(1, Math.max(0, phase)) * intervals;
        const index: number = Math.min(intervals - 1, Math.floor(position));
        const share: number = position - index;
        let drag: number = 0;
        for (let i: number = 0; i < segments.length; ++i) {
          const a: number = coefficients[index]![i]!;
          const b: number = coefficients[index + 1]![i]!;
          const coefficient: number = a + (b - a) * share;
          const relative: IAutoMovieVector3 = Vector3.add(
            travel,
            Vector3.add(
              Vector3.scale(local[index]![i]!, 1 - share),
              Vector3.scale(local[index + 1]![i]!, share),
            ),
          );
          drag -=
            coefficient *
            Vector3.length(relative) *
            Vector3.dot(relative, direction);
        }
        return { dx: [speed, drag / body.profile.mass] };
      },
    });
  }

  /** Place a segment's bone-local centre of mass in the world. */
  function centre(
    bone: IAutoMovieResolvedBone,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.add(
      bone.worldPosition,
      Quaternion.rotateVector(bone.worldRotation, point),
    );
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
}
