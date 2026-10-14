import { IAutoMovieEnvironmentContext, IAutoMovieMaterializedLibraryOwner } from "@automovie/interface";
import typia from "typia";
import { encodeAutoMoviePathSegment } from "../contentIdentity";
import { materializedLibraryReader } from "./materializedLibraryReader";

/**
 * Create a reader over one captured library index and live context artifact reads.
 *
 * @evidence contracts/common.md#principled-implementation The shared reader selects each owner's contexts, preserving the legacy absent-context list as empty, and validates current requested context bytes under the supplied schema.
 * @evidence contracts/common.md#clear-and-simple-design Context population shares the environment reader's address/error kernel while keeping its actual id list, encoded file path and schema owner distinct.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The full owner string carries the anchor and request.anchor is unused. Missing/invalid index or context records keep empty/partial behavior; no maintained runtime caller currently invokes this public factory and this creates no new observation host.
 * @evidence contracts/common.md#meaningful-documentation States legacy absent-list behavior, index snapshot lifetime, live context reads and separate compile/currentness authority.
 * @evidence contracts/performance.md#efficient-algorithms Includes full index acquisition/validation and selected context reads/parsing/schema checks; owner and context populations plus byte IO determine work.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured context ids are reused for this closure only; every request rereads records, and changed indexes require constructing a new reader.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains closure/id-map/read callback until release; returned contexts are fresh parse results and this factory acquires no direct filesystem or rendering resource.
 *
 * @author Samchon
 */
export function autoMovieMaterializedLibraryContexts(props: {
  /** Read one generated-root-relative file, throwing when it is absent. */
  read: (relativePath: string) => Uint8Array;
}): ((request: {
  /** Exact declared library branch. */
  branch: string;

  /** Full document path plus #anchor used in captured-index lookup. */
  owner: string;

  /** Retained compatibility field; this reader uses the anchor in owner and does not read it separately. */
  anchor: string;
}) => readonly IAutoMovieEnvironmentContext[]) { return materializedLibraryReader<IAutoMovieEnvironmentContext>({
    read: props.read,
    select: (owner: IAutoMovieMaterializedLibraryOwner) : string[] | undefined => owner.contexts,
    file: (id: string) : string => `library/contexts/${encodeAutoMoviePathSegment(id)}.json`,
    validate: (value: unknown) : typia.IValidation<IAutoMovieEnvironmentContext> =>
      typia.validateEquals<IAutoMovieEnvironmentContext>(value),
    what: "contexts",
  }); }
