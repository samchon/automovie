import type { ITest12MotionDocument } from "./ITest12MotionDocument";
import { test12MotionRejectsDocument } from "./test12MotionRejectsDocument";
import { test12MotionRejectsMutation } from "./test12MotionRejectsMutation";
import { test12MotionRejectsPayloadMutation } from "./test12MotionRejectsPayloadMutation";
import { test12MotionWithoutAnimation } from "./test12MotionWithoutAnimation";

/**
 * Preserve refusal facts 1 through 18 in original registration order; the discoverable adoption unit owns their execution and independently authored diagnostic expectations.
 */
export function test12MotionAdoptionRefusalFacts1(): [string, () => boolean][] {
  return [
    [
      "motionProfileNeedsAnimation",
      (): boolean =>
        test12MotionRejectsDocument(
          test12MotionWithoutAnimation(),
          "requires at least one animation",
        ),
    ],
    [
      "animationNeedsSampler",
      (): boolean =>
        test12MotionRejectsMutation(
          (document: ITest12MotionDocument): never[] =>
            (document.animations![0]!.samplers = []),
          "needs at least one sampler",
        ),
    ],
    [
      "animationNeedsChannel",
      (): boolean =>
        test12MotionRejectsMutation(
          (document: ITest12MotionDocument): never[] =>
            (document.animations![0]!.channels = []),
          "needs at least one sampler and channel",
        ),
    ],
    [
      "samplerIndexMustResolve",
      (): boolean =>
        test12MotionRejectsMutation(
          (document: ITest12MotionDocument): number =>
            (document.animations![0]!.channels[0]!.sampler = 9),
          ".sampler does not resolve",
        ),
    ],
    [
      "targetMustBeObject",
      (): boolean =>
        test12MotionRejectsMutation(
          (document: ITest12MotionDocument): { node: number; path: string } =>
            (document.animations![0]!.channels[0]!.target = null as unknown as {
              node: number;
              path: string;
            }),
          ".target must be an object",
        ),
    ],
    [
      "targetNodeMustResolve",
      (): boolean =>
        test12MotionRejectsMutation(
          (document: ITest12MotionDocument): number =>
            (document.animations![0]!.channels[0]!.target.node = 9),
          ".target.node does not resolve",
        ),
    ],
    [
      "targetPathMustBeSupported",
      (): boolean =>
        test12MotionRejectsMutation(
          (document: ITest12MotionDocument): string =>
            (document.animations![0]!.channels[0]!.target.path = "pointer"),
          ".target.path must be",
        ),
    ],
    [
      "targetMustBeUnique",
      (): boolean =>
        test12MotionRejectsMutation(
          (document: ITest12MotionDocument): string =>
            (document.animations![0]!.channels[1]!.target.path = "rotation"),
          "duplicates the rotation channel",
        ),
    ],
    [
      "samplerInputMustResolve",
      (): boolean =>
        test12MotionRejectsMutation(
          (document: ITest12MotionDocument): number =>
            (document.animations![0]!.samplers[0]!.input = 99),
          ".input does not resolve",
        ),
    ],
    [
      "samplerOutputMustResolve",
      (): boolean =>
        test12MotionRejectsMutation(
          (document: ITest12MotionDocument): number =>
            (document.animations![0]!.samplers[0]!.output = 99),
          ".output does not resolve",
        ),
    ],
    [
      "interpolationMustBeSupported",
      (): boolean =>
        test12MotionRejectsMutation(
          (document: ITest12MotionDocument): string =>
            (document.animations![0]!.samplers[0]!.interpolation = "BEZIER"),
          "must be LINEAR, STEP, or CUBICSPLINE",
        ),
    ],
    [
      "inputMustBeFloatScalar",
      (): boolean =>
        test12MotionRejectsMutation(
          (document: ITest12MotionDocument): number =>
            (document.accessors![0]!.componentType = 5123),
          "FLOAT SCALAR",
        ),
    ],
    [
      "outputMustBeExpectedShape",
      (): boolean =>
        test12MotionRejectsMutation(
          (document: ITest12MotionDocument): string =>
            (document.accessors![1]!.type = "VEC3"),
          "FLOAT VEC4",
        ),
    ],
    [
      "sparseMotionIsRefused",
      (): boolean =>
        test12MotionRejectsMutation((document: ITest12MotionDocument): void => {
          (document.accessors![0]! as Record<string, unknown>).sparse = {
            count: 1,
            indices: { bufferView: 0, componentType: 5121 },
            values: { bufferView: 0 },
          };
        }, "non-sparse FLOAT"),
    ],
    [
      "nonFiniteSampleIsRefused",
      (): boolean =>
        test12MotionRejectsPayloadMutation(
          (payload: Buffer<ArrayBufferLike>): number =>
            payload.writeFloatLE(Number.NaN, 0),
          "non-finite value",
        ),
    ],
    [
      "negativeTimeIsRefused",
      (): boolean =>
        test12MotionRejectsPayloadMutation(
          (payload: Buffer<ArrayBufferLike>): number =>
            payload.writeFloatLE(-1, 0),
          "non-negative and strictly increasing",
        ),
    ],
    [
      "repeatedTimeIsRefused",
      (): boolean =>
        test12MotionRejectsPayloadMutation(
          (payload: Buffer<ArrayBufferLike>): number =>
            payload.writeFloatLE(0, 4),
          "non-negative and strictly increasing",
        ),
    ],
    [
      "outputArityIsChecked",
      (): boolean =>
        test12MotionRejectsMutation(
          (document: ITest12MotionDocument): number =>
            (document.accessors![2]!.count = 1),
          "does not match the translation keyframe arity",
        ),
    ],
  ];
}
