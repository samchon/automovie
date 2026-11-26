/**
 * One admitted CLI request, discriminated by `command`.
 *
 * `help` and `version` carry nothing because they are standalone requests.
 * `create` and `add` carry their targets exactly as typed; `run` resolves them
 * against the working directory. An explicit `name` is carried as typed; `run`
 * chooses the name when it is absent.
 */
export type AutoMovieCommand =
  | {
      /** Print the usage text. */
      command: "help";
    }
  | {
      /** Print this package's version. */
      command: "version";
    }
  | {
      /**
       * Install a single production, or with `workspace` a workspace root, into
       * `directory`.
       */
      command: "create";

      /**
       * Target directory as typed, never blank; `run` resolves it against the
       * working directory.
       */
      directory: string;

      /** Install a pnpm workspace root instead of a single production. */
      workspace: boolean;

      /**
       * Admit a non-empty target, writing over same-path files and keeping the
       * rest.
       */
      force: boolean;

      /** Package name as typed; absent, `run` derives or asks for one. */
      name?: string;
    }
  | {
      /**
       * Add one production to the workspace whose root is the working
       * directory.
       */
      command: "add";

      /** `shorts` for brief → screenplay, `series` for the whole long route. */
      family: "shorts" | "series";

      /**
       * The production's directory under `movies/<family>`, one admitted path
       * segment.
       */
      directory: string;

      /**
       * Admit a non-empty production directory, writing over same-path files
       * and keeping the rest.
       */
      force: boolean;

      /**
       * Package name as typed; absent, `run` derives one from the directory
       * segment.
       */
      name?: string;
    }
  | {
      /**
       * Capture stills of a subject or a video file in the production at the
       * working directory.
       */
      command: "capture";

      /**
       * The tokens after `capture`, as typed; `run` reads them through the
       * production's request grammar, which only the production's
       * `@automovie/render` holds.
       */
      args: string[];
    }
  | {
      /**
       * Serve the inspector page over a subject module of the production or
       * package at the working directory.
       */
      command: "inspect";

      /**
       * The tokens after `inspect`, as typed; `run` reads them through the
       * production's request grammar, as for `capture`.
       */
      args: string[];
    }
  | {
      /**
       * Render one subject of the production at the working directory into a
       * video.
       */
      command: "render";

      /**
       * The tokens after `render`, as typed; `run` reads them with the
       * production's option reader.
       */
      args: string[];
    }
  | {
      /** Record real-time playback of the production's running inspector page. */
      command: "review";

      /**
       * The tokens after `review`, as typed; `run` reads them with the
       * production's option reader.
       */
      args: string[];
    }
  | {
      /** Verify scoped production checks and observations. */
      command: "check";

      /** The tokens after `check`, as typed; the check command reads them. */
      args: string[];
    };
