/** What answered on the viewer's port. */
export interface IViewerProbe {
  /** Something accepts connections on the port. */
  open: boolean;

  /** The page it serves is the playground's, not some other program's. */
  playground: boolean;
}

/** The server this tool started, remembered so that only that process is ever stopped. */
export interface IViewerRecord {
  /** Process id of the started command; its whole tree is stopped with it. */
  pid: number;

  /** When it was started, ISO 8601. */
  startedAt: string;
}

/**
 * Everything `runViewerCommand` reads from or does to the machine, injected so
 * that each path (healthy, absent, foreign, stale, stopped) can be exercised
 * without a server, a port or a process.
 */
export interface IViewerIo {
  /** The playground dev server's fixed port. */
  port: number;

  /** Ask the port what answers. */
  probe(): Promise<IViewerProbe>;

  /** Newest modification of `@automovie/human` source, ms, or null with none. */
  sourceNewestMs(): number | null;

  /** Modification of the human browser build's entry, ms, or null when absent. */
  builtAtMs(): number | null;

  /** The record of a server this tool started, or null. */
  readRecord(): IViewerRecord | null;

  /** Remember a server this tool started. */
  writeRecord(record: IViewerRecord): void;

  /** Forget the remembered server. */
  clearRecord(): void;

  /** Build the human browser output; resolves the exit code. */
  build(): Promise<number>;

  /** Start the dev server without a visible window; `exited` resolves its exit code. */
  serve(): { pid: number; exited: Promise<number> };

  /** Wait until the port serves the playground; false when it never does. */
  waitHealthy(): Promise<boolean>;

  /** Stop a process and every process it started. */
  kill(pid: number): Promise<void>;

  /** Open the body editor in a real browser and return the renderer string its page reports. */
  renderer(): Promise<string>;

  /** The checked-out revision the server serves, for the report. */
  revision(): string;

  /** Print one line. */
  log(line: string): void;
}
