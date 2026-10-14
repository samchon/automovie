import { IAutoMovieDesignMutationOutput, IAutoMovieDesignTarget, IAutoMovieModelRecipe, IAutoMovieProductionDesign, IAutoMovieProductionDesignInventory, IAutoMovieWorldDesign } from "@automovie/interface";
import { IAutoMovieProductionDesignGraph } from "./validateProductionDesign";
import { AutoMovieProductionProjectCapability1 } from "./AutoMovieProductionProjectCapability1";
import { productionProjectInventory } from "./productionProjectInventory";
import { productionProjectGraph } from "./productionProjectGraph";
import { productionProjectDesign } from "./productionProjectDesign";
import { productionProjectSetProductionDesign } from "./productionProjectSetProductionDesign";
import { productionProjectSetModelRecipe } from "./productionProjectSetModelRecipe";
import { productionProjectSetWorldDesign } from "./productionProjectSetWorldDesign";

/**
 * Preserve the public project method group 2 as direct internal operation adapters.
 *
 * @evidence contracts/common.md#principled-implementation Each method passes the same instance state and original arguments/defaults to its file-named operation, preserving supported return/refusal effects without binding callbacks or changing authored schemas.
 * @evidence contracts/common.md#clear-and-simple-design This inheritance layer groups a bounded number of adapters to keep one exported identity per file and source below 500 lines; implementation remains in operation owners rather than duplicated methods.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No method selects a fixture-specific implementation or lazy cached closure; original prototype placement and JavaScript mutation of readonly/private state are outside the supported facade-call contract.
 * @evidence contracts/common.md#meaningful-documentation Individual methods carry their actual operation's effects, currentness premises, costs and lifetime limits, while this internal class adds only the public forwarding shape.
 * @evidence contracts/performance.md#efficient-algorithms Each invocation adds one constant-size direct call to the complete operation cost documented on that method; inheritance depth affects method lookup but adds no scan of designs, frames or payload bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work All adapters borrow one state retained by the first base constructor; their operation's currentness checks decide when resident observations may be reused, with no cross-instance result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One facade retains one state through the first base's readonly field; subsequent bases add no per-instance handles, buffers, closure tables or tasks, and operation owners release resources they acquire.
 */
