import { IAutoMovieBuiltEnvironment, IAutoMovieEnvironmentContext, IAutoMovieMaterializedLibrary, IAutoMovieMaterializedLibraryOwner, IAutoMovieModel } from "@automovie/interface";
import { canonicalAutoMovieJsonBytes, compareCodeUnits, encodeAutoMoviePathSegment } from "../contentIdentity";
import { AUTOMOVIE_LIBRARY_INDEX_PATH } from "./AUTOMOVIE_LIBRARY_INDEX_PATH";
import { type IAutoMovieMaterializedLibraryResult } from "./IAutoMovieMaterializedLibraryResult";

/**
 * Serialize executed library owners into canonical artifact bytes and the existing lineage index.
 *
 * @evidence contracts/common.md#principled-implementation Sorts owners by branch/full-address key, writes environments/models/contexts at encoded-id paths and canonical JSON plus one newline, then publishes version-one index metadata at the shared index path.
 * @evidence contracts/common.md#clear-and-simple-design Publication is an in-memory file Map and index; the owning compile pipeline decides actual storage, admission and completion separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Validated contributions, definite contexts and unique owner/artifact addresses are caller premises. Duplicate paths retain existing last-write Map behavior; this function supplies no atomic filesystem transaction or proof of source execution.
 * @evidence contracts/common.md#meaningful-documentation Documents encoded addresses, canonical bytes/newline, owner ordering, caller admission and in-memory publication ownership.
 * @evidence contracts/performance.md#efficient-algorithms Includes owner sorting/key serialization, every contributed artifact's full canonical serialization/byte copies and id-list sorting; cost and retained bytes scale with all models, environments and contexts.
 * @evidence contracts/performance.md#reuse-equivalent-work One canonical file Map serves publication/inspection consumers for this compile; unchanged source labels alone do not cache mutable contribution values across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned Map/index and all serialized byte buffers transfer to the caller, with total output-sized retention and no independently opened file or storage transaction.
 *
 * @author Samchon
 */
export function materializeAutoMovieLibraryFiles(props: {
  /** Production namespace this library is compiled under. */
  production: string;

  /** Compiler protocol identity recorded in the index. */
  builder: string;

  /** Compiler input identity this publication was derived at. */
  inputFingerprint: string;

  /** Executed owners in any order; the result is sorted by its own address. */
  results: readonly IAutoMovieMaterializedLibraryResult[];
}): {
  files: ReadonlyMap<string, Uint8Array>;
  index: IAutoMovieMaterializedLibrary;
} {
  const files: Map<string, Uint8Array<ArrayBufferLike>> = new Map<string, Uint8Array>();
  const put: (file: string, value: unknown) => void = (file: string, value: unknown): void => {
    files.set(
      file,
      Buffer.concat([
        Buffer.from(canonicalAutoMovieJsonBytes(value)),
        Buffer.from("\n", "utf8"),
      ]),
    );
  };
  const owners: IAutoMovieMaterializedLibraryOwner[] = [...props.results]
    .sort((left: IAutoMovieMaterializedLibraryResult, right: IAutoMovieMaterializedLibraryResult) : number =>
      compareCodeUnits(
        JSON.stringify([left.branch, left.owner]),
        JSON.stringify([right.branch, right.owner]),
      ),
    )
    .map((result: IAutoMovieMaterializedLibraryResult): IAutoMovieMaterializedLibraryOwner => {
      for (const environment of result.contribution.environments)
        put(
          `library/environments/${encodeAutoMoviePathSegment(environment.id)}.json`,
          environment,
        );
      for (const model of result.contribution.models)
        put(`models/${encodeAutoMoviePathSegment(model.id)}.json`, model);
      // Under their own directory rather than beside the environments. A
      // context is not a thing in the world the environments describe; it is
      // the world they are described against, and one adopted context may be
      // the ground several owners' buildings stand on.
      for (const context of result.contribution.contexts)
        put(
          `library/contexts/${encodeAutoMoviePathSegment(context.id)}.json`,
          context,
        );
      return {
        branch: result.branch,
        owner: result.owner,
        source: result.source,
        export: result.export,
        sourceDigest: result.sourceDigest,
        environments: result.contribution.environments
          .map((environment: IAutoMovieBuiltEnvironment) : string => environment.id)
          .sort(compareCodeUnits),
        models: result.contribution.models
          .map((model: IAutoMovieModel) : string => model.id)
          .sort(compareCodeUnits),
        contexts: result.contribution.contexts
          .map((context: IAutoMovieEnvironmentContext) : string => context.id)
          .sort(compareCodeUnits),
      };
    });
  const index: IAutoMovieMaterializedLibrary = {
    version: 1,
    builder: props.builder,
    production: props.production,
    inputFingerprint: props.inputFingerprint,
    owners,
  };
  put(AUTOMOVIE_LIBRARY_INDEX_PATH, index);
  return { files, index };
}
