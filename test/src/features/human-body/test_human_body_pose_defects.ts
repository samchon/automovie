import { TestValidator } from "@nestia/e2e";

import {
  BODY_POSE_DEFECT_ZONES,
  bodyPoseDefectZone,
} from "../../../scripts/body-basis/bodyPoseDefectZone";
import { formatBodyPoseDefectTable } from "../../../scripts/body-basis/formatBodyPoseDefectTable";
import { measureBodyPoseDefects } from "../../../scripts/body-basis/measureBodyPoseDefects";
import { nclose } from "../internal/predicates";

const CUBE = [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1];
const CUBE_TRIANGLES = [
  0, 3, 2, 0, 2, 1, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0,
  4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5,
];
const trunk = () => "trunk" as const;
const scaled = (positions: number[], x: number, y: number, z: number) =>
  positions.map((value, i) => value * [x, y, z][i % 3]);

/**
 * The pose-defect measures on a unit cube whose skin is known by hand: an
 * identity pose reads as no defect, and each failure of skinning (a
 * stretch, a crush, a fold, a lost volume) reads as the number its geometry
 * gives.
 *
 * Scenarios:
 * 1. The posed cube equals the rest cube: every ratio is one, no zone has a
 *    stretched, crushed or folded element, and the volume is one.
 * 2. The cube doubled in every direction: each of its twelve triangles has
 *    four times its area (past the stretch cut-off), the surface area is four
 *    times and the volume eight times, and no edge folds.
 * 3. The cube flattened to a fifth of its height: the eight side triangles
 *    fall to a fifth of their area (crushed), the four top and bottom
 *    triangles keep it, and the volume is a fifth.
 * 4. Two triangles sharing one edge, flat at rest, bent 90 degrees in the
 *    pose: the worst fold is 90 degrees at that edge and it counts as one
 *    fold; bent 30 degrees the worst fold reads 30 and none counts, the
 *    negative twin one input away.
 * 5. The cube with its top face removed still reads volume one: the open rim
 *    is closed by a fan to its own centroid.
 * 6. A triangle of no area at rest is skipped, so it cannot divide by zero.
 * 7. Two zones read separately: the cube's lower vertices assigned to the leg and
 *    the upper ones to the trunk, with the top face's own triangles (the
 *    trunk's) unstretched while the side triangles that start at a lower
 *    vertex (the leg's) stretch, and an empty zone reads one.
 * 8. The zone of a bone: a clavicle bone is the shoulder, an upper arm the
 *    arm, a finger the hand, a lower leg the leg, toes the foot, and the
 *    spine the trunk.
 * 9. The table prints a dash for a quiet zone, the measured cell for a
 *    stretched zone, and the refusal for a refused state.
 */
