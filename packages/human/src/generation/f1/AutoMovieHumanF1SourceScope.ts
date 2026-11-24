import type { IAutoMovieHumanConicLoft, IAutoMovieHumanF1SourceScope } from "@automovie/interface";

/** Production cap/clock requests shared by construction and complete original-source readers. */
export namespace AutoMovieHumanF1SourceScope {
  /** The production source role and its sampling request. */
  export type Scope = IAutoMovieHumanF1SourceScope.Scope;

  /** The resolved family and the wall interval its consumer requests. */
  export type IResult = IAutoMovieHumanF1SourceScope.IResult;

  /** Resolve the same cap/kept-wall request for the source producer and its independent reader. */
  export function resolve(family: IAutoMovieHumanConicLoft.IFamily, scope: Scope): IResult {
    const from: number = family.knots[0]!;
    const until: number =
      scope.kind === "arm"
        ? Math.min(family.knots.at(-1)!, scope.until)
        : family.knots.at(-1)!;
    if (!(Number.isFinite(from) && Number.isFinite(until) && until > from))
      throw new Error("production wall scope must be finite and ordered");
    let result: IAutoMovieHumanConicLoft.IFamily = family;
    if (scope.kind === "arm" || scope.kind === "hand" || scope.kind === "leg")
      result = {
        ...family,
        tips: [scope.kind === "hand" ? null : (family.tips?.[0] ?? null), null],
        ...(scope.turn === undefined ? {} : { turn: scope.turn }),
      };
    else if (scope.kind === "trunk" || scope.kind === "nose")
      result = { ...family, phase: scope.phase };
    return { family: result, wallDomain: [from, until] };
  }
}
