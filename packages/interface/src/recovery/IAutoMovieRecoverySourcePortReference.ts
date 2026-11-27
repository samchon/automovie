/**
 * Address of the observation represented by a source port. The discriminator
 * requires section/curve, section/contact observation, or named-boundary
 * identity for its actual variant. Numeric ordinals are dimensionless and their
 * range belongs to the supplying observation.
 */
export type IAutoMovieRecoverySourcePortReference =
  | {
      /**
       * Closed representation discriminator selecting the corresponding
       * observation or result arm.
       */
      kind: "closed" | "open";
      /** Saved-section ordinal in the input observation sequence. */
      section: number;
      /** Curve ordinal in the addressed saved closed/open section population. */
      curve: number;
    }
  | {
      /**
       * Closed representation discriminator selecting the corresponding
       * observation or result arm.
       */
      kind: "contact";
      /** Saved-section ordinal in the input observation sequence. */
      section: number;
      /** Contact-observation ordinal in the addressed saved section. */
      observation: number;
    }
  | {
      /**
       * Closed representation discriminator selecting the corresponding
       * observation or result arm.
       */
      kind: "boundary";
      /**
       * Caller-assigned stable semantic identity retained in generated
       * coefficient and observation records.
       */
      name: string;
    };
