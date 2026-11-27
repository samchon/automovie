import { coverFace } from "../daily/internal/coverFace";
import { wipeTears } from "../daily/internal/wipeTears";
import { tipHat } from "../dressing/internal/tipHat";
import { curtsy } from "./internal/curtsy";
import { headTilt } from "./internal/headTilt";
import { swipeTouchscreen } from "./internal/swipeTouchscreen";

/**
 * Installable action laws for everyday gestures. Use the keys to extend an
 * authoring chain, and register the same laws when planning its performance.
 *
 * ```ts
 * const Chain = HumanChain.extend(HUMAN_EVERYDAY_LAWS);
 * const composition = Chain.subject("guest").stand().curtsy().node;
 * new HumanPerformance({
 *   seed,
 *   performers,
 *   composition,
 *   laws: Object.values(HUMAN_EVERYDAY_LAWS),
 * });
 * ```
 */
export const HUMAN_EVERYDAY_LAWS = {
  coverFace,
  curtsy,
  headTilt,
  swipeTouchscreen,
  tipHat,
  wipeTears,
} as const;
