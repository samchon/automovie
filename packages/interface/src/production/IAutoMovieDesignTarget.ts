/**
 * An addressable design artifact.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieDesignTarget` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieDesignTarget` for the narrative intent story design ownership system contract.
 */
export type IAutoMovieDesignTarget =
  | {
      /** Active production design. */
      kind: "production";
    }
  | {
      /** Model recipe. */
      kind: "model";

      /** Recipe id. */
      id: string;
    }
  | {
      /** Project-shared world design. */
      kind: "world";
    }
  | {
      /** Formation design. */
      kind: "formation";

      /** Formation id. */
      id: string;
    }
  | {
      /** Shot contract. */
      kind: "shot";

      /** Shot id. */
      id: string;
    }
  | {
      /** Acceptance scenario. */
      kind: "acceptance";

      /** Scenario id. */
      id: string;
    };
