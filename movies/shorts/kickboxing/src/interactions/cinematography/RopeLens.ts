import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A resolved framing held on the apron, the strip outside the ropes where a
 * fight's handheld operators stand: never inside the fighting square, never
 * beyond the canvas edge. A framing that wants the lens inside the ropes
 * backs out along its own sightline to the rope line; one that wants it
 * beyond the canvas stops at the edge and the operator raises the camera
 * toward the framing distance, but never above the height he can hold it
 * overhead.
 *
 * ```ts
 * RopeLens.hold(resolveAutoMovieFraming(goal, spheres), ring, goal.elevation, overhead);
 * ```
 *
 * @evidence docs/research/cinematography/fight-coverage.md#practice Handheld operators work from the apron outside the ropes; nobody films from inside the fighting square.
 * @evidence docs/research/cinematography/fight-coverage.md#law The camera rises no higher than an operator can hold it overhead.
 */
export namespace RopeLens {
  /** A held lens. */
  export interface IHeld {
    /** Lens position, world metres. */
    position: IAutoMovieVector3;

    /** Look-at point, world metres. */
    target: IAutoMovieVector3;

    /** Whether the canvas edge held the lens back from the framing's position. */
    clamped: boolean;
  }

  /** The apron's inner and outer edges: the rope line and the canvas edge, as half sides of their squares about the ring's centre. */
  export interface IApron {
    /** Half the side of the fighting square inside the ropes, metres. */
    half: number;

    /** Half the side of the canvas, metres. */
    canvasHalf: number;

    /** Rope heights above the canvas, metres. */
    ropes: readonly number[];
  }

  /**
   * The lens of a framing held on the apron.
   *
   * @param frame The resolved framing's position and target.
   * @param apron The rope line and canvas edge.
   * @param elevation The framing's elevation above the target, radians.
   * @param overhead Greatest lens height a canvas stop may raise it to, metres: the operator's overhead reach.
   * @returns The held lens.
   */
  export function hold(
    frame: { position: IAutoMovieVector3; target: IAutoMovieVector3 },
    apron: IApron,
    elevation: number,
    overhead: number,
  ): IHeld {
    const limit: number = apron.canvasHalf;
    let x: number = Math.max(-limit, Math.min(limit, frame.position.x));
    let z: number = Math.max(-limit, Math.min(limit, frame.position.z));
    const clamped: boolean = x !== frame.position.x || z !== frame.position.z;
    if (Math.max(Math.abs(x), Math.abs(z)) < apron.half) {
      // Back out along the floor sightline until the lens meets the ropes.
      const dx: number = x - frame.target.x;
      const dz: number = z - frame.target.z;
      const l: number = Math.hypot(dx, dz) || 1;
      const ux: number = l === 0 ? 1 : dx / l;
      const uz: number = l === 0 ? 0 : dz / l;
      const exit = (p: number, u: number): number =>
        u > 0 ? (apron.half - p) / u : u < 0 ? (-apron.half - p) / u : Infinity;
      const s: number = Math.min(exit(x, ux), exit(z, uz));
      x += ux * s;
      z += uz * s;
    }
    const run: number = Math.hypot(x - frame.target.x, z - frame.target.z);
    const needed: number = Math.hypot(
      frame.position.x - frame.target.x,
      frame.position.y - frame.target.y,
      frame.position.z - frame.target.z,
    );
    const level: number = run * Math.tan(elevation);
    const rise: number = clamped
      ? Math.max(
          level,
          Math.min(
            overhead - frame.target.y,
            Math.sqrt(Math.max(0, needed * needed - run * run)),
          ),
        )
      : level;
    // The lens shoots over the top rope: the sightline to the floor under the
    // target passes above it where it crosses the rope line, as high as the
    // operator or the wide camera reaches.
    const top: number = Math.max(0, ...apron.ropes);
    const crossing: number = ropeCrossing({ x, z }, frame.target, apron.half);
    const over: number = crossing < 1 ? top / (1 - crossing) : 0;
    return {
      position: {
        x,
        y: Math.max(frame.target.y + rise, Math.min(over, overhead)),
        z,
      },
      target: frame.target,
      clamped,
    };
  }

  /**
   * Where the floor sightline from a lens to a target first meets the rope
   * line, as a share of the way: 0 for a lens on the ropes, 1 or more when
   * it never crosses.
   *
   * @param lens The lens's floor point.
   * @param target The target's floor point.
   * @param half Half the side of the fighting square inside the ropes, metres.
   * @returns The share of the floor sightline.
   */
  export function ropeCrossing(
    lens: { x: number; z: number },
    target: { x: number; z: number },
    half: number,
  ): number {
    if (Math.max(Math.abs(lens.x), Math.abs(lens.z)) <= half) return 0;
    const dx: number = target.x - lens.x;
    const dz: number = target.z - lens.z;
    let enter: number = 0;
    for (const [p, d] of [
      [lens.x, dx],
      [lens.z, dz],
    ] as const) {
      if (Math.abs(p) <= half) continue;
      if (d === 0 || Math.sign(d) === Math.sign(p)) return Infinity;
      enter = Math.max(enter, (Math.abs(p) - half) / Math.abs(d));
    }
    return enter;
  }

  /**
   * A lens point kept on the apron: a point the operator's follow has carried
   * inside the ropes steps back to the nearest rope side.
   *
   * @param p The point.
   * @param apron The rope line and canvas edge.
   * @returns The point on the apron.
   */
  export function onApron(
    p: IAutoMovieVector3,
    apron: IApron,
  ): IAutoMovieVector3 {
    if (Math.max(Math.abs(p.x), Math.abs(p.z)) >= apron.half) return p;
    return Math.abs(p.x) >= Math.abs(p.z)
      ? { ...p, x: (p.x < 0 ? -1 : 1) * apron.half }
      : { ...p, z: (p.z < 0 ? -1 : 1) * apron.half };
  }
}
