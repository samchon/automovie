import type { AutoMovieDiagnosticCode, IAutoMovieDiagnosticReference } from "@automovie/interface";
import { AUTOMOVIE_DIAGNOSTIC_CODES } from "../AUTOMOVIE_DIAGNOSTIC_CODES";
import type { IAutoMovieDiagnosticCatalogEntry } from "./IAutoMovieDiagnosticCatalogEntry";

/** Derive family prefixes from the closed code union; this erased type validates no runtime string. */
type DiagnosticFamily<Code extends string> = Code extends `${infer Family}-${string}` ? Family : never;

/** Family names supplied by the maintained code population and its contract table. */
type AutoMovieDiagnosticFamily = DiagnosticFamily<AutoMovieDiagnosticCode>;

/** Reference revision embedded in every entry constructed by this module. */
const CATALOG_REVISION: number = 3;

/**
 * One diagnostic family's documented invariant and caller-owned recovery route.
 *
 * @author Samchon
 */
interface IDiagnosticFamilyContract {
  /** Documentation address returned without opening the document. */
  path: IAutoMovieDiagnosticReference["path"];

  /** Required behavior described to the caller; lookup performs no validation. */
  invariant: string;

  /** Caller-owned repair guidance, never an automatically applied edit. */
  correction: string;

  /** Suggested operation after repair; lookup does not execute it. */
  recheck: string;
}

