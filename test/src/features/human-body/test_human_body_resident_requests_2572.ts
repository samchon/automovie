import { createConnectedBodyPort } from "@automovie/playground/src/human/connectedBodyPort";
import { createConnectedBodyPreview } from "@automovie/playground/src/human/connectedBodyPreview";
import type {
  ConnectedBodyRequest,
  ConnectedBodyResult,
} from "@automovie/playground/src/human/connectedBodyProtocol";
import type { createConnectedBodyRenderer } from "@automovie/playground/src/human/connectedBodyRenderer";
import type {
  HumanResidentPort,
  HumanResidentReply,
} from "@automovie/playground/src/human/residentWorker";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { rejectsError } from "../internal/predicates";

type Port = HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult>;
type Envelope = { id: number; input: ConnectedBodyRequest };
const previewResult = {
  operation: "preview",
  model: { parts: [] },
  crossings: null,
  extras: {},
} as unknown as ConnectedBodyResult;

/** Correlated results, cancellation, transport recovery and explicit export. */
export const test_human_body_resident_requests_2572 =
  async (): Promise<void> => {
    const { document } = humanBodyBasisFixture();
    const ports: Array<Port & { sent: Envelope[]; stopped: boolean }> = [];
    const factory = (): Port => {
      const port: Port & { sent: Envelope[]; stopped: boolean } = {
        onmessage: null,
        onerror: null,
        sent: [],
        stopped: false,
        postMessage(request) {
          this.sent.push(request);
        },
        terminate() {
          this.stopped = true;
        },
      };
      ports.push(port);
      return port;
    };
    const disposed: unknown[] = [];
    let resume: (() => void) | undefined;
    const renderer = {
      prepare: async () => {
        if (resume !== undefined)
          await new Promise<undefined>((resolve) => {
            resume = () => resolve(undefined);
          });
        return { resident: {}, model: {} };
      },
      dispose: (frame: unknown) => {
        disposed.push(frame);
      },
    } as unknown as ReturnType<typeof createConnectedBodyRenderer>;
    const preview = createConnectedBodyPreview({ worker: factory, renderer });
    const first = preview.build(document);
    const old = ports[0].sent[0];
    const second = preview.build({ ...document, shape: { width: 1 } });
    TestValidator.predicate(
      "two edits share one worker and the first rejects",
      ports.length === 1 &&
        ports[0].sent.length === 2 &&
        (await rejectsError(() => first, "Superseded")),
    );
    ports[0].onmessage?.({
      data: { id: old.id, success: true, value: previewResult },
    });
    const current = ports[0].sent[1];
    ports[0].onmessage?.({
      data: { id: current.id, success: true, value: previewResult },
    });
    TestValidator.equals("newer reply is returned", (await second).parts, 0);
    TestValidator.predicate("normal edit retains worker", !ports[0].stopped);
    const exported = preview.export(document);
    const exportRequest = ports[0].sent[2];
    TestValidator.equals(
      "export is its own operation",
      exportRequest.input.operation,
      "export",
    );
    ports[0].onmessage?.({
      data: {
        id: exportRequest.id,
        success: true,
        value: { operation: "export", glb: new Uint8Array([1, 2]) },
      },
    });
    TestValidator.equals("export bytes", Array.from(await exported), [1, 2]);
    const failed = preview.build(document);
    ports[0].onerror?.({ message: "lost worker" });
    TestValidator.predicate(
      "failure settles pending build",
      await rejectsError(() => failed, "lost worker"),
    );
    const recovered = preview.build(document);
    TestValidator.predicate(
      "next build allocates one replacement",
      ports.length === 2 && ports[0].stopped,
    );
    const recoveryRequest = ports[1].sent[0];
    ports[0].onmessage?.({
      data: { id: recoveryRequest.id, success: true, value: previewResult },
    });
    ports[1].onmessage?.({
      data: { id: recoveryRequest.id, success: true, value: previewResult },
    });
    await recovered;
    const stale = preview.build(document);
    resume = () => {};
    const staleRequest = ports[1].sent[1];
    ports[1].onmessage?.({
      data: { id: staleRequest.id, success: true, value: previewResult },
    });
    await Promise.resolve();
    const resolvePreparation = resume;
    preview.cancel();
    resolvePreparation?.();
    TestValidator.predicate(
      "cancel during frame preparation disposes it",
      (await rejectsError(() => stale, "Superseded")) && disposed.length === 1,
    );
    const wrong = preview.build(document);
    const wrongRequest = ports[1].sent[2];
    ports[1].onmessage?.({
      data: {
        id: wrongRequest.id,
        success: true,
        value: { operation: "export", glb: new Uint8Array() },
      },
    });
    TestValidator.predicate(
      "wrong result kind rejects",
      await rejectsError(() => wrong, "Expected a numerical body preview"),
    );
    const wrongFile = preview.export(document);
    const wrongFileRequest = ports[1].sent[3];
    ports[1].onmessage?.({
      data: { id: wrongFileRequest.id, success: true, value: previewResult },
    });
    TestValidator.predicate(
      "preview reply cannot be downloaded as a file",
      await rejectsError(() => wrongFile, "Expected an exported body file"),
    );
    const refused = preview.build(document);
    const refusedRequest = ports[1].sent[4];
    ports[1].onmessage?.({
      data: {
        id: refusedRequest.id,
        success: false,
        error: "bad body document",
      },
    });
    TestValidator.predicate(
      "numerical refusal stays on its own request",
      await rejectsError(() => refused, "bad body document"),
    );
    const native = {
      onmessage: null as Worker["onmessage"],
      onerror: null as Worker["onerror"],
      onmessageerror: null as Worker["onmessageerror"],
      postMessage: (_request: unknown) => {},
      terminate: () => {},
    };
    const adapter = createConnectedBodyPort(native);
    let observed: HumanResidentReply<ConnectedBodyResult> | undefined;
    let error = "";
    adapter.onmessage = (event) => {
      observed = event.data;
    };
    adapter.onerror = (event) => {
      error = event.message;
    };
    (native.onmessage as ((event: MessageEvent) => void) | null)?.({
      data: { id: 9, success: true, value: previewResult },
    } as MessageEvent);
    (native.onerror as ((event: ErrorEvent) => void) | null)?.({
      message: "native error",
    } as ErrorEvent);
    TestValidator.predicate(
      "native event adapter keeps reply and error",
      observed?.id === 9 && error === "native error",
    );
    const emptyNative = { ...native };
    const emptyPort = createConnectedBodyPort(emptyNative);
    emptyPort.onerror = (event) => {
      error = event.message;
    };
    (emptyNative.onerror as ((event: ErrorEvent) => void) | null)?.({
      message: " ",
    } as ErrorEvent);
    TestValidator.equals(
      "empty native error names the body",
      error,
      "The body worker failed.",
    );
    const unreadableNative = { ...native };
    const unreadablePort = createConnectedBodyPort(unreadableNative);
    unreadablePort.onerror = (event) => {
      error = event.message;
    };
    (
      unreadableNative.onmessageerror as ((event: MessageEvent) => void) | null
    )?.({} as MessageEvent);
    TestValidator.equals(
      "unreadable reply names the body",
      error,
      "The body worker reply could not be read.",
    );
    const pendingFile = preview.export(document);
    preview.disposeWorker();
    TestValidator.predicate(
      "final disposal settles a pending export",
      await rejectsError(() => pendingFile, "disposed"),
    );
    TestValidator.predicate(
      "final disposal terminates worker",
      ports[1].stopped,
    );
  };
