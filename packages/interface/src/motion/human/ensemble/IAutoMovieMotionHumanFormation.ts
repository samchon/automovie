import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieFormationLayout } from "../../../production/IAutoMovieFormationLayout";
import type { IAutoMovieMotionHumanActionContext } from "../law/IAutoMovieMotionHumanActionContext";

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
export interface IAutoMovieMotionHumanFormation {
  /** The blocks, in member order: block 0's members first. */
  blocks: readonly IAutoMovieMotionHumanFormation.IBlock[];

  /** Where the formation's origin is and which way it faces, at any film second. */
  frame: IAutoMovieMotionHumanFormation.Frame;
}

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
 * @evidence contracts/development/common.md#meaningful-documentation until: The film second the station ends; the frame's own end when absent. dress: The member's slow deviation from its slot (`HumanEnsemble.station`): its bound, metres, and the stream seed its lateral and depth deviations are drawn from; none when absent. count: How many members it holds, a positive whole number within the layout's capacity.
 * @evidence contracts/development/design.md#principled-representation until: The film second the station ends; the frame's own end when absent. dress: The member's slow deviation from its slot (`HumanEnsemble.station`): its bound, metres, and the stream seed its lateral and depth deviations are drawn from; none when absent. count: How many members it holds, a positive whole number within the layout's capacity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.station, formation); ensemble/HumanEnsembleMembers.ts (rearRank, formation); ensemble/HumanEnsembleMembers.ts (flank, formation); ensemble/HumanFormation.ts (HumanFormation.of, formation); ensemble/HumanFormation.ts (HumanFormation.of, return); ensemble/HumanFormation.ts (HumanFormation.count, formation).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieFormationLayout, IAutoMovieVector3, IAutoMovieMotionHumanActionContext.IRoot identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanFormation {
  /**
   * A member's station: the slot it keeps in a formation, read by the walk
   * family's `station` (`walkStation.resolve`). The walk goes along the
   * slot's way from the action's start until the frame comes to rest, or
   * until `until`, which a guide frame must give.
   *
   * @evidence contracts/development/common.md#meaningful-documentation until: The film second the station ends; the frame's own end when absent. dress: The member's slow deviation from its slot (`HumanEnsemble.station`): its bound, metres, and the stream seed its lateral and depth deviations are drawn from; none when absent.
   * @evidence contracts/development/design.md#principled-representation until: The film second the station ends; the frame's own end when absent. dress: The member's slow deviation from its slot (`HumanEnsemble.station`): its bound, metres, and the stream seed its lateral and depth deviations are drawn from; none when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkStation.ts (walkStation.rests, station); actions/walkStation.ts (walkStation.point, station); ensemble/HumanEnsemble.ts (HumanEnsemble.station, return); ensemble/HumanManoeuvre.ts (HumanManoeuvre.plan.stations, return); ensemble/manoeuvreWheel.ts (manoeuvreWheel, return); actions/walkClock.ts (walkClock).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanFormation identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IStation {
    /** The formation. */
    formation: IAutoMovieMotionHumanFormation;

    /** The slot kept, from 0. */
    slot: number;

    /** The film second the station ends; the frame's own end when absent. */
    until?: number;

    /**
     * The member's slow deviation from its slot (`HumanEnsemble.station`):
     * its bound, metres, and the stream seed its lateral and depth
     * deviations are drawn from; none when absent.
     */
    dress?: {
      /** Maximum station drift in metres. */
      bound: number;
      /** Stable seed for deterministic station drift. */
      seed: string;
    };
  }

  /**
   * One block of members.
   *
   * @evidence contracts/development/common.md#meaningful-documentation count: How many members it holds, a positive whole number within the layout's capacity. offset: Where its own origin stands in the formation's frame, metres; the frame's origin when absent. facing: Which way it faces relative to the frame, degrees; 0 when absent.
   * @evidence contracts/development/design.md#principled-representation count: How many members it holds, a positive whole number within the layout's capacity. offset: Where its own origin stands in the formation's frame, metres; the frame's origin when absent. facing: Which way it faces relative to the frame, degrees; 0 when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanFormation.ts (HumanFormation.of, block); ensemble/HumanFormation.ts (HumanFormation.count, block); ensemble/HumanPopulation.ts (HumanPopulation.design, block); ensemble/manoeuvreWheel.ts (manoeuvreWheel.formation, b); ensemble/manoeuvreWheel.ts (manoeuvreWheel.formation, return); ensemble/HumanFormation.ts (HumanFormation.local).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieFormationLayout identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IBlock {
    /** Its layout, the interface's union. */
    layout: IAutoMovieFormationLayout;

    /** How many members it holds, a positive whole number within the layout's capacity. */
    count: number;

    /** Where its own origin stands in the formation's frame, metres; the frame's origin when absent. */
    offset?: {
      /** Formation-local lateral offset, metres. */
      lateral: number;
      /** Formation-local front-to-rear offset, metres. */
      depth: number;
    };

    /** Which way it faces relative to the frame, degrees; 0 when absent. */
    facing?: number;

    /** Its dressing's and scatter's seed, a whole number; drawn from the formation's key when absent. */
    seed?: number;
  }

  /**
   * Where the formation stands and faces.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Where the formation stands and faces.
   * @evidence contracts/development/design.md#principled-representation The kind discriminant selects a fixed frame, a performer-guided frame, a timed path or a prescribed course; each case owns the coordinates and timing it needs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanFormation.ts (HumanFormation.frame); ensemble/HumanFormation.ts (HumanFormation.end).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanFormation.IFixed, IAutoMovieMotionHumanFormation.IGuide, IAutoMovieMotionHumanFormation.IPath, IAutoMovieMotionHumanFormation.ICourse identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type Frame =
    | IAutoMovieMotionHumanFormation.IFixed
    | IAutoMovieMotionHumanFormation.IGuide
    | IAutoMovieMotionHumanFormation.IPath
    | IAutoMovieMotionHumanFormation.ICourse;

  /**
   * A frame that stands still.
   *
   * @evidence contracts/development/common.md#meaningful-documentation at: Its origin, world metres. heading: Its heading, degrees.
   * @evidence contracts/development/design.md#principled-representation at: Its origin, world metres. heading: Its heading, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in ensemble/IAutoMovieMotionHumanFormation.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IFixed {
    /** The discriminator. */
    kind: "fixed";

    /** Its origin, world metres. */
    at: IAutoMovieVector3;

    /** Its heading, degrees. */
    heading: number;
  }

  /**
   * A frame carried by a performer: their placed root and heading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation kind: The discriminator. subject: The guide performer, composed before the members who read it.
   * @evidence contracts/development/design.md#principled-representation kind: The discriminator. subject: The guide performer, composed before the members who read it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in ensemble/IAutoMovieMotionHumanFormation.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
   */
  export interface IGuide {
    /** The discriminator. */
    kind: "guide";

    /** The guide performer, composed before the members who read it. */
    subject: string;
  }

  /**
   * A frame that travels a path at authored speeds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation via: The path's corners on the floor, world metres, at least two; `y` is not read. heading: Its heading: along the path, or a fixed heading in degrees; along when absent. start: The film second it starts moving; 0 when absent.
   * @evidence contracts/development/design.md#principled-representation via: The path's corners on the floor, world metres, at least two; `y` is not read. heading: Its heading: along the path, or a fixed heading in degrees; along when absent. start: The film second it starts moving; 0 when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanFormation.ts (laid, frame); ensemble/HumanFormationPath.ts (HumanFormationPath.lay, frame); ensemble/HumanFormation.ts (LAID).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanFormation.IMark identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
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
    speed:
      | number
      | {
          /** Ordered speed-change marks: each supplies metres per second from its film second onward; the last speed is held until final braking. */
          marks: readonly IAutoMovieMotionHumanFormation.IMark[];
        };

    /** Its acceleration and braking, metres per second squared; `HumanFormation.ACCELERATION` when absent. */
    acceleration?: number;

    /** Metres of path over which its heading turns at each corner, half before and half after; `HumanFormation.TURN` when absent. */
    turn?: number;
  }

  /**
   * One speed mark of a path frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation speed: The speed it changes to, metres per second, at least 0.
   * @evidence contracts/development/design.md#principled-representation speed: The speed it changes to, metres per second, at least 0.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in ensemble/IAutoMovieMotionHumanFormation.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in IAutoMovieMotionHumanFormation.IMark.
   */
  export interface IMark {
    /** The film second the speed starts changing. */
    at: number;

    /** The speed it changes to, metres per second, at least 0. */
    speed: number;
  }

  /**
   * A frame that travels a planned course: samples of its origin at film
   * seconds (a steered course, `HumanCrowd.steer`, or a wheel,
   * `manoeuvreWheel`), read between them linearly, its heading the samples'
   * own when they carry one, else the direction it moves in, kept while it
   * stands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation samples: The origin at film seconds, at least two, in time order; held at the ends.
   * @evidence contracts/development/design.md#principled-representation samples: The origin at film seconds, at least two, in time order; held at the ends.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanCrowd.ts (HumanCrowd.steer.frames, return); ensemble/HumanCrowd.ts (HumanCrowd.steer, return); ensemble/HumanFormation.ts (coursed, frame); ensemble/HumanManoeuvre.ts (steered, frame); ensemble/HumanCrowd.ts (HumanCrowd.steer).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanFormation.ISample identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ICourse {
    /** The discriminator. */
    kind: "course";

    /** The origin at film seconds, at least two, in time order; held at the ends. */
    samples: readonly IAutoMovieMotionHumanFormation.ISample[];
  }

  /**
   * A sample of a slot's way: a floor point at a film second, the record a timed course reads.
   *
   * @evidence contracts/development/common.md#meaningful-documentation x: World metres, x. y: World metres, y. z: World metres, z.
   * @evidence contracts/development/design.md#principled-representation x: World metres, x. y: World metres, y. z: World metres, z.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanFormation.ts (HumanFormation.path, return); ensemble/HumanManoeuvre.ts (steered.way, _); ensemble/HumanManoeuvre.ts (steered.way, s); actions/walkStation.ts (walkStation.resolve); ensemble/HumanCrowd.ts (HumanCrowd.steer.frames); ensemble/HumanFormation.ts (HumanFormation.path).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanFormation.path.
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

    /** A course frame's heading here, degrees, unwrapped along the course, when it turns otherwise than it moves (a wheel about its pivot, `manoeuvreWheel`); the way it moves when absent. Not read on a slot's way. */
    heading?: number;
  }

  /**
   * One member's slot at one film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation at: The slot's floor point, world metres. heading: The heading the member faces in it, degrees. block: Its block's index.
   * @evidence contracts/development/design.md#principled-representation at: The slot's floor point, world metres. heading: The heading the member faces in it, degrees. block: Its block's index.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanEnsembleMembers.ts (placeOf, slot); ensemble/HumanFormation.ts (HumanFormation.slot, return); ensemble/HumanManoeuvre.ts (HumanManoeuvre.plan.ends, return); ensemble/HumanManoeuvre.ts (steered, ends); ensemble/manoeuvreWheel.ts (manoeuvreWheel, ends); ensemble/HumanManoeuvre.ts (HumanManoeuvre.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
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

  /**
   * A slot's place in the formation's own frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation lateral: Metres along the frame's lateral axis. depth: Metres toward the frame's rear. facing: Degrees relative to the frame's heading.
   * @evidence contracts/development/design.md#principled-representation lateral: Metres along the frame's lateral axis. depth: Metres toward the frame's rear. facing: Degrees relative to the frame's heading.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanFormation.ts (HumanFormation.local, return); ensemble/manoeuvreWheel.ts (pivotOf.front, return); ensemble/manoeuvreWheel.ts (pivotOf.front, e); ensemble/manoeuvreWheel.ts (pivotOf.front, a); ensemble/manoeuvreWheel.ts (pivotOf.front, b); actions/walkStation.ts (walkStation.point).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanFormation.local.
   */
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
   * Reads a performer's placed root at a film second, for a guide frame: `IAutoMovieMotionHumanActionContext.IPerformer.root` of the guide.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reads a performer's placed root at a film second, for a guide frame: `IAutoMovieMotionHumanActionContext.IPerformer.root` of the guide.
   * @evidence contracts/development/design.md#principled-representation A subject id and film second select one canonical root pose without exposing a performance instance or its mutable state.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.of, read); ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve, read); ensemble/HumanFormation.ts (HumanFormation.frame, read); ensemble/HumanFormation.ts (HumanFormation.slot, read); ensemble/HumanFormation.ts (HumanFormation.path, read); ensemble/HumanFormation.ts (HumanFormation.assign, read).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanActionContext.IRoot identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type Reader = (
    subject: string,
    seconds: number,
  ) => IAutoMovieMotionHumanActionContext.IRoot;

  /**
   * The formation's frame at a film second: its origin and heading. Result returned by HumanFormation.frame. The origin, world metres, and the heading, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation at: Formation origin in world metres. heading: Formation yaw in degrees about world +Y, zero toward +Z.
   * @evidence contracts/development/design.md#principled-representation at: Formation origin in world metres. heading: Formation yaw in degrees about world +Y, zero toward +Z.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanFormation.ts (HumanFormation.frame, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IFrameResult = {
    /** Formation origin in world metres. */
    at: IAutoMovieVector3;
    /** Formation yaw in degrees about world +Y, zero toward +Z. */
    heading: number;
  };

  /**
   * A place in the formation's own frame moved into the world by a frame's origin and heading: lateral to the frame's right, depth to its rear. Input origin of HumanFormation.place. The frame at a second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation at: Formation origin in world metres. heading: Formation yaw in degrees about world +Y, zero toward +Z.
   * @evidence contracts/development/design.md#principled-representation at: Formation origin in world metres. heading: Formation yaw in degrees about world +Y, zero toward +Z.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanFormation.ts (HumanFormation.place, origin).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IPlaceOrigin = {
    /** Formation origin in world metres. */
    at: IAutoMovieVector3;
    /** Formation yaw in degrees about world +Y, zero toward +Z. */
    heading: number;
  };

  /**
   * A place in the formation's own frame moved into the world by a frame's origin and heading: lateral to the frame's right, depth to its rear. Input place of HumanFormation.place. The lateral and depth offsets, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation lateral: Slot's lateral offset in the formation frame, metres. depth: Slot's front-to-rear offset in the formation frame, metres.
   * @evidence contracts/development/design.md#principled-representation lateral: Slot's lateral offset in the formation frame, metres. depth: Slot's front-to-rear offset in the formation frame, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanFormation.ts (HumanFormation.place, place).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanFormation.place.
   */
  export type IPlacePlace = {
    /** Slot's lateral offset in the formation frame, metres. */
    lateral: number;
    /** Slot's front-to-rear offset in the formation frame, metres. */
    depth: number;
  };
}
