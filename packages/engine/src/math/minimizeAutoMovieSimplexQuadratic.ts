import type { IAutoMovieSimplexAtom } from "./IAutoMovieSimplexAtom";
import type { IAutoMovieSimplexBudget } from "./IAutoMovieSimplexBudget";
import type { IAutoMovieSimplexMinimum } from "./IAutoMovieSimplexMinimum";

/**
 * Minimize half ||sum(lambda_i*a_i)||^2 + sum(lambda_i*b_i) on the simplex.
 * Pairwise Frank-Wolfe transfers mass from the most expensive occupied atom
 * to the cheapest atom, with exact quadratic line search and complete pricing.
 * Lacoste-Julien and Jaggi (2015), Algorithm 2, describes the pairwise update.
 * Exact-arithmetic pricing bounds convex objective error, not parameter error.
 * Computed gaps include measured simplex-mass correction, but are not interval
 * certificates of all dot-product rounding at a requested sub-ulp target.
 *
 * @evidence contracts/common.md#principled-implementation Convex simplex duality gives price_i=a_i dot aggregate+b_i. Nonnegative weighted pricing slacks avoid subtraction of two near-equal means; measured mass error contributes abs((sum(lambda)-1)*minimumPrice). Normalizing weights precedes recomputing aggregate/prices. This remains a floating numerical certificate, not a sub-ulp interval proof. Exact pairwise line search requires no Gram matrix, dependent-row inverse or assumed convergence rate.
 * @evidence contracts/common.md#clear-and-simple-design This generic owner keeps sparse admission, complete pricing, weight transfer and finite work together; recovery determines objective/constraint rows and original-coordinate acceptance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No constraint sampling, curvature floor, gamma regularization, dropped dependent row or budget-limited success replaces the authored convex problem. Nonrepresentable arithmetic throws.
 * @evidence contracts/common.md#meaningful-documentation States the exact objective, sparse pairwise update, absolute gap units, degeneracy handling and absence of nonlinear or parameter-accuracy guarantees.
 * @evidence contracts/performance.md#efficient-algorithms With n coordinates, m atoms and Z sparse coefficients, each complete pass costs O(n+m+Z). At most I pairwise transfers require O(I*(n+m+Z)) work and O(n+m+Z) logical storage, without a dense m-by-m Gram or n-dimensional nullspace. Explicit scalar-visit bounds precede every pass and transfer.
 * @evidence contracts/performance.md#reuse-equivalent-work One aggregate supplies all prices. Weights are normalized and the aggregate is rebuilt on every pass to avoid accumulating mass/vector drift; pair curvature merges the two sorted sparse supports without allocating a dense difference.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed atoms remain unchanged. Owned weights, aggregate and prices are admitted before allocation; prices expire on return and weights/aggregate transfer, with no cache, WASM reactor or external handles.
 */
