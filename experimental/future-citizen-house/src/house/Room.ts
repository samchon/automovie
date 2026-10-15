import { Rect } from "./Rect";

export type Room = {
  id: string;
  level: 0 | 1;
  cells: readonly Rect[];
  finish: string;
};
