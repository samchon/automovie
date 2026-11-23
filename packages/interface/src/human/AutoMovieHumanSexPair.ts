/**
 * Female then male reference statistics in the order used by Human's surveys.
 * The pair cannot be replaced in place; the statistic's own type determines
 * whether its contents are mutable. Units and population belong to the table.
 */
export type AutoMovieHumanSexPair<T> = readonly [female: T, male: T];
