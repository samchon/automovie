import { preparePortraitHead } from "@automovie/human/face/anatomy/cranium/preparePortraitHead";
import { sealPortraitContactSeams } from "@automovie/human/face/surface/sealPortraitContactSeams";
import { TestValidator } from "@nestia/e2e";

import {
  alternatePortraitEye,
  alternatePortraitNose,
  portraitComponentsFor,
  portraitEyeShape,
} from "../../subjects/generated-korean-girl-01/configuration";
import { referenceControlNet } from "../../subjects/generated-korean-girl-01/controlNet";

/**
 * The assembled replacement cage (one eye and the nose replaced) has two
 * oppositely wound incident faces on each internal edge and exactly four closed
 * boundary loops, with no new seam openings. Loop refinement has its own
 * adjacency scenarios and does not create these component joins, so the cage is
 * built with zero refinement rounds. Preparation and contact sealing own this
 * topology; independent interior generation, normals and material packing are
 * downstream and do not participate in its admission.
 *
 * Scenarios:
 * 1. No edge is nonmanifold or inverted.
 * 2. Every border vertex has exactly two border neighbours (closed loops).
 * 3. Exactly the two eye openings, the mouth opening and the lower neck crop
 *    remain as boundary loops.
 */
export const test_subject_component_replacement_seam = (): void => {
  const sampling = { eyeColumns: 4, eyeRows: 2, irisColumns: 6, irisRows: 2 };
  const eye = { ...portraitEyeShape, browFibres: 0, upperLashes: 1, sampling };
  const alternate = {
    ...alternatePortraitEye,
    browFibres: 0,
    upperLashes: 1,
    sampling,
  };
  const host = {
    positions: referenceControlNet.positions,
    indices: referenceControlNet.indices,
    viewRay: referenceControlNet.viewRay,
  };
  const replacementParts = portraitComponentsFor(
    eye,
    alternate,
    alternatePortraitNose,
  );
  const prepared = preparePortraitHead(host, replacementParts, 0);
  const refined = sealPortraitContactSeams(
    prepared.surface,
    prepared.finishers.flatMap((attached) => attached.closures ?? []),
  );
  {
    const edges = new Map<
      string,
      { a: number; b: number; count: number; direction: number }
    >();
    for (let i = 0; i < refined.indices.length; i += 3)
      for (let j = 0; j < 3; j++) {
        const a = refined.indices[i + j],
          b = refined.indices[i + ((j + 1) % 3)];
        const key = Math.min(a, b) + "/" + Math.max(a, b);
        const edge = edges.get(key) ?? { a, b, count: 0, direction: 0 };
        edge.count++;
        edge.direction += a < b ? 1 : -1;
        edges.set(key, edge);
      }
    TestValidator.predicate(
      "no nonmanifold or inverted seam",
      [...edges.values()].every(
        (edge) =>
          edge.count === 1 || (edge.count === 2 && edge.direction === 0),
      ),
    );
    const boundary = new Map<number, number[]>();
    for (const edge of edges.values())
      if (edge.count === 1) {
        boundary.set(edge.a, [...(boundary.get(edge.a) ?? []), edge.b]);
        boundary.set(edge.b, [...(boundary.get(edge.b) ?? []), edge.a]);
      }
    TestValidator.predicate(
      "every border is a closed loop",
      [...boundary.values()].every((neighbours) => neighbours.length === 2),
    );
    const seen = new Set<number>();
    let loops = 0;
    for (const seed of boundary.keys()) {
      if (seen.has(seed)) continue;
      loops++;
      const pending = [seed];
      while (pending.length !== 0) {
        const at = pending.pop()!;
        if (seen.has(at)) continue;
        seen.add(at);
        pending.push(...boundary.get(at)!);
      }
    }
    TestValidator.equals("only anatomical openings and crop remain", loops, 4);
  }
};
