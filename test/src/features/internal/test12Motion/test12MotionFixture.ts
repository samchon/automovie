import type { ITest12MotionDocument } from "./ITest12MotionDocument";
import { test12MotionDocument } from "./test12MotionDocument";

/**
 * Encode the existing authored keyframes and declaration as resident motion bytes; each call owns new payload and JSON buffers.
 */
export function test12MotionFixture(document: ITest12MotionDocument = test12MotionDocument()): { document: ITest12MotionDocument; bytes: Buffer<ArrayBuffer>; payload: Buffer<ArrayBuffer>; cubicRotation: number[]; } {
  const cubicRotation: number[] = [
    0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
  ];
  const arrays: number[][] = [
    [0, 1],
    cubicRotation,
    [0, 0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 1],
  ];
  const payload: Buffer<ArrayBuffer> = Buffer.concat(
    arrays.map((values: number[]): Buffer<ArrayBuffer> => {
      const bytes: Buffer<ArrayBuffer> = Buffer.alloc(values.length * 4);
      values.forEach((value: number, index: number): void => { bytes.writeFloatLE(value, index * 4); });
      return bytes;
    }),
  );
  document.buffers![0]!.byteLength = payload.byteLength;
  return {
    document,
    bytes: Buffer.from(JSON.stringify(document), "utf8"),
    payload,
    cubicRotation,
  };
}
