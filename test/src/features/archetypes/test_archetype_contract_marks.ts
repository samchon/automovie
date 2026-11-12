import {
  ArchetypeFrame,
  ArchetypeMarks,
  createDoor,
  createSeat,
  createStorage,
} from "@automovie/archetypes";
import { type IAutoMovieMark, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/predicates";

/** The places a mark draws, as points: an arrow's origin and tip, or an outline's points in order. */
function places(mark: IAutoMovieMark): IAutoMovieVector3[] {
  const shape: IAutoMovieMark["shape"] = mark.shape;
  let flat: number[] = [];
  if (shape.type === "arrows") {
    const vectors: number[] = shape.vectors;
    flat = [
      ...shape.origins,
      ...shape.origins.map(
        (value: number, k: number): number => value + vectors[k]!,
      ),
    ];
  } else if (shape.type === "segments" || shape.type === "polyline")
    flat = shape.points;
  const points: IAutoMovieVector3[] = [];
  for (let k: number = 0; k + 2 < flat.length; k += 3)
    points.push({ x: flat[k]!, y: flat[k + 1]!, z: flat[k + 2]! });
  return points;
}

/** Whether two lists of points agree to a nanometre, in order. */
function same(
  a: readonly IAutoMovieVector3[],
  b: readonly IAutoMovieVector3[],
): boolean {
  return (
    a.length === b.length &&
    a.every((p: IAutoMovieVector3, k: number): boolean =>
      vclose(p, b[k]!, 1e-9),
    )
  );
}

/**
 * An archetype's affordances are drawn as inspection marks: an arrow out of each contact and the outline of its extent, named and grouped so a request selects them.
 *
 * Scenarios:
 * 1. A handle with a length (a chair back's grip) gives two marks: an arrow from the frame's origin along its `+Y`, as long as asked, and a segment between the grip's two end sites.
 * 2. A seat (the chair's) gives an arrow and a closed outline through its four corner sites: front left, front right, back right, back left.
 * 3. A slider with travel (a chest's drawer) gives an arrow and a segment from its frame to where that frame stands when the drawer is drawn out by its whole travel.
 * 4. A point contact (a door's hinge) gives the arrow alone, of the default length when none is asked.
 * 5. Every mark of an affordance is named `<path>/affordance/<id>` and grouped as `affordance/<kind>`, and the marks of a list come in the list's order.
 * 6. Under a placement every drawn place is the placement applied to the unplaced one.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Asks for the marks of produced archetypes' affordances and reads their shapes, paths and kinds; a missing or extra outline, an arrow along the wrong axis or of the wrong length, an outline that is not the extent a site reads, a wrong name or group, or a placement applied to the arrow but not the outline is caught.
 * @evidence contracts/development/testing.md#independent-expectations The outlines are held against the archetype's own sites and articulation, which `ArchetypeSite` and `ArchetypeArticulation` own and their tests pin, never against the marks' arithmetic: a grip's ends, a seat's corners, a drawer's frame at full travel. The arrow is the frame convention's `+Y` out of the contact; the naming is the inspection path grammar `ArchetypeMarks` states; a placed point is a rotation and a shift worked here.
 * @evidence contracts/development/testing.md#distinguishing-cases One affordance of each outline shape the task of drawing distinguishes: a line, a rectangle, a run, none; an asked against the default arrow length; placed against unplaced. A rim's circle and a crank's spoke follow the same sites and are left to `test_archetype_contract_site`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host and draws nothing.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_archetype_contract_marks(): void {
  const findings: string[] = [];
  const chair: ReturnType<typeof createSeat> = createSeat(
    { kind: "dining" },
    4,
  );
  const chest: ReturnType<typeof createStorage> = createStorage(
    { kind: "chest" },
    4,
  );
  const door: ReturnType<typeof createDoor> = createDoor({}, 4);
  const drawer: IAutoMovieAffordance = chest.affordance("drawer2");

  // What each affordance must draw after its arrow: the outline's shape and its points, from the archetype's sites and articulation.
  const cases: readonly (readonly [
    string,
    IAutoMovieAffordance,
    string | null,
    IAutoMovieVector3[],
  ])[] = [
    [
      "a grip",
      chair.affordance("grip"),
      "segments",
      [chair.site("grip", 0).translation, chair.site("grip", 1).translation],
    ],
    [
      "a seat",
      chair.affordance("seat"),
      "polyline",
      [
        chair.site("seat", 0, 0).translation,
        chair.site("seat", 1, 0).translation,
        chair.site("seat", 1, 1).translation,
        chair.site("seat", 0, 1).translation,
      ],
    ],
    [
      "a drawer",
      drawer,
      "segments",
      [
        drawer.frame.translation,
        chest.articulate({ drawer2: drawer.travel! }).affordance("drawer2")
          .frame.translation,
      ],
    ],
    ["a hinge", door.affordance("hinge"), null, []],
  ];
  const placement: IAutoMovieTransform = {
    translation: { x: 3, y: 0.5, z: -2 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
    scale: { x: 1, y: 1, z: 1 },
  };
  const placed = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.add(
      placement.translation,
      Quaternion.rotateVector(placement.rotation, p),
    );
  for (const [name, affordance, outline, points] of cases) {
    const marks: IAutoMovieMark[] = ArchetypeMarks.of(
      "thing",
      [affordance],
      undefined,
      0.05,
    );
    const origin: IAutoMovieVector3 = affordance.frame.translation;
    if (
      marks.length !== (outline === null ? 1 : 2) ||
      marks[0]!.shape.type !== "arrows" ||
      !same(places(marks[0]!), [
        origin,
        Vector3.add(
          origin,
          Vector3.scale(ArchetypeFrame.axis(affordance.frame, "y"), 0.05),
        ),
      ])
    )
      findings.push(`${name}: ${marks.length} marks, or an arrow off its +Y`);
    const second: IAutoMovieMark | undefined = marks[1];
    if (
      outline !== null &&
      (second === undefined ||
        second.shape.type !== outline ||
        !same(places(second), points) ||
        (second.shape.type === "polyline" && !second.shape.closed))
    )
      findings.push(
        `${name}: outline ${second?.shape.type} through ${JSON.stringify(second === undefined ? [] : places(second))}, not ${outline} through ${JSON.stringify(points)}`,
      );
    if (
      marks.some(
        (mark: IAutoMovieMark): boolean =>
          mark.path !== `thing/affordance/${affordance.id}` ||
          mark.kind !== `affordance/${affordance.kind}`,
      )
    )
      findings.push(`${name}: a mark is misnamed or in the wrong group`);

    // 6. The same marks under a placement.
    const moved: IAutoMovieMark[] = ArchetypeMarks.of(
      "thing",
      [affordance],
      placement,
      0.05,
    );
    if (
      moved.length !== marks.length ||
      moved.some(
        (mark: IAutoMovieMark, k: number): boolean =>
          !same(places(mark), places(marks[k]!).map(placed)),
      )
    )
      findings.push(`${name}: a placement does not carry its marks`);
  }

  // 4. The default arrow length.
  const plain: IAutoMovieVector3[] = places(
    ArchetypeMarks.of("thing", [door.affordance("hinge")])[0]!,
  );
  if (
    Math.abs(
      Vector3.length(Vector3.subtract(plain[1]!, plain[0]!)) -
        ArchetypeMarks.ARROW,
    ) > 1e-9 ||
    !(ArchetypeMarks.ARROW > 0)
  )
    findings.push("the default arrow is not the stated length");

  // 5. A list's marks come in its order, each under its own name.
  TestValidator.equals(
    "a chair's marks in order",
    ArchetypeMarks.of("set/chair", [
      chair.affordance("seat"),
      chair.affordance("grip"),
    ]).map(
      (mark: IAutoMovieMark): string =>
        `${mark.path} ${mark.kind} ${mark.shape.type}`,
    ),
    [
      "set/chair/affordance/seat affordance/seat arrows",
      "set/chair/affordance/seat affordance/seat polyline",
      "set/chair/affordance/grip affordance/handle arrows",
      "set/chair/affordance/grip affordance/handle segments",
    ],
  );
  TestValidator.equals("marks draw their affordances", findings, []);
}
