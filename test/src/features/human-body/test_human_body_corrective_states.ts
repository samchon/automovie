import { TestValidator } from "@nestia/e2e";

import { bodyCorrectiveDocument } from "../../../scripts/body-basis/bodyCorrectiveDocument";
import {
  createBodyCorrectiveWorld,
  segmentBodyPositions,
} from "../../../scripts/body-basis/bodyCorrectiveWorld";
import {
  type BodyCensusSets,
  listCensusStates,
  listSingleAxisStates,
} from "../../../scripts/body-basis/listBodyCorrectiveStates";
import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The tables the corrective solver reads from a basis, the states it visits
 * and the document of a state at a fraction of its ramp.
 *
 * The basis is the analytic box (see `humanBodyBasisFixture`): a hips bone
 * from the origin to (0,1,0) and a spine bone from there to (0,2,0) whose
 * flexion ranges over -30 to 90, abduction and twist over -10 to 10, a
 * skin of eight vertices (the bottom four on the hips, the top four on the
 * spine) and twelve triangles. Every expectation is hand arithmetic on those
 * figures.
 *
 * Scenarios:
 * 1. The world names the dominant bone of each vertex, splits the twelve
 *    triangles into six of the hips and six of the spine by the majority
 *    rule (a triangle whose second and third corners agree against its first
 *    belongs to the agreeing bone), measures each bone one metre long and
 *    records the parents; a joint naming a landmark the basis lacks is
 *    refused.
 * 2. Segmenting bare positions gives one part per bone whose vertices are the
 *    bone's, with the corner counts of the partition.
 * 3. The single-axis states are the spine's samples only, since the hips carry
 *    no range: flexion at 45 and 90, and -15 and -30; abduction and twist at
 *    5 and 10 and at -5 and -10, one group per axis.
 * 4. Census findings become states with the group rules: a shape only is
 *    `rest`, a shape with a pose is grouped by its pose, a pose alone by its
 *    name before `@`; shape-only and shaped states come first, fewest
 *    channels then least weight first; a set the census lacks adds nothing.
 * 5. The document of a state at fraction 1 carries the state's own numbers; at
 *    a fraction it scales the shape by `u` and each angle from its rest by
 *    `t`, leaves an unposed axis null, and names the basis it is given.
 */
