import { AutoMovieComposition, createAutoMovieRandom, deriveAutoMovieSeed, type IAutoMovieRandom } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Student } from "../../entities/cast/student/Student";
import type { StudentChain } from "../../entities/cast/student/StudentChain";
import type { IStageSet } from "../../entities/sets/IStageSet";
import { BroomLaw } from "../../laws/flight/BroomLaw";
import { StageAction } from "../../laws/staging/StageAction";
import { BludgerRally } from "./BludgerRally";

/**
 * The twelve supporting players' practice play for a stretch of film, with
 * the balls: every player flies seeded straight stretches around its home
 * station at its role's speed (Chasers 7 m/s within 8 m, Beaters 8 m/s
 * within 10 m, Keepers 3 m/s across their goal front), so nobody hovers
 * idle; the Quaffle passes between Chasers every 2–5 s (or at the scene's
 * own passes) between the players' actual positions, and the last receiver
 * keeps it; the Bludgers rally between the Beaters' bats (see
 * `BludgerRally`). A stop of play: the named Beater bats the named Bludger
 * toward a place at the stop's second, turns his head to the watched rider
 * and raises his arm within 1 s; everyone else turns the head to that rider
 * at once and brakes to a hover facing it; the rescuer instead flies to a
 * station 3.5 m beside the watched rider and escorts it.
 *
 * ```ts
 * PracticePlay.compose({ set: pitch, players, from: 0, to: 60, seed, quaffle: "quaffle", bludgers: ["B-1", "B-2"],
 *   stop: { at: 31, by: "G-B1", strike: "B-2", toward: "eastRunoff", watch: "harry", rescuer: "G-K" } });
 * ```
 *
 * @evidence docs/research/quidditch/practice-play.md#chasers Triangles 8–15 m apart, a pass every 2–5 s, passes of 8–15 m in 0.8–1.5 s.
 * @evidence docs/research/quidditch/practice-play.md#keepers Patrols within 10 m of the middle hoop, facing the ball.
 * @evidence docs/research/quidditch/practice-play.md#beaters Beaters stay within 10–20 m of a Bludger and bat it; Bludgers fly 8–12 m/s.
 * @evidence docs/research/quidditch/practice-play.md#stopping A Beater's raised arm stops play; everyone holds and turns toward the trouble within 2 s; Bludgers keep flying; nobody within 3 m of a rescue.
 * @evidence docs/research/flight/broom-riding.md#speed Braking under 3 m/s².
 * @evidence docs/body/settings/crowds/practice-teams.md#in-play No rider hovers idle more than 2 s.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Seeded by the film seed and each player's id.
 * @evidence contracts/development/behaviors.md#relational-goals Passes, swings and the escort meet the other party's actual flight.
 * @evidence contracts/development/common.md#meaningful-documentation States the patterns and the stop.
 */
export namespace PracticePlay {
  /** A stop of play. */
  export interface IStop {
    /** The second play stops: the strike's contact, or the stop itself without one. */
    at: number;

    /** Where the struck Bludger goes, or the trouble everyone faces without a watched rider. */
    toward: string | IAutoMovieVector3;

    /** The Beater who strikes. */
    by?: string;

    /** The Bludger he strikes. */
    strike?: string;

    /** The rider everyone turns to, and the rescuer escorts. */
    watch?: string;

    /** The player who flies to the watched rider (or to the trouble) and holds 3.5 m off. */
    rescuer?: string;

    /** The watched rider's side the rescuer keeps; left by default. */
    side?: "left" | "right";
  }

  /** What to play. */
  export interface IInput {
    /** The pitch, with `station.<id>` places. */
    set: IStageSet;

    /** The twelve players. */
    players: Student[];

    /** Absolute start and end, seconds. */
    from: number;
    to: number;

    /** Film seed. */
    seed: string;

    /** Quaffle and Bludger prop ids. */
    quaffle?: string;
    bludgers?: string[];

    /** Each Beater's bat: a prop id held in the right hand, or the id and the batting hand. Held from the start and swung with that hand. */
    bats?: Record<string, string | { id: string; hand: "left" | "right" }>;

    /** Passes the scene requires, by player id and absolute second; generated ones fill the rest. */
    passes?: { from: string; to: string; at: number }[];

    /** A stop of play. */
    stop?: IStop;
  }

  /** Seconds the striker's head takes to come round to the watched rider. */
  const LOOK: number = 0.4;

