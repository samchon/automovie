import { IAutoMovieAssetProvenance, IAutoMovieModelProxyAsset } from "@automovie/interface";
import path from "node:path";
import typia from "typia";
import { type IAutoMovieProductionContentInput } from "../IAutoMovieProductionContentInput";
import { digestAutoMovieBytes } from "../contentIdentity";
import { parseAutoMovieStructuredJson } from "../duplicateAwareJson";
import { hasActiveAssetUse } from "./hasActiveAssetUse";

/**
 * Read the selected collision or measurement field from a current authorized JSON proxy asset.
 *
 * @evidence contracts/common.md#principled-implementation Requires a .json reference, first matching ledger record, current bytes/digest and exact active model-proxy use before strict JSON and exact schema validation select the requested closed kind.
 * @evidence contracts/common.md#clear-and-simple-design One resolver owns byte identity, use admission and parse rules for both proxy families; dimension checks remain with their family owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing, malformed or schema-invalid bytes return null for the caller's contextual diagnostic. The selected non-null assertion follows actual undefined refusal and does not infer omitted proxy fields.
 * @evidence contracts/common.md#meaningful-documentation States closed-kind selection, first-record lookup and null refusal without a fallback proxy.
 * @evidence contracts/performance.md#efficient-algorithms Record search costs O(A), hashing/parsing/schema work scans B bytes and payload members; each call performs those full observations.
 * @evidence contracts/performance.md#reuse-equivalent-work No cross-reference or cross-build parse cache exists; equal filenames cannot replace current bytes and authorization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Selected proxy data transfers to its family caller; input bytes are borrowed and temporary parse/validation data retire without external handles.
 *
 * @author Samchon
 */
export function readExternalProxyAsset<Kind extends "collision" | "measurement">(
  props: {
    owner: string;
    reference: { kind: "asset"; asset: string };
    records: readonly IAutoMovieAssetProvenance[];
    content: ReadonlyMap<string, IAutoMovieProductionContentInput>;
    productionId: string;
  },
  kind: Kind,
): NonNullable<IAutoMovieModelProxyAsset[Kind]> | null {
  const record: IAutoMovieAssetProvenance | undefined = props.records.find(
    (candidate: IAutoMovieAssetProvenance) : boolean => candidate.path === props.reference.asset,
  );
  const input: IAutoMovieProductionContentInput | undefined = props.content.get(props.reference.asset);
  if (
    path.posix.extname(props.reference.asset).toLowerCase() !== ".json" ||
    record === undefined ||
    input?.bytes === null ||
    input === undefined ||
    record.digest !== digestAutoMovieBytes(input.bytes) ||
    hasActiveAssetUse(
      record,
      props.productionId,
      "model-proxy",
      props.owner,
    ) === false
  )
    return null;
  try {
    const validation: typia.IValidation<IAutoMovieModelProxyAsset> = typia.validateEquals<IAutoMovieModelProxyAsset>(
      parseAutoMovieStructuredJson({
        record: "model-proxy-asset",
        bytes: input.bytes,
      }),
    );
    if (validation.success === false) return null;
    const selected: IAutoMovieModelProxyAsset[Kind] = validation.data[kind];
    return selected === undefined
      ? null
      : (selected as NonNullable<IAutoMovieModelProxyAsset[Kind]>);
  } catch {
    return null;
  }
}
