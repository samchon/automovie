import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanCrowd,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanManoeuvre,
  IAutoMovieMotionHumanManoeuvreWheel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { run } from "../actions/run";
import { walk } from "../actions/walk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanGait } from "../lexicon/HumanGait";
import { HUMAN_MANOEUVRES } from "./HUMAN_MANOEUVRES";
import { HumanCrowd } from "./HumanCrowd";
import { HumanFormation } from "./HumanFormation";
import { manoeuvreWheel } from "./manoeuvreWheel";

/**
 * Manoeuvres planned as each member's own travel, and appended to the
 * members' chains.
 *
 * A plan decides, per member, which new slot it takes, when after the word
 * it steps off, the way it goes and how it stands on arrival; it writes no
 * motion. File order is kept by every drill rule; only `nearest`
 * reassigns, because a formed unit's men keep their files and a crowd does
 * not. Before any member is planned, the ways are checked in time: two
 * members whose ways bring them closer than their summed shoulder half
 * breadths, and closer than they stand in either formation, at any 1/24 s
 * instant refuse the manoeuvre, unless its rule leaves crossings to the
 * crowd's steering or wheels the formation rigidly, each member keeping its
 * slot of the turning formation (`manoeuvreWheel`). A unit keeps together:
 * a straight or slanting way is marched at the slowest member's pace, each
 * member keeping its place on it as a station, so the ways are checked, and
 * walked, as those places move. A member's step-off is the drill order's delay here plus
 * its own response latency, drawn when the sync places it (#3462).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a plan decides, the file-order rule, the crossing check and how latency joins.
 * @evidence contracts/development/design.md#principled-representation A plan is a list of parts over the vocabulary's travel.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `plan`, `append`, the drill interval `INTERVAL`, and the steered re-form's `STEERED` and `SPAN`; the wheel is `manoeuvreWheel`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No manoeuvre is an action law.
 */
export namespace HumanManoeuvre {
  /** Seconds between two blocks or ranks stepping off in turn: one step at the drill's quick time, 60 over `HumanGait.MARCH.cadence` (provisional: the drill books give the order, not the interval). */
  export const INTERVAL: number = 60 / HumanGait.MARCH.cadence;

  /** Seconds between two kept points of a steered way (provisional: about a stride). */
  export const STEERED: number = 0.5;

  /** How many times the longest straight way's walking time a steered re-form is given (provisional: room to go round). */
  export const SPAN: number = 3;

  /**
   * Plan a manoeuvre: each member's part.
   *
   * @param ensemble The ensemble, member `i` standing in slot `i` of `from`.
   * @param manoeuvre The manoeuvre.
   * @returns The parts, by member index.
   * @throws {HumanRefusal} When the target holds too few slots, a deployment's column has more blocks than its line, a wheel's target is not its formation turned about the pivot, or two ways cross under a rule that does not steer, naming both members, the instant and the distance.
   */
  export function plan(
    ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
    manoeuvre: IAutoMovieMotionHumanManoeuvre,
  ): IAutoMovieMotionHumanManoeuvre.IPart[] {
    const rule: IAutoMovieMotionHumanManoeuvre.IRule =
      typeof manoeuvre.rule === "string"
        ? HUMAN_MANOEUVRES[manoeuvre.rule]
        : manoeuvre.rule;
    const members: readonly IAutoMovieMotionHumanEnsemble.IMember[] =
      ensemble.members;
    const at: number = manoeuvre.at;
    if (
      (rule.path === "oblique" || rule.path === "flank") &&
      manoeuvre.from.blocks.length > manoeuvre.to.blocks.length
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: `${ensemble.input.id}.manoeuvre`,
        value: manoeuvre.from.blocks.length,
        feasible: {
          kind: "range",
          minimum: 1,
          maximum: manoeuvre.to.blocks.length,
          unit: "blocks",
        },
        reason: `a deployment takes column block k to line block k, and the column has ${manoeuvre.from.blocks.length} blocks for the line's ${manoeuvre.to.blocks.length}`,
        fix: "give the line a block for every block of the column",
      });