  /** The players' and balls' composition. */
  export function compose(input: IInput): AutoMovieComposition {
    const stop: IStop | undefined = input.stop;
    const trouble: IAutoMovieVector3 | undefined = stop === undefined ? undefined : typeof stop.toward === "string" ? input.set.places[stop.toward]!.point : stop.toward;
    const striker: string | undefined = stop?.by !== undefined && stop.strike !== undefined ? stop.by : undefined;
    // 1. Each player's planned flight: straight stretches between timed points.
    const plans: Map<string, { player: Student; role: "C" | "B" | "K"; station: IAutoMovieVector3; timeline: BludgerRally.IPoint[] }> = new Map();
    for (const player of input.players) {
      const role: "C" | "B" | "K" = player.id.includes("-C") ? "C" : player.id.includes("-B") ? "B" : "K";
      const station: IAutoMovieVector3 = input.set.places[`station.${player.id}`]?.point ?? { x: 0, y: 13, z: 0 };
      const random: IAutoMovieRandom = createAutoMovieRandom(deriveAutoMovieSeed(input.seed, "practice-play", player.id));
      const end: number = stop === undefined ? input.to : player.id === striker ? stop.at - 1.0 : Math.min(input.to, stop.at);
      const timeline: BludgerRally.IPoint[] = loops(role, station, random, input.from + 0.01, end);
      if (player.id === striker && trouble !== undefined) {
        // The striker's last stretch runs straight through the contact toward where he sends the ball.
        const here: IAutoMovieVector3 = timeline[timeline.length - 1]!.p;
        const toward = { x: trouble.x - here.x, z: trouble.z - here.z };
        const n: number = Math.hypot(toward.x, toward.z) || 1;
        const span: number = 1.0 + BludgerRally.SWING.after;
        timeline.push({ t: stop!.at + BludgerRally.SWING.after, p: { x: here.x + (toward.x / n) * 8 * span, y: here.y, z: here.z + (toward.z / n) * 8 * span } });
      }
      plans.set(player.id, { player, role, station, timeline });
    }
    // 2. The Bludgers' rally between the Beaters' planned flights.
    const beaters: Map<string, BludgerRally.IPoint[]> = new Map([...plans.values()].filter((p) => p.role === "B").map((p) => [p.player.id, p.timeline]));
    const rally: BludgerRally.IPlan = BludgerRally.plan({
      beaters,
      balls: input.bludgers ?? [],
      from: input.from,
      to: input.to,
      until: stop?.at ?? input.to,
      seed: input.seed,
      stations: [...plans.values()].filter((p) => p.role === "B").map((p) => p.station),
      ...(striker !== undefined && trouble !== undefined ? { forced: { beater: striker, ball: stop!.strike!, at: stop!.at, toward: trouble } } : {}),
    });
    // 3. Chains: fly the stretches, swinging where the rally says, then the stop.
    const parts: AutoMovieComposition[] = [];
    const after: Map<string, BludgerRally.IPoint[]> = new Map();
    for (const { player, role, station, timeline } of plans.values()) {
      const held = input.bats?.[player.id];
      const bat: { id: string; hand: "left" | "right" } | undefined = held === undefined ? undefined : typeof held === "string" ? { id: held, hand: "right" } : held;
      let chain: StudentChain = player
        .enter(station, { riding: `broom-${player.id}`, heading: role === "K" ? (station.x > 0 ? -Math.PI / 2 : Math.PI / 2) : 0, ...(bat === undefined ? {} : { holds: { [bat.hand]: bat.id } }) })
        .hold(0.01, { start: input.from });
      const swings: BludgerRally.IHit[] = rally.hits.filter((h) => h.beater === player.id);
      for (let k = 1; k < timeline.length; k++) {
        const a: BludgerRally.IPoint = timeline[k - 1]!;
        const b: BludgerRally.IPoint = timeline[k]!;
        const speed: number = Math.max(0.5, Math.hypot(b.p.x - a.p.x, b.p.y - a.p.y, b.p.z - a.p.z) / Math.max(1e-6, b.t - a.t));
        let t: number = a.t;
        for (const swing of swings.filter((h) => h.at > a.t && h.at <= b.t + 1e-9)) {
          // Fly on to where the swing starts; the swing itself carries the broom along this stretch.
          const begin: number = swing.at - BludgerRally.SWING.before;
          if (begin - t > 1e-3) chain = chain.fly(along(a, b, begin), { speed });
          chain = chain.strike(swing.ball, swing.toward, { hand: bat?.hand ?? "right" });
          t = swing.at + BludgerRally.SWING.after;
        }
        if (b.t - t > 0.02) chain = chain.fly(b.p, { speed });
      }
      if (stop !== undefined && trouble !== undefined && timeline[timeline.length - 1]!.t < input.to) {
        const watched: { id: string } | IAutoMovieVector3 = stop.watch !== undefined ? { id: stop.watch } : trouble;
        const last: BludgerRally.IPoint = timeline[timeline.length - 1]!;
        const before: BludgerRally.IPoint = timeline[timeline.length - 2] ?? last;
        const speed: number = Math.hypot(last.p.x - before.p.x, last.p.y - before.p.y, last.p.z - before.p.z) / Math.max(1e-6, last.t - before.t);
        if (player.id === striker) {
          // His head follows the ball onto the watched rider and his arm goes up within a second of the strike.
          chain = chain.lookAt(watched).stopPlay().hover({ facing: watched });
        } else if (player.id === stop.rescuer) {
          chain =
            stop.watch !== undefined
              ? chain.lookAt(watched).escort({ id: stop.watch }, { seconds: Math.max(0.1, input.to - last.t - LOOK), distance: 3.5, side: stop.side ?? "left" })
              : chain.fly(beside(last.p, trouble), { speed: BroomLaw.ESCORT_SPEED }).hover({ facing: trouble });
        } else {
          chain = chain.lookAt(watched).hover({ facing: watched });
          after.set(player.id, [...timeline, ...braking(before.p, last, speed)]);
        }
      }
      if (!after.has(player.id)) after.set(player.id, timeline);
      parts.push(AutoMovieComposition.sequence(chain, StageAction.intent(player.id, { kind: "until", seconds: input.to })));
    }
    // 4. The Quaffle between Chasers; the last receiver keeps it.
    if (input.quaffle !== undefined) parts.push(...quaffle(input, after));
    // 5. The Bludgers' legs.
    for (const [ball, flight] of rally.flights)
      flight.legs.forEach((leg: BludgerRally.ILeg, k: number) => {
        const route: StageAction.Target[] = k === 0 ? [{ point: flight.first }, { point: leg.to }] : [{ point: leg.to }];
        parts.push(AutoMovieComposition.of(StageAction.intent(ball, { kind: "path", route, speed: Math.max(0.5, leg.speed), start: leg.start })));
      });
    return AutoMovieComposition.parallel(...parts);
  }

