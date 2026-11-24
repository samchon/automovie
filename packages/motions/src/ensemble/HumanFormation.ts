import {
  assignAutoMovieMinimumCost,
  formationSlotPosition,
} from "@automovie/engine";
import type {
  IAutoMovieFormationLayout,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanFormation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFormationPath } from "./HumanFormationPath";
import { formationCourseFrame } from "./formationCourseFrame";

/**
 * Formations: validating one, and reading where each member's slot stands at a
 * film second, the way it travels between two seconds, and which member takes
 * which slot.
 *
 * A slot is laid by the engine's `formationSlotPosition` in its block's own
 * frame (the layout's geometry and dressing have that one owner), its depth
 * turned to run from the front rank to the rear, then turned by the block's
 * facing, moved by its offset and placed in the formation's frame at that
 * second. A member keeps its slot by its own travel: a cadenced march walks the
 * slot's way (`path`) and lets its step give, a free walk follows the slot by
 * speed matching (`walkStation`).
 */
export namespace HumanFormation {
  /**
   * A path frame's acceleration and braking when it states none, metres per
   * second squared: a pedestrian's normal desired speed over the relaxation
   * time of the social force model, 1.34 m/s over 0.5 s (Helbing and Molnar
   * 1995, Phys Rev E 51:4282), the initial rate of its driving term from rest.
   */
  export const ACCELERATION: number = 1.34 / 0.5;

  /**
   * Metres of path over which a path frame turns at a corner when it states
   * none (provisional: about two marching steps).
   */
  export const TURN: number = 1.5;

  /**
   * Seconds between two samples of a slot's way when the caller asks no other
   * (provisional: a few samples a step, as `walkFollowed.STEP`).
   */
  export const SAMPLE: number = 0.25;

  /**
   * A formation checked: every block's count within its layout's capacity,
   * every size finite and positive.
   *
   * @param formation The formation.
   * @returns The same formation.
   * @throws {HumanRefusal} A `parameter` refusal naming the block and the value
   *   at fault.
   */
  export function of(
    formation: IAutoMovieMotionHumanFormation,
  ): IAutoMovieMotionHumanFormation {
    if (formation.blocks.length === 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "blocks",
        value: 0,
        reason: "a formation has no block",
        fix: "give the formation at least one block",
      });
    formation.blocks.forEach(
      (block: IAutoMovieMotionHumanFormation.IBlock, b: number): void => {
        const capacity: number = HumanFormation.capacity(block.layout);
        if (
          !(
            Number.isInteger(block.count) &&
            block.count > 0 &&
            block.count <= capacity
          )
        )
          throw new HumanRefusal({
            kind: "parameter",
            axis: `blocks[${b}].count`,
            value: block.count,
            feasible: {
              kind: "range",
              minimum: 1,
              maximum: Number.isFinite(capacity) ? capacity : null,
              unit: "",
            },
            reason: `block ${b} holds ${block.count} members, which its ${block.layout.kind} layout cannot place`,
            fix: "give the block a whole number of members its layout holds",
          });
        for (const value of [
          block.offset?.lateral ?? 0,
          block.offset?.depth ?? 0,
          block.facing ?? 0,
        ])
          if (!Number.isFinite(value))
            throw new HumanRefusal({
              kind: "parameter",
              axis: `blocks[${b}]`,
              value,
              reason: `block ${b}'s offset or facing is not finite`,
              fix: "give finite offsets and facings",
            });
      },
    );

    // A path frame that cannot be laid is refused here, as the formation is checked.
    if (formation.frame.kind === "path") prepare(formation);
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
  export function count(formation: IAutoMovieMotionHumanFormation): number {
    return formation.blocks.reduce(
      (sum: number, block: IAutoMovieMotionHumanFormation.IBlock): number =>
        sum + block.count,
      0,
    );
  }

