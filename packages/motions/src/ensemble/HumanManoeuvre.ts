import { AutoMovieGravity } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { run } from "../actions/run";
import { walk } from "../actions/walk";
import type { HumanChainCore } from "../chain/HumanChainCore";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanGait } from "../lexicon/HumanGait";
import { HUMAN_MANOEUVRES } from "./HUMAN_MANOEUVRES";
import { HumanCrowd } from "./HumanCrowd";
import type { HumanEnsemble } from "./HumanEnsemble";
import { HumanFormation } from "./HumanFormation";
import type { IHumanFormation } from "./IHumanFormation";
import type { IHumanManoeuvre } from "./IHumanManoeuvre";

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
 * crowd's steering. A member's step-off is the drill order's delay here plus
 * its own response latency, drawn when the sync places it (#3462).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a plan decides, the file-order rule, the crossing check and how latency joins.
 * @evidence contracts/development/design.md#principled-representation A plan is a list of parts over the vocabulary's travel.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `plan`, `append`, the drill interval `INTERVAL`, the arc's step `ARC`, and the steered re-form's `STEERED` and `SPAN`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No manoeuvre is an action law.
 */
export namespace HumanManoeuvre {
  /** Seconds between two blocks or ranks stepping off in turn: one step at the drill's quick time, 60 over `HumanGait.MARCH.cadence` (provisional: the drill books give the order, not the interval). */
  export const INTERVAL: number = 60 / HumanGait.MARCH.cadence;

  /** Seconds between two kept points of a steered way (provisional: about a stride). */
  export const STEERED: number = 0.5;

  /** How many times the longest straight way's walking time a steered re-form is given (provisional: room to go round). */
  export const SPAN: number = 3;

  /** Degrees between two points of a wheeling member's arc. */
  export const ARC: number = 10;

  /**
   * Plan a manoeuvre: each member's part.
   *
   * @param ensemble The ensemble, member `i` standing in slot `i` of `from`.
   * @param manoeuvre The manoeuvre.
   * @returns The parts, by member index.
   * @throws {HumanRefusal} When the target holds too few slots, a deployment's column has more blocks than its line, or two ways cross under a rule that does not steer, naming both members, the instant and the distance.
   */
  export function plan(
    ensemble: HumanEnsemble.IEnsemble,
    manoeuvre: IHumanManoeuvre,
  ): IHumanManoeuvre.IPart[] {
    const rule: IHumanManoeuvre.IRule =
      typeof manoeuvre.rule === "string"
        ? HUMAN_MANOEUVRES[manoeuvre.rule]
        : manoeuvre.rule;
    const members: readonly HumanEnsemble.IMember[] = ensemble.members;
    const at: number = manoeuvre.at;
    if (
      rule.path === "oblique" &&
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
      (m: HumanEnsemble.IMember): IAutoMovieVector3 =>
        HumanFormation.slot(manoeuvre.from, m.index, at).at,
    );
    const slots: number[] = HumanFormation.assign(
      manoeuvre.to,
      starts,
      rule.assign,
      at,
    );
    const ends: IHumanFormation.ISlot[] = slots.map(
      (s: number): IHumanFormation.ISlot =>
        HumanFormation.slot(manoeuvre.to, s, at),
    );

    // Each way: about the pivot, straight, or none.
    const pivot: IAutoMovieVector3 = pivotOf(manoeuvre, members, starts);
    const ways: IAutoMovieVector3[][] =
      rule.path === "steered"
        ? steered(ensemble, manoeuvre, starts, ends)
        : members.map(
            (_: HumanEnsemble.IMember, i: number): IAutoMovieVector3[] =>
              rule.path === "inPlace"
                ? [starts[i]!]
                : rule.path === "arc"
                  ? arc(pivot, starts[i]!, ends[i]!.at)
                  : [starts[i]!, ends[i]!.at],
          );

    // Who steps off when: by block for the deployments, by rank in turn, or together.
    const blocks: number[] = members.map(
      (m: HumanEnsemble.IMember): number =>
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
      (m: HumanEnsemble.IMember, i: number): number =>
        rule.order === "together"
          ? 0
          : rule.order === "byRank"
            ? HumanFormation.local(manoeuvre.from, m.index).rank * INTERVAL
            : turns.indexOf(blocks[i]!) * INTERVAL,
    );

    // What each member does on arrival, by its new rank.
    const parts: IHumanManoeuvre.IPart[] = members.map(
      (m: HumanEnsemble.IMember, i: number): IHumanManoeuvre.IPart => {
        const place: HumanFormation.ILocal = HumanFormation.local(
          manoeuvre.to,
          slots[i]!,
        );
        const rear: boolean =
          place.rank === lastRank(manoeuvre.to, place.block);
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
        };
      },
    );
    if (rule.path !== "steered") crossings(ensemble, manoeuvre, parts);
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
  export function append<C extends HumanChainCore>(
    chain: C,
    part: IHumanManoeuvre.IPart,
    manoeuvre: IHumanManoeuvre,
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
      .registered(gait, {
        to,
        ...(part.via.length > 2 ? { via: part.via.slice(1, -1) } : {}),
        face: part.face,
      })
      .sync({
        ...manoeuvre.on,
        offset: (manoeuvre.on.offset ?? 0) + part.delay,
      });
    return part.arrive === "kneel"
      ? travelled.registered("kneel", { rise: false })
      : travelled;
  }
}

/** The wheel's pivot: the front rank's left or right file, or its centre, where the members stand at the word. */
function pivotOf(
  manoeuvre: IHumanManoeuvre,
  members: readonly HumanEnsemble.IMember[],
  starts: readonly IAutoMovieVector3[],
): IAutoMovieVector3 {
  const front: number[] = members
    .map(
      (
        m: HumanEnsemble.IMember,
        i: number,
      ): [number, HumanFormation.ILocal] => [
        i,
        HumanFormation.local(manoeuvre.from, m.index),
      ],
    )
    .filter(
      (e: [number, HumanFormation.ILocal]): boolean =>
        e[1].rank === 0 && e[1].block === 0,
    )
    .sort(
      (
        a: [number, HumanFormation.ILocal],
        b: [number, HumanFormation.ILocal],
      ): number => a[1].file - b[1].file,
    )
    .map((e: [number, HumanFormation.ILocal]): number => e[0]);
  if (front.length === 0) return starts[0] ?? { x: 0, y: 0, z: 0 };
  const side: "left" | "right" | "centre" = manoeuvre.pivot ?? "left";
  if (side === "centre") {
    const n: number = front.length;
    return {
      x:
        front.reduce((s: number, i: number): number => s + starts[i]!.x, 0) / n,
      y: 0,
      z:
        front.reduce((s: number, i: number): number => s + starts[i]!.z, 0) / n,
    };
  }
  // The layout's files run from the frame's left (file 0) to its right.
  return starts[side === "left" ? front[0]! : front[front.length - 1]!]!;
}

/** A way about a pivot from one point to another: the radius and the angle each changed evenly, a point every `ARC` degrees. */
function arc(
  centre: IAutoMovieVector3,
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieVector3[] {
  const r0: number = Math.hypot(from.x - centre.x, from.z - centre.z);
  const r1: number = Math.hypot(to.x - centre.x, to.z - centre.z);
  if (r0 < 1e-6 || r1 < 1e-6) return [from, to];
  const a0: number = Math.atan2(from.x - centre.x, from.z - centre.z);
  const a1: number = Math.atan2(to.x - centre.x, to.z - centre.z);
  const sweep: number =
    ((((a1 - a0 + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) -
    Math.PI;
  const count: number = Math.max(
    1,
    Math.ceil(Math.abs(sweep) / ((HumanManoeuvre.ARC * Math.PI) / 180)),
  );
  const out: IAutoMovieVector3[] = [from];
  for (let k: number = 1; k < count; ++k) {
    const u: number = k / count;
    const r: number = r0 + (r1 - r0) * u;
    const a: number = a0 + sweep * u;
    out.push({
      x: centre.x + r * Math.sin(a),
      y: 0,
      z: centre.z + r * Math.cos(a),
    });
  }
  out.push(to);
  return out;
}

/** The last rank of a block of a formation. */
function lastRank(formation: IHumanFormation, block: number): number {
  let first: number = 0;
  for (let b: number = 0; b < block; ++b) first += formation.blocks[b]!.count;
  let last: number = 0;
  for (let k: number = 0; k < formation.blocks[block]!.count; ++k)
    last = Math.max(last, HumanFormation.local(formation, first + k).rank);
  return last;
}

/**
 * Refuse a manoeuvre whose ways cross: each member read on its way at its
 * travel's speed from its delay, every 1/24 s, against every other.
 */
function crossings(
  ensemble: HumanEnsemble.IEnsemble,
  manoeuvre: IHumanManoeuvre,
  parts: readonly IHumanManoeuvre.IPart[],
): void {
  const members: readonly HumanEnsemble.IMember[] = ensemble.members;

  // Each member's speed: its travel's at its leg length.
  const speeds: number[] = members.map((m: HumanEnsemble.IMember): number => {
    const l: number = m.body.measure.hipHeight;
    if (manoeuvre.gait === "walk")
      return Math.sqrt(walk.FROUDE.normal * AutoMovieGravity.STANDARD * l);
    if (manoeuvre.gait === "run")
      return Math.sqrt(run.GAITS.run.froude * AutoMovieGravity.STANDARD * l);
    const drill: { cadence: number; step: number } =
      manoeuvre.gait === "double" ? HumanGait.DOUBLE : HumanGait.MARCH;
    return (drill.step * l * drill.cadence) / 60;
  });
  const lengths: number[][] = parts.map(
    (p: IHumanManoeuvre.IPart): number[] => {
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
    const p: IHumanManoeuvre.IPart = parts[i]!;
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
      (p: IHumanManoeuvre.IPart, i: number): number =>
        p.delay + lengths[i]![lengths[i]!.length - 1]! / speeds[i]!,
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
  for (let t: number = 0; t <= end + 1e-9; t += 1 / 24) {
    const points: IAutoMovieVector3[] = parts.map(
      (_: IHumanManoeuvre.IPart, i: number): IAutoMovieVector3 => where(i, t),
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
  ensemble: HumanEnsemble.IEnsemble,
  manoeuvre: IHumanManoeuvre,
  starts: readonly IAutoMovieVector3[],
  ends: readonly IHumanFormation.ISlot[],
): IAutoMovieVector3[][] {
  const longest: number = Math.max(
    1e-3,
    ...starts.map((s: IAutoMovieVector3, i: number): number => Math.hypot(ends[i]!.at.x - s.x, ends[i]!.at.z - s.z)),
  );
  const slowest: number = Math.min(
    ...ensemble.members.map((m: HumanEnsemble.IMember): number =>
      Math.sqrt(walk.FROUDE.normal * AutoMovieGravity.STANDARD * m.body.measure.hipHeight),
    ),
  );
  const until: number = manoeuvre.at + (HumanManoeuvre.SPAN * longest) / slowest;
  const placed: HumanEnsemble.IEnsemble = {
    ...ensemble,
    members: ensemble.members.map((m: HumanEnsemble.IMember, i: number): HumanEnsemble.IMember => ({ ...m, place: { at: starts[i]!, yaw: m.place.yaw } })),
  };
  const result: HumanCrowd.IResult = HumanCrowd.steer(placed, {
    goals: (m: HumanEnsemble.IMember): IAutoMovieVector3 => ends[m.index]!.at,
    gait: manoeuvre.gait === "run" ? "run" : "walk",
    start: manoeuvre.at,
    until,
  });
  return result.frames.map((frame: IHumanFormation.ICourse, i: number): IAutoMovieVector3[] => {
    const way: IAutoMovieVector3[] = frame.samples
      .filter((_: IHumanFormation.ISample, k: number): boolean => k % Math.max(1, Math.round(HumanManoeuvre.STEERED * 24)) === 0)
      .map((s: IHumanFormation.ISample): IAutoMovieVector3 => ({ x: s.x, y: 0, z: s.z }));
    return [...way, ends[i]!.at];
  });
}