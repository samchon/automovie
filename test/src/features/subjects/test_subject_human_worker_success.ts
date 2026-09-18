import type { IAutoMovieModelCrossing } from "@automovie/engine";
import { createHumanFaceWorkerHandler } from "@automovie/playground/src/human/workerHandler";
import { TestValidator } from "@nestia/e2e";

/**
 * A worker exports the model built from its parsed document and transfers the
 * exact exported buffer, while awaiting export before sending any reply.
 *
 * The crossing reading is part of that one reply, and the reply distinguishes
 * "not asked" from "clear": an unrequested reading, and a request no installed
 * measure can answer, both send no reading rather than an empty list, because a
 * caller acting on an empty list would be acting on a check that never ran.
 *
 * Scenarios:
 * 1. Hand-written document and model tokens pin parse/build/export ordering.
 * 2. A held export produces no reply; completion publishes its bytes and count.
 * 3. Empty parts are counted without manufacturing geometry.
 * 4. An unrequested reading is absent, not empty, and the measure is not run.
 * 5. A requested reading is measured from the built model and published.
 * 6. A request no installed measure can answer is absent rather than empty.
 */
export const test_subject_human_worker_success = async (): Promise<void> => {
  for (const parts of [[], [1, 2]]) {
    const document = { id: "face" };
    const model = { parts };
    const glb = new Uint8Array([1, 2, 3]);
    const gltf = { json: { asset: { version: "2.0" } }, resources: {} };
    let complete!: (artifact: { glb: typeof glb; gltf: typeof gltf }) => void;
    const exported = new Promise<{ glb: typeof glb; gltf: typeof gltf }>(
      (resolve) => {
        complete = resolve;
      },
    );
    const calls: string[] = [];
    const replies: unknown[] = [];
    const transfers: (ArrayBuffer[] | undefined)[] = [];
    const handle = createHumanFaceWorkerHandler({
      parse: (text) => {
        TestValidator.equals("parse input", text, "serialized");
        calls.push("parse");
        return document;
      },
      build: (input) => {
        TestValidator.predicate("parsed identity", input === document);
        calls.push("build");
        return model;
      },
      measure: () => {
        calls.push("measure");
        return [];
      },
      export: (input) => {
        TestValidator.predicate("built identity", input === model);
        calls.push("export");
        return exported;
      },
      send: (reply, transfer) => {
        replies.push(reply);
        transfers.push(transfer);
      },
    });
    const pending = handle("serialized");
    TestValidator.equals(
      "ordered synchronous admission and construction",
      calls,
      ["parse", "build", "export"],
    );
    TestValidator.equals("no partial reply", replies, []);
    complete({ glb, gltf });
    await pending;
    TestValidator.equals("one complete result", replies, [
      {
        success: true,
        document,
        glb,
        gltf,
        parts: parts.length,
        crossings: null,
      },
    ]);
    TestValidator.equals(
      "an unrequested reading does not run the measure",
      calls,
      ["parse", "build", "export"],
    );
    TestValidator.predicate(
      "exact export buffer transferred",
      transfers.length === 1 &&
        transfers[0]?.length === 1 &&
        transfers[0][0] === glb.buffer,
    );
  }

  const crossing: IAutoMovieModelCrossing = {
    part: "skin",
    other: "teeth",
    triangles: 3,
    otherTriangles: 4,
    coplanar: 0,
  };
  const model = { parts: [1] };
  const artifact = {
    glb: new Uint8Array([9]),
    gltf: { json: { asset: { version: "2.0" } }, resources: {} },
  };
  const reading = (measure?: (input: typeof model) => IAutoMovieModelCrossing[]) => {
    const replies: unknown[] = [];
    return {
      replies,
      handle: createHumanFaceWorkerHandler({
        parse: () => ({ id: "face" }),
        build: () => model,
        measure,
        export: async () => artifact,
        send: (reply) => {
          replies.push(reply);
        },
      }),
    };
  };
  const asked = reading((input) => {
    TestValidator.predicate("the reading is taken from the built model", input === model);
    return [crossing];
  });
  await asked.handle("serialized", true);
  TestValidator.equals(
    "a requested reading is published with the artifact",
    (asked.replies[0] as { crossings: unknown }).crossings,
    [crossing],
  );
  const silent = reading();
  await silent.handle("serialized", true);
  TestValidator.equals(
    "a request no measure can answer is absent rather than empty",
    (silent.replies[0] as { crossings: unknown }).crossings,
    null,
  );
};
