/** Named contracts for Inspector options, URLs, and page hosting. */
export namespace AutoMovieCliInspectTypes {
  /** Host-owned options separated from the capture request. */
  export interface HostOptions {
    /** Subject module path, relative to the production or absolute. */
    module: string;

    /** The port to serve on, or null for a free one. */
    port: number | null;

    /** Props JSON path, relative to the production or absolute, or null. */
    props: string | null;

    /** The request options to serialize into the Inspector URL. */
    request: Map<string, string>;
  }

  /** Inputs for running `automovie inspect`. */
  export interface InspectProps {
    /** The tokens after `inspect`. */
    args: readonly string[];

    /** The production's or package's root folder. */
    root: string;
  }

  /** One named request value serialized into the Inspector URL. */
  export type QueryPair = readonly [key: string, value: string];

  /** Inputs to start a Vite Inspector page. */
  export interface ServePageProps {
    /** The production's root folder. */
    root: string;

    /** Path of the subject module, relative to `root` or absolute. */
    module: string;

    /** The production's Vite instance. */
    vite: unknown;

    /** The port to listen on, or null for a free one. */
    port: number | null;

    /** The JSON value passed to the module's `subjects`, or null. */
    props: unknown;

    /** Optional executable and fixed arguments for capture from `root`. */
    captureCommand?: readonly [string, ...string[]];
  }

  /** A running Inspector page and its cleanup operation. */
  export interface ServedPage {
    /** Address of the Inspector page, without a query. */
    url: string;

    /** Stop the server and delete the page. */
    close: () => Promise<void>;
  }
}
