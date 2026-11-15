import {
  assignAutoMovieMinimumCost,
  formationSlotPosition,
} from "@automovie/engine";
import type {
  IAutoMovieFormationLayout,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFormationPath } from "./HumanFormationPath";
import type { IHumanFormation } from "./IHumanFormation";

/**
 * Formations: validating one, and reading where each member's slot stands at
 * a film second, the way it travels between two seconds, and which member
 * takes which slot.
 *
 * A slot is laid by the engine's `formationSlotPosition` in its block's own
 * frame (the layout's geometry and dressing have that one owner), its depth
 * turned to run from the front rank to the rear, then turned by the block's
 * facing, moved by its offset and placed in the formation's frame at that
 * second. A member keeps its slot by its own travel: a cadenced march walks
 * the slot's way (`path`) and lets its step give, a free walk follows the
 * slot by speed matching (`walkStation`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how a slot is laid and placed and how members keep it.
 * @evidence contracts/development/design.md#principled-representation Reads of the data type `IHumanFormation`; layout geometry stays the engine's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `of`, `count`, `local`, `frame`, `slot`, `path`, `assign` and the frame's two defaults.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No second layout formula: every point comes from `formationSlotPosition`.
 */
export namespace HumanFormation {
  /**
   * A path frame's acceleration and braking when it states none, metres per
   * second squared: a pedestrian's normal desired speed over the relaxation
   * time of the social force model, 1.34 m/s over 0.5 s (Helbing and Molnar
   * 1995, Phys Rev E 51:4282), the initial rate of its driving term from rest.
   */
  export const ACCELERATION: number = 1.34 / 0.5;

  /** Metres of path over which a path frame turns at a corner when it states none (provisional: about two marching steps). */
  export const TURN: number = 1.5;

  /** Seconds between two samples of a slot's way when the caller asks no other (provisional: a few samples a step, as `walkFollowed.STEP`). */
  export const SAMPLE: number = 0.25;

  /** Reads a performer's placed root at a film second, for a guide frame: `IHumanActionContext.IPerformer.root` of the guide. */
  export type Reader = (
    subject: string,
    seconds: number,
  ) => IHumanActionContext.IRoot;

