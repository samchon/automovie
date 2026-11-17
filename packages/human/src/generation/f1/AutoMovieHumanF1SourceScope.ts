import type { IAutoMovieHumanConicLoft } from "@automovie/interface";

/** Production cap/clock requests shared by construction and complete original-source readers. */
export namespace AutoMovieHumanF1SourceScope {
  /** Closed production roles; supplied clock values affect sampling, not scalar functions. */
  export type Scope =
    | { kind: "arm"; until: number; turn?: number }
    | { kind: "hand" | "leg"; turn?: number }
    | { kind: "trunk" | "nose"; phase: number }
    | { kind: "breast" | "ear" };

  /** One actual family request, distinct from its cap-inclusive native source domain. */
  export interface IResult {
    /** Complete controls with the production cap and clock scope applied once. */
    family: IAutoMovieHumanConicLoft.IFamily;
    /** Requested wall sampling interval in physical mm; caps retain their own extra domain. */
    wallDomain: readonly [number, number];
  }

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
