import { AutoMovieDiagnosticCode, IAutoMovieAssetProvenance, IAutoMovieGeneratedCollisionProxy } from "@automovie/interface";
import { type IAutoMovieProductionContentInput } from "../IAutoMovieProductionContentInput";
import { readExternalProxyAsset } from "./readExternalProxyAsset";
import { positiveFiniteValues } from "./positiveFiniteValues";

/**
 * Resolve the declared inline or byte-grounded collision proxy and require its exact positive finite parameters.
 *
 * @evidence contracts/common.md#principled-implementation Generated decisions are read directly; asset decisions require authorized digest-matched JSON, then capsule radius/height or box width/height/depth pass exact-key finite-positive checks.
 * @evidence contracts/common.md#clear-and-simple-design One collision owner shares byte-asset resolution and scalar-key admission with measurement without deriving a proxy from appearance geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inline decisions are explicit provenance, not a measured mesh enclosure; malformed or absent proxies emit the original model-proxy diagnostic and return null.
 * @evidence contracts/common.md#meaningful-documentation States supported capsule/box parameters, units inherited from the proxy contract and null/error diagnostic behavior.
 * @evidence contracts/performance.md#efficient-algorithms Includes record search/hash/JSON/schema work for asset-backed decisions, then a fixed parameter-key scan; inline decisions pay only scalar checks.
 * @evidence contracts/performance.md#reuse-equivalent-work No proxy result is cached across inputs; shared resolver code supplies the same byte/use rules without reusing a stale parse observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned proxy facts remain with the inventory binding; temporary parsing retires with the call and borrowed bytes acquire no handle.
 *
 * @author Samchon
 */
export function resolveExternalCollisionProxy(props: {
  owner: string;
  reference: NonNullable<IAutoMovieAssetProvenance["model"]>["collisionProxy"];
  records: readonly IAutoMovieAssetProvenance[];
  content: ReadonlyMap<string, IAutoMovieProductionContentInput>;
  productionId: string;
  diagnostic: (
    code: AutoMovieDiagnosticCode,
    target: string,
    message: string,
  ) => void;
}): IAutoMovieGeneratedCollisionProxy | null {
  const proxy: { recipe: "capsule-v1"; parameters: { radius: number; height: number; }; } | { recipe: "box-v1"; parameters: { width: number; height: number; depth: number; }; } | null =
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
          "collision",
        );
  if (
    proxy === null ||
    (proxy.recipe === "capsule-v1"
      ? positiveFiniteValues(proxy.parameters, ["radius", "height"]) === false
      : positiveFiniteValues(proxy.parameters, ["width", "height", "depth"]) ===
        false)
  ) {
    props.diagnostic(
      "asset-model-proxy-dangling",
      props.owner,
      `Model asset "${props.owner}" has no byte-grounded collision proxy with the exact positive parameters required by capsule-v1 or box-v1. Correct the explicit proxy decision; mesh inference is not a fallback.`,
    );
    return null;
  }
  return proxy;
}
