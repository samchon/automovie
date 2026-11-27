import { createLintConfig } from "@automovie/config";

export default createLintConfig({
  extends: "../../config/lint.config.ts",
  documented: "public",
});
