import type { IAutoMovieHumanBodyHumeralHead } from "../../index";

import type { IConnectedBodyHumeralHeadMeasurement } from "./IConnectedBodyHumeralHeadMeasurement";
import type { IConnectedBodyUnobservedHeadSource } from "./IConnectedBodyUnobservedHeadSource";

/**
 * One humeral head reading: its measurement and the source of its radius,
 * with the tomographic observation when the head was observed.
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
