import type {
  IAutoMovieCurveAssembly64,
  IAutoMovieCurveBoundary64,
  IAutoMovieCurveBoundaryEdge64,
  IAutoMovieCurveBoundaryPublication64,
  IAutoMovieCurveParentContext,
  IAutoMovieGenerateCurveAssembly64,
} from "@automovie/interface";

import { AutoMovieCurveParentContext } from "./AutoMovieCurveParentContext";

/**
 * Construct caller-defined regions after their incoming boundary operators are
 * published, retaining each concrete factory result. A thrown
 * factory/publication failure aborts without returning a partial assembly;
 * callback side effects remain the caller's responsibility.
 *
 * @param props Parent-first local frames, directed boundary edges and unique
 *   region factories.
 * @returns Completed context, concrete regional results and genuine published
 *   operator tokens.
 */
export function generateAutoMovieCurveAssembly64<
  T extends IAutoMovieCurveAssembly64.Result,
>(
  props: IAutoMovieGenerateCurveAssembly64.IProps<T>,
): IAutoMovieCurveAssembly64.Output<T> {
  const context: IAutoMovieCurveParentContext = new AutoMovieCurveParentContext(
    props.frames,
    props.edges,
  );
  const pending: Map<string, IAutoMovieCurveAssembly64.Factory<T>> = new Map();
  const regions: Map<string, T> = new Map();
  const operators: Map<string, IAutoMovieCurveBoundaryPublication64> =
    new Map();
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
      const incoming: readonly IAutoMovieCurveBoundaryEdge64[] =
        props.edges.filter(
          (edge: IAutoMovieCurveBoundaryEdge64): boolean =>
            edge.consumerRegion === name,
        );
      if (
        !incoming.every((edge: IAutoMovieCurveBoundaryEdge64): boolean =>
          operators.has(edge.id),
        )
      )
        continue;
      const upstream: Map<string, IAutoMovieCurveBoundary64> = new Map();
      for (const edge of incoming)
        upstream.set(
          edge.id,
          context.bind(name, edge.consumerBone, operators.get(edge.id)!),
        );
      const generated: T = factory.construct(context, upstream);
      const outgoing: readonly IAutoMovieCurveBoundaryEdge64[] =
        props.edges.filter(
          (edge: IAutoMovieCurveBoundaryEdge64): boolean =>
            edge.ownerRegion === name,
        );
      if (generated.boundaries.length !== outgoing.length)
        throw new Error(
          "A regional factory must publish every owned boundary exactly once",
        );
      for (const boundary of generated.boundaries) {
        const operator: IAutoMovieCurveBoundaryPublication64 = context.publish(
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
