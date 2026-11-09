import { createAutoMovieRandom, deriveAutoMovieSeed, type IAutoMovieRandom } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The Bludgers' rally between the Beaters: each Bludger flies straight from
 * bat to bat at 8–12 m/s (10 m/s preferred), and a Beater swings at it
 * where its own planned flight carries the bat to the ball, never within
 * 1 s of another swing and only where a straight stretch of its flight
 * covers the swing's 0.3 s before and 0.2 s after contact; when no Beater
 * can be reached in time the Bludger flies a free leg over the Beaters'
 * stations. A forced strike (a stop of play) is reached exactly: the
 * Bludger's last legs before it run straight or with one bend at the speed
 * the time allows, and the strike sends it hard (12 m/s) toward its target.
 * After the stop no Beater swings and the Bludgers fly free legs.
 *
 * ```ts
 * const rally = BludgerRally.plan({ beaters, balls: ["B-1", "B-2"], from: 0, to: 32, until: 32, seed, stations });
 * rally.hits; // who swings at which ball, when, where and toward what
 * ```
 *
 * @evidence docs/research/quidditch/practice-play.md#beaters Beaters stay within 10–20 m of a Bludger and bat it; Bludgers fly 8–12 m/s.
 * @evidence docs/research/quidditch/practice-play.md#stopping Bludgers keep flying after play stops.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Seeded by the film seed and each ball's id.
 * @evidence contracts/development/behaviors.md#relational-goals Each swing meets the ball where the Beater's planned flight puts the bat.
 * @evidence contracts/development/implementation.md#efficient-algorithms A bounded search of 20 ms candidates per hit.
 * @evidence contracts/development/common.md#meaningful-documentation States the rally's rules.
 */
export namespace BludgerRally {
  /** A planned flight: straight stretches between timed points. */
  export interface IPoint {
    /** Film seconds. */
    t: number;

    /** Seat point, world metres. */
    p: IAutoMovieVector3;
  }

  /** One swing of a bat at a Bludger. */
  export interface IHit {
    /** The Beater. */
    beater: string;

    /** The Bludger. */
    ball: string;

    /** Contact second. */
    at: number;

    /** Contact point, world metres. */
    point: IAutoMovieVector3;

    /** Where the stroke sends the ball. */
    toward: IAutoMovieVector3;
  }

  /** A straight leg of a Bludger's flight. */
  export interface ILeg {
    /** Start second. */
    start: number;

    /** End point. */
    to: IAutoMovieVector3;

    /** Metres per second. */
    speed: number;
  }

  /** What to plan. */
  export interface IInput {
    /** Each Beater's planned flight. */
    beaters: ReadonlyMap<string, IPoint[]>;

    /** Bludger ids. */
    balls: string[];

    /** Absolute start and end, seconds. */
    from: number;
    to: number;

    /** No ordinary swing at or after this second (a stop of play). */
    until: number;

    /** Film seed. */
    seed: string;

    /** Points the free legs fly over: the Beaters' stations. */
    stations: IAutoMovieVector3[];

    /** A strike that must happen: by whom, at which ball, when, toward where. */
    forced?: { beater: string; ball: string; at: number; toward: IAutoMovieVector3 };
  }

  /** The rally. */
  export interface IPlan {
    /** Every swing, by time. */
    hits: IHit[];

    /** Each Bludger's first point and straight legs. */
    flights: Map<string, { first: IAutoMovieVector3; legs: ILeg[] }>;
  }

  /** Bludger speeds, metres per second. */
  export const SPEED = Object.freeze({ min: 8, cruise: 10, max: 12 });

  /** A swing's seconds before and after contact, and the least gap between one Beater's swings. */
  export const SWING = Object.freeze({ before: 0.3, after: 0.2, gap: 1.0 });

