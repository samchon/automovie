import type { IBodyCorrectiveState } from "./IBodyCorrectiveState";

/** Exact posed input retained by a source crossing finding. */
export interface IBodyCrossingDocument {
  shape: Record<string, number>;
  pose: IBodyCorrectiveState["pose"];
  shoulders?: IBodyCorrectiveState["shoulders"];
}
