import {
  AutoMovieThreeKind,
  buildAutoMovieConstruction,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * Generating-line display preserves declared geometry and owns its resources.
 *
 * Scenarios:
 *
 * 1. Closed and open generating lines retain point order and share one owned
 *    material.
 * 2. Repeated disposal emits each native disposal event once.
 * 3. Duplicate identities and point exhaustion refuse.
 */
export async function test_render_scene_build_construction(): Promise<void> {
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
  const [section, guide]: (THREE.Object3D | undefined)[] =
    result.object.children;
  if (
    section === undefined ||
    guide === undefined ||
    !AutoMovieThreeKind.isLine(section) ||
    !AutoMovieThreeKind.isLine(guide)
  )
    throw new Error("Expected a section and a guide line");
  TestValidator.predicate(
    "closure remains explicit",
    section.type === "LineLoop" && guide.type !== "LineLoop",
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
  const material: THREE.Material | THREE.Material[] = section.material;
  if (!AutoMovieThreeKind.isMaterial(material))
    throw new Error("Expected one line material");
  let disposals: number = 0;
  section.geometry.addEventListener("dispose", (): void => {
    disposals++;
  });
  guide.geometry.addEventListener("dispose", (): void => {
    disposals++;
  });
  material.addEventListener("dispose", (): void => {
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
