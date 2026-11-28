/**
 * Typed source-free address of a saved observation or named boundary associated
 * with a port.
 */
export type IAutoMovieRecoverySourcePortReference =
  | {
      /** Saved closed loop or open report fit address. */
      kind: "closed" | "open";
      /** Original saved section index containing this closed or open curve. */
      section: number;
      /** Index in the indicated closed or open output curve population. */
      curve: number;
    }
  | {
      /** Saved contact observation address. */
      kind: "contact";
      /** Original saved section index containing this contact. */
      section: number;
      /** Index in that section's recorded contact population. */
      observation: number;
    }
  | {
      /**
       * Caller-defined boundary observation without a saved curve or contact
       * index.
       */
      kind: "boundary";
      /** Caller-assigned name of the observed boundary. */
      name: string;
    };
