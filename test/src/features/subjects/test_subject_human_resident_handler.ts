import { createHumanResidentHandler } from "@automovie/playground/src/human/residentHandler";
import type { HumanResidentReply } from "@automovie/playground/src/human/residentWorker";
import { TestValidator } from "@nestia/e2e";

/**
 * Worker preparation and evaluation failures answer their initiating request.
 *
 * Scenarios:
 * 1. A prepared numerical operation returns its value and exact request ID.
 * 2. Error objects and thrown strings produce local refusals.
 * 3. Failed initialization answers queued work without attempting evaluation.
 * 4. A failed success transport is reported as that request's refusal.
 */
export const test_subject_human_resident_handler = async (): Promise<void> => {
  const replies: HumanResidentReply<number>[] = [];
  const handle = createHumanResidentHandler({
    prepare: Promise.resolve(async (value: number) => {
      if (value < 0) throw new Error("negative");
      if (value === 0) {
        const externalFailure: unknown = "zero";
        throw externalFailure;
      }
      return value * 2;
    }),
    send: (reply) => {
      replies.push(reply);
    },
  });
  await Promise.all([
    handle({ id: 8, input: 3 }),
    handle({ id: 4, input: -1 }),
    handle({ id: 9, input: 0 }),
  ]);
  TestValidator.equals("correlated evaluation", replies, [
    { id: 8, success: true, value: 6 },
    { id: 4, success: false, error: "negative" },
    { id: 9, success: false, error: "zero" },
  ]);
  const broken = createHumanResidentHandler<number, number>({
    prepare: Promise.reject(new Error("basis unavailable")),
    send: (reply) => {
      replies.push(reply);
    },
  });
  await broken({ id: 11, input: 4 });
  TestValidator.equals("preparation refusal", replies[3], {
    id: 11,
    success: false,
    error: "basis unavailable",
  });
  const transport = createHumanResidentHandler({
    prepare: Promise.resolve(async (value: number) => value),
    send: (reply) => {
      if (reply.success) throw new Error("transfer failed");
      replies.push(reply);
    },
  });
  await transport({ id: 12, input: 5 });
  TestValidator.equals("transport refusal", replies[4], {
    id: 12,
    success: false,
    error: "transfer failed",
  });
};
