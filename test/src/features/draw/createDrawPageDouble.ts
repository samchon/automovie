import type {
  IAutoMovieCaptureSubject,
  IAutoMovieDrawCall,
  IAutoMovieDrawDescription,
  IAutoMovieDrawResult,
} from "@automovie/interface";
import type {
  IAutoMovieDrawPage,
  IAutoMovieDrawPageRequest,
} from "@automovie/render";

/**
 * A browser page that records every call a draw session makes and answers as a
 * draw page would, without a browser: `describe` returns the given subject and
 * renderer, `speak` settles at once, and `draw` returns what `answer` makes of
 * the call, or never settles when `answer` is null.
 *
 * Page functions are not run; the double reads their argument, the session's
 * typed request, which is the whole of what a session sends, so a test
 * observes the session through its seam.
 */
export function createDrawPageDouble(props: {
  /** The subject the page describes. */
  subject: IAutoMovieCaptureSubject;

  /** The renderer string the page reports. */
  renderer: string;

  /**
   * The picture for a call, or null for a page whose subject never reports
   * ready.
   */
  answer: ((call: IAutoMovieDrawCall) => IAutoMovieDrawResult) | null;
}): createDrawPageDouble.IDouble {
  const calls: createDrawPageDouble.ICall[] = [];

  /** The recording page: each request answered as its kind is. */
  class Page implements IAutoMovieDrawPage {
    public async addInitScript(script: { content: string }): Promise<unknown> {
      calls.push({ method: "addInitScript", arg: script.content });
      return undefined;
    }

    public async goto(url: string): Promise<unknown> {
      calls.push({ method: "goto", arg: url });
      return null;
    }

    public async waitForFunction<T>(
      _predicate: (arg: T) => unknown,
      arg: T,
    ): Promise<unknown> {
      calls.push({ method: "waitForFunction", arg });
      return true;
    }

    public evaluate(
      task: (
        arg: IAutoMovieDrawPageRequest.IDescribe,
      ) => Promise<IAutoMovieDrawDescription>,
      arg: IAutoMovieDrawPageRequest.IDescribe,
    ): Promise<IAutoMovieDrawDescription>;
    public evaluate(
      task: (arg: IAutoMovieDrawPageRequest.ISpeak) => Promise<void>,
      arg: IAutoMovieDrawPageRequest.ISpeak,
    ): Promise<void>;
    public evaluate(
      task: (
        arg: IAutoMovieDrawPageRequest.IDraw,
      ) => Promise<IAutoMovieDrawResult>,
      arg: IAutoMovieDrawPageRequest.IDraw,
    ): Promise<IAutoMovieDrawResult>;
    public async evaluate(
      _task: unknown,
      arg: IAutoMovieDrawPageRequest,
    ): Promise<IAutoMovieDrawDescription | IAutoMovieDrawResult | void> {
      calls.push({ method: "evaluate", arg });
      if (arg.kind === "describe")
        return { subject: props.subject, renderer: props.renderer };

      // Handing the dialogue mouths draws nothing; the track stays in `calls`.
      if (arg.kind === "speak") return;
      if (props.answer === null)
        return new Promise<IAutoMovieDrawResult>((): void => {});
      return props.answer(arg.call);
    }

    public async close(): Promise<unknown> {
      calls.push({ method: "close", arg: null });
      return undefined;
    }
  }
  return { page: new Page(), calls };
}/** Types of the recording draw page. */
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

    /**
     * The argument sent: the address, the init script's text, a global's name,
     * the mouth track, or the draw function's call.
     */
    arg: unknown;
  }
}
