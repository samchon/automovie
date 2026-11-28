import type { IAutoMovieSweep } from "./IAutoMovieSweep";

/**
 * Authored geometry and compiled bone-buffer attachments for a retained sweep
 * rig.
 */
export namespace IAutoMovieRigSweep {
  /**
   * Rest sweep, optional compiled bone indices and volume-compensation choice
   * for a reusable rig.
   */
  export type IProps = {
    /**
     * Compiled rig's borrowed rest sweep in model metres. Keep authored
     * geometry stable while compiled slots use it.
     */
    sweep: IAutoMovieSweep;

    /**
     * Optional mapping into the later bone buffer. Omission leaves the sweep at
     * rest.
     *
     * The rig checks array lengths. Supply valid bone-buffer indices and one or
     * two indices per station.
     */
    binding?: IPropsBinding;

    /**
     * Enable joint volume settlement for bound two-bone stations. Girth
     * multipliers are applied afterward.
     */
    preserveVolume: boolean;
  };

  /** Compiled bone-buffer assignments aligned with the sweep's rest data. */
  export type IPropsBinding = {
    /**
     * One nonnegative integer bone-buffer index per spine control in spine
     * order. This retained array must keep the same identities.
     */
    points: number[];

    /**
     * One retained list of one or two bone-buffer indices per station. Supply
     * indices valid in each later pose buffer.
     */
    stations: number[][];
  };
}
