import { IAutoMovieNamedId } from "../core/IAutoMovieNamedId";
import { IAutoMovieFog } from "../scene/IAutoMovieFog";
import { IAutoMovieSceneEnvironment } from "../scene/IAutoMovieSceneEnvironment";
import { IAutoMovieSpace } from "../scene/IAutoMovieSpace";
import { IAutoMovieStageActor } from "./IAutoMovieStageActor";
import { IAutoMovieStageCamera } from "./IAutoMovieStageCamera";
import { IAutoMovieStageLight } from "./IAutoMovieStageLight";
import { IAutoMovieStageSetPiece } from "./IAutoMovieStageSetPiece";

/**
 * Models the coding-agent-owned set before a shot is performed.
 *
 * This is an engine input, not an LLM application payload. Positions and
 * couplings are kept declarative so {@code stageScene} can validate every
 * identity and lower the set into deterministic scene data.
 *
 * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `IAutoMovieStage` as the portable data boundary for the agent ordinary code authoring requirement.
 * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `IAutoMovieStage` for the spec authoring source input system contract.
 */
export interface IAutoMovieStage {
  /**
   * Stable scene identity cited by every registered shot that uses this set.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `scene` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `scene` for the spec authoring source input system contract.
   */
  scene: IAutoMovieNamedId;

  /**
   * Human-readable geometric rationale retained beside the authored values.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `plan` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `plan` for the spec authoring source input system contract.
   */
  plan: string;

  /**
   * One placement for every scripted cast node that appears on the set.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `actors` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `actors` for the spec authoring source input system contract.
   */
  actors: IAutoMovieStageActor[];

  /**
   * Optional static set geometry; these nodes never perform an action.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `set` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `set` for the spec authoring source input system contract.
   */
  set?: IAutoMovieStageSetPiece[];

  /**
   * Walkable surfaces whose geometry drives grounding and locomotion checks.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `space` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `space` for the spec authoring source input system contract.
   */
  space?: IAutoMovieSpace;

  /**
   * The set's atmosphere, lowered verbatim onto the composed scene's `fog`.
   * Omitted stages a scene with no atmosphere, which renders exactly as every
   * staged scene did before the field existed.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `fog` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `fog` for the spec authoring source input system contract.
   */
  fog?: IAutoMovieFog;

  /**
   * Optional image-lighting, exposure, tone mapping, and shadow policy.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `environment` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `environment` for the spec authoring source input system contract.
   */
  environment?: IAutoMovieSceneEnvironment;

  /**
   * Cameras available to the shot and its alternate coverage takes.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `cameras` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `cameras` for the spec authoring source input system contract.
   */
  cameras: IAutoMovieStageCamera[];

  /**
   * Physical light declarations lowered into the deterministic scene.
   *
   * @evidence requirements/agent-authoring/source-owned-loop.md#agent-ordinary-code-authoring Exposes `lights` as the portable data boundary for the agent ordinary code authoring requirement.
   * @evidence specifications/authoring-and-authority/source-authority-and-derivation.md#spec-authoring-source-input Types `lights` for the spec authoring source input system contract.
   */
  lights: IAutoMovieStageLight[];
}