  /**
   * Plan the rally.
   *
   * @param input Beaters, balls, times and the forced strike.
   * @returns The swings and the Bludgers' legs.
   */
  export function plan(input: IInput): IPlan {
    const hits: IHit[] = [];
    const taken: Map<string, number[]> = new Map();
    if (input.forced) taken.set(input.forced.beater, [input.forced.at]);
    const flights: IPlan["flights"] = new Map();
    input.balls.forEach((ball: string, index: number) => {
      const random: IAutoMovieRandom = createAutoMovieRandom(deriveAutoMovieSeed(input.seed, "bludger-rally", ball));
      let draw: number = 0;
      const next = (): number => random.float(draw++);
      const home: IAutoMovieVector3 = input.stations[index % Math.max(1, input.stations.length)] ?? { x: 0, y: 15, z: 0 };
      const first: IAutoMovieVector3 = { x: home.x + (next() - 0.5) * 8, y: home.y + 1, z: home.z + (next() - 0.5) * 8 };
      const legs: ILeg[] = [];
      const own: IHit[] = [];
      const forced = input.forced?.ball === ball ? input.forced : undefined;
      const struck: IAutoMovieVector3 | undefined = forced ? hitPoint(input.beaters.get(forced.beater) ?? [], forced.at) : undefined;
      let here: IAutoMovieVector3 = first;
      let t: number = input.from;
      let last: string | undefined;
      let strike: IHit | undefined;
      for (let guard = 0; t < input.to - 0.05 && guard < 400; guard++) {
        const pending: boolean = forced !== undefined && struck !== undefined && t < forced.at;
        // An ordinary swing, when one keeps the forced strike reachable afterwards.
        const reachable = (p: IAutoMovieVector3, at: number): boolean => !pending || distance(struck!, p) / SPEED.max <= forced!.at - at - 0.5;
        const hit: IHit | undefined = t < input.until ? find(input, ball, here, t, last, taken, next, reachable) : undefined;
        if (hit) {
          legs.push({ start: t, to: hit.point, speed: distance(hit.point, here) / (hit.at - t) });
          own.push(hit);
          taken.set(hit.beater, [...(taken.get(hit.beater) ?? []), hit.at]);
          here = hit.point;
          t = hit.at;
          last = hit.beater;
          continue;
        }
        if (pending) {
          // Straight on at the speed the time allows, or with one bend when straight would be slower than 8 m/s.
          const span: number = forced!.at - t;
          const d: number = distance(struck!, here);
          if (d >= SPEED.min * span || span <= 0.05) legs.push({ start: t, to: struck!, speed: d / Math.max(0.05, span) });
          else {
            const length: number = SPEED.cruise * span;
            const mid: IAutoMovieVector3 = { x: (here.x + struck!.x) / 2, y: (here.y + struck!.y) / 2, z: (here.z + struck!.z) / 2 };
            const h: number = Math.sqrt(Math.max(0, (length / 2) ** 2 - (d / 2) ** 2));
            const along = { x: struck!.x - here.x, z: struck!.z - here.z };
            const n: number = Math.hypot(along.x, along.z) || 1;
            const side: number = next() < 0.5 ? 1 : -1;
            const bend: IAutoMovieVector3 = { x: mid.x - (along.z / n) * h * side, y: mid.y, z: mid.z + (along.x / n) * h * side };
            legs.push({ start: t, to: bend, speed: length / span }, { start: t + span / 2, to: struck!, speed: length / span });
          }
          strike = { beater: forced!.beater, ball, at: forced!.at, point: struck!, toward: forced!.toward };
          own.push(strike);
          // Struck hard toward its target.
          legs.push({ start: forced!.at, to: forced!.toward, speed: SPEED.max });
          t = forced!.at + distance(forced!.toward, struck!) / SPEED.max;
          here = forced!.toward;
          last = forced!.beater;
          continue;
        }
        // A free leg over a Beater's station.
        const station: IAutoMovieVector3 = input.stations[Math.floor(next() * input.stations.length)] ?? home;
        const aim: IAutoMovieVector3 = { x: station.x + (next() - 0.5) * 12, y: station.y + (next() - 0.5) * 4, z: station.z + (next() - 0.5) * 12 };
        // At least 3 m, so the ball never dawdles between legs.
        const reach: number = distance(aim, here);
        const to: IAutoMovieVector3 = reach >= 3 ? aim : reach < 1e-6 ? { ...here, x: here.x + 3 } : { x: here.x + ((aim.x - here.x) / reach) * 3, y: here.y + ((aim.y - here.y) / reach) * 3, z: here.z + ((aim.z - here.z) / reach) * 3 };
        const d: number = distance(to, here);
        legs.push({ start: t, to, speed: SPEED.cruise });
        t += d / SPEED.cruise;
        here = to;
      }
      // Each stroke sends the ball where its next leg goes.
      for (const hit of own) {
        const after: ILeg | undefined = legs.find((leg) => leg.start >= hit.at - 1e-9);
        hits.push(hit === strike ? hit : { ...hit, toward: after?.to ?? hit.toward });
      }
      flights.set(ball, { first, legs });
    });
    hits.sort((a, b) => a.at - b.at);
    return { hits, flights };
  }

