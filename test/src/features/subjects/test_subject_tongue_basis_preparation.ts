import { TestValidator } from "@nestia/e2e";

import { prepareTongueBasis } from "../../../scripts/face-review/prepareTongueBasis";
import { humanFaceContactFixture } from "../internal/humanFaceContactFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The analytic contact basis with its tongue bound to the jaw (the fourth
 * vertex at half weight) and four more shape endpoints: the lower crown
 * (vertices 6 to 11, the arch bound to the jaw) moved 0.1 forward or back,
 * scaled by a tenth about the origin, or with one vertex alone lifted; the
 * tongue drawn 0.2 down with the lower lip lifted; and the tongue alone
 * curled up.
 */
const fixture = () => {
  const { basis, document } = humanFaceContactFixture();
  const arch = [6, 7, 8, 9, 10, 11];
  const teeth = basis.surfaces.find((one) => one.id === "teeth")!;
  const tongue = basis.surfaces.find((one) => one.id === "tongue")!;
  tongue.attachments = [{ owner: "jaw", rows: [0, 1, 1, 1, 2, 1, 3, 0.5] }];
  teeth.targets.forward = arch.flatMap((v) => [v, 0, 0, 0.1]);
  teeth.targets.back = arch.flatMap((v) => [v, 0, 0, -0.1]);
  teeth.targets.grow = arch.flatMap((v) => [
    v,
    ...[0, 1, 2].map((k) => 0.1 * teeth.positions[3 * v + k]!),
  ]);
  teeth.targets.twist = [6, 0, 0.1, 0];
  tongue.targets.down = [0, 1, 2, 3].flatMap((v) => [v, 0, -0.2, 0]);
  basis.surfaces.find((one) => one.id === "mouth")!.targets.down = [
    3, 0, 0.01, 0,
  ];
  tongue.targets.curl = [3, 0, 0.1, 0];
  const shape = (id: string, positive: string, negative: string | null) => ({
    id,
    kind: "shape" as const,
    minimum: negative === null ? 0 : -1,
    maximum: 1,
    positive,
    negative,
  });
  basis.channels.push(
    shape("prognathism", "forward", "back"),
    shape("arch", "grow", null),
    shape("drag", "down", null),
    shape("twist", "twist", null),
    shape("curl", "curl", null),
  );
  return { basis, document };
};

/**
 * Under every shape channel the tongue follows the mandibular arch.
 * Scenarios:
 * 1. The arch moved 0.1 forward carries the tongue 0.1 forward, the half-
 *    bound vertex 0.05; moved back, back; scaled by a tenth, each tongue
 *    vertex moves a tenth of its position times its binding; each fit is
 *    exact (residual zero).
 * 2. The tongue drawn down with the arch still is left still: its rows go,
 *    and the receipt records 0.2 before and nothing after; an endpoint that
 *    moves only the maxillary crown (`wider`) gives the tongue no rows and no
 *    receipt row; the tongue's own curl is left as it is.
 * 3. One arch vertex lifted alone is not one body's motion: its fit leaves
 *    a residual.
 * 4. Documents build and name the revision; the input is untouched.
 * 5. A repeated revision, a missing tongue and a dentition without an arch
 *    bound to the jaw refuse.
 */
export const test_subject_tongue_basis_preparation = (): void => {
  const { basis, document } = fixture();
  const snapshot = JSON.stringify(basis);
  const input = {
    basis,
    documents: [document],
    controls: { basis: basis.id, groups: [] },
    revision: "analytic-contact/2",
    dentition: "teeth",
    tongue: "tongue",
    owner: "jaw",
  };
  const prepared = prepareTongueBasis(input);
  const tongue = prepared.basis.surfaces.find((one) => one.id === "tongue")!;
  const rows = (name: string) => tongue.targets[name];
  const positions = basis.surfaces.find(
    (one) => one.id === "tongue",
  )!.positions;
  const weight = [1, 1, 1, 0.5];
  const close = (actual: number[] | undefined, expected: number[]) =>
    actual !== undefined &&
    actual.length === expected.length &&
    actual.every((v, k) => nclose(v, expected[k]!, 1e-12));
  TestValidator.predicate(
    "rides the arch",
    close(
      rows("forward"),
      [0, 1, 2, 3].flatMap((v) => [v, 0, 0, 0.1 * weight[v]!]),
    ) &&
      close(
        rows("back"),
        [0, 1, 2, 3].flatMap((v) => [v, 0, 0, -0.1 * weight[v]!]),
      ) &&
      close(
        rows("grow"),
        [0, 1, 2, 3].flatMap((v) => [
          v,
          ...[0, 1, 2].map((k) => 0.1 * positions[3 * v + k]! * weight[v]!),
        ]),
      ),
  );
  const receipt = new Map(
    prepared.receipt.endpoints.map((one) => [one.endpoint, one]),
  );
  TestValidator.predicate(
    "exact fits, still arch",
    ["forward", "back", "grow"].every((name) =>
      nclose(receipt.get(name)!.residual, 0, 1e-12),
    ) &&
      rows("down") === undefined &&
      receipt.get("down")!.before === 0.2 &&
      receipt.get("down")!.after === 0 &&
      rows("wider") === undefined &&
      !receipt.has("wider") &&
      rows("curl")!.join() === "3,0,0.1,0" &&
      !receipt.has("curl") &&
      nclose(receipt.get("forward")!.after, 0.1, 1e-12),
  );
  TestValidator.predicate(
    "one vertex is not one body",
    receipt.get("twist")!.residual > 0.01,
  );
  TestValidator.predicate(
    "restamped, input kept",
    prepared.basis.id === "analytic-contact/2" &&
      prepared.documents[0]!.basis === "analytic-contact/2" &&
      prepared.controls.basis === "analytic-contact/2" &&
      JSON.stringify(basis) === snapshot,
  );
  const unbound = fixture();
  unbound.basis.surfaces.find((one) => one.id === "teeth")!.attachments = [];
  TestValidator.predicate(
    "refusals",
    throwsError(
      () => prepareTongueBasis({ ...input, revision: basis.id }),
      "distinct revision",
    ) &&
      throwsError(
        () => prepareTongueBasis({ ...input, tongue: "none" }),
        "lacks the dentition or the tongue",
      ) &&
      throwsError(
        () => prepareTongueBasis({ ...input, basis: unbound.basis }),
        "no arch bound to jaw",
      ),
  );
};
