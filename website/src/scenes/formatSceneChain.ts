import { AutoMovieEngineScheduleCut } from "@automovie/engine";
import { ArchetypeRegistry } from "../archetypes/ArchetypeRegistry";
import { playgroundActionParams } from "../playground/data/playgroundActionParams";
import { playgroundAidWalkAction } from "../playground/package/playgroundAidWalkAction";
import type { IPlaygroundComposition } from "../playground/structures/IPlaygroundComposition";
import { sceneCourseBuilder } from "./sceneCourseBuilder";
import type { ISceneChainNames } from "./structures/ISceneChainNames";

/**
 * A composition as the TypeScript an agent writes against `@automovie/motions`:
 * the archetypes it places, one `AutoMovieMotionHumanChain` per performer, each vocabulary
 * action appended with `act` and each lexicon row with `registered`, cut with
 * `until`, timed with `sync` and with the actions performed over it in `over`;
 * the people's chains joined with `with`, each mutual action after them with
 * `next`; the laws the performance registers; each placed archetype as a prop
 * through `AutoMovieMotionHumanObject.prop`, with the person and bone it starts worn on, and a
 * blade that starts in its carrier staged by `HumanSheath.of`; and the authored
 * impulses. It shows the input `AutoMovieMotionHumanPerformance` is built from, as
 * `PlaygroundPerformance` builds it, ending in the one line `const performance
 * = new AutoMovieMotionHumanPerformance(input);`. A seat is written as `AutoMovieMotionHumanObject.seat` of
 * the archetype that carries it, and an opening as `HumanObstacle.apertures`.
 * Each person's body is read from `bodies`, declared as the
 * `IAutoMovieMotionHumanBody` of each of the site's body ids, since a body is
 * prepared from measures the code does not show.
 *
 * @param composition The composition.
 * @param names The exported names its code refers to, read from the packages
 *   when the site is built.
 * @returns The source text.
 */