  /**
   * A slot in the formation's own frame: its lateral and depth offsets from the
   * frame's origin, its facing relative to the frame, and its block, rank and
   * file.
   *
   * @param formation The formation.
   * @param index The slot, from 0 in member order.
   * @returns The slot's local place.
   * @throws {RangeError} When the slot lies outside the formation.
   */
  export function local(
    formation: IAutoMovieMotionHumanFormation,
    index: number,
  ): IAutoMovieMotionHumanFormation.ILocal {
    let b: number = 0;
    let within: number = index;
    while (
      b < formation.blocks.length &&
      within >= formation.blocks[b]!.count
    ) {
      within -= formation.blocks[b]!.count;
      ++b;
    }
    if (
      !(Number.isInteger(index) && index >= 0) ||
      b === formation.blocks.length
    )
      throw new RangeError(
        `Slot ${index} lies outside a formation of ${count(formation)}`,
      );
    const block: IAutoMovieMotionHumanFormation.IBlock = formation.blocks[b]!;

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
   * A block's rear rank: the greatest rank its slots stand in.
   *
   * @param formation The formation.
   * @param block The block, from 0.
   * @returns The rank, 0 for a block of one rank.
   */
  export function rear(
    formation: IAutoMovieMotionHumanFormation,
    block: number,
  ): number {
    let first: number = 0;
    for (let b: number = 0; b < block; ++b) first += formation.blocks[b]!.count;
    let last: number = 0;
    for (let k: number = 0; k < formation.blocks[block]!.count; ++k)
      last = Math.max(last, local(formation, first + k).rank);
    return last;
  }

  /**
   * A formation prepared for reading: its frame laid once, then its frame and
   * slots read at any film second in closed form.
   */
  export interface IPrepared {
    /** The formation. */
    formation: IAutoMovieMotionHumanFormation;

    /**
     * The film second the formation's frame comes to rest: a path frame's stop,
     * a course's last sample; null for a fixed frame, which never moves, and
     * for a guide frame, whose guide's rest only the performance knows.
     */
    end: number | null;

    /**
     * The formation's frame at a film second: its origin and heading.
     *
     * @param seconds Film seconds.
     * @param read Reads the guide's placed root, for a guide frame.
     * @returns The origin, world metres, and the heading, degrees.
     * @throws {HumanRefusal} When a guide frame is read without a reader.
     */
    frame(
      seconds: number,
      read?: IAutoMovieMotionHumanFormation.Reader,
    ): IAutoMovieMotionHumanFormation.IFrameResult;

    /**
     * One slot at a film second: the local place moved into the frame.
     *
     * @param index The slot.
     * @param seconds Film seconds.
     * @param read Reads the guide's placed root, for a guide frame.
     * @returns The slot.
     */
    slot(
      index: number,
      seconds: number,
      read?: IAutoMovieMotionHumanFormation.Reader,
    ): IAutoMovieMotionHumanFormation.ISlot;

    /**
     * A slot's way between two film seconds, sampled every `step` seconds and
     * at both ends: the samples a march's `via` or a timed course
     * (`AutoMovieArchetypeCourse.timed`) takes.
     *
     * @param index The slot.
     * @param from The first film second.
     * @param to The last film second, after `from`.
     * @param step Seconds between samples; `SAMPLE` when absent.
     * @param read Reads the guide's placed root, for a guide frame.
     * @returns The samples in time order.
     */
    path(
      index: number,
      from: number,
      to: number,
      step?: number,
      read?: IAutoMovieMotionHumanFormation.Reader,
    ): IAutoMovieMotionHumanFormation.ISample[];

    /**
     * Which slot each member takes: in member order, or the assignment of least
     * total distance from where the members stand to the slots at a second
     * (Kuhn's Hungarian method, the engine's `assignAutoMovieMinimumCost`).
     *
     * @param members Where each member stands, world metres.
     * @param rule `order` keeps member order; `nearest` minimises the total
     *   distance.
     * @param seconds The film second the slots are read at.
     * @param read Reads the guide's placed root, for a guide frame.
     * @returns The slot of each member.
     * @throws {HumanRefusal} When there are more members than slots.
     */
    assign(
      members: readonly IAutoMovieVector3[],
      rule: AssignRule,
      seconds: number,
      read?: IAutoMovieMotionHumanFormation.Reader,
    ): number[];
  }

  /** How members take slots: in member order, or by least total distance. */
  export type AssignRule = "order" | "nearest";

  /**
   * Prepare a formation for reading: a path frame is laid once
   * (`HumanFormationPath.lay`, at the frame's acceleration and turn or
   * `ACCELERATION` and `TURN`), and the frame and slots are then read from it.
   *
   * @param formation The formation.
   * @returns The prepared formation.
   * @throws {HumanRefusal} When a path frame cannot be laid.
   */
  export function prepare(
    formation: IAutoMovieMotionHumanFormation,
  ): IPrepared {
    const f: IAutoMovieMotionHumanFormation.Frame = formation.frame;
    const laid: HumanFormationPath.ILaid | null =
      f.kind === "path"
        ? HumanFormationPath.lay(
            f,
            f.acceleration ?? ACCELERATION,
            f.turn ?? TURN,
          )
        : null;
    const frame: IPrepared["frame"] = (
      seconds: number,
      read?: IAutoMovieMotionHumanFormation.Reader,
    ): IAutoMovieMotionHumanFormation.IFrameResult => {
      if (f.kind === "fixed") return { at: f.at, heading: f.heading };
      if (f.kind === "path") return laid!.at(seconds);
      if (f.kind === "course") return formationCourseFrame(f, seconds);
      if (read === undefined)
        throw new HumanRefusal({
          kind: "participant",
          axis: "frame",
          value: f.subject,
          reason: `the formation follows ${f.subject}, whose placed path is read only while the performance places its members`,
          fix: "read the slot from a law's context, or give the formation a fixed or path frame",
        });
      const root: IAutoMovieMotionHumanActionContext.IRoot = read(
        f.subject,
        seconds,
      );
      return {
        at: { x: root.position.x, y: 0, z: root.position.z },
        heading: root.yaw,
      };
    };
    const slot: IPrepared["slot"] = (
      index: number,
      seconds: number,
      read?: IAutoMovieMotionHumanFormation.Reader,
    ): IAutoMovieMotionHumanFormation.ISlot => {
      const place: IAutoMovieMotionHumanFormation.ILocal = local(
        formation,
        index,
      );
      const origin: IAutoMovieMotionHumanFormation.IFrameResult = frame(
        seconds,
        read,
      );
      return {
        at: place_(origin, place),
        heading: origin.heading + place.facing,
        block: place.block,
        rank: place.rank,
        file: place.file,
      };
    };
    const path: IPrepared["path"] = (
      index: number,
      from: number,
      to: number,
      step: number = SAMPLE,
      read?: IAutoMovieMotionHumanFormation.Reader,
    ): IAutoMovieMotionHumanFormation.ISample[] => {
      if (!(to > from && step > 0))
        throw new RangeError(
          `A slot's way runs forward in positive steps: ${from} to ${to} by ${step}`,
        );
      const place: IAutoMovieMotionHumanFormation.ILocal = local(
        formation,
        index,
      );
      const count: number = Math.ceil((to - from) / step - 1e-9);
      const samples: IAutoMovieMotionHumanFormation.ISample[] = [];
      for (let k: number = 0; k <= count; ++k) {
        const seconds: number = k === count ? to : from + k * step;
        const at: IAutoMovieVector3 = place_(frame(seconds, read), place);
        samples.push({ seconds, x: at.x, y: at.y, z: at.z });
      }
      return samples;
    };
    const assign: IPrepared["assign"] = (
      members: readonly IAutoMovieVector3[],
      rule: AssignRule,
      seconds: number,
      read?: IAutoMovieMotionHumanFormation.Reader,
    ): number[] => {
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
      if (rule === "order")
        return members.map((_: IAutoMovieVector3, i: number): number => i);
      const points: IAutoMovieVector3[] = [];
      for (let s: number = 0; s < slots; ++s)
        points.push(slot(s, seconds, read).at);
      return assignAutoMovieMinimumCost(
        members.map((m: IAutoMovieVector3): number[] =>
          points.map((p: IAutoMovieVector3): number =>
            Math.hypot(p.x - m.x, p.z - m.z),
          ),
        ),
      );
    };
    const end: number | null =
      f.kind === "path"
        ? laid!.end
        : f.kind === "course"
          ? (f.samples[f.samples.length - 1]?.seconds ?? null)
          : null;
    return { formation, end, frame, slot, path, assign };
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
    origin: IAutoMovieMotionHumanFormation.IPlaceOrigin,
    place: IAutoMovieMotionHumanFormation.IPlacePlace,
  ): IAutoMovieVector3 {
    return place_(origin, place);
  }
}
/** The record of `IPlacePlace2`'s site. */
type IPlacePlace2 = { lateral: number; depth: number };

/** The record of `IPlaceOrigin2`'s site. */
type IPlaceOrigin2 = { at: IAutoMovieVector3; heading: number };

/**
 * A local place moved into a frame: the frame's lateral axis is its right,
 * `(-cos h, 0, sin h)`, and its depth runs to the rear, `-(sin h, 0, cos h)`,
 * which is the engine's `formationSlotPosition` placing the block with its
 * facing turned about, so a population designed from the same block stands on
 * the same slots.
 */
function place_(origin: IPlaceOrigin2, place: IPlacePlace2): IAutoMovieVector3 {
  const radians: number = (origin.heading * Math.PI) / 180;
  const sine: number = Math.sin(radians);
  const cosine: number = Math.cos(radians);
  return {
    x: origin.at.x - place.lateral * cosine - place.depth * sine,
    y: origin.at.y,
    z: origin.at.z + place.lateral * sine - place.depth * cosine,
  };
}
