import type { IHumanFaceHairGatherAttachment } from "./IHumanFaceHairGatherAttachment";

/**
 * Current scalp geometry and one already resolved attachment compiled into the gathering direction field.
 * Arrays remain caller-owned and must retain their admitted resident correspondence for the compilation.
 *
 * @author Samchon
 */
export interface IHumanFaceHairGatherFieldProps {
  /** Current head-frame positions in metres. */
  positions: readonly number[];

  /** Source triangle corner indices. */
  indices: readonly number[];

  /** Connected growth-domain triangle ordinals. */
  triangles: readonly number[];

  /** Attachment resolved from the same source and current geometry. */
  anchor: IHumanFaceHairGatherAttachment;
}
