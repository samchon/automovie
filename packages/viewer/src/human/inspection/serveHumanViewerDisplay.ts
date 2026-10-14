import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { PNG } from "pngjs";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import { judgeViewerRenderer } from "./judgeViewerRenderer.js";

/**
 * Save actual completed displays with a recoverable external ownership journal. A pending metadata entry is atomically published before its uniquely named PNG; the PNG rename is the publication boundary. PNG and metadata are not one atomic filesystem transaction. Recovery admits a pending entry only when its exact PNG exists, preserving the prior entry otherwise. Image names include a digest of bytes and facts, so equal pixels with different cameras cannot overwrite prior metadata.
 *
 * A live session retains its latest image. Same-origin release retires a session; close retires all sessions while preserving this port's latest valid judgment image. Restart recovers ordering and retires the former host's sessions. Only exact filenames admitted by this port's ownership manifest are collected; other ports and unowned files are preserved. The caller must own the listening port before admitting requests and await close during shutdown. There is no comparison pin caller, so this endpoint creates no implicit comparisons.
 *
 * @evidence contracts/common.md#principled-implementation Checks scalar envelope fields, reported-renderer classification and object presence for camera/address, verifies decoded PNG dimensions and serializes ordered publication; nested frame identity and physical hardware are not independently verified.
 * @evidence contracts/common.md#clear-and-simple-design One port-wide serialized queue owns the shared latest pointer, external journal and session collection. The callable handler preserves existing routing and exposes close for host retirement; actual renderer and displayed facts remain page-owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A source edit alone does not discard a valid retained display; encoded PNG hashing is not claimed as canonical decoded-pixel identity or immutable complete provenance.
 * @evidence contracts/common.md#meaningful-documentation Documents the journal recovery, PNG commit boundary, lack of two-file atomicity, live/released/latest retention and host port/shutdown obligations. Metadata separates reported loaded source from server revision at saving.
 * @evidence contracts/performance.md#efficient-algorithms Each request decodes and hashes PNG bytes/pixels and serializes the live-session metadata journal. Collection scans live sessions plus at most the prior and pending records; one port-wide queue orders shared latest ownership. Accumulated UTF-16 text is checked against 48*1024*1024 code units after append, allowing chunk overshoot rather than imposing a byte or memory bound.
 * @evidence contracts/performance.md#reuse-equivalent-work Only ordering completion is shared per session; distinct saves decode/write their own bytes and reject superseded generations/sequences rather than caching by image hash.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns one latest entry per live session and the latest released judgment, with a pending journal entry during publication. Exact superseded owned images are collected; staging files are removed on settlement. Request abort and premature response close cancel before PNG rename, whose in-flight filesystem commit cannot be undone. Queue population and released-session tombstones have no independent cap; close drains the queue and clears tombstones.
 */
