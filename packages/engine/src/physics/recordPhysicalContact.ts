import type {
  IAutoMovieContactReceipt,
  IAutoMovieRecordPhysicalContact,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/** Merge core and compliant-surface impulses into one shape-pair episode. */
export function recordPhysicalContact(
  input: IAutoMovieRecordPhysicalContact.IInput,
): IAutoMovieContactReceipt {
  const aKey: string = JSON.stringify(input.a);
  const bKey: string = JSON.stringify(input.b);
  const forward: boolean = aKey < bKey;
  const key: string = JSON.stringify(forward ? [aKey, bKey] : [bKey, aKey]);
  const normal: IAutoMovieVector3 = Vector3.scale(
    input.normal,
    forward ? 1 : -1,
  );
  const actual: { a: number; b: number } = input.appliedImpulse ?? {
    a: input.impulse,
    b: input.impulse,
  };
  const appliedImpulse: typeof actual = forward
    ? { ...actual }
    : { a: actual.b, b: actual.a };
  input.found.add(key);
  let receipt: IAutoMovieContactReceipt | undefined = input.active.get(key);
  if (!receipt) {
    receipt = {
      id: `contact:${key}:${input.seconds}:${input.contacts.length}`,
      source: "solver",
      seconds: input.seconds,
      endSeconds: input.seconds,
      a: { ...(forward ? input.a : input.b) },
      b: { ...(forward ? input.b : input.a) },
      point: { ...input.point },
      normal,
      impulse: 0,
      separation: input.separation,
      compression: 0,
      samples: [],
    };
    input.active.set(key, receipt);
    input.contacts.push(receipt);
  }
  receipt.endSeconds = input.seconds;
  receipt.impulse = (receipt.impulse ?? 0) + input.impulse;
  receipt.separation = Math.min(receipt.separation, input.separation);
  receipt.compression = Math.max(receipt.compression, -input.separation);
  const sample:
    | NonNullable<IAutoMovieContactReceipt["samples"]>[number]
    | undefined = receipt.samples!.at(-1);
  if (sample?.seconds === input.seconds) {
    const total: number = sample.impulse + input.impulse;
    sample.point = Vector3.scale(
      Vector3.add(
        Vector3.scale(sample.point, sample.impulse),
        Vector3.scale(input.point, input.impulse),
      ),
      1 / total,
    );
    sample.appliedImpulse = {
      a: (sample.appliedImpulse?.a ?? sample.impulse) + appliedImpulse.a,
      b: (sample.appliedImpulse?.b ?? sample.impulse) + appliedImpulse.b,
    };
    sample.impulse = total;
    sample.separation = Math.min(sample.separation, input.separation);
    sample.compression = Math.max(sample.compression, -input.separation);
  } else
    receipt.samples!.push({
      seconds: input.seconds,
      duration: input.dt,
      impulse: input.impulse,
      appliedImpulse,
      point: { ...input.point },
      normal,
      separation: input.separation,
      compression: Math.max(0, -input.separation),
    });
  return receipt;
}
