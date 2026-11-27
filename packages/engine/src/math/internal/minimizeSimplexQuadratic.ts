import type {
  IAutoMovieSimplexAtom,
  IAutoMovieSimplexBudget,
  IAutoMovieSimplexMinimum,
} from "@automovie/interface";

/*
 * Minimize half ||sum(lambda_i_a_i)||^2 + sum(lambda_i_b_i) on the simplex.
 * Pairwise Frank-Wolfe transfers mass from the most expensive occupied atom to
 * the cheapest atom, with exact quadratic line search and complete pricing.
 * Lacoste-Julien and Jaggi (2015), Algorithm 2, describes the pairwise update.
 * Exact-arithmetic pricing bounds convex objective error, not parameter error.
 * Computed gaps include measured simplex-mass correction, but are not interval
 * certificates of all dot-product rounding at a requested sub-ulp target.
 */
export function minimizeSimplexQuadratic(
  width: number,
  atoms: readonly IAutoMovieSimplexAtom[],
  tolerance: number,
  budget: IAutoMovieSimplexBudget,
  charge: (work: number) => void = (): void => {},
): IAutoMovieSimplexMinimum {
  if (
    width < 1 ||
    atoms.length < 1 ||
    !(tolerance > 0) ||
    ![budget?.maxIterations, budget?.maxEntries, budget?.maxWork].every(
      (value: number): boolean => value > 0,
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
      (value: number): boolean => value > 0,
    ) ||
    coefficients < 0 ||
    retained > budget.maxEntries ||
    admission + initialization + passWork > budget.maxWork
  )
    throw new Error(
      "simplex-quadratic: bounded dimensions and finite tolerance required",
    );
  spend(admission - work);
  for (const atom of atoms) {
    if (atom.values.length !== atom.indices.length)
      throw new Error("simplex-quadratic: finite sparse atom required");
    for (let at: number = 0; at < atom.indices.length; at++)
      if (
        atom.indices[at]! < 0 ||
        atom.indices[at]! >= width ||
        (at > 0 && atom.indices[at]! <= atom.indices[at - 1]!)
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
    const mass: number = weights.reduce(
      (sum: number, value: number): number => sum + value,
      0,
    );
    if (!(mass > 0))
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
    const simplexResidual: number = Math.abs(
      weights.reduce((sum: number, value: number): number => sum + value, 0) -
        1,
    );
    const gapMassAllowance: number =
      simplexResidual * Math.abs(prices[entering]!);
    const gap: number = weights.reduce(
      (sum: number, value: number, at: number): number =>
        sum + value * (prices[at]! - prices[entering]!),
      gapMassAllowance,
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
