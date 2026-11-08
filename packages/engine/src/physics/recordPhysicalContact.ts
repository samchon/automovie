import type {
  IAutoMovieVector3,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/** Merge core and compliant-surface impulses into one shape-pair episode. */
export function recordPhysicalContact(input: {
  /** First mapped shape. */ a: Receipt["a"];
  /** Second mapped shape. */ b: Receipt["b"];
  /** Current completed fixed-step second. */ seconds: number;
  /** Duration represented by the impulse. */ dt: number;
  /** Surface application point. */ point: IAutoMovieVector3;
  /** From a toward b. */ normal: IAutoMovieVector3;
  /** Positive solved normal impulse before any explicit response gain. */ impulse: number;
  /** Actual transferred soft-solver normal impulses; omission retains direct native manifold authority. */ appliedImpulse?: {
    a: number;
    b: number;
  };
  /** Actual signed separation, never a predicted air gap. */ separation: number;
  /** Retained complete episodes. */ contacts: Receipt[];
  /** Still-active episodes keyed by canonical shape pair. */ active: Map<
    string,
    Receipt
  >;
  /** Pairs touched in the current step. */ found: Set<string>;
}): Receipt {
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
  let receipt: Receipt | undefined = input.active.get(key);
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
  const sample: NonNullable<Receipt["samples"]>[number] | undefined =
    receipt.samples!.at(-1);
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
