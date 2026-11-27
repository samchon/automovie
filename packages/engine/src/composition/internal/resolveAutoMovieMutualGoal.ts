import type {
  IAutoMovieResolveMutualGoal,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { bracketedCrossing } from "../../math/internal/bracketedCrossing";

/*
 * The point where two people's hands meet when both reach for it: a handshake's
 * clasp, a handover's exchange, a high five.
 *
 * Neither person's goal is the other's hand, which moves; both aim at one
 * shared point both can reach comfortably, the way joint-action studies find
 * people converge on it. Each person has a comfortable reach, the
 * shoulder-to-hand distance of the family's working elbow flexion, and the
 * point is where both arms are at it at once: in the vertical plane through the
 * two acting shoulders, the lower of the two points that lie one comfortable
 * reach from each shoulder, so the hands meet below the line between the
 * shoulders. For two equal people that is the midpoint between them, where
 * human-human handovers take place (Hansen et al. 2017, Human-human handover
 * tasks and how distance and object mass matter, Perceptual and Motor Skills
 * 124(1), reviewed by Kopnarski et al. 2023, Front. Psychol. 14:1147296),
 * `sqrt(reach^2 - h^2)` below the shoulders at the horizontal half gap `h`.
 * Between people of unequal stature the same rule moves the point up and toward
 * the taller one, who reaches down more steeply and less far forward while the
 * shorter one reaches forward: the exchange height rises with stature
 * (Sutiphotinun et al. 2020, reviewed by Kopnarski 2023). The rule for unequal
 * partners is provisional, as no study of the clasp point of partners of
 * unequal stature or arm length was located; it replaces a horizontal division
 * with a mean height that left the taller partner's arm straight at the end of
 * its reach.
 *
 * Shoulders farther apart than the two comfortable reaches leave no such point,
 * so both arms extend by one common factor of their comfortable reaches and the
 * hands meet on the line between the shoulders; shoulders nearer than the
 * difference of the reaches shorten both the same way. An action that has its
 * own preferred contact height (`height`, as an object is handed over at chest
 * height) passes it: the point then lies at that height where both arms are the
 * same fraction of their comfortable reaches (by a bracketed crossing along the
 * horizontal line between the shoulders, on which one distance grows as the
 * other shrinks), and the height is moved to the nearest one inside the band
 * both straight arms reach there.
 *
 * A meeting is refused, not stretched, when it lies beyond a straight arm: the
 * error gives both limits and the widest horizontal shoulder gap the pair can
 * close, so the author moves the people instead of receiving an arm torn off
 * its shoulder.
 * Parameter input: Both sides' acting shoulders and reaches.
 * Returns: The meeting point and each side's shoulder distance to it.
 * When a reach is not positive or exceeds its limit, the
 * shoulders coincide, or the point lies beyond a limit.
 */
export function resolveAutoMovieMutualGoal(
  input: IAutoMovieResolveMutualGoal.IInput,
): IAutoMovieResolveMutualGoal.IGoal {
  const a: IAutoMovieResolveMutualGoal.ISide = input.a;
  const b: IAutoMovieResolveMutualGoal.ISide = input.b;
  for (const side of [a, b])
    if (!(side.reach > 0 && side.limit >= side.reach))
      throw new Error(
        `A mutual goal needs 0 < reach <= limit, but had reach ${side.reach} and limit ${side.limit}`,
      );
  const span: IAutoMovieVector3 = Vector3.subtract(b.shoulder, a.shoulder);
  const apart: number = Vector3.length(span);
  if (!(apart > 1e-9))
    throw new Error("A mutual goal needs two shoulders at different places");
  const gap: number = Math.hypot(span.x, span.z);
  const refuse = (closable: number): Error =>
    new Error(
      `The hands cannot meet: no point lies within both arms' reach of ${a.limit.toFixed(3)} m and ${b.limit.toFixed(3)} m at a shoulder gap of ${gap.toFixed(3)} m; bring the shoulders within about ${closable.toFixed(3)} m of each other`,
    );
  const done = (
    point: IAutoMovieVector3,
  ): IAutoMovieResolveMutualGoal.IGoal => ({
    point,
    distance: [
      Vector3.length(Vector3.subtract(point, a.shoulder)),
      Vector3.length(Vector3.subtract(point, b.shoulder)),
    ],
  });

  if (input.height === undefined) {
    // The common factor both comfortable reaches are scaled by: 1 while the
    // two spheres intersect, else the nearest factor at which they touch.
    const factor: number = Math.min(
      Math.max(1, apart / (a.reach + b.reach)),
      apart / Math.abs(a.reach - b.reach),
    );
    const most: number = Math.min(a.limit / a.reach, b.limit / b.reach);
    if (factor > most) {
      const widest: number = most * (a.reach + b.reach);
      throw refuse(Math.sqrt(Math.max(0, widest * widest - span.y * span.y)));
    }
    const axis: IAutoMovieVector3 = Vector3.scale(span, 1 / apart);
    const reach: number = factor * a.reach;
    const along: number =
      (reach * reach - factor * factor * b.reach * b.reach + apart * apart) /
      (2 * apart);
    const off: number = Math.sqrt(Math.max(0, reach * reach - along * along));
    // Downward across the line between the shoulders; one shoulder straight
    // above the other leaves no such direction and no offset to place.
    const down: IAutoMovieVector3 = Vector3.subtract(
      { x: 0, y: -1, z: 0 },
      Vector3.scale(axis, -axis.y),
    );
    const length: number = Vector3.length(down);
    return done(
      Vector3.add(
        Vector3.add(a.shoulder, Vector3.scale(axis, along)),
        length > 1e-9
          ? Vector3.scale(down, off / length)
          : { x: 0, y: 0, z: 0 },
      ),
    );
  }

  // A preferred height: along the horizontal line between the shoulders, the
  // place where both arms are the same fraction of their comfortable reaches.
  const preferred: number = input.height;
  const meet = (g: number): { share: number; low: number; high: number } => {
    const excess = (t: number): number =>
      Math.hypot(t, preferred - a.shoulder.y) * b.reach -
      Math.hypot(g - t, preferred - b.shoulder.y) * a.reach;
    let lo: number = 0;
    let hi: number = g;
    const near: number = excess(lo);
    const far: number = near >= 0 ? near : excess(hi);
    if (near >= 0) hi = lo;
    else if (far <= 0) lo = hi;
    else {
      // The excess is continuous along the line, so its crossing is closed
      // to the width `HALVINGS` bisections leave by false position and, for
      // whatever width that leaves, by bisection (`bracketedCrossing`).
      const closed: { low: number; high: number } = bracketedCrossing({
        f: excess,
        past: (value: number): boolean => !(value < 0),
        low: lo,
        high: hi,
        known: { low: near, high: far },
        tolerance: (hi - lo) * 2 ** -HALVINGS,
      });
      lo = closed.low;
      hi = closed.high;
    }
    const t: number = (lo + hi) / 2;
    // The heights each straight arm reaches at its horizontal distance.
    const reachA: number = Math.sqrt(Math.max(0, a.limit * a.limit - t * t));
    const reachB: number = Math.sqrt(
      Math.max(0, b.limit * b.limit - (g - t) * (g - t)),
    );
    const beyond: boolean = t > a.limit || g - t > b.limit;
    return {
      share: g > 1e-9 ? t / g : 0,
      low: beyond
        ? Infinity
        : Math.max(a.shoulder.y - reachA, b.shoulder.y - reachB),
      high: beyond
        ? -Infinity
        : Math.min(a.shoulder.y + reachA, b.shoulder.y + reachB),
    };
  };
  const { share, low, high } = meet(gap);
  if (low > high) {
    // The widest closable gap, by bisection: the shared band only narrows as
    // the gap widens.
    // The band's width is not finite beyond a straight arm, where the
    // crossing search halves instead (`bracketedCrossing`).
    const widest: number = a.limit + b.limit;
    throw refuse(
      bracketedCrossing({
        f: (mid: number): number => {
          const band: { low: number; high: number } = meet(mid);
          return band.low - band.high;
        },
        past: (short: number): boolean => !(short <= 0),
        low: 0,
        high: widest,
        tolerance: widest * 2 ** -HALVINGS,
      }).low,
    );
  }
  return done({
    x: a.shoulder.x + share * span.x,
    y: Math.min(high, Math.max(low, preferred)),
    z: a.shoulder.z + share * span.z,
  });
}

/*
 * The bisections whose final bracket width both crossing searches close to: a
 * bracket of metres to the last digits of a double.
 */
const HALVINGS: number = 50;
