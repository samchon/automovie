import { TestValidator } from "@nestia/e2e";
import { bodyMeasuredGroups } from "@automovie/playground/src/human/body/bodyMeasuredGroups";

const rule = (
  neutral: number | null,
  positive: number | null,
  negative: number | null,
) => ({ measurement: { neutral, positive, negative } });

/**
 * The measured-group menu lists a group once, in basis order, for channels
 * whose rule evaluated.
 *
 * Scenarios:
 * 1. A nonnegative channel with neutral and positive readings offers its group
 *    (`waist`); a second channel of the same group does not repeat it.
 * 2. A channel with a negative endpoint needs the negative reading too: with
 *    it the group is offered (`hip`), without it (a null negative) the group is
 *    not (`arm`), the negative twin of the offered case.
 * 3. A channel with no rule (`measurement: null`), no scale record at all, a
 *    null neutral or a null positive is never offered (`neck`, `leg`, `foot`,
 *    `hand`), and the result keeps the basis order (`waist` before `hip`).
 * 4. No channels give no groups.
 */
export const test_human_body_measured_groups = (): void => {
  const scales = new Map<
    string,
    ReturnType<typeof rule> | { measurement: null }
  >([
    ["w1", rule(1, 2, null)],
    ["w2", rule(1, 2, null)],
    ["h1", rule(1, 2, 3)],
    ["a1", rule(1, 2, null)],
    ["n1", { measurement: null }],
    ["l1", rule(null, 2, null)],
    ["f1", rule(1, null, null)],
  ]);
  const channels = [
    { id: "w1", group: "waist", negative: null },
    { id: "w2", group: "waist", negative: null },
    { id: "h1", group: "hip", negative: {} },
    { id: "a1", group: "arm", negative: {} },
    { id: "n1", group: "neck", negative: null },
    { id: "l1", group: "leg", negative: null },
    { id: "f1", group: "foot", negative: null },
    { id: "hand1", group: "hand", negative: null },
  ];
  TestValidator.equals("groups", bodyMeasuredGroups(channels, scales), [
    "waist",
    "hip",
  ]);
  TestValidator.equals("empty", bodyMeasuredGroups([], scales), []);
};