  /**
   * A formation checked: every block's count within its layout's capacity,
   * every size finite and positive.
   *
   * @param formation The formation.
   * @returns The same formation.
   * @throws {HumanRefusal} A `parameter` refusal naming the block and the value at fault.
   */
  export function of(formation: IHumanFormation): IHumanFormation {
    if (formation.blocks.length === 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "blocks",
        value: 0,
        reason: "a formation has no block",
        fix: "give the formation at least one block",
      });
    formation.blocks.forEach((block: IHumanFormation.IBlock, b: number): void => {
      const capacity: number = HumanFormation.capacity(block.layout);
      if (!(Number.isInteger(block.count) && block.count > 0 && block.count <= capacity))
        throw new HumanRefusal({
          kind: "parameter",
          axis: `blocks[${b}].count`,
          value: block.count,
          feasible: { kind: "range", minimum: 1, maximum: Number.isFinite(capacity) ? capacity : null, unit: "" },
          reason: `block ${b} holds ${block.count} members, which its ${block.layout.kind} layout cannot place`,
          fix: "give the block a whole number of members its layout holds",
        });
      for (const value of [block.offset?.lateral ?? 0, block.offset?.depth ?? 0, block.facing ?? 0])
        if (!Number.isFinite(value))
          throw new HumanRefusal({
            kind: "parameter",
            axis: `blocks[${b}]`,
            value,
            reason: `block ${b}'s offset or facing is not finite`,
            fix: "give finite offsets and facings",
          });
    });
    if (formation.frame.kind === "path") laid(formation.frame);
    return formation;
  }

  /**
   * How many members a layout places: its ranks times files, the square of a
   * wedge's depth, and any number for an arc or a scatter.
   *
   * @param layout The layout.
   * @returns The capacity.
   */
  export function capacity(layout: IAutoMovieFormationLayout): number {
    if (layout.kind === "line" || layout.kind === "column")
      return layout.ranks * layout.files;
    if (layout.kind === "wedge") return layout.depth * layout.depth;
    return Infinity;
  }

  /**
   * How many members the formation holds.
   *
   * @param formation The formation.
   * @returns The sum of its blocks' counts.
   */
  export function count(formation: IHumanFormation): number {
    return formation.blocks.reduce(
      (sum: number, block: IHumanFormation.IBlock): number => sum + block.count,
      0,
    );
  }

  /**
   * A slot in the formation's own frame: its lateral and depth offsets from
   * the frame's origin, its facing relative to the frame, and its block, rank
   * and file.
   *
   * @param formation The formation.
   * @param index The slot, from 0 in member order.
   * @returns The slot's local place.
   * @throws {RangeError} When the slot lies outside the formation.
   */
  export function local(
    formation: IHumanFormation,
    index: number,
  ): ILocal {
    let b: number = 0;
    let within: number = index;
    while (b < formation.blocks.length && within >= formation.blocks[b]!.count) {
      within -= formation.blocks[b]!.count;
      ++b;
    }
    if (!(Number.isInteger(index) && index >= 0) || b === formation.blocks.length)
      throw new RangeError(`Slot ${index} lies outside a formation of ${count(formation)}`);
    const block: IHumanFormation.IBlock = formation.blocks[b]!;

    // The block's own point: the engine's x is lateral, and its z, which grows rank by rank, is read as the depth toward the rear, so rank 0 is the front.
    const point: IAutoMovieVector3 = formationSlotPosition(
      {
        id: `block${b}`,
        count: block.count,
        layout: block.layout,
        anchor: { x: 0, y: 0, z: 0 },
        facingDeg: 0,
        seed: block.seed ?? 0,
      },
      within,
    );
    const facing: number = block.facing ?? 0;
    const radians: number = (facing * Math.PI) / 180;
    const cosine: number = Math.cos(radians);
    const sine: number = Math.sin(radians);
    const layout: IAutoMovieFormationLayout = block.layout;
    const rank: number =
      layout.kind === "line"
        ? Math.floor(within / layout.files)
        : layout.kind === "column"
          ? within % layout.ranks
          : layout.kind === "wedge"
            ? Math.floor(Math.sqrt(within))
            : 0;
    const file: number =
      layout.kind === "line"
        ? within % layout.files
        : layout.kind === "column"
          ? Math.floor(within / layout.ranks)
          : layout.kind === "wedge"
            ? within - rank * rank
            : within;

    // Turned by the block's facing about its origin (a facing of 90 turns the block's front to the frame's left, as a heading of 90 turns +Z to +X), then moved by its offset.
    return {
      lateral: (block.offset?.lateral ?? 0) + point.x * cosine + point.z * sine,
      depth: (block.offset?.depth ?? 0) - point.x * sine + point.z * cosine,
      facing,
      block: b,
      rank,
      file,
    };
  }

  /**
   * The formation's frame at a film second: its origin and heading.
   *
   * @param formation The formation.
   * @param seconds Film seconds.
   * @param read Reads the guide's placed root, for a guide frame.
   * @returns The origin, world metres, and the heading, degrees.
   * @throws {HumanRefusal} When a guide frame is read without a reader.
   */
  export function frame(
    formation: IHumanFormation,
    seconds: number,
    read?: Reader,
  ): { at: IAutoMovieVector3; heading: number } {
    const f: IHumanFormation.Frame = formation.frame;
    if (f.kind === "fixed") return { at: f.at, heading: f.heading };
    if (f.kind === "path") return laid(f).at(seconds);
    if (f.kind === "course") return coursed(f, seconds);
    if (read === undefined)
      throw new HumanRefusal({
        kind: "participant",
        axis: "frame",
        value: f.subject,
        reason: `the formation follows ${f.subject}, whose placed path is read only while the performance places its members`,
        fix: "read the slot from a law's context, or give the formation a fixed or path frame",
      });
    const root: IHumanActionContext.IRoot = read(f.subject, seconds);
    return { at: { x: root.position.x, y: 0, z: root.position.z }, heading: root.yaw };
  }

  /**
   * The film second the formation's frame comes to rest: a path frame's
   * stop, a course's last sample; null for a fixed frame, which never moves,
   * and for a guide frame, whose guide's rest only the performance knows.
   *
   * @param formation The formation.
   * @returns The second, or null.
   */
  export function end(formation: IHumanFormation): number | null {
    const f: IHumanFormation.Frame = formation.frame;
    if (f.kind === "path") return laid(f).end;
    if (f.kind === "course") return f.samples[f.samples.length - 1]?.seconds ?? null;
    return null;
  }

  /**
   * One slot at a film second: the local place moved into the frame.
   *
   * @param formation The formation.
   * @param index The slot.
   * @param seconds Film seconds.
   * @param read Reads the guide's placed root, for a guide frame.
   * @returns The slot.
   */
  export function slot(
    formation: IHumanFormation,
    index: number,
    seconds: number,
    read?: Reader,
  ): IHumanFormation.ISlot {
    const place: ILocal = local(formation, index);
    const origin: { at: IAutoMovieVector3; heading: number } = frame(formation, seconds, read);
    return {
      at: place_(origin, place),
      heading: origin.heading + place.facing,
      block: place.block,
      rank: place.rank,
      file: place.file,
    };
  }

  /**
   * A slot's way between two film seconds, sampled every `step` seconds and at
   * both ends: the samples a march's `via` or a timed course
   * (`ArchetypeCourse.timed`) takes.
   *
   * @param formation The formation.
   * @param index The slot.
   * @param from The first film second.
   * @param to The last film second, after `from`.
   * @param step Seconds between samples; `SAMPLE` when absent.
   * @param read Reads the guide's placed root, for a guide frame.
   * @returns The samples in time order.
   */
  export function path(
    formation: IHumanFormation,
    index: number,
    from: number,
    to: number,
    step: number = SAMPLE,
    read?: Reader,
  ): IHumanFormation.ISample[] {
    if (!(to > from && step > 0))
      throw new RangeError(`A slot's way runs forward in positive steps: ${from} to ${to} by ${step}`);
    const place: ILocal = local(formation, index);
    const count: number = Math.ceil((to - from) / step - 1e-9);
    const samples: IHumanFormation.ISample[] = [];
    for (let k: number = 0; k <= count; ++k) {
      const seconds: number = k === count ? to : from + k * step;
      const at: IAutoMovieVector3 = place_(frame(formation, seconds, read), place);
      samples.push({ seconds, x: at.x, y: at.y, z: at.z });
    }
    return samples;
  }

  /**
   * Which slot each member takes: in member order, or the assignment of least
   * total distance from where the members stand to the slots at a second
   * (Kuhn's Hungarian method, the engine's `assignAutoMovieMinimumCost`).
   *
   * @param formation The formation.
   * @param members Where each member stands, world metres.
   * @param rule `order` keeps member order; `nearest` minimises the total distance.
   * @param seconds The film second the slots are read at.
   * @param read Reads the guide's placed root, for a guide frame.
   * @returns The slot of each member.
   * @throws {HumanRefusal} When there are more members than slots.
   */
  export function assign(
    formation: IHumanFormation,
    members: readonly IAutoMovieVector3[],
    rule: "order" | "nearest",
    seconds: number,
    read?: Reader,
  ): number[] {
    const slots: number = count(formation);
    if (members.length > slots)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "members",
        value: members.length,
        feasible: { kind: "range", minimum: 0, maximum: slots, unit: "" },
        reason: `${members.length} members cannot take distinct slots of ${slots}`,
        fix: "give the formation a slot for every member",
      });
    if (rule === "order") return members.map((_: IAutoMovieVector3, i: number): number => i);
    const points: IAutoMovieVector3[] = [];
    for (let s: number = 0; s < slots; ++s) points.push(slot(formation, s, seconds, read).at);
    return assignAutoMovieMinimumCost(
      members.map((m: IAutoMovieVector3): number[] =>
        points.map((p: IAutoMovieVector3): number => Math.hypot(p.x - m.x, p.z - m.z)),
      ),
    );
  }

  /**
   * A place in the formation's own frame moved into the world by a frame's
   * origin and heading: lateral to the frame's right, depth to its rear.
   *
   * @param origin The frame at a second.
   * @param place The lateral and depth offsets, metres.
   * @returns The floor point, world metres.
   */
  export function place(
    origin: { at: IAutoMovieVector3; heading: number },
    place: { lateral: number; depth: number },
  ): IAutoMovieVector3 {
    return place_(origin, place);
  }

  /** A slot's place in the formation's own frame. */
  export interface ILocal {
    /** Metres along the frame's lateral axis. */
    lateral: number;

    /** Metres toward the frame's rear. */
    depth: number;

    /** Degrees relative to the frame's heading. */
    facing: number;

    /** Its block. */
    block: number;

    /** Its rank, from 0 at the front. */
    rank: number;

    /** Its file, from 0. */
    file: number;
  }
}

