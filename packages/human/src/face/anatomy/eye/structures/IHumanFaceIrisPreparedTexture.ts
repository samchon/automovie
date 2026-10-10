import type { IHumanFaceIrisPaintedEye } from "./IHumanFaceIrisPaintedEye";

/**
 * A decoded eye texture and the iris texels of each eye painted on it.
 *
 * @author Samchon
 */
export interface IHumanFaceIrisPreparedTexture {
  /** Image width, pixels. */
  width: number;

  /** Image height, pixels. */
  height: number;

  /** Row-major RGBA bytes. */
  rgba: Uint8Array;

  /** Eyes painted on this texture. */
  eyes: IHumanFaceIrisPaintedEye[];
}
