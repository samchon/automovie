import type { IHumanBodyUnderwearEnvelopeReading } from "./IHumanBodyUnderwearEnvelopeReading";
import type { IHumanBodyUnderwearEnvelopeFaceReading } from "./IHumanBodyUnderwearEnvelopeFaceReading";

/** One original qualified centre field, shared by fitting and final evaluation. */
export interface IHumanBodyUnderwearEnvelope {
  /** Qualified own balls whose original surface points remain exact anchors. */
  free: Uint8Array;

  /** Actual qualified centre population; fitting does not alter it. */
  centres: number;

  /** Continuous nearest-centre distance with one deterministic active branch. */
  read(point: readonly number[]): IHumanBodyUnderwearEnvelopeReading;

  /** Complete exterior direction over the actual planar face, not point samples. */
  readFace(face: readonly number[]): IHumanBodyUnderwearEnvelopeFaceReading;
}
