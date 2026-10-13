import {
  type IAutoMovieInstructionMarkdownSource,
  validateAutoMovieSkillRouterLinks,
} from "@automovie/template";
import { TestValidator } from "@nestia/e2e";

/**
 * Skill publication admits metadata and visible title order before advertising
 * any conditional topic, using only the supplied immutable source population.
 *
 * Scenarios:
 *
 * 1. A skill, topic and data resource form a valid discoverable publication.
 * 2. Malformed YAML, unknown tags, wrong metadata and invalid title order refuse.
 * 3. Duplicate normalized paths and broken skill/topic routes refuse together
 *    with the same publication boundary used by direct instruction links.
 */
export const test_template_instruction_skill_metadata = (): void => {
  const file = ".agents/skills/alpha/SKILL.md";
  const valid = "---\nname: alpha\ndescription: Operate the supplied source.\n---\n# Alpha\n[topic](topic.md)\n[data](data.json)";
  const topic: IAutoMovieInstructionMarkdownSource = { path: ".agents/skills/alpha/topic.md", content: "# Topic\n[entry](SKILL.md#alpha)" };
  const data: IAutoMovieInstructionMarkdownSource = { path: ".agents/skills/alpha/data.json", content: "{}" };
  const sources: IAutoMovieInstructionMarkdownSource[] = [{ path: file, content: valid }, topic, data];
  const before = JSON.stringify(sources);
  validateAutoMovieSkillRouterLinks(sources);
  validateAutoMovieSkillRouterLinks([]);
  TestValidator.equals("candidate source is preserved", JSON.stringify(sources), before);
  const invalid = [
    "# Alpha",
    "---\nname: alpha",
    "---\nname: [\n---\n# Alpha",
    "---\nname: alpha\nname: alpha\ndescription: description\n---\n# Alpha",
    "---\nname: !unknown alpha\ndescription: description\n---\n# Alpha",
    "---\n[]\n---\n# Alpha",
    "---\nname: beta\ndescription: description\n---\n# Alpha",
    "---\nname: alpha\n---\n# Alpha",
    "---\nname: alpha\ndescription: 3\n---\n# Alpha",
    "---\nname: alpha\ndescription: ' '\n---\n# Alpha",
    "---\nname: alpha\ndescription: description\n---\n## Before\n# Alpha",
    "---\nname: alpha\ndescription: description\n---\n# Alpha\n# Another",
    "---\nname: alpha\ndescription: description\n---\nNo heading",
  ];
  for (const content of invalid)
    TestValidator.error("invalid skill publication", () => validateAutoMovieSkillRouterLinks([{ path: file, content }]));
  TestValidator.error("duplicate normalized instruction source", () => validateAutoMovieSkillRouterLinks([
    { path: file, content: valid }, { path: ".agents\\skills\\alpha\\SKILL.md", content: valid }, topic, data,
  ]));
  TestValidator.error("skill topic missing", () => validateAutoMovieSkillRouterLinks([{ path: file, content: valid }]));
  TestValidator.error("topic link missing", () => validateAutoMovieSkillRouterLinks([
    { path: file, content: valid }, { ...topic, content: "# Topic\n[missing](absent.md)" }, data,
  ]));
};
