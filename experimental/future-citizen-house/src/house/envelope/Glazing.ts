
export type Glazing = {
  id: string;
  room: string;
  a: number;
  b: number;
  sill: number;
  head: number;
  privacy?: "lower" | "all";
  breaks?: number[];
};
