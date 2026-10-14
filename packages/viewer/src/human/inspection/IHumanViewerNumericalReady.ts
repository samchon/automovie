import type { IHumanViewerNodeAuthority } from "./IHumanViewerNodeAuthority.js";

/**
 * Checked Node realm readiness; it carries no model or admission verdict.
 *
 * @evidence contracts/common.md#principled-implementation Announces actual checked Node loader/source authority and viewer wire protocol after the maintained numerical entry initializes.
 * @evidence contracts/common.md#clear-and-simple-design Keeps realm readiness separate from session opening, document admission and numerical result envelopes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ready carries no model or verdict; host/current browser compatibility must still match actual revision and input witnesses.
 * @evidence contracts/common.md#meaningful-documentation Documents the ready discriminator, existing protocol and independently observed Node authority rather than a browser transform stamp.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The envelope performs no checks; startup authority reading hashes inputs and consumers validate protocol/source boundaries.
 * @evidence contracts/performance.md#reuse-equivalent-work Concurrent endpoint requests share one admitted readiness promise; changed source cannot reuse its earlier ready receipt.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The page/session retains authority until replacement/retirement, with witness size uncapped here and actual process lifetime owned by the server.
 *
 * @author Samchon
 */
export interface IHumanViewerNumericalReady {
  /**
   * Checked-realm readiness message discriminant; it supplies no model or document verdict.
   */
  type: "ready";

  /**
   * Existing viewer protocol, retained across the numerical transport change.
   */
  protocol: string;

  /**
   * Actual source and compiler authority supplied by the running Node realm.
   */
  authority: IHumanViewerNodeAuthority;
}
