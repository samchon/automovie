import type {
  IAutoMovieCaptureSubject,
  IAutoMovieDrawCall,
  IAutoMovieDrawDescription,
  IAutoMovieDrawPage,
  IAutoMovieDrawResult,
} from "@automovie/render";

/**
 * A browser page that records every call a draw session makes and answers as a draw page would, without a browser: `describe` returns the given subject and renderer, and `draw` returns what `answer` makes of the call, or never settles when `answer` is null.
 *
 * Page functions are not run; the double reads their argument, which is the whole of what a session sends, so a test observes the session through its seam.
 */
export function createDrawPageDouble(props: {
  /** The subject the page describes. */
  subject: IAutoMovieCaptureSubject;

  /** The renderer string the page reports. */
  renderer: string;

  /** The picture for a call, or null for a page whose subject never reports ready. */
  answer: ((call: IAutoMovieDrawCall) => IAutoMovieDrawResult) | null;
}): createDrawPageDouble.IDouble {
  const calls: createDrawPageDouble.ICall[] = [];
  const page: IAutoMovieDrawPage = {
    addInitScript: async (script: { content: string }): Promise<unknown> => {
      calls.push({ method: "addInitScript", arg: script.content });
      return undefined;
    },
    goto: async (url: string): Promise<unknown> => {
      calls.push({ method: "goto", arg: url });
      return null;
    },
    waitForFunction: async <T>(_predicate: (arg: T) => unknown, arg: T): Promise<unknown> => {
      calls.push({ method: "waitForFunction", arg });
      return true;
    },
    evaluate: async <R, T>(_task: (arg: T) => R | Promise<R>, arg: T): Promise<R> => {
      calls.push({ method: "evaluate", arg });
      if (typeof arg === "string")
        return { subject: props.subject, renderer: props.renderer } satisfies IAutoMovieDrawDescription as R;
      const call: IAutoMovieDrawCall = (arg as { call: IAutoMovieDrawCall }).call;
      if (props.answer === null) return new Promise<R>((): void => {});
      return props.answer(call) as R;
    },
    close: async (): Promise<unknown> => {
      calls.push({ method: "close", arg: null });
      return undefined;
    },
  };
  return { page, calls };
}
/** Types of the recording draw page. */
export namespace createDrawPageDouble {
  /** The page and what was asked of it. */
  export interface IDouble {
    /** The page a session drives. */
    page: IAutoMovieDrawPage;

    /** Every call, in order. */
    calls: ICall[];
  }

  /** One call: the method and its argument. */
  export interface ICall {
    /** The page method called. */
    method: string;

    /** The argument sent: the address, the init script's text, a global's name, or the draw function's call. */
    arg: unknown;
  }
}
