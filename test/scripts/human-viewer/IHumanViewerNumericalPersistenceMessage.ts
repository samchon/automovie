/** Optional admitted-preview persistence remains independent of construction. @author Samchon */
export interface IHumanViewerNumericalPersistenceMessage {
  type: "persistence";
  key: string;
  state: "stored" | "cancelled" | "failed";
  cacheEncodeMs?: number;
  cacheWriteMs?: number;
  error?: string;
}
