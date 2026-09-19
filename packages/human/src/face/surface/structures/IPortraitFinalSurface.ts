import { IPortraitFinalSurfaceHost } from "./IPortraitFinalSurfaceHost";

/**
 * One component's requested final positions; shared attachments use the same IDs.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Restricts a component's final shaping to resident shared-skin vertices.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Defines a proposal of finite millimetre targets without granting topology or material-identity mutation.
 */
export type IPortraitFinalSurface = (
  host: IPortraitFinalSurfaceHost,
) => readonly {
  /** Existing shared vertex identity; final shaping never adds topology here. */
  vertex: number;

  /** Requested XYZ in the host's millimetre frame. */
  target: readonly number[];
}[];
