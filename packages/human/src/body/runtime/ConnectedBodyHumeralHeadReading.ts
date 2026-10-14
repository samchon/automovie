import type { IAutoMovieHumanBodyHumeralHead } from "../anatomy/shoulder/IAutoMovieHumanBodyHumeralHead";
import type { IConnectedBodyHumeralHeadMeasurement } from "./IConnectedBodyHumeralHeadMeasurement";
import type { IConnectedBodyUnobservedHeadSource } from "./IConnectedBodyUnobservedHeadSource";

/**
 * One humeral head measurement with its radius source and any original tomographic observation.
 *
 * @evidence contracts/common.md#principled-implementation Common head measurement values intersect the actual observed-source/observation pair or the closed unobserved-source alternative, preserving radius provenance in the worker reply.
 * @evidence contracts/common.md#clear-and-simple-design The transport type reuses head-source and measurement owners rather than duplicating their radius/centre schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unobserved radius cannot acquire tomographic provenance, and a reported geometric head does not establish clinical registration or whole-bone resolution.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes source-qualified observation from a common numerical head reading; composed field units remain with the referenced measurement type.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Head reply typing performs no radius fitting, mesh evaluation or worker packing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The source union implements no cache of head measurements or acquisitions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type itself owns no source image, geometry buffer or worker request lifetime.
 *
 * @author Samchon
 */
export type ConnectedBodyHumeralHeadReading =
  IConnectedBodyHumeralHeadMeasurement &
    (
      | Pick<
          Exclude<
            IAutoMovieHumanBodyHumeralHead,
            IConnectedBodyUnobservedHeadSource
          >,
          "source" | "observation"
        >
      | IConnectedBodyUnobservedHeadSource
    );
