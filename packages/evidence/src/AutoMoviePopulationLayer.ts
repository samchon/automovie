/**
 * An authored film layer whose unit-file population can participate in a
 * vertical-slice authoring scope.
 *
 * Treatments remain flat because they own no delivery partition. Scripts
 * design that partition, and screenplays inherit it exactly.
 */
export type AutoMoviePopulationLayer = "screenplays" | "scripts" | "treatments";
