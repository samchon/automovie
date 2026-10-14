import type { IAutoMovieProductionServices } from "./IAutoMovieProductionServices";
import type { AutoMovieProductionContext } from "./AutoMovieProductionContext";
import { AutoMovieProductionSubjectInspection } from "./AutoMovieProductionSubjectInspection";
import { IAutoMovieInspectSubject } from "./IAutoMovieInspectSubject";
import { subjectInspectionInspect } from "./subjectInspectionInspect";

/**
 * Retain the public optional-host inspection service over the existing plan and journal protocol.
 *
 * @evidence contracts/common.md#principled-implementation Session namespace resolution precedes the extracted current-compile subject sweep, whose exact plan/context/byte checks determine per-view admission.
 * @evidence contracts/common.md#clear-and-simple-design The class owns adapter binding and context dispatch, while the helper owns plan/capture/history sequencing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No maintained product host/caller currently instantiates this service; unavailable adapters refuse and no new inspection route is supplied by this split.
 * @evidence contracts/common.md#meaningful-documentation serve resolves the context without the retired knowledge gate; inspect retains its Promise/error boundary through the async helper, with false delivery lane and no AsyncFunction-reflection guarantee.
 * @evidence contracts/performance.md#efficient-algorithms Context selection/opening plus all delegated status, shot, capture, PNG, repeated journal and coverage work remain part of the owning call.
 * @evidence contracts/performance.md#reuse-equivalent-work One retained adapter may coordinate its own host reuse, but core implements no cross-sweep page or picture cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter closure lives with the service; in-flight operations retain their data, stored histories have no eviction cap and external host disposal is not owned here.
 */
export class AutoMovieProductionSubjectInspectionService {
  /** Bind the optional host instrument this server was configured with. */
  public constructor(
    private readonly adapter?: AutoMovieProductionSubjectInspection,
  ) {}

  /**
   * Resolve the requested namespace through the session context, then run its subject inspection.
   *
   * @evidence contracts/common.md#principled-implementation Current context registration/selection admits the namespace before forwarding the same input to inspect.
   * @evidence contracts/common.md#clear-and-simple-design Namespace/cache responsibility stays with AutoMovieProductionContext rather than a second resolver here.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The retired knowledge gate is not invoked; selection errors reject this async method and unavailable adapters are handled by inspect.
   * @evidence contracts/common.md#meaningful-documentation Explicit/default/singleton production selection is delegated without changing the inspection request.
   * @evidence contracts/performance.md#efficient-algorithms Context registration/opening cost and the complete delegated sweep remain part of this operation.
   * @evidence contracts/performance.md#reuse-equivalent-work The context may share an admitted service bundle, while this class retains only its adapter rather than another namespace map.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The Promise retains context/input through dispatch; context service retention and host disposal belong to their owners.
   */
  public async serve(
    context: AutoMovieProductionContext,
    input: IAutoMovieInspectSubject.IProps,
  ): Promise<IAutoMovieInspectSubject> {
    return this.inspect(context.forProduction(input.productionId), input);
  }

  /**
   * Delegate one inspection without reading the optional adapter before async entry.
   *
   * @evidence contracts/common.md#principled-implementation The helper receives the original receiver and an unevaluated adapter reader; target/input and adapter first reads follow the original async order.
   * @evidence contracts/common.md#clear-and-simple-design The façade keeps private adapter ownership while extracted sweep/refusal helpers own protocol sequencing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No product route currently calls this method and no new host is created; undefined adapter produces the existing refusal.
   * @evidence contracts/common.md#meaningful-documentation Helper-Promise return preserves first-read rejection and later adapter lookup, while AsyncFunction reflection differs from the old method implementation.
   * @evidence contracts/performance.md#efficient-algorithms Fixed callback creation adds to delegated status, resolve, plan, capture, decode, journal and coverage costs.
   * @evidence contracts/performance.md#reuse-equivalent-work The live reader observes the same adapter field at each draw and Reflect.apply preserves its service receiver without reading an opaque callback's own call property.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The Promise retains its service and operation data; callback/page disposal and persistent artifacts remain externally owned.
   */
  public inspect(services: IAutoMovieProductionServices, input: IAutoMovieInspectSubject.IProps): Promise<IAutoMovieInspectSubject> {
    return subjectInspectionInspect(this, (): AutoMovieProductionSubjectInspection | undefined => this.adapter, services, input);
  }
}