export class AutoMovieProductionProjectCapability2 extends AutoMovieProductionProjectCapability1 {
    /**
     * List admitted design addresses and optional production/world presence.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectInventory with the instance's state. Reads the guarded typed graph and projects its map keys without changing ordering; inventory identifies authored records rather than proving graph completeness or renderability.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Graph acquisition owns filesystem/schema admission while this operation creates the compact address-only view used by project consumers.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not synthesize missing designs or infer their presence from generated files; graph read refusals propagate.
     * @evidence contracts/common.md#meaningful-documentation Presence booleans represent non-null admitted production/world records and arrays preserve the graph's current model/formation/shot/acceptance iteration order.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes full graph acquisition and an O(N) key copy for N admitted keyed designs; filesystem parsing dominates rather than the final projection alone.
     * @evidence contracts/performance.md#reuse-equivalent-work Uses one graph for all six result fields, while later inventory calls reread designs because a revision number alone does not freeze their resident bytes.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Local graph values become unreachable on return and only key arrays transfer to the caller; delegated readers close handles and no graph cache is added.
     */
    public inventory(): IAutoMovieProductionDesignInventory {
        return productionProjectInventory(this.state_);
    }
    /**
     * Acquire the current typed design graph after refreshing its production fence.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectGraph with the instance's state. Checks root, incarnation and revision before loading owned production, shared and keyed design records; each resident record must pass its schema admission.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Coordinates refresh and graph loading without a second graph model or cache, preserving the original public graph read sequence.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Sequential file reads are not claimed to be an atomic snapshot; no graph or production is substituted after a read/schema refusal.
     * @evidence contracts/common.md#meaningful-documentation A typed graph records admitted resident designs and optional absence, while separate graph validation decides cross-record semantic validity.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes refresh plus directory enumeration, ordered keyed-design reads and JSON schema validation proportional to resident record bytes and keyed populations.
     * @evidence contracts/performance.md#reuse-equivalent-work Returns one loaded graph for the caller to reuse; independent calls reacquire records and do not equate same ids or revision with frozen bytes.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Graph maps and parsed records transfer to the caller; readers close their file handles and this coordinator retains no additional graph or task.
     */
    public graph(): IAutoMovieProductionDesignGraph {
        return productionProjectGraph(this.state_);
    }
    /**
     * Select one optional artifact from a freshly admitted complete design graph.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectDesign with the instance's state. The closed target-kind union selects production/world fields or a keyed model/formation/shot/acceptance lookup after graph refresh and schema-admitted resident loading; an absent supported artifact returns null.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Target projection consumes the existing graph owner so design APIs share complete schema and namespace admission instead of inventing a separate single-record reader.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts No requested target bypasses malformed unrelated graph residents; the closed kind premise is required and an unknown runtime kind has no fallback artifact.
     * @evidence contracts/common.md#meaningful-documentation States complete fresh graph acquisition, supported target optionality and unknown-valued return; resident/schema errors propagate and this projection does not judge cross-record semantic validity or freeze later state.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Dominant work is full graph refresh and all resident JSON/directory reads, including each keyed population's existing quadratic case scan; the final fixed branch/map lookup does not turn acquisition into a constant-time single-artifact read.
     * @evidence contracts/performance.md#reuse-equivalent-work One loaded graph supplies the requested projection within this call; independent requests reacquire the graph and no previous target or revision result is cached as byte equivalence.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Full graph records/maps are temporary until the selected record transfers to the caller; guarded readers own cleanup and this selector retains no graph, descriptor, byte inventory or task.
     */
    public design(target: IAutoMovieDesignTarget): unknown {
        return productionProjectDesign(this.state_, target);
    }
    /**
     * Set the active production's design, refusing a different production ID.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectSetProductionDesign with the instance's state. Exact ID equality precedes schema/setter processing; a mismatch reports current graph consequences under the active namespace.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This address guard delegates admitted same-ID changes to the common setter and exact production schema validator.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts A foreign design ID never registers or switches the handle's active production.
     * @evidence contracts/common.md#meaningful-documentation Mismatch returns a structured refusal and diagnostic path; same-ID success/failure keeps the common setter's mutation effects.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Mismatch still reads the complete graph, generated manifest and screenplay and computes consequences; the admitted branch includes schema validation and the full setter transaction.
     * @evidence contracts/performance.md#reuse-equivalent-work One mismatch graph is used for its report; no cross-call design result is retained.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. The caller owns returned diagnostics/consequences; delegated readers and setter own descriptors, locks and staged bytes.
     */
    public setProductionDesign(design: IAutoMovieProductionDesign): IAutoMovieDesignMutationOutput {
        return productionProjectSetProductionDesign(this.state_, design);
    }
    /**
     * Upsert one shared model recipe through the existing schema, graph and revision admission path.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectSetModelRecipe with the instance's state. The supplied object's ID is projected before exact model schema validation, then setDesign loads current graph/generated/screenplay context, refuses schema/case/target semantic errors and commits the shared model path under its revision/shared-mutation fence.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This model-specific entry chooses target and schema only; setDesign owns consequences, downstream warnings, content fingerprint and atomic mutation without another recipe store.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid IDs retain the existing diagnostic placeholder and are not repaired into admitted recipes; newly invalid downstream artifacts become explicit warnings and still block compilation instead of preventing every staged author edit.
     * @evidence contracts/common.md#meaningful-documentation States project-shared recipe ownership, accepted/refused mutation output and delegated race/native errors; acceptance updates one recipe without compiling source or certifying all dependent artifacts.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes exact recipe traversal, full graph load with keyed case scans, before/after graph validation and model-dependency consequence walks, copied/sorted model map, generated/screenplay observations and commit serialization/hash/staging; recipe size alone does not bound the operation.
     * @evidence contracts/performance.md#reuse-equivalent-work One supplied schema result and loaded graph feed mutation admission, while prior diagnostic identities distinguish new downstream failures; unchanged IDs do not permit sharing effectful commits or skipping resident observations.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Input recipe remains borrowed; old/new graph and copied model maps, consequence/diagnostic populations and staged prior/new bytes coexist locally, with no fixed population cap. Reader/transaction owners release descriptors and locks, and only mutation output escapes.
     */
    public setModelRecipe(design: IAutoMovieModelRecipe): IAutoMovieDesignMutationOutput {
        return productionProjectSetModelRecipe(this.state_, design);
    }
    /**
     * Upsert the project-shared world design through current graph admission and the existing shared mutation transaction.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectSetWorldDesign with the instance's state. Exact world schema validation supplies setDesign's admission result; current graph/generated/screenplay observations and target semantic checks precede world replacement, while the shared transaction guards the originally observed revision.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This entry owns world target/schema selection and delegates cross-record consequences, warning policy, fingerprint and atomic storage to setDesign instead of introducing a second world publication path.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Schema and target errors yield refusal without a world write; dependent newly invalid artifacts remain explicit warnings for staged authoring, and neither default geometry nor an expected project world is substituted.
     * @evidence contracts/common.md#meaningful-documentation Defines shared world ownership and mutation accepted/refused output; acceptance updates the authored record rather than rendering a world or proving all downstream compilation prerequisites.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes world schema traversal, complete graph/keyed-file load, before/after semantic graph checks, shot/review/sequence consequences and generated/screenplay reads, then world serialization/hash and transaction staging; shallow graph replacement does not eliminate full population work.
     * @evidence contracts/performance.md#reuse-equivalent-work The supplied schema result, one resident graph and previous diagnostic Set serve admission and downstream comparison; independent writes retain fresh revision/namespace observations rather than reusing earlier world success.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. The input world is borrowed and old/new shallow graph shells share unchanged maps; graph records, consequences, diagnostics and staged world/prior bytes scale with actual populations without a fixed cap. Delegated readers/transaction own cleanup and mutation output transfers to the caller.
     */
    public setWorldDesign(design: IAutoMovieWorldDesign): IAutoMovieDesignMutationOutput {
        return productionProjectSetWorldDesign(this.state_, design);
    }
}
