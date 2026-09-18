import { IAutoMovieColor } from "../color/IAutoMovieColor";
import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieLightShadow } from "../scene/IAutoMovieLightShadow";

/**
 * One physical light placed on the authored set.
 *
 * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `IAutoMovieStageLight` as the portable data boundary for the agent authoring tool replaceability requirement.
 * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `IAutoMovieStageLight` for the spec authoring authority compatibility system contract.
 */
export interface IAutoMovieStageLight {
  /**
   * Unique light identity.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `node` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `node` for the spec authoring authority compatibility system contract.
   */
  node: string;

  /**
   * Optional dramatic annotation; lowering reads the physical fields below.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `role` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `role` for the spec authoring authority compatibility system contract.
   */
  role?: "key" | "fill" | "rim" | "ambient" | "sun";

  /**
   * Light family; omitted means a directional source.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `type` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `type` for the spec authoring authority compatibility system contract.
   */
  type?: "directional" | "point" | "spot" | "area";

  /**
   * Required aim for directional, spot and area sources; forbidden for point.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `direction` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `direction` for the spec authoring authority compatibility system contract.
   */
  direction?: IAutoMovieVector3;

  /**
   * Required origin for point, spot and area sources; forbidden for
   * directional.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `position` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `position` for the spec authoring authority compatibility system contract.
   */
  position?: IAutoMovieVector3;

  /**
   * Linear light color; omitted means neutral white.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `color` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `color` for the spec authoring authority compatibility system contract.
   */
  color?: IAutoMovieColor;

  /**
   * Finite non-negative relative brightness.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `intensity` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `intensity` for the spec authoring authority compatibility system contract.
   */
  intensity: number;

  /**
   * Point/spot falloff distance, where zero means unbounded.
   *
   * An area panel has none: its falloff follows from the emitting area below,
   * so a second distance here would contradict it.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `range` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `range` for the spec authoring authority compatibility system contract.
   */
  range?: number;

  /**
   * Spot half-angle in degrees, greater than zero and at most 90.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `coneAngle` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `coneAngle` for the spec authoring authority compatibility system contract.
   */
  coneAngle?: number;

  /**
   * Area-panel width in meters along its local X axis, finite and greater than
   * zero. Required on an area source and forbidden on every other family.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `width` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `width` for the spec authoring authority compatibility system contract.
   */
  width?: number;

  /**
   * Area-panel height in meters along its local Y axis, finite and greater than
   * zero. Required on an area source and forbidden on every other family.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `height` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `height` for the spec authoring authority compatibility system contract.
   */
  height?: number;

  /**
   * Whether this source casts shadows.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `castShadow` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `castShadow` for the spec authoring authority compatibility system contract.
   */
  castShadow?: boolean;

  /**
   * Optional shadow-map camera and bias tuning.
   *
   * @evidence requirements/agent-authoring/project-ownership.md#agent-authoring-tool-replaceability Exposes `shadow` as the portable data boundary for the agent authoring tool replaceability requirement.
   * @evidence specifications/authoring-and-authority/delegation-and-decision-authority.md#spec-authoring-authority-compatibility Types `shadow` for the spec authoring authority compatibility system contract.
   */
  shadow?: IAutoMovieLightShadow;
}
