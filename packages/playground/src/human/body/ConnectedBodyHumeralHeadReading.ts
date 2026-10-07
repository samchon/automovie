import type { IAutoMovieHumanBodyHumeralHead } from "@automovie/human";

import type { IConnectedBodyHumeralHeadMeasurement } from "./IConnectedBodyHumeralHeadMeasurement";
import type { IConnectedBodyUnobservedHeadSource } from "./IConnectedBodyUnobservedHeadSource";

/**
 * One humeral head reading: its measurement and the source of its radius,
 * with the tomographic observation when the head was observed.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Pairs each displayed head measurement with the provenance of its radius.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Keeps an observed head's acquisition record with its reading and omits it otherwise.
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
