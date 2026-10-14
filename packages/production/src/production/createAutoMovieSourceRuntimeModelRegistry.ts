import type { IAutoMovieModel } from "@automovie/interface";

/**
 * Build the exact own-key registry used while deterministic source adds models.
 *
 * The portable build context remains a record, but membership never consults
 * `Object.prototype`: builder keys and accepted source ids are defined as own
 * enumerable data properties, and every lookup, key, and value projection reads
 * only that population. A builder key may differ from the contained model id,
 * so `resolve` preserves both identities without admitting inherited names.
 *
 * @evidence contracts/common.md#principled-implementation A null-prototype record and own-property admission keep prototype names outside model membership; explicit data-property writes permit real constructor-like ids and resolution preserves exact registered keys before first model-id match.
 * @evidence contracts/common.md#clear-and-simple-design Shot assembly shares one portable record with exact membership/projection methods; the registry wrapper is frozen while admitted source models can be registered through define.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No inherited key supplies a model, and a builder key different from the model id remains supported through the documented resolution order without renaming its public identity.
 * @evidence contracts/common.md#meaningful-documentation States own-key semantics, insertion order, builder-key versus model-id distinction and controlled source registration.
 * @evidence contracts/performance.md#efficient-algorithms Initial copying costs O(M) records. Exact-key lookup/writes use object property operations; keys/values and model-id fallback allocate/scan O(M), repeated for each fallback resolution. No reverse index is maintained because mutable model ids and first insertion-order alias semantics remain authoritative.
 * @evidence contracts/performance.md#reuse-equivalent-work One shot shares this registry across source admission and adoption/runtime consumers, with accepted define writes immediately visible to all methods; no result cache assumes mutable model content is unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure owns one record and model references for the shot/build attempt, growing with admitted models without a fixed cap; transient values/keys arrays belong to callers and no handle or task is acquired.
 * @author Samchon
 */
export function createAutoMovieSourceRuntimeModelRegistry(initial: Readonly<Record<string, IAutoMovieModel>>): Readonly<{
  record: Readonly<Record<string, IAutoMovieModel>>;
  define: (key: string, model: IAutoMovieModel) => void;
  has: (key: string) => boolean;
  get: (key: string) => IAutoMovieModel | undefined;
  keys: () => string[];
  values: () => IAutoMovieModel[];
  resolve: (identity: string) => IAutoMovieModel | undefined;
}> {
  const records: Record<string, IAutoMovieModel> = Object.create(null) as Record<string, IAutoMovieModel>;
  function define(key: string, model: IAutoMovieModel): void {
    Object.defineProperty(records, key, {
      configurable: true,
      enumerable: true,
      value: model,
      writable: true,
    });
  }
  for (const [key, model] of Object.entries(initial)) define(key, model);
  function values(): IAutoMovieModel[] {
    return Object.values(records);
  }
  return Object.freeze({
    /** Portable record handed to the existing shot build context. */
    record: records as Readonly<Record<string, IAutoMovieModel>>,
    /** Register one accepted source model under its exact authored id. */
    define,
    /** Test exact registered-key membership without prototype inheritance. */
    has: (key: string): boolean => Object.hasOwn(records, key),
    /** Read one exact registered key, or undefined when it is absent. */
    get: (key: string): IAutoMovieModel | undefined =>
      Object.hasOwn(records, key) ? records[key] : undefined,
    /** Preserve deterministic own-key insertion order. */
    keys: (): string[] => Object.keys(records),
    /** Preserve deterministic own-value insertion order. */
    values,
    /** Resolve either a builder registry key or the model's own public id. */
    resolve: (identity: string): IAutoMovieModel | undefined =>
      Object.hasOwn(records, identity)
        ? records[identity]
        : values().find((model: IAutoMovieModel): boolean => model.id === identity),
  });
}
