import { IAutoMovieAcceptanceScenario, IAutoMovieDesignMutationOutput, IAutoMovieDesignTarget, IAutoMovieFormationDesign, IAutoMovieShotContract } from "@automovie/interface";
import { AutoMovieProductionProjectCapability2 } from "./AutoMovieProductionProjectCapability2";
import { productionProjectSetFormationDesign } from "./productionProjectSetFormationDesign";
import { productionProjectSetShotContract } from "./productionProjectSetShotContract";
import { productionProjectSetAcceptanceScenario } from "./productionProjectSetAcceptanceScenario";
import { productionProjectEraseDesignArtifact } from "./productionProjectEraseDesignArtifact";
import { productionProjectEraseProduction } from "./productionProjectEraseProduction";
import { productionProjectReadSource } from "./productionProjectReadSource";

/**
 * Preserve the public project method group 3 as direct internal operation adapters.
 *
 * @evidence contracts/common.md#principled-implementation Each method passes the same instance state and original arguments/defaults to its file-named operation, preserving supported return/refusal effects without binding callbacks or changing authored schemas.
 * @evidence contracts/common.md#clear-and-simple-design This inheritance layer groups a bounded number of adapters to keep one exported identity per file and source below 500 lines; implementation remains in operation owners rather than duplicated methods.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No method selects a fixture-specific implementation or lazy cached closure; original prototype placement and JavaScript mutation of readonly/private state are outside the supported facade-call contract.
 * @evidence contracts/common.md#meaningful-documentation Individual methods carry their actual operation's effects, currentness premises, costs and lifetime limits, while this internal class adds only the public forwarding shape.
 * @evidence contracts/performance.md#efficient-algorithms Each invocation adds one constant-size direct call to the complete operation cost documented on that method; inheritance depth affects method lookup but adds no scan of designs, frames or payload bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work All adapters borrow one state retained by the first base constructor; their operation's currentness checks decide when resident observations may be reused, with no cross-instance result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One facade retains one state through the first base's readonly field; subsequent bases add no per-instance handles, buffers, closure tables or tasks, and operation owners release resources they acquire.
 */
