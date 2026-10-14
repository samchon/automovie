import { throwsError } from "../predicates";
import type { ITest12MotionDocument } from "./ITest12MotionDocument";
import { test12MotionInspect } from "./test12MotionInspect";
import { test12MotionFixture } from "./test12MotionFixture";

/**
 * Observe the inspector's named refusal for an authored malformed document using fresh fixture bytes.
 */
export function test12MotionRejectsDocument(document: ITest12MotionDocument, message: string): boolean {
  const fixture: { document: ITest12MotionDocument; bytes: Buffer<ArrayBuffer>; payload: Buffer<ArrayBuffer>; cubicRotation: number[]; } = test12MotionFixture(document);
  return throwsError((): import("../../../../../packages/ingest/src/IAutoMovieExternalModelInspection").IAutoMovieExternalModelInspection => test12MotionInspect(fixture), message);
}
