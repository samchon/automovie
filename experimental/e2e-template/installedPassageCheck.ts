import type { IAutoMovieProductionCheck } from "@automovie/interface";

import {
  measureInstalledPassage,
  measureInstalledWithdrawal,
} from "../composition/films/installedPassageFilm.ts";

const source: string = "src/composition/films/installedPassageFilm.ts";
const inputs: readonly string[] = [
  source,
  "src/composition/films/installedPassageBody.json",
];
const receipt: IAutoMovieProductionCheck.IMeasurement = {
  kind: "measure",
  id: "receiving-grip",
  title: "Check the mug's receiving grip",
  scope:
    "Giver before contact and receiver on both sides of the continued hold",
  source,
  inputs,
  unit: "m",
  // The wrist origin is behind the grasp point by part of one hand.
  maximum: 0.16,
  measure: (): number => measureInstalledPassage(),
};

/** Installed checks for the same ordinary passage and its controls. */
export const passageChecks: readonly IAutoMovieProductionCheck[] = [
  {
    id: "installed-passage",
    checks: [
      receipt,
      {
        ...receipt,
        id: "unloaded-source",
        source: "src/IFilmProduction.ts",
      },
      {
        ...receipt,
        id: "directory-input",
        inputs: ["src/composition/films"],
      },
      {
        kind: "delivery",
        id: "exact-cut",
        title: "Read the whole cut and its current identity",
        scope: "Packed-SDK film with the continued hold",
        subject: "installed-passage",
        report: ".cache/e2e-passage-cut/render-report.json",
      },
    ],
    required: { passage: ["receiving-grip"], handoff: ["exact-cut"] },
  },
  {
    id: "installed-passage-withdraw",
    checks: [
      {
        ...receipt,
        measure: (): number => measureInstalledPassage("withdraw"),
      },
      {
        ...receipt,
        id: "retained-grip",
        scope: "Giver right wrist to the mug body at the end of the offer",
        measure: measureInstalledWithdrawal,
      },
    ],
  },
  {
    id: "installed-passage-missing",
    checks: [
      {
        ...receipt,
        measure: (): number => measureInstalledPassage("missing-receiver"),
      },
    ],
    required: { passage: ["receiving-grip"] },
  },
  {
    id: "installed-passage-layout",
    checks: [
      {
        ...receipt,
        id: "layout-ready",
        title: "Admit the independent layout setup",
        scope: "An added layout actor beyond the mug exchange",
        measure: (): number => measureInstalledPassage("unready-layout"),
      },
    ],
  },
];
