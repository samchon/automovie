import type { IAutoMovieHumanFootInterim } from "../foot/IAutoMovieHumanFootInterim";
import type { IAutoMovieHumanFootSource } from "../foot/IAutoMovieHumanFootSource";
import type { IAutoMovieHumanSiteViewPart } from "../limb/IAutoMovieHumanSiteViewPart";
import type { IAutoMovieHumanLegBones } from "./IAutoMovieHumanLegBones";
import type { IAutoMovieHumanLegWalk } from "./IAutoMovieHumanLegWalk";

/** Type contracts exchanged by AutoMovieHumanLegSourceFamily; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLegSourceFamily {
  /** Regional and full demands of the same production family.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Regional and full demands of the same production family.
   * @evidence contracts/development/design.md#principled-representation Regional and full demands of the same production family.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegSourceFamily.create. Also types AutoMovieHumanLegSources.legSource.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegSourceFamily.create, AutoMovieHumanLegSources.legSource for regional and full demands of the same production family.
   */
  export interface IOutput {
    /** Latest actual coupled definition, or the base before explicit assembly. */
    current(): IAutoMovieHumanLegWalk.IDefinition;

    /** Same bounded calf-to-cap authority without forcing the full leg or upper-parent completion. */
    ankle(): IAnkle;

    /** Author a trial/final proximal prefix against its identical parent. */
    bind(
      parent: IAutoMovieHumanSiteViewPart.IDefinition,
      station: number,
    ): IAutoMovieHumanLegWalk.IDefinition;
  }

  /** Exact retained region with the actual explicit full-resolver capability.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Exact retained region with the actual explicit full-resolver capability.
   * @evidence contracts/development/design.md#principled-representation Exact retained region with the actual explicit full-resolver capability.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLegSourceFamily.ankle.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegSourceFamily.ankle, AutoMovieHumanLegSourceFamily.create for exact retained region with the actual explicit full-resolver capability.
   */
  export type IAnkle = Omit<
    IAutoMovieHumanFootInterim.IAnkleSource,
    "source"
  > & {
    /** Only complete requests the real full original; name/frame/property reads remain local metadata. */
    source: IAutoMovieHumanFootSource.IRegional;
  };

  /** Invocation-owned production inputs and its optional full-parent completion seam.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Invocation-owned production inputs and its optional full-parent completion seam.
   * @evidence contracts/development/design.md#principled-representation `name`: Existing side-qualified production name. `bones`: Actual immutable bone frames. `law`: Existing measured and intermediate source laws.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLegSourceFamily.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `complete`: Successfully complete the owning trunk before full demand, or throw its failure; binding a trial alone is not completion.
   */
  export interface IInput {
    /** Existing side-qualified production name. */
    name: string;

    /** Actual immutable bone frames. */
    bones: Pick<IAutoMovieHumanLegBones.IBones, "hip" | "knee" | "ankle">;
    /** Existing measured and intermediate source laws. */
    law: IAutoMovieHumanLegWalk.ILaw;

    /** Existing emission spacing, calibration mm. */
    gap: number;

    /** Successfully complete the owning trunk before full demand, or throw its failure; binding a trial alone is not completion. */
    complete?: () => void;
  }
}
