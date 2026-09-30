/**
 * One or more named targets or observations, with no empty part input.
 *
 * A group is optional when nothing is specified, but `{}` must not claim that
 * its bone or muscle was specified. This mapped union requires at least one
 * property of a closed component interface while preserving the other
 * properties as optional. It does not substitute for runtime admission of
 * finite values, physical ranges, acquisition methods or consistent posture.
 */
export type AutoMovieHumanBodyNonemptyMeasurements<T> = {
  [Key in keyof T]-?: Readonly<Required<Pick<T, Key>> & Partial<Omit<T, Key>>>;
}[keyof T];
