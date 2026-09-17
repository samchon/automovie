import { readConnectedFaceAsset } from "@automovie/playground/src/human/connectedAsset";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";

/**
 * The selected-asset adapter sequences IO without resolving document-supplied URLs.
 *
 * Scenarios:
 * 1. Successful transport hands the exact bytes to decoding, then returns JSON.
 * 2. Transport, body, decode and JSON failures propagate; HTTP errors never decode.
 */
export const test_subject_connected_asset = async (): Promise<void> => {
  const bytes = new ArrayBuffer(4),
    basis = humanFaceBasisFixture().basis;
  const calls: string[] = [];
  const read = async () => ({
    ok: true,
    status: 200,
    arrayBuffer: async () => {
      calls.push("body");
      return bytes;
    },
  });
  TestValidator.equals(
    "decoded asset",
    await readConnectedFaceAsset({
      read,
      decode: async (received) => {
        calls.push("decode");
        TestValidator.equals("same transport bytes", received === bytes, true);
        return JSON.stringify(basis);
      },
    }),
    basis,
  );
  TestValidator.equals("IO sequence", calls, ["body", "decode"]);
  const failure = new Error("transport");
  await TestValidator.error("transport failure", () =>
    readConnectedFaceAsset({
      read: async () => {
        throw failure;
      },
      decode: async () => "",
    }),
  );
  let decoded = false;
  await TestValidator.error("HTTP failure", () =>
    readConnectedFaceAsset({
      read: async () => ({
        ok: false,
        status: 404,
        arrayBuffer: async () => bytes,
      }),
      decode: async () => {
        decoded = true;
        return "";
      },
    }),
  );
  TestValidator.equals("no decode after HTTP refusal", decoded, false);
  await TestValidator.error("body failure", () =>
    readConnectedFaceAsset({
      read: async () => ({
        ok: true,
        status: 200,
        arrayBuffer: async () => {
          throw failure;
        },
      }),
      decode: async () => "",
    }),
  );
  await TestValidator.error("decode failure", () =>
    readConnectedFaceAsset({
      read,
      decode: async () => {
        throw failure;
      },
    }),
  );
  await TestValidator.error("JSON failure", () =>
    readConnectedFaceAsset({ read, decode: async () => "{" }),
  );
};
