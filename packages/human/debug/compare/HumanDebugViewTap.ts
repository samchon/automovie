import { AutoMovieViewLoft, type IAutoMovieViewPart } from "@automovie/engine";

/**
 * Run a generation and record every view part it lofts, with the loft it got back.
 *
 * Every view part of the body and the head reaches the engine through `AutoMovieViewLoft.create`,
 * so for the length of `run` that one entry is wrapped: the wrapper calls the operator unchanged,
 * keeps the part and its result, and returns the result, so the generation is the production one.
 * The entry is restored when `run` returns or throws. The wrap lives on the engine namespace's
 * object, which every importer of `@automovie/engine` shares, and the page's generation is
 * synchronous, so no other caller lofts while it is in place.
 *
 * @param run The generation.
 * @returns Its value, and every lofted part in call order (a part lofted twice, such as the trunk
 *   before and after its solve, appears twice).
 */
export function HumanDebugViewTap<T>(run: () => T): { value: T; records: HumanDebugViewTap.IRecord[] } {
  const target: { create: typeof AutoMovieViewLoft.create } = AutoMovieViewLoft as unknown as { create: typeof AutoMovieViewLoft.create };
  const original: typeof AutoMovieViewLoft.create = target.create;
  const records: HumanDebugViewTap.IRecord[] = [];
  target.create = (part: IAutoMovieViewPart): AutoMovieViewLoft.IResult => {
    const loft: AutoMovieViewLoft.IResult = original(part);
    records.push({ part, loft });
    return loft;
  };
  try {
    return { value: run(), records };
  } finally {
    target.create = original;
  }
}

/** The records {@link HumanDebugViewTap} keeps. */
export namespace HumanDebugViewTap {
  /** One lofted part. */
  export interface IRecord {
    /** The part as handed to the operator. */
    part: IAutoMovieViewPart;

    /** The operator's result. */
    loft: AutoMovieViewLoft.IResult;
  }
}
