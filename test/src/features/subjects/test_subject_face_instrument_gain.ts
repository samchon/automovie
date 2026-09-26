import { TestValidator } from "@nestia/e2e";

import type { IFaceAnthropometryIndex } from "../../../scripts/face-review/faceAnthropometry";
import {
  faceInstrumentDocuments,
  faceInstrumentGains,
} from "../../../scripts/face-review/faceInstrumentGain";
import { throwsError } from "../internal/predicates";

/**
 * The photograph's instrument calibrated against the anchored model.
 * Scenarios:
 * 1. The documents set each index's control at its envelope's two ends under
 *    every camera: a paired shape control on both channels, a signed index
 *    by its negative channel below zero, a state of the face as expression.
 * 2. A gain within [bound, 1 / bound] is observed under its camera; one
 *    below the bound (the detector holds its place), reversed, above
 *    1 / bound (the anchored reading hardly moves), unread, or with an
 *    anchored reading that does not change is not; an index one camera
 *    lacks is unread there.
 * 3. An empty envelope and a bound outside (0, 1) refuse.
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
      throwsError(() => faceInstrumentGains([], 0), "between zero and one") &&
      throwsError(() => faceInstrumentGains([], 1), "between zero and one"),
  );
};
