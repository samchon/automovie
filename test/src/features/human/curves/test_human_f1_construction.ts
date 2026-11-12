import { AutoMovieLoftChain, type AutoMovieLoftFrame, AutoMovieViewLoft, type IAutoMovieViewPart } from "@automovie/engine";
import { AutoMovieHumanF1 } from "@automovie/human";
import type { AutoMovieConstructionNode } from "@automovie/interface";

/**
 * The declaration of f1's sewn body, against the anatomy it declares.
 *
 * Scenarios:
 * 1. One body: the tree is one split of the trunk into two legs and one of each hand's and each foot's open end into its four fingers or five toes, seven ports (an arm, an ear and a breast on each side, and the nose), four merges (a thumb and a helix on each side) and eight cuts (a nostril, an ear's trough, an ear's bowl and the gap under its lobule on each side), over forty source leaves.
 * 2. Every leaf has its part: each source leaf's name is a key of the sources, and each part carries that name.
 * 3. Sides mirror: every operator on the +Z side has a twin whose part face is the same name with `.mirror`, and the two armscye loops, the two auricle loops and the two breasts' loops have the same station and semi-axes and opposite phases, within 1e-12 for rounding; the armscye loops also run in opposite senses and carry the same 192 shares, near one and not all one, since each follows its arm's ring and the two rings are reflections.
 * 4. A hand's split takes its own side's arm's end and the four fingers from the little one, a foot's its leg's end and the five toes from the little one, in that order. A thumb is merged onto its own arm before that arm is attached, and a helix onto its own ear before that ear is attached: each merge's host face is the arm or, for a helix, the ear of the merge's own side, and no merge's host subtree holds the trunk. A nostril is cut from the whole head: its cut is seeded on the nose and its host subtree holds the trunk. An ear's bowl (the concha) is cut after the ear is attached: seeded on its own side's ear, with the trunk under its host. An ear's trough (the fossa) is cut from that ear alone: seeded on it, with no trunk under its host. The gap under a lobule is cut from the head after its ear is attached and before that ear's bowl: seeded on the trunk, its own side's ear port under its host, and its cut under that bowl's host.
 * 5. A port stands on the trunk: each loop's centre station lies inside the trunk part's stations and its phase semi-axis is under pi.
 * 6. Rings round a turn stand no farther apart on the skin than the layers: on the arm and the leg, between neighbouring stations before the closed end, no ring point moves more than the declared 4 mm (5 % allowed for the part's own interpolation) by the course frame's sweep. Round the shoulder the deltoid's cap moved 7 to 10 mm between layers 4 mm apart and showed every ring as a stripe.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanF1.construction`, `armscye`, `auricle` and `mammary` and walks the tree they return.
 * @evidence contracts/development/testing.md#independent-expectations The counts are the body's own: two legs, two arms, two ears with a helix, a trough, a bowl and a gap under the lobule each, two breasts, five fingers and five toes a side; mirror symmetry of the reference is a property of f1, not of this code.
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
  for (const [type, expected] of [["split", 5], ["port", 7], ["join", 12], ["source", 40]] as [string, number][]) if (count(type) !== expected) failures.push(`${count(type)} ${type} nodes, expected ${expected}`);

  // 2. Leaves and their parts.
  for (const node of nodes)
    if (node.type === "source") {
      const part = declared.sources.get(node.source);
      if (part === undefined || part.name !== node.name) failures.push(`source leaf ${node.name} has ${part === undefined ? "no part" : "the part " + part.name}`);
    }
  if (declared.sources.size !== 40) failures.push(`${declared.sources.size} source parts, expected 40`);
  const kinds = (kind: string): number => nodes.filter((node: AutoMovieConstructionNode): boolean => node.type === "join" && node.kind === kind).length;
  if (kinds("merge") !== 4 || kinds("diff") !== 8) failures.push(`${kinds("merge")} merges and ${kinds("diff")} cuts, expected 4 and 8`);

  // 3. Both sides; the nose stands on the median plane and has no twin.
  const faces: string[] = nodes.flatMap((node: AutoMovieConstructionNode): string[] => (node.type === "port" ? [node.partFace] : node.type === "join" ? [node.seed.partFace] : node.type === "split" ? node.children.map((child): string => child.partFace) : [])).filter((name: string): boolean => name !== "nose");
  for (const face of faces.filter((name: string): boolean => !name.endsWith(".mirror"))) if (!faces.includes(face + ".mirror")) failures.push(`${face} has no twin`);
  if (faces.filter((name: string): boolean => name.endsWith(".mirror")).length !== faces.length / 2) failures.push(`${faces.length} operator faces are not half twins`);
  for (const [name, loop] of [["armscye", AutoMovieHumanF1.armscye], ["auricle", AutoMovieHumanF1.auricle], ["mammary", AutoMovieHumanF1.mammary]] as const) {
    const left = loop(1);
    const right = loop(-1);
    // Each loop is read off its own side's family, the twin's through the mirrored family and its reversed rails, so the two agree to
    // rounding, not bit for bit: the arm's curved rail left their phase semi-axes 6e-17 rad apart.
    const apart: number = Math.max(Math.abs(left.centre[0] - right.centre[0]), Math.abs(left.centre[1] + right.centre[1]), Math.abs(left.semi[0] - right.semi[0]), Math.abs(left.semi[1] - right.semi[1]));
    if (!(apart <= 1e-12)) failures.push(`${name} loops are not mirror images (${apart} apart): ${JSON.stringify([left, right]).slice(0, 300)}`);
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
      const hand: boolean = node.hostFace.startsWith("arm");
      const expected: string = (hand ? ["pinky", "ring", "middle", "index"].map((f: string): string => "finger." + f + side) : ["little", "ring", "middle", "index", "big"].map((f: string): string => "toe." + f + side)).join(",");
      if (node.hostFace !== (hand ? "arm" : "leg") + side || node.hostEnd !== "top" || fingers !== expected) failures.push(`${node.name} splits ${node.hostFace} at its ${node.hostEnd} end into ${fingers}`);
    } else if (node.type === "join" && node.kind === "diff") {
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
      } else if (node.name.startsWith("cut.lobule")) {
        const bowl: AutoMovieConstructionNode | undefined = nodes.find((other: AutoMovieConstructionNode): boolean => other.name === "cut.concha" + side);
        if (node.seed.hostFace !== "trunk" || !under.some((inner: AutoMovieConstructionNode): boolean => inner.name === "auricle.ear" + side) || bowl === undefined || bowl.type !== "join" || bowl.host !== node) failures.push(`${node.name} is not cut from the head after its ear is attached and before that ear's bowl`);
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
