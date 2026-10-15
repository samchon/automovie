import { Box } from "./Box";
import { sameRange } from "./sameRange";
import { Window } from "./Window";
import { Range } from "./Range";

/** Each window-backed strip uses its host span, authored bottom, head margin, and inward depth. */

export const verifyCurtainStrip = (
  id: string,
  actual: Box | undefined,
  window: Window,
  bottom: number,
  axis: "x" | "z",
  innerFace: number,
  inward: -1 | 1
): void => {
  const span: Range = [window.from - 0.1, window.to + 0.1];
  const depth: Range = inward === 1
    ? [innerFace, innerFace + 0.12]
    : [innerFace - 0.12, innerFace];
  if (actual === undefined ||
    !sameRange(actual[axis], span) ||
    !sameRange(actual[axis === "x" ? "z" : "x"], depth) ||
    !sameRange(actual.y, [bottom, window.top + 0.12]))
    throw new Error(
      `${id}: curtain strip differs from its window void or floor`
    );
};
