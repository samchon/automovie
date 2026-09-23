import {
  type HumanResidentPort,
  createHumanResidentWorker,
} from "@automovie/playground/src/human/residentWorker";
import { TestValidator } from "@nestia/e2e";

/**
 * A resident worker keeps compiled state while requests retain independent fate.
 * All ordering is controlled by in-memory messages, without timers or threads.
 *
 * Scenarios:
 * 1. Concurrent replies arrive out of order through one worker.
 * 2. Numerical refusal and cancellation do not destroy the worker.
 * 3. Transport failure rejects all pending requests; late callbacks are ignored.
 * 4. Send/factory exceptions recover; disposal refuses future work.
 */
export const test_subject_human_resident_worker = async (): Promise<void> => {
  type Port = HumanResidentPort<string, number>;
  const ports: (Port & {
    sent: { id: number; input: string }[];
    stopped: number;
  })[] = [];
  let failure: "factory" | "send" | null = null;
  const runtime = createHumanResidentWorker<string, number>(() => {
    if (failure === "factory") throw new Error("allocation failed");
    const port: (typeof ports)[number] = {
      onmessage: null,
      onerror: null,
      stopped: 0,
      sent: [],
      postMessage: (message) => {
        if (failure === "send") {
          const externalFailure: unknown = "send failed";
          throw externalFailure;
        }
        port.sent.push(message);
      },
      terminate: () => {
        port.stopped++;
      },
    };
    ports.push(port);
    return port;
  });
  const result = (request: ReturnType<typeof runtime.request>) =>
    request.result.catch((error: unknown) => (error as Error).message);
  const a = runtime.request("a"),
    b = runtime.request("b");
  const ar = result(a),
    br = result(b);
  const port = ports[0];
  TestValidator.equals("one preparation", ports.length, 1);
  port.onmessage!({ data: { id: port.sent[1].id, success: true, value: 20 } });
  port.onmessage!({ data: { id: port.sent[0].id, success: true, value: 10 } });
  TestValidator.equals(
    "correlated order",
    await Promise.all([ar, br]),
    [10, 20],
  );
  a.cancel();
  port.onmessage!({ data: { id: 999, success: true, value: 99 } });
  const c = runtime.request("invalid"),
    cr = result(c);
  port.onmessage!({
    data: { id: port.sent[2].id, success: false, error: "invalid value" },
  });
  TestValidator.equals("local refusal", await cr, "invalid value");
  const d = runtime.request("obsolete"),
    dr = result(d);
  d.cancel();
  port.onmessage!({ data: { id: port.sent[3].id, success: true, value: 40 } });
  TestValidator.equals(
    "withdrawn reply",
    await dr,
    "Superseded by a newer face request.",
  );
  TestValidator.equals("worker remains resident", port.stopped, 0);
  const er = result(runtime.request("e")),
    fr = result(runtime.request("f"));
  port.onerror!({ message: "   " });
  TestValidator.equals("all pending fail", await Promise.all([er, fr]), [
    "The face worker failed.",
    "The face worker failed.",
  ]);
  TestValidator.equals("failed transport stopped", port.stopped, 1);
  const g = runtime.request("recovery"),
    gr = result(g);
  const recovered = ports[1];
  port.onerror!({ message: "late failure" });
  port.onmessage!({
    data: { id: recovered.sent[0].id, success: true, value: -1 },
  });
  recovered.onmessage!({
    data: { id: recovered.sent[0].id, success: true, value: 70 },
  });
  TestValidator.equals("late old connection ignored", await gr, 70);
  const hr = result(runtime.request("h"));
  recovered.onerror!({ message: "device failed" });
  TestValidator.equals("error detail", await hr, "device failed");
  failure = "factory";
  TestValidator.equals(
    "factory refusal",
    await result(runtime.request("i")),
    "allocation failed",
  );
  failure = "send";
  TestValidator.equals(
    "non-error send refusal",
    await result(runtime.request("j")),
    "send failed",
  );
  failure = null;
  const kr = result(runtime.request("k"));
  runtime.dispose();
  TestValidator.equals(
    "dispose pending",
    await kr,
    "The face worker has been disposed.",
  );
  runtime.dispose();
  TestValidator.equals(
    "closed admission",
    await result(runtime.request("l")),
    "The face worker has been disposed.",
  );
};