  /** Seeded straight stretches round a station from one second to another, the last cut to end exactly at the end. */
  function loops(role: "C" | "B" | "K", station: IAutoMovieVector3, random: IAutoMovieRandom, from: number, end: number): BludgerRally.IPoint[] {
    const speed: number = role === "C" ? 7 : role === "B" ? 8 : 3;
    const radius: number = role === "C" ? 8 : role === "B" ? 10 : 8;
    const timeline: BludgerRally.IPoint[] = [{ t: from, p: station }];
    let t: number = from;
    let here: IAutoMovieVector3 = station;
    for (let k = 0; t < end - 0.05; k++) {
      const a: number = random.float(2 * k) * 2 * Math.PI;
      const r: number = radius * (0.5 + 0.5 * random.float(2 * k + 1));
      let next: IAutoMovieVector3 =
        role === "K"
          ? { x: station.x, y: station.y + (random.float(2 * k + 1) - 0.5) * 2, z: (k % 2 === 0 ? 1 : -1) * r }
          : { x: station.x + Math.cos(a) * r, y: station.y + Math.sin(2 * a) * 2, z: station.z + Math.sin(a) * r };
      let dt: number = Math.max(0.3, Math.hypot(next.x - here.x, next.y - here.y, next.z - here.z) / speed);
      if (t + dt > end) {
        const k2: number = (end - t) / dt;
        next = { x: here.x + (next.x - here.x) * k2, y: here.y + (next.y - here.y) * k2, z: here.z + (next.z - here.z) * k2 };
        dt = end - t;
      }
      t += dt;
      here = next;
      timeline.push({ t, p: here });
    }
    return timeline;
  }

  /** The point a fraction of the way along a stretch at a second. */
  function along(a: BludgerRally.IPoint, b: BludgerRally.IPoint, t: number): IAutoMovieVector3 {
    const u: number = (t - a.t) / Math.max(1e-6, b.t - a.t);
    return { x: a.p.x + (b.p.x - a.p.x) * u, y: a.p.y + (b.p.y - a.p.y) * u, z: a.p.z + (b.p.z - a.p.z) * u };
  }

  /** A point 3.5 m short of the trouble on the line from a rider. */
  function beside(from: IAutoMovieVector3, trouble: IAutoMovieVector3): IAutoMovieVector3 {
    const toward = { x: trouble.x - from.x, z: trouble.z - from.z };
    const n: number = Math.hypot(toward.x, toward.z) || 1;
    return { x: trouble.x - (toward.x / n) * 3.5, y: trouble.y, z: trouble.z - (toward.z / n) * 3.5 };
  }

