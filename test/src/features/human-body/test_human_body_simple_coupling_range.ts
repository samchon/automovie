import { humanBodySimpleCouplingRange } from "@automovie/human/body/simple/humanBodySimpleCouplingRange";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * A solver offset is bounded from the current absolute channel weights.
 *
 * Scenarios:
 * 1. Weight +1 on [-1,1] admits offsets [-2,0], preserving the full inward
 *    reach; neutral omission admits [-1,1].
 * 2. Coefficient -2 at weight 0.5 reverses the endpoints to [-0.25,0.75];
 *    two components intersect their independent channel inequalities.
 * 3. Empty/zero directions and fixed channels admit no derivative. A missing
 *    channel refuses by name. Inputs stay unchanged.
 */
export const test_human_body_simple_coupling_range = (): void => {
  const channels = [{ id: "a", minimum: -1, maximum: 1 }, { id: "b", minimum: -1, maximum: 1 }];
  const direction = [{ channel: "a", coefficient: 1 }];
  const same = (value: [number, number] | null, expected: [number, number]): boolean =>
    value !== null && nclose(value[0], expected[0]) && nclose(value[1], expected[1]);
  TestValidator.predicate("inward reach from endpoint", same(humanBodySimpleCouplingRange(
    channels, { a: 1 }, direction,
  ), [-2, 0]));
  TestValidator.predicate("omission is neutral", same(humanBodySimpleCouplingRange(
    channels, {}, direction,
  ), [-1, 1]));
  TestValidator.predicate("negative coefficient", same(humanBodySimpleCouplingRange(
    channels, { a: 0.5 }, [{ channel: "a", coefficient: -2 }],
  ), [-0.25, 0.75]));
  TestValidator.predicate("component intersection", same(humanBodySimpleCouplingRange(
    channels, { a: 0.5, b: -0.5 }, [...direction, { channel: "b", coefficient: 2 }],
  ), [-0.25, 0.5]));
  TestValidator.equals("empty direction", humanBodySimpleCouplingRange(channels, {}, []), null);
  TestValidator.equals("zero direction", humanBodySimpleCouplingRange(channels, {},
    [{ channel: "a", coefficient: 0 }]), null);
  TestValidator.equals("fixed channel", humanBodySimpleCouplingRange(
    [{ id: "a", minimum: 0, maximum: 0 }], {}, direction,
  ), null);
  TestValidator.predicate("missing channel", throwsError(() => humanBodySimpleCouplingRange(
    channels, {}, [{ channel: "absent", coefficient: 1 }],
  ), "absent"));
  TestValidator.equals("channel envelopes unchanged", channels,
    [{ id: "a", minimum: -1, maximum: 1 }, { id: "b", minimum: -1, maximum: 1 }]);
  TestValidator.equals("direction unchanged", direction, [{ channel: "a", coefficient: 1 }]);
};
