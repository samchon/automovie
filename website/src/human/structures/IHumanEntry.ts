/** One of the site's bodies as the Human page lists it, from the bake's record. */
export interface IHumanEntry {
  /** Its id. */
  id: string;

  /** What the picker calls it, such as "Woman, 1.70 m". */
  label: string;

  /** Its measures by name: lengths and heights in metres, mass in kilograms. */
  measures: Record<string, number>;
}
