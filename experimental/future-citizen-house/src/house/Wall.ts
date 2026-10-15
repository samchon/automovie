export type Wall = {
  id: string;
  axis: "x" | "z";
  plane: number;
  a: number;
  b: number;
  level: 0 | 1;
  adjacent: string[];
};