    // Where each member stands, and the slot it takes.
    const starts: IAutoMovieVector3[] = members.map(
      (m: IAutoMovieMotionHumanEnsemble.IMember): IAutoMovieVector3 =>
        HumanFormation.slot(manoeuvre.from, m.index, at).at,
    );
    const slots: number[] = HumanFormation.assign(
      manoeuvre.to,
      starts,
      rule.assign,
      at,
    );
    const ends: IAutoMovieMotionHumanFormation.ISlot[] = slots.map(
      (s: number): IAutoMovieMotionHumanFormation.ISlot =>
        HumanFormation.slot(manoeuvre.to, s, at),
    );

    // Each way: a wheel's arcs with the stations that keep its line straight, steered, straight, or none.
    const speeds: number[] = travelSpeeds(members, manoeuvre);
    const wheel: IAutoMovieMotionHumanManoeuvreWheel.IWheel | null =
      rule.path === "arc"
        ? manoeuvreWheel(ensemble, manoeuvre, starts, ends, speeds)
        : null;
    const ways: IAutoMovieVector3[][] =
      wheel !== null
        ? wheel.ways
        : rule.path === "steered"
          ? steered(ensemble, manoeuvre, starts, ends)
          : members.map(
              (
                _: IAutoMovieMotionHumanEnsemble.IMember,
                i: number,
              ): IAutoMovieVector3[] =>
                rule.path === "inPlace"
                  ? [starts[i]!]
                  : rule.path === "flank"
                    ? flanked(manoeuvre, starts[i]!, ends[i]!.at)
                    : [starts[i]!, ends[i]!.at],
            );

    // Who steps off when: by block for the deployments, by rank in turn, or together.
    const blocks: number[] = members.map(
      (m: IAutoMovieMotionHumanEnsemble.IMember): number =>
        HumanFormation.local(manoeuvre.from, m.index).block,
    );
    const length = (way: readonly IAutoMovieVector3[]): number =>
      way
        .slice(1)
        .reduce(
          (sum: number, p: IAutoMovieVector3, k: number): number =>
            sum + Math.hypot(p.x - way[k]!.x, p.z - way[k]!.z),
          0,
        );
    const reach: Map<number, number> = new Map();
    blocks.forEach((b: number, i: number): void => {
      reach.set(b, Math.max(reach.get(b) ?? 0, length(ways[i]!)));
    });
    const turns: number[] = [...reach.entries()]
      .sort((a: [number, number], b: [number, number]): number =>
        rule.order === "nearFirst"
          ? a[1] - b[1] || a[0] - b[0]
          : b[1] - a[1] || a[0] - b[0],
      )
      .map((e: [number, number]): number => e[0]);
    const delays: number[] = members.map(
      (m: IAutoMovieMotionHumanEnsemble.IMember, i: number): number =>
        rule.order === "together"
          ? 0
          : rule.order === "byRank"
            ? HumanFormation.local(manoeuvre.from, m.index).rank * INTERVAL
            : turns.indexOf(blocks[i]!) * INTERVAL,
    );

    // A unit keeps together: each member marches its straight way at the slowest member's pace, keeping its own place on it as a station, so the parallel ways of a block stay parallel whatever each body's own step.
    const pace: number = Math.min(...speeds);
    const stations: (IAutoMovieMotionHumanFormation.IStation | undefined)[] =
      members.map(
        (
          _: IAutoMovieMotionHumanEnsemble.IMember,
          i: number,
        ): IAutoMovieMotionHumanFormation.IStation | undefined =>
          wheel !== null && wheel.stations !== null
            ? wheel.stations[i]!
            : (rule.path === "straight" ||
                  rule.path === "oblique" ||
                  rule.path === "flank") &&
                length(ways[i]!) > 1e-6
              ? {
                  formation: {
                    blocks: [ALONE],
                    frame: {
                      kind: "path",
                      via: ways[i]!,
                      start: at + delays[i]!,
                      speed: pace,
                    },
                  },
                  slot: 0,
                }
              : undefined,
      );

