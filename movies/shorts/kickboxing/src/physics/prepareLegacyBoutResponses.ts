import type { BoutFormulaResponse } from "../motion/reactions/BoutFormulaResponse";
import type { FilmRuntime } from "../runtime/FilmRuntime";
import { collectBoutFormulaResponses } from "./collectBoutFormulaResponses";

/** Keep the staged authored Viewer causal while it still uses its original motion adapter. Queries read the same final root/clinical poses that its actors draw. */
export async function prepareLegacyBoutResponses(
  runtime: Pick<FilmRuntime, "rigs" | "solve">,
  adopt: (contacts: readonly BoutFormulaResponse.IContact[]) => void,
  progress?: (action: string, completed: number, total: number) => void,
): Promise<void> {
  await collectBoutFormulaResponses({
    profiles: {
      a: runtime.rigs.a.profile,
      b: runtime.rigs.b.profile,
      referee: runtime.rigs.referee.profile,
    },
    start: 0,
    end: 180,
    adopt,
    progress,
    at: (seconds: number): collectBoutFormulaResponses.IFrames => {
      const solved: ReturnType<FilmRuntime["solve"]> = runtime.solve(seconds);
      return {
        a: runtime.rigs.a.trunk(solved.a.pose, solved.a.root).segments,
        b: runtime.rigs.b.trunk(solved.b.pose, solved.b.root).segments,
        referee: runtime.rigs.referee.trunk(
          solved.referee.pose,
          solved.referee.root,
        ).segments,
      };
    },
  });
}
