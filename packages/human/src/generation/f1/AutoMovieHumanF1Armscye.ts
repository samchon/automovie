import { AutoMovieHumanJoinLoop } from "../conic/AutoMovieHumanJoinLoop";
import { AutoMovieHumanLandmarkSurface } from "../conic/AutoMovieHumanLandmarkSurface";
import { AutoMovieLoftViewFullSource as Full } from "@automovie/engine";
import type {
  IAutoMovieConstructionPortLoop,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieLoftSectionFrame,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * The armscye's loop, generated for the person from the two fields that meet there: where the arm's wall, carried inward of its first
 * knot, crosses the trunk's skin nearest the arm's root ring, and that ring itself where the two skins run together.
 *
 * Round the shoulder the trunk's skin and the arm's are two readings of one skin. Measured on f1
 * (`test/src/reference-conics/FamilyConicArmscyeJoin.ts`, `docs/techniques/armscye-join.md`): under the arm and at the two fold feet
 * the arm's wall leaves the trunk's solid transversally, at 23 to 90 degrees, between stations 26 and 36 of the arm's course; over the
 * cap the two skins weave through each other within half a millimetre and cross at grazing angles all along. One closed contact
 * therefore stands a few millimetres either side of the arm's ring at `RING`, and it is found, not stored: every point of it is a
 * function of the two sources, so a person whose arm or trunk changes gets her own loop, and a posed arm its own.
 *
 * The loop is handed to the engine as `IAutoMovieConstructionPort.ILoop` on the trunk's chart, the declared contact of a shared-loop
 * join (`IAutoMovieConstructionJoin.loop`): the engine reads the turn between the two surfaces round it and sets each rail by the
 * fold's law, so the cap needs no band to turn and the armpit no cutter.
 */
export namespace AutoMovieHumanF1Armscye {

  /**
   * The generated contact.
   *
   * @evidence contracts/development/design.md#principled-representation The loop as the engine admits it, the two chart points a point seed names, and the two readings the join's tolerance and an inspection need.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Each member is read by the figure's join or by the pre-check tool.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The gap is reported, never folded into the loop.
   * @evidence contracts/development/common.md#meaningful-documentation Members state charts and units.
   */
  export interface IContact {
    /** The loop on the trunk's chart, `count` shares about its own centre. */
    loop: IAutoMovieConstructionPortLoop;

    /** The arm's chart point `[station m, phase rad]` of the loop's point at clock 0. */
    part: [number, number];

    /** The trunk's chart point `[station m, phase rad]` at clock 0. */
    host: [number, number];

    /** The largest distance between the arm's face and the trunk's skin on the loop, mm: what the join's tolerance must admit. */
    gap: number;

    /** The loop's station on the arm's course at each arm phase read, mm, after fairing. */
    stations: number[];
  }

  /**
   * How the contact's station is sought at each phase of the part: about a ring of the part (`ring`, the crossing nearest it within
   * `near` mm of its course, and the ring itself where there is none), or as the last station at which the part's station line leaves
   * the host within `within` mm of the face's start (`outermost`), for a part whose course leaves the host obliquely; or where the
   * part's station line passes the dividing surface the two parts were fitted either side of (`surface`, positive on the part's side).
   * The first two read the crossing of the two fitted walls, which is the contact only where both walls are skin: fitted either side
   * of one surface, the host's wall past it and the part's before it are closures, and their crossing is nobody's curve (measured on
   * f1: it jumped between arm stations 74 and 119 over the shoulder's cap). The third reads the surface itself, where both are skin
   * (`AutoMovieHumanJoinLoop`), and is not faired: a skin cut by a smooth surface is a smooth curve.
   *
   * @evidence contracts/development/design.md#principled-representation Two closed cases, each with the lengths its search reads.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `create` alone.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No default hides which rule a caller chose for another part than the arm.
   * @evidence contracts/development/common.md#meaningful-documentation Lengths in mm of the part's course.
   */
  export type IRule = { type: "ring"; ring: number; near: number } | { type: "outermost"; within: number } | { type: "surface"; side: (p: readonly number[]) => number };

  /**
   * The arm's root ring the contact is sought about, mm of the arm's course: one millimetre before its first knot, which stands 2 mm
   * outside the armpit's sagittal plane (`AutoMovieHumanF1Joints.armpit`). The trunk owns the skin medial of that plane and the arm the
   * skin lateral of it, so the two fields were fitted to meet there.
   */
  export const RING_MM: number = 31;

  /**
   * How far from the ring a crossing still belongs to the contact, mm of the arm's course. f1's crossings stand 26.4 to 35.8 mm along
   * the course, within 4.8 mm of the ring; a crossing farther off is another meeting of the two walls (the arm's wall re-entering the
   * trunk's front 11 mm inside the ring at the anterior fold), and the ring stands in for the contact there.
   */
  export const NEAR_MM: number = 8;

  /** How far before its first knot the arm's face is carried so the contact lies on it, mm: past the deepest crossing by 16 mm. */
  export const CARRIED_MM: number = 22;

  /**
   * The armscye's four landmarks on f1's skin, mm in the thorax's frame: the skin straight above the shoulder joint, the axillary
   * slit's front and back upper ends, and its apex (ISO 8559-1's shoulder point, armpit front and back fold points and armpit point;
   * construction.md, Ports). They are f1's traced points moved onto the skin, read by `FamilyConicJoints.ts --armscye-landmarks` from
   * `test/src/reference-conics/FamilyConicLoop.ts`, whose surface clips the trunk's and the arm's fits. Stored in the thorax's frame
   * they ride the thorax; a law that places them for a person from her measures is not written yet.
   */
  export const LANDMARKS_MM: readonly (readonly [number, number, number])[] = [
    [-59.46, -8.85, 142.22],
    [-19.76, -109.62, 156.58],
    [-105.96, -109.42, 161.62],
    [-65.15, -139.0, 148.03],
  ];

  /**
   * The surface that divides the shoulder's skin between the trunk and the +Z arm: through the four landmarks, about the shoulder
   * joint, its far side toward the elbow (`AutoMovieHumanLandmarkSurface`).
   *
   * @param thorax The thorax's frame at the person.
   * @param shoulder The glenohumeral centre, mm in the figure's frame.
   * @param elbow The elbow's centre, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each landmark is carried from the thorax's frame to the figure's by the frame's origin and axes, and the surface is built about the shoulder joint as the fit's is.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame map and one construction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No landmark is read from a mesh or moved by a tolerance; the surface's own refusals pass through.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four points and one surface preparation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned surface serves every read of the loop.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the surface's own closure only.
   * @evidence contracts/development/common.md#meaningful-documentation States frames and units.
   */
  export function surface(thorax: IAutoMovieHumanSegmentFrame, shoulder: readonly number[], elbow: readonly number[]): AutoMovieHumanLandmarkSurface.ISurface {
    const world = (local: readonly number[]): [number, number, number] => [0, 1, 2].map((k: number): number => thorax.origin[k]! + local[0]! * thorax.axes[0][k]! + local[1]! * thorax.axes[1][k]! + local[2]! * thorax.axes[2][k]!) as [number, number, number];
    return AutoMovieHumanLandmarkSurface.create(shoulder, LANDMARKS_MM.map(world), elbow);
  }

  /** Arm phases the contact is read at. */
  const PHASES: number = 360;

  /**
   * The width, radians of the arm's phase, of the periodic Gaussian the contact's station is averaged by. Over the cap the two skins
   * cross wherever their half-millimetre weave happens to change sign, so the raw crossing station jitters by up to 7 mm between
   * neighbouring phases while both skins stay within that weave of each other; averaged over 15 degrees the loop runs fair and stays in
   * the weave.
   */
  const FAIR_RAD: number = (15 * Math.PI) / 180;

  /**
   * Generate the contact of an arm on a trunk.
   *
   * @param trunk The trunk's complete source, level sections on a straight course.
   * @param arm The arm's complete source on the stored side (+Z), carried inward to at least `RING_MM - NEAR_MM`.
   * @param count The join's column count: the loop's shares.
   * @param rule How the contact is sought; absent, about the arm's ring `RING_MM` within `NEAR_MM`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Inside or outside the trunk is read in the trunk's own chart (a level section about a straight course: a point's station is its height along the course and its phase its polar angle); the crossing nearest the ring is bracketed outward from the ring in quarter millimetres and bisected; the station is faired round the arm's phase; each loop point is the trunk's own skin at the arm point's chart address; the shares are the loop's polar radii about its centroid in the chart normalized by its half extents.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read, fair, drop on the trunk, write as shares.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No stored loop, landmark or person enters; a trunk that is not straight and level, an arm not carried far enough and a loop that is not star-shaped about its centre in the chart are refused with their numbers.
   * @evidence contracts/development/implementation.md#efficient-algorithms 360 phases, each at most 64 bracket reads and 40 bisections of two source points; no loft and no mesh.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both source readers are prepared once and serve every read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns plain numbers; the readers die with the call.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs' premises, the units and each refusal.
   */
  export function create(trunk: IAutoMovieViewPart, arm: IAutoMovieViewPart, count: number, rule: IRule = { type: "ring", ring: RING_MM, near: NEAR_MM }): IContact {
    // By the dividing surface the loop is both skins cut by it, which is one generator for every part on a host's side.
    if (rule.type === "surface") return AutoMovieHumanJoinLoop.create(trunk, arm, count, rule.side);
    const [host, part]: IAutoMovieLoftViewFullSource.IReader[] = [Full.create(trunk), Full.create(arm)];
    const outermost: number | undefined = rule.type === "outermost" ? rule.within : undefined;
    const [ring, near]: [number, number] = rule.type === "ring" ? [rule.ring, rule.near] : [NaN, NaN];
    if (rule.type === "ring" && part!.domain[0] > ring - near)
      throw new Error("armscye: the arm's face starts at " + part!.domain[0] + " mm, past the contact's reach");
    const sub = (a: readonly number[], b: readonly number[]): V => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
    const dot = (a: readonly number[], b: readonly number[]): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;

    // The trunk's chart of a world point: its course is straight and its frame constant, which is checked at both ends of its domain.
    const [foot, head]: IAutoMovieLoftSectionFrame[] = [trunk.axis.at(host!.domain[0]), trunk.axis.at(host!.domain[1])];
    const along: V = sub(head!.origin, foot!.origin);
    const length: number = Math.hypot(along[0], along[1], along[2]);
    const tangent: V = [along[0] / length, along[1] / length, along[2] / length];
    if (Math.abs(length - (host!.domain[1] - host!.domain[0])) > 1e-6 || Math.hypot(...sub(head!.u, foot!.u)) > 1e-9 || Math.abs(dot(tangent, foot!.u)) > 1e-9)
      throw new Error("armscye: the trunk's course is not straight with level sections");
    const chart = (p: readonly number[]): [number, number, number] => {
      const q: V = sub(p, foot!.origin);
      return [host!.domain[0] + dot(q, tangent), Math.atan2(dot(q, foot!.v), dot(q, foot!.u)), Math.hypot(dot(q, foot!.u), dot(q, foot!.v))];
    };
    const skin = (station: number, phase: number): number => {
      const q: V = sub(host!.point(station, phase), trunk.axis.at(station).origin);
      return Math.hypot(dot(q, foot!.u), dot(q, foot!.v));
    };

    // How far inside the trunk's skin a point stands, mm, measured along the trunk's own radius; outside the trunk's stations, outside.
    const depth = (p: readonly number[]): number => {
      const [station, phase, radius]: [number, number, number] = chart(p);
      return station < host!.domain[0] || station > host!.domain[1] ? -radius : skin(station, phase) - radius;
    };

    // An arm whose course leaves the trunk obliquely has no ring beside the armscye: its contact is the station past which each
    // station line stays outside the trunk, the last leaving within `outermost` mm of the face's start. A phase without one takes its
    // nearest neighbour's.
    const last = (): number[] => {
      const from: number = part!.domain[0];
      const found: number[] = Array.from({ length: PHASES }, (_: unknown, j: number): number => {
        const phase: number = (2 * Math.PI * j) / PHASES;
        const at = (s: number): number => depth(part!.point(s, phase));
        let [station, previous]: [number, number] = [NaN, at(from)];
        for (let s: number = from + 0.5; s <= from + outermost!; s += 0.5) {
          const d: number = at(s);
          if (previous > 0 && d <= 0) {
            let [lo, hi]: [number, number] = [s - 0.5, s];
            for (let i: number = 0; i < 40; ++i) {
              const middle: number = (lo + hi) / 2;
              if (at(middle) > 0) lo = middle;
              else hi = middle;
            }
            station = (lo + hi) / 2;
          }
          previous = d;
        }
        return station;
      });
      if (found.every(Number.isNaN)) throw new Error("armscye: the arm's face never leaves the trunk within " + outermost + " mm");
      return found.map((s: number, j: number): number => {
        for (let d: number = 0; d < PHASES; ++d) for (const k of [j + d, j - d]) if (!Number.isNaN(found[(k + PHASES) % PHASES]!)) return found[(k + PHASES) % PHASES]!;
        return s;
      });
    };

    // The crossing nearest the ring at each arm phase, or the ring.
    const raw: number[] = outermost !== undefined ? last() : Array.from({ length: PHASES }, (_: unknown, j: number): number => {
      const phase: number = (2 * Math.PI * j) / PHASES;
      const at = (s: number): number => depth(part!.point(s, phase));
      for (let step: number = 0.25; step <= near; step += 0.25)
        for (const s of [ring - step, ring + step]) {
          let [lo, hi]: [number, number] = s < ring ? [s, s + 0.25] : [s - 0.25, s];
          if (at(lo) * at(hi) > 0) continue;
          for (let i: number = 0; i < 40; ++i) {
            const middle: number = (lo + hi) / 2;
            if (at(lo) * at(middle) <= 0) hi = middle;
            else lo = middle;
          }
          return (lo + hi) / 2;
        }
      return ring;
    });

    // Faired round the arm's phase by a periodic Gaussian.
    const reach: number = Math.ceil((3 * FAIR_RAD * PHASES) / (2 * Math.PI));
    const stations: number[] = raw.map((_: number, j: number): number => {
      let [sum, total]: [number, number] = [0, 0];
      for (let d: number = -reach; d <= reach; ++d) {
        const weight: number = Math.exp(-(((2 * Math.PI * d) / PHASES / FAIR_RAD) ** 2) / 2);
        sum += weight * raw[(j + d + PHASES) % PHASES]!;
        total += weight;
      }
      return sum / total;
    });

    // Each loop point dropped on the trunk's skin at the arm point's chart address, with the gap between the two skins there.
    let gap: number = 0;
    const points: [number, number][] = stations.map((station: number, j: number): [number, number] => {
      const p: readonly number[] = part!.point(station, (2 * Math.PI * j) / PHASES);
      const [s, t]: [number, number, number] = chart(p);
      const q: readonly number[] = host!.point(s, t);
      gap = Math.max(gap, Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!));
      return [s, t];
    });

    // The ellipse about the loop's centroid on its half extents, and the loop's share of it at each clock.
    const centre: [number, number] = [0, 1].map((k: number): number => points.reduce((sum: number, p: [number, number]): number => sum + p[k]!, 0) / PHASES) as [number, number];
    const semi: [number, number] = [0, 1].map((k: number): number => Math.max(...points.map((p: [number, number]): number => Math.abs(p[k]! - centre[k]!)))) as [number, number];
    if (!(semi[0] > 0 && semi[1] > 0 && semi[1] < Math.PI)) throw new Error("armscye: the loop's half extents on the trunk's chart are " + semi.join(" mm and ") + " rad");
    const polar: { clock: number; share: number; j: number }[] = points.map((p: [number, number], j: number): { clock: number; share: number; j: number } => {
      const [x, y]: [number, number] = [(p[0] - centre[0]) / semi[0], (p[1] - centre[1]) / semi[1]];
      return { clock: Math.atan2(y, x), share: Math.hypot(x, y), j };
    });

    // Star-shaped about the centre: the clock turns one way all round, once.
    const turn: number = polar.reduce((sum: number, p: { clock: number }, j: number): number => {
      const d: number = p.clock - polar[(j + PHASES - 1) % PHASES]!.clock;
      return sum + Math.atan2(Math.sin(d), Math.cos(d));
    }, 0);
    const way: number = turn > 0 ? 1 : -1;
    const back: number = polar.filter((p: { clock: number }, j: number): boolean => {
      const d: number = p.clock - polar[(j + PHASES - 1) % PHASES]!.clock;
      return way * Math.atan2(Math.sin(d), Math.cos(d)) <= 0;
    }).length;

    // The stored side's loop is written with the phase rising at clock pi / 2, as the trunk's other loops on that side are; its twin is
    // this loop with its centre's phase and its sense negated.
    const sense: 1 | -1 = 1;
    if (Math.abs(Math.abs(turn) - 2 * Math.PI) > 1e-6 || back > 0)
      throw new Error("armscye: the loop is not star-shaped about its centre on the trunk's chart (" + back + " of " + PHASES + " steps turn back)");

    // The share at each column's clock, read between the two loop points either side of it.
    const sorted: { clock: number; share: number; j: number }[] = polar
      .map((p: { clock: number; share: number; j: number }): { clock: number; share: number; j: number } => ({ ...p, clock: ((sense * p.clock) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) }))
      .sort((a: { clock: number }, b: { clock: number }): number => a.clock - b.clock);
    const at = (clock: number): { share: number; j: number } => {
      const k: number = sorted.findIndex((p: { clock: number }): boolean => p.clock >= clock);
      const [a, b] = [sorted[(k <= 0 ? sorted.length : k) - 1]!, sorted[k < 0 ? 0 : k]!];
      const span: number = ((b.clock - a.clock) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const share: number = span === 0 ? a.share : a.share + ((b.share - a.share) * (((clock - a.clock) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI))) / span;
      return { share, j: b.j };
    };
    const shape: number[] = Array.from({ length: count }, (_: unknown, k: number): number => at((2 * Math.PI * k) / count).share);
    const first: { share: number; j: number } = at(0);
    return {
      loop: { centre: [centre[0] / 1000, centre[1]], semi: [semi[0] / 1000, semi[1]], sense, shape },
      part: [stations[first.j]! / 1000, (2 * Math.PI * first.j) / PHASES],
      host: [(centre[0] + first.share * semi[0]) / 1000, centre[1]],
      gap,
      stations,
    };
  }
  type V = [number, number, number];
}
