import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A resolved framing held on the apron, the strip outside the ropes where a
 * fight's handheld operators stand: never inside the fighting square, never
 * beyond the canvas edge. A framing that wants the lens inside the ropes
 * backs out along its own sightline to the rope line; one that wants it
 * beyond the canvas stops at the edge and the operator raises the camera
 * toward the framing distance, but never above the height he can hold it
 * overhead. The ropes occlude, and each standpoint clears them its own way:
 * the far wide camera looks down from well over the top rope, so the ropes
 * pass below the fighters' feet; an apron handheld shoots through the gap
 * between two ropes (or under the bottom one) that holds its subjects' upper
 * bodies, never at a rope's height where the rope would fill the frame.
 *
 * ```ts
 * RopeLens.hold(resolveAutoMovieFraming(goal, spheres), ring, goal.elevation, overhead, spheres, "between");
 * ```
 *
 * @evidence docs/research/cinematography/fight-coverage.md#practice Handheld operators work from the apron outside the ropes and shoot between them; the wide camera looks down over the top rope; nobody films from inside the fighting square.
 * @evidence docs/research/cinematography/fight-coverage.md#law The camera rises no higher than an operator can hold it overhead.
 */
export namespace RopeLens {
  /**
   * How a standpoint clears the ropes: `over` the top rope, as the far wide
   * camera does, or `between` two ropes, as an apron handheld does.
   */
  export type Clearance = "over" | "between";

  /**
   * Least height of the wide camera's lens over the top rope, metres: the
   * broadcast wide camera's lens stands about 1 to 1.5 m above it.
   */
  export const OVER_TOP: number = 1;

  /**
   * Least gap kept between the lens and any rope, metres: a 2 cm rope's
   * radius and the lens's own hood, so no rope ever fills the frame.
   */
  export const ROPE_GAP: number = 0.08;

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

  /** A framed subject's bounding sphere, world metres. */
  export interface ISubject {
    /** Sphere centre. */
    center: IAutoMovieVector3;

    /** Sphere radius. */
    radius: number;
  }

