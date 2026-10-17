import { AutoMovieCurveParentContext } from "./AutoMovieCurveParentContext";
import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";
import type { IAutoMovieCurveAssembly64 as A } from "./IAutoMovieCurveAssembly64";

/**
 * Construct caller-defined regions after their incoming boundary operators are published, retaining each concrete factory result. A thrown factory/publication failure aborts without returning a partial assembly; callback side effects remain the caller's responsibility.
 *
 * @param props Parent-first local frames, directed boundary edges and unique region factories.
 * @returns Completed context, concrete regional results and genuine published operator tokens.
 *
 * @evidence contracts/common.md#principled-implementation An iterative dependency scan calls a factory only after every declared incoming token exists, binds actual immutable values, and publishes every declared outgoing boundary once.
 * @evidence contracts/common.md#clear-and-simple-design One context plus pending/result/operator maps owns routing; anatomical key meanings and curve generation remain in callbacks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing endpoints, duplicate region factories, missing/repeated publications and an iteration without progress are rejected rather than filled with placeholder boundaries.
 * @evidence contracts/common.md#meaningful-documentation States construct-once ordering, concrete result ownership and failure/side-effect limits.
 * @evidence contracts/performance.md#efficient-algorithms For R regions and E edges, repeated full edge scans cost O(R²E) in the worst case, plus context, factory and coefficient-validation costs; map storage is O(R+E) besides generated fields.
 * @evidence contracts/performance.md#reuse-equivalent-work Each factory result and operator is reused by later dependents within this invocation; no graph result is cached across invocations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Pending entries are removed after success; completed maps/context transfer to the caller. On failure local maps become collectible, while externally retained callback effects are outside this function.
 */
export function generateAutoMovieCurveAssembly64<T extends A.Result>(props: {
  /** Parent-relative rigid frames, with every parent appearing before its child. */
  frames: readonly C.Frame[];

  /** Directed named boundaries whose owner and consumer must each have a factory. */
  edges: readonly C.Edge[];

  /** Region callbacks retaining their concrete generated result type. */
  factories: readonly A.Factory<T>[];
}): A.Output<T> {
  const context: AutoMovieCurveParentContext = new AutoMovieCurveParentContext(
    props.frames,
    props.edges,
  );
  const pending: Map<string, A.Factory<T>> = new Map();
  const regions: Map<string, T> = new Map();
  const operators: Map<string, C.Operator> = new Map();
  for (const factory of props.factories) {
    if (!factory.region || pending.has(factory.region))
      throw new Error("Unique regional factories required");
    pending.set(factory.region, factory);
  }
  for (const edge of props.edges)
    if (!pending.has(edge.ownerRegion) || !pending.has(edge.consumerRegion))
      throw new Error("Every declared edge needs both actual factories");
  while (pending.size !== 0) {
    let progressed: boolean = false;
    for (const [name, factory] of pending) {
      const incoming: readonly C.Edge[] = props.edges.filter(
        (edge: C.Edge): boolean => edge.consumerRegion === name,
      );
      if (!incoming.every((edge: C.Edge): boolean => operators.has(edge.id)))
        continue;
      const upstream: Map<string, C.Boundary> = new Map();
      for (const edge of incoming)
        upstream.set(
          edge.id,
          context.bind(name, edge.consumerBone, operators.get(edge.id)!),
        );
      const generated: T = factory.construct(context, upstream);
      const outgoing: readonly C.Edge[] = props.edges.filter(
        (edge: C.Edge): boolean => edge.ownerRegion === name,
      );
      if (generated.boundaries.length !== outgoing.length)
        throw new Error(
          "A regional factory must publish every owned boundary exactly once",
        );
      for (const boundary of generated.boundaries) {
        const operator: C.Operator = context.publish(
          name,
          boundary.bone,
          boundary.value,
        );
        operators.set(boundary.value.id, operator);
      }
      regions.set(name, generated);
      pending.delete(name);
      progressed = true;
    }
    if (!progressed)
      throw new Error("Cyclic or unresolved regional owner dependencies");
  }
  return { context, regions, operators };
}
