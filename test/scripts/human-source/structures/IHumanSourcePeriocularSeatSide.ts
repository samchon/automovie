import type { IHumanSourcePeriocularSeatState } from "./IHumanSourcePeriocularSeatState.ts";

/**
 * One eye's cage seat census over the neutral and every channel end that moves it.
 *
 * @author Samchon
 */
export interface IHumanSourcePeriocularSeatSide {
  /** Anatomical side of the registered periocular cage. */
  side: "left" | "right";

  /** Skin surface that owns the cage vertices. */
  cageSurface: string;

  /** Source globe surface the distance is measured to. */
  globeSurface: string;

  /** Cage columns per row. */
  columns: number;

  /** Closed row column at the medial join. */
  medialColumn: number;

  /** Closed row column at the lateral join. */
  lateralColumn: number;

  /** Neutral first, then each moving channel end in basis order. */
  states: IHumanSourcePeriocularSeatState[];
}
