import {
  type IAutoMovieHumanFaceBasis,
  createPortraitMaterials,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { prepareValidEnvelopeBasis } from "../../../scripts/face-review/prepareValidEnvelopeBasis";
import { throwsError } from "../internal/predicates";

/** Vertices in millimetres, as metres. */
const mm = (...values: number[]) => values.map((v) => v / 1000);

/**
 * Four triangles in the plane z = 0 and one standing at x = 75 mm. `fold`
 * moves the first triangle's apex 20 mm down per unit, turning it over past
 * 0.5; `shape` lifts the second's apex 2 mm per unit, or drops it 20 mm per
 * unit on its negative side; `press` moves the standing triangle 10 mm
 * toward the third, which it passes through past 0.85; the third and the
 * standing one are the lips. `late` moves the first apex 10.5 mm down per
 * unit, turning it over past 0.95; `ghost` names rows the surface lacks;
 * `flat` has a negative endpoint and no negative side; `smile` is an
 * expression.
 */
const surface = (): IAutoMovieHumanFaceBasis => {
  const positions = mm(
    ...[0, 0, 0, 10, 0, 0, 0, 10, 0],
    ...[30, 0, 0, 40, 0, 0, 30, 10, 0],
    ...[60, 0, 0, 70, 0, 0, 60, 10, 0],
    ...[75, 3.5, -5, 75, 3.5, 5, 75, 8, 0],
  );
  const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const channel = (id: string, negative: boolean) => ({
    id,
    kind: "shape" as const,
    minimum: negative ? -1 : 0,
    maximum: 1,
    positive: `${id}.positive`,
    negative: negative ? `${id}.negative` : null,
  });
  return {
    id: "strip/1",
    channels: [
      channel("fold", false),
      channel("shape", true),
      channel("press", false),
      channel("late", false),
      channel("ghost", false),
      { ...channel("flat", true), minimum: 0 },
      { ...channel("smile", false), kind: "expression" as const },
    ],
    surfaces: [
      {
        id: "skin",
        positions,
        indices,
        targets: {
          "fold.positive": [2, 0, -0.02, 0],
          "shape.positive": [5, 0, 0.002, 0],
          "shape.negative": [5, 0, -0.02, 0],
          "press.positive": [9, 10, 11].flatMap((v) => [v, -0.01, 0, 0]),
          "late.positive": [2, 0, -0.0105, 0],
          "flat.negative": [5, 0, 0.001, 0],
        },
        regions: [
          {
            id: "skin/skin",
            material: "skin",
            indices: indices.slice(0, 6),
            uvs: null,
          },
          {
            id: "skin/lips",
            material: "skin",
            indices: indices.slice(6),
            uvs: null,
          },
        ],
      },
    ],
    materials: createPortraitMaterials().filter((one) => one.id === "skin"),
  };
};

/**
 * Bringing channel sides inside where their surface stays valid.
 * Scenarios:
 * 1. `fold` without a value ends at 0.5, the last 0.1 step before its
 *    triangle turns over; `shape`'s maximum at a studied 0.5 is taken with
 *    its study as evidence; the receipt records both ends and the faults at
 *    the old ones.
 * 2. `press` passes through the third triangle past 0.85: without a contact
 *    region it ends at 0.8; with the lips as contact the overlap is no
 *    fault, and a limit without a value refuses a channel valid to its end,
 *    as it does one without rows (`ghost`). `late`, whose steps to 0.9 are
 *    fault-free and whose end is not, ends at 0.9.
 * 3. Documents and controls name the revision.
 * 4. A studied value with faults (`shape` at -0.8), one that does not bring
 *    the end inward or lies on the other side, a side the channel lacks or
 *    whose end is zero, an unknown or expression channel, an unknown region
 *    or surface, a document the new envelope leaves outside and a repeated
 *    revision refuse.
 */
export const test_subject_valid_envelope_basis_preparation = (): void => {
  const basis = surface();
  const base = {
    basis,
    documents: [
      {
        id: "doc",
        name: "doc",
        basis: basis.id,
        shape: { fold: 0.3 },
        expression: {},
      },
    ],
    controls: { basis: basis.id } as never,
    revision: "strip/2",
    surface: "skin",
    contact: [] as string[],
    step: 0.1,
    limits: [
      { channel: "fold", side: "maximum" as const },
      {
        channel: "shape",
        side: "maximum" as const,
        value: 0.5,
        study: "0.6 is not a face",
      },
      { channel: "press", side: "maximum" as const },
    ],
  };
  const prepared = prepareValidEnvelopeBasis(base);
  const envelope = (id: string) => {
    const one = prepared.basis.channels.find((channel) => channel.id === id)!;
    return [one.minimum, one.maximum];
  };
  TestValidator.equals(
    "ends",
    [envelope("fold"), envelope("shape"), envelope("press")],
    [
      [0, 0.5],
      [-1, 0.5],
      [0, 0.8],
    ],
  );
  TestValidator.equals(
    "receipt",
    prepared.receipt.limits.map((one) => [one.from, one.to, one.evidence]),
    [
      [1, 0.5, "faults"],
      [1, 0.5, "0.6 is not a face"],
      [1, 0.8, "faults"],
    ],
  );
  TestValidator.predicate(
    "faults at the old ends, stamps",
    prepared.receipt.limits[0]!.faults === 1 &&
      prepared.receipt.limits[1]!.faults === 0 &&
      prepared.receipt.limits[2]!.faults > 0 &&
      prepared.basis.id === "strip/2" &&
      prepared.documents[0]!.basis === "strip/2" &&
      (prepared.controls as { basis: string }).basis === "strip/2",
  );
  const limit = (
    channel: string,
    side: "minimum" | "maximum",
    value?: number,
  ) => ({
    ...base,
    limits: [{ channel, side, ...(value === undefined ? {} : { value }) }],
  });
  TestValidator.equals(
    "late",
    prepareValidEnvelopeBasis(limit("late", "maximum")).receipt.limits[0]!.to,
    0.9,
  );
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareValidEnvelopeBasis(limit("ghost", "maximum")),
      "valid to its maximum",
    ) &&
      throwsError(
        () => prepareValidEnvelopeBasis(limit("shape", "maximum", -0.2)),
        "inward",
      ) &&
      throwsError(
        () => prepareValidEnvelopeBasis(limit("flat", "minimum")),
        "no minimum side",
      ) &&
      throwsError(
        () => prepareValidEnvelopeBasis(limit("smile", "maximum")),
        "No shape channel",
      ) &&
      throwsError(
        () =>
          prepareValidEnvelopeBasis({
            ...limit("press", "maximum"),
            contact: ["skin/lips"],
          }),
        "valid to its maximum",
      ) &&
      throwsError(
        () => prepareValidEnvelopeBasis(limit("shape", "minimum", -0.8)),
        "not fault-free",
      ) &&
      throwsError(
        () => prepareValidEnvelopeBasis(limit("shape", "maximum", 1)),
        "inward",
      ) &&
      throwsError(
        () => prepareValidEnvelopeBasis(limit("fold", "minimum")),
        "no minimum side",
      ) &&
      throwsError(
        () => prepareValidEnvelopeBasis(limit("none", "maximum")),
        "No shape channel",
      ) &&
      throwsError(
        () => prepareValidEnvelopeBasis({ ...base, contact: ["skin/none"] }),
        "No region",
      ) &&
      throwsError(
        () => prepareValidEnvelopeBasis({ ...base, surface: "none" }),
        "No surface",
      ) &&
      throwsError(
        () =>
          prepareValidEnvelopeBasis({
            ...limit("fold", "maximum"),
            documents: [{ ...base.documents[0]!, shape: { fold: 0.9 } }],
          }),
        "would leave fold",
      ) &&
      throwsError(
        () => prepareValidEnvelopeBasis({ ...base, revision: basis.id }),
        "distinct revision",
      ),
  );
};
