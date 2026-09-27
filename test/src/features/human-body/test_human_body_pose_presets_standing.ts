import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";
import { renderBodyPosePresets } from "@automovie/playground/src/human/bodyPosePresets";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

const row = (bone: string, flexion: number): IAutoMovieJointPose => ({
  bone: bone as IAutoMovieJointPose["bone"],
  flexion,
  abduction: null,
  twist: null,
});

/**
 * Pose presets keep the standing joints' rows, the trunk the age posture
 * bends, unless they name them.
 *
 * Scenarios:
 * 1. A typed preset replaces every other row and keeps the standing ones.
 * 2. A typed preset that names a standing joint replaces its row.
 * 3. The solved preset is asked with the standing rows kept and every other
 *    joint at rest, and applies its answer over them.
 */
export const test_human_body_pose_presets_standing =
  async (): Promise<void> => {
    const dom = new JSDOM("<!doctype html><div id='p'></div>").window.document;
    const document: IAutoMovieHumanBodyBasisDocument = {
      id: "b",
      name: "B",
      basis: "basis",
      shape: {},
      pose: [row("chest", 6), row("neck", -12), row("leftLowerArm", 40)],
      shoulders: [],
    };
    const applied: IAutoMovieHumanBodyBasisDocument[] = [];
    const asked: IAutoMovieHumanBodyBasisDocument[] = [];
    let ticket = 0;
    const container = dom.createElement("div");
    renderBodyPosePresets({
      dom,
      container,
      presets: [
        { name: "A-pose", pose: [] },
        { name: "Nod", pose: [row("neck", 10)] },
        { name: "Arms down", solve: "armsDown" },
      ],
      current: () => document,
      standing: ["chest", "upperChest", "neck"],
      armsDown: async (asking) => {
        asked.push(asking);
        return { pose: [row("leftLowerArm", 5)], shoulders: [] };
      },
      reserve: () => ++ticket,
      isCurrent: (one) => one === ticket,
      apply: (next) => applied.push(next),
      refuse: () => undefined,
      busy: () => undefined,
    });
    const click = async (at: number): Promise<void> => {
      container.querySelectorAll("button")[at].click();
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    };
    await click(0);
    TestValidator.equals("a preset keeps the standing rows", applied[0]!.pose, [
      row("chest", 6),
      row("neck", -12),
    ]);
    await click(1);
    TestValidator.equals(
      "a preset naming a standing joint replaces its row",
      applied[1]!.pose,
      [row("chest", 6), row("neck", 10)],
    );
    await click(2);
    TestValidator.equals(
      "the solve stands on the standing rows and applies over them",
      [asked[0]!.pose, applied[2]!.pose],
      [
        [row("chest", 6), row("neck", -12)],
        [row("chest", 6), row("neck", -12), row("leftLowerArm", 5)],
      ],
    );
  };
