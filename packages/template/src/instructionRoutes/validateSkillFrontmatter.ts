import { isMap, parseDocument } from "yaml";

/** Admit skill metadata before traversing its original Markdown body. */
export const validateSkillFrontmatter = (
  file: string,
  markdown: string,
  expectedName: string,
): string => {
  const lines = markdown.split(/\r?\n/u);
  if (lines[0] !== "---")
    throw new Error(`${file}: production skill frontmatter is missing.`);
  const end = lines.indexOf("---", 1);
  if (end === -1)
    throw new Error(`${file}: production skill frontmatter is unterminated.`);
  const frontmatter = parseDocument(lines.slice(1, end).join("\n"), {
    prettyErrors: false,
    strict: true,
    uniqueKeys: true,
  });
  const diagnostic = frontmatter.errors[0] ?? frontmatter.warnings[0];
  if (diagnostic !== undefined)
    throw new Error(
      `${file}: production skill frontmatter is invalid: ${diagnostic.message}`,
    );
  if (!isMap(frontmatter.contents))
    throw new Error(`${file}: production skill frontmatter must be a mapping.`);
  const name: unknown = frontmatter.contents.get("name");
  if (name !== expectedName)
    throw new Error(`${file}: production skill name must be ${expectedName}.`);
  const description: unknown = frontmatter.contents.get("description");
  if (typeof description !== "string" || description.trim() === "")
    throw new Error(`${file}: production skill description is missing.`);
  return lines.slice(end + 1).join("\n");
};