/** Every laid path frame, by its record, so a formation's frame is laid once. */
const LAID: WeakMap<IHumanFormation.IPath, HumanFormationPath.ILaid> = new WeakMap();

/** The laid path frame of a record. */
function laid(frame: IHumanFormation.IPath): HumanFormationPath.ILaid {
  let out: HumanFormationPath.ILaid | undefined = LAID.get(frame);
  if (out === undefined) {
    out = HumanFormationPath.lay(
      frame,
      frame.acceleration ?? HumanFormation.ACCELERATION,
      frame.turn ?? HumanFormation.TURN,
    );
    LAID.set(frame, out);
  }
  return out;
}

/** A course frame at a second: linear between its samples, heading the way it moves, kept while it stands (the first way it moves before it sets off). */
function coursed(
  frame: IHumanFormation.ICourse,
  seconds: number,
): { at: IAutoMovieVector3; heading: number } {
  const s: readonly IHumanFormation.ISample[] = frame.samples;
  if (s.length === 0) throw new RangeError("A course frame has no samples");
  let i: number = 0;
  while (i + 2 < s.length && s[i + 1]!.seconds <= seconds) ++i;
  const a: IHumanFormation.ISample = s[i]!;
  const b: IHumanFormation.ISample = s[Math.min(i + 1, s.length - 1)]!;
  const span: number = b.seconds - a.seconds;
  const u: number = span <= 0 ? 0 : Math.min(1, Math.max(0, (seconds - a.seconds) / span));
  const heading = (k: number): number | null => {
    const p: IHumanFormation.ISample = s[k]!;
    const q: IHumanFormation.ISample = s[k + 1]!;
    return Math.hypot(q.x - p.x, q.z - p.z) < 1e-9 ? null : (Math.atan2(q.x - p.x, q.z - p.z) * 180) / Math.PI;
  };
  let yaw: number | null = null;
  for (let k: number = Math.min(i, s.length - 2); k >= 0 && yaw === null; --k) yaw = heading(k);
  for (let k: number = Math.min(i, s.length - 2) + 1; k < s.length - 1 && yaw === null; ++k) yaw = heading(k);
  return {
    at: { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u },
    heading: yaw ?? 0,
  };
}

/**
 * A local place moved into a frame: the frame's lateral axis is its right,
 * `(-cos h, 0, sin h)`, and its depth runs to the rear, `-(sin h, 0, cos h)`,
 * which is the engine's `formationSlotPosition` placing the block with its
 * facing turned about, so a population designed from the same block stands
 * on the same slots.
 */
function place_(
  origin: { at: IAutoMovieVector3; heading: number },
  place: { lateral: number; depth: number },
): IAutoMovieVector3 {
  const radians: number = (origin.heading * Math.PI) / 180;
  const sine: number = Math.sin(radians);
  const cosine: number = Math.cos(radians);
  return {
    x: origin.at.x - place.lateral * cosine - place.depth * sine,
    y: origin.at.y,
    z: origin.at.z + place.lateral * sine - place.depth * cosine,
  };
}
