import type { IPlaygroundComposition } from "../playground/structures/IPlaygroundComposition";
import type { ISceneChainNames } from "./structures/ISceneChainNames";

/**
 * A composition as the TypeScript an agent writes against
 * `@automovie/motions`: the archetypes it places, one `HumanChain` per
 * performer, each vocabulary action appended with `act` and each lexicon
 * row with `registered`, cut with `until`, timed with `sync` and with the
 * actions performed over it in `over`; the people's chains joined with
 * `with`, each mutual action after them with `next`; the laws the
 * performance registers; each placed archetype as a prop through
 * `HumanObject.prop`, with the person and bone it starts worn on; and the
 * input `HumanPerformance` is built from, as `PlaygroundPerformance` builds
 * it, ending in the one line `const performance = new
 * HumanPerformance(input);`. A seat is written as `HumanObject.seat` of the
 * archetype that carries it, and an opening as `HumanObstacle.apertures`.
 * Each person's body is read from `bodies`, declared as the `IHumanBody`
 * of each of the site's body ids, since a body is prepared from measures
 * the code does not show.
 *
 * @param composition The composition.
 * @param names The exported names its code refers to, read from the packages when the site is built.
 * @returns The source text.
 */
export function formatSceneChain(
  composition: IPlaygroundComposition,
  names: ISceneChainNames,
): string {
  const objects: readonly IPlaygroundComposition.IObject[] =
    composition.objects ?? [];
  const imports: Set<string> = new Set<string>(["HumanChain"]);
  const body: string[] = [];
  const indent: (text: string, by: string) => string = (
    text: string,
    by: string,
  ): string => text.split("\n").join(`\n${by}`);
  const value: (v: unknown) => string = (v: unknown): string =>
    indent(literal(v, imports), "  ");

  // The namespace a qualified name such as `HumanSocial.toast` is imported by.
  const use: (expression: string) => string = (expression: string): string => {
    imports.add(expression.split(".")[0]!);
    return expression;
  };

  const calls: (
    actions: IPlaygroundComposition.IAction[],
    by: string,
  ) => string[] = (
    actions: IPlaygroundComposition.IAction[],
    by: string,
  ): string[] =>
    actions.flatMap((action: IPlaygroundComposition.IAction): string[] => {
      const method: string =
        names.rows[action.name] === undefined ? "act" : "registered";
      const out: string[] = [
        `${by}.${method}(${JSON.stringify(action.name)}, ${indent(value(action.params), by)}${action.anchor === undefined ? "" : `, ${JSON.stringify(action.anchor)}`})`,
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

  for (const o of objects) {
    const key: string = names.frames.includes(o.producer) ? "frame" : "kind";
    body.push(
      `const ${identifier(o.subject)} = archetypes.${o.producer}(${options(o, key)}${o.seed === undefined ? "" : `, ${JSON.stringify(o.seed)}`});`,
      o.rotation === undefined
        ? `const ${identifier(o.subject)}At = { at: { x: ${o.x}, y: ${o.y ?? 0}, z: ${o.z} }, yaw: ${o.yaw} };`
        : `const ${identifier(o.subject)}At = { position: { x: ${o.x}, y: ${o.y ?? 0}, z: ${o.z} }, rotation: ${literal(o.rotation, imports)} };`,
    );
  }
  if (objects.length !== 0) body.push("");

  for (const performer of composition.performers) {
    if (performer.actions.length === 0) continue;
    body.push(
      `// ${performer.subject}: body ${performer.body}, at (${performer.x}, ${performer.z}) m, facing ${performer.yaw}°, ${performer.proficiency}`,
      `const ${identifier(performer.subject)} = HumanChain.subject(${JSON.stringify(performer.subject)})`,
      ...calls(performer.actions, "  "),
    );
    body[body.length - 1] += ";";
    body.push("");
  }

  // The people's chains run at once and each mutual action follows them, as
  // the performance joins them: `with` the others, then `next` the mutuals.
  const acting: string[] = composition.performers
    .filter(
      (p: IPlaygroundComposition.IPerformer): boolean => p.actions.length !== 0,
    )
    .map((p: IPlaygroundComposition.IPerformer): string =>
      identifier(p.subject),
    );
  const mutuals: string[] = composition.mutuals.map(
    (mutual: IPlaygroundComposition.IMutual): string =>
      `HumanChain.mutual(\n  ${use(names.mutuals[mutual.name] ?? mutual.name)},\n  { ${Object.entries(
        mutual.cast,
      )
        .map(
          ([role, subject]: [string, string]): string =>
            `${role}: HumanChain.subject(${JSON.stringify(subject)})`,
        )
        .join(", ")} },\n  ${indent(value(mutual.params), "  ")},\n)`,
  );
  const people: string | undefined =
    acting.length === 0
      ? undefined
      : acting.length === 1
        ? acting[0]!
        : `${acting[0]}.with(${acting.slice(1).join(", ")})`;
  const head: string = people ?? mutuals[0]!;
  const rest: string[] = people === undefined ? mutuals.slice(1) : mutuals;
  body.push(
    rest.length === 0
      ? `const scene = ${head};`
      : `const scene = ${head}.next(\n  ${rest.map((m: string): string => indent(m, "  ")).join(",\n  ")},\n);`,
  );
  if (names.laws.length !== 0)
    body.push(
      "",
      "// The lexicon's laws this scene's rows perform, registered with the performance.",
      `const laws = [${names.laws.map(use).join(", ")}];`,
    );

  // Each placed archetype is a prop the actions name; one worn at the start
  // rides the wearer's bone until a hand draws it.
  if (objects.length !== 0) {
    imports.add("HumanObject");
    body.push(
      "",
      "const props = [",
      ...objects.map((o: IPlaygroundComposition.IObject): string => {
        const made: string = `HumanObject.prop(${JSON.stringify(o.subject)}, ${identifier(o.subject)}, ${identifier(o.subject)}At)`;
        return o.worn === undefined
          ? `  ${made},`
          : `  { ...${made}, worn: ${indent(literal(o.worn, imports), "  ")} },`;
      }),
      "];",
    );
  }

  // The performance is built from the people, the composition, the props
  // and the laws, each list given only where the scene has one.
  imports.add("HumanPerformance");
  imports.add("IHumanBody");
  body.push(
    "",
    "// Each body id's `IHumanBody`, prepared by @automovie/human from the site's measures.",
    "declare const bodies: Record<string, IHumanBody>;",
    "",
    "const input: HumanPerformance.IInput = {",
    `  seed: ${JSON.stringify(composition.seed)},`,
    "  performers: [",
    ...composition.performers.map(
      (p: IPlaygroundComposition.IPerformer): string =>
        `    { subject: ${JSON.stringify(p.subject)}, body: bodies[${JSON.stringify(p.body)}]!, at: { x: ${p.x}, y: 0, z: ${p.z} }, yaw: ${p.yaw}, proficiency: { level: ${JSON.stringify(p.proficiency)} } },`,
    ),
    "  ],",
    "  composition: scene.node,",
    ...(objects.length === 0 ? [] : ["  props,"]),
    ...(names.laws.length === 0 ? [] : ["  laws,"]),
    "};",
    "const performance = new HumanPerformance(input);",
  );

  const header: string[] = [
    `import { ${[...imports].sort().join(", ")} } from "@automovie/motions";`,
    ...(objects.length === 0
      ? []
      : ['import * as archetypes from "@automovie/archetypes";']),
    "",
  ];
  return [...header, ...body].join("\n");
}
/** The words a variable cannot be named. */
const RESERVED: ReadonlySet<string> = new Set<string>(
  "break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static implements interface package private protected public await arguments eval".split(
    " ",
  ),
);

/** A subject id as a variable name: a reserved word, or one that starts with a digit, is changed so it is not one. */
function identifier(subject: string): string {
  const name: string = subject.replace(/[^A-Za-z0-9_$]/g, "_");
  return /^[0-9]/.test(name)
    ? `_${name}`
    : RESERVED.has(name)
      ? `${name}_`
      : name;
}

/** A value as a TypeScript literal: short objects on one line, longer ones one member a line; it records the namespaces it names. */
function literal(value: unknown, imports: Set<string>): string {
  if (Array.isArray(value)) {
    const items: string[] = value.map((v: unknown): string =>
      literal(v, imports),
    );
    const flat: string = `[${items.join(", ")}]`;
    return flat.length <= 60 ? flat : `[\n  ${items.join(",\n  ")},\n]`;
  }
  if (typeof value === "object" && value !== null) {
    const seat: unknown = (value as Record<string, unknown>)["$seat"];
    const aperture: unknown = (value as Record<string, unknown>)["$aperture"];
    if (typeof seat === "string" || typeof aperture === "string") {
      const id: unknown = (value as Record<string, unknown>)["id"];
      if (typeof aperture === "string") {
        imports.add("HumanObstacle");
        return `HumanObstacle.apertures(${identifier(aperture)}, ${identifier(aperture)}At)${typeof id === "string" ? `.find((o) => o.id === ${JSON.stringify(id)})!` : "[0]!"}`;
      }
      imports.add("HumanObject");
      return `HumanObject.seat(${identifier(seat as string)}, ${identifier(seat as string)}At${typeof id === "string" ? `, ${JSON.stringify(id)}` : ""})`;
    }
    const entries: string[] = Object.entries(value).map(
      ([key, inner]: [string, unknown]): string =>
        `${/^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key)}: ${literal(inner, imports).replaceAll("\n", "\n  ")}`,
    );
    if (entries.length === 0) return "{}";
    const flat: string = `{ ${entries.join(", ")} }`;
    return flat.length <= 60 && !flat.includes("\n")
      ? flat
      : `{\n  ${entries.join(",\n  ")},\n}`;
  }
  return JSON.stringify(value);
}

/** A producer's options as code: the stated dimensions, then the kind under the producer's key (`kind` or `frame`); `{}` when there are none. */
function options(object: IPlaygroundComposition.IObject, key: string): string {
  const entries: [string, unknown][] = Object.entries({
    ...(object.params ?? {}),
    ...(object.kind === undefined ? {} : { [key]: object.kind }),
  });
  return entries.length === 0
    ? "{}"
    : `{ ${entries.map(([key, value]: [string, unknown]): string => `${key}: ${JSON.stringify(value)}`).join(", ")} }`;
}
