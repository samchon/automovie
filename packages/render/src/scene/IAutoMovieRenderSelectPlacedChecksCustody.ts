import type { Object3D } from "three";
import type { IAutoMovieRenderSelectPlacedChecksRule } from "./IAutoMovieRenderSelectPlacedChecksRule";

/** A prop's holder schedule, observed through the displayed scene graph. */
export interface IAutoMovieRenderSelectPlacedChecksCustody extends IAutoMovieRenderSelectPlacedChecksRule {
  /** The prop whose holder is checked. */
  readonly prop: Object3D;
  /** Declared holders by stable name, each the node that carries the prop. */
  readonly holders: Readonly<Record<string, Object3D>>;
  /**
   * Holder changes; each entry owns film time from its second until the next
   * entry. Null declares a free prop.
  */
  readonly schedule: readonly {
    readonly from: number;
    readonly holder: string | null;
  }[];
}