export function minimizeAutoMovieSimplexQuadratic(
  width: number,
  atoms: readonly IAutoMovieSimplexAtom[],
  tolerance: number,
  budget: IAutoMovieSimplexBudget,
  charge: (work: number) => void = (): void => {},
): IAutoMovieSimplexMinimum {
  if (
    !Number.isSafeInteger(width) ||
    width < 1 ||
    atoms.length < 1 ||
    !(tolerance > 0) ||
    !Number.isFinite(tolerance) ||
    ![budget?.maxIterations, budget?.maxEntries, budget?.maxWork].every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    atoms.length > budget.maxWork
  )
    throw new Error(
      "simplex-quadratic: bounded dimensions and finite tolerance required",
    );
  let work: number = 0;
  const spend: (amount: number) => void = (amount: number): void => {
    charge(amount);
    work += amount;
  };
  spend(atoms.length);
  const coefficients: number = atoms.reduce(
    (sum: number, atom: IAutoMovieSimplexAtom): number =>
      sum + atom.indices.length,
    0,
  );
  const retained: number = 2 * coefficients + 3 * atoms.length + width;
  // Conservative logical scalar visits include sparse indices, coefficients,
  // aggregate read/write, pricing and complete finite checks, not just products.
  const admission: number = 16 * coefficients + 8 * atoms.length;
  const initialization: number = width + 2 * atoms.length + 1;
  const passWork: number = 16 * coefficients + 20 * atoms.length + 8 * width;
  const transferWork: number = 16 * coefficients + 16;
  if (
    ![retained, admission, initialization, passWork, transferWork].every(
      (value: number): boolean => Number.isSafeInteger(value) && value > 0,
    ) ||
    !Number.isSafeInteger(coefficients) ||
    coefficients < 0 ||
    retained > budget.maxEntries ||
    admission + initialization + passWork > budget.maxWork
  )
    throw new Error(
      "simplex-quadratic: bounded dimensions and finite tolerance required",
    );
  spend(admission - work);
  for (const atom of atoms) {
    if (
      atom.values.length !== atom.indices.length ||
      !Number.isFinite(atom.offset)
    )
      throw new Error("simplex-quadratic: finite sparse atom required");
    for (let at: number = 0; at < atom.indices.length; at++)
      if (
        !Number.isSafeInteger(atom.indices[at]) ||
        atom.indices[at]! < 0 ||
        atom.indices[at]! >= width ||
        (at > 0 && atom.indices[at]! <= atom.indices[at - 1]!) ||
        !Number.isFinite(atom.values[at])
      )
        throw new Error(
          "simplex-quadratic: sorted unique finite coordinates required",
        );
  }
  spend(initialization);
  const weights: number[] = new Array<number>(atoms.length).fill(0);
  const aggregate: number[] = new Array<number>(width).fill(0);
  const prices: number[] = new Array<number>(atoms.length).fill(0);
  weights[0] = 1;
  let iterations: number = 0;
  for (;;) {
    spend(passWork);
    const mass: number = weights.reduce((sum: number, value: number): number => sum + value, 0);
    if (!(mass > 0) || !Number.isFinite(mass))
      throw new Error("simplex-quadratic: nonrepresentable simplex mass");
    for (let at: number = 0; at < weights.length; at++) weights[at]! /= mass;
    aggregate.fill(0);
    let affine: number = 0;
    for (let at: number = 0; at < atoms.length; at++) {
      const atom: IAutoMovieSimplexAtom = atoms[at]!;
      affine += weights[at]! * atom.offset;
      for (let entry: number = 0; entry < atom.indices.length; entry++)
        aggregate[atom.indices[entry]!]! += weights[at]! * atom.values[entry]!;
    }
    let entering: number = 0,
      leaving: number = 0;
    for (let at: number = 0; at < atoms.length; at++) {
      const atom: IAutoMovieSimplexAtom = atoms[at]!;
      prices[at] = atom.indices.reduce(
        (sum: number, axis: number, entry: number): number =>
          sum + atom.values[entry]! * aggregate[axis]!,
        atom.offset,
      );
      if (prices[at]! < prices[entering]!) entering = at;
      if (
        weights[at]! > 0 &&
        (weights[leaving] === 0 || prices[at]! > prices[leaving]!)
      )
        leaving = at;
    }
    const objective: number =
      0.5 *
        aggregate.reduce(
          (sum: number, value: number): number => sum + value * value,
          0,
        ) +
      affine;
    const simplexResidual: number = Math.abs(weights.reduce(
      (sum: number, value: number): number => sum + value, 0) - 1);
    const gapMassAllowance: number = simplexResidual * Math.abs(prices[entering]!);
    const gap: number = weights.reduce((sum: number, value: number, at: number): number =>
      sum + value * (prices[at]! - prices[entering]!), gapMassAllowance);
    if (
      ![objective, gap].every(Number.isFinite) ||
      !aggregate.every(Number.isFinite) ||
      !prices.every(Number.isFinite) ||
      !weights.every(Number.isFinite)
    )
      throw new Error(
        "simplex-quadratic: nonrepresentable aggregate or pricing",
      );
    let termination: IAutoMovieSimplexMinimum["termination"] | null =
      gap <= tolerance && simplexResidual <= 64 * Number.EPSILON * atoms.length
        ? "gap"
        : iterations === budget.maxIterations
          ? "iteration-budget"
          : work + transferWork + passWork > budget.maxWork
            ? "work-budget"
            : null;
    if (gap < 0)
      throw new Error("simplex-quadratic: inconsistent simplex pricing");
    if (termination !== null)
      return {
        weights,
        aggregate,
        objective,
        minimumPrice: prices[entering]!,
        gap,
        gapMassAllowance,
        simplexResidual,
        converged: termination === "gap",
        termination,
        iterations,
        work,
      };
    spend(transferWork);
    const first: IAutoMovieSimplexAtom = atoms[entering]!;
    const second: IAutoMovieSimplexAtom = atoms[leaving]!;
    let norm: number = 0,
      a: number = 0,
      b: number = 0;
    while (a < first.indices.length || b < second.indices.length) {
      const ai: number = first.indices[a] ?? Infinity;
      const bi: number = second.indices[b] ?? Infinity;
      const difference: number =
        ai === bi
          ? first.values[a++]! - second.values[b++]!
          : ai < bi
            ? first.values[a++]!
            : -second.values[b++]!;
      norm = Math.hypot(norm, difference);
    }
    const slope: number = prices[leaving]! - prices[entering]!;
    const fraction: number =
      norm === 0
        ? weights[leaving]!
        : Math.min(weights[leaving]!, slope / norm / norm);
    if (
      !(fraction > 0) ||
      !Number.isFinite(fraction) ||
      weights[entering]! + fraction === weights[entering]!
    ) {
      termination = "stalled";
      return {
        weights,
        aggregate,
        objective,
        minimumPrice: prices[entering]!,
        gap,
        gapMassAllowance,
        simplexResidual,
        converged: false,
        termination,
        iterations,
        work,
      };
    }
    weights[entering]! += fraction;
    weights[leaving]! -= fraction;
    iterations++;
  }
}
