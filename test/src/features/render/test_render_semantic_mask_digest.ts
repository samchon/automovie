import {
  AutoMovieRenderMetric,
  AutoMovieSemanticKind,
  IAutoMovieRenderInventory,
  IAutoMovieRenderReport,
  IAutoMovieRenderTarget,
  IAutoMovieSemanticMask,
  IAutoMovieSemanticMaskEntry,
  IAutoMovieSemanticMaskGap,
  IAutoMovieSemanticMaskSlot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

import { autoMovieSemanticMaskVerificationFailure } from "@automovie/engine";
import { AUTOMOVIE_RENDER_METRICS } from "@automovie/engine";
import { digestAutoMovieSemanticMask } from "@automovie/engine";
import { evaluateAutoMovieRenderBudget } from "@automovie/engine";
import { renderAutoMovieSemanticMaskSidecar } from "@automovie/engine";
import { verifyAutoMovieSemanticMask } from "@automovie/engine";
import { malformedCurrentSemanticMasks } from "../internal/malformedCurrentSemanticMasks";
import { malformedSemanticMaskShapes } from "../internal/malformedSemanticMaskShapes";
import { throwsError } from "../internal/predicates";
import { renderSemanticMaskPayload } from "../internal/renderSemanticMaskPayload";

/**
 * A semantic-mask digest seals every field needed to interpret its pixels.
 *
 * Scenarios:
 *
 * 1. An independently encoded full v2 payload produces the same SHA-256 digest and canonical sidecar bytes as the engine.
 * 2. Reordering entries, node joins, and palette gaps changes neither digest nor sidecar bytes.
 * 3. Changing only label, owner, nodes, slot, or each gap field changes digest.
 * 4. Null, empty, zero, singleton, and multiple-node values remain distinct and deterministic.
 * 5. A changed payload carrying its old digest is refused by both the verifier and serializer.
 * 6. Historical v1 and unknown version/protocol pairs are refused rather than reinterpreted as current evidence.
 * 7. Unknown and missing fields at every v2 record boundary are refused even when the malformed projection carries its own recomputed digest.
 * 8. Non-object masks, absent discriminators, and wrong collection/member shapes are typed as invalid before digest comparison.
 * 9. Two otherwise identical render reports inherit different mask and report identities when only the sealed semantic payload changes.
 *
 * @evidence contracts/testing.md#behavioral-verification Hashes and verifies actual current masks and serializes sidecars, checking complete field sensitivity, canonical collection order, typed structural refusals, stale self-digests and inherited report identity.
 * @evidence contracts/testing.md#independent-expectations The explicitly hand-ordered v2 payload is JSON-encoded and SHA-hashed with Node crypto independently of the Engine projector/hash. Malformed candidates deliberately use the production projector to keep a self-consistent digest, proving that key/container admission must act before hashing; this does not prove every scalar or semantic graph rule.
 * @evidence contracts/testing.md#distinguishing-cases Null/empty/zero/multi-node values, all entry/slot/gap axes, unknown and missing keys, ten runtime shape cases, historical/foreign discriminators and stale payloads preserve the original cases and exact refusal boundaries.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_semantic_mask_digest owns its cases. Portable metadata hashing, validation, sidecar strings and content-only reports; canonical leaves retain the original malformed candidates and no render artifact or host is created.
 */
export function test_render_semantic_mask_digest(): void {
  const mask: IAutoMovieSemanticMask = seal(basePayload());
  const expectedPayload: {
    version: number;
    protocol: string;
    background: string;
    entries: (
      | {
          id: string;
          kind: string;
          label: string;
          color: string;
          owner: string;
          nodes: string[];
          slot: { instanceSet: string; index: number };
        }
      | {
          id: string;
          kind: string;
          label: null;
          color: string;
          owner: null;
          nodes: never[];
          slot: null;
        }
    )[];
    unaddressed: {
      instanceSet: string;
      slots: number;
      reason: string;
      remedy: string;
    }[];
  } = {
    version: 2,
    protocol: "automovie.semantic-mask.v2",
    background: "#000000",
    entries: [
      {
        id: "instance-slot:windows#0",
        kind: "instance-slot",
        label: "window",
        color: "#010203",
        owner: "instance-set:windows",
        nodes: ["window-a", "window-b"],
        slot: { instanceSet: "windows", index: 0 },
      },
      {
        id: "node:root",
        kind: "node",
        label: null,
        color: "#ABCDEF",
        owner: null,
        nodes: [],
        slot: null,
      },
    ],
    unaddressed: [
      {
        instanceSet: "curtains",
        slots: 2,
        reason: "palette bound",
        remedy: "split the set",
      },
      {
        instanceSet: "trees",
        slots: 1,
        reason: "palette bound",
        remedy: "read runtime identity",
      },
    ],
  };
  const expectedDigest: string = `sha256:${createHash("sha256")
    .update(JSON.stringify(expectedPayload), "utf8")
    .digest("hex")}` as string;
  TestValidator.equals(
    "the explicit full payload is the digest preimage and sidecar body",
    {
      digest: mask.digest,
      verified: verifyAutoMovieSemanticMask(mask),
      sidecar: renderAutoMovieSemanticMaskSidecar(mask),
    },
    {
      digest: expectedDigest,
      verified: undefined,
      sidecar: `${JSON.stringify(
        { ...expectedPayload, digest: expectedDigest },
        null,
        2,
      )}\n`,
    },
  );

  const reordered: IAutoMovieSemanticMask = seal({
    ...basePayload(),
    entries: [...basePayload().entries].reverse().map(
      (
        entry: IAutoMovieSemanticMaskEntry,
      ): {
        nodes: string[];
        id: string;
        kind: AutoMovieSemanticKind;
        label: string | null;
        color: string;
        owner: string | null;
        slot: IAutoMovieSemanticMaskSlot | null;
      } => ({ ...entry, nodes: [...entry.nodes].reverse() }),
    ),
    unaddressed: [...basePayload().unaddressed].reverse(),
  });
  TestValidator.equals(
    "collection order is absent from canonical mask identity",
    {
      digest: reordered.digest,
      sidecar: renderAutoMovieSemanticMaskSidecar(reordered),
    },
    {
      digest: mask.digest,
      sidecar: renderAutoMovieSemanticMaskSidecar(mask),
    },
  );

  const entry: IAutoMovieSemanticMaskEntry = mask.entries.find(
    (candidate: IAutoMovieSemanticMaskEntry): boolean =>
      candidate.id === "instance-slot:windows#0",
  )!;
  const changed: {
    label: string;
    owner: string;
    nodesAdded: string;
    nodesRemoved: string;
    slotSet: string;
    slotIndex: string;
    slotNull: string;
    gapSet: string;
    gapSlots: string;
    gapReason: string;
    gapRemedy: string;
    gapsEmpty: string;
  } = {
    label: editEntry(mask, { label: "clerestory" }).digest,
    owner: editEntry(mask, { owner: "space:hall" }).digest,
    nodesAdded: editEntry(mask, {
      nodes: [...entry.nodes, "window-c"],
    }).digest,
    nodesRemoved: editEntry(mask, { nodes: [entry.nodes[0]!] }).digest,
    slotSet: editEntry(mask, {
      slot: { instanceSet: "clerestory", index: 0 },
    }).digest,
    slotIndex: editEntry(mask, {
      slot: { instanceSet: "windows", index: 1 },
    }).digest,
    slotNull: editEntry(mask, { slot: null }).digest,
    gapSet: editGap(mask, { instanceSet: "drapes" }).digest,
    gapSlots: editGap(mask, { slots: 3 }).digest,
    gapReason: editGap(mask, { reason: "another bound" }).digest,
    gapRemedy: editGap(mask, { remedy: "use another mask" }).digest,
    gapsEmpty: seal({ ...renderSemanticMaskPayload(mask), unaddressed: [] })
      .digest,
  };
  TestValidator.equals(
    "every semantic axis has a digest-moving negative twin",
    Object.fromEntries(
      Object.entries(changed).map(
        ([name, digest]: [string, string]): [string, boolean] => [
          name,
          digest !== mask.digest,
        ],
      ),
    ),
    Object.fromEntries(
      Object.keys(changed).map((name: string): [string, boolean] => [
        name,
        true,
      ]),
    ),
  );

  const tampered: {
    entries: IAutoMovieSemanticMaskEntry[];
    version: 2;
    protocol: "automovie.semantic-mask.v2";
    background: "#000000";
    unaddressed: IAutoMovieSemanticMaskGap[];
    digest: string;
  } = {
    ...mask,
    entries: [
      { ...mask.entries[0]!, owner: "space:foreign" },
      ...mask.entries.slice(1),
    ],
  };
  TestValidator.equals(
    "an old self digest cannot authorize changed semantic bytes",
    {
      verify: throwsError(
        (): void => verifyAutoMovieSemanticMask(tampered),
        "digest mismatch",
      ),
      serialize: throwsError(
        (): string => renderAutoMovieSemanticMaskSidecar(tampered),
        "digest mismatch",
      ),
    },
    { verify: true, serialize: true },
  );

  const historical: IAutoMovieSemanticMask = {
    ...mask,
    version: 1,
    protocol: "automovie.semantic-mask.v1",
  } as unknown as IAutoMovieSemanticMask;
  const unknown: IAutoMovieSemanticMask = {
    ...mask,
    protocol: "automovie.semantic-mask.v99",
  } as unknown as IAutoMovieSemanticMask;
  TestValidator.equals(
    "historical and unknown protocols remain non-current",
    {
      historical: throwsError(
        (): void => verifyAutoMovieSemanticMask(historical),
        ["unsupported", "1/automovie.semantic-mask.v1"],
      ),
      unknown: throwsError(
        (): void => verifyAutoMovieSemanticMask(unknown),
        ["unsupported", "automovie.semantic-mask.v99"],
      ),
    },
    { historical: true, unknown: true },
  );

  const malformed: readonly (readonly [
    string,
    IAutoMovieSemanticMask,
    string,
  ])[] = malformedCurrentSemanticMasks(mask);
  TestValidator.equals(
    "a self-consistent digest cannot authorize an inexact current schema",
    Object.fromEntries(
      malformed.map(
        ([name, candidate, boundary]: readonly [
          string,
          IAutoMovieSemanticMask,
          string,
        ]): [
          string,
          {
            reason: "unsupported" | "invalid" | "digest-mismatch" | null;
            boundary: boolean;
          },
        ] => [
          name,
          {
            reason: verificationFailure(candidate),
            boundary: throwsError(
              (): void => verifyAutoMovieSemanticMask(candidate),
              boundary,
            ),
          },
        ],
      ),
    ),
    Object.fromEntries(
      malformed.map(
        ([name]: readonly [string, IAutoMovieSemanticMask, string]): [
          string,
          { reason: "invalid"; boundary: boolean },
        ] => [name, { reason: "invalid" as const, boundary: true }],
      ),
    ),
  );
  const malformedShapes: readonly (readonly [
    string,
    IAutoMovieSemanticMask,
    string,
  ])[] = malformedSemanticMaskShapes(mask);
  TestValidator.equals(
    "wrong current-schema shapes fail at their exact structural boundary",
    Object.fromEntries(
      malformedShapes.map(
        ([name, candidate, boundary]: readonly [
          string,
          IAutoMovieSemanticMask,
          string,
        ]): [
          string,
          {
            reason: "unsupported" | "invalid" | "digest-mismatch" | null;
            boundary: boolean;
          },
        ] => [
          name,
          {
            reason: verificationFailure(candidate),
            boundary: throwsError(
              (): void => verifyAutoMovieSemanticMask(candidate),
              boundary,
            ),
          },
        ],
      ),
    ),
    Object.fromEntries(
      malformedShapes.map(
        ([name]: readonly [string, IAutoMovieSemanticMask, string]): [
          string,
          { reason: "invalid"; boundary: boolean },
        ] => [name, { reason: "invalid" as const, boundary: true }],
      ),
    ),
  );

  const reports: IAutoMovieRenderReport[] = [
    mask,
    editEntry(mask, { owner: "space:hall" }),
  ].map(
    (candidate: IAutoMovieSemanticMask): IAutoMovieRenderReport =>
      report(candidate),
  );
  TestValidator.equals(
    "render report identity inherits the complete semantic payload",
    {
      maskFieldsDiffer: reports[0]!.mask !== reports[1]!.mask,
      reportsDiffer: reports[0]!.digest !== reports[1]!.digest,
    },
    { maskFieldsDiffer: true, reportsDiffer: true },
  );
}

/** Current hand-built payload, deliberately declared out of input order. */
const basePayload: () => Omit<IAutoMovieSemanticMask, "digest"> = (): Omit<
  IAutoMovieSemanticMask,
  "digest"
> =>
  ({
    version: 2,
    protocol: "automovie.semantic-mask.v2",
    background: "#000000",
    entries: [
      {
        id: "node:root",
        kind: "node",
        label: null,
        color: "#ABCDEF",
        owner: null,
        nodes: [],
        slot: null,
      },
      {
        id: "instance-slot:windows#0",
        kind: "instance-slot",
        label: "window",
        color: "#010203",
        owner: "instance-set:windows",
        nodes: ["window-b", "window-a"],
        slot: { instanceSet: "windows", index: 0 },
      },
    ],
    unaddressed: [
      {
        instanceSet: "trees",
        slots: 1,
        reason: "palette bound",
        remedy: "read runtime identity",
      },
      {
        instanceSet: "curtains",
        slots: 2,
        reason: "palette bound",
        remedy: "split the set",
      },
    ],
  }) as unknown as Omit<IAutoMovieSemanticMask, "digest">;

/** Seal one typed payload with the production digest helper. */
const seal: (
  value: Omit<IAutoMovieSemanticMask, "digest">,
) => IAutoMovieSemanticMask = (
  value: Omit<IAutoMovieSemanticMask, "digest">,
): IAutoMovieSemanticMask => ({
  ...value,
  digest: digestAutoMovieSemanticMask(value),
});

/** Return the verifier's stable typed refusal for one candidate. */
const verificationFailure: (
  mask: IAutoMovieSemanticMask,
) => "unsupported" | "invalid" | "digest-mismatch" | null = (
  mask: IAutoMovieSemanticMask,
): ReturnType<typeof autoMovieSemanticMaskVerificationFailure> => {
  try {
    verifyAutoMovieSemanticMask(mask);
    return null;
  } catch (error: unknown) {
    return autoMovieSemanticMaskVerificationFailure(error);
  }
};

/** Replace one field of the instanced-slot entry and reseal it. */
const editEntry: (
  mask: IAutoMovieSemanticMask,
  replacement: Partial<IAutoMovieSemanticMaskEntry>,
) => IAutoMovieSemanticMask = (
  mask: IAutoMovieSemanticMask,
  replacement: Partial<IAutoMovieSemanticMaskEntry>,
): IAutoMovieSemanticMask =>
  seal({
    ...renderSemanticMaskPayload(mask),
    entries: mask.entries.map(
      (entry: IAutoMovieSemanticMaskEntry): IAutoMovieSemanticMaskEntry =>
        entry.id === "instance-slot:windows#0"
          ? { ...entry, ...replacement }
          : entry,
    ),
  });

/** Replace one field of the first canonical bounded-palette gap and reseal it. */
const editGap: (
  mask: IAutoMovieSemanticMask,
  replacement: Partial<IAutoMovieSemanticMaskGap>,
) => IAutoMovieSemanticMask = (
  mask: IAutoMovieSemanticMask,
  replacement: Partial<IAutoMovieSemanticMask["unaddressed"][number]>,
): IAutoMovieSemanticMask =>
  seal({
    ...renderSemanticMaskPayload(mask),
    unaddressed: [
      { ...mask.unaddressed[0]!, ...replacement },
      ...mask.unaddressed.slice(1),
    ],
  });

/** Evaluate a content-only report against one fixed zero-cost inventory. */
const report: (mask: IAutoMovieSemanticMask) => IAutoMovieRenderReport = (
  mask: IAutoMovieSemanticMask,
): IAutoMovieRenderReport =>
  evaluateAutoMovieRenderBudget({
    inventory: {
      version: 1,
      protocol: "automovie.render-inventory.v1",
      totals: Object.fromEntries(
        AUTOMOVIE_RENDER_METRICS.map(
          (metric: AutoMovieRenderMetric): [AutoMovieRenderMetric, number] => [
            metric,
            0,
          ],
        ),
      ),
      owners: [],
      gaps: [],
      digest: `sha256:${"1".repeat(64)}`,
    } as unknown as IAutoMovieRenderInventory,
    budget: null,
    mask,
    target: {
      digest: `sha256:${"2".repeat(64)}`,
    } as IAutoMovieRenderTarget,
  });
