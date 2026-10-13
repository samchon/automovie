import { rejects } from "./rejects";
import { humanoidChanged } from "./humanoidChanged";
import type { ExternalModelMatrixPath } from "./ExternalModelMatrixPath";
import { humanoidResolver } from "./humanoidResolver";

/**
 * Register one-field skin accessor shape/count/normalization negative twins.
 *
 * Its owning matrix entry executes or asserts the resulting public inspector behavior without source-shape checks.
 * Constants and expected refusals follow glTF 2.0 storage/profile rules rather than sampling implementation output.
 * It preserves the original boundary case and neighboring valid controls through the matrix fact list.
 * This portable test support is called by test_ingest_external_model_validation_matrix, with resident bytes and no process, browser or GPU.
 */
export const humanoidShapeFailures: () => [string, () => boolean][] = (): [string, () => boolean][] =>
  [
    ["jointShape", ["accessors", 1, "type"], "VEC3"],
    ["jointComponent", ["accessors", 1, "componentType"], 5120],
    ["weightShape", ["accessors", 2, "type"], "VEC3"],
    ["weightComponent", ["accessors", 2, "componentType"], 5120],
    ["weightU8MustNormalize", ["accessors", 2, "normalized"], false],
    ["jointCount", ["accessors", 1, "count"], 2],
    ["weightCount", ["accessors", 2, "count"], 2],
  ].map(([name, path, value]: unknown[]) : [string, () => boolean] => [
    `humanoid${name}`,
    () : boolean =>
      rejects(
        humanoidChanged(path as ExternalModelMatrixPath, value),
        "count-matched JOINTS_0 and normalized WEIGHTS_0",
        "gltf-humanoid-v1",
        humanoidResolver,
      ),
  ]);
