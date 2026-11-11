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
 * The Human figure is a capture subject like any other: the package offers every person it defines by name, names the figure's pieces by its own families, and hands its construction curves to the inspection as marks under those names.
 *
 * Scenarios:
 *
 * 1. The subjects offered are every person the package defines, `f1`, in its canonical pose, and `f1` resolves to the person and its reference pose.
 * 2. The f1 figure's identity paths are `f1/<family>` for every authored family and `f1/<family>.mirror` for each mirrored one, each path once.
 * 3. Applied with `marks=curve/*`, the figure's marks are section, guide and axis curves anchored to `f1`, each at a path beneath the surface piece it constructs, such as `f1/arm/section/0` and `f1/arm.mirror/guide/0`, and the inspection selects them.
 * 4. An unknown person is refused listing `f1`, and an unknown pose is refused listing `reference`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Lists the offered subjects, builds the f1 figure, applies the public inspection to it and reads the scene's identity paths, the marks' kinds, paths and anchors, the inspection's selection and the refusals.
 * @evidence contracts/development/testing.md#independent-expectations Expected paths are derived from the authored family table `AutoMovieHumanF1.FAMILIES`, its names and mirroring, not from the scene the test reads.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts mirrored against single families, surface pieces against their curves, and offered against unknown people and poses. The curves' geometry belongs to the engine's construction tests.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds the figure in memory and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The subjects offered are every person the package defines, f1, in its canonical pose).
 */
export function test_human_capture_subjects(): void {
  // 1. The list.
  TestValidator.equals("every person is offered", listHumanCaptureSubjects(), Object.keys(HUMAN_CAPTURE_PEOPLE));
  TestValidator.equals("f1 is offered", listHumanCaptureSubjects(), ["f1"]);
  TestValidator.equals("f1 is its reference pose", resolveHumanCaptureSubject("f1"), { person: "f1", pose: "reference" });

  // 2. Identity paths.
  const figure: ReturnType<typeof buildHumanCaptureFigure> = buildHumanCaptureFigure("f1");
  const scene: THREE.Scene = new THREE.Scene();
  scene.add(figure.object);
  const expected: string[] = AutoMovieHumanF1.FAMILIES.flatMap((member: AutoMovieHumanF1.IMember): string[] =>
    member.mirrored ? [`f1/${member.family.name}`, `f1/${member.family.name}.mirror`] : [`f1/${member.family.name}`],
  );
  const paths: string[] = listAutoMovieInspectionPaths(scene).map((entry: IAutoMovieInspectionPath): string => entry.path);
  const sort = (values: string[]): string[] => [...values].sort((a: string, b: string): number => a.localeCompare(b));
  TestValidator.equals("one path per piece, named by its family", sort(paths), sort(expected));
  TestValidator.equals("each path once", new Set(paths).size, paths.length);

  // 3. Curves as marks.
  const kinds: Set<string> = new Set(figure.marks.map((mark: IAutoMovieMark): string => mark.kind));
  TestValidator.equals("the curve kinds", sort([...kinds]), ["curve/axis", "curve/guide", "curve/section"]);
  TestValidator.predicate(
    "every curve lies beneath the piece it constructs and follows the figure",
    figure.marks.every(
      (mark: IAutoMovieMark): boolean =>
        mark.anchor === "f1" && expected.some((piece: string): boolean => mark.path.startsWith(`${piece}/`)),
    ),
  );
  const marked: string[] = figure.marks.map((mark: IAutoMovieMark): string => mark.path);
  TestValidator.predicate(
    "an arm's section and its twin's guide are named by the family",
    marked.includes("f1/arm/section/0") && marked.includes("f1/arm.mirror/guide/0"),
  );
  const handle: IAutoMovieInspectionHandle = applyAutoMovieInspection({
    scene,
    request: parseAutoMovieInspectionRequest((key: string): string | null => (key === "marks" ? "curve/*" : null)),
    marks: figure.marks,
  });
  TestValidator.predicate(
    "marks=curve/* selects the curves",
    handle.selected.includes("f1/arm/section/0") && handle.legend.some((entry: { label: string }): boolean => entry.label.startsWith("section curve")),
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
      TestValidator.predicate(`${name} is refused listing ${listed}`, error instanceof Error && error.message.includes(listed));
    }
}
