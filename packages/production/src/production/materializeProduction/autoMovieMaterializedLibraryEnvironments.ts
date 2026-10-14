import { IAutoMovieBuiltEnvironment, IAutoMovieMaterializedLibraryOwner } from "@automovie/interface";
import typia from "typia";
import { encodeAutoMoviePathSegment } from "../contentIdentity";
import { materializedLibraryReader } from "./materializedLibraryReader";

/**
 * Create a reader over one captured library index and live environment artifact reads.
 *
 * @evidence contracts/common.md#principled-implementation The shared reader captures schema-admitted branch/full-owner environment ids once, then validates each requested artifact through the supplied byte reader and environment schema.
 * @evidence contracts/common.md#clear-and-simple-design One generic reading kernel owns address/error policy while this factory supplies only environment selection, encoded path and schema validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The full owner string must contain its anchor; the separate request.anchor field is unused. Missing/invalid index or records produce the existing empty/partial result policy; compile/currentness/tamper gates remain separate, and no maintained runtime caller currently invokes this public factory.
 * @evidence contracts/common.md#meaningful-documentation Documents index snapshot lifetime, full owner addressing, live record reads and empty/partial results without claiming a current publication certificate.
 * @evidence contracts/performance.md#efficient-algorithms Factory work includes complete index read/parse/schema and owner-id projection; requests include selected record IO, JSON/schema work and fresh result-array allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured ids are reused within this reader closure, while record bytes are reread per request. Index changes require a new factory; no automatic invalidation exists here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller owns the reader closure, captured id map and borrowed read callback until release; per-request results transfer to it, and any IO handles remain the callback's responsibility.
 *
 * @author Samchon
 */
export function autoMovieMaterializedLibraryEnvironments(props: {
  /** Read one generated-root-relative file, throwing when it is absent. */
  read: (relativePath: string) => Uint8Array;
}): ((request: {
  /** Exact declared library branch. */
  branch: string;

  /** Full document path plus #anchor used in captured-index lookup. */
  owner: string;

  /** Retained compatibility field; this reader uses the anchor in owner and does not read it separately. */
  anchor: string;
}) => readonly IAutoMovieBuiltEnvironment[]) { return materializedLibraryReader<IAutoMovieBuiltEnvironment>({
    read: props.read,
    select: (owner: IAutoMovieMaterializedLibraryOwner) : string[] => owner.environments,
    file: (id: string) : string => `library/environments/${encodeAutoMoviePathSegment(id)}.json`,
    validate: (value: unknown) : typia.IValidation<IAutoMovieBuiltEnvironment> =>
      typia.validateEquals<IAutoMovieBuiltEnvironment>(value),
    what: "environments",
  }); }
