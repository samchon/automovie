import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  AutoMovieEngineMotionTrajectory,
  AutoMovieEngineMotionHydrodynamics,
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
 * Fresh water's density, kg/m^3: the engine's default when the water states
 * none.
 */
const FRESH: number = 1000;

/**
 * Drag coefficient of a flat plate across the flow (Hoerner, Fluid-Dynamic
 * Drag, 1965).
 */
const PLATE: number = 1.17;

/**
 * A body the water carries: the water's forces on every segment
 * (`AutoMovieEngineMotionHydrodynamics`) summed over the posed body, the height at which
 * a still body floats, and a glide slowed by drag, integrated at plan time by
 * the engine's integrator.
 *
 * The float is the root height at which the buoyancy of the posed body equals
 * its weight (Archimedes), found by bisection on the root's height: the
 * submerged volume grows monotonically as the body is lowered. The glide is the
 * root's horizontal speed under the summed drag of the body held in its shape,
 * `m dv/dt = -Σ ½ ρ C_d A |v| v`, integrated from its start
 * (`integrateMotionTrajectory`), so it decays as quadratic drag does, `v0 / (1
 *
 * - K v0 t)`with`k = Σ ½ ρ C_d A / m`.
 *
 * The registered swimImmersed law uses the same segment model for a held supine
 * shape and for an opt-in breaststroke. The stroke uses each segment's own
 * motion relative to still water and constrains travel to the heading at its
 * initial buoyant trim. Free heave and rotation remain outside this model.
 */
export namespace HumanWater {
  /**
   * What the water reads of a body: its segments' colliders and its mass, the
   * bone and point of each segment's centre of mass, and its stature.
   */
  export interface IBody {
    /** The segments, each with its colliders, and the body's mass, kg. */
    profile: Pick<IAutoMovieMotionHumanBody["profile"], "segments" | "mass">;
    /** Each segment's centre of mass on its bone. */
    massModel: {
      segments: readonly Pick<
        IAutoMovieResolveCenterOfMass.ISegment,
        "bone" | "point"
      >[];
    };
    /** The stature, metres. */
    measure: Pick<IAutoMovieMotionHumanBody["measure"], "stature">;
  }
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
    body: IBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    velocity: IAutoMovieVector3,
    water: IAutoMovieMotionHumanWater,
  ): IAutoMovieMotionHumanWater.ISum {
    let buoyancy: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let drag: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let submerged: number = 0;
    let volume: number = 0;
    const model: IBody["massModel"] = body.massModel;
    body.profile.segments.forEach(
      (segment: IAutoMoviePhysicalSegment, i: number): void => {
        const v: number = AutoMovieEngineMotionHydrodynamics.volume(segment);
        if (!(v > 0)) return;
        const s: IBody["massModel"]["segments"][number] = model.segments[i]!;
        const bone: IAutoMovieResolvedBone = bones.get(s.bone)!;
        const force: IAutoMovieResolveHydrodynamicForce.IForce =
          AutoMovieEngineMotionHydrodynamics.resolve({
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
    // A worn fin is a flat plate along each sole: the water drags on it
    // across its face, 0.5 rho C A |v_n| v_n against the velocity normal to
    // the blade, while edgewise it adds nothing (Hoerner, Fluid-Dynamic Drag,
    // a flat plate normal to the flow).
    const fins: number = water.fins ?? 0;
    if (fins > 0)
      for (const side of ["leftFoot", "rightFoot"] as const) {
        const foot: IAutoMovieResolvedBone | undefined = bones.get(side);
        if (foot === undefined || foot.worldPosition.y > water.surface)
          continue;
        const normal: IAutoMovieVector3 = Quaternion.rotateVector(
          foot.worldRotation,
          { x: 0, y: 1, z: 0 },
        );
        const across: number = Vector3.dot(velocity, normal);
        drag = Vector3.add(
          drag,
          Vector3.scale(
            normal,
            -0.5 *
              (water.density ?? FRESH) *
              PLATE *
              fins *
              Math.abs(across) *
              across,
          ),
        );
      }
    return { buoyancy, drag, submerged, volume };
  }

  /**
   * How far a still body must be lowered so its buoyancy equals its weight: the
   * root's vertical offset from the posed bones at which it floats.
   *
   * @param body The body.
   * @param bones The posed bones.
   * @param water The water.
   * @returns Metres to add to the root's height, or null for a body that sinks.
   */
  export function float(
    body: IBody,
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
   * A glide: the horizontal speed of a body held in its shape and slowed by the
   * water's drag, integrated from `v0`.
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
    body: IBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    direction: IAutoMovieVector3,
    v0: number,
    seconds: number,
    water: IAutoMovieMotionHumanWater,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    return AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
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
   * inverse square. The trajectory therefore stores metres and metres per unit
   * phase. The model uses the body mass for the translating hip target and
   * omits longitudinal momentum redistribution from the posed limbs.
   *
   * @param body The swimming body.
   * @param bonesAt The resolved stroke skeleton on [0,1], with the hip target
   *   fixed and prescribed movement at rest at both endpoints.
   * @param direction World horizontal heading, unit.
   * @param water The horizontal surface and medium density.
   * @returns Longitudinal trajectory with state [distance, phase velocity].
   */
  export function stroke(
    body: IBody,
    bonesAt: (
      phase: number,
    ) => ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    direction: IAutoMovieVector3,
    water: IAutoMovieMotionHumanWater,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    const intervals: number = 120;
    const volumes: readonly number[] = body.profile.segments.map(
      AutoMovieEngineMotionHydrodynamics.volume,
    );
    const segments: IBody["massModel"]["segments"] = body.massModel.segments;
    const centres: (readonly IAutoMovieVector3[])[] = [];
    const coefficients: (readonly number[])[] = [];
    for (let index: number = 0; index <= intervals; ++index) {
      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        bonesAt(index / intervals);
      const positions: readonly IAutoMovieVector3[] = segments.map(
        (segment: IBody["massModel"]["segments"][number]): IAutoMovieVector3 =>
          centre(bones.get(segment.bone)!, segment.point),
      );
      centres.push(positions);
      coefficients.push(
        positions.map((position: IAutoMovieVector3, i: number): number => {
          const volume: number = volumes[i]!;
          if (!(volume > 0)) return 0;
          const force: IAutoMovieResolveHydrodynamicForce.IForce =
            AutoMovieEngineMotionHydrodynamics.resolve({
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
    return AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
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
