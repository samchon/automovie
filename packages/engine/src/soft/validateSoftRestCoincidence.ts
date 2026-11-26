import {
  IAutoMovieSoftBodyDomain,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

/** Report a structural rest edge whose squared displacement vanishes. */
export function validateSoftRestCoincidence(
  out: IAutoMovieViolationCollector,
  root: string,
  domain: IAutoMovieSoftBodyDomain,
  a: number,
  b: number,
): void {
  const dx: number = domain.rest[b * 3] - domain.rest[a * 3];
  const dy: number = domain.rest[b * 3 + 1] - domain.rest[a * 3 + 1];
  const dz: number = domain.rest[b * 3 + 2] - domain.rest[a * 3 + 2];
  if (dx * dx + dy * dy + dz * dz !== 0) return;
  out.push(
    "type",
    `${root}.rest[${a * 3}]`,
    `rest particles ${a} and ${b} are coincident, so the constraint between them has no direction`,
    [a, b],
  );
}
