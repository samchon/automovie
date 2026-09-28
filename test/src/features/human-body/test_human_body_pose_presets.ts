import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import { renderBodyPosePresets } from "@automovie/playground/src/human/bodyPosePresets";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

/**
 * Pose presets replace the whole joint list in one edit; a solved preset is
 * asked on the body at rest and applied only while it is the latest intent.
 *
 * Scenarios:
 * 1. A typed preset applies its joints and goals at once, replacing the
 *    document's pose and shoulders and keeping its shape.
 * 2. The solved preset asks the solver with every joint at rest, shows a
 *    busy line, and applies the solver's answer under its own ticket.
 * 3. A newer intent taken while the solve runs discards the answer.
 * 4. A solver failure refuses with its reason while current, and is silent
 *    once superseded.
 * 5. A viewport without a solver refuses the solved preset by name.
 */
export const test_human_body_pose_presets = async (): Promise<void> => {
  const dom = new JSDOM("<!doctype html><div id='p'></div>").window.document;
  const document: IAutoMovieHumanBodyBasisDocument = {
    id: "b",
    name: "B",
    basis: "basis",
    shape: { macroWeight: 1 },
    pose: [{ bone: "spine", flexion: 10, abduction: null, twist: null }],
    shoulders: [
      { bone: "leftUpperArm", plane: 90, elevation: 90, axialRotation: 0 },
    ],
  };
  let ticket = 0;
  let latest = 0;
  const applied: [IAutoMovieHumanBodyBasisDocument, number][] = [];
  const refused: string[] = [];
  const busy: string[] = [];
  const asked: IAutoMovieHumanBodyBasisDocument[] = [];
  let answer: () => Promise<
    Pick<IAutoMovieHumanBodyBasisDocument, "pose" | "shoulders">
  > = async () => ({
    pose: [{ bone: "leftLowerArm", flexion: 0, abduction: null, twist: null }],
    shoulders: [
      { bone: "leftUpperArm", plane: 0, elevation: 12, axialRotation: 0 },
    ],
  });
  const mount = (withSolver: boolean): HTMLElement => {
    const container = dom.createElement("div");
    renderBodyPosePresets({
      dom,
      container,
      presets: [
        {
          name: "T-pose",
          shoulders: [
            { bone: "leftUpperArm", plane: 0, elevation: 90, axialRotation: 0 },
          ],
        },
        { name: "Arms down", solve: "armsDown" },
      ],
      current: () => document,
      armsDown: withSolver
        ? (asking) => {
            asked.push(asking);
            return answer();
          }
        : undefined,
      reserve: () => (latest = ++ticket),
      isCurrent: (one) => one === latest,
      apply: (next, one) => applied.push([next, one]),
      refuse: (error) =>
        refused.push(error instanceof Error ? error.message : String(error)),
      busy: (text) => busy.push(text),
    });
    return container;
  };
  const tick = (): Promise<void> =>
    new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  const click = async (container: HTMLElement, at: number): Promise<void> => {
    container.querySelectorAll("button")[at].click();
    await tick();
  };
  const panel = mount(true);
  await click(panel, 0);
  TestValidator.equals("a typed preset replaces the joint list", applied[0], [
    {
      ...document,
      pose: [],
      shoulders: [
        { bone: "leftUpperArm", plane: 0, elevation: 90, axialRotation: 0 },
      ],
    },
    1,
  ]);
  await click(panel, 1);
  TestValidator.equals("the solver is asked on the body at rest", asked[0], {
    ...document,
    pose: [],
    shoulders: [],
  });
  TestValidator.equals("a busy line is shown", busy.length, 1);
  TestValidator.equals("the solved pose applies under its ticket", applied[1], [
    {
      ...document,
      pose: [
        { bone: "leftLowerArm", flexion: 0, abduction: null, twist: null },
      ],
      shoulders: [
        { bone: "leftUpperArm", plane: 0, elevation: 12, axialRotation: 0 },
      ],
    },
    2,
  ]);

  let release: () => void = () => undefined;
  answer = () =>
    new Promise((resolve) => {
      release = () => resolve({ pose: [], shoulders: [] });
    });
  panel.querySelectorAll("button")[1].click();
  latest = ++ticket;
  release();
  await tick();
  TestValidator.equals("a superseded solve applies nothing", applied.length, 2);

  answer = async () => {
    throw new Error("the elbow refuses");
  };
  await click(panel, 1);
  TestValidator.equals("a current failure refuses", refused, [
    "the elbow refuses",
  ]);
  answer = () =>
    new Promise((resolve, reject) => {
      release = () => reject(new Error("late"));
      void resolve;
    });
  panel.querySelectorAll("button")[1].click();
  latest = ++ticket;
  release();
  await tick();
  TestValidator.equals("a superseded failure is silent", refused.length, 1);

  await click(mount(false), 1);
  TestValidator.equals(
    "no solver refuses by name",
    refused[1],
    "This viewport cannot solve the Arms down preset.",
  );
};
