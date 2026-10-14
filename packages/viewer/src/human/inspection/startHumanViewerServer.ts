import fs from "node:fs";
import path from "node:path";
import type { ViteDevServer } from "vite";

import { createAutoMovieResourceRetirement } from "../../createAutoMovieResourceRetirement.js";
import { ProcessOwnership } from "../../process/ProcessOwnership.js";
import type { IStartHumanViewerServerProps } from "./IStartHumanViewerServerProps.js";
import { humanViewerLaunch } from "./humanViewerLaunch.js";
import { judgeViewerRenderer } from "./judgeViewerRenderer.js";
import { subscribeHumanViewerSources } from "./subscribeHumanViewerSources.js";
import { writeHumanViewerRecord } from "./writeHumanViewerRecord.js";

/**
 * Own one server's listening socket, source subscription and shutdown. The launcher retains its public process record; a directly started server owns its own record. Readiness requires reported page readiness and the existing renderer-text policy, whose generic fallback acceptance does not independently prove hardware or display operation. Only after owning its listening socket does it publish an empty compilation report bound to its actual OS creation. The previous owner's failure or success cannot become this process's startup authority; model inputs, PNGs and historical logs remain separate from this per-owner status.
 *
 * @evidence contracts/common.md#principled-implementation Owns Vite listening, exact source subscription and optional own process record; startup requires reported first-page readiness and existing renderer-string classification, without independently proving hardware.
 * @evidence contracts/common.md#clear-and-simple-design One shared retirement joins subscription, source, renderer, own record, Vite and owned signal bindings without another server or shutdown framework.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A launcher-owned record is not deleted by the server, previous source status is replaced only after this process owns its socket and failure never promotes software rendering to readiness.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes launcher/direct record ownership, actual process creation, startup authority and independent failure shutdown.
 * @evidence contracts/performance.md#efficient-algorithms Startup has fixed coordination plus actual Vite/compiler/browser work, while watcher batches retain their existing graph costs and each retirement operation is asked once.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated or reentrant shutdown shares one completion; each new server owns distinct listening and browser effects rather than reusing an old process's status.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Startup failure or signals request every acquired owner independently, remove only the server's own record and signals and suppress late startup publication; public cleanup completion is not independent physical GPU proof.
 */
export async function startHumanViewerServer(
  props: IStartHumanViewerServerProps,
): Promise<void> {
  const {
    source,
    instance,
    owner,
  }: Pick<IStartHumanViewerServerProps, "source" | "instance" | "owner"> =
    props;
  let vite: ViteDevServer | undefined;
  let stopSources: (() => void) | undefined;
  let ownsRecord: boolean = false;
  let stopping: boolean = false;
  const record: string = path.join(source.storage, instance.record);
  const retire: () => Promise<void> = createAutoMovieResourceRetirement([
    (): void => {
      stopping = true;
      stopSources?.();
    },
    source.close,
    props.closeRenderer,
    (): void => {
      if (ownsRecord) fs.rmSync(record, { force: true });
    },
    async (): Promise<void> => {
      if (vite !== undefined) await vite.close();
    },
    (): void => {
      process.off("SIGINT", signal);
      process.off("SIGTERM", signal);
    },
  ]);
  function signal(): void {
    stopping = true;
    void retire()
      .then((): void => {
        process.exit(0);
      })
      .catch((error: unknown): void => {
        console.error(error);
        process.exit(1);
      });
  }
  try {
    vite = await props.createVite();
    process.once("SIGINT", signal);
    process.once("SIGTERM", signal);
    await vite.listen();
    if (stopping) throw new Error("Viewer startup was stopped.");
    const processStartedAt: ReturnType<typeof ProcessOwnership.read> =
      ProcessOwnership.read(process.pid);
    if (processStartedAt === null)
      throw new Error("The listening viewer has no process creation identity.");
    fs.mkdirSync(source.storage, { recursive: true });
    fs.writeFileSync(
      path.join(source.storage, instance.sourceStatus),
      JSON.stringify({
        pid: process.pid,
        processStartedAt,
        error: null,
        goodAt: null,
      }),
    );
    if (owner === null) {
      writeHumanViewerRecord(record, instance.port);
      ownsRecord = true;
    } else {
      const address:
        | ReturnType<NonNullable<ViteDevServer["httpServer"]>["address"]>
        | undefined = vite.httpServer?.address();
      if (
        address === null ||
        address === undefined ||
        typeof address === "string"
      )
        throw new Error(
          "The development server did not report its internal port",
        );
      console.log(humanViewerLaunch.upstreamPrefix + address.port);
    }
    fs.mkdirSync(source.inputsDirectory, { recursive: true });
    const activeVite: ViteDevServer = vite;
    stopSources = subscribeHumanViewerSources({
      ...props.watching,
      source,
      add: (files: string[]): void => {
        activeVite.watcher.add(files);
      },
      watch: (
        changed: (event: string, input: string) => void,
      ): (() => void) => {
        activeVite.watcher.on("all", changed);
        return (): void => {
          activeVite.watcher.off("all", changed);
        };
      },
      browser: props.publishRevision,
    });
    props.phase("launching the browser");
    await Promise.all([props.openPage(), props.firstReady]);
    if (stopping) throw new Error("Viewer startup was stopped.");
    props.phase("ready");
    if (!judgeViewerRenderer(props.renderer()).real)
      throw new Error("Software renderer refused");
    props.ready();
    console.log("human-viewer ready " + instance.origin + "/view", process.pid);
  } catch (error) {
    return createAutoMovieResourceRetirement([retire], { error })();
  }
}
