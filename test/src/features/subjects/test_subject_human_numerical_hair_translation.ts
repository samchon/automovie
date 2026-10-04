import { Vector3 } from "@automovie/engine";
import { createHumanFaceBasisBuilder } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { numericalHairBasisFixture } from "../internal/numericalHairBasisFixture";
import { nclose, vclose } from "../internal/predicates";

/**
 * Skin translation transports the generated hair without changing its neutral
 * numerical field. This exercises the actual basis builder on an analytic solid.
 * Scenarios:
 * 1. A 10 mm X translation moves each root and paired-row centre by that vector
 *    under the original 1 nm transport bound; transverse frames and UVs survive.
 * 2. Width remains positive. Actual coverage corners may change because the
 *    translated Float32 host has a different grid and requires fresh whole-row
 *    and span fitting. A coverage corner is not a transported fibre station.
 * 3. Root identities, strip topology and the caller-owned document remain fixed.
 */
export const test_subject_human_numerical_hair_translation = (): void => {
  const { basis, document } = numericalHairBasisFixture();
  const before = structuredClone(document);
  const build = createHumanFaceBasisBuilder(basis);
  const hair = build(document).parts[1].geometry;
  const moved = build({ ...document, shape: { translate: 1 } }).parts[1]
    .geometry;
  if (hair.type !== "mesh" || moved.type !== "mesh")
    throw new Error("Expected generated numerical hair meshes.");
  TestValidator.equals(
    "translation preserves topology",
    moved.mesh.indices,
    hair.mesh.indices,
  );
  const point = (values: readonly number[], at: number) =>
    Vector3.create(values[3 * at], values[3 * at + 1], values[3 * at + 2]);
  const offset = Vector3.create(0.01, 0, 0);
  for (let at = 0; at < hair.mesh.positions.length / 3; ) {
    if (hair.mesh.uvs![2 * at + 1] === 0) {
      TestValidator.predicate(
        "canonical root follows barycentric skin",
        vclose(
          point(moved.mesh.positions, at),
          Vector3.add(point(hair.mesh.positions, at), offset),
          1e-9,
        ),
      );
      at++;
      continue;
    }
    const pair = (values: readonly number[]) => [
      point(values, at),
      point(values, at + 1),
    ];
    const [a, b] = pair(hair.mesh.positions),
      [ma, mb] = pair(moved.mesh.positions);
    TestValidator.predicate(
      "fibre station follows skin under original transport bound",
      vclose(
        Vector3.scale(Vector3.add(ma, mb), 0.5),
        Vector3.add(Vector3.scale(Vector3.add(a, b), 0.5), offset),
        1e-9,
      ),
    );
    const width = Vector3.subtract(b, a),
      movedWidth = Vector3.subtract(mb, ma);
    const represented = (p: ReturnType<typeof point>) =>
      Vector3.create(Math.fround(p.x), Math.fround(p.y), Math.fround(p.z));
    TestValidator.predicate(
      "both represented coverage profiles stay positive",
      Vector3.length(width) > 0 &&
        Vector3.length(movedWidth) > 0 &&
        Vector3.length(Vector3.subtract(represented(b), represented(a))) > 0 &&
        Vector3.length(Vector3.subtract(represented(mb), represented(ma))) > 0,
    );
    TestValidator.predicate(
      "translation retains the transverse frame",
      vclose(Vector3.normalize(width), Vector3.normalize(movedWidth), 1e-9),
    );
    at += 2;
  }
  TestValidator.predicate(
    "translation retains every metric UV station",
    hair.mesh.uvs!.every((value, at) =>
      nclose(moved.mesh.uvs![at], value, 1e-9),
    ),
  );
  TestValidator.equals("document ownership", document, before);
};
