import { BoutFormulaResponse } from "../motion/reactions/BoutFormulaResponse";
import type { BoutTargetSource } from "./BoutTargetSource";
import { collectBoutFormulaResponses } from "./collectBoutFormulaResponses";

/** Prepare comparison response before the common target bake; native response authority never receives a formula body offset. */
export async function prepareBoutFormulaResponses(
  source: BoutTargetSource,
  mode: "simulated" | "kinematic",
  start: number,
  end: number,
): Promise<BoutFormulaResponse.IContact[]> {
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    end < start ||
    end > 180
  )
    throw new Error("Invalid comparison response interval");
  source.configureResponses(mode === "kinematic" ? "kinematic" : "native", []);
  if (mode === "simulated") return [];
  return collectBoutFormulaResponses({
    profiles: {
      a: source.rigs.a.profile,
      b: source.rigs.b.profile,
      referee: source.rigs.referee.profile,
    },
    // A bounded kinematic clip retains the authored response history that made
    // its initial pose. It is not a fresh performance beginning at the offset.
    start: 0,
    end,
    at: (seconds: number): collectBoutFormulaResponses.IFrames => {
      const sample: ReturnType<BoutTargetSource["sample"]> =
        source.sample(seconds);
      return {
        a: sample.a.segments,
        b: sample.b.segments,
        referee: sample.referee.segments,
      };
    },
    adopt: (contacts: readonly BoutFormulaResponse.IContact[]): void =>
      source.configureResponses("kinematic", contacts),
  });
}
