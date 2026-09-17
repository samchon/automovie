import {
  buildPortraitDentalCrown,
  buildPortraitDentalRow,
  preparePortraitDentalCrown,
  preparePortraitDentalRow,
} from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Cervical identities belong to the crown constructor and survive row assembly.
 * The independent oracle cancels paired edges of triangles on the gingival plane;
 * its remaining oriented boundary must equal the declared cycles. It assumes no
 * sampling density, vertex offset or number of profile levels.
 *
 * Scenarios:
 * 1. Symmetric and off-grid asymmetric crests, with both mesial directions, expose
 *    exactly their cap boundaries while retaining the standalone mesh result.
 * 2. Unequal crowns with and without surface separation preserve every cap cycle
 *    after merging and local rotation; the single-crown row also remains valid.
 * 3. Editing a returned cycle never changes a later result or caller input.
 */
export const test_subject_native_dental_cycles = (): void => {
  const cap = (mesh: IAutoMovieMesh, y: number): string[] => {
    const edges = new Set<string>();
    for (let at = 0; at < mesh.indices!.length; at += 3) {
      const face = mesh.indices!.slice(at, at + 3);
      if (!face.every((id) => nclose(mesh.positions[id * 3 + 1], y, 1e-12)))
        continue;
      for (let corner = 0; corner < 3; ++corner) {
        const a = face[corner],
          b = face[(corner + 1) % 3];
        if (!edges.delete(`${b}/${a}`)) edges.add(`${a}/${b}`);
      }
    }
    return [...edges].sort((a, b) => a.localeCompare(b));
  };
  const declared = (cycles: readonly (readonly number[])[]) =>
    cycles
      .flatMap((cycle) =>
        cycle.map((id, i) => `${id}/${cycle[(i + 1) % cycle.length]}`),
      )
      .sort((a, b) => a.localeCompare(b));
  const base = {
    width: 5,
    height: 7,
    depth: 1.5,
    cervicalWidth: 0.8,
    edgeRise: 0.3,
  };
  const shapes = [
    base,
    {
      ...base,
      width: 6,
      height: 8,
      contour: {
        mesial: { contactHeight: 0.23 },
        distal: { contactHeight: 0.37 },
      },
    },
  ];
  const saved = structuredClone(shapes);
  for (const shape of shapes)
    for (const direction of [-1, 1]) {
      const result = preparePortraitDentalCrown(shape, direction);
      TestValidator.equals(
        "native crown matches standalone geometry",
        result.mesh,
        buildPortraitDentalCrown(shape, direction),
      );
      TestValidator.predicate(
        "cap cycle is populated",
        result.cervical.length >= 3,
      );
      TestValidator.equals(
        "constructor cycle equals geometric cap boundary",
        declared([result.cervical]),
        cap(result.mesh, shape.height / 2),
      );
    }
  TestValidator.predicate(
    "different profile levels really alter indexing",
    preparePortraitDentalCrown(shapes[0]).mesh.positions.length !==
      preparePortraitDentalCrown(shapes[1]).mesh.positions.length,
  );
  for (const crowns of [shapes, [base]])
    for (const contactGap of [undefined, 0.1]) {
      const input = { halfWidth: 24, depth: 18, gap: 0.1, crowns, contactGap };
      const result = preparePortraitDentalRow(input);
      TestValidator.equals(
        "one cap per authored crown",
        result.cervical.length,
        crowns.length,
      );
      TestValidator.equals(
        "merged cycles equal all cap boundaries",
        declared(result.cervical),
        cap(result.mesh, 0),
      );
      TestValidator.equals(
        "native row matches standalone geometry",
        result.mesh,
        buildPortraitDentalRow(input),
      );
      const before = structuredClone(result);
      result.cervical[0][0] = -1;
      result.mesh.positions[0] = 999;
      TestValidator.equals(
        "row preparation owns geometry and identities",
        preparePortraitDentalRow(input),
        before,
      );
    }
  TestValidator.equals("preparation retains crown input", shapes, saved);
};