/** Exhaustive family guidance supplies defaults for codes without a specific override. */
const FAMILY_CONTRACTS: Readonly<Record<AutoMovieDiagnosticFamily, IDiagnosticFamilyContract> & Record<string, IDiagnosticFamilyContract>> = {
  acceptance: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Acceptance outcomes must be derived from current, addressable criteria and current compiled observations.",
    correction:
      "Read the occurrence message and edit the user-owned acceptance or story contract it identifies; the catalog does not synthesize a criterion or result.",
    recheck:
      "Compile the same scope again and re-evaluate the named criterion.",
  },
  asset: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Every adopted asset must resolve to declared bytes, interpretation metadata, provenance, permission, and a supported consumer representation.",
    correction:
      "Read the occurrence target, path, and message, then repair or replace the user-selected asset record without changing provider or content policy implicitly.",
    recheck: "Inspect the adopted bytes again and compile the same scope.",
  },
  blocking: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Authored blocking must lower to valid deterministic stage relations for the registered shot contract.",
    correction:
      "Correct the blocking operation named by the occurrence without replacing the author's staging decision.",
    recheck: "Execute the shot source and compile the affected shot again.",
  },
  builder: {
    path: "README.md#canonical-command-routes",
    invariant:
      "A shot builder must execute successfully inside the deterministic source boundary.",
    correction:
      "Repair the exact authored builder failure reported by the occurrence without bypassing the builder boundary.",
    recheck: "Execute the same source registration and compile scope again.",
  },
  capture: {
    path: "README.md#canonical-command-routes",
    invariant:
      "A review capture must reopen as current host-produced pixels bound to the exact production, target, renderer, and compile fingerprint.",
    correction:
      "Follow the occurrence message to restore the named host, registration, input, or receipt; never treat a refused capture as evidence.",
    recheck:
      "Retry the same capture request after recompiling any changed source.",
  },
  compile: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Compilation consumes one current, stable input closure and publishes derived state only after the requested scope succeeds.",
    correction:
      "Use the occurrence message to correct the identified input or rerun after the concurrent change; no catalog lookup edits the project.",
    recheck: "Run the same compile scope against one unchanged input revision.",
  },
  content: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Compiler input must remain inside the declared deterministic and security boundary.",
    correction:
      "Remove or replace the exact unsafe input named by the occurrence under the production author's policy.",
    recheck: "Run the same source or compile validation again.",
  },
  contract: {
    path: "README.md#canonical-command-routes",
    invariant:
      "The registered shot and its realized source must agree with one exact authored contract.",
    correction:
      "Correct the contract or source relation named by the occurrence; the builder does not rewrite either side to make them agree.",
    recheck:
      "Compile the affected shot and re-evaluate all contract realizations.",
  },
  design: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Tracked design must be complete, internally consistent, addressable, and supported before downstream compilation can consume it.",
    correction:
      "Correct the exact design owner, field, or reference named by the occurrence; do not invent content, providers, or fallback values.",
    recheck:
      "Validate design scope first, then repeat every invalidated downstream scope.",
  },
  derived: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Every derived artifact must have one current, portable, project-owned generator, dependency closure, ledger record, and exact output before source execution.",
    correction:
      "Correct the generator or declared input named by the occurrence and rerun the explicit generation command; do not edit the ledger or output bytes by hand.",
    recheck:
      "Inspect the derived-artifact ledger again, then compile the same scope without changing its input closure.",
  },
  engine: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Engine validation must succeed before its output can be accepted as compiled production state.",
    correction:
      "Inspect the nested engine failure in the occurrence and repair the authored geometry, motion, timing, or bounded state it names.",
    recheck: "Run engine validation and then the same compile scope.",
  },
  environment: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Environment context must name valid authored spatial owners and may not derive physical facts from labels or appearance.",
    correction:
      "Correct the explicit world, building, space, or material fact named by the occurrence; do not infer a missing physical parameter.",
    recheck:
      "Validate the environment and repeat the consuming compile operation.",
  },
  film: {
    path: "README.md#canonical-command-routes",
    invariant:
      "The compiled film must account for every selected shot, transition, cue, clock join, and deliverable interval on one exact timeline.",
    correction:
      "Correct the user-authored film or shot timing relation identified by the occurrence without silently selecting an edit.",
    recheck: "Compile the film again and revalidate its complete timeline.",
  },
  generated: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Compiler-owned generated output must exactly match the current source closure and its manifest.",
    correction:
      "Repair tracked source or remove only the specifically diagnosed stale generated artifact through the documented builder workflow.",
    recheck: "Run the owning compile or read-only lint operation again.",
  },
  geometry: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Geometry queries must use supported selectors that resolve inside the current compiled production.",
    correction:
      "Correct the selector or its tracked owner named by the occurrence; do not substitute a guessed measurement.",
    recheck: "Repeat the same geometry query against current compiled state.",
  },
  grammar: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Authored style intent must account for deliberate film-grammar departures observed in the compiled result.",
    correction:
      "Re-author the shot or its explicit style intent; the diagnostic does not choose the creative resolution.",
    recheck: "Compile and review the affected shot and film relation again.",
  },
  legacy: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Legacy import must preserve source, disclose every default or reconstruction, and refuse facts that cannot be recovered.",
    correction:
      "Resolve the named reconstruction decision in tracked user-owned design or supply the missing legacy source.",
    recheck:
      "Repeat import, reopen the project, and compile the affected scopes.",
  },
  model: {
    path: "README.md#canonical-command-routes",
    invariant:
      "A model recipe must use a registered archetype and supported, bounded parameter contract.",
    correction:
      "Correct the named recipe or explicitly choose another registered archetype; the catalog never selects one.",
    recheck: "Validate design and materialize the model again.",
  },
  performance: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Authored performance must lower to supported deterministic pose, motion, expression, and timing state.",
    correction:
      "Correct the named performance input while leaving creative motion and external-take selection with the author.",
    recheck: "Execute the performance and compile the affected shot again.",
  },
  pipeline: {
    path: "README.md#canonical-command-routes",
    invariant:
      "The deterministic source-to-film pipeline must complete before its result can be accepted.",
    correction:
      "Inspect the nested pipeline failure and repair its owning tracked source or design input.",
    recheck: "Run the same pipeline and compile scope again.",
  },
  preview: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Preview may render only a valid, current, registered target under the host capture contract.",
    correction:
      "Correct or compile the target named by the occurrence before asking the host to capture it.",
    recheck: "Repeat the same preview or capture request.",
  },
  production: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Every operation must remain bound to one registered production namespace and its current addressable state.",
    correction:
      "Use the occurrence target and message to select or register the intended production explicitly.",
    recheck: "Reopen the named production and retry the same operation.",
  },
  registration: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Source registration must bind the declared production, shot, and export identities exactly once.",
    correction:
      "Correct the explicit registration named by the occurrence without guessing an alternate production or shot.",
    recheck: "Load the source and compile its registered target again.",
  },
  render: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Rendered delivery must be complete, current, byte-verified, media-verified, and owned by its exact production input.",
    correction:
      "Repair or regenerate the exact rendition or receipt named by the occurrence; never accept a path or label as proof.",
    recheck: "Render again if required, then run the same final verification.",
  },
  repaint: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Optional repaint may consume only current reviewed source pixels, declared controls, references, provider facts, and immutable receipts.",
    correction:
      "Resolve the exact eligibility, host, evidence, or receipt failure named by the occurrence without choosing a provider or candidate automatically.",
    recheck:
      "Repeat the same repaint request after its declared prerequisites are current.",
  },
  review: {
    path: "README.md#canonical-command-routes",
    invariant:
      "A reviewed target must hold the evidence its own contract declares, captured at the target's current identity.",
    correction:
      "Capture the declared frames the occurrence names, then state what they showed in the evidence citation on the source that realizes the target; nothing decides the verdict on the reviewer's behalf.",
    recheck: "Compile the same scope again and confirm the occurrence is gone.",
  },
  screenplay: {
    path: "README.md#canonical-command-routes",
    invariant:
      "The screenplay ladder must preserve unique identities, ordered coverage, evidence ownership, locks, and explicit omissions from intent to scene.",
    correction:
      "Correct the named screenplay document or relation while preserving author ownership of story content.",
    recheck:
      "Run screenplay lint and compile every affected scene relation again.",
  },
  source: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Tracked source must export its registered contract and produce deterministic validated output within its declared ownership boundary. Node executes authored source without a runtime sandbox.",
    correction:
      "Correct the exact module, export, capability or registration named by the occurrence; authors remain responsible for deterministic source execution.",
    recheck: "Run source lint and the same compile scope again.",
  },
  stage: {
    path: "README.md#canonical-command-routes",
    invariant:
      "Authored stage state must remain valid, bounded, and consumable by the deterministic pipeline.",
    correction:
      "Correct the exact authored stage fact named by the occurrence without substituting inferred scene content.",
    recheck: "Execute stage construction and compile the affected shot again.",
  },
};

