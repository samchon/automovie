import type { NodeCaptureSources } from "./NodeCaptureSources";
import { NodeLegF1Trace } from "./NodeLegF1Trace";

/**
 * The native-world F1 capture entry for both legs, feet and toes.
 *
 * @evidence contracts/development/design.md#minimal-and-owned-surface Routes the capture names to the archive-based region owner.
 */
export namespace NodeLegCaptureSource {
  /**
   * The leg entries include the sewn forefoot and digits. Standalone foot and
   * toe entries are inspection views. The body reads the native forefoot
   * receipt before omitting its separate toe entries.
   */
  export const PROVIDER: NodeCaptureSources.IProvider = {
    names: ["left", "right"].flatMap((side): string[] => [
      `leg.${side}`,
      `foot.${side}`,
      ...[1, 2, 3, 4, 5].map((digit): string => `toe.${side}.${digit}`),
    ]),
    files: [
      "packages/human/src/executable/NodeLegCaptureSource.ts",
      "packages/human/src/executable/NodeLegF1Archive.ts",
      "packages/human/src/executable/NodeLegF1Foot.ts",
      "packages/human/src/executable/NodeLegF1Hip.ts",
      "packages/human/src/executable/NodeLegF1Loft.ts",
      "packages/human/src/executable/NodeLegF1Rings.ts",
      "packages/human/src/executable/NodeLegF1Trace.ts",
      "packages/human/src/executable/NodeTrunkCaptureSource.ts",
      "packages/human/src/executable/NodeTrunkReference.ts",
      "packages/human/src/generation/AutoMovieHumanF1Trace.ts",
      "packages/human/src/generation/trunk/AutoMovieHumanF1Fork.ts",
      "packages/human/src/inspection/CaptureSpecs.ts",
      "packages/engine/src/geometry/construction/",
      "packages/engine/src/geometry/extract/",
    ],
    prepare(name, context) {
      const [, side] = name.split(".");
      if ((side !== "left" && side !== "right") || !PROVIDER.names.includes(name))
        throw new Error(`The leg provider draws leg.*, foot.* and toe.*, not ${name}`);
      return NodeLegF1Trace.prepare(name, side, context);
    },
  };
}