  /** A stopping player's flight after the stop: the head turn carried on at speed, then braking to rest along the heading. */
  function braking(before: IAutoMovieVector3, last: BludgerRally.IPoint, speed: number): BludgerRally.IPoint[] {
    const d = { x: last.p.x - before.x, z: last.p.z - before.z };
    const n: number = Math.hypot(d.x, d.z) || 1;
    const at = (s: number): IAutoMovieVector3 => ({ x: last.p.x + (d.x / n) * s, y: last.p.y, z: last.p.z + (d.z / n) * s });
    const points: BludgerRally.IPoint[] = [{ t: last.t + LOOK, p: at(speed * LOOK) }];
    const stop: number = speed / BroomLaw.BRAKE;
    for (let k = 1; k <= 6; k++) {
      const t: number = (stop * k) / 6;
      points.push({ t: last.t + LOOK + t, p: at(speed * LOOK + speed * t - 0.5 * BroomLaw.BRAKE * t * t) });
    }
    return points;
  }

  /** The Quaffle's passes, then the last receiver's flight carrying it. */
  function quaffle(input: IInput, flights: Map<string, BludgerRally.IPoint[]>): AutoMovieComposition[] {
    const id: string = input.quaffle!;
    const chasers: string[] = input.players.map((p) => p.id).filter((p) => p.includes("-C"));
    const random: IAutoMovieRandom = createAutoMovieRandom(deriveAutoMovieSeed(input.seed, "practice-play", "quaffle"));
    const until: number = input.stop?.at ?? input.to;
    const passes = [...(input.passes ?? [])];
    if (passes.length === 0 && chasers.length >= 2) {
      let holder: string = chasers[0]!;
      for (let k = 0, at = input.from + 1; at < until - 1.5; k++) {
        const others: string[] = chasers.filter((c) => c !== holder && c[0] === holder[0]);
        const to: string = others[Math.floor(random.float(k) * others.length)] ?? chasers.find((c) => c !== holder)!;
        passes.push({ from: holder, to, at });
        holder = to;
        at += 2 + random.float(k + 100) * 3;
      }
    }
    passes.sort((a, b) => a.at - b.at);
    const flight: number = 1.0;
    const parts: AutoMovieComposition[] = [];
    for (const pass of passes) {
      const from: IAutoMovieVector3 = position(flights.get(pass.from), pass.at);
      const to: IAutoMovieVector3 = position(flights.get(pass.to), pass.at + flight);
      const d: number = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
      parts.push(AutoMovieComposition.of(StageAction.intent(id, { kind: "path", route: [{ point: { ...from, y: from.y + 0.6 } }, { point: { ...to, y: to.y + 0.6 } }], speed: Math.max(1, d / flight), start: pass.at })));
    }
    // The last receiver keeps it: it rides at his chest through his flight to the end.
    const final = passes[passes.length - 1];
    const keeper: BludgerRally.IPoint[] | undefined = final === undefined ? undefined : flights.get(final.to);
    if (final !== undefined && keeper !== undefined) {
      const caught: number = final.at + flight;
      for (let k = 1; k < keeper.length; k++) {
        const a: BludgerRally.IPoint = keeper[k - 1]!;
        const b: BludgerRally.IPoint = keeper[k]!;
        if (b.t <= caught + 1e-6 || a.t >= input.to) continue;
        const speed: number = Math.hypot(b.p.x - a.p.x, b.p.y - a.p.y, b.p.z - a.p.z) / Math.max(1e-6, b.t - a.t);
        parts.push(AutoMovieComposition.of(StageAction.intent(id, { kind: "path", route: [{ point: { ...b.p, y: b.p.y + 0.6 } }], speed: Math.max(0.05, speed), start: Math.max(a.t, caught) })));
      }
    }
    return parts;
  }

  /** A player's position at a second from its planned flight. */
  function position(timeline: BludgerRally.IPoint[] | undefined, seconds: number): IAutoMovieVector3 {
    if (!timeline || timeline.length === 0) return { x: 0, y: 13, z: 0 };
    for (let k = 1; k < timeline.length; k++) {
      const a: BludgerRally.IPoint = timeline[k - 1]!;
      const b: BludgerRally.IPoint = timeline[k]!;
      if (seconds <= b.t) return along(a, b, Math.max(a.t, seconds));
    }
    return timeline[timeline.length - 1]!.p;
  }
}
