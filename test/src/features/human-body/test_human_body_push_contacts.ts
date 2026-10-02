import {
  createHumanBodyBasisBuilder,
  createHumanBodySegmenter,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { createBodyCorrectiveWorld } from "../../../scripts/body-basis/bodyCorrectiveWorld";
import { pushBodyContacts } from "../../../scripts/body-basis/pushBodyContacts";
import { readBodyContacts } from "../../../scripts/body-basis/readBodyContacts";
import { withBodyCorrective } from "../../../scripts/body-basis/withBodyCorrective";
import { bodyCorrectiveBoxFixture } from "../internal/bodyCorrectiveBoxFixture";

/**
 * A push parts the crossing segments of one posed body and carries the parting
 * to the rest frame as corrective rows.
 *
 * The basis is the foldable box with millimetre bones (see
 * `bodyCorrectiveBoxFixture`): its spine at 170 degrees crosses the hips
 * segment and the tissue gives. The independent check is the public builder:
 * the rows, worn as a corrective ramp on the spine's flexion, must pose the
 * same state without a crossing.
 *
 * Scenarios:
 * 1. A crossing pose is pushed: the log names the pair and the crease it
 *    resolved, every vertex of the box has a row, each row is the carry of its
 *    posed displacement (the same set of vertices), and the rows worn as a
 *    corrective make the builder's own posed skin cross nothing.
 * 2. Starting from those rows, a second push has nothing left to part: its
 *    rows are the same set and its log is empty.
 * 3. A pose short of the fold has no crossing, so no row and no log line.
 * 4. With the full-length bones the spine passes through the hips skin once
 *    the first sweep has pushed: a later sweep logs the pair as a bone through
 *    skin and leaves it.
 */
export const test_human_body_push_contacts = (): void => {
  const basis = bodyCorrectiveBoxFixture({ short: true });
  const world = createBodyCorrectiveWorld(basis);
  const build = createHumanBodyBasisBuilder(basis);
  const at = (flexion: number) =>
    build({
      id: "push",
      name: "push",
      basis: basis.id,
      shape: {},
      pose: [{ bone: "spine", flexion, abduction: null, twist: null }],
    });

  // 1. crossing pose
  const built = at(170);
  const push = pushBodyContacts(world, basis, built, null);
  TestValidator.predicate(
    "the log names the pair and the crease of the hips segment",
    push.log.length > 0 &&
      push.log.every((line) =>
        /^(hipsxspine\[[a-z-]+\]:(ok|left):|\[hips\]relax:)/.test(line),
      ),
  );
  TestValidator.equals(
    "every vertex of the box has a row",
    [...push.rest.keys()].sort((a, b) => a - b),
    [0, 1, 2, 3, 4, 5, 6, 7],
  );
  TestValidator.equals(
    "the rows carry the posed displacements",
    [...push.posed.keys()].sort((a, b) => a - b),
    [...push.rest.keys()].sort((a, b) => a - b),
  );
  const worn = withBodyCorrective(
    basis,
    "pose/spine.flexion@170",
    [
      {
        bone: "spine",
        axis: "flexion",
        side: "positive",
        onset: 0,
        full: 170,
      },
    ],
    push.rest,
  )!;
  const rebuilt = createHumanBodyBasisBuilder(worn)({
    id: "push",
    name: "push",
    basis: basis.id,
    shape: {},
    pose: [{ bone: "spine", flexion: 170, abduction: null, twist: null }],
  });
  TestValidator.equals(
    "the builder poses the corrected state without a crossing",
    readBodyContacts(createHumanBodySegmenter(basis)(rebuilt)).length,
    0,
  );

  // 2. nothing left to part
  const again = pushBodyContacts(world, basis, built, push.rest);
  TestValidator.equals("nothing left to part", again.log, []);
  TestValidator.equals(
    "and the same rows",
    [...again.rest.keys()].sort((a, b) => a - b),
    [...push.rest.keys()].sort((a, b) => a - b),
  );

  // 3. no crossing
  const clear = pushBodyContacts(world, basis, at(30), null);
  TestValidator.equals("a clear pose has no row", clear.rest.size, 0);
  TestValidator.equals("and no line", clear.log, []);

  // 4. a bone through the skin
  const long = bodyCorrectiveBoxFixture();
  const longWorld = createBodyCorrectiveWorld(long);
  const longBuilt = createHumanBodyBasisBuilder(long)({
    id: "push",
    name: "push",
    basis: long.id,
    shape: {},
    pose: [{ bone: "spine", flexion: 170, abduction: null, twist: null }],
  });
  const through = pushBodyContacts(longWorld, long, longBuilt, null);
  TestValidator.predicate(
    "a later sweep finds the bone through the skin and leaves the pair",
    through.log.some((line) => line === "hipsxspine:bone through skin"),
  );
};
