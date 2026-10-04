import type { IHumanViewerClientIo } from "./IHumanViewerClientIo";
import type { IHumanViewerClient } from "./IHumanViewerClient";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue";
import type { IConnectHumanViewerProps } from "./IConnectHumanViewerProps";
import type { IHumanShotHealth } from "./IHumanShotHealth";
import type { IHumanViewerErrorBody } from "./IHumanViewerErrorBody";
import type { IHumanViewerPartEntry } from "./IHumanViewerPartEntry";
import { retryHumanViewerFetch } from "./retryHumanViewerFetch";
/**
 * Connect to the resident development viewer and return a client over it.
 *
 * The viewer is a session-owned server this client never starts or stops: it
 * refuses when the port answers as another program or the server is not ready,
 * naming the command that starts it. Hand-written input is placed in the
 * inputs directory and announced with `/rescan`, which answers the documents it
 * accepted and the files it rejected, so a document the numerical builder's
 * basis check refuses is reported here and not as a blank frame later. A frame
 * is the PNG the server drew on its real GPU; a refusal comes back as `ok:
 * false` with the server's reason. A frame the server marks stale, drawn by
 * the last good generation while the current source failed or is still
 * rebuilding, is also `ok: false`: it is not an observation of the current
 * source, so no record may count it as one. Pure over `io`.
 */
export async function connectHumanViewer(props: IConnectHumanViewerProps): Promise<IHumanViewerClient> {
  const { origin } = props;
  // A loaded server resets kept-alive sockets; every route is safe to ask again.
  const io: IHumanViewerClientIo = {
    ...props.io,
    fetch: (url) =>
      retryHumanViewerFetch(() => props.io.fetch(url), {
        attempts: 3,
        pause: (ms) => new Promise<undefined>((resolve) => { setTimeout(resolve, ms); }),
      }),
  };
  const health = await io.fetch(origin + "/health");
  const status = (await health.json()) as Partial<IHumanShotHealth>;
  if (status.service !== "automovie-human-viewer")
    throw new Error("The port belongs to another program");
  if (status.ready !== true)
    throw new Error(
      "The resident viewer is not ready; start it with human-shot.mts ensure.",
    );
  return {
    renderer: status.renderer ?? "",
    revision: status.revision ?? "",
    drop: async ({ label, documents, candidateBasis }) => {
      if (!/^[A-Za-z0-9._-]+$/.test(label))
        throw new Error("An input label uses letters, digits, dots, dashes and underscores");
      if (candidateBasis !== undefined && candidateBasis !== null)
        io.copyInput(label + ".basis.json.gz", candidateBasis);
      io.writeInput(label + ".json", JSON.stringify(documents));
      // A refusal fails the drop with its reason. A pending input (the
      // server's page is not ready to admit it yet) is asked about again
      // until it is decided; it is never taken as accepted or as refused.
      for (;;) {
        const scan = (await (await io.fetch(origin + "/rescan")).json()) as Pick<IHumanViewerCatalogue, "rejected">;
        const entries = scan.rejected.filter((entry) => entry.file === label + ".json");
        const refused = entries.find((entry) => !entry.pending);
        if (refused !== undefined) throw new Error(refused.reason);
        if (entries.length === 0) return;
        await new Promise<undefined>((resolve) => { setTimeout(resolve, 1000); });
      }
    },
    parts: async (fields) => {
      const response = await io.fetch(
        origin + "/parts?" + new URLSearchParams(fields).toString(),
      );
      if (!response.ok)
        throw new Error(((await response.json()) as IHumanViewerErrorBody).error);
      return ((await response.json()) as IHumanViewerPartEntry[]).map(
        (part) => part.name,
      );
    },
    render: async (fields) => {
      const response = await io.fetch(
        origin + "/render?" + new URLSearchParams(fields).toString(),
      );
      if (!response.ok)
        return {
          ok: false,
          error: ((await response.json()) as IHumanViewerErrorBody).error,
        };
      if (response.headers.get("x-human-stale") === "true")
        return {
          ok: false,
          error: `Stale frame: drawn by revision ${response.headers.get("x-human-revision") ?? "unknown"}, not the current source`,
        };
      return {
        ok: true,
        bytes: Buffer.from(await response.arrayBuffer()),
        renderer: response.headers.get("x-renderer") ?? status.renderer ?? "",
      };
    },
  };
}
