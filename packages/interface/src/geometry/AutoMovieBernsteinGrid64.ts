import type { AutoMovieBernsteinPolynomial64 } from "./AutoMovieBernsteinPolynomial64";

/**
 * Tensor Bernstein coefficients arranged by outer longitudinal row and inner
 * cross-course control ordinal.
 *
 * Supply a nonempty rectangular grid of dense control rows with a common inner
 * degree. Differentiating the outer parameter preserves the entire inner
 * coefficient run.
 */
export type AutoMovieBernsteinGrid64 = AutoMovieBernsteinPolynomial64[];
