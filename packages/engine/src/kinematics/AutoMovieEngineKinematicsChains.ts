import type {
  IAutoMovieCurlChainUntilContact,
  IAutoMovieTwoBoneArticulation,
  IAutoMovieTwoBoneChainArticulation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { curlChainUntilContact as curlChainUntilContactImplementation } from "./internal/curlChainUntilContact";
import { twoBoneChainArticulation as twoBoneChainArticulationImplementation } from "./internal/twoBoneChainArticulation";

/** Contact-driven chain closure and two-bone articulation. */
export namespace AutoMovieEngineKinematicsChains {
  /** Fixed source geometry ready to answer repeated target queries. */
  export interface ITwoBonePrepared {
    /** Prepare one target point against this fixed chain. */
    target(point: IAutoMovieVector3): ITwoBonePreparedTarget | null;
  }

  /** One target point ready for bend-normal articulation. */
  export interface ITwoBonePreparedTarget {
    /** Solve this target using the requested bend normal. */
    solve(bendNormal?: IAutoMovieVector3): IAutoMovieTwoBoneArticulation;
  }

  /** Close a posed chain proximal first until each phalanx meets a collider. */
  export function curlChainUntilContact(
    input: IAutoMovieCurlChainUntilContact.IInput,
  ): IAutoMovieCurlChainUntilContact.IResult {
    return curlChainUntilContactImplementation.run(input);
  }

  /** Estimate how much chain resolution tolerance moves a digit tip. */
  export function curlChainContactResolution(
    reach: number,
    lever: number,
  ): number {
    return curlChainUntilContactImplementation.resolution(reach, lever);
  }

  /** Solve a resolved two-bone chain toward a target point. */
  export function twoBoneChainArticulation(
    props: IAutoMovieTwoBoneChainArticulation.IProps,
  ): IAutoMovieTwoBoneArticulation | null {
    return twoBoneChainArticulationImplementation.run(props);
  }

  /** Prepare the fixed source geometry for repeated target queries. */
  export function prepareTwoBoneChainArticulation(
    props: Pick<
      IAutoMovieTwoBoneChainArticulation.IProps,
      "upper" | "lower" | "end"
    >,
  ): ITwoBonePrepared | null {
    return twoBoneChainArticulationImplementation.prepare(props);
  }
}
