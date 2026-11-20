/** One category of the catalogue. */
export interface IMotionCategory {
  /** Its anchor on the catalogue page. */
  id: string;

  /** Its heading. */
  title: string;

  /** One sentence saying what it holds. */
  summary: string;

  /** Its families by the lexicon's name, in order, with each section's label; `actions` names the core vocabulary. */
  families: Readonly<Record<string, string>>;
}
