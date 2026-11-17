import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanBalance } from "../everyday/HumanBalance";
import { HumanArmSwing } from "../posture/HumanArmSwing";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The poses a stagger's plan reads at its samples, resolved on one assembly a
 * sample: the arms' carriage reads the sample's posture, and each balance
 * pass reads that posture again with the arms let out, or with the root
 * shifted. The carriage's posture is assembled and fitted once; a balance
 * pass's posture is derived from that assembly (`resolveHumanPosture.derive`)
 * and takes the carriage's leg fits where its legs read exactly what they
 * read there (`resolveHumanPosture.fit` with the completed fit).
 *
 * @param body The body.
 * @returns The sample readers: `carriage` first for a sample, then `centre` any number of times.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three readings of a sample, what is assembled once and what each later reading derives and takes.
 * @evidence contracts/development/implementation.md#principled-implementation Each reading is the cold resolve of its posture: `fit` of `assemble` is that resolve, `derive` gives the assembly `assemble` gives, and a completed fit is taken only where every leg's fit reads exactly the same records, root and goal, of which a limb fit is a function. The carriage is `HumanArmSwing.of` on that resolve and the centre `HumanBalance.centre` on it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One record a sample holding its assembly and fit; two readers over it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose or centre is kept for another posture: every reading resolves the posture it is given, and a posture whose legs read anything different is fitted in full.
 * @evidence contracts/development/implementation.md#efficient-algorithms A sample's three readings cost one assembly, two derivations of the changed records and two leg-fit pairs (the carriage's, shared by the first balance pass, and the shifted pass's), in place of three assemblies and three pairs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A sample's assembly and completed fit are shared by its later readings; equivalence is decided inside `derive` (exact angles, root and heading) and `fit` (exact goals, root and the very records each leg reads).
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one assembly and one seeded fit a sample until the plan's construction releases the reader.
 */
export function staggerResolved(body: IHumanBody): staggerResolved.IReader {
  const knots: (Parameters<typeof resolveHumanPosture.fit>[5])[] = [];
  return {
    carriage: (index: number, posture: IHumanPosture): Record<"left" | "right", number> => {
      const assembled: resolveHumanPosture.IAssembled = resolveHumanPosture.assemble(body, posture);
      const seeded: resolveHumanPosture.ISeeded = resolveHumanPosture.fit(body, assembled);
      knots[index] = { assembled, seeded };
      const cleared: IHumanPosture =
        HumanArmSwing.of(body, posture, ["left", "right"], undefined, undefined, seeded.pose);

      // The let-out the swing adds over what the posture writes
      // (`HumanArmSwing.carriage` for one instant).
      const added: (side: "left" | "right") => number = (side: "left" | "right"): number =>
        Math.max(0, (cleared.joints[`${side}UpperArm`]?.[1] ?? 0) - (posture.joints[`${side}UpperArm`]?.[1] ?? 0));
      return { left: added("left"), right: added("right") };
    },
    centre: (index: number, posture: IHumanPosture): IAutoMovieVector3 => {
      const knot: Parameters<typeof resolveHumanPosture.fit>[5] = knots[index];
      if (knot === undefined) return HumanBalance.centre(body, posture);
      const pose: resolveHumanPosture.ISeeded["pose"] = resolveHumanPosture.fit(
        body, resolveHumanPosture.derive(body, knot.assembled, posture), undefined, {}, undefined, knot,
      ).pose;
      return HumanBalance.centre(body, posture, undefined, undefined, pose);
    },
  };
}

/**
 * The reader's type.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its reading and its order.
 * @evidence contracts/development/design.md#principled-representation Two readings of a sample by its index: the arms' added abduction in degrees and the whole-body centre in world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two readings the stagger's plan takes at its samples.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The posture is always given; the index only names which sample's assembly a reading may derive from.
 */
export namespace staggerResolved {
  /** A stagger plan's sample readers. */
  export interface IReader {
    /** Each arm's added abduction that keeps it clear in the sample's posture, degrees (`HumanArmSwing.carriage` at one instant); resolves the posture and keeps its assembly and fit for the sample. */
    carriage(index: number, posture: IHumanPosture): Record<"left" | "right", number>;

    /** The whole-body centre of mass of a posture of the sample, world metres (`HumanBalance.centre`), resolved on the sample's kept assembly; resolved plainly when the sample has none. */
    centre(index: number, posture: IHumanPosture): IAutoMovieVector3;
  }
}
