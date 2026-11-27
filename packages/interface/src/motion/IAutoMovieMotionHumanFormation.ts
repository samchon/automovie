import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFormationLayout } from "../production/IAutoMovieFormationLayout";
import type { IAutoMovieMotionHumanActionContext } from "./IAutoMovieMotionHumanActionContext";

/**
 * A formation as data: blocks of the interface's layout union, in member order,
 * placed in a frame that moves.
 *
 * A block lays its members with its layout (the engine's
 * `formationSlotPosition`, one owner of layout geometry and dressing) in its
 * own frame, whose depth runs from the front rank to the rear, then is turned
 * by `facing` and moved by `offset` in the formation's frame, which stands
 * where `frame` puts it at every film second. A square is four `line` blocks
 * faced 0, 90, 180 and 270 degrees; a battalion of companies, a squadron of two
 * ranks and a procession are compositions of blocks, not layouts of their own.
 *
 * Distances are metres and angles degrees about +Y with 0 facing +Z. A
 * formation's `lateral` axis is the frame's right (-X when it faces +Z), so
 * file 0 stands on its left, and its `depth` axis runs toward its rear. Every
 * value is checked by `HumanFormation`.
 */
export interface IAutoMovieMotionHumanFormation {
  /** The blocks, in member order: block 0's members first. */
  blocks: readonly IAutoMovieMotionHumanFormation.IBlock[];

  /** Where the formation's origin is and which way it faces, at any film second. */
  frame: IAutoMovieMotionHumanFormation.Frame;
}

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
export namespace IAutoMovieMotionHumanFormation {
  /**
   * A member's station: the slot it keeps in a formation, read by the walk
   * family's `station` (`walkStation.resolve`). The walk goes along the slot's
   * way from the action's start until the frame comes to rest, or until
   * `until`, which a guide frame must give.
   */
  export interface IStation {
    /** The formation. */
    formation: IAutoMovieMotionHumanFormation;

    /** The slot kept, from 0. */
    slot: number;

    /** The film second the station ends; the frame's own end when absent. */
    until?: number;

    /**
     * The member's slow deviation from its slot (`HumanEnsemble.station`): its
     * bound, metres, and the stream seed its lateral and depth deviations are
     * drawn from; none when absent.
     */
    dress?: {
      /** Maximum station drift in metres. */
      bound: number;
      /** Stable seed for deterministic station drift. */
      seed: string;
    };
  }

  /** One block of members. */
  export interface IBlock {
    /** Its layout, the interface's union. */
    layout: IAutoMovieFormationLayout;

    /**
     * How many members it holds, a positive whole number within the layout's
     * capacity.
     */
    count: number;

    /**
     * Where its own origin stands in the formation's frame, metres; the frame's
     * origin when absent.
     */
    offset?: {
      /** Formation-local lateral offset, metres. */
      lateral: number;
      /** Formation-local front-to-rear offset, metres. */
      depth: number;
    };

    /** Which way it faces relative to the frame, degrees; 0 when absent. */
    facing?: number;

    /**
     * Its dressing's and scatter's seed, a whole number; drawn from the
     * formation's key when absent.
     */
    seed?: number;
  }

  /** Where the formation stands and faces. */
  export type Frame =
    | IAutoMovieMotionHumanFormation.IFixed
    | IAutoMovieMotionHumanFormation.IGuide
    | IAutoMovieMotionHumanFormation.IPath
    | IAutoMovieMotionHumanFormation.ICourse;

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

    /**
     * The path's corners on the floor, world metres, at least two; `y` is not
     * read.
     */
    via: readonly IAutoMovieVector3[];

    /**
     * Its heading: along the path, or a fixed heading in degrees; along when
     * absent.
     */
    heading?: "along" | number;

    /** The film second it starts moving; 0 when absent. */
    start?: number;

    /**
     * Its cruising speed, metres per second, stopping at the path's end
     * ({@link IAutoMovieMotionHumanGait} gives a walking crowd's: 1.5 m/s, a run
     * 3.4 m/s); or speed marks, each the speed it changes to from a film second
     * on, the last held until it brakes to a stop at the end.
     */
    speed:
      | number
      | {
          /**
           * Ordered speed-change marks: each supplies metres per second from
           * its film second onward; the last speed is held until final
           * braking.
           */
          marks: readonly IAutoMovieMotionHumanFormation.IMark[];
        };

    /**
     * Its acceleration and braking, metres per second squared;
     * `HumanFormation.ACCELERATION` when absent (2.68, a pedestrian's 1.34 m/s
     * over 0.5 s, Helbing and Molnar 1995), so a walk's speed is reached in
     * half a second.
     */
    acceleration?: number;

    /**
     * Metres of path over which its heading turns at each corner, half before
     * and half after; `HumanFormation.TURN` when absent (1.5 m, about two
     * marching steps, provisional).
     */
    turn?: number;
  }

  /** One speed mark of a path frame. */
  export interface IMark {
    /** The film second the speed starts changing. */
    at: number;

    /** The speed it changes to, metres per second, at least 0. */
    speed: number;
  }

  /**
   * A frame that travels a planned course: samples of its origin at film
   * seconds (a steered course, `HumanCrowd.steer`, or a wheel,
   * `manoeuvreWheel`), read between them linearly, its heading the samples' own
   * when they carry one, else the direction it moves in, kept while it stands.
   */
  export interface ICourse {
    /** The discriminator. */
    kind: "course";

    /**
     * The origin at film seconds, at least two, in time order; held at the
     * ends.
     */
    samples: readonly IAutoMovieMotionHumanFormation.ISample[];
  }

  /**
   * A sample of a slot's way: a floor point at a film second, the record a
   * timed course reads.
   */
  export interface ISample {
    /** The film second. */
    seconds: number;

    /** World metres, x. */
    x: number;

    /** World metres, y. */
    y: number;

    /** World metres, z. */
    z: number;

    /**
     * A course frame's heading here, degrees, unwrapped along the course, when
     * it turns otherwise than it moves (a wheel about its pivot,
     * `manoeuvreWheel`); the way it moves when absent. Not read on a slot's
     * way.
     */
    heading?: number;
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

  /**
   * Reads a performer's placed root at a film second, for a guide frame:
   * `IAutoMovieMotionHumanPerformerReader.root` of the guide.
   */
  export type Reader = (
    subject: string,
    seconds: number,
  ) => IAutoMovieMotionHumanActionContext.IRoot;

  /**
   * The formation's frame at a film second: its origin and heading. Result
   * returned by HumanFormation.frame. The origin, world metres, and the
   * heading, degrees.
   */
  export type IFrameResult = {
    /** Formation origin in world metres. */
    at: IAutoMovieVector3;
    /** Formation yaw in degrees about world +Y, zero toward +Z. */
    heading: number;
  };

  /**
   * A place in the formation's own frame moved into the world by a frame's
   * origin and heading: lateral to the frame's right, depth to its rear. Input
   * origin of HumanFormation.place. The frame at a second.
   */
  export type IPlaceOrigin = {
    /** Formation origin in world metres. */
    at: IAutoMovieVector3;
    /** Formation yaw in degrees about world +Y, zero toward +Z. */
    heading: number;
  };

  /**
   * A place in the formation's own frame moved into the world by a frame's
   * origin and heading: lateral to the frame's right, depth to its rear. Input
   * place of HumanFormation.place. The lateral and depth offsets, metres.
   */
  export type IPlacePlace = {
    /** Slot's lateral offset in the formation frame, metres. */
    lateral: number;
    /** Slot's front-to-rear offset in the formation frame, metres. */
    depth: number;
  };
}
