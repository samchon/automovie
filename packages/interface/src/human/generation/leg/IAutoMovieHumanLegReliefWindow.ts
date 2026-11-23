import type { IAutoMovieHumanLegStations } from "./IAutoMovieHumanLegStations";

/**
 * Anatomical relief-window locations with local-radius dimensions and optional
 * crotch anchoring. Runtime construction and admission remain with
 * AutoMovieHumanLegReliefWindow in Human.
 */
export namespace IAutoMovieHumanLegReliefWindow {
  /** A window's declaration. */
  export interface IWindow {
    /** Name, for diagnostics and part ids. */
    name: string;

    /** The bone the window's centre stands on. */
    segment: IAutoMovieHumanLegStations.Segment;

    /** Share of that bone at the centre. */
    share: number;

    /**
     * Section angle of the centre, radians, 0 forward and increasing toward
     * lateral.
     */
    angle: number;

    /** Half extent along the bone, in local radii. */
    halfStation: number;

    /** Half extent round the section, radians. */
    halfAngle: number;

    /** Height at the centre, in local radii. */
    height: number;

    /**
     * Unit direction of a positive height in the section frame `[forward, along
     * the bone, lateral]`.
     */
    axis: [number, number, number];

    /**
     * Where the centre stands when it is not a share of a bone: `crotch` puts
     * it at the person's gluteal furrow height when that is known and lies
     * inside the leg, else at the leg's first own row under the crotch ring,
     * where the trunk's ring has handed the skin over to the leg's law. A skin
     * crease of the thigh's root is where the buttock meets the thigh, so it
     * stands there and not at a share of the femur; `segment` and `share` then
     * only name its bone.
     */
    anchor?: "crotch";
  }

  /** What a window is placed from. */
  export interface IInput {
    /** The joints' heights, mm. */
    bones: IAutoMovieHumanLegStations.IBones;

    /**
     * The local radius at the window's centre, mm: the section's girth over 2
     * pi.
     */
    radius: number;

    /**
     * The centre's station when the window is anchored (see
     * {@link IWindow.anchor}), mm.
     */
    at?: number;
  }
}
