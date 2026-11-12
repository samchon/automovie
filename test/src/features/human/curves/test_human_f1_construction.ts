import { AutoMovieHumanF1 } from "@automovie/human";
import type { AutoMovieConstructionNode } from "@automovie/interface";

/**
 * The declaration of f1's sewn body, against the anatomy it declares.
 *
 * Scenarios:
 * 1. One body: the tree is one split of the trunk into two legs and one of each hand's open end into its four fingers, five ports (an arm and an ear on each side, and the nose), twelve merges (the thumb and five toes on each side) and six cuts (a nostril and an ear's two hollows on each side), over thirty-four source leaves.
 * 2. Every leaf has its part: each source leaf's name is a key of the sources, and each part carries that name.
 * 3. Sides mirror: every operator on the +Z side has a twin whose part face is the same name with `.mirror`, and the two armscye loops and the two auricle loops have the same station and semi-axes and opposite phases; the armscye loops also run in opposite senses and carry the same 192 shares, near one and not all one, since each follows its arm's ring and the two rings are reflections.
 * 4. A hand's split takes its own side's arm's end and the four fingers from the little one, in that order. A digit is merged onto its own limb before that limb is attached: each merge's host face is an arm or a leg of the merge's own side, and no merge's host subtree holds the trunk. A nostril is cut from the whole head: its cut is seeded on the nose and its host subtree holds the trunk. An ear's upper hollow (the scapha) is cut from the ear alone, before the ear is attached: its cut is seeded on its own side's ear and its host is that ear's leaf. Its bowl (the concha) is cut after: seeded on its own side's ear, with the trunk under its host.
 * 5. A port stands on the trunk: each loop's centre station lies inside the trunk part's stations and its phase semi-axis is under pi.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanF1.construction`, `armscye` and `auricle` and walks the tree they return.
 * @evidence contracts/development/testing.md#independent-expectations The counts are the body's own: two legs, two arms, two ears, five fingers and five toes a side; mirror symmetry of the reference is a property of f1, not of this code.
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
  for (const [type, expected] of [["split", 3], ["port", 5], ["join", 18], ["source", 34]] as [string, number][]) if (count(type) !== expected) failures.push(`${count(type)} ${type} nodes, expected ${expected}`);

  // 2. Leaves and their parts.
  for (const node of nodes)
    if (node.type === "source") {
      const part = declared.sources.get(node.source);
      if (part === undefined || part.name !== node.name) failures.push(`source leaf ${node.name} has ${part === undefined ? "no part" : "the part " + part.name}`);
    }
  if (declared.sources.size !== 34) failures.push(`${declared.sources.size} source parts, expected 34`);
  const kinds = (kind: string): number => nodes.filter((node: AutoMovieConstructionNode): boolean => node.type === "join" && node.kind === kind).length;
  if (kinds("merge") !== 12 || kinds("diff") !== 6) failures.push(`${kinds("merge")} merges and ${kinds("diff")} cuts, expected 12 and 6`);

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

  // 4. Each hand's split, merges under limbs, cuts where they belong.
  for (const node of nodes)
    if (node.type === "split" && node.name !== "crotch") {
      const side: string = node.hostFace.endsWith(".mirror") ? ".mirror" : "";
      const fingers: string = node.children.map((child): string => child.partFace).join(",");
      if (node.hostFace !== "arm" + side || node.hostEnd !== "top" || fingers !== ["pinky", "ring", "middle", "index"].map((f: string): string => "finger." + f + side).join(",")) failures.push(` splits  into `);
    } else if (node.type === "join" && node.kind === "diff") {
      const side: string = node.seed.partFace.endsWith(".mirror") ? ".mirror" : "";
      const under: AutoMovieConstructionNode[] = [];
      const collect = (inner: AutoMovieConstructionNode): void => {
        under.push(inner);
        if (inner.type === "join" || inner.type === "port" || inner.type === "split") collect(inner.host);
      };
      collect(node.host);
      const attached: boolean = under.some((inner: AutoMovieConstructionNode): boolean => inner.type === "source" && inner.name === "trunk");
      if (node.name.startsWith("cut.scapha")) {
        if (node.seed.hostFace !== "ear" + side || node.host.type !== "source" || node.host.name !== "ear" + side) failures.push(`${node.name} is not cut from its own ear alone`);
      } else if (node.name.startsWith("cut.concha")) {
        if (node.seed.hostFace !== "ear" + side || !attached) failures.push(`${node.name} is not cut at its own ear after the ear is attached`);
      } else if (node.seed.hostFace !== "nose" || !attached) failures.push(`${node.name} is not cut from the head at the nose`);
    } else if (node.type === "join") {
      const side: string = node.seed.partFace.endsWith(".mirror") ? ".mirror" : "";
      if (!["arm" + side, "leg" + side].includes(node.seed.hostFace)) failures.push(`${node.name} is merged onto ${node.seed.hostFace}`);
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

  if (failures.length > 0) throw new Error("human f1 construction:\n" + failures.join("\n"));
}
