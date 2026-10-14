import type { ITest12MotionDocument } from "./ITest12MotionDocument";
import { test12MotionRejectsDocument } from "./test12MotionRejectsDocument";
import { test12MotionDocument } from "./test12MotionDocument";

/**
 * Mutate a fresh authored motion document, then require the inspector refusal named by the owning case.
 */
export function test12MotionRejectsMutation(mutate: (document: ITest12MotionDocument) => void, message: string): boolean {
  const document: ITest12MotionDocument = test12MotionDocument();
  mutate(document);
  return test12MotionRejectsDocument(document, message);
}
