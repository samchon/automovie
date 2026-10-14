import { IAutoMovieProductionRepaintSelectionInput } from "./IAutoMovieProductionRepaintSelectionInput";
import { IAutoMovieProductionRepaintServiceView } from "./IAutoMovieProductionRepaintServiceView";
import { productionRepaintServiceDiagnostic } from "./productionRepaintServiceDiagnostic";
import { productionRepaintServiceRepaint } from "./productionRepaintServiceRepaint";
import { productionRepaintServiceSafeRepaintDiagnosticMessage } from "./productionRepaintServiceSafeRepaintDiagnosticMessage";
import { productionRepaintServiceSafeRepaintInputText } from "./productionRepaintServiceSafeRepaintInputText";
import { productionRepaintServiceValidatedRepaintRequest } from "./productionRepaintServiceValidatedRepaintRequest";
import { productionRepaintServiceValidatedRepaintSelection } from "./productionRepaintServiceValidatedRepaintSelection";
import { AutoMovieDiagnosticCode, AutoMovieProductionShotRepaint, IAutoMovieProductionDesign, IAutoMovieProductionVisualDeliveryLane, IAutoMovieRepaintExecutionPolicy, IAutoMovieRepaintGeneratorAdoption, IAutoMovieRepaintReceipt, IAutoMovieRepaintRequestEvidence, IAutoMovieRepaintShot } from "@automovie/interface";
import { AutoMovieProductionContext } from "./AutoMovieProductionContext";
import { IAutoMovieProductionServices } from "./IAutoMovieProductionServices";

/**
 * Keeps optional adapter/generator/execution constructor fields and exposes serve, select and repaint orchestration over current project/oracle seams.
 *
 * @evidence contracts/common.md#principled-implementation Keeps optional adapter/generator/execution constructor fields and exposes serve, select and repaint orchestration over current project/oracle seams.
 * @evidence contracts/common.md#clear-and-simple-design The facade retains public methods/private ownfields; file-named stage helpers keep the original orchestration below 500 lines while compatibility imports expose only existing public names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation The instance retains its configured host references; call-local view/closures and byte snapshots live through the returned Promise, while project stores own durable claims/attempts/renditions.
 * @evidence contracts/performance.md#efficient-algorithms The repaint adapter forwards through a per-call view of the same private fields; new internal helpers preserve defaults, refusal ordering and provider receiver without adding runtime hosts.
 * @evidence contracts/performance.md#reuse-equivalent-work Keeps optional adapter/generator/execution constructor fields and exposes serve, select and repaint orchestration over current project/oracle seams. The repaint adapter forwards through a per-call view of the same private fields; new internal helpers preserve defaults, refusal ordering and provider receiver without adding runtime hosts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The instance retains its configured host references; call-local view/closures and byte snapshots live through the returned Promise, while project stores own durable claims/attempts/renditions.
 */
export class AutoMovieProductionRepaintService {
  /** Retains the original optional host/generator/execution references as private readonly parameter properties; absence is refused by repaint, not construction. */
  public constructor(
    private readonly adapter?: AutoMovieProductionShotRepaint,
    private readonly generator?: IAutoMovieRepaintGeneratorAdoption,
    private readonly execution?: {
      policy: IAutoMovieRepaintExecutionPolicy;
      evidence: IAutoMovieRepaintRequestEvidence;
      requestId?: string;
      signal?: AbortSignal;
      now?: () => Date;
    },
  ) {}

