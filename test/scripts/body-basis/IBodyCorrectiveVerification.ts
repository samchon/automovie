import type { IBodyContactPair } from "./readBodyContacts";

/** A refused sample is neither an empty measurement nor an omitted experiment. */
export type IBodyCorrectiveVerification =
  | { kind: "measured"; pairs: IBodyContactPair[] }
  | { kind: "refused"; reason: string }
  | { kind: "not-sampled" };
