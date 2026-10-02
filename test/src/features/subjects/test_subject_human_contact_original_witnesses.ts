import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import { assertHumanFaceBasis, resolveHumanFaceContact } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanFaceContactPlaneFixture as fixture } from "../internal/humanFaceContactPlaneFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Original signed-query support and final one-ring clearance survive contact,
 * or the entire caller-owned pose is refused without partial mutation.
 *
 * Scenarios:
 * 1. Opposed sheets require x >= 1 mm and x <= 0 simultaneously. The native
 *    infeasible result refuses while preserving all arrays and their identities.
 * 2. A tangential correction leaves an originally queried narrow triangle's
 *    rim. Losing that signed floor refuses, rather than discarding its witness.
 * 3. Moving outward beyond another original collider's 0.5 mm reach refuses;
 *    a 1.1 mm reach twin verifies the same final point and accepts. A tilted
 *    sheet also refuses when its query distance exceeds reach inside its box.
 * 4. A directly corrected vertex's 0.4 mm smoothing target reaches a neighbour
 *    originally between opposed sheets. A 0.2 mm corridor lets the neighbour
 *    take the nearest move that keeps its own floors (to the far sheet, x =
 *    0.2 mm) and not the whole 0.4 mm; a 0.6 mm corridor takes the whole move.
 *    Both count only the directly corrected group.
 * 5. A neighbour 0.2 mm outside a plane that reads only within 0.25 mm has a
 *    0.4 mm smoothing target that would leave that reach with no proof of the
 *    floor (0.4 mm of travel exceeds the 0.2 mm reading), so it stays at its
 *    original place while the directly corrected vertex is still accepted.
 */
