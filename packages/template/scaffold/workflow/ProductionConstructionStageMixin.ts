import type { ProductionStage } from "./ProductionStage";

/**
 * Pairs screenplay construction with its scripts approval selection.
 *
 * The first element is the stage. The boolean is useFinalScripts:
 * true requires scripts naturalness approval, false scripts construction.
 * A bare stage means true. Both read the current scripts body.
 */
export type ProductionConstructionStageMixin = [ProductionStage, boolean];
