import type {
  IViewerIo,
  IViewerProbe,
  IViewerRecord,
} from "../../../scripts/viewer/IViewerIo";

/** In-memory machine for `runViewerCommand`: every effect is recorded, nothing runs. */
export function createViewerIoFixture(
  state: {
    probe?: IViewerProbe;
    sourceNewestMs?: number | null;
    builtAtMs?: number | null;
    record?: IViewerRecord | null;
    buildCode?: number;
    healthy?: boolean;
    exitCode?: number;
    renderer?: string;
    servePid?: number;
  } = {},
) {
  const calls: string[] = [];
  const lines: string[] = [];
  let record = state.record ?? null;
  const io: IViewerIo = {
    port: 5173,
    probe: async () => state.probe ?? { open: false, playground: false },
    sourceNewestMs: () =>
      state.sourceNewestMs === undefined ? 100 : state.sourceNewestMs,
    builtAtMs: () => (state.builtAtMs === undefined ? 200 : state.builtAtMs),
    readRecord: () => record,
    writeRecord: (next) => {
      calls.push("write");
      record = next;
    },
    clearRecord: () => {
      calls.push("clear");
      record = null;
    },
    build: async () => {
      calls.push("build");
      return state.buildCode ?? 0;
    },
    serve: () => {
      calls.push("serve");
      return {
        pid: state.servePid ?? 4242,
        exited: Promise.resolve(state.exitCode ?? 0),
      };
    },
    waitHealthy: async () => {
      calls.push("wait");
      return state.healthy ?? true;
    },
    kill: async (pid) => {
      calls.push(`kill ${pid}`);
    },
    renderer: async () => {
      calls.push("renderer");
      return state.renderer ?? "ANGLE (AMD, AMD Radeon 780M)";
    },
    revision: () => "abc1234",
    log: (line) => {
      lines.push(line);
    },
  };
  return { io, calls, lines, record: () => record };
}
