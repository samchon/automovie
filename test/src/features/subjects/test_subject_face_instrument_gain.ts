import { TestValidator } from "@nestia/e2e";

import type {
  FaceAnthropometryPoint,
  IFaceAnthropometryIndex,
} from "../../../scripts/face-review/faceAnthropometry";
import {
  faceInstrumentDocuments,
  faceInstrumentGains,
  faceInstrumentPair,
  faceInstrumentResolution,
  faceInstrumentState,
} from "../../../scripts/face-review/faceInstrumentGain";
import { throwsError } from "../internal/predicates";

/**
 * The photograph's instrument calibrated against the anchored model.
 * Scenarios:
 * 1. The documents set each index's control at its envelope's two ends under
 *    every camera: a paired shape control on both channels, a signed index
 *    by its negative channel below zero, a state of the face as expression.
 *    With three steps for a state of the face, its envelope's middle is
 *    probed too.
 *    An index another uncovers is stepped again with that index's control
 *    at each of its steps.
 * 2. The pair of steps is the widest both instruments read (the teeth read
 *    only with the lips parted), the lower on a tie, none when none reads;
 *    the state read is the most closed with a pair, else the first at its
 *    ends.
 * 3. A gain within [bound, 1 / bound] is observed under its camera; one
 *    below the bound (the detector holds its place), reversed, above
 *    1 / bound (the anchored reading hardly moves), unread, or with an
 *    anchored reading that does not change is not; an index one camera
 *    lacks is unread there. An index whose detector change is under twice
 *    its resolution is not observed; one without a known resolution is.
 * 4. The resolution is an index's deviation under half a pixel of jitter:
 *    a width of two points reads 0.5 sqrt(2), the same seed the same.
 * 5. An empty envelope, fewer than two steps, an unknown uncovering index,
 *    a bound outside (0, 1) and fewer than two draws refuse.
 */
