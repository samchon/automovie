
import { HumanReferenceFiles } from "./HumanReferenceFiles";

/**
 * Each population body as measured, read by each call for the
 * surface and the layer comparisons, whose limits both stand on the spread of
 * these bodies.
 *
 * A body keeps its raw positions, unwelded, in the population's shared vertex
 * order, so one vertex index names the same point of anatomy on every body.
 * Single precision holds a position to well under a micrometre at body size,
 * far below any spread read from them, and halves the memory of the 66 bodies.
 */
export namespace HumanReferenceBodySingleton {
  /** One population body as measured. */
  export interface IBody {
    /** Reference alias. */
    id: string;

    /** Raw positions, mm, its parts concatenated in file order. */
    P: Float32Array;

    /** Stature: the crown's height over the floor, mm. */
    stature: number;
  }

  /**
   * A population body, read on first use.
   *
   * @param id Reference alias.
   */
  export function get(id: string): IBody {
    return build(id);
  }


  /**
   * Read a body and its stature, the highest raw vertex over the floor at 0.
   *
   * @param id Reference alias.
   */
  function build(id: string): IBody {
    const P: Float64Array = HumanReferenceFiles.positions(id);
    let stature: number = -Infinity;

    for (let v: number = 1; v < P.length; v += 3) stature = Math.max(stature, P[v]!);
    return { id, P: Float32Array.from(P), stature };
  }
}
