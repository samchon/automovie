import type { IPlaygroundComposition } from "../playground/structures/IPlaygroundComposition";

/**
 * A composition as the TypeScript an agent writes against
 * `@automovie/motions`: the archetypes it places, one `HumanChain` per
 * performer, each action appended by name with its parameters, cut with
 * `until`, timed with `sync` and with the actions performed over it in
 * `over`. A seat is written as `HumanObject.seat` of the archetype that
 * carries it.
 *
 * @param composition The composition.
 * @returns The source text.
 */
export function formatSceneChain(composition: IPlaygroundComposition): string {
  const objects: readonly IPlaygroundComposition.IObject[] =
    composition.objects ?? [];
  const lines: string[] =
    objects.length === 0
      ? ['import { HumanChain } from "@automovie/motions";', ""]
      : [
          'import { HumanChain, HumanObject } from "@automovie/motions";',
          'import * as archetypes from "@automovie/archetypes";',
          "",
          ...objects.flatMap((o: IPlaygroundComposition.IObject): string[] => [
            `const ${identifier(o.subject)} = archetypes.${o.producer}(${options(o)}${o.seed === undefined ? "" : `, ${JSON.stringify(o.seed)}`});`,
            `const ${identifier(o.subject)}At = { at: { x: ${o.x}, y: ${o.y ?? 0}, z: ${o.z} }, yaw: ${o.yaw} };`,
          ]),
          "",
        ];
  const indent: (text: string, by: string) => string = (
    text: string,
    by: string,
  ): string => text.split("\n").join(`\n${by}`);
  const value: (v: unknown) => string = (v: unknown): string =>
    indent(literal(v), "  ");

  const calls: (
    actions: IPlaygroundComposition.IAction[],
    by: string,
  ) => string[] = (
    actions: IPlaygroundComposition.IAction[],
    by: string,
  ): string[] =>
    actions.flatMap((action: IPlaygroundComposition.IAction): string[] => {
      const out: string[] = [
        `${by}.act(${JSON.stringify(action.name)}, ${indent(value(action.params), by)}${action.anchor === undefined ? "" : `, ${JSON.stringify(action.anchor)}`})`,
      ];
      if (action.until !== undefined)
        out.push(`${by}.until(${indent(value(action.until), by)})`);
      if (action.over !== undefined && action.over.length !== 0)
        out.push(
          `${by}.over((overlay) =>`,
          `${by}  overlay`,
          ...calls(action.over, `${by}    `),
          `${by})`,
        );
      if (action.sync !== undefined)
        out.push(`${by}.sync(${indent(value(action.sync), by)})`);
      return out;
    });

  for (const performer of composition.performers) {
    lines.push(
      `// ${performer.subject}: body ${performer.body}, at (${performer.x}, ${performer.z}) m, facing ${performer.yaw}°, ${performer.proficiency}`,
      `const ${identifier(performer.subject)} = HumanChain.subject(${JSON.stringify(performer.subject)})`,
      ...calls(performer.actions, "  "),
    );
    lines[lines.length - 1] += ";";
    lines.push("");
  }
  for (const mutual of composition.mutuals)
    lines.push(
      `// ${mutual.name}, after every chain above: ${Object.entries(mutual.cast)
        .map(
          ([role, subject]: [string, string]): string =>
            `${subject} as ${role}`,
        )
        .join(", ")}`,
    );
  lines.push(
    `const scene = ${composition.performers
      .map((p: IPlaygroundComposition.IPerformer): string =>
        identifier(p.subject),
      )
      .reduce((a: string, b: string): string => `${a}.with(${b})`)};`,
  );
  return lines.join("\n");
}

/** A subject id as a variable name. */
function identifier(subject: string): string {
  const name: string = subject.replace(/[^A-Za-z0-9_$]/g, "_");
  return /^[0-9]/.test(name) ? `_${name}` : name;
}

/** A value as a TypeScript literal: short objects on one line, longer ones one member a line. */
function literal(value: unknown): string {
  if (Array.isArray(value)) {
    const items: string[] = value.map(literal);
    const flat: string = `[${items.join(", ")}]`;
    return flat.length <= 60 ? flat : `[\n  ${items.join(",\n  ")},\n]`;
  }
  if (typeof value === "object" && value !== null) {
    const seat: unknown = (value as Record<string, unknown>)["$seat"];
    if (typeof seat === "string") {
      const id: unknown = (value as Record<string, unknown>)["id"];
      return `HumanObject.seat(${identifier(seat)}, ${identifier(seat)}At${typeof id === "string" ? `, ${JSON.stringify(id)}` : ""})`;
    }
    const entries: string[] = Object.entries(value).map(
      ([key, inner]: [string, unknown]): string =>
        `${/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)}: ${literal(inner).replaceAll("\n", "\n  ")}`,
    );
    if (entries.length === 0) return "{}";
    const flat: string = `{ ${entries.join(", ")} }`;
    return flat.length <= 60 && !flat.includes("\n")
      ? flat
      : `{\n  ${entries.join(",\n  ")},\n}`;
  }
  return JSON.stringify(value);
}

/** A producer's options as code: the stated dimensions, then the kind; `{}` when there are none. */
function options(object: IPlaygroundComposition.IObject): string {
  const entries: [string, unknown][] = Object.entries({
    ...(object.params ?? {}),
    ...(object.kind === undefined ? {} : { kind: object.kind }),
  });
  return entries.length === 0
    ? "{}"
    : `{ ${entries.map(([key, value]: [string, unknown]): string => `${key}: ${JSON.stringify(value)}`).join(", ")} }`;
}