export function serveHumanViewerDisplay(props: {
  root: string;
  storage: string;
  port: number;
  origin: string;
  revision: () => string;
}): ((request: IncomingMessage, response: ServerResponse) => void) & {
  /** Retire this port once, preserving its latest judgment image. */
  close: () => Promise<void>;
} {
  const output: string = path.resolve(props.root, ".shots/output");
  const storageRelative: string = path.relative(
    output,
    path.resolve(props.storage),
  );
  if (
    storageRelative === "" ||
    (!path.isAbsolute(storageRelative) &&
      storageRelative !== ".." &&
      !storageRelative.startsWith(".." + path.sep))
  )
    throw new Error(
      "Viewer metadata and cache must remain outside .shots/output.",
    );
  const staging: string = path.resolve(props.root, ".shots/display-staging");
  const records: string = path.resolve(props.storage, "display-records");
  const manifest: string = path.join(records, `port-${props.port}.json`);
  let entries: Array<Record<string, unknown>> = [];
  let latest: string | undefined;
  let initialized: boolean = false;
  let closed: boolean = false;
  let queue: Promise<void> = Promise.resolve();
  const released: Set<string> = new Set();
  const persist: (pending?: Record<string, unknown>) => Promise<void> = async (
    pending?: Record<string, unknown>,
  ): Promise<void> => {
    await fs.mkdir(records, { recursive: true });
    const temporary: string = path.join(records, randomUUID() + ".json.tmp");
    let primary: { error: unknown } | undefined;
    try {
      await fs.writeFile(
        temporary,
        JSON.stringify({
          owner: "automovie-display-v1",
          port: props.port,
          entries,
          latest,
          pending,
        }),
      );
      await fs.rename(temporary, manifest);
    } catch (error) {
      primary = { error };
      throw error;
    } finally {
      const operations: readonly (() => Promise<void>)[] = [
        async (): Promise<void> => {
          await fs.rm(temporary, { force: true });
        },
      ];
      if (primary === undefined)
        await createAutoMovieResourceRetirement(operations)();
      else await createAutoMovieResourceRetirement(operations, primary)();
    }
  };
  const collect: () => Promise<void> = async (): Promise<void> => {
    const obsolete: Array<Record<string, unknown>> = entries.filter(
      (entry: Record<string, unknown>): boolean =>
        entry.released === true && entry.image !== latest,
    );
    await createAutoMovieResourceRetirement(
      obsolete.map(
        (entry: Record<string, unknown>): (() => Promise<void>) =>
          async (): Promise<void> => {
            await fs.rm(path.join(output, String(entry.image)), {
              force: true,
            });
          },
      ),
    )();
    const obsoleteImages: Set<unknown> = new Set(
      obsolete.map((entry: Record<string, unknown>): unknown => entry.image),
    );
    entries = entries.filter(
      (entry: Record<string, unknown>): boolean =>
        !obsoleteImages.has(entry.image),
    );
    await persist();
  };
  const initialize: () => Promise<void> = async (): Promise<void> => {
    if (initialized) return;
    let value: Record<string, unknown>;
    try {
      value = JSON.parse(await fs.readFile(manifest, "utf8")) as Record<
        string,
        unknown
      >;
    } catch (cause) {
      if ((cause as NodeJS.ErrnoException).code !== "ENOENT") throw cause;
      initialized = true;
      return;
    }
    if (
      value.owner !== "automovie-display-v1" ||
      value.port !== props.port ||
      !Array.isArray(value.entries)
    )
      throw new Error("The display ownership manifest is invalid.");
    const admitted: Array<Record<string, unknown>> = [
      ...value.entries,
      ...(value.pending === undefined ? [] : [value.pending]),
    ] as Array<Record<string, unknown>>;
    for (const entry of admitted) {
      if (
        typeof entry.session !== "string" ||
        !/^[0-9a-f-]{36}$/.test(entry.session) ||
        typeof entry.image !== "string" ||
        !new RegExp(
          `^current-${props.port}-${entry.session}-[0-9a-f]{64}\\.png$`,
        ).test(entry.image) ||
        !Number.isSafeInteger(entry.generation) ||
        !Number.isSafeInteger(entry.sequence) ||
        entry.metadata === null ||
        typeof entry.metadata !== "object" ||
        entry.image !==
          `current-${props.port}-${entry.session}-${createHash("sha256").update(JSON.stringify(entry.metadata)).digest("hex")}.png`
      )
        throw new Error("The display ownership entry is invalid.");
    }
    if (
      value.latest !== undefined &&
      !admitted.some(
        (entry: Record<string, unknown>): boolean =>
          entry.image === value.latest,
      )
    )
      throw new Error("The latest display has no ownership entry.");
    entries = value.entries as Array<Record<string, unknown>>;
    latest = typeof value.latest === "string" ? value.latest : undefined;
    if (value.pending !== undefined) {
      const pending: Record<string, unknown> = value.pending as Record<
        string,
        unknown
      >;
      try {
        await fs.access(path.join(output, String(pending.image)));
        entries.push(pending);
        latest = String(pending.image);
      } catch (cause) {
        if ((cause as NodeJS.ErrnoException).code !== "ENOENT") throw cause;
      }
    }
    // A new host owns this port; old live tabs belong to its retired instance.
    for (const entry of entries) entry.released = true;
    initialized = true;
    await collect();
  };
  const handler: (
    request: IncomingMessage,
    response: ServerResponse,
  ) => void = (request: IncomingMessage, response: ServerResponse): void => {
    let canceled: boolean = false;
    request.once("aborted", (): void => {
      canceled = true;
    });
    response.once("close", (): void => {
      if (!response.writableEnded) canceled = true;
    });
    const fail: (cause: unknown) => void = (cause: unknown): void => {
      if (response.writableEnded || response.destroyed) return;
      response.statusCode = 422;
      response.end(String(cause));
    };
    if (request.method !== "POST" || request.headers.origin !== props.origin) {
      fail(
        new Error("Display saving requires the local viewer's original POST."),
      );
      return;
    }
    let text: string = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string): void => {
      text += chunk;
      if (text.length > 48 * 1024 * 1024) {
        fail(new Error("The display PNG exceeds the admitted frame envelope."));
        request.destroy();
      }
    });
    request.once("error", fail);
    request.once("end", (): void => {
      try {
        const value: Record<string, unknown> = JSON.parse(text) as Record<
          string,
          unknown
        >;
        const {
          session,
          generation,
          sequence,
          revision,
          renderer,
          png,
          width,
          height,
          camera,
          address,
        }: Record<string, unknown> = value;
        if (typeof session !== "string" || !/^[0-9a-f-]{36}$/.test(session))
          throw new Error("A display session is required.");
        if (value.action === "release") {
          if (closed) {
            response.end();
            return;
          }
          released.add(session);
          const release: Promise<void> = queue.then(async (): Promise<void> => {
            await initialize();
            for (const entry of entries)
              if (entry.session === session) entry.released = true;
            await collect();
          });
          queue = release.catch((): undefined => undefined);
          void release
            .then((): void => {
              response.end();
            })
            .catch(fail);
          return;
        }
        if (closed || released.has(session))
          throw new Error("The display session has been released.");
        if (
          typeof session !== "string" ||
          !/^[0-9a-f-]{36}$/.test(session) ||
          typeof generation !== "number" ||
          !Number.isSafeInteger(generation) ||
          generation < 1 ||
          typeof sequence !== "number" ||
          !Number.isSafeInteger(sequence) ||
          sequence < 1 ||
          typeof revision !== "string" ||
          revision.length === 0 ||
          typeof renderer !== "string" ||
          !judgeViewerRenderer(renderer).real ||
          typeof png !== "string" ||
          !png.startsWith("data:image/png;base64,") ||
          typeof width !== "number" ||
          typeof height !== "number" ||
          !Number.isInteger(width) ||
          !Number.isInteger(height) ||
          width < 32 ||
          height < 32 ||
          width > 4096 ||
          height > 2048 ||
          camera === null ||
          typeof camera !== "object" ||
          address === null ||
          typeof address !== "object"
        )
          throw new Error(
            "Display saving requires the supported page-reported frame envelope.",
          );
        const bytes: Buffer = Buffer.from(
          png.slice("data:image/png;base64,".length),
          "base64",
        );
        const operation: Promise<void> = queue.then(async (): Promise<void> => {
          await initialize();
          if (canceled || closed || released.has(session))
            throw new Error("The display save was canceled.");
          // A failed retirement must be repaired before publishing another
          // image, rather than accumulating an IO-failure history in output.
          if (
            entries.some(
              (entry: Record<string, unknown>): boolean =>
                entry.released === true && entry.image !== latest,
            )
          )
            await collect();
          const decoded: PNG = await new Promise<PNG>(
            (
              resolve: (value: PNG) => void,
              reject: (error: unknown) => void,
            ): void => {
              new PNG().parse(
                bytes,
                (error: Error | null, parsed: PNG): void =>
                  error === null ? resolve(parsed) : reject(error),
              );
            },
          );
          if (decoded.width !== width || decoded.height !== height)
            throw new Error(
              "The encoded display dimensions disagree with its frame.",
            );
          const prior: Record<string, unknown> | undefined = entries.reduce<
            Record<string, unknown> | undefined
          >(
            (
              previous: Record<string, unknown> | undefined,
              entry: Record<string, unknown>,
            ): Record<string, unknown> | undefined =>
              entry.session === session ? entry : previous,
            undefined,
          );
          if (
            prior !== undefined &&
            (generation < Number(prior.generation) ||
              (generation === prior.generation &&
                sequence <= Number(prior.sequence)))
          )
            throw new Error("The display save was superseded.");
          await fs.mkdir(output, { recursive: true });
          await fs.mkdir(staging, { recursive: true });
          await fs.mkdir(records, { recursive: true });
          const name: string = `current-${props.port}-${session}`;
          const temporary: string = path.join(staging, randomUUID() + ".png");
          const hash: string = createHash("sha256").update(bytes).digest("hex");
          const serverRevisionAtSave: string = props.revision();
          const metadata: Record<string, unknown> = {
            ...value,
            png: undefined,
            sha256: hash,
            savedAt: new Date().toISOString(),
            serverRevisionAtSave,
            stale: revision !== serverRevisionAtSave,
          };
          const identity: string = createHash("sha256")
            .update(JSON.stringify(metadata))
            .digest("hex");
          const image: string = `${name}-${identity}.png`;
          const entry: Record<string, unknown> = {
            session,
            generation,
            sequence,
            image,
            metadata,
            released: false,
          };
          let primary: { error: unknown } | undefined;
          try {
            await fs.writeFile(temporary, bytes);
            await persist(entry);
            if (canceled || closed || released.has(session))
              throw new Error("The display save was canceled.");
            await fs.rename(temporary, path.join(output, image));
            // PNG rename is the publication boundary; cancellation after it
            // cannot undo a completed filesystem commit.
            latest = image;
            if (prior !== undefined) prior.released = true;
            entries.push(entry);
            await collect();
          } catch (error) {
            primary = { error };
            throw error;
          } finally {
            const operations: readonly (() => Promise<void>)[] = [
              async (): Promise<void> => {
                await fs.rm(temporary, { force: true });
              },
            ];
            if (primary === undefined)
              await createAutoMovieResourceRetirement(operations)();
            else await createAutoMovieResourceRetirement(operations, primary)();
          }
        });
        const settled: Promise<void> = operation.catch(
          (): undefined => undefined,
        );
        queue = settled;
        void operation
          .then((): void => {
            response.end();
          })
          .catch(fail);
      } catch (cause) {
        fail(cause);
      }
    });
  };
  const retirement: () => Promise<void> = createAutoMovieResourceRetirement([
    async (): Promise<void> => {
      await queue;
      await initialize();
      for (const entry of entries) entry.released = true;
      await collect();
      released.clear();
    },
  ]);
  return Object.assign(handler, {
    close: (): Promise<void> => {
      closed = true;
      return retirement();
    },
  });
}