export const test_human_body_corrective_states = (): void => {
  const { basis } = humanBodyBasisFixture();

  // 1. world
  const world = createBodyCorrectiveWorld(basis);
  TestValidator.equals("vertices", world.vertices, 8);
  TestValidator.equals(
    "dominant bones",
    [0, 1, 2, 3, 4, 5, 6, 7].map((v) => world.dominant(v)),
    ["hips", "hips", "hips", "hips", "spine", "spine", "spine", "spine"],
  );
  TestValidator.equals(
    "the hips segment",
    world.segments.get("hips"),
    [0, 5, 1, 1, 6, 2, 2, 7, 3, 3, 4, 0, 0, 2, 3, 0, 1, 2],
  );
  TestValidator.equals(
    "the spine segment",
    world.segments.get("spine"),
    [0, 4, 5, 1, 5, 6, 2, 6, 7, 3, 7, 4, 4, 6, 5, 4, 7, 6],
  );
  TestValidator.predicate(
    "each bone is one metre long",
    nclose(world.lengths.get("hips")!, 1, 1e-12) &&
      nclose(world.lengths.get("spine")!, 1, 1e-12),
  );
  TestValidator.equals("the spine's parent", world.parents.get("spine"), "hips");
  TestValidator.equals("the root has none", world.parents.get("hips"), null);
  TestValidator.equals("neighbours of a corner", world.near[0].length, 5);
  TestValidator.predicate(
    "a missing landmark is refused",
    throwsError(
      () =>
        createBodyCorrectiveWorld({
          ...basis,
          joints: [{ ...basis.joints[0], head: "nowhere" }, basis.joints[1]],
        }),
      "no landmark nowhere",
    ),
  );

  // 2. segmenting positions
  const segmented = segmentBodyPositions(world, basis.surfaces[0].positions);
  TestValidator.equals(
    "one part per bone",
    segmented.model.parts.map((part) => part.id),
    ["hips", "spine"],
  );
  TestValidator.equals(
    "the hips read the bottom ring and the vertices the majority triangles reach",
    segmented.sources.get("hips")!.sort((a, b) => a - b),
    [0, 1, 2, 3, 4, 5, 6, 7],
  );
  const hipsPart = segmented.model.parts[0].geometry;
  TestValidator.equals(
    "the hips mesh keeps six triangles",
    hipsPart.type === "mesh" ? hipsPart.mesh.indices!.length / 3 : -1,
    6,
  );

  // 3. single-axis states
  const singles = listSingleAxisStates(basis);
  TestValidator.equals(
    "the spine's samples",
    singles.map((state) => state.name),
    [
      "spine.flexion@45",
      "spine.flexion@90",
      "spine.flexion@-15",
      "spine.flexion@-30",
      "spine.abduction@5",
      "spine.abduction@10",
      "spine.abduction@-5",
      "spine.abduction@-10",
      "spine.twist@5",
      "spine.twist@10",
      "spine.twist@-5",
      "spine.twist@-10",
    ],
  );
  TestValidator.equals(
    "one group per axis",
    [...new Set(singles.map((state) => state.group))],
    ["spine.flexion", "spine.abduction", "spine.twist"],
  );
  TestValidator.equals("a single state's set", singles[0].set, "single");
  TestValidator.equals("and its pose leaves other axes null", singles[1].pose, [
    { bone: "spine", flexion: 90, abduction: null, twist: null },
  ]);
  // a joint whose half and whole reach coincide has one sample
  const elbow = listSingleAxisStates({
    ...basis,
    joints: [
      basis.joints[0],
      {
        ...basis.joints[1],
        neutral: { flexion: 90, abduction: 0, twist: 0 },
        constraint: {
          flexion: { min: 0, max: 90 },
          abduction: null,
          twist: null,
        },
      },
    ],
  });
  TestValidator.equals(
    "an elbow resting bent has one extension sample",
    elbow.map((state) => state.name),
    ["spine.flexion@0"],
  );

  // 4. census states
  const posed = (bone: string, flexion: number) => ({
    bone: bone as "spine",
    flexion,
    abduction: null,
    twist: null,
  });
  const census: BodyCensusSets = {
    shapes: {
      findings: [
        { name: "heavy", document: { shape: { a: 1, b: 1 }, pose: [] } },
        { name: "male", document: { shape: { a: 1 }, pose: [] } },
        {
          name: "male:spine.flexion@90",
          document: { shape: { a: 1 }, pose: [posed("spine", 90)] },
        },
        { name: "light", document: { shape: { a: 0.5 } } },
      ],
    },
    joints: {
      findings: [
        {
          name: "spine.flexion@90",
          document: { pose: [posed("spine", 90)] },
        },
      ],
    },
  };
  const states = listCensusStates(census, ["joints", "shapes", "absent"]);
  TestValidator.equals(
    "shaped states first, fewest channels then least weight",
    states.map((state) => state.name),
    ["light", "male", "male:spine.flexion@90", "heavy", "spine.flexion@90"],
  );
  TestValidator.equals(
    "groups",
    states.map((state) => state.group),
    [
      "rest",
      "rest",
      'pose:[[{"bone":"spine","flexion":90,"abduction":null,"twist":null}],[]]',
      "rest",
      "spine.flexion",
    ],
  );
  TestValidator.equals("a state keeps its set", states[4].set, "joints");

  // 5. documents
  const state = { ...states[2], shape: { a: 1, b: -0.5 } };
  const whole = bodyCorrectiveDocument(world, state, 1, 1, "basis-x");
  TestValidator.equals("the whole state", whole, {
    id: "solve",
    name: "solve",
    basis: "basis-x",
    shape: { a: 1, b: -0.5 },
    pose: [{ bone: "spine", flexion: 90, abduction: null, twist: null }],
  });
  const half = bodyCorrectiveDocument(world, state, 0.5, 0.5, "basis-x");
  TestValidator.predicate(
    "a half state halves the angle and the weights",
    half.pose![0].flexion === 45 &&
      half.shape.a === 0.5 &&
      half.shape.b === -0.25,
  );
  const shifted = bodyCorrectiveDocument(
    {
      ...world,
      neutral: new Map([["spine", { flexion: 40, abduction: 0, twist: 0 }]]),
    },
    state,
    0.5,
    1,
    "basis-x",
  );
  TestValidator.equals(
    "the angle moves from the joint's own rest",
    shifted.pose![0].flexion,
    65,
  );
};
