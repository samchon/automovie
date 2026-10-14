import { AutoMovieDiagnosticCode, IAutoMovieAssetProvenance, IAutoMovieGeneratedMeasurementProxy } from "@automovie/interface";
import { type IAutoMovieProductionContentInput } from "../IAutoMovieProductionContentInput";
import { readExternalProxyAsset } from "./readExternalProxyAsset";
import { positiveFiniteValues } from "./positiveFiniteValues";

/**
 * Resolve an explicit measurement envelope for population radius selection, without measuring the visible mesh.
 *
 * @evidence contracts/common.md#principled-implementation Inline or authorized digest-matched JSON decisions require exact finite-positive box dimensions or humanoid height/shoulder/hip widths; productionProjectionRadii owns their half-diagonal use.
 * @evidence contracts/common.md#clear-and-simple-design Measurement stays distinct from collision semantics and uses the same byte-backed proxy resolver rather than another input ledger.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive scalar admission proves neither root centering nor humanoid depth or mesh agreement; it supplies a declared estimate rather than guaranteed visible-mesh containment.
 * @evidence contracts/common.md#meaningful-documentation Documents box/humanoid parameter decisions, population reader, envelope limitations and null diagnostic failure.
 * @evidence contracts/performance.md#efficient-algorithms Asset-backed resolution includes linear byte hash/JSON/schema work plus ledger search; fixed supported dimension keys add bounded scalar checks.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares resolution rules rather than cached answers; every referenced byte population is observed under its current digest/use authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned scalar envelope facts remain with the caller's binding; temporary parse data and borrowed inputs own no file, task or GPU resource.
 *
 * @author Samchon
 */
export function resolveExternalMeasurementProxy(props: {
  owner: string;
  reference: NonNullable<
    IAutoMovieAssetProvenance["model"]
  >["measurementProxy"];
  records: readonly IAutoMovieAssetProvenance[];
  content: ReadonlyMap<string, IAutoMovieProductionContentInput>;
  productionId: string;
  diagnostic: (
    code: AutoMovieDiagnosticCode,
    target: string,
    message: string,
  ) => void;
}): IAutoMovieGeneratedMeasurementProxy | null {
  const proxy: { recipe: "box-v1"; parameters: { width: number; height: number; depth: number; }; } | { recipe: "humanoid-landmarks-v1"; parameters: { height: number; shoulderWidth: number; hipWidth: number; }; } | null =
    props.reference.kind === "generated"
      ? props.reference
      : readExternalProxyAsset(
          {
            owner: props.owner,
            reference: props.reference,
            records: props.records,
            content: props.content,
            productionId: props.productionId,
          },
          "measurement",
        );
  if (
    proxy === null ||
    (proxy.recipe === "box-v1"
      ? positiveFiniteValues(proxy.parameters, ["width", "height", "depth"]) ===
        false
      : positiveFiniteValues(proxy.parameters, [
          "height",
          "shoulderWidth",
          "hipWidth",
        ]) === false)
  ) {
    props.diagnostic(
      "asset-model-proxy-dangling",
      props.owner,
      `Model asset "${props.owner}" has no byte-grounded measurement proxy with the exact positive parameters required by box-v1 or humanoid-landmarks-v1. Correct the explicit proxy decision; mesh inference is not a fallback.`,
    );
    return null;
  }
  return proxy;
}
