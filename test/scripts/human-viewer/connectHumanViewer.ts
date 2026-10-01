import type { IHumanViewerClientIo } from "./IHumanViewerClientIo";
import type { IHumanViewerClient } from "./IHumanViewerClient";
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
 * false` with the server's reason. Pure over `io`.
 */
export async function connectHumanViewer(props: {
  io: IHumanViewerClientIo;
  origin: string;
}): Promise<IHumanViewerClient> {
  const { io, origin } = props;
  const health = await io.fetch(origin + "/health");
  const status = (await health.json()) as {
    service?: string;
    ready?: boolean;
    renderer?: string;
    revision?: string;
  };
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
      const scan = (await (await io.fetch(origin + "/rescan")).json()) as {
        rejected: { file: string; reason: string }[];
      };
      const refused = scan.rejected.find((entry) => entry.file === label + ".json");
      if (refused !== undefined) throw new Error(refused.reason);
    },
    parts: async (fields) => {
      const response = await io.fetch(
        origin + "/parts?" + new URLSearchParams(fields).toString(),
      );
      if (!response.ok)
        throw new Error(((await response.json()) as { error: string }).error);
      return ((await response.json()) as { name: string }[]).map(
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
          error: ((await response.json()) as { error: string }).error,
        };
      return {
        ok: true,
        bytes: Buffer.from(await response.arrayBuffer()),
        renderer: response.headers.get("x-renderer") ?? status.renderer ?? "",
      };
    },
  };
}
