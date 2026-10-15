import { IPoint } from "./IPoint";

/** Direction-independent key of an edge, its endpoints rounded to a micrometre. */
export const edgeKey = (a: IPoint, b: IPoint): string => {
  const key = (p: IPoint): string => [p.x, p.y, p.z].map((n) => Math.round(n * 1e6)).join(
    ","
  );
  return [key(a), key(b)].sort((x, y) => x.localeCompare(y)).join("|");
};
