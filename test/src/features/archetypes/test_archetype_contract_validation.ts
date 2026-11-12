import { ArchetypeArticulation, createDoor } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieConstraintViolation,
  IAutoMovieModel,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/** The paths of a model's violations, or an empty list when it is admitted. */
function faults(model: IAutoMovieModel): string[] {
  const validation: IAutoMovieValidation = validateModel({ model });
  return validation.success
    ? []
    : validation.violations.map(
        (v: IAutoMovieConstraintViolation): string => v.path,
      );
}

/**
 * The engine admits a model's articulation declarations and the dimensions of the new affordance kinds, and refuses each way they can be wrong.
 *
 * Scenarios:
 * 1. A model declaring each of the seven new kinds (`trigger`, `crank`, `wheel`, `pedal`, `stirrup`, `rein`, `aperture`) with its dimensions is admitted.
 * 2. A dimension that is zero, negative or not finite is refused at that field, for the new `width`, `height` and `radius` and for `travel`.
 * 3. `parts` naming a part the model lacks is refused at that entry; a part claimed by two articulations is refused at the second claim; `parts` on a kind that does not travel is refused.
 * 4. `rides` naming no affordance, naming itself, naming a fixed kind, or closing a cycle of two articulations is refused at the `rides` field.
 * 5. The produced door, whose handle rides a latch that rides the hinge, is admitted unchanged.
 * 6. A chain that runs into a cycle further up (`a` rides `b`, `b` rides `c`, `c` rides `b`) is reported at `a` as never ending, circling through the cycle, while `b` and `c`, which are on the cycle, are each reported as returning to itself.
 * 7. For every one of the nineteen affordance kinds, a single affordance of that kind binding one part is admitted when the kind's travel moves parts and refused at its `parts` otherwise, and the package's `ArchetypeArticulation.KINDS` holds exactly the admitted kinds.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the engine's model admission on a valid model and on copies each broken in one way, and reads the violation paths and, for the two kinds of endless chain, their messages; an admission that lets a dangling part, a cycle or a non-positive dimension through, or an engine and a package that disagree on which kinds travel, is caught.
 * @evidence contracts/development/testing.md#independent-expectations The rules are those `IAutoMovieAffordance` states for `parts`, `rides` and the optional dimensions; each broken copy is written by hand here. Which kinds travel is written here from `AutoMovieAffordanceKind`'s descriptions: the eight whose part turns, slides or is pressed.
 * @evidence contracts/development/testing.md#distinguishing-cases One valid model and one copy per rule, each differing from the valid one in a single field; a member of a cycle beside an affordance that only leads into it; every kind on both sides of the travelling set. The producers' own validity belongs to `test_archetype_contract_valid`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the seven scenarios and what each pins.
 */