/** Code-specific guidance takes precedence over its family contract. */
const CODE_CONTRACTS: Readonly<
  Partial<Record<AutoMovieDiagnosticCode, IDiagnosticFamilyContract>>
> = {
  "repaint-claim-refused": {
    path: "README.md#canonical-command-routes",
    invariant:
      "One immutable repaint request prefix dispatches to the provider at most once at a time: an unsettled or unknown-outcome claim closes that prefix until its owner settles, and a moved journal or claim generation is replanned rather than dispatched.",
    correction:
      "Read the refusal's cause. Wait for an active owner to settle; after an unknown provider outcome reconcile the provider side and author a new request identity instead of retrying this one; after a moved prefix rerun the same repaint so it plans against the current journal.",
    recheck:
      "Run the repaint again and confirm the request either dispatches or names a different, current cause.",
  },
  "source-scene-coverage-incomplete": {
    path: "README.md#canonical-command-routes",
    invariant:
      "Authored scene content must cover what it claims to cover: a declared region owes its membrane, its fall and a drain the fall reaches, and a declared opening owes a run that uses it.",
    correction:
      "Cover the region or use the opening the occurrence names, or withdraw the claim; a warning here states a gap to decide about rather than a value to fix.",
    recheck:
      "Compile the same shot again and read the named record's findings.",
  },
  "source-scene-physics-invalid": {
    path: "README.md#canonical-command-routes",
    invariant:
      "Authored scene content must be physically possible in the space it is placed in: two bodies may not occupy one volume, and nothing may stand in the access a maintainable thing declares it needs.",
    correction:
      "Move one of the two bodies the occurrence names, or change the volume one of them claims; correcting a coordinate elsewhere in the record does not resolve a conflict between these two.",
    recheck:
      "Compile the same shot again and confirm the named pair no longer shares a volume.",
  },
  "review-outcome-artifact-malformed": {
    path: "README.md#canonical-command-routes",
    invariant:
      "A current builder-owned acceptance artifact must remain readable, digest-matched UTF-8 JSON before review can derive an outcome from it.",
    correction:
      "Remove only the damaged builder-owned publication named by the occurrence, then compile the same current inputs again; do not edit an acceptance outcome by hand.",
    recheck:
      "Prepare the same review again and confirm the named artifact reads under its current manifest digest.",
  },
  "review-outcome-artifact-missing": {
    path: "README.md#canonical-command-routes",
    invariant:
      "Every manifest-owned acceptance artifact required by a current compile must be resident before review derives an outcome.",
    correction:
      "Compile the same current inputs to restore the missing builder-owned publication named by the occurrence.",
    recheck:
      "Prepare the same review again and confirm the named artifact is resident under the current generated manifest.",
  },
  "review-outcome-contract-mismatch": {
    path: "README.md#canonical-command-routes",
    invariant:
      "The builder writer and review reader shipped in one revision must agree on the exact schema and identity of every acceptance artifact.",
    correction:
      "Report the artifact path and validator paths as an internal builder-reader contract defect; do not change author-owned source or repeat an unchanged compile as a purported fix.",
    recheck:
      "After the product contract is corrected, compile and prepare the same review again against one unchanged input revision.",
  },
};

