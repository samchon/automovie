import type {
  IAutoMovieConstructionNode,
  IAutoMovieHumanBodyLaw,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanLimbSources } from "../generation/AutoMovieHumanLimbSources";

/**
 * Audit the actual neutral declaration before solid realization. Logical source
 * names, the neck continuation and each side's limb chain determine the
 * obligations. A rejected authored or emitted face cannot pass by leaving a
 * smaller closed shell.
 */
export function inspectHumanNeutralTopology(
  definition: IAutoMovieHumanBodyLaw.IDefinition,
): { owners: string[]; diagnostics: string[] } {
  const { root, sourceParts, sources: laneSources } = definition.lane;
  const head: typeof definition.head.source.parts =
    definition.head.source.parts;
  const diagnostics: string[] = [];
  const owners: string[] = [
    ...new Set([
      "trunk",
      "head.mass",
      ...AutoMovieHumanLimbSources.names(),
      ...laneSources.map(({ name }): string => name),
      ...head
        .filter(({ sectionOwner }) => sectionOwner === undefined)
        .map(({ feature }): string => feature.part.name),
    ]),
  ];
  if (root === null)
    return { owners, diagnostics: ["body has no declared root"] };

  const nodes: Set<string> = new Set();
  const sources: Set<string> = new Set();
  const connections: Set<string> = new Set();
  let neck: boolean = false;

  /** Register one link after checking both declared faces' subtree ownership. */
  const link = (
    node: string,
    host: string,
    knownHost: boolean,
    part: string,
    partFaces: ReadonlySet<string>,
  ): void => {
    if (!knownHost || !partFaces.has(part))
      diagnostics.push(
        `${node} addresses ${host} and ${part} outside their subtrees`,
      );
    connections.add(`${host}/${part}`);
  };
  /** Read one complete subtree in postorder and return its addressable faces. */
  const visit = (node: IAutoMovieConstructionNode): Set<string> => {
    if (nodes.has(node.name))
      diagnostics.push(`construction name repeats: ${node.name}`);
    nodes.add(node.name);
    if (node.type === "source") {
      if (sourceParts.get(node.source)?.name !== node.name)
        diagnostics.push(
          `${node.name} has no matching original ${node.source}`,
        );
      sources.add(node.name);
      return new Set([node.name]);
    }
    if (node.type === "view" || node.type === "profile") {
      diagnostics.push(
        `${node.name} does not resolve an actual neutral original`,
      );
      return new Set([node.name]);
    }
    const faces: Set<string> = visit(node.host);
    if (node.type === "trim") {
      if (!faces.has(node.face))
        diagnostics.push(`${node.name} trims a face outside its host subtree`);
      return faces;
    }
    if (node.type === "split") {
      const knownHost: boolean = faces.has(node.hostFace);
      for (const child of node.children) {
        const part: Set<string> = visit(child.part);
        link(node.name, node.hostFace, knownHost, child.partFace, part);
        for (const face of part) faces.add(face);
        faces.add(child.band);
      }
      return faces;
    }
    const host: string =
      node.type === "join" ? node.seed.hostFace : node.hostFace;
    const part: string =
      node.type === "join" ? node.seed.partFace : node.partFace;
    const partFaces: Set<string> = visit(node.part);
    link(node.name, host, faces.has(host), part, partFaces);
    const feature = head.find(
      (item): boolean => item.feature.part.name === part,
    )?.feature;
    if (feature !== undefined && !faces.has(feature.parent))
      diagnostics.push(
        `${part} is outside its anatomical parent ${feature.parent}`,
      );
    if (
      (part.startsWith("nose.nostril.") || part.startsWith("ear.concha.")) &&
      (node.type !== "join" || node.kind !== "diff")
    )
      diagnostics.push(`${part} does not cut its cavity`);
    if (
      node.type === "continue" &&
      host === "trunk" &&
      part === "head.mass" &&
      node.hostEnd === "top" &&
      node.partEnd === "bottom"
    )
      neck = true;
    if (node.type === "port") {
      const original: IAutoMovieViewPart | undefined = sourceParts.get(host);
      const station: number = node.loop.centre[0] * 1000;
      if (
        original !== undefined &&
        (!(
          station > original.stations[0]! && station < original.stations.at(-1)!
        ) ||
          !(node.loop.semi[1] > 0 && node.loop.semi[1] < Math.PI))
      )
        diagnostics.push(`${node.name} has an off-domain port on ${host}`);
    }
    for (const face of partFaces) faces.add(face);
    faces.add(node.name);
    return faces;
  };

  visit(root);
  for (const name of owners)
    if (!sources.has(name))
      diagnostics.push(`no declared original for ${name}`);
  if (!neck)
    diagnostics.push(
      "the head does not consume the trunk's upper neck boundary",
    );

  /** Admit either traversal direction for a link between two anatomical owners. */
  const connected = (a: string, b: string): boolean =>
    connections.has(`${a}/${b}`) || connections.has(`${b}/${a}`);
  for (const side of ["left", "right"] as const) {
    const arm: string = `arm.${side}`;
    const hand: string = `hand.${side}`;
    const leg: string = `leg.${side}`;
    const foot: string = `foot.${side}`;
    for (const [a, b] of [
      [arm, "trunk"],
      [leg, "trunk"],
      [leg, foot],
    ] as const)
      if (!connected(a, b))
        diagnostics.push(`missing anatomical connection: ${a} to ${b}`);
    const palm: string = sources.has(hand) ? hand : arm;
    if (palm === hand && !connected(arm, hand))
      diagnostics.push(`${hand} does not continue ${arm}`);
    for (const name of owners) {
      const parent: string | null = name.startsWith(`toe.${side}.`)
        ? foot
        : name.startsWith(`finger.${side}.`) || name === `thumb.${side}`
          ? palm
          : null;
      if (parent !== null && !connected(parent, name))
        diagnostics.push(`${name} does not branch from ${parent}`);
    }
  }
  for (const { feature, sectionOwner } of head) {
    if (sectionOwner !== undefined) {
      if (
        !sources.has(feature.parent) ||
        sourceParts.get(feature.parent)?.originalSection !== sectionOwner
      )
        diagnostics.push(
          `${feature.part.name} is absent from its parent's original section field`,
        );
    } else if (
      !connected(feature.material?.name ?? feature.parent, feature.part.name)
    )
      diagnostics.push(
        `${feature.part.name} does not attach to its declared parent face`,
      );
  }
  return { owners, diagnostics };
}