  /**
 * Safely derives refusal identities, admits a cloned exact request, checks the production namespace and context lookup, then requires repainted delivery for this shot before returning repaint's Promise.
 *
 * @evidence contracts/common.md#principled-implementation Safely derives refusal identities, admits a cloned exact request, checks the production namespace and context lookup, then requires repainted delivery for this shot before returning repaint's Promise.
 * @evidence contracts/common.md#clear-and-simple-design serve owns safe input/context/lane admission; repaint owns builder/source/provider orchestration, and this method performs no separate DIFFUSION_ENHANCE guide-read check.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The exact request schema and tracked repainted lane decide admission before delegation; malformed input and lookup failure remain explicit refusals rather than substituted generator output.
 * @evidence contracts/common.md#meaningful-documentation Lookup refusals become structured diagnostics; the clone remains call-local through the delegated Promise and the context owns service lifetimes.
 * @evidence contracts/performance.md#efficient-algorithms Request cloning and lane scanning scale with metadata/lane count; builder/source/provider work belongs to repaint, and serve performs no separate DIFFUSION_ENHANCE guide-read check.
 * @evidence contracts/performance.md#reuse-equivalent-work Safely derives refusal identities, admits a cloned exact request, checks the production namespace and context lookup, then requires repainted delivery for this shot before returning repaint's Promise. Request cloning and lane scanning scale with metadata/lane count; builder/source/provider work belongs to repaint, and serve performs no separate DIFFUSION_ENHANCE guide-read check.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Lookup refusals become structured diagnostics; the clone remains call-local through the delegated Promise and the context owns service lifetimes.
 */
public async serve(
    context: AutoMovieProductionContext,
    input: IAutoMovieRepaintShot.IProps,
  ): Promise<IAutoMovieRepaintShot> {
    const requestedProductionId: string = productionRepaintServiceSafeRepaintInputText(input, "productionId");
    const requestedShot: string = productionRepaintServiceSafeRepaintInputText(input, "shot");
    const refusal: (code: AutoMovieDiagnosticCode, message: string) => IAutoMovieRepaintShot = (
      code: AutoMovieDiagnosticCode,
      message: string,
    ): IAutoMovieRepaintShot => ({
      repainted: false,
      selected: false,
      requestId: null,
      productionId: requestedProductionId,
      shot: requestedShot,
      receipt: null,
      diagnostics: [productionRepaintServiceDiagnostic(code, requestedShot, message, "render")],
    });
    const request: IAutoMovieRepaintShot.IProps | null = productionRepaintServiceValidatedRepaintRequest(input);
    if (request === null)
      return refusal(
        "repaint-input-invalid",
        "Repaint input must match its exact public request schema before project lookup or provider execution; remove missing, mistyped, credential-bearing, or hidden fields.",
      );
    if (
      requestedProductionId.trim().length === 0 ||
      requestedProductionId.trim() !== requestedProductionId
    )
      return refusal(
        "repaint-production-invalid",
        "Repaint productionId must be a trimmed non-empty production namespace.",
      );
    let services: IAutoMovieProductionServices;
    try {
      services = context.forProduction(requestedProductionId);
    } catch (error) {
      return refusal(
        "repaint-production-unregistered",
        productionRepaintServiceSafeRepaintDiagnosticMessage(
          error,
          "Repaint production lookup failed without a safe diagnostic.",
        ),
      );
    }
    const delivery: IAutoMovieProductionDesign | null = services.project.graph().production;
    if (
      delivery === null ||
      delivery.visualDelivery === "deterministic" ||
      (delivery.visualDelivery === "mixed" &&
        delivery.visualDeliveryLanes?.some(
          (lane: IAutoMovieProductionVisualDeliveryLane): boolean => lane.shot === requestedShot && lane.lane === "repainted",
        ) !== true)
    )
      return refusal(
        "repaint-delivery-disabled",
        "The current production design does not assign this shot to a repainted delivery lane. Change the tracked lane contract, recompile current source, then read DIFFUSION_ENHANCE before requesting a rendition.",
      );
    return this.repaint(services, request);
  }

