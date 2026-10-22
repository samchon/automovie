import { createHash } from "node:crypto";
import type { ViteDevServer } from "vite";

import { HumanImageProcess } from "./HumanImageProcess";
import { HumanImageSourceIdentity } from "./HumanImageSourceIdentity";

/** Serialize an isolated generation/native owner while HTTP serves archives.
 * HTTP retains one byte publication and bounded PNGs, never parsed geometry.
 * Exact source/input commitments and asynchronous output hashing guard IPC.
 */
export class HumanImageSession {
  private queue: Promise<void> = Promise.resolve();
  private worker: HumanImageProcess | undefined;
  private cached:
    | {
        key: string;
        publication: Buffer;
        receipt: object;
        frames: Map<
          string,
          {
            png: Buffer;
            nonce: string | null;
            capturedUtc: string;
            pngSha256: string;
            metadata: unknown;
          }
        >;
      }
    | undefined;
  private hostIdentity: string | undefined;
  private closed: boolean = false;
  private admittedRequests: number = 0;
  public constructor(
    _server: ViteDevServer,
    private readonly root: string,
  ) {}

  /** Admit a model or frame without blocking archive IO with model computations. */
  public async image(
    input: { value: Record<string, unknown>; sha256: string },
    name: string,
    nonce?: string,
  ): Promise<{
    png: Buffer;
    key: string;
    cacheHit: boolean;
    receipt: object;
    capturedUtc: string | undefined;
    pngSha256: string | undefined;
  }> {
    if (nonce !== undefined && !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(nonce))
      throw new Error("Fresh nonce requires one to sixty-four safe characters");
    if (this.closed || this.admittedRequests >= 16)
      throw new Error("Human image queue is closed or full");
    this.admittedRequests++;
    const work: Promise<{
      png: Buffer;
      key: string;
      cacheHit: boolean;
      receipt: object;
      capturedUtc: string | undefined;
      pngSha256: string | undefined;
    }> = this.queue.then(
      async (): Promise<{
        png: Buffer;
        key: string;
        cacheHit: boolean;
        receipt: object;
        capturedUtc: string | undefined;
        pngSha256: string | undefined;
      }> => {
        if (this.closed) throw new Error("Human image server is closing");
        const host: string = await HumanImageSourceIdentity.host(this.root);
        if (this.hostIdentity !== undefined && host !== this.hostIdentity)
          throw new Error("Human host changed; restart this server");
        this.hostIdentity = host;
        const source: string = await HumanImageSourceIdentity.source(this.root);
        const key: string = createHash("sha256")
          .update(source + input.sha256)
          .digest("hex");
        const previous: { nonce: string | null } | undefined =
          this.cached?.key === key ? this.cached.frames.get(name) : undefined;
        let cacheHit: boolean =
          this.cached?.key === key &&
          (name === "$model" ||
            (previous !== undefined &&
              (nonce === undefined || previous.nonce === nonce)));
        if (this.cached?.key !== key || !this.worker?.isActive()) {
          // One exact model key owns one isolate, including its SSR/native state.
          // Join its retirement before admitting the next model; archive IO is independent.
          if (this.worker !== undefined) {
            await this.worker.close();
            this.worker = undefined;
          }
          this.cached = undefined;
          cacheHit = false;
          if (this.closed)
            throw new Error(
              "Human image server closed during model retirement",
            );
          const next: HumanImageProcess = new HumanImageProcess();
          this.worker = next;
          await next.start(this.root);
          const result: Record<string, unknown> = await next.request({
            kind: "generate",
            source,
            key,
            inputSha256: input.sha256,
            value: input.value,
          });
          if (
            result.key !== key ||
            result.source !== source ||
            result.inputSha256 !== input.sha256 ||
            result.receipt === null ||
            typeof result.receipt !== "object"
          )
            throw new Error("Worker generation identity mismatch");
          const publication: Buffer = await next.publication(result);
          if (
            this.closed ||
            (await HumanImageSourceIdentity.source(this.root)) !== source
          )
            throw new Error("Human source changed during isolated generation");
          this.cached = {
            key,
            publication,
            receipt: result.receipt,
            frames: new Map(),
          };
        }
        const worker: HumanImageProcess | undefined = this.worker;
        if (worker === undefined)
          throw new Error("Human model has no process owner");
        if (name !== "$model" && !cacheHit) {
          const result: Record<string, unknown> = await worker.request({
            kind: "render",
            source,
            key,
            name,
            materialMode:
              input.value.schema === undefined ? "neutral" : "model",
          });
          if (
            result.key !== key ||
            result.source !== source ||
            !Buffer.isBuffer(result.png) ||
            typeof result.capturedUtc !== "string" ||
            !Number.isFinite(Date.parse(result.capturedUtc)) ||
            typeof result.pngSha256 !== "string" ||
            createHash("sha256").update(result.png).digest("hex") !==
              result.pngSha256
          )
            throw new Error("Worker frame identity mismatch");
          const retained: number =
            [...this.cached.frames.values()].reduce(
              (sum: number, value: { png: Buffer }): number =>
                sum + value.png.length,
              0,
            ) -
            (this.cached.frames.get(name)?.png.length ?? 0) +
            result.png.length;
          if (retained > 268435456)
            throw new Error("Human PNG cache exceeds its byte budget");
          this.cached.frames.set(name, {
            png: result.png,
            nonce: nonce ?? null,
            capturedUtc: result.capturedUtc,
            pngSha256: result.pngSha256,
            metadata: result.metadata,
          });
        }
        if (
          this.closed ||
          (await HumanImageSourceIdentity.source(this.root)) !== source
        ) {
          this.cached = undefined;
          throw new Error("Human source changed during this request");
        }
        if ((await HumanImageSourceIdentity.host(this.root)) !== host) {
          this.cached = undefined;
          throw new Error(
            "Human host changed during this request; restart this server",
          );
        }
        const capture:
          | {
              png: Buffer;
              nonce: string | null;
              capturedUtc: string;
              pngSha256: string;
              metadata: unknown;
            }
          | undefined = this.cached.frames.get(name);
        if (name !== "$model" && !capture)
          throw new Error("Worker frame is missing");
        return {
          png: name === "$model" ? this.cached.publication : capture!.png,
          key,
          cacheHit,
          capturedUtc: capture?.capturedUtc,
          pngSha256: capture?.pngSha256,
          receipt: {
            ...this.cached.receipt,
            frame: name,
            capture:
              capture === undefined
                ? undefined
                : {
                    nonce: capture.nonce,
                    capturedUtc: capture.capturedUtc,
                    pngSha256: capture.pngSha256,
                    metadata: capture.metadata,
                  },
            cacheHit,
          },
        };
      },
    );
    this.queue = work.then((): void => {}).catch((): void => {});
    try {
      return await work;
    } finally {
      this.admittedRequests--;
    }
  }

  /** Cancel the owned process, join work, then drop parent publication caches. */
  public async close(): Promise<void> {
    this.closed = true;
    await this.worker?.close();
    await this.queue;
    await this.worker?.close();
    this.worker = undefined;
    this.cached = undefined;
  }
}
