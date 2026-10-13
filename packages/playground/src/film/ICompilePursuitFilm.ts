import type {
  IAutoMovieCut,
  IAutoMovieStagedSet,
} from "@automovie/engine";
import type {
  IAutoMovieBlocking,
  IAutoMovieModel,
  IAutoMovieMotion,
  IAutoMoviePerformance,
  IAutoMovieScript,
  IAutoMovieShot,
  IAutoMovieSkeleton,
  IAutoMovieStage,
} from "@automovie/interface";

/**
 * Compile the pursuit example's authored inputs into the runtime registry,
 * shots, motions and edit the film page plays.
 *
 * Each step's refusal throws from the engine owner that produced it, so a
 * returned value always carries successful staging and cut results. Blockings
 * pair with performances by index.
 *
 * @author Samchon
 */
export type ICompilePursuitFilm = (
  props: ICompilePursuitFilm.IProps,
) => ICompilePursuitFilm.IResult;

export namespace ICompilePursuitFilm {
  /** The tracked authoring inputs of one compilation. */
  export interface IProps {
    /** Cast and beats every later step resolves against. */
    script: IAutoMovieScript;

    /** Actor and set placements staged before any beat is blocked. */
    staging: IAutoMovieStage;

    /** One blocking per performance, matched by index. */
    blockings: IAutoMovieBlocking[];

    /** The performed shots, in edit order. */
    performances: IAutoMoviePerformance[];
  }

  /** One rig: its skeleton and the resident model that skins it. */
  export interface IRig {
    /** Skeleton the performance poses. */
    skeleton: IAutoMovieSkeleton;

    /** Model whose parts follow that skeleton. */
    model: IAutoMovieModel;
  }

  /** The compiled film the page lowers into a scene and plays. */
  export interface IResult {
    /** Successful staging result shared by every shot. */
    staged: IAutoMovieStagedSet.ISuccess;

    /** Rig by performing node; a set piece has none. */
    rigOf: Record<string, IRig | undefined>;

    /**
     * Rig of a performing node.
     *
     * Throws for a node without a rig instead of inventing one.
     */
    rigFor: (node: string) => IRig;

    /**
     * Model realising a staged node: the shared set block or the node's own
     * rig model.
     *
     * Throws for an actor node without a rig.
     */
    modelForNode: (node: { id: string; model: string }) => IAutoMovieModel;

    /** Performed shots, in performance order. */
    shots: IAutoMovieShot[];

    /** Motions of each shot, keyed by shot id and then by performing node. */
    motionsByShot: Map<string, Record<string, IAutoMovieMotion>>;

    /** Successful edit over every shot. */
    cut: IAutoMovieCut.ISuccess;
  }
}
