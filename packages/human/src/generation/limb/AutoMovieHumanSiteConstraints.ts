import { AutoMovieViewSection } from "@automovie/engine";

/** Call-owned independent site constraints, shared before adjoining scalar laws are published. */
export namespace AutoMovieHumanSiteConstraints {
  /** One explicit tape demand over copied numeric supports; no foreign callback is retained. */
  export interface IOwner {
    /** Same tuple and diagnostic identity reuse the original result; changed inputs replace only that site's record. */
    solve(
      name: string,
      extents: [number, number, number, number],
      girth: number,
    ): AutoMovieViewSection.ISolved;
  }

  /** Prepare an invocation-local owner bounded by the actual named measurement sites. */
  export function create(): IOwner {
    const sites: Map<string, IRecord> = new Map();
    return {
      solve(
        name: string,
        extents: [number, number, number, number],
        girth: number,
      ): AutoMovieViewSection.ISolved {
        const previous: IRecord | undefined = sites.get(name);
        if (
          previous !== undefined &&
          Object.is(previous.girth, girth) &&
          extents.every((value: number, i: number): boolean =>
            Object.is(value, previous.extents[i]),
          )
        )
          return previous.result;
        const result: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve(
          name,
          { extents },
          girth,
        );
        sites.set(name, { extents: [...extents], girth, result });
        return result;
      },
    };
  }
}

/** The last actual numeric constraint and its success/refusal for one named site. */
interface IRecord {
  /** Copied front/left/back/right positive supports, calibration mm. */
  extents: [number, number, number, number];

  /** Public tape demand, calibration mm. */
  girth: number;

  /** Exact original engine response, including its refusal and diagnostics. */
  result: AutoMovieViewSection.ISolved;
}
