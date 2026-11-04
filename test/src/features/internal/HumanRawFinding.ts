import type { HumanRawGeometry } from "./HumanRawGeometry";

/**
 * One failed raw-geometry observation, addressed so the defect can be found
 * on the mesh: who, which part, which stage, which direction, which face and
 * where. Absent readings stay `null` instead of becoming zero, so an
 * unavailable observation never reads as a perfect one.
 *
 * Shared by the raw placement contract and the raw two-mesh comparator, which
 * report their failures in the same address.
 */
export interface HumanRawFinding {
  /** Person alias or an explicitly synthetic control. */
  person: string;

  /** Independently defined source region. */
  part: string;

  /** Raw loft, intermediate interval or final composition being observed. */
  stage: string;

  /** Observation direction, so extra and missing geometry never cancel. */
  direction: string;

  /** Original face index; -1 denotes a vertex or buffer-level failure. */
  triangle: number;

  /** Actual observation coordinate in the fixed frame, mm. */
  coordinate: HumanRawGeometry.Point | null;

  /** Measured reading; `null` explicitly means unavailable. */
  observed: number | null;

  /** Independently prescribed scalar answer. */
  expected: number;

  /** Actual absolute disagreement; `null` when no finite observation exists. */
  deviation: number | null;

  /** Unchanged externally justified allowance. */
  tolerance: number;

  /** Physical or structural unit of this observation. */
  units: string;

  /** Exact refusal, absence, anatomical or geometric basis. */
  reason: string;
}