export const test_human_body_pose_defects = (): void => {
  const measure = (
    posed: number[],
    indices = CUBE_TRIANGLES,
    rest = CUBE,
    zoneOfVertex: Parameters<typeof measureBodyPoseDefects>[0]["zoneOfVertex"] = trunk,
  ) => measureBodyPoseDefects({ indices, rest, posed, zoneOfVertex });

  const same = measure(CUBE);
  TestValidator.predicate(
    "identity keeps every ratio at one",
    nclose(same.areaRatio, 1) &&
      nclose(same.volumeRatio, 1) &&
      nclose(same.zones.trunk.minAreaRatio, 1) &&
      nclose(same.zones.trunk.maxAreaRatio, 1),
  );
  TestValidator.equals(
    "identity has no defect",
    [
      same.zones.trunk.crushed,
      same.zones.trunk.stretched,
      same.zones.trunk.folds,
      same.zones.trunk.worstFold,
    ],
    [0, 0, 0, 0],
  );
  TestValidator.equals("twelve triangles counted", same.zones.trunk.triangles, 12);

  const doubled = measure(scaled(CUBE, 2, 2, 2));
  TestValidator.equals("doubling stretches every triangle", doubled.zones.trunk.stretched, 12);
  TestValidator.predicate(
    "doubling quadruples area and octuples volume",
    nclose(doubled.areaRatio, 4) && nclose(doubled.volumeRatio, 8),
  );
  TestValidator.equals("doubling folds nothing", doubled.zones.trunk.folds, 0);

  const flat = measure(scaled(CUBE, 1, 0.2, 1));
  TestValidator.equals("side triangles are crushed", flat.zones.trunk.crushed, 8);
  TestValidator.equals("nothing stretched when flattened", flat.zones.trunk.stretched, 0);
  TestValidator.predicate("flattening scales the volume", nclose(flat.volumeRatio, 0.2));
  TestValidator.predicate(
    "the smallest triangle is a fifth of its rest area",
    nclose(flat.zones.trunk.minAreaRatio, 0.2),
  );

  const sheet = [0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0];
  const sheetTriangles = [0, 1, 2, 0, 2, 3];
  // the fourth corner turned about the shared diagonal (0,0,0)-(1,1,0)
  const bent = (degrees: number): number[] => {
    const turn = (degrees * Math.PI) / 180;
    const half = Math.SQRT1_2;
    return [
      0, 0, 0, 1, 0, 0, 1, 1, 0,
      0.5 * (1 - Math.cos(turn)),
      Math.cos(turn) + 0.5 * (1 - Math.cos(turn)),
      half * Math.sin(turn),
    ];
  };
  const folded = measure(bent(90), sheetTriangles, sheet);
  TestValidator.predicate(
    "a quarter fold reads ninety degrees",
    nclose(folded.zones.trunk.worstFold, 90),
  );
  TestValidator.equals("a quarter fold counts once", folded.zones.trunk.folds, 1);
  TestValidator.predicate(
    "the fold is at an end of the shared diagonal",
    [
      [0, 0, 0],
      [1, 1, 0],
    ].some(
      (end) =>
        folded.zones.trunk.worstFoldAt?.every((v, i) => nclose(v, end[i])) ===
        true,
    ),
  );
  const shallow = measure(bent(30), sheetTriangles, sheet);
  TestValidator.predicate(
    "a shallow fold reads thirty degrees",
    nclose(shallow.zones.trunk.worstFold, 30),
  );
  TestValidator.equals("a shallow fold does not count", shallow.zones.trunk.folds, 0);

  const open = measure(
    CUBE.slice(),
    CUBE_TRIANGLES.filter((_, i) => i < 18 || i >= 24),
    CUBE,
  );
  TestValidator.predicate(
    "an open rim is closed by its fan",
    nclose(open.volumeRatio, 1),
  );

  const degenerate = measure(
    [...CUBE, 5, 5, 5],
    [...CUBE_TRIANGLES, 0, 0, 8],
    [...CUBE, 0, 0, 0],
  );
  TestValidator.equals(
    "a triangle with no rest area is skipped",
    degenerate.zones.trunk.triangles,
    12,
  );

  const split = measure(
    scaled(CUBE, 1, 1, 1).map((value, i) => (i % 3 === 1 && value === 1 ? 3 : value)),
    CUBE_TRIANGLES,
    CUBE,
    (vertex) => (CUBE[3 * vertex + 1] === 0 ? "leg" : "trunk"),
  );
  TestValidator.predicate(
    "only the zone of the lower vertices, whose triangles stretched, reports it",
    split.zones.leg.stretched > 0 && split.zones.trunk.stretched === 0,
  );
  TestValidator.equals("the quiet zone has no triangle to read", split.zones.hand.triangles, 0);
  TestValidator.predicate(
    "an empty zone reads one",
    nclose(split.zones.hand.minAreaRatio, 1) && nclose(split.zones.hand.maxAreaRatio, 1),
  );

  TestValidator.equals(
    "bones fall into their zones",
    (
      [
        "leftShoulder",
        "rightUpperArm",
        "leftLowerArm",
        "leftIndexDistal",
        "leftHand",
        "rightLowerLeg",
        "leftUpperLeg",
        "leftToes",
        "rightFoot",
        "spine",
        "neck",
      ] as const
    ).map(bodyPoseDefectZone),
    ["shoulder", "arm", "arm", "hand", "hand", "leg", "leg", "foot", "foot", "trunk", "trunk"],
  );
  TestValidator.equals("six zones", BODY_POSE_DEFECT_ZONES.length, 6);

  const table = formatBodyPoseDefectTable([
    { shape: "neutral", pose: "same", defects: same },
    { shape: "neutral", pose: "big", defects: doubled },
    { shape: "neutral", pose: "far", defects: null, refused: "past the range" },
    { shape: "neutral", pose: "unsaid", defects: null },
  ]);
  const lines = table.split("\n");
  TestValidator.equals("header, rule, four rows and a newline", lines.length, 7);
  TestValidator.predicate("a quiet row is dashes", lines[2].includes("| - | - | - | - | - | - |"));
  TestValidator.predicate(
    "a stretched zone prints its cell",
    lines[3].includes("0/0 4.00-4.00 0+12"),
  );
  TestValidator.predicate("a refusal prints its cause", lines[4].includes("refused: past the range"));
  TestValidator.predicate("a refusal without a message prints none", lines[5].endsWith("refused:  |"));
};