    // What each member does on arrival, by its new rank.
    const parts: IAutoMovieMotionHumanManoeuvre.IPart[] = members.map(
      (
        m: IAutoMovieMotionHumanEnsemble.IMember,
        i: number,
      ): IAutoMovieMotionHumanManoeuvre.IPart => {
        const place: IAutoMovieMotionHumanFormation.ILocal =
          HumanFormation.local(manoeuvre.to, slots[i]!);
        const rear: boolean =
          place.rank === HumanFormation.rear(manoeuvre.to, place.block);
        const arrive: "stand" | "kneel" =
          (place.rank === 0 ? rule.arrive?.front : undefined) ??
          (rear ? rule.arrive?.rear : undefined) ??
          rule.arrive?.all ??
          "stand";
        return {
          member: m.index,
          slot: slots[i]!,
          delay: delays[i]!,
          via: ways[i]!,
          face: ends[i]!.heading,
          arrive,
          ...(stations[i] === undefined ? {} : { station: stations[i]! }),
        };
      },
    );
    // A wheel's turn is rigid, so no two of its members come closer than they stand.
    if (rule.path !== "steered" && wheel === null)
      crossings(ensemble, parts, speeds, at);
    return parts;
  }

  /**
   * Append a member's part to its chain: its travel synced to the word plus
   * its drill delay, then its arrival posture.
   *
   * @param chain The member's chain.
   * @param part Its part.
   * @param manoeuvre The manoeuvre.
   * @returns The chain.
   */
  export function append<C extends IAutoMovieMotionHumanChainCore>(
    chain: C,
    part: IAutoMovieMotionHumanManoeuvre.IPart,
    manoeuvre: IAutoMovieMotionHumanManoeuvre,
  ): C {
    const gait: string =
      manoeuvre.gait === "double"
        ? "doubleTime"
        : manoeuvre.gait === "walk"
          ? "walk"
          : manoeuvre.gait === "run"
            ? "run"
            : "march";
    const to: IAutoMovieVector3 = part.via[part.via.length - 1]!;
    const travelled: C = chain
      .registered(
        gait,
        part.station === undefined
          ? {
              to,
              ...(part.via.length > 2 ? { via: part.via.slice(1, -1) } : {}),
              face: part.face,
            }
          : { to, face: part.face, station: part.station },
      )
      .sync({
        ...manoeuvre.on,
        offset: (manoeuvre.on.offset ?? 0) + part.delay,
      });
    return part.arrive === "kneel"
      ? travelled.registered("kneel", { rise: false })
      : travelled;
  }
}

/**
 * A way by the flank: along the target line's front to the member's own
 * file, at the depth it stands at, then straight up into its place; the
 * corner is left out where either leg is empty. Files march to a flank and
 * front on the line, as the drill deploys a column ("the platoons of a column
 * file separately to a flank ... for the purposes of firing or deploying",
 * each division halting and fronting on the line: Rules and Regulations for
 * the Formations and Movements of the Militia of Lower-Canada, c. 1814,
 * after Dundas 1792).
 */
