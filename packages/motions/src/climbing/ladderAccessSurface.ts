import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";

/** Read the fixed rectangular support that admits a ladder landing. */
export function ladderAccessSurface(
  prop: ladderAccessSurface.IProp,
  point: string,
): ladderAccessSurface.ISurface | undefined {
  if (
    prop.fixed !== true ||
    prop.motion !== undefined ||
    prop.hasArticulations === true
  )
    return undefined;
  const surface: IAutoMovieAffordance | undefined = prop.affordances?.find(
    (candidate: IAutoMovieAffordance): boolean =>
      candidate.id === point && candidate.kind === "surface",
  );
  if (surface?.width === undefined || surface.depth === undefined)
    return undefined;
  return { ...surface, width: surface.width, depth: surface.depth };
}

/** The declared data a ladder landing needs. */
export namespace ladderAccessSurface {
  /** A prop's mobility and named contact surfaces. */
  export type IProp = Pick<
    IAutoMovieMotionHumanProp,
    "affordances" | "fixed" | "motion" | "hasArticulations"
  >;

  /** A surface with both spans available for fitting the landing stance. */
  export interface ISurface extends IAutoMovieAffordance {
    /** Horizontal span along the surface's +X axis, metres. */
    width: number;

    /** Horizontal span along the surface's +Z axis, metres. */
    depth: number;
  }
}