export class AutoMovieProductionProjectCapability3 extends AutoMovieProductionProjectCapability2 {
    /**
     * Upsert one shared formation while preserving formation-wide semantic refusal and staged dependent consequences.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectSetFormationDesign with the instance's state. ID projection precedes exact formation schema validation; setDesign checks portable case collision and validates the replacement graph, treating both this target and formations-wide diagnostics as refusal before shared revision-guarded storage.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Formation target/schema selection stays here and setDesign owns copied sorted membership, dependency consequences, downstream warnings and publication authority without another formation cache.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts No requested count/layout is repaired to pass admission; target or formations-wide errors refuse, while newly invalid dependent artifacts are disclosed as warnings for subsequent author correction.
     * @evidence contracts/common.md#meaningful-documentation Defines project-shared formation mutation and the aggregate formations refusal scope, accepted/refused result and propagated transaction failures; it does not materialize instances or complete dependent source compilation.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes formation schema traversal, all graph/keyed records and before/after semantic checks, affected participant/shot/sequence scans, copied/sorted formation map and generated/screenplay observations, plus serialized mutation hash/staging and current guards.
     * @evidence contracts/performance.md#reuse-equivalent-work The one schema result and resident graph supply replacement/admission, with previous diagnostic identity reused for downstream comparison; complete current population checks remain separate from prior formation-ID equality.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Borrowed formation and old/new graph shells coexist with copied formation-map entries and consequence/diagnostic populations; staged old/new record bytes remain transaction-local with no fixed population bound, and reader/lock cleanup stays with the owners.
     */
    public setFormationDesign(design: IAutoMovieFormationDesign): IAutoMovieDesignMutationOutput {
        return productionProjectSetFormationDesign(this.state_, design);
    }
    /**
     * Upsert one selected-production shot contract without executing its bound source module.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectSetShotContract with the instance's state. ID projection precedes exact shot schema validation, then setDesign admits portable membership and target graph semantics against current resident designs; accepted replacement uses the selected shot path and original revision fence.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This shot entry supplies only target/schema, leaving source execution with build owners and mutation consequences, warnings, fingerprint and atomic storage with setDesign.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid shot metadata or target semantic errors refuse without coercion; newly invalid dependent acceptance/source/review state is reported for staged correction rather than silently compiled or repaired.
     * @evidence contracts/common.md#meaningful-documentation Defines production-local shot ownership, structured mutation acceptance/refusal and propagated resident/transaction errors; acceptance stores a contract but does not certify its module or rendered pixels.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes exact shot traversal, full graph load/keyed case scans, before/after graph admission and affected acceptance/source/sequence consequences, copied/sorted shot map and generated/screenplay reads, then serialization/hash and staged old/new bytes.
     * @evidence contracts/performance.md#reuse-equivalent-work One schema result, resident graph and prior diagnostic identities feed the attempted mutation; source module cache or an unchanged shot ID does not replace fresh resident/revision admission.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Input contract is borrowed while old/new graph shells and copied shot-map entries, diagnostic/consequence arrays and staged record bytes remain local with no fixed cap; owners release reader descriptors and transaction locks and only mutation output transfers.
     */
    public setShotContract(design: IAutoMovieShotContract): IAutoMovieDesignMutationOutput {
        return productionProjectSetShotContract(this.state_, design);
    }
    /**
     * Upsert one selected-production acceptance scenario through schema and target semantic admission.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectSetAcceptanceScenario with the instance's state. ID projection and exact acceptance schema precede setDesign's portable collision and target graph checks; prior/replacement consequences include criterion-addressed shots, then accepted metadata commits under the originally observed revision.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. This entry owns acceptance target/schema selection; mutation accounting and byte publication stay with setDesign, while actual criterion measurement remains with acceptance/build review consumers.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts A stored criterion is not a passing measurement and schema/target errors refuse without weakened expectations; dependent new errors become explicit staged-authoring warnings rather than hidden validation success.
     * @evidence contracts/common.md#meaningful-documentation States production-local scenario ownership, accepted/refused mutation output and delegated native/race errors; acceptance stores authored criteria and does not observe a render or execute an acceptance test.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes exact criterion traversal, full graph/keyed reads and before/after semantic checks, criterion shot/review/sequence consequences, copied/sorted acceptance map and generated/screenplay observations, then serialized record hash and transaction staging.
     * @evidence contracts/performance.md#reuse-equivalent-work One input schema result and current graph serve admission and consequences, with the previous diagnostic Set distinguishing newly invalid dependents; past scenario IDs or measurement results are not reused as mutation authority.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. The borrowed scenario, old/new graph shells, copied acceptance entries and criterion/consequence/diagnostic populations remain attempt-local without a fixed cap; staged current/prior bytes and lock/descriptor cleanup belong to transaction/read owners, while mutation output escapes.
     */
    public setAcceptanceScenario(design: IAutoMovieAcceptanceScenario): IAutoMovieDesignMutationOutput {
        return productionProjectSetAcceptanceScenario(this.state_, design);
    }
    /**
     * Erase an unreferenced design and publish its audit record under revision fencing.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectEraseDesignArtifact with the instance's state. Nonblank reason, current graph presence and direct reference refusal precede deletion/audit staging; expected revision comes from the handle and shared families request shared coordination.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Graph/reference/consequence readers prepare the decision, while commitFiles owns ordered publication and rollback.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing or referenced targets return structured refusal without design writes; consequence lists are predictions and do not schedule all generated or render removal here.
     * @evidence contracts/common.md#meaningful-documentation Accepted output has a null design fingerprint; reference refusal carries the current canonical fingerprint, and the trimmed reason is stored only in the audit.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes full graph/manifest/screenplay reads, consequence traversal/sorting, direct reference scans, canonical hashing and the two-file transaction with byte/ancestry checks.
     * @evidence contracts/performance.md#reuse-equivalent-work One graph and consequence report are reused during the attempt; resident revision and namespace guards are reacquired at commit.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Parsed graph/report data are local or returned; the transaction owns locks, staged bytes and atomic temporaries, with incomplete rollback reported by its owner.
     */
    public eraseDesignArtifact(target: IAutoMovieDesignTarget, reason: string = "direct project API erase"): IAutoMovieDesignMutationOutput {
        return productionProjectEraseDesignArtifact(this.state_, target, reason);
    }
    /**
     * Retire the active production registry entry and remove its owned namespaces.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectEraseProduction with the instance's state. Writable/root/reason admission precedes the root lease and production lock; namespace entries move into an identity-fenced quarantine, audit publishes, then registry publication marks the handle deleted.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Moved-entry records and an explicit registry commit flag separate reversible retirement from committed cleanup.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Replacement namespaces refuse stale rollback or cleanup; post-registry failure never restores the retired registration, and committed cleanup can still throw.
     * @evidence contracts/common.md#meaningful-documentation Returns erased ID and remaining registrations on completion; precommit rollback errors aggregate causes, while finally releases ownership even after a failed acknowledgement.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Registry parsing/filtering, ancestry checks, a fixed three namespace moves and audit/registry writes precede recursive quarantine removal whose cost follows all retired entries.
     * @evidence contracts/performance.md#reuse-equivalent-work Captured entry identities are rechecked through retirement/recovery; effectful moves and deletes are not shared by matching path names.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. The namespace lease releases in nested finally; lock release avoids unlinking a replacement state root. Committed quarantine cleanup may fail and leave recovery bytes, while uncommitted empty quarantine cleanup is best effort.
     */
    public eraseProduction(reason: string): {
        erased: boolean;
        productionId: string;
        remaining: string[];
    } {
        return productionProjectEraseProduction(this.state_, reason);
    }
    /**
     * Read a configured TypeScript source module through its resolved physical in-project address.
     *
     * @evidence contracts/common.md#principled-implementation Delegates to productionProjectReadSource with the instance's state. Lexical source resolution and supported suffix admission precede exists/realpath observations; configured-root membership is checked again for the real target before the owned reader admits its physical ancestry, regular file and descriptor identity.
     * @evidence contracts/common.md#clear-and-simple-design The operation owns implementation behind this public forwarding signature. Source addressing owns path/suffix policy and the shared owned-file reader owns bytes; this read does not execute a module or assign builder ownership to authored source.
     * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing and outside-root sources refuse with typed source errors; realpath can admit an alias whose resolved target remains inside configured roots, so the original lexical spelling is not claimed to be link-free.
     * @evidence contracts/common.md#meaningful-documentation Defines source-module bytes, configured lexical and physical containment, alias semantics and native/read refusal; a successful byte read does not validate module exports or establish continuing source currentness.
     * @evidence contracts/performance.md#efficient-algorithms One direct adapter call adds constant overhead to the delegated operation. Includes project-root identity, up to two S-source-root membership passes with native path observations, then B-byte reading and ancestry/descriptor rechecks; no source-directory inventory or module evaluation occurs here.
     * @evidence contracts/performance.md#reuse-equivalent-work The resolved physical address feeds the one guarded byte read, while root membership and bytes are reobserved per call; prior path success or module-cache residency cannot replace those observations.
     * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains only its instance state between calls. Path and ancestry/stat data is local; the owned reader attempts primary/recheck descriptor cleanup and surfaces failure, then bytes transfer to the caller without a retained source buffer, loader or task.
     */
    public readSource(relativePath: string): Uint8Array {
        return productionProjectReadSource(this.state_, relativePath);
    }
}
