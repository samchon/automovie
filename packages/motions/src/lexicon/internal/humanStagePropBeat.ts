import type {
  IAutoMovieMotionHumanStageProp,
  IAutoMovieMotionHumanStrikingAdvance,
} from "@automovie/interface";

/*
 * A stage prop beat's own blocking (`BEATS`): its fallback mark, its seconds,
 * its trunk turn, whether the stance steps, and its silhouette sampled over the
 * beat's normalized span.
 * Parameter beat: The beat.
 * Returns: Its table entry.
 */
export function humanStagePropBeat(
  beat: IAutoMovieMotionHumanStageProp["beat"],
): humanStagePropBeat.IBeat {
  return BEATS[beat];
}

/*
 * The stage prop beats.
 */
export namespace humanStagePropBeat {
  /*
   * A direction or an arm-length offset in actor-local coordinates.
   */
  export type Vector = readonly [x: number, y: number, z: number];

  /*
   * The silhouette at one time along the beat, in actor-local coordinates.
   */
  export interface IPose {
    /*
     * The grip relative to the holding shoulder, in arm lengths.
     */
    grip: Vector;
    /*
     * Model mark direction in the actor's frame.
     */
    axis: Vector;
    /*
     * Roll reference in the actor's frame.
     */
    roll: Vector;
  }

  /*
   * One style table entry.
   */
  export interface IBeat {
    /*
     * Fallback mark on the model.
     */
    mark: string;
    /*
     * Authored duration, seconds.
     */
    seconds: number;
    /*
     * Axial trunk travel, degrees in the beat's authoring frame.
     */
    turn: number;
    /*
     * Whether the shared stance planner moves a foot.
     */
    advance: IAutoMovieMotionHumanStrikingAdvance.Advance;
    /*
     * Read the scene silhouette through a normalized pose span.
     */
    sample(share: number): IPose;
  }
}

/*
 * A common carrier pose path for the rigid and linked prop comparison.
 */
function sampleOffsetDisplay(share: number): humanStagePropBeat.IPose {
  const lateral: number = Math.cos(Math.PI * share);
  return {
    grip: [0.2 * lateral, 0.26 - 0.34 * share, 0.46],
    axis: [0.3 * lateral, 0.76 - share, 1],
    roll: [0, 1, 0],
  };
}

/*
 * Presets for virtual screen blocking. Qiangshu's continuous circular
 * silhouettes and mobile footing inform the two display flourishes
 * (International Wushu Federation, Taolu). All coordinates and times are
 * authored animation values. The shield rows follow separate visual accents.
 */
const BEATS: Readonly<
  Record<IAutoMovieMotionHumanStageProp["beat"], humanStagePropBeat.IBeat>
> = {
  figureEight: {
    mark: "tip",
    seconds: 1.8,
    turn: 12,
    advance: "step",
    sample: (share: number): humanStagePropBeat.IPose => {
      const angle: number = 2 * Math.PI * share;
      return {
        grip: [0.21 * Math.sin(angle), 0.13 * Math.sin(2 * angle) - 0.12, 0.48],
        axis: [0.7 * Math.sin(angle), 1, 0.55 * Math.cos(angle)],
        roll: [0, 0, 1],
      };
    },
  },
  overheadCircle: {
    mark: "tip",
    seconds: 1.9,
    turn: 7,
    advance: "none",
    sample: (share: number): humanStagePropBeat.IPose => {
      const angle: number = 2 * Math.PI * share;
      return {
        grip: [0.2 * Math.cos(angle), 0.51, 0.36 + 0.12 * Math.sin(angle)],
        axis: [Math.cos(angle), 0.58, Math.sin(angle)],
        roll: [0, 1, 0],
      };
    },
  },
  block: {
    mark: "face",
    seconds: 1.05,
    turn: -10,
    advance: "none",
    sample: (share: number): humanStagePropBeat.IPose => ({
      grip: [-0.18 * share, 0.02, 0.36 + 0.17 * share],
      axis: [-0.17 + 0.17 * share, 0, 1],
      roll: [0, 1, 0],
    }),
  },
  yield: {
    mark: "face",
    seconds: 1.1,
    turn: 15,
    advance: "none",
    sample: (share: number): humanStagePropBeat.IPose => ({
      grip: [0.15 * share, -0.13 * share, 0.54 - 0.25 * share],
      axis: [0.25 * share, 0.14 * share, 1],
      roll: [0, 1, 0],
    }),
  },
  boss: {
    mark: "boss",
    seconds: 1.05,
    turn: -8,
    advance: "step",
    sample: (share: number): humanStagePropBeat.IPose => ({
      grip: [-0.04, -0.11, 0.34 + 0.16 * share],
      axis: [0, 0.04, 1],
      roll: [0, 1, 0],
    }),
  },
  rim: {
    mark: "rim",
    seconds: 1.35,
    turn: -16,
    advance: "step",
    sample: (share: number): humanStagePropBeat.IPose => ({
      grip: [0.23 - 0.38 * share, -0.11 + 0.13 * share, 0.46],
      axis: [0.72 - 0.85 * share, 0.23, 1],
      roll: [0, 1, 0],
    }),
  },
  offset: {
    mark: "face",
    seconds: 1.3,
    turn: -8,
    advance: "none",
    sample: sampleOffsetDisplay,
  },
  linked: {
    mark: "link",
    seconds: 1.3,
    turn: -8,
    advance: "none",
    sample: sampleOffsetDisplay,
  },
};
