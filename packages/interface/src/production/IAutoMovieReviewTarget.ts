import { IAutoMovieDesignTarget } from "./IAutoMovieDesignTarget";
import type { IAutoMovieSubjectReviewTarget } from "./IAutoMovieSubjectReviewTarget";

/**
 * Closed addresses for review and mutation consequences across authored decisions, compiled results and selected visual evidence.
 *
 * @evidence contracts/common.md#principled-implementation Kind discrimination preserves asset, design, source, shot, rendition, sequence, film or subject address domains used by capture metadata. Production review/currentness and mutation resolvers are retired; these fields declare an intended owner without resolving existence or applying freshness checks.
 * @evidence contracts/common.md#clear-and-simple-design Each arm carries its own minimal address, and subject review composes its existing artifact-plus-subject contract instead of flattening that address into a frame target.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A shot containing a subject cannot substitute for subject review, and a deterministic shot is distinct from its receipt-bound rendition; no path parsing silently converts one target class into another.
 * @evidence contracts/common.md#meaningful-documentation Defines each target kind and exact identifier, source path, typed design address or compiled subject address it owns.
 * @author Samchon
 */
export type IAutoMovieReviewTarget =
  | {
      /** Consumed compiled model asset. */
      kind: "asset";

      /** Model-recipe id. */
      id: string;
    }
  | {
      /** Typed design target. */
      kind: "design";

      /** Exact design artifact. */
      design: IAutoMovieDesignTarget;
    }
  | {
      /** Coding-agent-owned source file. */
      kind: "source";

      /** Project-relative source path. */
      path: string;
    }
  | {
      /** Compiled shot. */
      kind: "shot";

      /** Shot id. */
      id: string;
    }
  | {
      /** Receipt-bound visual rendition of one compiled shot. */
      kind: "rendition";

      /** Exact compiled shot id. */
      id: string;
    }
  | {
      /** Authored treatment sequence. */
      kind: "sequence";

      /** Stable sequence id. */
      id: string;
    }
  | {
      /** Whole film. */
      kind: "film";

      /** Film id. */
      id: string;
    }
  | ({
      /**
       * One compiled subject observed as itself rather than at a film moment.
       *
       * The address is the compiled artifact plus the stable subject id, not a frame, so a shot that happens to contain the subject never stands in for this target.
       */
      kind: "subject";
    } & IAutoMovieSubjectReviewTarget);
