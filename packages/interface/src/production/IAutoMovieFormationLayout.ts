/**
 * A compact formation layout; individual members are derived slots.
 *
 * @evidence contracts/common.md#principled-implementation Closed layout arms encode row-major line, column-major column, square-row wedge, evenly sampled arc or uniform-area seeded scatter; formationSlotPosition places local points under heading and terrain relief. Finite positive dimensions, bounded dressing and representable arithmetic are caller premises, not enforced by the placement function or this type.
 * @evidence contracts/common.md#clear-and-simple-design Each algorithm owns the parameters it reads; formed layouts alone accept bounded seeded dressing, while scatter carries its own radius and seed without unused grid spacing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Count capacity is required for line, column and wedge; one-member arcs use their middle angle and zero dressing means exact geometry rather than fixture-specific placement.
 * @evidence contracts/common.md#meaningful-documentation Defines algorithm-specific dimensions, local lateral and depth units, capacity rules, dressing omission and deterministic seed ranges.
 * @author Samchon
 */
export type IAutoMovieFormationLayout =
  | {
      /** Rectangular line enumerated across files before advancing a rank. */
      kind: "line";

      /** Integer ranks from 1 through count. */
      ranks: number;

      /** Integer files from 1 through count; ranks times files covers count. */
      files: number;

      /** Finite inter-slot spacing in meters, strictly above zero. */
      spacing: {
        /** Left-to-right spacing between files. */
        lateral: number;

        /** Front-to-back spacing between ranks. */
        depth: number;
      };

      /**
       * How far a member may stand off its exact slot, in meters.
       *
       * Formed troops are dressed to a tolerance, not to a lattice, and that tolerance is what makes a unit read as many people holding a line rather than one figure repeated on a grid. Omit it, or leave both numbers at zero, for exact geometry.
       *
       * Deviation is regenerated from the formation seed and slot index without a stored per-member displacement. Complete placement additionally depends on layout, heading, terrain and numeric implementation; seeded replay is not an independently verified cross-host crowd-byte certificate.
       */
      dressing?: {
        /** Maximum left-to-right deviation in meters, zero or above. */
        lateral: number;

        /** Maximum front-to-back deviation in meters, zero or above. */
        depth: number;
      };
    }
  | {
      /** March column enumerated through ranks before advancing a file. */
      kind: "column";

      /** Integer ranks from 1 through count. */
      ranks: number;

      /** Integer files from 1 through count; ranks times files covers count. */
      files: number;

      /** Finite inter-slot spacing in meters, strictly above zero. */
      spacing: {
        /** Left-to-right spacing between files. */
        lateral: number;

        /** Front-to-back spacing between ranks. */
        depth: number;
      };

      /**
       * How far a member may stand off its exact slot, in meters.
       *
       * Formed troops are dressed to a tolerance, not to a lattice, and that tolerance is what makes a unit read as many people holding a line rather than one figure repeated on a grid. Omit it, or leave both numbers at zero, for exact geometry.
       *
       * Deviation is regenerated from the formation seed and slot index without a stored per-member displacement. Complete placement additionally depends on layout, heading, terrain and numeric implementation; seeded replay is not an independently verified cross-host crowd-byte certificate.
       */
      dressing?: {
        /** Maximum left-to-right deviation in meters, zero or above. */
        lateral: number;

        /** Maximum front-to-back deviation in meters, zero or above. */
        depth: number;
      };
    }
  | {
      /** Wedge with successive odd-width rows containing one, three, five and further slots. */
      kind: "wedge";

      /** Integer rows from 1 through count; depth squared must cover count. */
      depth: number;

      /** Finite inter-slot spacing in meters, strictly above zero. */
      spacing: {
        /** Left-to-right spacing between members in one row. */
        lateral: number;

        /** Front-to-back spacing between rows. */
        depth: number;
      };

      /**
       * How far a member may stand off its exact slot, in meters.
       *
       * Formed troops are dressed to a tolerance, not to a lattice, and that tolerance is what makes a unit read as many people holding a line rather than one figure repeated on a grid. Omit it, or leave both numbers at zero, for exact geometry.
       *
       * Deviation is regenerated from the formation seed and slot index without a stored per-member displacement. Complete placement additionally depends on layout, heading, terrain and numeric implementation; seeded replay is not an independently verified cross-host crowd-byte certificate.
       */
      dressing?: {
        /** Maximum left-to-right deviation in meters, zero or above. */
        lateral: number;

        /** Maximum front-to-back deviation in meters, zero or above. */
        depth: number;
      };
    }
  | {
      /** Arc layout. */
      kind: "arc";

      /** Finite arc radius in meters, strictly above zero. */
      radius: number;

      /** Finite covered angle, strictly above zero and at most 360 degrees. */
      arcDegrees: number;

      /**
       * How far a member may stand off its exact slot, in meters.
       *
       * Formed troops are dressed to a tolerance, not to a lattice, and that tolerance is what makes a unit read as many people holding a line rather than one figure repeated on a grid. Omit it, or leave both numbers at zero, for exact geometry.
       *
       * Deviation is regenerated from the formation seed and slot index without a stored per-member displacement. Complete placement additionally depends on layout, heading, terrain and numeric implementation; seeded replay is not an independently verified cross-host crowd-byte certificate.
       */
      dressing?: {
        /** Maximum left-to-right deviation in meters, zero or above. */
        lateral: number;

        /** Maximum front-to-back deviation in meters, zero or above. */
        depth: number;
      };
    }
  | {
      /** Seeded scatter layout. */
      kind: "scatter";

      /** Finite scatter radius in meters, strictly above zero. */
      radius: number;

      /** Integer layout-specific seed from zero through `MAX_SAFE_INTEGER`. */
      seed: number;
    };