export function test_archetype_contract_validation(): void {
  const door: ReturnType<typeof createDoor> = createDoor();
  const base: IAutoMovieModel = JSON.parse(
    JSON.stringify(door),
  ) as IAutoMovieModel;
  const frame: IAutoMovieAffordance["frame"] = base.affordances![0]!.frame;
  const point = (
    id: string,
    kind: IAutoMovieAffordance["kind"],
    extra: Partial<IAutoMovieAffordance> = {},
  ): IAutoMovieAffordance => ({ id, kind, frame, extent: null, ...extra });
  const withAffordances = (list: IAutoMovieAffordance[]): IAutoMovieModel => ({
    ...base,
    affordances: list,
  });

  TestValidator.equals(
    "the new kinds are admitted with their dimensions",
    faults(
      withAffordances([
        point("trigger", "trigger", { travel: 0.012 }),
        point("crank", "crank", { radius: 0.17, parts: ["leaf"] }),
        point("wheel", "wheel", { radius: 0.19, travel: 450 }),
        point("pedal", "pedal", { width: 0.09, depth: 0.08, rides: "crank" }),
        point("stirrup", "stirrup", { width: 0.12, length: 0.6 }),
        point("rein", "rein", { length: 0.2, aperture: 0.016 }),
        point("aperture", "aperture", { width: 0.8, height: 2 }),
      ]),
    ),
    [],
  );
  TestValidator.equals(
    "a non-positive dimension is refused at its field",
    faults(
      withAffordances([
        point("a", "aperture", { width: 0, height: -2 }),
        point("b", "wheel", { radius: Number.NaN, travel: 0 }),
      ]),
    ),
    [
      "$input.affordances[0].width",
      "$input.affordances[0].height",
      "$input.affordances[1].radius",
      "$input.affordances[1].travel",
    ],
  );
  TestValidator.equals(
    "parts must resolve, be claimed once and sit on a kind that travels",
    faults(
      withAffordances([
        point("a", "hinge", { parts: ["leaf", "ghost"] }),
        point("b", "slider", { parts: ["leaf"] }),
        point("c", "seat", { parts: ["head"] }),
      ]),
    ),
    [
      "$input.affordances[0].parts[1]",
      "$input.affordances[1].parts[0]",
      "$input.affordances[2].parts",
    ],
  );
  TestValidator.equals(
    "rides must name another articulation without a cycle",
    faults(
      withAffordances([
        point("a", "handle", { rides: "nobody" }),
        point("b", "hinge", { rides: "b" }),
        point("c", "handle", { rides: "seat" }),
        point("seat", "seat"),
        point("d", "hinge", { rides: "e" }),
        point("e", "knob", { rides: "d" }),
      ]),
    ),
    [
      "$input.affordances[0].rides",
      "$input.affordances[1].rides",
      "$input.affordances[2].rides",
      "$input.affordances[4].rides",
      "$input.affordances[5].rides",
    ],
  );
  TestValidator.equals("the produced door is admitted", faults(base), []);

  // 6. A chain that runs into a cycle further up is told apart from one that returns to its start.
  const circling: IAutoMovieValidation = validateModel({
    model: withAffordances([
      point("a", "handle", { rides: "b" }),
      point("b", "hinge", { rides: "c" }),
      point("c", "knob", { rides: "b" }),
    ]),
  });
  TestValidator.equals(
    "a chain into a cycle never ends, and the cycle's own members return to themselves",
    circling.success
      ? []
      : circling.violations.map(
          (v: IAutoMovieConstraintViolation): string =>
            `${v.path} ${
              v.expected.includes("never ends: it circles through")
                ? "circles"
                : v.expected.includes("returns to itself")
                  ? "returns"
                  : v.expected
            }`,
        ),
    [
      "$input.affordances[0].rides circles",
      "$input.affordances[1].rides returns",
      "$input.affordances[2].rides returns",
    ],
  );

  // 7. The kinds that may bind parts are the same for the engine's admission and for the package's articulation.
  const bound: string[] = [];
  for (const kind of Object.keys(KINDS) as IAutoMovieAffordance["kind"][]) {
    const paths: string = faults(
      withAffordances([
        point("only", kind, {
          parts: ["leaf"],
          ...(kind === "stack-top" ? { extent: SQUARE } : {}),
        }),
      ]),
    ).join(",");
    const expected: string = KINDS[kind] ? "" : "$input.affordances[0].parts";
    if (paths !== expected)
      bound.push(`${kind}: the engine reports [${paths}], not [${expected}]`);
    if (ArchetypeArticulation.KINDS.has(kind) !== KINDS[kind])
      bound.push(`${kind}: the package's articulation kinds disagree`);
  }
  TestValidator.equals(
    "the engine and the package agree on which kinds travel",
    bound,
    [],
  );
}

/** A unit square on the floor, the supporting face a `stack-top` must carry. */
const SQUARE: IAutoMovieVector3[] = [
  { x: -0.5, y: 0, z: -0.5 },
  { x: 0.5, y: 0, z: -0.5 },
  { x: 0.5, y: 0, z: 0.5 },
  { x: -0.5, y: 0, z: 0.5 },
];

/** Every affordance kind, each with whether its travel moves parts as `AutoMovieAffordanceKind` states; the record's type makes a kind added to the interface a compile error here. */
const KINDS: Readonly<Record<IAutoMovieAffordance["kind"], boolean>> = {
  "stack-top": false,
  handle: false,
  socket: false,
  hook: false,
  seat: false,
  surface: false,
  bar: false,
  ledge: false,
  hinge: true,
  slider: true,
  knob: true,
  button: true,
  trigger: true,
  crank: true,
  wheel: true,
  pedal: true,
  stirrup: false,
  rein: false,
  aperture: false,
};
