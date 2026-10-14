import type { IAutoMovieFingerprintField } from "./IAutoMovieFingerprintField";
import { fingerprintAutoMovieFields } from "./fingerprintAutoMovieFields";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { AUTOMOVIE_BUILD_FINGERPRINT_PROTOCOL } from "./contentIdentity";
import { AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL, AUTOMOVIE_PRODUCTION_BUILD_VERSION } from "./productionBuildProtocol";
import { productionBuildDesignFingerprintFields as designFingerprintFields } from "./productionBuildDesignFingerprintFields";

/**
 * Hash the ordered protocol, namespace, design, source and content field stream.
 *
 * Protocol/build version precedes namespace and the design projection, followed by source and content fields in supplied order. Digest equality binds this selected projection; it does not independently prove complete dependency selection or gate success.
 *
 * @evidence contracts/common.md#principled-implementation The shared length-framed SHA-256 encoder prevents component-boundary ambiguity, and canonical design bytes bind structured values. Timed compilation and currentness supply the same field policy; stable map/field order and payload bytes during encoding are caller premises.
 * @evidence contracts/common.md#clear-and-simple-design This composer owns dependency categories and ordering, while design serialization and binary framing/hash remain canonical shared owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Namespace and protocol are explicit contract fields, not fixture salts. No source/content field is omitted based on a consumer name, and checkout independence depends on the supplied portable fields rather than being inferred from a digest.
 * @evidence contracts/common.md#meaningful-documentation States category order, protocol/namespace separation, caller stability and the distinction between identity and successful admission.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes all design canonical traversal/key sorting plus hashing every label/payload byte; composing the stream copies field references and allocates protocol/namespace bytes. Nested design size and source/content byte totals dominate, without a cap here.
 * @evidence contracts/performance.md#reuse-equivalent-work Already prepared source/content payloads are passed to the encoder by reference; currentness recomputes the same projection rather than reusing a prior mutable input hash as proof.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary field arrays and canonical buffers are call-local, borrowed payloads remain caller-owned, and only a digest survives. The synchronous hash owner finalizes before return; no file/task is acquired.
 */
export function productionBuildInputFingerprint(
  productionId: string,
  graph: ReturnType<AutoMovieProductionProject["graph"]>,
  sourceFields: readonly IAutoMovieFingerprintField[],
  contentFields: readonly IAutoMovieFingerprintField[]
): string { return fingerprintAutoMovieFields([
    {
      role: "protocol",
      kind: "compile-input",
      payload: Buffer.from(
        `${AUTOMOVIE_BUILD_FINGERPRINT_PROTOCOL}\0${AUTOMOVIE_PRODUCTION_BUILD_PROTOCOL}\0${AUTOMOVIE_PRODUCTION_BUILD_VERSION}`,
        "utf8",
      ),
    },
    {
      role: "production",
      kind: "namespace",
      payload: Buffer.from(productionId, "utf8"),
    },
    ...designFingerprintFields(graph),
    ...sourceFields,
    ...contentFields,
  ]); }
