import { throwsError } from "../predicates";
import type { ITest12MotionDocument } from "./ITest12MotionDocument";
import { test12MotionFixture } from "./test12MotionFixture";
import { test12MotionInspect } from "./test12MotionInspect";

/**
 * Mutate fresh resident payload bytes while preserving the JSON declaration, then observe the inspector's diagnostic.
 */
export function test12MotionRejectsPayloadMutation(
  mutate: (payload: Buffer) => void,
  message: string,
): boolean {
  const fixture: {
    document: ITest12MotionDocument;
    bytes: Buffer<ArrayBuffer>;
    payload: Buffer<ArrayBuffer>;
    cubicRotation: number[];
  } = test12MotionFixture();
  mutate(fixture.payload);
  return throwsError(
    (): import("@automovie/ingest").IAutoMovieExternalModelInspection =>
      test12MotionInspect(fixture),
    message,
  );
}