export function formatSceneChain(
  composition: IPlaygroundComposition,
  names: ISceneChainNames,
): string {
  const objects: readonly IPlaygroundComposition.IObject[] =
    composition.objects ?? [];
  const courses: readonly IPlaygroundComposition.IObject[] = objects.filter(
    (object: IPlaygroundComposition.IObject): boolean =>
      object.course !== undefined,
  );
  const imports: Set<string> = new Set<string>(["AutoMovieMotionHumanChain"]);
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
    bodyId: string,
    by: string,
  ) => string[] = (
    actions: IPlaygroundComposition.IAction[],
    bodyId: string,
    by: string,
  ): string[] =>
    actions.flatMap((action: IPlaygroundComposition.IAction): string[] => {
      const method: string =
        names.rows[action.name] === undefined ? "act" : "registered";
      const params: Record<string, unknown> = playgroundActionParams(
        action,
        names.bodySex[bodyId],
      );
      const out: string[] = [
        `${by}.${method}(${JSON.stringify(action.name)}, ${indent(value(params), by)}${action.anchor === undefined ? "" : `, ${JSON.stringify(action.anchor)}`})`,
      ];
      if (action.until !== undefined)
        out.push(
          `${by}.until(${indent(
            value(AutoMovieEngineScheduleCut.normalize(action.until)),
            by,
          )})`,
        );
      if (action.over !== undefined && action.over.length !== 0)
        out.push(
          `${by}.over((overlay) =>`,
          `${by}  overlay`,
          ...calls(action.over, bodyId, `${by}    `),
          `${by})`,
        );
      if (action.sync !== undefined)
        out.push(`${by}.sync(${indent(value(action.sync), by)})`);
      return out;
    });

  for (const o of objects) {
    const producer: string =
      ArchetypeRegistry.get(o.producer)?.expression ??
      `archetypes.${o.producer}`;
    const key: string = names.frames.includes(o.producer)
      ? "frame"
      : names.formats.includes(o.producer)
        ? "format"
        : "kind";
    body.push(
      `const ${identifier(o.subject)} = ${producer}(${options(o, key)}${o.seed === undefined ? "" : `, ${JSON.stringify(o.seed)}`});`,
      o.rotation === undefined
        ? `const ${identifier(o.subject)}At = { at: { x: ${o.x}, y: ${o.y ?? 0}, z: ${o.z} }, yaw: ${o.yaw}${o.fixed === true ? ", fixed: true" : ""} };`
        : `const ${identifier(o.subject)}At = { position: { x: ${o.x}, y: ${o.y ?? 0}, z: ${o.z} }, rotation: ${literal(o.rotation, imports)}${o.fixed === true ? ", fixed: true" : ""} };`,
    );
  }
  for (const object of courses) {
    const name: string = identifier(object.subject);
    const course = {
      ...object.course,
      start: { x: object.x, z: object.z, heading: object.yaw },
    };
    const lift: string = `archetypes.${sceneCourseBuilder(object.producer)}(${name}, ${value(course)})`;
    body.push(`const ${name}Ride = ${lift};`);
    if (object.joints === undefined) continue;
    body.push(
      `const ${name}Joints = ${value(object.joints)};`,
      `const ${name}State = (seconds: number) => ({`,
      `  ...${name}Ride.at(seconds).archetype.state,`,
      `  ...Object.fromEntries(Object.entries(${name}Joints).map(([joint, keys]) => {`,
      "    const later = keys.findIndex((key) => key.seconds > seconds);",
      "    if (later < 1) return [joint, (later === -1 ? keys.at(-1) : keys[0])!.value];",
      "    const a = keys[later - 1]!;",
      "    const b = keys[later]!;",
      "    return [joint, a.value + ((seconds - a.seconds) / (b.seconds - a.seconds)) * (b.value - a.value)];",
      "  })),",
      "});",
    );
  }

  // A native ride publishes its authored gait instants on the film clock.
  const hasCues: boolean =
    courses.length !== 0 || composition.cues !== undefined;
  if (hasCues) {
    body.push(
      "",
      `const cues: Record<string, NonNullable<IAutoMovieMotionHumanPerformance.IInput["cues"]>[string]> = ${value(composition.cues ?? {})};`,
    );
    for (const object of courses) {
      const name: string = identifier(object.subject);
      body.push(
        `const ${name}Gaits = ${name}Ride.instants`,
        '  .filter(({ label }) => label.startsWith("gait:"))',
        "  .map(({ label, seconds }) => ({ name: label, seconds }));",
        `if (${name}Gaits.length !== 0) cues[${JSON.stringify(`${object.subject}:gaits`)}] = ${name}Gaits;`,
      );
    }
  }
  if (objects.length !== 0) body.push("");

  for (const performer of composition.performers) {
    if (performer.actions.length === 0) continue;
    body.push(
      `// ${performer.subject}: body ${performer.body}, at (${performer.x}, ${performer.z}) m, facing ${performer.yaw}째, ${performer.proficiency}`,
      `const ${identifier(performer.subject)} = AutoMovieMotionHumanChain.subject(${JSON.stringify(performer.subject)})`,
      ...calls(performer.actions, performer.body, "  "),
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
      `AutoMovieMotionHumanChain.mutual(\n  ${use(names.mutuals[mutual.name] ?? mutual.name)},\n  { ${Object.entries(
        mutual.cast,
      )
        .map(
          ([role, subject]: [string, string]): string =>
            `${role}: AutoMovieMotionHumanChain.subject(${JSON.stringify(subject)})`,
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
    imports.add("AutoMovieMotionHumanObject");
    body.push(
      "",
      "const props = [",
      ...objects.map((o: IPlaygroundComposition.IObject): string => {
        const name: string = identifier(o.subject);
        const aid = playgroundAidWalkAction(o, composition.performers);
        const state =
          o.joints === undefined
            ? `${name}Ride.at(seconds).archetype.state`
            : `${name}State(seconds)`;
        const homeState =
          o.joints === undefined
            ? `${name}Ride.at(0).archetype.state`
            : `${name}State(0)`;
        const read =
          o.joints === undefined
            ? `${name}Ride.frame(id as Parameters<typeof ${name}Ride.frame>[0], seconds)`
            : `archetypes.AutoMovieArchetypeFrame.compose(${name}Ride.at(seconds).placement, ${name}.articulate(${state}).affordance(id as Parameters<typeof ${name}.affordance>[0]).frame)`;
        const travel: string =
          aid !== undefined
            ? ", " +
              use("HumanAidWalk") +
              ".track(AutoMovieMotionHumanObject.frame(" +
              name +
              "At), " +
              value(aid) +
              ")"
            : o.course === undefined
              ? ""
              : `, (seconds) => {
    const { translation, rotation } = ${name}Ride.at(seconds).placement;
    return { position: translation, rotation };
  }, (id, seconds) => ${read}, Object.keys(${homeState}).map((articulation) => ({
    articulation, start: 0, travel: (seconds) => Reflect.get(${state}, articulation) ?? 0,
  }))`;
        const made: string = `AutoMovieMotionHumanObject.prop(${JSON.stringify(o.subject)}, ${name}, ${name}At${travel})`;
        return o.worn === undefined
          ? `  ${made},`
          : `  { ...${made}, worn: ${indent(literal(o.worn, imports), "  ")} },`;
      }),
      "];",
    );

    // A blade that starts seated in a carrier is staged with it.
    objects.forEach(
      (o: IPlaygroundComposition.IObject, index: number): void => {
        if (o.sheath === undefined) return;
        const carrier: number = objects.findIndex(
          (c: IPlaygroundComposition.IObject): boolean =>
            c.subject === o.sheath!.carrier,
        );
        const params: Omit<IPlaygroundComposition.ISheath, "carrier"> = {
          mouth: o.sheath.mouth,
          tip: o.sheath.tip,
          handle: o.sheath.handle,
          clearance: o.sheath.clearance,
        };
        const staged: string = `${identifier(o.subject)}Sheath`;
        imports.add("HumanSheath");
        body.push(
          `const ${staged} = HumanSheath.of(props[${carrier}]!, props[${index}]!, ${literal(params, imports)});`,
          `props[${carrier}] = ${staged}.carrier;`,
          `props[${index}] = ${staged}.blade;`,
        );
      },
    );
  }

  // The performance is built from the people, the composition, the props
  // and the laws, each list given only where the scene has one.
  imports.add("AutoMovieMotionHumanPerformance");
  body.push(
    "",
    "// Each body id's motion body, prepared from the site's measures.",
    "declare const bodies: Record<string, IAutoMovieMotionHumanBody>;",
    "",
    "const input: IAutoMovieMotionHumanPerformance.IInput = {",
    `  seed: ${JSON.stringify(composition.seed)},`,
    "  performers: [",
    ...composition.performers.map(
      (p: IPlaygroundComposition.IPerformer): string =>
        `    { subject: ${JSON.stringify(p.subject)}, body: bodies[${JSON.stringify(p.body)}]!, at: { x: ${p.x}, y: 0, z: ${p.z} }, yaw: ${p.yaw}, proficiency: { level: ${JSON.stringify(p.proficiency)} } },`,
    ),
    "  ],",
    "  composition: scene.node,",
    ...(composition.forces === undefined
      ? []
      : [`  forces: ${value(composition.forces)},`]),
    ...(objects.length === 0 ? [] : ["  props,"]),
    ...(hasCues ? ["  cues,"] : []),
    ...(names.laws.length === 0 ? [] : ["  laws,"]),
    "};",
    "const performance = new AutoMovieMotionHumanPerformance(input);",
  );

  const header: string[] = [
    'import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPerformance } from "@automovie/interface";',
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

/**
 * A subject id as a variable name: a reserved word, or one that starts with a
 * digit, is changed so it is not one.
 */
function identifier(subject: string): string {
  const name: string = subject.replace(/[^A-Za-z0-9_$]/g, "_");
  return /^[0-9]/.test(name)
    ? `_${name}`
    : RESERVED.has(name)
      ? `${name}_`
      : name;
}

/**
 * A value as a TypeScript literal: short objects on one line, longer ones one
 * member a line; it records the namespaces it names.
 */
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
      imports.add("AutoMovieMotionHumanObject");
      return `AutoMovieMotionHumanObject.seat(${identifier(seat as string)}, ${identifier(seat as string)}At${typeof id === "string" ? `, ${JSON.stringify(id)}` : ""})`;
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

/**
 * Emit the stated parameters and any variant under the producer's declared key,
 * such as `kind`, `frame` or `format`.
 */
function options(object: IPlaygroundComposition.IObject, key: string): string {
  const entries: [string, unknown][] = Object.entries({
    ...(object.params ?? {}),
    ...(object.kind === undefined ? {} : { [key]: object.kind }),
  });
  return entries.length === 0
    ? "{}"
    : `{ ${entries.map(([key, value]: [string, unknown]): string => `${key}: ${JSON.stringify(value)}`).join(", ")} }`;
}
