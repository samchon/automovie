import type { IAutoMovieMark } from "@automovie/engine";
import { AutoMovieHumanF1 } from "@automovie/human";
import {
  HUMAN_CAPTURE_PEOPLE,
  buildHumanCaptureFigure,
  listHumanCaptureSubjects,
  resolveHumanCaptureSubject,
} from "@automovie/human/capture";
import {
  type IAutoMovieInspectionHandle,
  type IAutoMovieInspectionPath,
  applyAutoMovieInspection,
  listAutoMovieInspectionPaths,
  parseAutoMovieInspectionRequest,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * The Human figure is a capture subject like any other: the package offers every person it defines by name, names the figure's pieces as the generator emits them, and hands its construction curves to the inspection as marks named by its families.
 *
 * Scenarios:
 *
 * 1. The subjects offered are every person the package defines, `f1`, in its canonical pose, and `f1` resolves to the person and its reference pose.
 * 2. The f1 figure's identity paths are `f1/body` for the sewn skin, plus `f1/<family>` and `f1/<family>.mirror` for each loose family and its twin, each path once; no sewn family is a piece of its own.
 * 3. Applied with `marks=curve/*`, the figure's marks are section, guide and axis curves anchored to `f1`, each beneath `f1/<family>` or `f1/<family>.mirror` for the authored family it constructs, such as `f1/arm/section/0` and `f1/arm.mirror/guide/0`, and the inspection selects them.
 * 4. An unknown person is refused listing `f1`, and an unknown pose is refused listing `reference`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Lists the offered subjects, builds the f1 figure, applies the public inspection to it and reads the scene's identity paths, the marks' kinds, paths and anchors, the inspection's selection and the refusals.
 * @evidence contracts/development/testing.md#independent-expectations Expected pieces are derived from the generator's declared loose family table `AutoMovieHumanF1.LOOSE` and the sewn body's name, and expected curve owners from the authored family table `AutoMovieHumanF1.FAMILIES`, its names and mirroring, not from the scene the test reads.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts the sewn skin against loose pieces, sewn families against curve owners, mirrored against single families, and offered against unknown people and poses. The curves' geometry belongs to the engine's construction tests.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds the figure in memory and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The subjects offered are every person the package defines, f1, in its canonical pose).
 */
export function test_human_capture_subjects(): void {
  // 1. The list.
  TestValidator.equals(
    "every person is offered",
    listHumanCaptureSubjects(),
    Object.keys(HUMAN_CAPTURE_PEOPLE),
  );
  TestValidator.equals("f1 is offered", listHumanCaptureSubjects(), ["f1"]);
  TestValidator.equals(
    "f1 is its reference pose",
    resolveHumanCaptureSubject("f1"),
    { person: "f1", pose: "reference" },
  );

  // 2. Identity paths: the sewn skin and each loose family.
  const figure: ReturnType<typeof buildHumanCaptureFigure> =
    buildHumanCaptureFigure("f1");
  const scene: THREE.Scene = new THREE.Scene();
  scene.add(figure.object);
  const named = (members: readonly AutoMovieHumanF1.IMember[]): string[] =>
    members.flatMap((member: AutoMovieHumanF1.IMember): string[] =>
      member.mirrored
        ? [`f1/${member.family.name}`, `f1/${member.family.name}.mirror`]
        : [`f1/${member.family.name}`],
    );
  const pieces: string[] = ["f1/body", ...named(AutoMovieHumanF1.LOOSE)];
  const paths: string[] = listAutoMovieInspectionPaths(scene).map(
    (entry: IAutoMovieInspectionPath): string => entry.path,
  );
  const sort = (values: string[]): string[] =>
    [...values].sort((a: string, b: string): number => a.localeCompare(b));
  TestValidator.equals(
    "the sewn skin and each loose piece",
    sort(paths),
    sort(pieces),
  );
  TestValidator.equals("each path once", new Set(paths).size, paths.length);

  // 3. Curves as marks, named by the family they construct.
  const owners: string[] = named(AutoMovieHumanF1.FAMILIES);
  const kinds: Set<string> = new Set(
    figure.marks.map((mark: IAutoMovieMark): string => mark.kind),
  );
  TestValidator.equals("the curve kinds", sort([...kinds]), [
    "curve/axis",
    "curve/guide",
    "curve/section",
  ]);
  TestValidator.predicate(
    "every curve lies beneath the family it constructs and follows the figure",
    figure.marks.every(
      (mark: IAutoMovieMark): boolean =>
        mark.anchor === "f1" &&
        owners.some((owner: string): boolean =>
          mark.path.startsWith(`${owner}/`),
        ),
    ),
  );
  const marked: string[] = figure.marks.map(
    (mark: IAutoMovieMark): string => mark.path,
  );
  TestValidator.predicate(
    "an arm's section and its twin's guide are named by the family",
    marked.includes("f1/arm/section/0") &&
      marked.includes("f1/arm.mirror/guide/0"),
  );
  const handle: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene,
    request: parseAutoMovieInspectionRequest((key: string): string | null =>
      key === "marks" ? "curve/*" : null,
    ),
    marks: figure.marks,
  });
  TestValidator.predicate(
    "marks=curve/* selects the curves",
    handle.selected.includes("f1/arm/section/0") &&
      handle.legend.some((entry: { label: string }): boolean =>
        entry.label.startsWith("section curve"),
      ),
  );
  handle.restore();
  figure.dispose();

  // 4. Unknown person or pose.
  for (const [name, listed] of [
    ["m9", "f1"],
    ["f1@crouch", "reference"],
  ] as const)
    try {
      resolveHumanCaptureSubject(name);
      TestValidator.predicate(`${name} is refused`, false);
    } catch (error) {
      TestValidator.predicate(
        `${name} is refused listing ${listed}`,
        error instanceof Error && error.message.includes(listed),
      );
    }
}
