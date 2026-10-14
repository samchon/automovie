import type { ITest12MotionDocument } from "./ITest12MotionDocument";
import { test12MotionDocument } from "./test12MotionDocument";

/**
 * Return the existing motion fixture declaration with its animation inventory empty, preserving the negative profile case.
 */
export function test12MotionWithoutAnimation(): ITest12MotionDocument {
  const document: ITest12MotionDocument = test12MotionDocument();
  document.animations = [];
  return document;
}