function flanked(
  manoeuvre: IAutoMovieMotionHumanManoeuvre,
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieVector3[] {
  // The target frame's lateral axis, its right: (-cos h, 0, sin h).
  const radians: number =
    (HumanFormation.frame(manoeuvre.to, manoeuvre.at).heading * Math.PI) / 180;
  const lx: number = -Math.cos(radians);
  const lz: number = Math.sin(radians);
  const across: number = (to.x - from.x) * lx + (to.z - from.z) * lz;
  const corner: IAutoMovieVector3 = {
    x: from.x + across * lx,
    y: 0,
    z: from.z + across * lz,
  };
  const empty = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    Math.hypot(a.x - b.x, a.z - b.z) < 1e-6;
  return empty(from, corner) || empty(corner, to)
    ? [from, to]
    : [from, corner, to];
}

/** The block of one member a stationed straight way is read on: its one slot stands at the block's origin. */
const ALONE: IAutoMovieMotionHumanFormation.IBlock = {
  layout: {
    kind: "line",
    ranks: 1,
    files: 1,
    spacing: { lateral: 1, depth: 1 },
  },
  count: 1,
};

/** Each member's speed in the manoeuvre's travel at its leg length, m/s: the walk's or the run's Froude speed, or the drill's step times its cadence. */
function travelSpeeds(
  members: readonly IAutoMovieMotionHumanEnsemble.IMember[],
  manoeuvre: IAutoMovieMotionHumanManoeuvre,
): number[] {
  return members.map((m: IAutoMovieMotionHumanEnsemble.IMember): number => {
    const l: number = m.body.measure.hipHeight;
    if (manoeuvre.gait === "walk")
      return Math.sqrt(walk.FROUDE.normal * AutoMovieGravity.STANDARD * l);
    if (manoeuvre.gait === "run")
      return Math.sqrt(run.GAITS.run.froude * AutoMovieGravity.STANDARD * l);
    const drill: { cadence: number; step: number } =
      manoeuvre.gait === "double" ? HumanGait.DOUBLE : HumanGait.MARCH;
    return (drill.step * drill.cadence) / 60;
  });
}

/**
 * Refuse a manoeuvre whose ways cross: each member read on its way at its
 * travel's speed from its delay, every 1/24 s, against every other.
 */
function crossings(
  ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
  parts: readonly IAutoMovieMotionHumanManoeuvre.IPart[],
  speeds: readonly number[],
  at: number,
): void {
  const members: readonly IAutoMovieMotionHumanEnsemble.IMember[] =
    ensemble.members;
  const lengths: number[][] = parts.map(
    (p: IAutoMovieMotionHumanManoeuvre.IPart): number[] => {
      const out: number[] = [0];
      for (let k: number = 1; k < p.via.length; ++k)
        out.push(
          out[k - 1]! +
            Math.hypot(
              p.via[k]!.x - p.via[k - 1]!.x,
              p.via[k]!.z - p.via[k - 1]!.z,
            ),
        );
      return out;
    },
  );
  const where = (i: number, t: number): IAutoMovieVector3 => {
    const p: IAutoMovieMotionHumanManoeuvre.IPart = parts[i]!;
    if (p.station !== undefined)
      return HumanFormation.slot(p.station.formation, p.station.slot, at + t)
        .at;
    const s: number = Math.max(0, (t - p.delay) * speeds[i]!);
    const arcs: number[] = lengths[i]!;
    let k: number = 0;
    while (k + 2 < p.via.length && arcs[k + 1]! < s) ++k;
    if (p.via.length === 1) return p.via[0]!;
    const span: number = arcs[k + 1]! - arcs[k]!;
    const u: number = span < 1e-12 ? 1 : Math.min(1, (s - arcs[k]!) / span);
    return {
      x: p.via[k]!.x + (p.via[k + 1]!.x - p.via[k]!.x) * u,
      y: 0,
      z: p.via[k]!.z + (p.via[k + 1]!.z - p.via[k]!.z) * u,
    };
  };
  const end: number = Math.max(
    0,
    ...parts.map(
      (p: IAutoMovieMotionHumanManoeuvre.IPart, i: number): number =>
        p.station === undefined
          ? p.delay + lengths[i]![lengths[i]!.length - 1]! / speeds[i]!
          : (HumanFormation.end(p.station.formation) ?? at) - at,
    ),
  );
  const n: number = parts.length;
  const floor: number[][] = [];
  for (let i: number = 0; i < n; ++i) {
    floor.push([]);
    for (let j: number = 0; j < n; ++j) {
      const a0: IAutoMovieVector3 = where(i, 0);
      const b0: IAutoMovieVector3 = where(j, 0);
      const a1: IAutoMovieVector3 = parts[i]!.via[parts[i]!.via.length - 1]!;
      const b1: IAutoMovieVector3 = parts[j]!.via[parts[j]!.via.length - 1]!;
      floor[i]!.push(
        Math.min(
          HumanCrowd.half(members[i]!) + HumanCrowd.half(members[j]!),
          Math.hypot(a0.x - b0.x, a0.z - b0.z),
          Math.hypot(a1.x - b1.x, a1.z - b1.z),
        ),
      );
    }
  }
  for (let t: number = 0; t <= end + 1e-9; t += HumanCrowd.STEP) {
    const points: IAutoMovieVector3[] = parts.map(
      (_: IAutoMovieMotionHumanManoeuvre.IPart, i: number): IAutoMovieVector3 =>
        where(i, t),
    );
    for (let i: number = 0; i < n; ++i)
      for (let j: number = i + 1; j < n; ++j) {
        const d: number = Math.hypot(
          points[i]!.x - points[j]!.x,
          points[i]!.z - points[j]!.z,
        );
        if (d < floor[i]![j]! - 1e-3)
          throw new HumanRefusal({
            kind: "participant",
            performer: members[i]!.subject,
            axis: `${ensemble.input.id}.manoeuvre`,
            value: members[j]!.subject,
            reason: `${members[i]!.subject} and ${members[j]!.subject} come ${d.toFixed(3)} m apart ${t.toFixed(3)} s after the word, closer than ${floor[i]![j]!.toFixed(3)} m: their ways cross`,
            fix: "step off in another order, or let the crowd's steering take the crossing (path: steered)",
          });
      }
  }
}

/**
 * Each member's way to its new slot through the crowd's steering pass
 * (`HumanCrowd.steer`), the members walking from where they stand at the
 * word: the steered course sampled every `STEERED` seconds, ending on the
 * slot. The pass runs for `SPAN` times the time the longest straight way
 * takes at the slowest member's walk, which leaves room to go round.
 */
function steered(
  ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble,
  manoeuvre: IAutoMovieMotionHumanManoeuvre,
  starts: readonly IAutoMovieVector3[],
  ends: readonly IAutoMovieMotionHumanFormation.ISlot[],
): IAutoMovieVector3[][] {
  const longest: number = Math.max(
    1e-3,
    ...starts.map((s: IAutoMovieVector3, i: number): number =>
      Math.hypot(ends[i]!.at.x - s.x, ends[i]!.at.z - s.z),
    ),
  );
  const slowest: number = Math.min(
    ...ensemble.members.map(
      (m: IAutoMovieMotionHumanEnsemble.IMember): number =>
        Math.sqrt(
          walk.FROUDE.normal *
            AutoMovieGravity.STANDARD *
            m.body.measure.hipHeight,
        ),
    ),
  );
  const until: number =
    manoeuvre.at + (HumanManoeuvre.SPAN * longest) / slowest;
  const placed: IAutoMovieMotionHumanEnsemble.IEnsemble = {
    ...ensemble,
    members: ensemble.members.map(
      (
        m: IAutoMovieMotionHumanEnsemble.IMember,
        i: number,
      ): IAutoMovieMotionHumanEnsemble.IMember => ({
        ...m,
        place: { at: starts[i]!, yaw: m.place.yaw },
      }),
    ),
  };
  const result: IAutoMovieMotionHumanCrowd.IResult = HumanCrowd.steer(placed, {
    goals: (m: IAutoMovieMotionHumanEnsemble.IMember): IAutoMovieVector3 =>
      ends[m.index]!.at,
    gait: manoeuvre.gait === "run" ? "run" : "walk",
    start: manoeuvre.at,
    until,
  });
  return result.frames.map(
    (
      frame: IAutoMovieMotionHumanFormation.ICourse,
      i: number,
    ): IAutoMovieVector3[] => {
      const way: IAutoMovieVector3[] = frame.samples
        .filter(
          (_: IAutoMovieMotionHumanFormation.ISample, k: number): boolean =>
            k %
              Math.max(
                1,
                Math.round(HumanManoeuvre.STEERED / HumanCrowd.STEP),
              ) ===
            0,
        )
        .map(
          (s: IAutoMovieMotionHumanFormation.ISample): IAutoMovieVector3 => ({
            x: s.x,
            y: 0,
            z: s.z,
          }),
        );
      return [...way, ends[i]!.at];
    },
  );
}
