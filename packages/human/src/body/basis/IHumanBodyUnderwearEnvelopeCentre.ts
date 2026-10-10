/** One qualified exterior ball centre and its exact resident identity. */
export interface IHumanBodyUnderwearEnvelopeCentre {
  /** Original insertion ordinal, retained through spatial partitioning. */
  id: number;

  /** Exact lower XYZ point bounds in posed skin metres. */
  low: number[];

  /** Exact upper XYZ point bounds in the same posed skin frame. */
  high: number[];

  /** Actual qualified centre position, without a later snap or displacement. */
  centre: number[];
}