  /**
   * Where a Beater's bat meets a ball at a second: half a metre ahead of the
   * seat point along the flight and half a metre up, at the swinging arm's
   * shoulder height. The swing carries the broom level along the stretch's
   * heading at its speed from 0.3 s before contact, so the seat is where that
   * carry puts it.
   *
   * @param timeline The Beater's planned flight.
   * @param at Contact second.
   * @returns World metres.
   */
  export function hitPoint(timeline: IPoint[], at: number): IAutoMovieVector3 {
    const k: number = segment(timeline, at);
    if (k < 0) return timeline[timeline.length - 1]?.p ?? { x: 0, y: 15, z: 0 };
    const a: IPoint = timeline[k]!;
    const b: IPoint = timeline[k + 1]!;
    const u: number = Math.max(0, (at - SWING.before - a.t) / Math.max(1e-9, b.t - a.t));
    const begun: IAutoMovieVector3 = { x: a.p.x + (b.p.x - a.p.x) * u, y: a.p.y + (b.p.y - a.p.y) * u, z: a.p.z + (b.p.z - a.p.z) * u };
    const n: number = Math.hypot(b.p.x - a.p.x, b.p.z - a.p.z) || 1;
    const ahead = { x: (b.p.x - a.p.x) / n, z: (b.p.z - a.p.z) / n };
    const carried: number = (distance(a.p, b.p) / Math.max(1e-9, b.t - a.t)) * SWING.before;
    return { x: begun.x + ahead.x * (carried + 0.5), y: begun.y + 0.5, z: begun.z + ahead.z * (carried + 0.5) };
  }

  /**
   * Whether a swing fits inside one straight, moving stretch of a Beater's
   * flight, with at least 0.1 s of flight along the stretch before the swing
   * begins and after it ends, so the swing carries the broom along this
   * stretch's line and no flight shorter than a broom's 0.1 s step is needed.
   */
  export function swingable(timeline: IPoint[], at: number): boolean {
    const k: number = segment(timeline, at);
    if (k < 0) return false;
    const a: IPoint = timeline[k]!;
    const b: IPoint = timeline[k + 1]!;
    return at - a.t >= SWING.before + 0.1 - 1e-9 && b.t - at >= SWING.after + 0.1 - 1e-9 && distance(a.p, b.p) / Math.max(1e-9, b.t - a.t) >= 1;
  }

  /** The best reachable swing at a ball from its point and second, Beater by Beater in a seeded order. */
  function find(
    input: IInput,
    ball: string,
    here: IAutoMovieVector3,
    t: number,
    last: string | undefined,
    taken: Map<string, number[]>,
    next: () => number,
    reachable: (p: IAutoMovieVector3, at: number) => boolean,
  ): IHit | undefined {
    const ids: string[] = [...input.beaters.keys()].filter((id) => id !== last);
    const shift: number = Math.floor(next() * Math.max(1, ids.length));
    const order: string[] = [...ids.slice(shift), ...ids.slice(0, shift)];
    for (const id of order) {
      const timeline: IPoint[] = input.beaters.get(id)!;
      let best: { at: number; point: IAutoMovieVector3; speed: number } | undefined;
      for (let at = t + 0.6; at < Math.min(t + 6, input.until); at += 0.02) {
        if (!swingable(timeline, at) || (taken.get(id) ?? []).some((x) => Math.abs(x - at) < SWING.gap)) continue;
        const point: IAutoMovieVector3 = hitPoint(timeline, at);
        const speed: number = distance(point, here) / (at - t);
        if (speed < SPEED.min || speed > SPEED.max || !reachable(point, at)) continue;
        if (!best || Math.abs(speed - SPEED.cruise) < Math.abs(best.speed - SPEED.cruise)) best = { at, point, speed };
      }
      if (best) return { beater: id, ball, at: best.at, point: best.point, toward: best.point };
    }
    return undefined;
  }

  /** The index of the stretch holding a second, or -1 outside the flight. */
  function segment(timeline: IPoint[], at: number): number {
    for (let k = 0; k + 1 < timeline.length; k++) if (timeline[k]!.t <= at && at <= timeline[k + 1]!.t) return k;
    return -1;
  }

  function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }
}
