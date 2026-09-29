import { createHumanFaceBasisPoseCache } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * One shaped and performed foundation is reused across appearance edits;
 * changing either channel invalidates it. The selected builder's full model
 * equivalence is checked separately against its prior implementation.
 */
export const test_subject_human_face_pose_cache = (): void => {
  const channels = [{ id: "width" }, { id: "lift" }];
  const readings = channels.map((channel) => channel.id);
  let evaluated = 0;
  const cached = createHumanFaceBasisPoseCache(channels, (state) => ({
    revision: ++evaluated,
    values: readings.map((id) => state.weights.get(id) ?? 0),
  }));
  const state = (weights: readonly (readonly [string, number])[]) => ({
    weights: new Map(weights),
    activations: [],
  });
  const neutral = cached(state([]), {});
  TestValidator.equals("neutral evaluates once", neutral.revision, 1);
  channels.push({ id: "caller-added" });
  TestValidator.predicate(
    "appearance edit reuses the owned channel selection and pose",
    cached(state([]), {}) === neutral,
  );
  TestValidator.predicate(
    "explicit zeros are the same pose as omission",
    cached(
      state([
        ["width", 0],
        ["lift", 0],
      ]),
      { width: 0 },
    ) === neutral,
  );
  const shaped = cached(state([["width", 0.5]]), { width: 0.5 });
  TestValidator.equals("shape change reevaluates", shaped, {
    revision: 2,
    values: [0.5, 0],
  });
  const performed = cached(
    state([
      ["width", 0.5],
      ["lift", 0.25],
    ]),
    { width: 0.5 },
  );
  TestValidator.equals("expression change reevaluates", performed, {
    revision: 3,
    values: [0.5, 0.25],
  });
  TestValidator.equals(
    "returning to neutral reevaluates",
    cached(state([]), {}),
    {
      revision: 4,
      values: [0, 0],
    },
  );
};
