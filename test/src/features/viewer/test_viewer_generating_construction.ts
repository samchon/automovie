import { buildAutoMovieConstruction } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * Generating-line display preserves declared geometry and owns its resources.
 *
 * Scenarios:
 * 1. Closed and open generating lines retain point order and share one owned material.
 * 2. Repeated disposal emits each native disposal event once.
 * 3. Sparse/nonfinite/float32-overflow points, duplicate identities and point exhaustion refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds actual native line objects, checks their position buffers and closure kinds, then listens to native disposal events without replacing methods. Invalid resident inputs must throw before creating an accepted result.
 * @evidence contracts/testing.md#independent-expectations Explicit input points and Line/LineLoop closure semantics define expected native positions and topology; two allocated geometries and their shared material each own one disposal event.
 * @evidence contracts/testing.md#distinguishing-cases Covers open versus closed polylines, shared material identity, repeat retirement, duplicate IDs, sparse coordinates, nonfinite and float32-unrepresentable values, and exact point-budget boundary. GPU appearance and pixel acceptance are real-host inspection responsibilities.
 * @evidence contracts/testing.md#execution-ownership The portable async test_viewer_generating_construction entry creates Three CPU objects and native event listeners only, with no renderer, browser, process, installation, global replacement or Human viewer.
 */
export async function test_viewer_generating_construction(): Promise<void> {
  const lines: Parameters<typeof buildAutoMovieConstruction>[0] = [
    {
      id: "section",
      closed: true,
      points: [
        [0, 0, 0],
        [1, 0, 0],
        [0, 1, 0],
      ],
    },
    {
      id: "guide",
      closed: false,
      points: [
        [0, 0, 0],
        [0, 0, 1],
      ],
    },
  ];
  const result: ReturnType<typeof buildAutoMovieConstruction> =
    buildAutoMovieConstruction(lines, { color: 0xff9900, maxPoints: 5 });
  const section: THREE.Line = result.object.children[0] as THREE.Line;
  const guide: THREE.Line = result.object.children[1] as THREE.Line;
  TestValidator.predicate(
    "closure remains explicit",
    section instanceof THREE.LineLoop && !(guide instanceof THREE.LineLoop),
  );
  TestValidator.equals(
    "native points follow supplied order",
    Array.from(section.geometry.getAttribute("position").array),
    [0, 0, 0, 1, 0, 0, 0, 1, 0],
  );
  TestValidator.predicate(
    "one material shared within result",
    section.material === guide.material,
  );
  if (Array.isArray(section.material))
    throw new Error("Expected one line material");
  let disposals: number = 0;
  section.geometry.addEventListener("dispose", (): void => {
    disposals++;
  });
  guide.geometry.addEventListener("dispose", (): void => {
    disposals++;
  });
  section.material.addEventListener("dispose", (): void => {
    disposals++;
  });
  await result.dispose();
  await result.dispose();
  TestValidator.equals("all three resources disposed once", disposals, 3);
  const variants: {
    id: string;
    closed: boolean;
    points: [number, number, number][];
  }[][] = [
    [
      {
        id: "sparse",
        closed: false,
        points: [
          [0, 0, 0],
          [1, 2, 3],
        ],
      },
    ],
    [
      {
        id: "nonfinite",
        closed: false,
        points: [
          [0, 0, 0],
          [Infinity, 0, 0],
        ],
      },
    ],
    [
      {
        id: "overflow",
        closed: false,
        points: [
          [0, 0, 0],
          [1e300, 0, 0],
        ],
      },
    ],
    [
      {
        id: "same",
        closed: false,
        points: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      },
      {
        id: "same",
        closed: false,
        points: [
          [0, 0, 0],
          [1, 0, 0],
        ],
      },
    ],
  ];
  const sparse: number[] = variants[0][0].points[1];
  delete sparse[1];
  for (const invalid of variants) {
    let refused: boolean = false;
    try {
      buildAutoMovieConstruction(invalid, { color: 0, maxPoints: 5 });
    } catch {
      refused = true;
    }
    TestValidator.predicate("unsupported construction refuses", refused);
  }
  let exhausted: boolean = false;
  try {
    buildAutoMovieConstruction(lines, { color: 0, maxPoints: 4 });
  } catch {
    exhausted = true;
  }
  TestValidator.predicate("point-budget boundary enforced", exhausted);
}