  /**
   * The lens of a framing held on the apron, its sightlines to the subjects
   * clear of the ropes.
   *
   * @param frame The resolved framing's position and target.
   * @param apron The rope line and canvas edge.
   * @param elevation The framing's elevation above the target, radians.
   * @param overhead Greatest lens height a canvas stop may raise it to, metres: the operator's overhead reach.
   * @param subjects The framed subjects, whose bodies the ropes must not cross.
   * @param clearance How the standpoint clears the ropes.
   * @returns The held lens.
   */
  export function hold(
    frame: { position: IAutoMovieVector3; target: IAutoMovieVector3 },
    apron: IApron,
    elevation: number,
    overhead: number,
    subjects: readonly ISubject[] = [],
    clearance: Clearance = "between",
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
    // A handheld puts its lens through the ropes, at the rope line on its
    // sightline, so no rope of the near side crosses the frame.
    if (clearance === "between" && apron.ropes.length !== 0) {
      const lens: IAutoMovieVector3 = through(
        { x, y: 0, z },
        frame.target,
        apron,
      );
      x = lens.x;
      z = lens.z;
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
    return {
      position: {
        x,
        y: clear(
          { x, z },
          frame.target.y + rise,
          subjects,
          apron,
          overhead,
          clearance,
        ),
        z,
      },
      target: frame.target,
      clamped,
    };
  }

  /**
   * A lens height whose sightlines the ropes do not cross and that no rope
   * fills. Over the top rope: at least {@link OVER_TOP} above it, and high
   * enough that every subject is seen whole from the floor nearest the lens
   * up, within the lens's reach. Between the ropes: the gap (the canvas to
   * the bottom rope counting as one) through which every subject's upper
   * body, head to sphere centre, shows, the lens itself at least
   * {@link ROPE_GAP} from both its ropes, nearest the wanted height; failing
   * every subject, the lens alone kept in the gap nearest the wanted height.
   *
   * @param lens The lens's floor point.
   * @param wanted The height the framing wants, metres.
   * @param subjects The framed subjects.
   * @param apron The rope line and its rope heights.
   * @param overhead Greatest lens height, metres.
   * @param clearance How the standpoint clears the ropes.
   * @returns The lens height, metres.
   */
  export function clear(
    lens: { x: number; z: number },
    wanted: number,
    subjects: readonly ISubject[],
    apron: IApron,
    overhead: number,
    clearance: Clearance = "between",
  ): number {
    if (apron.ropes.length === 0) return wanted;
    // A sightline to a point at height h crossing the rope line at share c
    // is at y (1 - c) + h c there.
    const sights = subjects.flatMap((s) => {
      const dx: number = lens.x - s.center.x;
      const dz: number = lens.z - s.center.z;
      const l: number = Math.hypot(dx, dz) || 1;
      const foot = {
        x: s.center.x + (dx / l) * s.radius,
        z: s.center.z + (dz / l) * s.radius,
      };
      const c: number = ropeCrossing(lens, s.center, apron.half);
      const f: number = ropeCrossing(lens, foot, apron.half);
      return c < 1 && f < 1
        ? [
            { h: 0, c: f, upper: false },
            { h: s.center.y, c, upper: true },
            { h: s.center.y + s.radius, c, upper: true },
          ]
        : [];
    });
    const ropes: number[] = [...apron.ropes].sort((p, q) => p - q);
    const top: number = ropes[ropes.length - 1]!;
    if (clearance === "over")
      return Math.min(
        overhead,
        Math.max(
          wanted,
          top + OVER_TOP,
          ...sights.map((s) => (top + ROPE_GAP - s.h * s.c) / (1 - s.c)),
        ),
      );
    const gaps: [number, number][] = ropes.map((r, k) => [
      k === 0 ? 0 : ropes[k - 1]!,
      r,
    ]);
    const nearest = (
      bound: (gap: [number, number]) => [number, number],
    ): number | undefined => {
      let best: number | undefined;
      for (const gap of gaps) {
        const [lo, hi] = bound(gap);
        if (lo > hi) continue;
        const y: number = Math.max(lo, Math.min(hi, wanted));
        if (
          best === undefined ||
          Math.abs(y - wanted) < Math.abs(best - wanted)
        )
          best = y;
      }
      return best;
    };
    // The lens itself stays clear of the gap's two ropes.
    const own = ([below, above]: [number, number]): [number, number] => [
      below === 0 ? ROPE_GAP : below + ROPE_GAP,
      Math.min(overhead, above - ROPE_GAP),
    ];
    return (
      nearest((gap) => {
        let [lo, hi] = own(gap);
        for (const s of sights.filter((t) => t.upper)) {
          lo = Math.max(lo, (gap[0] - s.h * s.c) / (1 - s.c));
          hi = Math.min(hi, (gap[1] - s.h * s.c) / (1 - s.c));
        }
        return [lo, hi];
      }) ??
      nearest(own) ??
      wanted
    );
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
   * A lens point brought through the ropes: a point out on the apron moves
   * along its floor sightline toward the target to the rope line, where a
   * handheld puts its lens between two ropes; a point already at or inside
   * the rope line, or whose sightline never crosses it, stays.
   *
   * @param p The lens point.
   * @param target The look-at point.
   * @param apron The rope line.
   * @returns The lens point at the rope line.
   */
  export function through(
    p: IAutoMovieVector3,
    target: { x: number; z: number },
    apron: Pick<IApron, "half">,
  ): IAutoMovieVector3 {
    const share: number = ropeCrossing(p, target, apron.half);
    return share > 0 && share < 1
      ? {
          ...p,
          x: p.x + (target.x - p.x) * share,
          z: p.z + (target.z - p.z) * share,
        }
      : p;
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
