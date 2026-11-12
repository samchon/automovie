import { AutoMovieLoftChain, type AutoMovieLoftFrame, AutoMovieViewLoft, type IAutoMovieViewPart } from "@automovie/engine";
import { AutoMovieHumanF1 } from "@automovie/human";
import type { AutoMovieConstructionNode } from "@automovie/interface";

/**
 * The declaration of f1's sewn body, against the anatomy it declares.
 *
 * Scenarios:
 * 1. One body: the tree is one split of the trunk into two legs, five ports (an arm and an ear on each side, and the nose), twenty-two merges (five fingers, five toes and a helix on each side) and six cuts (a nostril, an ear's trough and an ear's bowl on each side), over thirty-six source leaves.
 * 2. Every leaf has its part: each source leaf's name is a key of the sources, and each part carries that name.
 * 3. Sides mirror: every operator on the +Z side has a twin whose part face is the same name with `.mirror`, and the two armscye loops and the two auricle loops have the same station and semi-axes and opposite phases; the armscye loops also run in opposite senses and carry the same 192 shares, near one and not all one, since each follows its arm's ring and the two rings are reflections.
 * 4. A digit is merged onto its own limb before that limb is attached, and a helix onto its own ear before that ear is attached: each merge's host face is an arm, a leg or, for a helix, the ear of the merge's own side, and no merge's host subtree holds the trunk. A nostril is cut from the whole head: its cut is seeded on the nose and its host subtree holds the trunk. An ear's bowl (the concha) is cut after the ear is attached: seeded on its own side's ear, with the trunk under its host. An ear's trough (the fossa) is cut from that ear alone: seeded on it, with no trunk under its host.
 * 5. A port stands on the trunk: each loop's centre station lies inside the trunk part's stations and its phase semi-axis is under pi.
 * 6. Rings round a turn stand no farther apart on the skin than the layers: on the arm and the leg, between neighbouring stations before the closed end, no ring point moves more than the declared 4 mm (5 % allowed for the part's own interpolation) by the course frame's sweep. Round the shoulder the deltoid's cap moved 7 to 10 mm between layers 4 mm apart and showed every ring as a stripe.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanF1.construction`, `armscye` and `auricle` and walks the tree they return.
 * @evidence contracts/development/testing.md#independent-expectations The counts are the body's own: two legs, two arms, two ears with a helix each, five fingers and five toes a side; mirror symmetry of the reference is a property of f1, not of this code.
 * @evidence contracts/development/testing.md#distinguishing-cases Splits, ports and merges are counted apart, both sides are compared, and the nesting of merges under limbs is told from merges over the whole body.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit that declares the tree and resolves its parts without realizing a surface, reached by `--include human_f1_construction`.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario with the anatomical fact it is checked against.
 */
