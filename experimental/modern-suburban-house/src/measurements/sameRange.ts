import { Range } from "./Range";
import { same } from "./same";


/** Whether a measured range exists and agrees with `b` at both ends. */
export const sameRange = (a: Range | undefined, b: Range): boolean => a !== undefined && same(a[0], b[0]) && same(a[1], b[1]);
