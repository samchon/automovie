/** A partition shared by two rooms on one storey, derived from facing clear cells. */
export type Wall = {
  /** Wall frame identity. */
  id: string;
  /** World axis the wall's plane is perpendicular to. */
  axis: "x" | "z";
  /** Coordinate of the wall's centre plane on `axis`. */
  plane: number;
  /** Start of the shared run along the other horizontal axis. */
  a: number;
  /** End of the shared run along the other horizontal axis. */
  b: number;
  /** Storey index of the wall. */
  level: 0 | 1;
  /** The two room identities the wall separates. */
  adjacent: string[];
};
