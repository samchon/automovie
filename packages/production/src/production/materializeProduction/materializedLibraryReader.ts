import { IAutoMovieMaterializedLibrary, IAutoMovieMaterializedLibraryOwner } from "@automovie/interface";
import typia from "typia";
import { parseAutoMovieStructuredJson } from "../duplicateAwareJson";
import { AUTOMOVIE_LIBRARY_INDEX_PATH } from "./AUTOMOVIE_LIBRARY_INDEX_PATH";

/**
 * Capture owner-addressed artifact ids once and read schema-admitted records on each request.
 *
 * @evidence contracts/common.md#principled-implementation Strict index parsing and exact schema admission build a branch/full-owner Map; requests require an anchored owner, then read each selected path and retain only successful schema results.
 * @evidence contracts/common.md#clear-and-simple-design Both public factories supply their selector/path/schema differences to this sole address/error owner rather than duplicating index lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent/unreadable/invalid index and per-record failures are intentionally swallowed into empty/partial populations. Schema validation alone does not prove record identity/currentness or untampered publication; separate gates own those facts, and request.anchor is ignored.
 * @evidence contracts/common.md#meaningful-documentation Documents full-address refusal, captured-index versus live-record observations and the existing silent failure/partial-result contract.
 * @evidence contracts/performance.md#efficient-algorithms Factory read/parse/schema cost follows full index bytes and owner lists; each request includes selected record IO/parsing/validation with expected map lookup and no numeric byte quota.
 * @evidence contracts/performance.md#reuse-equivalent-work Only captured owner-id membership is reused. Record bytes are observed anew per request; there is no index watcher, invalidation or cross-factory result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains the closure, copied id lists and read callback; temporary validation trees retire or transfer through returned records, while the callback owns any IO acquisition/release.
 *
 * @author Samchon
 */
export function materializedLibraryReader<T>(props: {
  read: (relativePath: string) => Uint8Array;
  select: (
    owner: IAutoMovieMaterializedLibraryOwner,
  ) => readonly string[] | undefined;
  file: (id: string) => string;
  validate: (value: unknown) => typia.IValidation<T>;
  what: string;
}): ((request: {
  branch: string;
  owner: string;
  anchor: string;
}) => readonly T[]) {
  const published: Map<string, string[]> = new Map<string, string[]>();
  try {
    const index: typia.IValidation<IAutoMovieMaterializedLibrary> = typia.validateEquals<IAutoMovieMaterializedLibrary>(
      parseAutoMovieStructuredJson({
        record: "library-index",
        bytes: props.read(AUTOMOVIE_LIBRARY_INDEX_PATH),
      }),
    );
    if (index.success === true)
      for (const owner of index.data.owners)
        published.set(JSON.stringify([owner.branch, owner.owner]), [
          ...(props.select(owner) ?? []),
        ]);
  } catch {
    // An absent or unreadable index is an uncompiled project, which the compile
    // gate reports at its own address; here it is simply an empty population.
  }
  return (request: { branch: string; owner: string; anchor: string; }) : T[] => {
    // An empty answer is a real one for an owner that published nothing, so it
    // cannot also mean "you addressed this wrongly"; that has to be said
    // separately or it is never said at all. `building:report` passed the
    // document path alone and read no materialized building for as long as that
    // stood, while reporting that it had looked.
    if (request.owner.includes("#") === false)
      throw new Error(
        `Materialized library ${props.what} are addressed by the design owner's "path#anchor", not by "${request.owner}" alone.`,
      );
    const ids: string[] | undefined = published.get(JSON.stringify([request.branch, request.owner]));
    if (ids === undefined) return [];
    const found: T[] = [];
    for (const id of ids)
      try {
        const validation: typia.IValidation<T> = props.validate(
          parseAutoMovieStructuredJson({
            record: "library-record",
            bytes: props.read(props.file(id)),
          }),
        );
        if (validation.success === true) found.push(validation.data);
      } catch {
        // A published path the tree no longer carries is generated-output
        // tampering, which `generated-tampered` names at that exact file.
      }
    return found;
  };
}
