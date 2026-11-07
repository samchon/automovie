import { Strike } from "../../src/motion/striking/Strike";
import { BoutScript } from "../../src/shots/kickboxing/ring-bout/BoutScript";

/** Cover preparation, chamber, contact, recoil and replant of every actual screenplay kick, including both actor headings and mirrored kicking sides. These are authored review samples, not claimed contact receipts. */
export function boutGuardInspectionTimes(): number[] {
  return BoutScript.actions
    .filter((action: BoutScript.Action): boolean =>
      action.technique.endsWith("kick"),
    )
    .flatMap((action: BoutScript.Action): number[] => {
      const [start, end]: readonly [number, number] = Strike.window(action);
      return [
        start + (action.at - start) / 4,
        action.at - (action.at - start) * 0.55,
        action.at,
        action.at + 0.12,
        end - 0.01,
      ];
    });
}
