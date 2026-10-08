import type { IHumanBodyUnderwearSurfaceViolation } from "./IHumanBodyUnderwearSurfaceViolation";

/** One actual forward result shared by fitting and the final garment emitter. */
export interface IHumanBodyUnderwearSurfaceEvaluation {
  /** Candidate connected base in original material order. */
  base: number[];

  /** Actual emitted positions after the declared normal lift. */
  positions: number[];

  /** Actual transported unit vertex normals used for that same lift. */
  normals: number[];

  /** Maximum original nearest-centre field excess, metres; no positive allowance. */
  fieldResidualMetres: number;

  /** Every located local geometric failure, without dropping material faces. */
  violations: IHumanBodyUnderwearSurfaceViolation[];

  /** Actual local conditions passed; global intersection remains separate. */
  geometryAccepted: boolean;
}