/**
 * Construct a frozen entry and reference from the maintained code population.
 * Typed family coverage and code overrides supply descriptive guidance; this helper has no runtime admission check for mutated or foreign code strings.
 * Slicing and reference construction cost work linear in code length and allocate the entry and reference retained by the catalog.
 */
const createCatalogEntry: (code: AutoMovieDiagnosticCode) => Readonly<IAutoMovieDiagnosticCatalogEntry> = (
  code: AutoMovieDiagnosticCode,
): Readonly<IAutoMovieDiagnosticCatalogEntry> => {
  const family: AutoMovieDiagnosticFamily = code.slice(0, code.indexOf("-")) as AutoMovieDiagnosticFamily;
  const contract: IDiagnosticFamilyContract = CODE_CONTRACTS[code] ?? FAMILY_CONTRACTS[family];
  return Object.freeze({
    code,
    reference: Object.freeze({
      catalogRevision: CATALOG_REVISION,
      id: `automovie-diagnostic/${code}`,
      path: contract.path,
    }),
    invariant: contract.invariant,
    correction: contract.correction,
    recheck: contract.recheck,
  });
};

/** Observe the ordered population once; later registry mutations do not rebuild these entries. */
const DIAGNOSTIC_CATALOG: readonly Readonly<IAutoMovieDiagnosticCatalogEntry>[] = Object.freeze(
  AUTOMOVIE_DIAGNOSTIC_CODES.map(createCatalogEntry),
);

/** Index the same entries once and retain this private Map for the module lifetime. */
const DIAGNOSTIC_CATALOG_BY_CODE: Map<AutoMovieDiagnosticCode, Readonly<IAutoMovieDiagnosticCatalogEntry>> = new Map(
  DIAGNOSTIC_CATALOG.map((entry: Readonly<IAutoMovieDiagnosticCatalogEntry>): readonly [AutoMovieDiagnosticCode, Readonly<IAutoMovieDiagnosticCatalogEntry>] => [entry.code, entry] as const),
);

/**
 * Own the frozen catalog and private index shared by the public list/find bindings.
 *
 * Initialization maps the maintained codes in declaration order, selects code overrides before exhaustive typed family guidance, and indexes those exact entries.
 *
 * One owner keeps construction and indexing together; public modules alias its functions without another cache or invocation wrapper.
 *
 * The revision and overrides are catalog contracts, not fixture exceptions. Lookup changes no source, replaces no foreign method and executes no returned recovery guidance.
 *
 * Callers receive frozen entries and references, the same ordered list, or null for an unknown code. The typed registry remains mutable at runtime and is observed only during initialization.
 *
 * For C codes with total text length L, initialization traverses C twice and retains O(C + L) catalog/index data. List is constant work; find uses Map lookup with string-key processing, without a worst-case constant-time claim.
 *
 * All requests share the entries from that module initialization. There is no invalidation after registry changes or cross-module-instance identity guarantee.
 *
 * The module retains catalog, index and guidance until its instance is released. Population follows the initialized codes; no file handle, timer or running task is acquired.
 */
export const AutoMovieDiagnosticCatalogOwner: Readonly<{
  /** Return the same frozen ordered catalog without applying its guidance. */
  listAutoMovieDiagnosticCatalog: () => readonly Readonly<IAutoMovieDiagnosticCatalogEntry>[];

  /** Return the indexed entry identity, or null for an unknown code. */
  findAutoMovieDiagnosticCatalogEntry: (code: string) => Readonly<IAutoMovieDiagnosticCatalogEntry> | null;
}> = Object.freeze({
  /**
   * List the complete immutable diagnostic catalog in canonical code order.
   *
   * The lookup is descriptive and read-only. It neither edits production source
   * nor applies the returned correction.
   */
  listAutoMovieDiagnosticCatalog:
    (): readonly Readonly<IAutoMovieDiagnosticCatalogEntry>[] =>
      DIAGNOSTIC_CATALOG,

  /**
   * Resolve one diagnostic code without changing project or catalog state.
   */
  findAutoMovieDiagnosticCatalogEntry: (
    code: string,
  ): Readonly<IAutoMovieDiagnosticCatalogEntry> | null =>
    DIAGNOSTIC_CATALOG_BY_CODE.get(code as AutoMovieDiagnosticCode) ?? null,
});