  /**
   * Admit an exact selection/reversal clone and persist the authored review using the configured clock.
   *
   * @evidence contracts/common.md#principled-implementation Validates/clones before context lookup, checks the production namespace, then calls the project selection boundary with one ISO clock observation; lookup/clock/commit throws become structured refusal.
   * @evidence contracts/common.md#clear-and-simple-design select owns input/context admission while the project owns candidate identity, currentness and transaction history; it never invokes a provider.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Selection and reversal use the authored exact schema and resident candidate; no generated review or fixture-specific rendition substitutes for those facts.
   * @evidence contracts/common.md#meaningful-documentation Describes nullable continuity review, clock/lookup/commit refusal and that only an existing reviewed candidate is selected.
   * @evidence contracts/performance.md#efficient-algorithms Validation/cloning scales with review metadata; project selection adds resident receipt/currentness and transaction work rather than a constant-time selection claim.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the admitted clone for the single project call; a candidate address cannot replace fresh project currentness or ownership checks.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Call-local review metadata and receipt transfer on return; the context owns services and project storage owns durable selection history without starting a provider task.
   */
  public select(
    context: AutoMovieProductionContext,
    input: IAutoMovieProductionRepaintSelectionInput,
  ): IAutoMovieRepaintShot {
    const requestedProductionId: string = productionRepaintServiceSafeRepaintInputText(input, "productionId");
    const requestedShot: string = productionRepaintServiceSafeRepaintInputText(input, "shot");
    const refusal: (code: AutoMovieDiagnosticCode, message: string) => IAutoMovieRepaintShot = (
      code: AutoMovieDiagnosticCode,
      message: string,
    ): IAutoMovieRepaintShot => ({
      repainted: false,
      selected: false,
      requestId: null,
      productionId: requestedProductionId,
      shot: requestedShot,
      receipt: null,
      diagnostics: [productionRepaintServiceDiagnostic(code, requestedShot, message, "render")],
    });
    const request: IAutoMovieProductionRepaintSelectionInput | null = productionRepaintServiceValidatedRepaintSelection(input);
    if (request === null)
      return refusal(
        "repaint-input-invalid",
        "Repaint selection input must match its exact public request schema before project lookup; remove missing, mistyped, or hidden fields.",
      );
    if (
      request.productionId.trim().length === 0 ||
      request.productionId.trim() !== request.productionId
    )
      return refusal(
        "repaint-production-invalid",
        "Repaint selection productionId must be a trimmed non-empty production namespace.",
      );
    let services: IAutoMovieProductionServices;
    try {
      services = context.forProduction(request.productionId);
    } catch (error) {
      return refusal(
        "repaint-production-unregistered",
        productionRepaintServiceSafeRepaintDiagnosticMessage(
          error,
          "Repaint production lookup failed without a safe diagnostic.",
        ),
      );
    }
    try {
      const receipt: IAutoMovieRepaintReceipt = services.project.selectRepaintCandidate({
        ...request,
        selectedAt: (this.execution?.now ?? ((): Date => new Date()))().toISOString(),
      });
      return {
        repainted: true,
        selected: true,
        requestId: receipt.requestId ?? null,
        productionId: request.productionId,
        shot: request.shot,
        receipt,
        diagnostics: [],
      };
    } catch (error) {
      return refusal(
        "repaint-commit-refused",
        productionRepaintServiceSafeRepaintDiagnosticMessage(
          error,
          "Repaint selection could not be committed safely.",
        ),
      );
    }
  }

  /**
 * Builds getter/invocation forwarding closures over this service's original private fields and returns the internal asynchronous operation's exact Promise without another await.
 *
 * @evidence contracts/common.md#principled-implementation Builds getter/invocation forwarding closures over this service's original private fields and returns the internal asynchronous operation's exact Promise without another await.
 * @evidence contracts/common.md#clear-and-simple-design The class owns private-field reads and provider receiver forwarding; the internal operation owns the original asynchronous orchestration without another facade await.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration preserves its original admission/refusal contract; the adapter adds one constant-size view and closure allocation; original provider calls retain the actual service receiver and private fields remain private lexical reads.
 * @evidence contracts/common.md#meaningful-documentation The view retains this service for the delegated call; AsyncFunction reflection and mutation of private readonly fields are outside the supported facade-call contract.
 * @evidence contracts/performance.md#efficient-algorithms The adapter adds one constant-size view and closure allocation; original provider calls retain the actual service receiver and private fields remain private lexical reads.
 * @evidence contracts/performance.md#reuse-equivalent-work Builds getter/invocation forwarding closures over this service's original private fields and returns the internal asynchronous operation's exact Promise without another await. The adapter adds one constant-size view and closure allocation; original provider calls retain the actual service receiver and private fields remain private lexical reads.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The view retains this service for the delegated call; AsyncFunction reflection and mutation of private readonly fields are outside the supported facade-call contract.
 */
public repaint(services: IAutoMovieProductionServices, input: IAutoMovieRepaintShot.IProps): Promise<IAutoMovieRepaintShot> {
  const service: AutoMovieProductionRepaintService = this;
  const view: IAutoMovieProductionRepaintServiceView = {
    get adapter(): AutoMovieProductionShotRepaint | undefined { return service.adapter; },
    get generator(): IAutoMovieRepaintGeneratorAdoption | undefined { return service.generator; },
    get execution(): IAutoMovieProductionRepaintServiceView["execution"] { return service.execution; },
    invokeAdapter: (request: Parameters<AutoMovieProductionShotRepaint>[0]): ReturnType<AutoMovieProductionShotRepaint> => service.adapter!(request),
  };
  return productionRepaintServiceRepaint(view, services, input);
}
}
