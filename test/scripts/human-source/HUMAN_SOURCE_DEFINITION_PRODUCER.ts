import type { IHumanSourceDefinitionProducer } from "./structures/IHumanSourceDefinitionProducer.ts";

/**
 * The musculature definition producer, revision "definition-g1". Kept from the
 * published r6 receipt (definition-receipt.json), whose arithmetic these parts
 * were checked against on the r5 surface: the input difference, the sweep
 * smoother and its counts, the gain, the smoothstep fade length and the
 * symmetry. Chosen anew because the receipt does not determine them: the
 * relief step-aside (zero on each named relief endpoint's support, the same
 * smoothstep fade outward from it, since that endpoint owns its muscle's
 * relief and one effect has one channel) and the breast split (the source
 * cupsize endpoint's normalized length smoothed by the high sweeps).
 */
export const HUMAN_SOURCE_DEFINITION_PRODUCER: IHumanSourceDefinitionProducer = {
  revision: "definition-g1",
  muscular: { macroMuscle: 1, macroWeight: -1 },
  lean: { macroWeight: -1 },
  highSweeps: 4,
  lowSweeps: 200,
  gain: 1,
  fadeMetres: 0.04,
  nipple: "nipple-left",
  crotch: [0, -0.742266297, 0.011295066],
  relief: ["stomach/abs-definition-incr", "arms/l-deltoid-definition-incr", "arms/r-deltoid-definition-incr", "torso/scapular-definition-incr"],
  breast: "macro/cupsize-max",
  musculature: "muscle/definition-incr",
  chest: "muscle/chest-definition-incr",
  storageMetres: 1e-5,
};
