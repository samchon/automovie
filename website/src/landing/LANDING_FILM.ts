import type { ILandingFilm } from "./ILandingFilm";

/**
 * The one scene the landing page follows from its brief to its frames. Its
 * motion is a scene record the build bakes, so the figures that play beside
 * the screenplay are that record's computed take; the brief, the screenplay
 * and the code are what a production would hold for it, written in the
 * scaffold's formats, and each beat names the actions of the take it
 * covers.
 */
export const LANDING_FILM: ILandingFilm = {
  scene: "kickboxing-round",
  view: "side",
  cast: { red: "Ren", blu: "Kai" },
  file: "docs/body/screenplay/round/010-first-exchange.md",
  heading: "First exchange",
  section: { anchor: "s01", title: "Feeling out" },
  beats: [
    {
      anchor: "s01-b01",
      title: "Ren tests the range",
      text: "Ren steps in behind a jab and a cross. Kai parries the jab and slips the cross.",
      spans: { red: [1, 3], blu: [1, 2] },
    },
    {
      anchor: "s01-b02",
      title: "The low kick",
      text: "Ren chops at the thigh. Kai lifts his shin into it.",
      spans: { red: [4, 4], blu: [3, 3] },
    },
    {
      anchor: "s01-b03",
      title: "Kai answers",
      text: "Kai's jab lands on Ren's gloves; his hook whistles past as Ren leans away.",
      spans: { red: [5, 6], blu: [4, 5] },
    },
    {
      anchor: "s01-b04",
      title: "Ren closes in",
      text: "A hook and an uppercut into Kai's cover, then the clinch and a knee.",
      spans: { red: [7, 10], blu: [6, 9] },
    },
    {
      anchor: "s01-b05",
      title: "The teep",
      text: "Kai's teep drives Ren back a step, and both circle off.",
      spans: { red: [12, 15], blu: [10, 12] },
    },
  ],
  brief: {
    file: "docs/body/brief/cast/ren.md",
    text: [
      "# Ren",
      "",
      "## Stance {#stance}",
      "",
      "Orthodox. Leads with the left hand and kicks off the rear leg.",
      "",
      "## Temper {#temper}",
      "",
      "Presses forward and takes a hit to land one.",
    ],
  },
  record: [
    "### Ren tests the range {#s01-b01}",
    "- Cast: [Ren](../../brief/cast/ren.md#stance), [Kai](../../brief/cast/kai.md#guard)",
    "- Intent: Ren measures the distance with his lead hand.",
    "- Outcome: both punches are defended; Ren learns the range.",
    "- Camera: side, full shot, both fighters in frame.",
  ],
  code: {
    file: "src/composition/scenes/round/firstExchange.ts",
    text: [
      "const Chain = HumanChain.extend({",
      "  jab, cross, roundKick, handParry, slip, checkKick,",
      "});",
      "const face = at(\"blu\", \"face\");",
      "",
      "/**",
      " * @evidence docs/body/screenplay/round/010-first-exchange.md#s01-b01",
      " *   The jab and the cross, parried and slipped.",
      " * @evidence docs/body/screenplay/round/010-first-exchange.md#s01-b02",
      " *   The low kick, checked.",
      " */",
      "export const ren = Chain.subject(\"red\")",
      "  .guard({ seconds: 1, style: \"kickboxing\", facing: face })",
      "  .step({ direction: \"forward\", steps: 1 })",
      "  .jab({ at: face }, \"kr-jab\")",
      "  .cross({ at: at(\"blu\", \"chin\") }, \"kr-cross\")",
      "  .roundKick({ at: at(\"blu\", \"thighOuterLeft\") }, \"kr-low\");",
      "",
      "export const kai = Chain.subject(\"blu\")",
      "  .guard({ seconds: 1.4, style: \"kickboxing\", facing: at(\"red\", \"face\") })",
      "  .handParry({ against: \"kr-jab\" })",
      "  .slip({ against: \"kr-cross\" })",
      "  .checkKick({ against: \"kr-low\" });",
    ],
  },
  report: {
    failing: [
      "$ pnpm run evidence",
      "Coverage: 41/42 units covered, 1 missing.",
      "Diagnostics: 1 errors, 0 warnings.",
      "",
      "ERROR [graph-missing-acknowledgement]",
      "Missing acknowledgement for",
      "'docs/body/screenplay/round/010-first-exchange.md#s01-b05'.",
    ],
    passing: [
      "$ pnpm run evidence",
      "Coverage: 42/42 units covered, 0 missing.",
      "Diagnostics: 0 errors, 0 warnings.",
    ],
  },
};
