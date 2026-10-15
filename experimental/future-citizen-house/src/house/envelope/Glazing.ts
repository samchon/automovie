
/** One curtainwall glazing run in a facade. */
export type Glazing = {
  /** Glazing identity; its members and panes derive their ids from it. */
  id: string;
  /** Room the glazing lights. */
  room: string;
  /** Start of the glazed run along the facade. */
  a: number;
  /** End of the glazed run along the facade. */
  b: number;
  /** World height of the glazing's bottom. */
  sill: number;
  /** World height of the glazing's top. */
  head: number;
  /**
   * Frosted glass in the lowest 1.25 m (`lower`) or over the whole height (`all`); omitted for
   * clear glass.
   */
  privacy?: "lower" | "all";
  /** Positions along the run where a vertical member must fall, such as a room edge. */
  breaks?: number[];
};
