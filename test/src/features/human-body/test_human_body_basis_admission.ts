import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * One malformed correspondence never reaches a partially admitted body basis.
 *
 * Scenarios:
 * 1. Identity, envelope, mirror, corrective and sparse-row boundaries each have a negative twin.
 * 2. Region partition faults, undeclared endpoints and an endpoint that moves nothing refuse.
 * 3. Rig faults refuse: root order, parent order, missing landmark, parallel reference, sign versus constraint, range without rest, a rest angle outside its range or on a held axis, skin index and weight sum.
 * 4. The untouched fixture and a tiny finite endpoint remain valid adjacent cases.
 */
export const test_human_body_basis_admission = (): void => {
  const patches: [string, (basis: IAutoMovieHumanBodyBasis) => void][] = [
    [
      "unknown field",
      (b) => {
        (b as unknown as Record<string, unknown>).extra = 1;
      },
    ],
    [
      "blank identity",
      (b) => {
        b.id = " ";
      },
    ],
    [
      "duplicate channel",
      (b) => {
        b.channels.push({ ...b.channels[0] });
      },
    ],
    [
      "envelope excludes zero",
      (b) => {
        b.channels[0].minimum = 0.5;
      },
    ],
    [
      "negative side without endpoint",
      (b) => {
        b.channels[0].negative = null;
      },
    ],
    [
      "nonnegative with negative endpoint",
      (b) => {
        b.channels[1].negative = "narrow";
      },
    ],
    [
      "mirror not reciprocal",
      (b) => {
        b.channels[3].mirror = null;
      },
    ],
    [
      "mirror across groups",
      (b) => {
        b.channels[3].group = "legs";
      },
    ],
    [
      "mirror to self",
      (b) => {
        b.channels[2].mirror = "sideLeft";
      },
    ],
    [
      "corrective drives a missing side",
      (b) => {
        b.correctives![0].inputs[1].side = "negative";
      },
    ],
    [
      "corrective gain above one",
      (b) => {
        b.correctives![0].weight = 1.5;
      },
    ],
    [
      "corrective shares a channel id",
      (b) => {
        b.correctives![0].id = "width";
      },
    ],
    [
      "corrective duplicate drivers",
      (b) => {
        b.correctives![0].inputs[1] = { ...b.correctives![0].inputs[0] };
      },
    ],
    [
      "surface rows name an undeclared endpoint",
      (b) => {
        b.surfaces[0].targets.ghost = [0, 1, 0, 0];
      },
    ],
    [
      "landmark rows name an undeclared endpoint",
      (b) => {
        b.landmarks.targets.ghost = [0, 1, 0, 0];
      },
    ],
    [
      "rows not increasing",
      (b) => {
        b.surfaces[0].targets.leftOut = [5, 1, 0, 0, 4, 1, 0, 0];
      },
    ],
    [
      "row beyond population",
      (b) => {
        b.surfaces[0].targets.leftOut = [8, 1, 0, 0];
      },
    ],
    [
      "zero row",
      (b) => {
        b.surfaces[0].targets.leftOut = [4, 0, 0, 0];
      },
    ],
    [
      "nonfinite row",
      (b) => {
        b.surfaces[0].targets.leftOut = [4, Number.NaN, 0, 0];
      },
    ],
    [
      "endpoint moves nothing",
      (b) => {
        delete b.surfaces[0].targets.rightOut;
      },
    ],
    [
      "ragged positions",
      (b) => {
        b.surfaces[0].positions.push(1);
      },
    ],
    [
      "index beyond vertices",
      (b) => {
        b.surfaces[0].indices[0] = 8;
      },
    ],
    [
      "reversed triangle breaks orientation",
      (b) => {
        const i = b.surfaces[0].indices;
        [i[0], i[1]] = [i[1], i[0]];
        b.surfaces[0].regions[0].indices = i.slice();
      },
    ],
    [
      "region omits a triangle",
      (b) => {
        b.surfaces[0].regions[0].indices = b.surfaces[0].indices.slice(3);
      },
    ],
    [
      "region duplicates a triangle",
      (b) => {
        b.surfaces[0].regions[0].indices = [
          ...b.surfaces[0].indices,
          ...b.surfaces[0].indices.slice(0, 3),
        ];
      },
    ],
    [
      "region names a missing material",
      (b) => {
        b.surfaces[0].regions[0].material = "lips";
      },
    ],
    [
      "uv length mismatch",
      (b) => {
        b.surfaces[0].regions[0].uvs = [0, 0];
      },
    ],
    [
      "root is not first",
      (b) => {
        b.joints.reverse();
      },
    ],
    [
      "second root",
      (b) => {
        b.joints[1].parent = null;
      },
    ],
    [
      "parent after child",
      (b) => {
        b.joints[1].parent = "chest";
      },
    ],
    [
      "duplicate joint",
      (b) => {
        b.joints.push({ ...b.joints[1] });
      },
    ],
    [
      "missing landmark",
      (b) => {
        b.joints[1].tail = "joint-neck";
      },
    ],
    [
      "head equals tail",
      (b) => {
        b.joints[1].tail = b.joints[1].head;
      },
    ],
    [
      "reference parallel to the bone",
      (b) => {
        b.joints[1].reference = [0, 1, 0];
      },
    ],
    [
      "reference not unit",
      (b) => {
        b.joints[1].reference = [0, 0, 2];
      },
    ],
    [
      "sign on an immobile axis",
      (b) => {
        b.joints[1].constraint!.twist = null;
      },
    ],
    [
      "no sign on a mobile axis",
      (b) => {
        b.joints[1].signs.twist = null;
      },
    ],
    [
      "range without rest",
      (b) => {
        b.joints[1].constraint!.flexion = { min: 10, max: 90 };
      },
    ],
    [
      "neutral outside its range",
      (b) => {
        b.joints[1].neutral.flexion = 95;
      },
    ],
    [
      "neutral on a held axis",
      (b) => {
        b.joints[1].constraint!.twist = null;
        b.joints[1].signs.twist = null;
        b.joints[1].neutral.twist = 5;
      },
    ],
    [
      "nonfinite neutral",
      (b) => {
        b.joints[1].neutral.abduction = Number.NaN;
      },
    ],
    [
      "landmark position count",
      (b) => {
        b.landmarks.positions.push(0);
      },
    ],
    [
      "skin names an undeclared joint",
      (b) => {
        b.surfaces[0].skin.joints = ["hips", "chest"];
      },
    ],
    [
      "skin index beyond joints",
      (b) => {
        b.surfaces[0].skin.boneIndices[0] = 2;
      },
    ],
    [
      "skin weights do not sum to one",
      (b) => {
        b.surfaces[0].skin.weights[0] = 0.5;
      },
    ],
    [
      "negative skin weight",
      (b) => {
        b.surfaces[0].skin.weights[0] = 1.5;
        b.surfaces[0].skin.weights[1] = -0.5;
      },
    ],
  ];
  for (const [title, patch] of patches) {
    const { basis } = humanBodyBasisFixture();
    patch(basis);
    TestValidator.predicate(
      "refused: " + title,
      throwsError(() => createHumanBodyBasisBuilder(basis)),
    );
  }
  const { basis, document } = humanBodyBasisFixture();
  TestValidator.predicate(
    "fixture admits",
    createHumanBodyBasisBuilder(basis)(document).model.parts.length === 1,
  );
  basis.surfaces[0].targets.rightOut = [5, 1e-9, 0, 0];
  TestValidator.predicate(
    "tiny finite endpoint admits",
    createHumanBodyBasisBuilder(basis)(document).model.parts.length === 1,
  );
};
