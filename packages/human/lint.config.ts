import type { ITtscLintConfig } from "@ttsc/lint";

/** General source correctness lint; evidence runs through its own command. */
export default { extends: "../../config/lint.config.ts", rules: {
    // Dependencies run face -> common <- body, and `human` composes both.
    // `common` imports neither anatomy, the two anatomies never import each
    // other, and neither imports the composition.
    "boundaries/element-types": [
      "error",
      {
        elements: [
          { type: "common", pattern: "src/common/**" },
          { type: "body", pattern: "src/body/**" },
          { type: "face", pattern: "src/face/**" },
          { type: "human", pattern: "src/human/**" },
        ],
        rules: [
          { from: "common", disallow: ["body", "face", "human"] },
          { from: "body", disallow: ["face", "human"] },
          { from: "face", disallow: ["body", "human"] },
        ],
      },
    ],
} } satisfies ITtscLintConfig;
