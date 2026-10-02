/** What the reference resolver may ask of the local reference folder. */
export interface IHumanViewerReferenceIo {
  /** File names in `references` (`""`) or `references/body` (`"body"`), empty when absent. */
  list(folder: "" | "body"): string[];

  /** A parsed JSON resource, or undefined when it is absent. */
  readJson(name: "poses" | "landmarks" | "manifest"): unknown;
}