export const test_subject_face_instrument_gain = (): void => {
  const indices: IFaceAnthropometryIndex[] = [
    { id: "width", definition: "", channels: ["leftWidth", "rightWidth"] },
    {
      id: "shift",
      definition: "",
      channels: ["toLeft"],
      negative: ["toRight"],
      expression: true,
    },
  ];
  const envelopes: Record<string, [number, number]> = {
    width: [-0.5, 1],
    shift: [-1, 1],
  };
  const { documents, probes } = faceInstrumentDocuments({
    basis: "b/1",
    indices,
    envelope: (index) => envelopes[index.id]!,
    cameras: ["front", "turned"],
  });
  TestValidator.equals(
    "documents",
    documents.map((one) => [one.id, one.shape, one.expression]),
    [
      ["inst-front-width-lower", { leftWidth: -0.5, rightWidth: -0.5 }, {}],
      ["inst-front-width-upper", { leftWidth: 1, rightWidth: 1 }, {}],
      ["inst-front-shift-lower", {}, { toRight: 1 }],
      ["inst-front-shift-upper", {}, { toLeft: 1 }],
      ["inst-turned-width-lower", { leftWidth: -0.5, rightWidth: -0.5 }, {}],
      ["inst-turned-width-upper", { leftWidth: 1, rightWidth: 1 }, {}],
      ["inst-turned-shift-lower", {}, { toRight: 1 }],
      ["inst-turned-shift-upper", {}, { toLeft: 1 }],
    ],
  );
  TestValidator.predicate(
    "probes",
    probes.length === 8 &&
      probes.every((one, k) => one.id === documents[k]!.id) &&
      probes[4]!.camera === "turned" &&
      probes[2]!.index === "shift" &&
      probes[2]!.value === -1,
  );
  const stepped = faceInstrumentDocuments({
    basis: "b/1",
    indices,
    envelope: (index) => envelopes[index.id]!,
    cameras: ["front"],
    steps: (index) => (index.expression ? 3 : 2),
  });
  TestValidator.equals(
    "stepped documents",
    stepped.documents.map((one) => [one.id, one.shape, one.expression]),
    [
      ["inst-front-width-lower", { leftWidth: -0.5, rightWidth: -0.5 }, {}],
      ["inst-front-width-upper", { leftWidth: 1, rightWidth: 1 }, {}],
      ["inst-front-shift-lower", {}, { toRight: 1 }],
      ["inst-front-shift-1", {}, {}],
      ["inst-front-shift-upper", {}, { toLeft: 1 }],
    ],
  );
  const mouth: IFaceAnthropometryIndex[] = [
    { id: "open", definition: "", channels: ["jawOpen"], expression: true },
    {
      id: "display",
      definition: "",
      channels: ["raise"],
      expression: true,
      uncoveredBy: "open",
    },
  ];
  const uncovered = faceInstrumentDocuments({
    basis: "b/1",
    indices: mouth,
    envelope: () => [0, 1],
    cameras: ["front"],
  });
  TestValidator.equals(
    "uncovered documents",
    uncovered.documents.map((one) => [one.id, one.expression]),
    [
      ["inst-front-open-lower", {}],
      ["inst-front-open-upper", { jawOpen: 1 }],
      ["inst-front-display-at0-lower", {}],
      ["inst-front-display-at0-upper", { raise: 1 }],
      ["inst-front-display-at1-lower", { jawOpen: 1 }],
      ["inst-front-display-at1-upper", { jawOpen: 1, raise: 1 }],
    ],
  );
  TestValidator.predicate(
    "uncovered probes",
    uncovered.probes[0]!.uncovered === undefined &&
      uncovered.probes[3]!.uncovered === 0 &&
      uncovered.probes[5]!.uncovered === 1 &&
      uncovered.probes[5]!.value === 1,
  );
  const closed = { values: [0, 1], model: [0.1, 0.2], detector: [null, null] };
  const apart = { values: [0, 1], model: [0.1, 0.2], detector: [0.1, 0.25] };
  TestValidator.predicate(
    "states",
    JSON.stringify(faceInstrumentState([closed, apart, apart])) ===
      JSON.stringify({ state: 1, pair: [0, 1] }) &&
      JSON.stringify(faceInstrumentState([closed, closed])) ===
        JSON.stringify({ state: 0, pair: [0, 1] }),
  );
  TestValidator.predicate(
    "pairs",
    faceInstrumentPair(
      [0, 0.5, 1],
      [0.1, 0.2, 0.3],
      [null, 0.2, 0.3],
    )?.join() === "1,2" &&
      faceInstrumentPair(
        [0, 0.25, 0.5, 0.75, 1],
        [0.1, 0.2, 0.3, 0.4, 0.5],
        [null, 0.2, 0.3, 0.4, null],
      )?.join() === "1,3" &&
      faceInstrumentPair(
        [0, 0.5, 1],
        [0.1, 0.2, 0.3],
        [0.1, 0.2, 0.3],
      )?.join() === "0,2" &&
      faceInstrumentPair(
        [0, 1, 2, 3],
        [1, 1, 1, 1],
        [1, null, 1, 1],
      )?.join() === "0,3" &&
      faceInstrumentPair([0, 1, 2], [1, 1, 1], [null, 1, null]) === null,
  );
  const reading = (
    index: string,
    model: [number | null, number | null],
    detector: [number | null, number | null],
  ) => ({ index, values: [0, 1] as const, model, detector });
  const gains = faceInstrumentGains(
    [
      [
        reading("seen", [0.2, 0.4], [0.2, 0.3]),
        reading("blind", [0.2, 0.4], [0.2, 0.21]),
        reading("reversed", [0.2, 0.4], [0.2, 0.1]),
        reading("flat", [0.2, 0.2001], [0.2, 0.3]),
        reading("still", [0.2, 0.2], [0.2, 0.3]),
        reading("unread", [0.2, 0.4], [null, 0.3]),
      ],
      [reading("seen", [0.2, 0.4], [0.2, 0.21])],
    ],
    0.25,
  );
  const row = (id: string) => gains.find((one) => one.index === id)!;
  TestValidator.predicate(
    "gains and observation per camera",
    Math.abs(row("seen").gains[0]! - 0.5) < 1e-12 &&
      Math.abs(row("seen").gains[1]! - 0.05) < 1e-12 &&
      row("seen").observed.join() === "true,false" &&
      Math.abs(row("blind").gains[0]! - 0.05) < 1e-12 &&
      Math.abs(row("reversed").gains[0]! + 0.5) < 1e-12 &&
      Math.abs(row("flat").gains[0]! - 1000) < 1e-6 &&
      row("still").gains[0] === null &&
      row("unread").gains[0] === null &&
      row("unread").gains[1] === null &&
      ["blind", "reversed", "flat", "still", "unread"].every(
        (id) => row(id).observed.join() === "false,false",
      ),
  );
  const resolved = (
    index: string,
    detector: [number, number],
    resolution: number | null,
  ) => ({ ...reading(index, [0.2, 0.3], detector), resolution });
  const resolving = faceInstrumentGains(
    [
      [
        resolved("fine", [0.2, 0.25], 0.02),
        resolved("coarse", [0.2, 0.25], 0.03),
        resolved("unknown", [0.2, 0.25], null),
      ],
    ],
    0.25,
  );
  TestValidator.predicate(
    "resolution",
    resolving.map((one) => one.observed[0]).join() === "true,false,true",
  );
  // A width of two points 10 px apart: under half a pixel on each axis its
  // deviation is 0.5 * sqrt(2); the same seed draws the same.
  const width = (points: readonly FaceAnthropometryPoint[]) => ({
    width: Math.abs(points[1]![0] - points[0]![0]),
    unread: null,
  });
  const jittered = faceInstrumentResolution(
    [
      [0, 0],
      [10, 0],
    ],
    width,
    { sigma: 0.5, draws: 400, seed: 7 },
  );
  TestValidator.predicate(
    "jitter",
    Math.abs(jittered.width! - 0.5 * Math.SQRT2) < 0.1 &&
      jittered.unread === null &&
      JSON.stringify(jittered) ===
        JSON.stringify(
          faceInstrumentResolution(
            [
              [0, 0],
              [10, 0],
            ],
            width,
            { sigma: 0.5, draws: 400, seed: 7 },
          ),
        ),
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () =>
        faceInstrumentDocuments({
          basis: "b/1",
          indices,
          envelope: () => [1, 1],
          cameras: ["front"],
        }),
      "envelope of width is empty",
    ) &&
      throwsError(
        () =>
          faceInstrumentDocuments({
            basis: "b/1",
            indices,
            envelope: (index) => envelopes[index.id]!,
            cameras: ["front"],
            steps: () => 1,
          }),
        "width needs two steps or more",
      ) &&
      throwsError(
        () =>
          faceInstrumentDocuments({
            basis: "b/1",
            indices: [mouth[1]!],
            envelope: () => [0, 1],
            cameras: ["front"],
          }),
        "No index open uncovers display",
      ) &&
      throwsError(() => faceInstrumentGains([], 0), "between zero and one") &&
      throwsError(() => faceInstrumentGains([], 1), "between zero and one") &&
      throwsError(
        () =>
          faceInstrumentResolution([], width, {
            sigma: 1,
            draws: 1,
            seed: 1,
          }),
        "two draws",
      ),
  );
};
