/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */
import type { IAutoMovieDrivenDriver } from "@automovie/interface";
import type { IAutoMovieLegacyRange } from "./IAutoMovieLegacyRange";

/**
 * A driven driver whose tuple-valued `inRange`/`outRange` cross the v1
 * boundary as named {@link IAutoMovieLegacyRange} objects (the LLM JSON schema
 * cannot express tuples), converted to the engine's pairs in `convert.ts`.
 * @author Samchon
 */
export interface IAutoMovieLegacyDrivenDriver extends Omit<
  IAutoMovieDrivenDriver,
  "inRange" | "outRange"
> {
  /**
   * Source value range mapped onto {@link outRange}. Omit when `curve` is set.
   */
  inRange?: IAutoMovieLegacyRange;

  /**
   * Output value range. Omit when `curve` is set.
   */
  outRange?: IAutoMovieLegacyRange;
}
