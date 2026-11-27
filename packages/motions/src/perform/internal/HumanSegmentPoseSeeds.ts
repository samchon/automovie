import type {
  IAutoMoviePose,
  IAutoMoviePoseState,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

/*
 * Named limb-fit continuation data for one displayed evaluation and its
 * one-sided velocity samples. The evaluator owns the actual fit and sample.
 */
export namespace HumanSegmentPoseSeeds {
  /*
   * The nearby fit a named fit continues: the seed `near` holds under the name,
   * refined to its tolerance; none where it holds none, or no seed. A
   * prescribed near places an arm's fit at its seed; a leg's fit is only
   * continued from it, since the legs keep their own fits.
   * Parameter near: The fits of a nearby second, if any.
   * Parameter name: The fit's name.
   * Returns: The fit to continue, if any.
   */
  export function nearby(
    near: INear | undefined,
    name: string,
  ): IAutoMovieSwivelNear | undefined {
    const seed: IAutoMovieSwivelSeed | null | undefined = near?.seeds.get(name);
    return seed === undefined || seed === null
      ? undefined
      : {
          ...seed,
          tolerance: near!.tolerance,
          ...(near!.prescribed === true && !name.endsWith("Leg")
            ? { prescribed: true }
            : {}),
        };
  }

  /*
   * Whether an evaluation continues the fits of a nearby second: a near that is
   * not a prescribed course. A prescribed course (`INear.prescribed`) is no
   * observation of another second, so a reader keeps its no-near paths (kept
   * legs, direct assembly, prepared samples) under it.
   * Parameter near: The fits given, if any.
   * Returns: Whether they are continued fits.
   */
  export function continues(near: INear | undefined): boolean {
    return near !== undefined && near.prescribed !== true;
  }

  /*
   * The leaf fits a read shows, named for a later stage of the same read (a
   * stop's `stop:<id>:`, a plant's `planted:`): for each limb, the fit of the
   * leaf under the most overlays, `leaf:<ordinals>:<limb>`, which is the leaf
   * the displayed pose is built on, as `<stage><limb>`.
   * Parameter seeds: The read's fits.
   * Parameter stage: The later stage's name prefix.
   * Returns: The leaf seeds under the stage's names.
   */
  export function shown(
    seeds: ReadonlyMap<string, IAutoMovieSwivelSeed | null>,
    stage: string,
  ): IFits {
    const deepest: Map<string, number> = new Map();
    const out: IFits = new Map();
    for (const [name, seed] of seeds) {
      if (!name.startsWith(LEAF)) continue;
      const split: number = name.lastIndexOf(":");
      const tag: string = name.slice(LEAF.length, split);
      const depth: number = tag === "" ? 0 : tag.split(",").length;
      const limb: string = name.slice(split + 1);
      if ((deepest.get(limb) ?? -1) >= depth) continue;
      deepest.set(limb, depth);
      out.set(`${stage}${limb}`, seed);
    }
    return out;
  }

  /*
   * Each named limb fit's chosen seed; null where that fit has none.
   */
  export type IFits = Map<string, IAutoMovieSwivelSeed | null>;

  /*
   * The fits of a nearby second an evaluation continues.
   */
  export interface INear {
    /*
     * The nearby second's fits.
     */
    seeds: ReadonlyMap<string, IAutoMovieSwivelSeed | null>;

    /*
     * The swivel tolerance each continued fit is refined to, degrees.
     */
    tolerance: number;

    /*
     * Whether the seeds are prescribed (`IAutoMovieSwivelNear.prescribed`):
     * each limb is placed at its seed's swivel and branch in closed form, as a
     * display reading its plan's swivel course does.
     */
    prescribed?: boolean;
  }

  /*
   * A shown pose with the seeds of its fits.
   */
  export interface ISeeded {
    /*
     * The pose.
     */
    pose: IAutoMoviePose;

    /*
     * Its fits.
     */
    seeds: IFits;
  }

  /*
   * A one-sided state read on continued fits.
   */
  export interface IContinued {
    /*
     * The pose at the second, read cold, and its rates.
     */
    state: IAutoMoviePoseState;

    /*
     * The continued samples at the second and one and two steps toward its
     * side.
     */
    samples: readonly [IAutoMoviePose, IAutoMoviePose, IAutoMoviePose];
  }

  /*
   * The name prefix of a leaf fit, `leaf:<ordinals>:<limb>`.
   */
  const LEAF: string = "leaf:";
}
