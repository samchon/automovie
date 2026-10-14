import type { IAutoMovieProductionEvidence } from "@automovie/evidence";
import {
  AutoMovieProductionFrameCapture,
} from "@automovie/interface";

import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import type { IAutoMovieProductionContextOptions } from "./IAutoMovieProductionContextOptions";
import type { IAutoMovieProductionServices } from "./IAutoMovieProductionServices";
import {
  findAutoMovieProjectRoot,
  openAutoMovieProduction,
} from "./openAutoMovieProduction";
import type { AutoMovieModelArchetypeRegistry } from "./productionArchetypes";
import { resolveAutoMovieProductionContextOptions } from "./resolveAutoMovieProductionContextOptions";


/**
 * Session context: fixed root and current production services.
 *
 * Root and host dependencies are captured at construction. Services are
 * admitted lazily by exact registered namespace and shared for this context's
 * lifetime; retained gate execution still requires fresh input observations.
 *
 * @evidence contracts/common.md#principled-implementation Exact registered namespace selection disambiguates productions under one fixed root; named or supported positional dependencies resolve before service construction and project readers retain their own root-identity guards.
 * @evidence contracts/common.md#clear-and-simple-design The context owns root and dependency capture plus per-namespace service reuse, while project admission and the source-status closure own physical identity and gate freshness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No arbitrary first namespace is selected when registration is ambiguous, and a cached service does not replace current registration or source-input checks.
 * @evidence contracts/common.md#meaningful-documentation States fixed dependencies, lazy admission, namespace sharing, and fresh observation despite retained service handles.
 * @evidence contracts/performance.md#efficient-algorithms Construction resolves one root and copies a fixed dependency record. Each service request scans current registrations before a map lookup; first admission additionally opens and validates that project, whose own readers own their filesystem costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The exact production id keys one service bundle under immutable context root and dependency identities; source gate equivalence is independently proved by the bundle's fresh status callback.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The context holds one bundle for every namespace it has opened and host-owned dependencies until it is released. Registration churn has no fixed cache bound or eviction; bundles own no permanent file descriptor, and hosts retain disposal responsibility for supplied capture instruments.
 */
export class AutoMovieProductionContext {
  private readonly root: string;
  private readonly services: Map<string, IAutoMovieProductionServices> = new Map();
  private readonly capture: IAutoMovieProductionContextOptions["capture"];
  private readonly defaultProductionId: IAutoMovieProductionContextOptions["productionId"];
  private readonly archetypes: IAutoMovieProductionContextOptions["archetypes"];
  private readonly authoringEvidence: IAutoMovieProductionContextOptions["authoringEvidence"];
  private readonly currentAuthoringEvidence: IAutoMovieProductionContextOptions["currentAuthoringEvidence"];

  /**
   * Open one host-fixed production context.
   *
   * The compile identity a production publishes includes the graph-selected source
   * owner bindings of its authoring evidence, so a context that judges
   * generated freshness without the same declaration reads every compiled
   * production as stale. Hand it the declaration the compile read.
   */
  public constructor(options: IAutoMovieProductionContextOptions);
  /** @deprecated Pass one named IAutoMovieProductionContextOptions record. */
  public constructor(
    capture?: AutoMovieProductionFrameCapture,
    projectRoot?: string,
    productionId?: string,
    archetypes?: AutoMovieModelArchetypeRegistry,
    authoringEvidence?: IAutoMovieProductionEvidence,
    currentAuthoringEvidence?: () => IAutoMovieProductionEvidence,
  );
  public constructor(
    input?:
      | IAutoMovieProductionContextOptions
      | AutoMovieProductionFrameCapture,
    projectRoot?: string,
    productionId?: string,
    archetypes?: AutoMovieModelArchetypeRegistry,
    authoringEvidence?: IAutoMovieProductionEvidence,
    currentAuthoringEvidence?: () => IAutoMovieProductionEvidence,
  ) {
    const options: IAutoMovieProductionContextOptions = resolveAutoMovieProductionContextOptions({
      input,
      legacy: {
        projectRoot,
        productionId,
        archetypes,
        authoringEvidence,
        currentAuthoringEvidence,
      },
    });
    validateProductionId(options.productionId);
    this.root = findAutoMovieProjectRoot(options.projectRoot);
    this.capture = options.capture;
    this.defaultProductionId = options.productionId;
    this.archetypes = options.archetypes;
    this.authoringEvidence = options.authoringEvidence;
    this.currentAuthoringEvidence = options.currentAuthoringEvidence;
  }

  /**
   * Resolve one production under the immutable host root.
   *
   * An explicit or configured id must still be registered. Omitted selection
   * requires exactly one registration, and invalid input throws before opening
   * services. Successful repeated selection shares its original service bundle.
   *
   * @evidence contracts/common.md#principled-implementation Registration is reread before resolving explicit, configured or singleton selection; map reuse applies only after the exact id is currently admitted.
   * @evidence contracts/common.md#clear-and-simple-design This method owns namespace selection and bundle identity, then delegates actual project opening and status construction to openAutoMovieProduction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty, untrimmed, missing and ambiguous selections throw instead of choosing a fallback namespace; cache hits still pass the current registration check.
   * @evidence contracts/common.md#meaningful-documentation States selection precedence, singleton requirement, failure timing and repeated-call bundle identity.
   * @evidence contracts/performance.md#efficient-algorithms For R registered namespaces, registration reading and membership checks take O(R) work plus filesystem observation; a map lookup reuses an admitted bundle and only a new id incurs project-opening work.
   * @evidence contracts/performance.md#reuse-equivalent-work Immutable root and host dependencies plus exact id establish service identity; source results still use fresh snapshot equivalence rather than assuming the service's creation revision remains current.
   * @evidence contracts/performance.md#bound-retention-and-release-resources A successful first lookup adds one bundle to the context-lifetime map. Prior namespaces are retained without eviction, so registration churn has no fixed cache bound; readers close their per-operation handles.
   */
  public forProduction(productionId?: string): IAutoMovieProductionServices {
    validateProductionId(productionId);
    const registered: string[] = AutoMovieProductionProject.registeredProductionIds(
      this.root,
    );
    let selected: string | undefined = productionId ?? this.defaultProductionId;
    if (selected === undefined) {
      if (registered.length !== 1)
        throw new Error(
          registered.length === 0
            ? "The project has no registered production. Create and compile one through the project API before requesting evidence."
            : `The project has ${registered.length} registered productions. Configure one productionId from: ${registered.join(", ")}.`,
        );
      selected = registered[0]!;
    }
    if (registered.includes(selected) === false)
      throw new Error(
        `Production "${selected}" is not registered. Choose one current productionId from: ${registered.join(", ")}.`,
      );
    const retained: IAutoMovieProductionServices | undefined = this.services.get(selected);
    if (retained !== undefined) return retained;
    const opened: IAutoMovieProductionServices = openAutoMovieProduction({
      projectRoot: this.root,
      productionId: selected,
      capture: this.capture,
      archetypes: this.archetypes,
      authoringEvidence: this.authoringEvidence,
      currentAuthoringEvidence: this.currentAuthoringEvidence,
    });
    this.services.set(opened.project.productionId, opened);
    return opened;
  }
}

function validateProductionId(productionId: string | undefined): void {
  if (
    productionId !== undefined &&
    (productionId.trim().length === 0 || productionId.trim() !== productionId)
  )
    throw new Error(
      "Host productionId must be a trimmed non-empty production namespace.",
    );
}
