import {
  HUMAN_BODY_MEASUREMENTS,
  createHumanBodyBasisBuilder,
  evaluateHumanBodyMeasurement,
  humanBodyClipRing,
  humanBodySurfaceBoundary,
  measureHumanBodyBasisChannels,
  measureHumanBodySimpleShape,
  measureHumanBodyVolume,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Analytic topology contract for mass and multi-surface measurements.
 * Two-loop, closed, disjoint, nested, coincident, oblique-touching and
 * shaped-overlap boxes pin volume admission. A crossing nonplanar cap,
 * self-crossing cap and collapsed cap pin geometric refusals. Height,
 * endpoint displacement and seed-nearest girth read every surface.
 */
export const test_human_body_topology_2569 = (): void => {
  const { basis } = humanBodyBasisFixture();
  const surface = basis.surfaces[0];
  const twoOpen = surface.indices.slice(0, 24);
  TestValidator.predicate(
    "two independently capped boundary loops retain box volume",
    nclose(measureHumanBodyVolume(surface.positions, twoOpen), 0.16),
  );
  const openBasis = {
    ...basis,
    surfaces: [
      {
        ...surface,
        indices: twoOpen,
        regions: [{ ...surface.regions[0], indices: twoOpen }],
      },
    ],
  };
  TestValidator.predicate(
    "two-loop box remains admissible",
    createHumanBodyBasisBuilder(openBasis) !== undefined,
  );
  const crossingCapPositions = surface.positions.slice();
  crossingCapPositions.splice(4 * 3, 3, -0.4, 1, -0.5);
  crossingCapPositions.splice(6 * 3, 3, 0, 1, 0.4);
  let capReason = "";
  try {
    createHumanBodyBasisBuilder({
      ...openBasis,
      surfaces: [{ ...openBasis.surfaces[0], positions: crossingCapPositions }],
    });
  } catch (error) {
    capReason = (error as Error).message;
  }
  TestValidator.predicate(
    "a nonplanar centroid fan crossing its source refuses admission",
    capReason.includes("cap cannot cross its source surface"),
  );
  const collapsedCap = surface.positions.slice();
  collapsedCap.splice(4 * 3, 3, -0.1, 2, 0);
  collapsedCap.splice(5 * 3, 3, 0.1, 2, 0);
  collapsedCap.splice(6 * 3, 3, 0, 2, 0.2);
  collapsedCap.splice(7 * 3, 3, 0, 2, -0.2);
  let collapsedReason = "";
  try {
    createHumanBodyBasisBuilder({
      ...openBasis,
      surfaces: [{ ...openBasis.surfaces[0], positions: collapsedCap }],
    });
  } catch (error) {
    collapsedReason = (error as Error).message;
  }
  TestValidator.predicate(
    "a centroid lying on a boundary edge refuses its zero-area cap",
    collapsedReason.includes("cap cannot have zero-area faces"),
  );
  const selfCrossingCap = surface.positions.slice();
  selfCrossingCap[1] = 2.5;
  selfCrossingCap[4 * 3 + 1] = 1;
  let selfCrossingReason = "";
  try {
    createHumanBodyBasisBuilder({
      ...openBasis,
      surfaces: [{ ...openBasis.surfaces[0], positions: selfCrossingCap }],
    });
  } catch (error) {
    selfCrossingReason = (error as Error).message;
  }
  TestValidator.predicate(
    "overlapping cap triangles refuse admission",
    selfCrossingReason.includes("cap cannot cross itself"),
  );
  const loops = humanBodySurfaceBoundary(twoOpen, true);
  TestValidator.predicate(
    "top and bottom boundaries stay separate",
    loops.length === 2 && loops.every((loop) => loop.length === 4),
  );
  TestValidator.equals(
    "height chooses the upper clip loop",
    humanBodyClipRing({ ...surface, indices: twoOpen }),
    [4, 5, 6, 7],
  );
  TestValidator.equals(
    "closed surface has no loops",
    humanBodySurfaceBoundary(surface.indices, true),
    [],
  );
  TestValidator.predicate(
    "two boundaries sharing a vertex cannot define separate caps",
    throwsError(() => humanBodySurfaceBoundary([0, 1, 2, 0, 3, 4], true)),
  );
  const second = {
    ...surface,
    id: "second-box",
    positions: surface.positions.map((value, i) =>
      i % 3 === 1 ? value + 3 : value,
    ),
    regions: surface.regions.map((region) => ({
      ...region,
      id: "second-box/skin",
    })),
  };
  const pair = { ...basis, surfaces: [surface, second] };
  TestValidator.predicate(
    "simple volume sums two separate capped surfaces",
    nclose(measureHumanBodySimpleShape.volume(pair, {}), 0.32),
  );
  const pairedWidth = measureHumanBodyBasisChannels(pair).find(
    (channel) => channel.id === "width",
  )!;
  TestValidator.predicate(
    "endpoint displacement counts both surface populations",
    pairedWidth.positive.vertices === 16 &&
      nclose(pairedWidth.positive.displacement, 0.05),
  );
  const heightAcrossSurfaces = evaluateHumanBodyMeasurement(
    pair,
    {},
    HUMAN_BODY_MEASUREMENTS.macroHeight,
  );
  TestValidator.predicate(
    "height spans both surfaces",
    heightAcrossSurfaces !== null && nclose(heightAcrossSurfaces, 5),
  );
  TestValidator.predicate(
    "height follows the shaped upper surface",
    nclose(
      evaluateHumanBodyMeasurement(
        pair,
        { tall: 1 },
        HUMAN_BODY_MEASUREMENTS.macroHeight,
      )!,
      5.5,
    ),
  );
  TestValidator.predicate(
    "repeated directed edges cannot masquerade as one boundary",
    throwsError(() => humanBodySurfaceBoundary([0, 1, 2, 0, 1, 3], true)),
  );
  const waistAcrossSurfaces = evaluateHumanBodyMeasurement(
    {
      ...basis,
      surfaces: [second, { ...surface, id: "unshifted-box" }],
    },
    {},
    HUMAN_BODY_MEASUREMENTS.measureWaistCirc,
  );
  TestValidator.predicate(
    "girth reads the second surface where the first has no section",
    waistAcrossSurfaces !== null && nclose(waistAcrossSurfaces, 1.2),
  );
  const nearestGirth = evaluateHumanBodyMeasurement(
    {
      ...basis,
      surfaces: [
        {
          ...surface,
          positions: surface.positions.map((value, i) =>
            i % 3 === 0 ? value + 1 : value,
          ),
        },
        {
          ...second,
          positions: surface.positions.map((value, i) =>
            i % 3 === 0 ? value * 2 : value,
          ),
        },
      ],
    },
    {},
    HUMAN_BODY_MEASUREMENTS.measureWaistCirc,
  );
  TestValidator.predicate(
    "seed chooses the nearer surface contour when both are closed",
    nearestGirth !== null && nclose(nearestGirth, 1.6),
  );
  const coincident = {
    ...basis,
    surfaces: [
      surface,
      { ...surface, id: "coincident", regions: second.regions },
    ],
  };
  TestValidator.predicate(
    "coincident solids refuse rather than double-count mass",
    throwsError(() => createHumanBodyBasisBuilder(coincident)),
  );
  const nested = {
    ...basis,
    surfaces: [
      surface,
      {
        ...second,
        positions: surface.positions.map((value, i) =>
          i % 3 === 1 ? 0.5 + value * 0.5 : value * 0.5,
        ),
      },
    ],
  };
  TestValidator.predicate(
    "nested solids refuse rather than double-count mass",
    throwsError(() => createHumanBodyBasisBuilder(nested)),
  );
  const reversed = nested.surfaces[1].indices.flatMap((_, i, indices) =>
    i % 3 === 0 ? [indices[i], indices[i + 2], indices[i + 1]] : [],
  );
  let reversedReason = "";
  try {
    createHumanBodyBasisBuilder({
      ...nested,
      surfaces: [
        nested.surfaces[0],
        {
          ...nested.surfaces[1],
          indices: reversed,
          regions: [{ ...nested.surfaces[1].regions[0], indices: reversed }],
        },
      ],
    });
  } catch (error) {
    reversedReason = (error as Error).message;
  }
  TestValidator.predicate(
    "inward-wound nested solid still refuses overlapping mass",
    reversedReason.includes("interiors must not overlap"),
  );
  TestValidator.predicate(
    "a collapsed shaped solid cannot report mass",
    throwsError(() =>
      measureHumanBodySimpleShape.volume(
        {
          ...basis,
          surfaces: [
            {
              ...surface,
              positions: surface.positions.map((value, i) =>
                i % 3 === 1 ? 0 : value,
              ),
            },
          ],
        },
        {},
      ),
    ),
  );
  const disjointComponent = surface.positions.map((value, i) =>
    i % 3 === 0 ? value + 1 : value,
  );
  const combinedIndices = [
    ...surface.indices,
    ...surface.indices.map((index) => index + 8),
  ];
  let disconnectedReason = "";
  try {
    createHumanBodyBasisBuilder({
      ...basis,
      surfaces: [
        {
          ...surface,
          positions: [...surface.positions, ...disjointComponent],
          indices: combinedIndices,
          regions: [{ ...surface.regions[0], indices: combinedIndices }],
          skin: {
            ...surface.skin,
            boneIndices: [
              ...surface.skin.boneIndices,
              ...surface.skin.boneIndices,
            ],
            weights: [...surface.skin.weights, ...surface.skin.weights],
          },
        },
      ],
    });
  } catch (error) {
    disconnectedReason = (error as Error).message;
  }
  TestValidator.predicate(
    "two disconnected shells cannot masquerade as one surface",
    disconnectedReason.includes("connected across its edges"),
  );
  const interleaved = {
    ...basis,
    surfaces: [
      surface,
      {
        ...second,
        positions: surface.positions.flatMap((_, i, values) =>
          i % 3 === 0
            ? [(values[i] + values[i + 2]) / Math.SQRT2 + 0.27]
            : i % 3 === 2
              ? [(values[i] - values[i - 2]) / Math.SQRT2 + 0.37]
              : [values[i]],
        ),
      },
    ],
  };
  TestValidator.predicate(
    "disjoint rotated solids with overlapping bounds remain admitted",
    nclose(measureHumanBodySimpleShape.volume(interleaved, {}), 0.32) &&
      createHumanBodyBasisBuilder(interleaved) !== undefined,
  );
  const rotate = (shift: number): number[] =>
    surface.positions.map((value, i, values) =>
      i % 3 === 0
        ? (value + shift + values[i + 2]) / Math.SQRT2
        : i % 3 === 2
          ? (value - values[i - 2] - shift) / Math.SQRT2
          : value,
    );
  const touching = {
    ...basis,
    surfaces: [
      { ...surface, positions: rotate(0) },
      { ...second, positions: rotate(0.2) },
    ],
  };
  TestValidator.predicate(
    "two rotated solids touching at a face keep additive volume",
    nclose(measureHumanBodySimpleShape.volume(touching, {}), 0.32) &&
      createHumanBodyBasisBuilder(touching) !== undefined,
  );
  TestValidator.predicate(
    "a nanometre gap remains separate past floating point contact noise",
    createHumanBodyBasisBuilder({
      ...touching,
      surfaces: [
        touching.surfaces[0],
        { ...second, positions: rotate(0.200000001) },
      ],
    }) !== undefined,
  );
  TestValidator.predicate(
    "a nanometre penetration still refuses positive overlap",
    throwsError(() =>
      createHumanBodyBasisBuilder({
        ...touching,
        surfaces: [
          touching.surfaces[0],
          { ...second, positions: rotate(0.199999999) },
        ],
      }),
    ),
  );
  const deforming = {
    ...basis,
    surfaces: [
      surface,
      {
        ...second,
        positions: surface.positions.map((value, i) =>
          i % 3 === 0 ? value + 0.22 : value,
        ),
      },
    ],
  };
  TestValidator.predicate(
    "neutral separation remains admitted before shaping",
    createHumanBodyBasisBuilder(deforming) !== undefined,
  );
  TestValidator.predicate(
    "a shaped overlap refuses mass after neutral admission",
    throwsError(() =>
      measureHumanBodySimpleShape.volume(deforming, { width: 1 }),
    ),
  );
};
