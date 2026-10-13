import { IAutoMovieActionCall } from "@automovie/interface";

/** One validated `attachTo` job: the coupling and its source action index. */
export interface IAttachJob {
  /** Validated attachment action to compile. */
  action: IAutoMovieActionCall & { verb: "attachTo" };
  /** Stable source index used for paths and ordering. */
  index: number;
}
