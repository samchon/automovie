import { STAIR_OPENING } from "./STAIR_OPENING";
import { STAIR_RUN } from "./STAIR_RUN";

/** World x where upper-flight tread `n` starts. */
export const upperTreadStart = (n: number) => STAIR_OPENING.turnX + STAIR_RUN * (n - 1);
