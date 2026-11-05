import type { IAutoMovieHumanParameters } from "@automovie/human";
import { humanParameters } from "./humanParameters";

/** A coarse supporting identity, independent of the two lead portraits. */
interface Design {
  body: "standard" | "tall" | "compact" | "broad" | "stocky";
  hairColour: number;
  hairTied: boolean;
  parameters: IAutoMovieHumanParameters;
}

/**
 * Resolve every supporting role's actual source-owned recognition facts.
 * Source: settings/players#population and east-keeper#identity. Numerical tapes
 * below are delegated coarse realization choices, not measured biographies or
 * age inference. Identical body families have identical public Human inputs.
 *
 * @evidence contracts/common.md#implementation-and-ownership Maps all twelve stable IDs explicitly, separating colour/style and tall/compact/broad/stocky silhouettes. Uses public Human stature and anatomical breadth/girth controls; the scene prepares each distinct family once without scaling or cloning another person's rig.
 * @evidence contracts/common.md#authoring-interface Requires a listed G/R supporting role ID and refuses unknown people. Returns owned Human parameters in millimetres plus a project hair colour and tie flag. Callers cache evaluators only by the equivalent body-family inputs; lead designs remain independent.
 */
export function supportingPlayerDesign(id: string): Design {
  const dark: number = 0x17191b; const pale: number = 0xdcc995; const brown: number = 0x614333;
  const roles: Record<string, [Design["body"], number, boolean]> = {
    "G-C1": ["tall", dark, false], "G-C2": ["compact", pale, false], "G-C3": ["broad", dark, true],
    "R-C1": ["tall", brown, false], "R-C2": ["compact", dark, true], "R-C3": ["broad", pale, false],
    "G-B1": ["standard", dark, false], "G-B2": ["standard", pale, false],
    "R-B1": ["standard", brown, true], "R-B2": ["standard", dark, false],
    "G-K": ["stocky", brown, false], "R-K": ["standard", dark, false],
  };
  const row: [Design["body"], number, boolean] | undefined = Object.hasOwn(roles, id) ? roles[id] : undefined;
  if (!row) throw new Error(`Unlisted supporting player: ${id}`);
  const stature: number = row[0] === "tall" ? 1.86 : row[0] === "compact" ? 1.64 : row[0] === "stocky" ? 1.70 : 1.78;
  const parameters: IAutoMovieHumanParameters = humanParameters(stature, false);
  if (row[0] === "tall") Object.assign(parameters.body.anatomy, { chestBreadth: 280, chestCircumference: 900, waistCircumference: 730, biacromialBreadth: 380 });
  if (row[0] === "broad") Object.assign(parameters.body.anatomy, { chestBreadth: 360, chestCircumference: 1080, waistCircumference: 880, biacromialBreadth: 440 });
  if (row[0] === "stocky") Object.assign(parameters.body.anatomy, { chestBreadth: 380, chestCircumference: 1120, waistCircumference: 950, biacromialBreadth: 440 });
  return { body: row[0], hairColour: row[1], hairTied: row[2], parameters };
}