export function test_human_f1_construction(): void {
  const failures: string[] = [];
  const declared: AutoMovieHumanF1.IConstruction = AutoMovieHumanF1.construction();
  const nodes: AutoMovieConstructionNode[] = [];
  const walk = (node: AutoMovieConstructionNode): void => {
    nodes.push(node);
    if (node.type === "join" || node.type === "port") {
      walk(node.host);
      walk(node.part);
    } else if (node.type === "split") {
      walk(node.host);
      for (const child of node.children) walk(child.part);
    }
  };
  walk(declared.root);
  const count = (type: string): number => nodes.filter((node: AutoMovieConstructionNode): boolean => node.type === type).length;

  // 1. The body's parts.
  for (const [type, expected] of [["split", 1], ["port", 5], ["join", 28], ["source", 36]] as [string, number][]) if (count(type) !== expected) failures.push(`${count(type)} ${type} nodes, expected ${expected}`);

  // 2. Leaves and their parts.
  for (const node of nodes)
    if (node.type === "source") {
      const part = declared.sources.get(node.source);
      if (part === undefined || part.name !== node.name) failures.push(`source leaf ${node.name} has ${part === undefined ? "no part" : "the part " + part.name}`);
    }
  if (declared.sources.size !== 36) failures.push(`${declared.sources.size} source parts, expected 36`);
  const kinds = (kind: string): number => nodes.filter((node: AutoMovieConstructionNode): boolean => node.type === "join" && node.kind === kind).length;
  if (kinds("merge") !== 22 || kinds("diff") !== 6) failures.push(`${kinds("merge")} merges and ${kinds("diff")} cuts, expected 22 and 6`);

  // 3. Both sides; the nose stands on the median plane and has no twin.
  const faces: string[] = nodes.flatMap((node: AutoMovieConstructionNode): string[] => (node.type === "port" ? [node.partFace] : node.type === "join" ? [node.seed.partFace] : node.type === "split" ? node.children.map((child): string => child.partFace) : [])).filter((name: string): boolean => name !== "nose");
  for (const face of faces.filter((name: string): boolean => !name.endsWith(".mirror"))) if (!faces.includes(face + ".mirror")) failures.push(`${face} has no twin`);
  if (faces.filter((name: string): boolean => name.endsWith(".mirror")).length !== faces.length / 2) failures.push(`${faces.length} operator faces are not half twins`);
  for (const [name, loop] of [["armscye", AutoMovieHumanF1.armscye], ["auricle", AutoMovieHumanF1.auricle]] as const) {
    const left = loop(1);
    const right = loop(-1);
    if (left.centre[0] !== right.centre[0] || left.centre[1] !== -right.centre[1] || left.semi[0] !== right.semi[0] || left.semi[1] !== right.semi[1]) failures.push(`${name} loops are not mirror images: ${JSON.stringify([left, right])}`);
  }

  if (AutoMovieHumanF1.armscye(1).sense !== 1 || AutoMovieHumanF1.armscye(-1).sense !== -1) failures.push("the armscye loops do not run as reflections of each other");
  const shapes: number[][] = nodes.flatMap((node: AutoMovieConstructionNode): number[][] => (node.type === "port" && node.name.startsWith("armscye.") ? [node.loop.shape ?? []] : []));
  if (shapes.length !== 2 || shapes[0]!.length !== 192 || shapes[0]!.some((share: number, k: number): boolean => !(share > 0.5 && share < 2) || Math.abs(share - shapes[1]![k]!) > 1e-9)) failures.push(`the armscye loops' shapes are not 192 shares near one, alike on both sides: ${JSON.stringify(shapes).slice(0, 300)}`);
  if (Math.max(...shapes[0]!) - Math.min(...shapes[0]!) < 0.02) failures.push("the armscye loop's shape is the plain ellipse, not the arm's ring");

  // 4. Merges under limbs, cuts where they belong.
  for (const node of nodes)
    if (node.type === "join" && node.kind === "diff") {
      const side: string = node.seed.partFace.endsWith(".mirror") ? ".mirror" : "";
      const under: AutoMovieConstructionNode[] = [];
      const collect = (inner: AutoMovieConstructionNode): void => {
        under.push(inner);
        if (inner.type === "join" || inner.type === "port" || inner.type === "split") collect(inner.host);
      };
      collect(node.host);
      const attached: boolean = under.some((inner: AutoMovieConstructionNode): boolean => inner.type === "source" && inner.name === "trunk");
      if (node.name.startsWith("cut.concha")) {
        if (node.seed.hostFace !== "ear" + side || !attached) failures.push(`${node.name} is not cut at its own ear after the ear is attached`);
      } else if (node.name.startsWith("cut.fossa")) {
        if (node.seed.hostFace !== "ear" + side || attached) failures.push(`${node.name} is not cut from its own ear alone`);
      } else if (node.seed.hostFace !== "nose" || !attached) failures.push(`${node.name} is not cut from the head at the nose`);
    } else if (node.type === "join") {
      const side: string = node.seed.partFace.endsWith(".mirror") ? ".mirror" : "";
      if (!(node.name.startsWith("rim.helix") ? ["ear" + side] : ["arm" + side, "leg" + side]).includes(node.seed.hostFace)) failures.push(`${node.name} is merged onto ${node.seed.hostFace}`);
      const under: AutoMovieConstructionNode[] = [];
      const collect = (inner: AutoMovieConstructionNode): void => {
        under.push(inner);
        if (inner.type === "join") {
          collect(inner.host);
          collect(inner.part);
        }
      };
      collect(node.host);
      if (under.some((inner: AutoMovieConstructionNode): boolean => inner.type !== "join" && inner.type !== "source") || under.some((inner: AutoMovieConstructionNode): boolean => inner.type === "source" && inner.name === "trunk")) failures.push(`${node.name}'s host holds more than its limb and that limb's digits`);
    }

  // 5. Ports on the trunk.
  const trunk = declared.sources.get("trunk");
  for (const node of nodes)
    if (node.type === "port") {
      const station: number = node.loop.centre[0] * 1000;
      if (trunk === undefined || node.hostFace !== "trunk" || !(station > trunk.stations[0]! && station < trunk.stations.at(-1)!) || !(node.loop.semi[1] > 0 && node.loop.semi[1] < Math.PI)) failures.push(`${node.name} does not stand on the trunk: station ${station} mm, phase semi-axis ${node.loop.semi[1]}`);
    }

  // 6. Rings round a turn.
  for (const name of ["arm", "leg"] as const) {
    const part: IAutoMovieViewPart | undefined = declared.sources.get(name);
    const chain = part === undefined ? null : AutoMovieViewLoft.create({ ...part, reliefs: undefined }).chain;
    if (part === undefined || chain === null) {
      failures.push(`the ${name} does not loft`);
      continue;
    }
    const end: number = AutoMovieHumanF1.BODY[name].tips?.[1]?.from ?? Infinity;
    const stations: number[] = part.stations.filter((s: number): boolean => s >= AutoMovieHumanF1.BODY[name].knots[0]! && s <= end);
    let worst: [number, number] = [0, 0];
    for (let i: number = 1; i < stations.length; ++i) {
      const [a, b]: AutoMovieLoftFrame.IFrame[] = [part.axis.at(stations[i - 1]!), part.axis.at(stations[i]!)];
      for (let j: number = 0; j < 96; ++j) {
        const p: number[] = AutoMovieLoftChain.point(chain, stations[i - 1]!, (2 * Math.PI * j) / 96);
        const r: number[] = [0, 1, 2].map((k: number): number => p[k]! - a.origin[k]);
        const [x, y]: number[] = [a.u, a.v].map((e: [number, number, number]): number => r[0]! * e[0] + r[1]! * e[1] + r[2]! * e[2]);
        const moved: number = Math.hypot(...[0, 1, 2].map((k: number): number => b.origin[k] + x! * b.u[k] + y! * b.v[k] - p[k]!));
        if (moved > worst[0]) worst = [moved, stations[i - 1]!];
      }
    }
    if (worst[0] > 4 * 1.05) failures.push(`a ring point of the ${name} moves ${worst[0].toFixed(2)} mm by the course's sweep after station ${worst[1].toFixed(1)}, more than the 4 mm layers`);
  }

  if (failures.length > 0) throw new Error("human f1 construction:\n" + failures.join("\n"));
}
