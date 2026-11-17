import type { IAutoMovieLight } from "../scene/IAutoMovieLight";
import type { IAutoMovieSceneEnvironment } from "../scene/IAutoMovieSceneEnvironment";

/**
 * Data and callback contracts shared by the ValidateSceneEnvironment operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Admit environment image/background, intensity, exposure and shadow policy. Member documentation states the supplied records, units and absence meanings used by validateSceneEnvironment.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The context uses only id/type/castShadow from canonical lights; omission means policy-shape validation, not a claim that every scene-light combination was checked.
 * @evidence contracts/development/design.md#principled-representation environment carries radiometric image/background and rendering policy, while optional admitted light traits enable contextual shadow-profile checks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateSceneEnvironment, used by validateSceneEnvironment. Its IProps members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export namespace IAutoMovieValidateSceneEnvironment {
  /**
   * Admit environment image/background, intensity, exposure and shadow policy.
   *
   * Image ids are nonblank or null, and a declared image requires a null flat background. Color delegates to validateColor's linear RGBA and matching sRGB label contract. Intensity is finite and nonnegative, exposure finite and positive, and rotation finite degrees. Tone mapping is none or acesFilmic; shadows require a boolean enabled flag and pcf, pcfSoft or vsm filter.
   *
   * Supplying admitted light traits also checks the supported shadow profile, retaining its original scene-light paths on refusal. With no light context, this function admits policy shape only. It collects all independent faults without changing input or requiring a renderer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Admit environment image/background, intensity, exposure and shadow policy. Member documentation states the supplied records, units and absence meanings used by validateSceneEnvironment.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The context uses only id/type/castShadow from canonical lights; omission means policy-shape validation, not a claim that every scene-light combination was checked.
   * @evidence contracts/development/design.md#principled-representation environment carries radiometric image/background and rendering policy, while optional admitted light traits enable contextual shadow-profile checks.
   * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieValidateSceneEnvironment.IProps, used by validateSceneEnvironment. Its environment, lights members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
   */
  export type IProps = {
    /** Current authored environment, inspected without mutation. */
    environment: IAutoMovieSceneEnvironment;

    /** Admitted scene light traits; contextual refusals retain their scene paths. */
    lights?: readonly Pick<IAutoMovieLight, "id" | "type" | "castShadow">[];
  };
}
