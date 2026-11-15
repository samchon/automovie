import type {
  IAutoMovieFormationLayout,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A formation as data: blocks of the interface's layout union, in member
 * order, placed in a frame that moves.
 *
 * A block lays its members with its layout (the engine's
 * `formationSlotPosition`, one owner of layout geometry and dressing) in its
 * own frame, whose depth runs from the front rank to the rear, then is
 * turned by `facing` and moved by `offset` in the formation's frame, which
 * stands where `frame` puts it at every film second. A square is four
 * `line` blocks faced 0, 90, 180 and 270 degrees; a battalion of companies,
 * a squadron of two ranks and a procession are compositions of blocks, not
 * layouts of their own.
 *
 * Distances are metres and angles degrees about +Y with 0 facing +Z. A
 * formation's `lateral` axis is the frame's right (-X when it faces +Z), so
 * file 0 stands on its left, and its `depth` axis runs toward its rear. Every value is checked by `HumanFormation.of`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frames, the units, the axes, how a block is placed and what is composed from blocks.
 * @evidence contracts/development/design.md#principled-representation The interface's layout union reused unchanged, a block's placement in the formation's frame, and the frame as a closed union of its three ways of moving.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Blocks and a frame; `HumanFormation` reads them, the ensemble, the manoeuvre and the population take them.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No `square` layout: four outward-faced blocks are one.
 */
export interface IHumanFormation {
  /** The blocks, in member order: block 0's members first. */
  blocks: readonly IHumanFormation.IBlock[];

  /** Where the formation's origin is and which way it faces, at any film second. */
  frame: IHumanFormation.Frame;
}

/**
 * Companion types of {@link IHumanFormation}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each type and member states its unit, frame and meaning.
 * @evidence contracts/development/design.md#principled-representation A frame is fixed, a performer's placed root, a path timed by speed marks or a planned course; a slot is a point with its heading and its place in its block.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What a block, a frame and a slot need for station keeping and manoeuvres.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The frame kinds are a union, never optional fields that combine.
 */
export namespace IHumanFormation {
  /** One block of members. */
  export interface IBlock {
    /** Its layout, the interface's union. */
    layout: IAutoMovieFormationLayout;

    /** How many members it holds, a positive whole number within the layout's capacity. */
    count: number;

    /** Where its own origin stands in the formation's frame, metres; the frame's origin when absent. */
    offset?: { lateral: number; depth: number };

    /** Which way it faces relative to the frame, degrees; 0 when absent. */
    facing?: number;

    /** Its dressing's and scatter's seed, a whole number; drawn from the formation's key when absent. */
    seed?: number;
  }

  /** Where the formation stands and faces. */
  export type Frame = IFixed | IGuide | IPath | ICourse;

  /** A frame that stands still. */
  export interface IFixed {
    /** The discriminator. */
    kind: "fixed";

    /** Its origin, world metres. */
    at: IAutoMovieVector3;

    /** Its heading, degrees. */
    heading: number;
  }

  /** A frame carried by a performer: their placed root and heading. */
  export interface IGuide {
    /** The discriminator. */
    kind: "guide";

    /** The guide performer, composed before the members who read it. */
    subject: string;
  }

  /** A frame that travels a path at authored speeds. */
  export interface IPath {
    /** The discriminator. */
    kind: "path";

    /** The path's corners on the floor, world metres, at least two; `y` is not read. */
    via: readonly IAutoMovieVector3[];

    /** Its heading: along the path, or a fixed heading in degrees; along when absent. */
    heading?: "along" | number;

    /** The film second it starts moving; 0 when absent. */
    start?: number;

    /** Its cruising speed, metres per second, stopping at the path's end; or speed marks, each the speed it changes to from a film second on, the last held until it brakes to a stop at the end. */
    speed: number | { marks: readonly IMark[] };

    /** Its acceleration and braking, metres per second squared; `HumanFormation.ACCELERATION` when absent. */
    acceleration?: number;

    /** Metres of path over which its heading turns at each corner, half before and half after; `HumanFormation.TURN` when absent. */
    turn?: number;
  }

  /**
   * A frame that travels a planned course: samples of its origin at film
   * seconds (a steered course, `HumanCrowd.steer`), read between them
   * linearly, its heading the direction it moves in and kept while it stands.
   */
  export interface ICourse {
    /** The discriminator. */
    kind: "course";

    /** The origin at film seconds, at least two, in time order; held at the ends. */
    samples: readonly ISample[];
  }

  /**
   * A member's station: the slot it keeps in a formation, read by the walk
   * family's `station` (`walkStation.resolve`). The walk goes along the
   * slot's way from the action's start until the frame comes to rest, or
   * until `until`, which a guide frame must give.
   */
  export interface IStation {
    /** The formation. */
    formation: IHumanFormation;

    /** The slot kept, from 0. */
    slot: number;

    /** The film second the station ends; the frame's own end when absent. */
    until?: number;

    /**
     * The member's slow deviation from its slot (`HumanEnsemble.station`):
     * its bound, metres, and the stream seed its lateral and depth
     * deviations are drawn from; none when absent.
     */
    dress?: { bound: number; seed: string };
  }

  /** One speed mark of a path frame. */
  export interface IMark {
    /** The film second the speed starts changing. */
    at: number;

    /** The speed it changes to, metres per second, at least 0. */
    speed: number;
  }

  /** One member's slot at one film second. */
  export interface ISlot {
    /** The slot's floor point, world metres. */
    at: IAutoMovieVector3;

    /** The heading the member faces in it, degrees. */
    heading: number;

    /** Its block's index. */
    block: number;

    /** Its rank within the block, from 0 at the front. */
    rank: number;

    /** Its file within the block, from 0. */
    file: number;
  }

  /** A sample of a slot's way: a floor point at a film second, the record a timed course reads. */
  export interface ISample {
    /** The film second. */
    seconds: number;

    /** World metres, x. */
    x: number;

    /** World metres, y. */
    y: number;

    /** World metres, z. */
    z: number;
  }
}
