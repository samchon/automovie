import { HumanDebugViewPartsCache } from "./HumanDebugViewPartsCache";

/**
 * The page's one latest production source definition, shared by reference and
 * prejoin-piece consumers. This is the comparison loader's existing cache,
 * moved here so both consumers borrow the same actual part/loft records.
 *
 * Alias, complete finite plain input value and the loaded module graph retain
 * the existing equivalence boundary. A miss replaces the sole retained result;
 * a source exception clears it and propagates. Consumers leave source records
 * unchanged. The instance ends with its page and owns no GPU resources.
 */
export const HUMAN_DEBUG_VIEW_PARTS: HumanDebugViewPartsCache =
  new HumanDebugViewPartsCache();
