import type { IAutoMovieZone } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import type * as THREE from "three";

/**
 * What every set offers the stage: its named places (zones and landmarks
 * by one flat name each), its seats, its camera stations, and a displayed
 * figure. Scenes and interactions name places; the set decides where they
 * are. World metres with +Y up, +X and +Z as each set states.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members and the frame.
 * @evidence contracts/development/design.md#principled-representation Places are floor points or air points in world metres with a radius; seats carry their surface height and length; stations are lens positions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members the stage laws, camera track and mount read; engine zones are kept for engine consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No set is named here.
 */
export interface IStageSet {
  /** Stable set id. */
  id: string;

  /** Named places. */
  places: Readonly<Record<string, IStageSet.IPlace>>;

  /** The places as engine zones. */
  zones: readonly IAutoMovieZone[];

  /** Named camera stations: where a lens stands, metres. */
  stations: Readonly<Record<string, IAutoMovieVector3>>;

  /** Where a lens may stand: floor bounds in world metres when walls close the set, or several bounds whose union is the room (a walled recess and the open lawn before it). */
  lens?: IStageSet.IBounds | readonly IStageSet.IBounds[];

  /** Background colour behind the set. */
  sky: number;

  /** Light preset the set's daylight follows. */
  light: "court-late-morning" | "corridor-late-afternoon" | "courtyard-late-afternoon" | "pitch-early-afternoon";

  /** Build the displayed scenery, owned by the caller. */
  figure(): IStageSet.IFigure;
}
export namespace IStageSet {
  /** Floor bounds a lens may stand within, world metres. */
  export interface IBounds {
    /** Least x. */
    minX: number;

    /** Greatest x. */
    maxX: number;

    /** Least z. */
    minZ: number;

    /** Greatest z. */
    maxZ: number;
  }

  /** A named place. */
  export interface IPlace {
    /** The place's point: on the floor for standing places, in the air for flight places. */
    point: IAutoMovieVector3;

    /** Radius a subject may stand within, metres. */
    radius: number;

    /** The heading a person at the place naturally faces, radians. */
    facing?: number;

    /** A seat at the place. */
    seat?: ISeat;
  }

  /** A seat. */
  export interface ISeat {
    /** Seat surface height, metres. */
    height: number;

    /** Heading a seated person faces, radians. */
    facing: number;

    /** Half the usable seat length along the sitter's left-right axis, metres. */
    halfLength: number;

    /** Depth of the seat from its front edge, metres. */
    depth: number;
  }

  /** Displayed scenery. */
  export interface IFigure {
    /** Root object. */
    object: THREE.Group;

    /** Release owned geometry and materials. */
    dispose(): void;
  }
}
