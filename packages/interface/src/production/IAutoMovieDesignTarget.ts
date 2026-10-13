/**
 * Stable address of one mutable design artifact in the active production graph. Production and world are singletons; model, formation, shot and acceptance require their declared ids.
 *
 * @evidence contracts/common.md#principled-implementation The kind selects the corresponding graph singleton or id-keyed registry, giving mutation, reference checks and consequence computation one unambiguous artifact address.
 * @evidence contracts/common.md#clear-and-simple-design Singleton arms omit a meaningless id, while registry arms carry exactly the identity needed to select one model recipe, formation, shot or acceptance scenario.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The target does not accept arbitrary filesystem paths, and case-colliding registry identities are refused by project mutation rather than selecting a platform-dependent record.
 * @evidence contracts/common.md#meaningful-documentation Names each addressed family and distinguishes active production and shared-world singletons from the four id-keyed registries.
 * @author Samchon
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
