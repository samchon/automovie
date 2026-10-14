import type { IAutoMovieRepaintExecutionPolicy } from "@automovie/interface";
import { executeAutoMovieRepaintRequest } from "@automovie/production";

/** Execute the original repaint test request with its caller-owned digest/adapter defaults, virtual clock and observer array. This is the existing per-case wrapper, not a new runner; the real executor owns timers and cancellation. */
export function executeRepaintTestRequest<T>(props: {
  policy: IAutoMovieRepaintExecutionPolicy;
  calls: (signal: AbortSignal) => Promise<{
    value: T;
    costUnits: number;
    availableOutput: { digest: string; bytes: number } | null;
  }>;
  now?: () => Date;
  productionId?: string;
  shot?: string;
  requestId?: string;
  ordinalOffset?: number;
  requestFingerprint?: string;
  compileFingerprint?: string;
  sourceRenderFingerprint?: string;
  adapterIdentity?: string;
  seed?: number;
  attemptId?: () => string;
  signal?: AbortSignal;
  wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
  admitAttempt?: Parameters<
    typeof executeAutoMovieRepaintRequest
  >[0]["admitAttempt"];
}, defaults: { digest: (value: string) => string; adapterIdentity: string }): Promise<{ result: Awaited<ReturnType<typeof executeAutoMovieRepaintRequest<T>>>; records: unknown[] }> {
  const { digest, adapterIdentity }: typeof defaults = defaults;
  let attempt: number = 0;
  let virtualElapsed: number = 0;
  const records: unknown[] = [];
  return executeAutoMovieRepaintRequest({
    productionId: props.productionId ?? "repaint-execution",
    shot: props.shot ?? "opening",
    requestId: props.requestId ?? "10000000-0000-4000-8000-000000000001",
    ...(props.ordinalOffset === undefined
      ? {}
      : { ordinalOffset: props.ordinalOffset }),
    requestFingerprint: props.requestFingerprint ?? digest("request"),
    compileFingerprint: props.compileFingerprint ?? digest("compile"),
    sourceRenderFingerprint: props.sourceRenderFingerprint ?? digest("source"),
    adapterIdentity: props.adapterIdentity ?? adapterIdentity,
    seed: props.seed ?? 41,
    policy: props.policy,
    signal: props.signal,
    runtime: {
      now:
        props.now ??
        ((): Date =>
          new Date(Date.parse("2026-08-28T10:00:00.000Z") + virtualElapsed)),
      attemptId:
        props.attemptId ??
        ((): string =>
          `20000000-0000-4000-8000-${String(++attempt).padStart(12, "0")}`),
      wait: async (milliseconds: number, signal: AbortSignal): Promise<void> => {
        await (props.wait?.(milliseconds, signal) ?? Promise.resolve());
        if (props.now === undefined) virtualElapsed += milliseconds;
      },
    },
    execute: props.calls,
    onAttempt: (record: Parameters<Parameters<typeof executeAutoMovieRepaintRequest<T>>[0]["onAttempt"]>[0]): number => records.push(record),
    ...(props.admitAttempt === undefined
      ? {}
      : { admitAttempt: props.admitAttempt }),
  }).then((result: Awaited<ReturnType<typeof executeAutoMovieRepaintRequest<T>>>): { result: typeof result; records: unknown[] } => ({ result, records }));
}
