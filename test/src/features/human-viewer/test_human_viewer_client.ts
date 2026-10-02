import { TestValidator } from "@nestia/e2e";

import { rejectsWith } from "../internal/rejectsWith";
import type { IHumanViewerClientIo } from "../../../scripts/human-viewer/IHumanViewerClientIo";
import { connectHumanViewer } from "../../../scripts/human-viewer/connectHumanViewer";

const response = (status: number, body: unknown, headers: Record<string, string> = {}) => ({
  ok: status < 400,
  status,
  headers: { get: (name: string) => headers[name] ?? null },
  json: async () => body,
  arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
});

const fake = (routes: Record<string, ReturnType<typeof response>>) => {
  const calls: string[] = [];
  const written: Record<string, string> = {};
  const copied: Record<string, string> = {};
  const io: IHumanViewerClientIo = {
    fetch: async (url) => {
      calls.push(url);
      const path = url.replace("http://v", "");
      const found = routes[path] ?? routes[path.split("?")[0]!];
      if (found === undefined) throw new Error("no route " + path);
      return found;
    },
    writeInput: (name, data) => {
      written[name] = data;
    },
    copyInput: (name, source) => {
      copied[name] = source;
    },
  };
  return { io, calls, written, copied };
};
const ready = response(200, { service: "automovie-human-viewer", ready: true, renderer: "GPU", revision: "r1" });

/**
 * The client connects to the resident viewer and never guesses about it.
 *
 * Scenarios:
 * 1. A ready viewer gives its renderer and revision; another program on the
 *    port and a viewer that is not ready each refuse, the latter naming the
 *    command that starts it.
 * 2. Dropping documents copies a candidate basis, writes the documents under
 *    the label and rescans; a rescan that rejects that file throws its reason,
 *    a rescan that rejects only another file passes, and a label with a slash
 *    refuses before any write.
 * 3. A render returns the bytes and the server's renderer header (falling back
 *    to the connect-time device without one); a refusal returns the server's
 *    reason; the query carries every field.
 * 4. Parts return the mesh names, and a refusal throws.
 */
export const test_human_viewer_client = async (): Promise<void> => {
  const good = fake({ "/health": ready });
  const viewer = await connectHumanViewer({ io: good.io, origin: "http://v" });
  TestValidator.equals("identity", [viewer.renderer, viewer.revision], ["GPU", "r1"]);
  TestValidator.predicate(
    "foreign and unready",
    (await rejectsWith(
      () =>
        connectHumanViewer({
          io: fake({ "/health": response(200, { service: "other" }) }).io,
          origin: "http://v",
        }),
      "another program",
    )) &&
      (await rejectsWith(
        () =>
          connectHumanViewer({
            io: fake({
              "/health": response(200, {
                service: "automovie-human-viewer",
                ready: false,
              }),
            }).io,
            origin: "http://v",
          }),
        "human-shot.mts ensure",
      )),
  );

  const accepted = fake({
    "/health": ready,
    "/rescan": response(200, { documents: ["file:x/a"], rejected: [{ file: "other.json", reason: "elsewhere" }] }),
  });
  const dropper = await connectHumanViewer({ io: accepted.io, origin: "http://v" });
  await dropper.drop({ label: "x", documents: [{ id: "a" }], candidateBasis: "C:/basis.json.gz" });
  TestValidator.equals(
    "dropped",
    [accepted.written["x.json"], accepted.copied["x.basis.json.gz"]],
    ['[{"id":"a"}]', "C:/basis.json.gz"],
  );
  await dropper.drop({ label: "y", documents: [{ id: "b" }], candidateBasis: null });
  TestValidator.equals("no candidate copied", Object.keys(accepted.copied), ["x.basis.json.gz"]);
  const rejecting = await connectHumanViewer({
    io: fake({
      "/health": ready,
      "/rescan": response(200, { documents: [], rejected: [{ file: "x.json", reason: "names basis q" }] }),
    }).io,
    origin: "http://v",
  });
  TestValidator.predicate(
    "rejection thrown",
    await rejectsWith(() => rejecting.drop({ label: "x", documents: [{ id: "a" }] }), "names basis q"),
  );
  TestValidator.predicate(
    "bad label",
    await rejectsWith(() => dropper.drop({ label: "a/b", documents: [] }), "letters"),
  );

  const drawing = fake({
    "/health": ready,
    "/render": response(200, {}, { "x-renderer": "GPU-2" }),
    "/parts": response(200, [{ name: "Human" }, { name: "Human.tongue01" }]),
  });
  const renderer = await connectHumanViewer({ io: drawing.io, origin: "http://v" });
  const frame = await renderer.render({ doc: "file:x/a", view: "left" });
  TestValidator.predicate(
    "frame",
    frame.ok && frame.renderer === "GPU-2" && frame.bytes.length === 3 &&
      drawing.calls.some((call) => call.includes("doc=file%3Ax%2Fa") && call.includes("view=left")),
  );
  TestValidator.equals("parts", await renderer.parts({ doc: "x" }), ["Human", "Human.tongue01"]);
  const bare = await connectHumanViewer({
    io: fake({ "/health": ready, "/render": response(200, {}) }).io,
    origin: "http://v",
  });
  const fallback = await bare.render({ doc: "x" });
  TestValidator.predicate("fallback renderer", fallback.ok && fallback.renderer === "GPU");
  const anonymous = await connectHumanViewer({
    io: fake({ "/health": response(200, { service: "automovie-human-viewer", ready: true }), "/render": response(200, {}) }).io,
    origin: "http://v",
  });
  const unnamed = await anonymous.render({ doc: "x" });
  TestValidator.equals("no device reported", [anonymous.renderer, anonymous.revision, unnamed.ok && unnamed.renderer], ["", "", ""]);
  const refusing = await connectHumanViewer({
    io: fake({ "/health": ready, "/render": response(422, { error: "Unknown mesh: q" }), "/parts": response(422, { error: "nope" }) }).io,
    origin: "http://v",
  });
  TestValidator.equals("refusal reason", await refusing.render({ doc: "x" }), { ok: false, error: "Unknown mesh: q" });
  TestValidator.predicate(
    "parts refusal",
    await rejectsWith(() => refusing.parts({ doc: "x" }), "nope"),
  );
};
