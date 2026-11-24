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
    if (!(duration > 0))
      throw new Error(
        `${subject}.${articulation}: expected a positive finite duration`,
      );
    if (!(inertia > 0))
      throw new Error(
        `${subject}.${articulation}: expected a positive finite inertia`,
      );
    const start: IAutoMovieMotionHumanProp.ITrack["start"] = drive.start;

    const path: IAutoMovieIntegrateMotionTrajectory.ITrajectory = hinge(
      inertia,
      (seconds: number): number => drive.torque(seconds),
      0,
      duration,
      drive.breaks,
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
    if (drive.direction.y !== 0 || !(length > 0))
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
      ...(drive.breaks === undefined ? {} : { breaks: drive.breaks }),
      mass,
      friction: body.friction,
      kinetic: body.kineticFriction,
      force: (seconds: number): number => {
        const force: number = drive.force(seconds);
        if (!(force >= 0))
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
   * double. A second the push itself jumps at (`ISlide.breaks`) is known
   * beforehand, so the integration ends there and restarts from its state
   * (`pieces`), the push read on each side of it as that side's limit.
   *
   * @param props The prop and the force.
   * @returns The trajectory of `[distance, speed]`, the integrator's step its
   *   first piece's and its knots those of all its pieces.
   */
  export function slide(
    props: IAutoMovieMotionHumanPropDynamics.ISlide,
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    const g: number = AutoMovieGravity.STANDARD;
    const pieces: IPiece[] = [];
    let x0: readonly number[] = [0, 0];
    for (const [start, end] of spans(props.from, props.to, props.breaks)) {
      const force: (t: number) => number = (t: number): number =>
        props.force(inside(t, start, end));
      const sliding = (
        t: number,
        x: readonly number[],
      ): IAutoMovieIntegrateMotionTrajectory.IRate => ({
        dx: [x[1]!, (force(t) - props.kinetic * props.mass * g) / props.mass],
      });
      const law = (
        t: number,
        x: readonly number[],
      ): IAutoMovieIntegrateMotionTrajectory.IRate =>
        x[1]! <= 0 && force(t) <= props.friction * props.mass * g
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
      let from: number = start;
      for (;;) {
        const path: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
          integrateMotionTrajectory({ f: law, x0, t0: from, t1: end });
        const knot = (k: number): number => path.times[k]!;
        let k: number = 1;
        while (
          k < path.knots &&
          !(path.at(knot(k)).x[1]! <= 0 && path.at(knot(k - 1)).x[1]! > 0)
        )
          k++;
        if (k === path.knots) {
          pieces.push({ to: end, path });
          x0 = path.at(end).x;
          break;
        }
        // The stop inside the step from knot k - 1 to knot k.
        const a: number = knot(k - 1);
        const begin: readonly number[] = path.at(a).x;
        let lo: number = a;
        let hi: number = knot(k);
        if (step(a, begin, hi).at(hi).x[1]! < 0)
          for (;;) {
            const mid: number = (lo + hi) / 2;
            if (!(mid > lo && mid < hi)) break;
            if (step(a, begin, mid).at(mid).x[1]! > 0) lo = mid;
            else hi = mid;
          }
        const tail: IAutoMovieIntegrateMotionTrajectory.ITrajectory = step(
          a,
          begin,
          hi,
        );
        pieces.push({ to: a, path }, { to: hi, path: tail });
        x0 = [tail.at(hi).x[0]!, 0];
        if (!(hi < end)) break;
        from = hi;
      }
    }
    return joined(props.from, props.to, pieces);
  }

  /**
   * A hinged prop's turn under a torque, the integration ended and restarted at
   * each second the torque jumps at, the torque read on each side of it as that
   * side's limit.
   *
   * @param inertia The moment of inertia about the hinge, kg m².
   * @param torque The torque about the hinge at a second, N m. Pure.
   * @param from Start, seconds.
   * @param to End, seconds.
   * @param breaks The seconds the torque jumps at, none when absent.
   * @returns The trajectory of `[angle, angular speed]`, radians.
   */
  export function hinge(
    inertia: number,
    torque: (seconds: number) => number,
    from: number,
    to: number,
    breaks?: readonly number[],
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    const pieces: IPiece[] = [];
    let x0: readonly number[] = [0, 0];
    for (const [start, end] of spans(from, to, breaks)) {
      const path: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
        integrateMotionTrajectory({
          f: (
            t: number,
            x: readonly number[],
          ): IAutoMovieIntegrateMotionTrajectory.IRate => ({
            dx: [x[1]!, torque(inside(t, start, end)) / inertia],
          }),
          x0,
          t0: start,
          t1: end,
        });
      pieces.push({ to: end, path });
      x0 = path.at(end).x;
    }
    return joined(from, to, pieces);
  }

  /** One integrated stretch of a drive, read up to its last second. */
  interface IPiece {
    to: number;
    path: IAutoMovieIntegrateMotionTrajectory.ITrajectory;
  }

  /**
   * A drive's stretches between the seconds its input jumps at, those strictly
   * inside it, ascending and distinct.
   */
  function spans(
    from: number,
    to: number,
    breaks: readonly number[] = [],
  ): [number, number][] {
    const cuts: number[] = [
      from,
      ...[...breaks]
        .filter((t: number): boolean => t > from && t < to)
        .sort((a: number, b: number): number => a - b)
        .filter(
          (t: number, i: number, all: number[]): boolean =>
            i === 0 || t > all[i - 1]!,
        ),
      to,
    ];
    return cuts
      .slice(1)
      .map((end: number, i: number): [number, number] => [cuts[i]!, end]);
  }

  /**
   * A second held strictly inside a stretch, one rounding step in from each
   * end, so an input that jumps at an end is read as this stretch's side of
   * it.
   */
  function inside(t: number, start: number, end: number): number {
    const ulp: (x: number) => number = (x: number): number =>
      Math.max(Number.MIN_VALUE, Math.abs(x) * Number.EPSILON);
    return Math.min(end - ulp(end), Math.max(start + ulp(start), t));
  }

  /** The stretches' trajectories as one, each piece's knots within its span. */
  function joined(
    from: number,
    to: number,
    pieces: readonly IPiece[],
  ): IAutoMovieIntegrateMotionTrajectory.ITrajectory {
    const last: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
      pieces[pieces.length - 1]!.path;
    const times: number[] = pieces.flatMap((p: IPiece, i: number): number[] =>
      p.path.times.filter(
        (t: number): boolean => t <= p.to && (i === 0 || t > pieces[i - 1]!.to),
      ),
    );
    return {
      t0: from,
      t1: to,
      h: pieces[0]!.path.h,
      knots: times.length,
      times,
      at: (time: number): IAutoMovieIntegrateMotionTrajectory.IState =>
        (pieces.find((p: IPiece): boolean => time <= p.to)?.path ?? last).at(
          time,
        ),
    };
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
