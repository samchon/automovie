import type { IHousePart } from "../../types/IHousePart";
import { MAIN_OUTLINE } from "../MAIN_OUTLINE";
import { PALETTE } from "../PALETTE";
import { part } from "../part";
import { rect } from "../rect";
import { block } from "../block";
import { LOWER_LANDING } from "./LOWER_LANDING";
import { TERRACE_EDGE_Z } from "./TERRACE_EDGE_Z";
import { TERRACE_STEP_X } from "./TERRACE_STEP_X";
import { TERRACE_STEP_CENTRE_X } from "./TERRACE_STEP_CENTRE_X";
import { TERRACE_LOW } from "./TERRACE_LOW";
import { TERRACE_TREAD } from "./TERRACE_TREAD";
import { TERRACE_RISE } from "./TERRACE_RISE";
import { TERRACE_RISERS } from "./TERRACE_RISERS";
import { TERRACE_TOP } from "./TERRACE_TOP";
import type { IExteriorZone } from "./IExteriorZone";
import type { ISiteBuild } from "./ISiteBuild";
import { TERRACE_BOTTOM } from "./TERRACE_BOTTOM";

const TERRACE_OWNER = "site/terrace.ts";
/** Emit the terrace, steps and lower landing. */

export const buildTerrace = (): ISiteBuild => {
  const parts: IHousePart[] = [
    part(
      "garden-terrace",
      TERRACE_OWNER,
      "paving",
      PALETTE.paving,
      block([-1.8, TERRACE_BOTTOM, TERRACE_EDGE_Z], [4.5, TERRACE_TOP, MAIN_OUTLINE.outer.z[0]])
    ),
  ];
  for (let k = 1; k < TERRACE_RISERS; ++k) {
    const edge = TERRACE_EDGE_Z - TERRACE_TREAD * (k - 1);
    parts.push(
      part(
        `garden-step-${k}`,
        TERRACE_OWNER,
        "paving",
        PALETTE.paving,
        block(
          [TERRACE_STEP_X[0], TERRACE_BOTTOM, edge - TERRACE_TREAD],
          [TERRACE_STEP_X[1], TERRACE_TOP - TERRACE_RISE * k, edge]
        )
      )
    );
  }
  parts.push(
    part(
      "garden-lower-landing",
      TERRACE_OWNER,
      "paving",
      PALETTE.paving,
      block(
        [LOWER_LANDING.x[0], TERRACE_BOTTOM, LOWER_LANDING.z[0]],
        [LOWER_LANDING.x[1], TERRACE_LOW, LOWER_LANDING.z[1]]
      )
    )
  );
  const zones: IExteriorZone[] = [
    {
      id: "garden-terrace",
      owner: TERRACE_OWNER,
      outline: rect([-1.8, 4.5], [TERRACE_EDGE_Z, MAIN_OUTLINE.outer.z[0]]),
      anchor: {
        x: TERRACE_STEP_CENTRE_X,
        y: TERRACE_TOP,
        z: (TERRACE_EDGE_Z + MAIN_OUTLINE.outer.z[0]) / 2,
      },
      rampTo: null,
    },
    {
      id: "garden-lower-landing",
      owner: TERRACE_OWNER,
      outline: rect(LOWER_LANDING.x, LOWER_LANDING.z),
      anchor: {
        x: TERRACE_STEP_CENTRE_X,
        y: TERRACE_LOW,
        z: (LOWER_LANDING.z[0] + LOWER_LANDING.z[1]) / 2,
      },
      rampTo: null,
    },
  ];
  return { zones, parts };
};
