/**
 * A compact formation layout; individual members are derived slots.
 *
 * @evidence requirements/formations/layouts-and-slots.md#formation-layout-selection-parameters Exposes `IAutoMovieFormationLayout` as the portable data boundary for the formation layout selection parameters requirement.
 * @evidence specifications/performance-motion-and-staging/formation-identity-layout-and-terrain.md#performance-formation-layout-slot-assignment Types `IAutoMovieFormationLayout` for the performance formation layout slot assignment system contract.
 */
export type IAutoMovieFormationLayout =
  | {
      /** Rectangular line. */
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
       * Formed troops are dressed to a tolerance, not to a lattice, and that
       * tolerance is what makes a unit read as many people holding a line
       * rather than one figure repeated on a grid. Omit it, or leave both
       * numbers at zero, for exact geometry.
       *
       * The deviation is derived from the formation seed and the slot index, so
       * it costs no storage, regenerates identically everywhere, and the same
       * design always compiles to the same crowd.
       */
      dressing?: {
        /** Maximum left-to-right deviation in meters, zero or above. */
        lateral: number;

        /** Maximum front-to-back deviation in meters, zero or above. */
        depth: number;
      };
    }
  | {
      /** March column. */
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
       * Formed troops are dressed to a tolerance, not to a lattice, and that
       * tolerance is what makes a unit read as many people holding a line
       * rather than one figure repeated on a grid. Omit it, or leave both
       * numbers at zero, for exact geometry.
       *
       * The deviation is derived from the formation seed and the slot index, so
       * it costs no storage, regenerates identically everywhere, and the same
       * design always compiles to the same crowd.
       */
      dressing?: {
        /** Maximum left-to-right deviation in meters, zero or above. */
        lateral: number;

        /** Maximum front-to-back deviation in meters, zero or above. */
        depth: number;
      };
    }
  | {
      /** Wedge layout. */
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
       * Formed troops are dressed to a tolerance, not to a lattice, and that
       * tolerance is what makes a unit read as many people holding a line
       * rather than one figure repeated on a grid. Omit it, or leave both
       * numbers at zero, for exact geometry.
       *
       * The deviation is derived from the formation seed and the slot index, so
       * it costs no storage, regenerates identically everywhere, and the same
       * design always compiles to the same crowd.
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
       * Formed troops are dressed to a tolerance, not to a lattice, and that
       * tolerance is what makes a unit read as many people holding a line
       * rather than one figure repeated on a grid. Omit it, or leave both
       * numbers at zero, for exact geometry.
       *
       * The deviation is derived from the formation seed and the slot index, so
       * it costs no storage, regenerates identically everywhere, and the same
       * design always compiles to the same crowd.
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
