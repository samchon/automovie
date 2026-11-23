import {
  AffordanceArticulation,
  AutoMovieGravity,
  Vector3,
  ViolationCollector,
  integrateMotionTrajectory,
  validateBody,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieAffordanceArticulation,
  IAutoMovieBody,
  IAutoMovieConstraintViolation,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropDynamics,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Props with mass and friction moved by the hands' force: a prop on the floor
 * slides under Newton's second law and Coulomb friction, a hinged prop turns
 * under its torque, and the pushing body leans so its weight balances the
 * reaction of the force it applies.
 *
 * - **Slide.** A prop of mass `m` at rest stays while the applied horizontal
 *   force is within the static friction `μs m g`; once moving it accelerates at
 *   `(F - μk m g) / m` against its motion (Coulomb's law), until it stops,
 *   where the static friction holds it again. Its position and speed are
 *   integrated at plan time by the engine's integrator, each stop located
 *   inside its step and the integration restarted there, so playback and seek
 *   read the same path.
 * - **Hinge.** A door of moment of inertia `I` about its hinge turns at `θ'' = τ
 *   / I` under the torque applied at its handle.
 * - **Lean.** A body pushing horizontally with a force `F` at the height `y` of
 *   its hands leans until its weight's moment about its feet, `M g h sin θ`,
 *   balances the push's reaction, `F y` (static moment balance).
 *
 * The prop's mass and its static and kinetic friction are its model's
 * (`IAutoMovieBody`), read by the caller; this module reads coefficients only.
 * First pass: rolling resistance is the kinetic coefficient the producer gives;
 * the push's force profile comes from the caller, since no pushing-strength
 * study has been read for it. `slideProp` offers the trajectory as the frame of
 * a prop in a performance. `hingeProp` supplies an articulation track. The film
 * authors each drive independently of the poses that follow the prop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three laws, their premises, where the coefficients come from and the first pass's limits.
 * @evidence contracts/development/implementation.md#principled-implementation Newton's second law under Coulomb friction with its static threshold and its stop located as the switching point of a discontinuous right-hand side, the hinge's rotational form of it, and static moment balance for the lean; the slide and the hinge are integrated by the engine's fixed-step integrator.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One right-hand side per law and one closed form for the lean.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A push the body's weight cannot balance is reported, never clamped to a lean.
 * @evidence contracts/development/implementation.md#efficient-algorithms Four right-hand sides per integrator step, and per stop one bisection of single steps down to a double's resolution, about fifty, and one restarted integration of what is left.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure functions of their inputs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each returned trajectory holds its knots for as long as its caller keeps it.
 */
export namespace HumanPropDynamics {
  /**
   * Give a prop a hinge track under an authored torque. The drive starts at
   * zero angle and speed. The performance holds its final angle.
   *
   * @param prop A prop with a named hinge and an articulation pose reader.
   * @param drive The hinge id, scheduled start, duration, inertia and local
   *   torque.
   * @returns A shallow copy of the prop with the appended articulation track.
   * @throws {Error} An inadmissible hinge, drive value, integration knot or
   *   requested sample.
   * @evidence contracts/development/common.md#meaningful-documentation States the starting and held states, authored input, track result and failures.
   * @evidence contracts/development/implementation.md#principled-implementation Integrate angular acceleration equal to torque divided by inertia on the track clock, from zero angle and speed in radians. Convert travel to degrees for the prop's named articulation and use engine admission at each knot and requested sample.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the drive, integrate once, and attach a reader using the established prop track scheduler.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the provided torque and inertia, and rejects travel outside articulation admission. It preserves other tracks and uses no performer pose to drive the hinge.
   * @evidence contracts/development/implementation.md#efficient-algorithms Builds one affordance index and integrates for the duration at the fixed hinge step. Admission runs once per knot and requested sample and traverses only the selected articulation's coupling chain and its inverse tables.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All reads of the returned track share the one integrated trajectory and the prop's indexed affordances. Torque is sampled during planning.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The track retains the path knots and affordance index for its lifetime. It acquires no external resources.
   */
  export function hingeProp(
    prop: IAutoMovieMotionHumanProp,
    drive: IAutoMovieMotionHumanPropDynamics.IHingeDrive,
  ): IAutoMovieMotionHumanProp {
    const articulation: string = drive.articulation;
    const subject: string = prop.subject;
    const byId: ReadonlyMap<string, IAutoMovieAffordance> = new Map(
      (prop.affordances ?? []).map(
        (a: IAutoMovieAffordance): [string, IAutoMovieAffordance] => [a.id, a],
      ),
    );
    if (
      byId.get(articulation)?.kind !== "hinge" ||
      prop.articulate === undefined
    )
      throw new Error(`${subject}.${articulation}: expected a poseable hinge`);

    const duration: number = drive.duration;
    const inertia: number = drive.inertia;
    if (!(duration > 0 && Number.isFinite(duration)))
      throw new Error(
        `${subject}.${articulation}: expected a positive finite duration`,
      );
    if (!(inertia > 0 && Number.isFinite(inertia)))
      throw new Error(
        `${subject}.${articulation}: expected a positive finite inertia`,
      );
    const start: IAutoMovieMotionHumanProp.ITrack["start"] = drive.start;
    if (
      !Number.isFinite(typeof start === "number" ? start : (start.offset ?? 0))
    )
      throw new Error(
        `${subject}.${articulation}: expected a finite start time or offset`,
      );

    const path: IAutoMovieIntegrateMotionTrajectory.ITrajectory = hinge(
      inertia,
      (seconds: number): number => {
        const torque: number = drive.torque(seconds);
        if (!Number.isFinite(torque) || !Number.isFinite(torque / inertia))
          throw new Error(
            `${subject}.${articulation}: expected finite torque and acceleration at ${seconds}s`,
          );
        return torque;
      },
      0,
      duration,
    );
    const travel = (seconds: number): number => {
      const degrees: number = path.at(seconds).x[0]! * (180 / Math.PI);
      const input: IAutoMovieAffordanceArticulation.Input =
        AffordanceArticulation.input(byId, articulation, degrees);
      if (!input.success)
        throw new Error(
          `${subject}.${input.id}: hinge drive travel ${input.travel} at ${seconds}s is inadmissible (${input.kind})`,
        );
      return degrees;
    };

    // Refuse invalid integration knots at plan time and interpolated travel on read.
    for (const seconds of path.times) travel(seconds);
    const track: IAutoMovieMotionHumanProp.ITrack = {
      articulation,
      start,
      duration,
      travel,
    };
    return { ...prop, tracks: [...(prop.tracks ?? []), track] };
  }

  /**
   * Give a rigid prop a straight ground slide in a performance. The supplied
   * force is sampled at plan time. The prop starts at rest, keeps its
   * orientation and holds each boundary placement outside the drive's film
   * interval. Its local affordances travel with its frame.
   *
   * @param prop The rigid prop at its starting frame with body contact data.
   * @param drive The horizontal direction, force in newtons and film interval.
   * @returns A shallow copy of the prop with an authored `motion` reader.
   * @throws {Error} When the prop already has an incompatible placement source
   *   or lacks admissible body contact data, or when the drive has an invalid
   *   direction, interval or sampled force.
   * @evidence contracts/development/common.md#meaningful-documentation States the source of mass and contact coefficients, film-clock boundaries, preserved orientation and how the returned prop plugs into normal performance placement.
   * @evidence contracts/development/implementation.md#principled-implementation The Coulomb trajectory gives displacement along a horizontal unit vector from the prop's original world translation. The engine's body admission validates the contact coefficients before planning.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the prop and direction, plan the slide once, and read its distance as a world offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown friction is refused. The supplied force is independent of the displayed performer, so reading the prop does not solve a pose or call its force provider.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning has the slide's integration cost. Each frame read selects one trajectory sample and translates three coordinates.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the numerical slide and the normal moving-prop placement path; all readers of the returned prop share the planned trajectory.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The prop reader retains the trajectory, starting frame and direction for the prop's lifetime. It opens no handles or processes.
   */
  export function slideProp(
    prop: IAutoMovieMotionHumanProp,
    drive: IAutoMovieMotionHumanPropDynamics.ISlideDrive,
  ): IAutoMovieMotionHumanProp {
    if (
      prop.motion !== undefined ||
      prop.worn !== undefined ||
      prop.mounted !== undefined ||
      prop.point !== undefined ||
      prop.soft !== undefined
    )
      throw new Error(
        `${prop.subject}: a force-driven slide needs a rigid prop with a rest frame and local contacts`,
      );
    const body: IAutoMovieBody | undefined = prop.body;
    if (body?.friction === undefined || body.kineticFriction === undefined)
      throw new Error(
        `${prop.subject}: a force-driven slide needs both static and kinetic friction`,
      );
    const violations: ViolationCollector = new ViolationCollector();
    validateBody(body, `${prop.subject}.body`, violations);
    violations.finiteVector(
      `${prop.subject}.frame.position`,
      prop.frame.position,
      "slide start position",
    );
    violations.unitQuaternion(
      `${prop.subject}.frame.rotation`,
      prop.frame.rotation,
      "slide start rotation",
    );
    if (violations.items.length > 0)
      throw new Error(
        violations.items
          .map(
            (item: IAutoMovieConstraintViolation): string =>
              `${item.path}: ${item.expected}`,
          )
          .join(". "),
      );

    const length: number = Math.hypot(drive.direction.x, drive.direction.z);
    if (drive.direction.y !== 0 || !(length > 0 && Number.isFinite(length)))
      throw new Error(
        `${prop.subject}: a force-driven slide needs a finite nonzero horizontal direction`,
      );
    const direction: IAutoMovieVector3 = {
      x: drive.direction.x / length,
      y: 0,
      z: drive.direction.z / length,
    };
    const frame: IAutoMovieRigidTransform = {
      position: { ...prop.frame.position },
      rotation: { ...prop.frame.rotation },
    };
    const mass: number = body.mass;
    const path: IAutoMovieIntegrateMotionTrajectory.ITrajectory = slide({
      from: drive.from,
      to: drive.to,
      mass,
      friction: body.friction,
      kinetic: body.kineticFriction,
      force: (seconds: number): number => {
        const force: number = drive.force(seconds);
        if (
          !Number.isFinite(force) ||
          force < 0 ||
          !Number.isFinite(force / mass)
        )
          throw new Error(
            `${prop.subject}: a force-driven slide needs a nonnegative force with finite force and acceleration at ${seconds}s`,
          );
        return force;
      },
    });
    return {
      ...prop,
      motion: (seconds: number): IAutoMovieRigidTransform => ({
        position: Vector3.add(
          frame.position,
          Vector3.scale(direction, path.at(seconds).x[0]!),
        ),
        rotation: { ...frame.rotation },
      }),
    };
  }

  /**
   * A slide's distance and speed along the push.
   *
   * Coulomb's law switches at rest: a sliding prop decelerates at the kinetic
   * friction until its speed reaches zero, and is then held by the static
   * friction for as long as the push stays within it. A fixed step that
   * straddles the stop would carry the kinetic deceleration past it, so the
   * stop is located inside its step and the integration restarted there at
   * rest: the switching point of a discontinuous right-hand side (Hairer,
   * Nørsett and Wanner, Solving Ordinary Differential Equations I, section
   * II.6, located, not yet read). The stop is the root of one sliding step's
   * speed from the step's start, found by bisection down to the resolution of a
   * double.
   *
   * @param props The prop and the force.
   * @returns The trajectory of `[distance, speed]`, the integrator's step its
   *   first piece's and its knots those of all its pieces.
   */
  export function slide(
    props: IAutoMovieMotionHumanPropDynamics.ISlide,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    const g: number = AutoMovieGravity.STANDARD;
    const sliding = (
      t: number,
      x: readonly number[],
    ): IAutoMovieIntegrateMotionTrajectory.IRate => ({
      dx: [
        x[1]!,
        (props.force(t) - props.kinetic * props.mass * g) / props.mass,
      ],
    });
    const law = (
      t: number,
      x: readonly number[],
    ): IAutoMovieIntegrateMotionTrajectory.IRate =>
      x[1]! <= 0 && props.force(t) <= props.friction * props.mass * g
        ? { dx: [0, 0] }
        : sliding(t, x);

    // One sliding step from a knot to an instant inside its step.
    const step = (
      from: number,
      x: readonly number[],
      until: number,
    ): IAutoMovieIntegrateMotionTrajectory.ITrajectory =>
      integrateMotionTrajectory({
        f: sliding,
        x0: x,
        t0: from,
        t1: until,
        h: until - from,
      });
    const pieces: {
      to: number;
      path: IAutoMovieIntegrateMotionTrajectory.ITrajectory;
    }[] = [];
    let from: number = props.from;
    let x0: readonly number[] = [0, 0];
    for (;;) {
      const path: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
        integrateMotionTrajectory({ f: law, x0, t0: from, t1: props.to });
      const knot = (k: number): number => path.times[k]!;
      let k: number = 1;
      while (
        k < path.knots &&
        !(path.at(knot(k)).x[1]! <= 0 && path.at(knot(k - 1)).x[1]! > 0)
      )
        k++;
      if (k === path.knots) {
        pieces.push({ to: props.to, path });
        break;
      }

      // The stop inside the step from knot k - 1 to knot k.
      const a: number = knot(k - 1);
      const start: readonly number[] = path.at(a).x;
      let lo: number = a;
      let hi: number = knot(k);
      if (step(a, start, hi).at(hi).x[1]! < 0)
        for (;;) {
          const mid: number = (lo + hi) / 2;
          if (!(mid > lo && mid < hi)) break;
          if (step(a, start, mid).at(mid).x[1]! > 0) lo = mid;
          else hi = mid;
        }
      const tail: IAutoMovieIntegrateMotionTrajectory.ITrajectory = step(
        a,
        start,
        hi,
      );
      pieces.push({ to: a, path }, { to: hi, path: tail });
      if (!(hi < props.to)) break;
      from = hi;
      x0 = [tail.at(hi).x[0]!, 0];
    }
    const last: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
      pieces[pieces.length - 1]!.path;
    // Each piece's knots within its own span, after the piece before it.
    const times: number[] = pieces.flatMap(
      (
        p: {
          to: number;
          path: IAutoMovieIntegrateMotionTrajectory.ITrajectory;
        },
        i: number,
      ): number[] =>
        p.path.times.filter(
          (t: number): boolean =>
            t <= p.to && (i === 0 || t > pieces[i - 1]!.to),
        ),
    );
    return {
      t0: props.from,
      t1: props.to,
      h: pieces[0]!.path.h,
      knots: times.length,
      times,
      at: (time: number): IAutoMovieIntegrateMotionTrajectory.IState =>
        (
          pieces.find((p: { to: number }): boolean => time <= p.to)?.path ??
          last
        ).at(time),
    };
  }

  /**
   * A hinged prop's turn under a torque.
   *
   * @param inertia The moment of inertia about the hinge, kg m².
   * @param torque The torque about the hinge at a second, N m. Pure.
   * @param from Start, seconds.
   * @param to End, seconds.
   * @returns The trajectory of `[angle, angular speed]`, radians.
   */
  export function hinge(
    inertia: number,
    torque: (seconds: number) => number,
    from: number,
    to: number,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    return integrateMotionTrajectory({
      f: (
        t: number,
        x: readonly number[],
      ): IAutoMovieIntegrateMotionTrajectory.IRate => ({
        dx: [x[1]!, torque(t) / inertia],
      }),
      x0: [0, 0],
      t0: from,
      t1: to,
    });
  }

  /**
   * The lean that balances a horizontal push's reaction, degrees forward, or
   * null when the body's weight cannot balance it.
   *
   * @param mass The body's mass, kilograms.
   * @param height Its centre-of-mass height, metres.
   * @param force The push, newtons, positive forward.
   * @param hands The hands' height, metres.
   * @returns Degrees, or null.
   */
  export function lean(
    mass: number,
    height: number,
    force: number,
    hands: number,
  ): number | null {
    const ratio: number =
      (force * hands) / (mass * AutoMovieGravity.STANDARD * height);
    if (Math.abs(ratio) > 1) return null;
    return (Math.asin(ratio) * 180) / Math.PI;
  }
}