export const test_subject_human_contact_original_witnesses = (): void => {
  const contradictory = fixture([[1, 0, 0], [-1, 0, 0]], [0.0005, 0, 0], 0.002);
  contradictory.shaped.get("budget-soft")!.splice(0, 3, 0, 0, 0);
  for (let at = 0; at < 9; at += 3)
    contradictory.posed.get("budget-plane-0")![at] += 0.001;
  const arrays = [...contradictory.posed.values()];
  const before = JSON.stringify([...contradictory.posed]);
  TestValidator.predicate("incompatible original floors refuse native infeasibility",
    throwsError(() => resolveHumanFaceContact(contradictory.basis,
      contradictory.basis.contact!, contradictory.posed, contradictory.shaped),
    ["vertex 0", "simultaneous contact solve returned no verified displacement"]));
  TestValidator.equals("infeasibility preserves all pose values", JSON.stringify([...contradictory.posed]), before);
  TestValidator.predicate("infeasibility preserves buffer identities",
    [...contradictory.posed.values()].every((one, index) => one === arrays[index]));

  const rim = fixture([[1, 0, 0], [0, 1, 0]], [-0.0008, 0.0003, 0], 0.001);
  rim.posed.set("budget-plane-1", [
    -0.002, 0, -0.01, -0.0012, 0, 0.01, -0.0002, 0, -0.01,
  ]);
  const rimQuery = createAutoMovieSignedMeshQuery({
    positions: rim.posed.get("budget-plane-1")!, indices: [0, 1, 2],
    normals: null, uvs: null, skin: null,
  }, { boundary: "open" });
  TestValidator.predicate("the original point has a signed floor and the corrected point reaches the rim",
    !rimQuery(rim.point).boundary && rimQuery([0, 0.0003, 0]).boundary);
  const rimBefore = JSON.stringify([...rim.posed]);
  TestValidator.predicate("a corrected point cannot abandon an original sheet at its rim",
    throwsError(() => resolveHumanFaceContact(rim.basis, rim.basis.contact!, rim.posed, rim.shaped),
      ["contact floor cannot be verified", "vertex 0", "rim"]));
  TestValidator.equals("rim refusal preserves original poses", JSON.stringify([...rim.posed]), rimBefore);

  const reach = fixture([[1, 0, 0], [1, 0, 0]], [-0.0008, 0, 0], 0.001);
  reach.basis.contact!.colliders[1].reachMetres = 0.0005;
  for (let at = 0; at < 9; at += 3) {
    reach.shaped.get("budget-plane-1")![at] = 0.0006;
    reach.posed.get("budget-plane-1")![at] = -0.001;
  }
  const reachBefore = JSON.stringify([...reach.posed]);
  TestValidator.predicate("a corrected point cannot abandon an original collider beyond reach",
    throwsError(() => resolveHumanFaceContact(reach.basis, reach.basis.contact!, reach.posed, reach.shaped),
      ["contact floor cannot be verified", "vertex 0", "reach"]));
  TestValidator.equals("reach refusal preserves original poses", JSON.stringify([...reach.posed]), reachBefore);
  reach.basis.contact!.colliders[1].reachMetres = 0.0011;
  TestValidator.equals("a final point within original reach accepts",
    resolveHumanFaceContact(reach.basis, reach.basis.contact!, reach.posed, reach.shaped)[0].vertices, 1);

  const tilted = fixture([[1, 0, 0], [0.6, 0.8, 0]], [-0.0008, 0, 0], 0.001);
  tilted.basis.contact!.colliders[1].reachMetres = 0.0005;
  for (let at = 0; at < 9; at += 3)
    for (let axis = 0; axis < 3; axis++) {
      const normal = [0.6, 0.8, 0][axis];
      tilted.shaped.get("budget-plane-1")![at + axis] += 0.00028 * normal;
      tilted.posed.get("budget-plane-1")![at + axis] -= 0.00068 * normal;
    }
  TestValidator.predicate("query distance is checked even inside the original bounding box",
    throwsError(() => resolveHumanFaceContact(tilted.basis, tilted.basis.contact!, tilted.posed, tilted.shaped),
      ["contact floor cannot be verified", "vertex 0", "reach"]));

  for (const width of [0.0002, 0.0006]) {
    const spread = fixture([[1, 0, 0], [-1, 0, 0]], [-0.0008, 0, 0], 0.001);
    const second = spread.basis.surfaces.find((one) => one.id === "budget-plane-1")!;
    for (let at = 0; at < 9; at += 3) {
      second.positions[at] = width;
      spread.posed.get(second.id)![at] = width;
      spread.shaped.get(second.id)![at] = width;
    }
    const soft = spread.basis.surfaces.find((one) => one.id === "budget-soft")!;
    soft.positions.splice(3, 3, 0.0001, 0.001, 0);
    spread.posed.get(soft.id)!.splice(3, 3, 0.0001, 0.001, 0);
    spread.shaped.get(soft.id)!.splice(3, 3, 0.0001, 0.001, 0);
    assertHumanFaceBasis(spread.basis);
    if (width === 0.0002) {
      const buffer = spread.posed.get(soft.id)!;
      const summary = resolveHumanFaceContact(spread.basis, spread.basis.contact!, spread.posed, spread.shaped);
      TestValidator.predicate("one-ring takes the move nearest its target that stays inside its own corridor",
        nclose(buffer[3], width, 1e-12));
      TestValidator.equals("a limited spread-only neighbour is still excluded from the count", summary[0].vertices, 1);
    } else {
      const buffer = spread.posed.get(soft.id)!;
      const summary = resolveHumanFaceContact(spread.basis, spread.basis.contact!, spread.posed, spread.shaped);
      TestValidator.predicate("one-ring positive twin preserves the original corridor",
        nclose(buffer[3], 0.0005) && buffer[3] <= width);
      TestValidator.equals("spread-only neighbour is excluded from the count", summary[0].vertices, 1);
      TestValidator.predicate("successful contact preserves the output array identity", buffer === spread.posed.get(soft.id));
    }
  }

  const keep = fixture([[1, 0, 0], [1, 0, 0]], [-0.0008, 0, 0], 0.001);
  keep.basis.contact!.colliders[1].reachMetres = 0.00025;
  const plane = keep.basis.surfaces.find((one) => one.id === "budget-plane-1")!;
  const near = keep.basis.surfaces.find((one) => one.id === "budget-soft")!;
  for (let at = 0; at < 9; at += 3) {
    plane.positions[at] = -0.0001;
    keep.posed.get(plane.id)![at] = -0.0001;
    keep.shaped.get(plane.id)![at] = -0.0001;
  }
  near.positions.splice(3, 3, 0.0001, 0.001, 0);
  keep.posed.get(near.id)!.splice(3, 3, 0.0001, 0.001, 0);
  keep.shaped.get(near.id)!.splice(3, 3, 0.0001, 0.001, 0);
  assertHumanFaceBasis(keep.basis);
  const kept = keep.posed.get(near.id)!;
  const summary = resolveHumanFaceContact(keep.basis, keep.basis.contact!, keep.posed, keep.shaped);
  TestValidator.predicate("the directly corrected vertex is accepted", nclose(kept[0], 0, 1e-12));
  TestValidator.equals("a neighbour whose smoothing move leaves a sheet's reach stays put", kept[3], 0.0001);
  TestValidator.equals("the kept neighbour is not counted", summary[0].vertices, 1);
};
