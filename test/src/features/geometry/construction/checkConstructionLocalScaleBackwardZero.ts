import { AutoMovieConstructionSplitBand as Band } from "@automovie/engine";
import type {
  IAutoMovieBlendColumn,
  IAutoMovieConstructionSplitBand,
  IAutoMovieConstructionSplitBandTrace,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

import { nclose } from "../../internal/nclose";

/** Existing analytic fixture data borrowed without changing its oracle. */
interface IInput {
  /** Original unit-radius loop in world mm. */
  loop: readonly [number, number, number][];

  /** Original analytic child cylinder in physical station mm and phase radians. */
  cylinder: IAutoMovieSolidSurface;

  /** Independently derived exp(-eta) forward cap. */
  cap: number;

  /** Original negative-curvature magnitude, 4*exp(eta). */
  bend: number;

  /** Original bisection/correspondence floating-point budget. */
  tolerance: number;
}

/**
 * Execute the actual strip's above-own exhaustion with one retained backward
 * zero. The parent test owns the analytic constants and final collect-all
 * verdict; this case owns its real strip call, branch observations and output
 * readings.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual SplitBand.strip and observes prepared columns, all 64 local passes, the final certificate and published rail jets, returning every finding to the parent test.
 * @evidence contracts/development/testing.md#independent-expectations Uses the unchanged analytic unit chords and passed degree-five cap/curvature. The antipodal zero removes only an already-redundant zero log obstacle from min(0,...), so the original Gaussian excess proof and positive common cap remain unchanged.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinguishes preserving an original backward zero from losing a nonzero first vector to underflow. Its original backward status remains explicit; publication certifies neither regularity nor a valid forward ribbon there.
 * @evidence contracts/development/testing.md#execution-ownership Only test_construction_local_scale_minorant invokes this in-memory case. No new discoverable test, Human, evaluator, host, asset or independent execution is introduced.
 * @evidence contracts/development/common.md#meaningful-documentation Names borrowed units, independent expectations, branch ownership and the absence of a regularity or shape approval.
 */
export function checkConstructionLocalScaleBackwardZero(input: IInput): {
  failures: string[];
  evidence: string[];
} {
  const failures: string[] = [];
  const evidence: string[] = [];
  const { loop, cylinder, cap, bend, tolerance }: IInput = input;
  const count: number = loop.length;
  const zero: [number, number, number] = [0, 0, 0];

  /** Same comparison budget as the parent case, without a new expectation. */
  const close: (
    actual: readonly number[],
    expected: readonly number[],
  ) => boolean = (
    actual: readonly number[],
    expected: readonly number[],
  ): boolean =>
    actual.length === expected.length &&
    actual.every((value: number, index: number): boolean =>
      nclose(value, expected[index]!, tolerance),
    );

  // Removing the antipodal zero log obstacle changes no envelope value:
  // the envelope already includes min(0,...). Thus the same independent
  // 64-pass proof holds, with 191 forward columns and one retained backward
  // zero. Neither this input nor successful publication certifies regularity.
  const zeroIndex: number = count / 2;
  const zeroEvents: IAutoMovieConstructionSplitBandTrace.Event[] = [];

  /** Same analytic bottleneck, with one explicitly retained zero first jet. */
  const zeroNear: (
    k: number,
    length: number,
  ) => IAutoMovieBlendColumn["start"] = (
    k: number,
    length: number,
  ): IAutoMovieBlendColumn["start"] => ({
    point: loop[k]!,
    first: [0, k === zeroIndex ? 0 : length, 0],
    second: [0, k === 0 ? -bend * length * length : 0, 0],
  });
  let zeroResult: IAutoMovieConstructionSplitBand.IStrip | string =
    "strip did not return";
  try {
    zeroResult = Band.strip(
      "analytic-minorant-backward-zero-192",
      loop,
      zeroNear,
      [1, 0, 0],
      { surface: cylinder, station: 1, into: 1 },
      undefined,
      "angle",
      "column",
      [],
      (event: IAutoMovieConstructionSplitBandTrace.Event): void => {
        zeroEvents.push(event);
      },
    );
  } catch (error) {
    failures.push("backward-zero: threw " + String(error));
  }
  const zeroPrepared:
    | Extract<IAutoMovieConstructionSplitBandTrace.Event, { kind: "prepared" }>
    | undefined = zeroEvents.find(
    (
      event: IAutoMovieConstructionSplitBandTrace.Event,
    ): event is Extract<
      IAutoMovieConstructionSplitBandTrace.Event,
      { kind: "prepared" }
    > => event.kind === "prepared",
  );
  const zeroPasses: Extract<
    IAutoMovieConstructionSplitBandTrace.Event,
    { kind: "local-pass" }
  >[] = zeroEvents.filter(
    (
      event: IAutoMovieConstructionSplitBandTrace.Event,
    ): event is Extract<
      IAutoMovieConstructionSplitBandTrace.Event,
      { kind: "local-pass" }
    > => event.kind === "local-pass",
  );
  const zeroCertificates: Extract<
    IAutoMovieConstructionSplitBandTrace.Event,
    { kind: "minorant" }
  >[] = zeroEvents.filter(
    (
      event: IAutoMovieConstructionSplitBandTrace.Event,
    ): event is Extract<
      IAutoMovieConstructionSplitBandTrace.Event,
      { kind: "minorant" }
    > => event.kind === "minorant",
  );
  const zeroCertificate:
    | Extract<
        IAutoMovieConstructionSplitBandTrace.Event,
        { kind: "minorant" }
      >["result"]
    | undefined = zeroCertificates[0]?.result;
  const zeroLast:
    | Extract<
        IAutoMovieConstructionSplitBandTrace.Event,
        { kind: "local-pass" }
      >
    | undefined = zeroPasses.at(-1);
  const zeroOwn: IAutoMovieConstructionSplitBandTrace.Target | undefined =
    zeroLast?.own[0];
  const zeroExcess: number | null =
    zeroLast !== undefined && zeroOwn?.kind === "finite"
      ? zeroLast.smooth[0]! - zeroOwn.value
      : null;
  evidence.push(
    JSON.stringify({
      name: "analytic-minorant-backward-zero-192",
      returned: typeof zeroResult === "string" ? zeroResult : "strip",
      common: zeroPrepared?.commonFactor ?? null,
      backward: zeroPrepared?.backward ?? null,
      forwardCount: zeroPrepared?.forwardIndices.length ?? null,
      localPasses: zeroPasses.length,
      aboveOwnOnly: zeroPasses.every(
        (
          pass: Extract<
            IAutoMovieConstructionSplitBandTrace.Event,
            { kind: "local-pass" }
          >,
        ): boolean =>
          pass.adjustments.length === 1 &&
          pass.adjustments[0]!.reason === "above-own" &&
          pass.adjustments[0]!.column === 0,
      ),
      lastLogExcess: zeroExcess,
      certificate: zeroCertificate ?? null,
    }),
  );
  if (zeroPrepared === undefined)
    failures.push("backward-zero: prepared inputs missing");
  else {
    if (
      zeroPrepared.columns.length !== count ||
      zeroPrepared.forwardIndices.length !== count - 1 ||
      zeroPrepared.factors.length !== count - 1 ||
      zeroPrepared.backward.length !== 1 ||
      zeroPrepared.backward[0] !== zeroIndex ||
      zeroPrepared.forwardIndices.includes(zeroIndex)
    )
      failures.push(
        "backward-zero: original forward/backward ownership changed",
      );
    if (
      !(zeroPrepared.commonFactor > 0) ||
      !nclose(zeroPrepared.commonFactor, cap, tolerance)
    )
      failures.push(
        "backward-zero: independent positive common certificate changed",
      );
    for (let k: number = 0; k < zeroPrepared.columns.length; ++k) {
      const column: IAutoMovieBlendColumn = zeroPrepared.columns[k]!;
      if (
        !close(column.start.point, loop[k]!) ||
        !close(column.end.point, [loop[k]![0], 1, loop[k]![2]]) ||
        !close(column.start.first, [0, k === zeroIndex ? 0 : 1, 0]) ||
        !close(column.end.first, [0, 1, 0]) ||
        !close(column.start.second, [0, k === 0 ? -bend : 0, 0]) ||
        !close(column.end.second, zero)
      )
        failures.push(
          "backward-zero: analytic input jet premise failed at " + k,
        );
    }
    for (let index: number = 0; index < zeroPrepared.factors.length; ++index)
      if (
        !nclose(
          zeroPrepared.factors[index]!,
          zeroPrepared.forwardIndices[index] === 0 ? cap : 1,
          tolerance,
        )
      )
        failures.push(
          "backward-zero: independent forward factor bound changed at " + index,
        );
  }
  if (zeroPasses.length !== 64 || zeroExcess === null || !(zeroExcess > 9e-6))
    failures.push(
      "backward-zero: independent old 64-pass excess did not reproduce",
    );
  for (let index: number = 0; index < zeroPasses.length; ++index) {
    const pass: Extract<
      IAutoMovieConstructionSplitBandTrace.Event,
      { kind: "local-pass" }
    > = zeroPasses[index]!;
    if (
      pass.pass !== index ||
      pass.settled ||
      pass.backward.length !== 1 ||
      pass.backward[0] !== zeroIndex ||
      pass.own[zeroIndex]?.kind !== "backward" ||
      pass.adjustments.length !== 1 ||
      pass.adjustments[0]!.reason !== "above-own" ||
      pass.adjustments[0]!.column !== 0 ||
      pass.adjustments[0]!.lower !== null
    )
      failures.push(
        "backward-zero: changed prefix or predicate branch at " + index,
      );
  }
  if (zeroCertificates.length !== 1)
    failures.push("backward-zero: missing single final certificate attempt");
  if (typeof zeroResult === "string") {
    failures.push(
      "backward-zero: retained original zero first jet refused: " + zeroResult,
    );
    if (
      zeroCertificate?.kind !== "refused" ||
      zeroCertificate.stage !== "candidate-certificate" ||
      zeroCertificate.index !== zeroIndex
    )
      failures.push(
        "backward-zero: refusal had a different cause than the retained original zero",
      );
  } else {
    if (
      zeroCertificate?.kind !== "accepted" ||
      zeroCertificate.field.length !== count ||
      !zeroCertificate.field.every(
        (value: number): boolean => value > 0 && value <= 1,
      )
    )
      failures.push(
        "backward-zero: publication has no complete positive certificate",
      );
    if (
      zeroResult.scale.backward.length !== 1 ||
      zeroResult.scale.backward[0] !== zeroIndex
    )
      failures.push(
        "backward-zero: publication hid the original backward status",
      );
    const phase: number = (2 * Math.PI * zeroIndex) / count;
    const start: IAutoMovieSolidSurface.IJet = zeroResult.surface.jet(0, phase);
    const end: IAutoMovieSolidSurface.IJet = zeroResult.surface.jet(
      zeroResult.length,
      phase,
    );
    if (
      !nclose(zeroResult.length, 1, tolerance) ||
      !close(start.p, loop[zeroIndex]!) ||
      !close(start.u, zero) ||
      !close(start.uu, zero) ||
      !close(end.p, [loop[zeroIndex]![0], 1, loop[zeroIndex]![2]]) ||
      !close(end.uu, zero)
    )
      failures.push(
        "backward-zero: publication changed the retained zero rail jet",
      );
    if (
      zeroCertificate?.kind === "accepted" &&
      !close(end.u, [0, zeroCertificate.field[zeroIndex]!, 0])
    )
      failures.push(
        "backward-zero: nonzero child first jet lost the certified scale",
      );
  }
  return { failures, evidence };
}
