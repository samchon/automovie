/**
 * Coefficient registry for an axis-aligned chart leaf layout and its shared
 * edges.
 */

export namespace IAutoMovieRecoveryChartLeafControls {
  /**
   * Supply identified rectangular leaf bounds and the control budget for one
   * coefficient registry.
   */

  export type Input = {
    /** Identified rectangular leaves in the complete chart partition. */
    leaves: readonly {
      /** Stable leaf identifier used to address its patch net. */
      id: string;

      /** Normalized [uMin, uMax, vMin, vMax] leaf bounds. */
      bounds: readonly [number, number, number, number];
    }[];

    /** Maximum generated coefficient slots for this leaf registry. */
    maxControls: number;
  };

  /**
   * Shared control IDs, bicubic leaf patch nets and affine edge restrictions
   * for the given layout.
   */

  export type Result = {
    /** Total registered control slots before fitting physical values. */
    controls: number;

    /** Per-leaf bicubic patch nets in the shared registry. */
    patches: {
      /** Leaf identifier carried as the patch address. */
      id: string;
      /** Sixteen shared control indices in U-fastest order. */
      controlIds: number[];
    }[];

    /** Affine dependent definitions for non-master edge slots. */
    relations: {
      /** Original dependent control slot defined by this relation. */
      id: number;
      /** Signed terms expressing this slot from original registry controls. */
      terms: {
        /** Original id of one contributing control. */
        id: number;
        /** Coefficient multiplying that control in the edge restriction. */
        weight: number;
      }[];
    }[];

    /** Canonical edge segments that own master control rows. */
    edges: {
      /** Stable identifier of the master edge segment. */
      id: string;

      /**
       * Varying chart axis of this master segment. Zero denotes U and one
       * denotes V.
       */
      axis: 0 | 1;

      /** Normalized coordinate on the fixed axis of the edge. */
      line: number;

      /** Lower global parameter along the master edge axis. */
      start: number;

      /** Upper global parameter along the master edge axis. */
      end: number;

      /** Four master control ids in increasing edge parameter order. */
      controlIds: [number, number, number, number];
    }[];

    /** Bindings mapping each attached patch side to its master edge restriction. */
    bindings: {
      /** Leaf patch ID addressed by this binding. */
      patch: string;

      /** Indexed patch side in the declared bottom, right, top, left order. */
      side: 0 | 1 | 2 | 3;

      /** Master edge ID supplying the boundary curve. */
      edge: string;

      /** Lower patch side coordinate in the master edge's normalized parameter. */
      start: number;

      /** Upper patch side coordinate in the master edge's normalized parameter. */
      end: number;
    }[];

    /** Exterior master-control slots with their normalized chart locations. */
    boundary: {
      /** Shared registry id of this exterior master control. */
      control: number;
      /** Nominal U parameter of this exterior control. */
      u: number;
      /** Nominal V parameter of this exterior control. */
      v: number;
    }[];
  };

  /**
   * Allocate one shared bicubic control registry from the admitted rectangular
   * leaves. Assign master edge controls and oriented interval bindings. Return
   * dependent relations and exterior master-control layout within the explicit
   * control cap.
   */

  export type Operation = (
    input: IAutoMovieRecoveryChartLeafControls.Input,
  ) => IAutoMovieRecoveryChartLeafControls.Result;
}
