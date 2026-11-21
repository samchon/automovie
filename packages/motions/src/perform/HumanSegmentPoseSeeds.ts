import type {
  IAutoMoviePose,
  IAutoMoviePoseState,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

/**
 * Named limb-fit continuation data for one displayed evaluation and its
 * one-sided velocity samples. The evaluator owns the actual fit and sample.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents fit names, cold/continued seed distinction and the existing pose/rate records.
 * @evidence contracts/development/design.md#principled-representation Reuses engine swivel seeds and velocity state in world-frame poses at film seconds; no separate solver or timebase is introduced.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the shared continuation records and exact-name lookup used by displayed poses, overlays, plants and entry-state sampling.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Null seeds and absent names remain distinct from an available matching fit; no unrelated stage or actor supplies a fallback seed.
 */
export namespace HumanSegmentPoseSeeds {
  /**
   * The nearby fit a named fit continues: the seed `near` holds under the
   * name, refined to its tolerance; none where it holds none, or no seed.
   *
   * @param near The fits of a nearby second, if any.
   * @param name The fit's name.
   * @returns The fit to continue, if any.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines absent and null seeds and the tolerance applied to a present named seed.
   * @evidence contracts/development/implementation.md#principled-implementation Looks up the exact fit name and copies its swivel seed with the requested tolerance, preserving basin and branch data.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One optional map lookup followed by an absent check or a shallow seed copy.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No seed of another limb, overlay set or fitting stage substitutes for a missing name.
   * @evidence contracts/development/implementation.md#efficient-algorithms One map lookup and one bounded seed-record copy when present.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No completed numerical work is coordinated; the supplied seed owner decides which fit is equivalent.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing and returns a new seed wrapper with the original seed's borrowed member values.
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
          ...(near!.prescribed === true ? { prescribed: true } : {}),
        };
  }

  /**
   * Whether an evaluation continues the fits of a nearby second: a near that
   * is not a prescribed course. A prescribed course (`INear.prescribed`) is
   * no observation of another second, so a reader keeps its no-near paths
   * (kept legs, direct assembly, prepared samples) under it.
   *
   * @param near The fits given, if any.
   * @returns Whether they are continued fits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the distinction and who reads it.
   * @evidence contracts/development/implementation.md#principled-implementation A course fixes the branch and swivel; it reads no other second.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One test.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No fit is changed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function continues(near: INear | undefined): boolean {
    return near !== undefined && near.prescribed !== true;
  }
  /**
   * Each named limb fit's chosen seed; null where that fit has none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States exact fit-name keys, chosen swivel seeds and null entries.
   * @evidence contracts/development/design.md#principled-representation A map preserves stage/overlay/limb fit names and the engine's seed representation without conflating no seed with a different fit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One existing Map alias shared by seeded evaluation, nearby continuation and overlay fitting.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses IAutoMovieSwivelSeed and records null explicitly; no second pose or independently tuned branch key is introduced.
   */
  export type IFits = Map<string, IAutoMovieSwivelSeed | null>;

  /**
   * The fits of a nearby second an evaluation continues.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its content.
   * @evidence contracts/development/design.md#principled-representation The seeds by fit name and the one tolerance they are refined to (`IAutoMovieSwivelNear`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `IAutoMovieSwivelSeed`.
   */
  export interface INear {
    /** The nearby second's fits. */
    seeds: ReadonlyMap<string, IAutoMovieSwivelSeed | null>;

    /** The swivel tolerance each continued fit is refined to, degrees. */
    tolerance: number;

    /** Whether the seeds are prescribed (`IAutoMovieSwivelNear.prescribed`): each limb is placed at its seed's swivel and branch in closed form, as a display reading its plan's swivel course does. */
    prescribed?: boolean;
  }

  /**
   * A shown pose with the seeds of its fits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its content.
   * @evidence contracts/development/design.md#principled-representation The pose and its fits by name.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `IFits`.
   */
  export interface ISeeded {
    /** The pose. */
    pose: IAutoMoviePose;

    /** Its fits. */
    seeds: IFits;
  }

  /**
   * A one-sided state read on continued fits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its content.
   * @evidence contracts/development/design.md#principled-representation The state and the samples its rates were differenced from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses `samplePoseVelocity.IState`.
   */
  export interface IContinued {
    /** The pose at the second, read cold, and its rates. */
    state: IAutoMoviePoseState;

    /** The continued samples at the second and one and two steps toward its side. */
    samples: readonly [IAutoMoviePose, IAutoMoviePose, IAutoMoviePose];
  }
}
