import { AutoMovieLoftChain, AutoMovieViewLoft } from "@automovie/engine";
import { AutoMovieHumanF1 } from "@automovie/human";
import type {
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionNode,
  IAutoMovieHumanF1,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * The topology of the sewn body's declaration, against the anatomy it declares: its operators and their counts, both sides' mirror
 * pairing, the order parts are attached in, and the rings' spacing round a turn. Nothing here matches a reference's shape: every
 * expected count is the body plan's (two legs, two arms with a hand each, two ears, two breasts, five digits a side), and the ring
 * spacing is read against the declaration's own layer.
 *
 * Scenarios:
 * 1. One body: five composed open ends, the nose port, two wrist continuations, twelve merges and four cuts over forty original sources. The arms, the thumbs and the breasts are shared-loop side joins (the breasts on their footprint by rule, joints-one-shot.md, "The breast's footprint by rule"); the ears' plates keep their traced merges, since no closed divider is witnessed there (row 6); there is no axilla cutter or local fill.
 * 2. Every leaf has its part: each source leaf's name is a key of the sources, and each part carries that name.
 * 3. Both sides use the authored contact: every paired operator has a twin, and each armscye, thumb web and breast has the same host-chart radius shares at the reflected phase and clock sense. Both seeds reflect with it.
 * 4. Each arm continues into its own side's hand at the wrist, the arm's top end onto the hand's bottom end. A hand's split takes its own side's hand's end and the four fingers from the little one, a foot's its leg's end and the five toes from the little one, in that order. A thumb is merged onto its own hand before that arm is attached: its host face is the hand of its own side and its host subtree holds no trunk. An ear's plate is merged onto the head alone: seeded on the trunk, with the trunk under its host. Its helix is merged onto its own side's plate right after that, since it runs down its crus into the head, and its antihelix right after the helix, since it ends inside the helix's tube. A nostril is cut from the whole head: its cut is seeded on the nose and its host subtree holds the trunk. An ear's bowl (the concha) is cut from the head after its plate is merged: seeded on the trunk, its own side's plate merge under its host. A breast is merged onto the trunk's skin: seeded on the trunk, with the trunk under its host.
 * 5. A port stands on the trunk: each loop's centre station lies inside the trunk part's stations and its phase semi-axis is under pi.
 * 6. Rings round a turn stand no farther apart on the skin than the layers: on the arm, the hand and the leg, between neighbouring stations before the closed end, no ring point moves more than the declaration's own layer (`AutoMovieHumanF1.LAYER_MM`, 5 % allowed for the part's own interpolation) by the course frame's sweep. Round the shoulder the deltoid's cap moved 7 to 10 mm between layers 4 mm apart and showed every ring as a stripe.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Walks the actual authored no-bed construction and reads the same topology and source types used by the production declaration.
 * @evidence contracts/development/testing.md#independent-expectations The counts are the body's own: two legs, two arms each continued by a hand, two ears with a plate, a helix, an antihelix and a bowl each, two armscye folds, two breasts, five fingers and five toes a side; mirror symmetry of the reference is a property of f1, not of this code.
 * @evidence contracts/development/testing.md#distinguishing-cases Splits, ports and merges are counted apart, both sides are compared, and the nesting of merges under limbs is told from merges over the whole body.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit that declares the tree and resolves its parts without realizing a surface, reached by `--include human_construction_topology`.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario with the anatomical fact it is checked against.
 */
export function test_human_construction_topology(): void {
  const failures: string[] = [];
  const figure = AutoMovieHumanF1.assemble();
  const declared: IAutoMovieHumanF1.IConstruction =
    AutoMovieHumanF1.constructionBareFrom(figure);
  const nodes: IAutoMovieConstructionNode[] = [];
  const walk = (node: IAutoMovieConstructionNode): void => {
    nodes.push(node);
    if (
      node.type === "join" ||
      node.type === "port" ||
      node.type === "continue"
    ) {
      walk(node.host);
      walk(node.part);
    } else if (node.type === "split") {
      walk(node.host);
      for (const child of node.children) walk(child.part);
    }
  };
  walk(declared.root);
  const count = (type: string): number =>
    nodes.filter(
      (node: IAutoMovieConstructionNode): boolean => node.type === type,
    ).length;

  // 1. The body's parts.
  for (const [type, expected] of [
    ["split", 5],
    ["port", 1],
    ["continue", 2],
    ["join", 16],
    ["source", 40],
  ] as [string, number][])
    if (count(type) !== expected)
      failures.push(`${count(type)} ${type} nodes, expected ${expected}`);

  // 2. Leaves and their parts.
  for (const node of nodes)
    if (node.type === "source") {
      const part = declared.sources.get(node.source);
      if (part === undefined || part.name !== node.name)
        failures.push(
          `source leaf ${node.name} has ${part === undefined ? "no part" : "the part " + part.name}`,
        );
    }
  if (declared.sources.size !== 40)
    failures.push(`${declared.sources.size} source parts, expected 40`);
  if (declared.fills.length !== 0 || nodes.some((node) => node.name === "cut.axilla" || node.name === "cut.axilla.mirror"))
    failures.push("the body still declares an axilla cutter or a local fill");
  const kinds = (kind: string): number =>
    nodes.filter(
      (node: IAutoMovieConstructionNode): boolean =>
        node.type === "join" && node.kind === kind,
    ).length;
  if (kinds("merge") !== 12 || kinds("diff") !== 4)
    failures.push(
      `${kinds("merge")} merges and ${kinds("diff")} cuts, expected 12 and 4`,
    );

  // 3. Both sides; the nose stands on the median plane and has no twin.
  const faces: string[] = nodes
    .flatMap((node: IAutoMovieConstructionNode): string[] =>
      node.type === "port" || node.type === "continue"
        ? [node.partFace]
        : node.type === "join"
          ? [node.seed.partFace]
          : node.type === "split"
            ? node.children.map((child): string => child.partFace)
            : [],
    )
    .filter((name: string): boolean => name !== "nose");
  for (const face of faces.filter(
    (name: string): boolean => !name.endsWith(".mirror"),
  ))
    if (!faces.includes(face + ".mirror")) failures.push(`${face} has no twin`);
  if (
    faces.filter((name: string): boolean => name.endsWith(".mirror")).length !==
    faces.length / 2
  )
    failures.push(`${faces.length} operator faces are not half twins`);
  const contact = (name: string): IAutoMovieConstructionJoin | undefined =>
    nodes.find((node): node is IAutoMovieConstructionJoin => node.type === "join" && node.name === name);
  for (const [name, host, part] of [
    ["armscye.arm", "trunk", "arm"],
    ["web.finger.thumb", "hand", "finger.thumb"],
    ["mammary.breast", "trunk", "breast"],
  ] as const) {
    const left = contact(name);
    const right = contact(name + ".mirror");
    if (
      left?.loop === undefined || right?.loop === undefined ||
      left.seed.type !== "point" || right.seed.type !== "point" ||
      left.seed.hostFace !== host || left.seed.partFace !== part ||
      right.seed.hostFace !== (host === "hand" ? "hand.mirror" : host) ||
      right.seed.partFace !== part + ".mirror" ||
      left.partWidth.type !== "fold" || left.hostWidth.type !== "fold" ||
      right.partWidth.type !== "fold" || right.hostWidth.type !== "fold" ||
      !("source" in left.loop) || !("source" in right.loop) ||
      left.loop.source !== left.name || right.loop.source !== right.name ||
      left.count !== right.count
    )
      failures.push(`${name}'s two fold joins do not declare a paired original source`);
  }

  // 4. Each hand's split, merges under limbs, cuts where they belong.
  for (const node of nodes)
    if (node.type === "split" && node.name === "crotch") {
      if (
        node.compose?.frame !== "host" ||
        node.hostFace !== "trunk" || node.hostEnd !== "bottom" ||
        node.children.length !== 2 ||
        node.children[0]?.partFace !== "leg" ||
        node.children[1]?.partFace !== "leg.mirror" ||
        node.children.some((child) => child.partEnd !== "bottom")
      )
        failures.push("the two thighs do not compose the trunk's open lower section");
    } else if (node.type === "split") {
      const side: string = node.hostFace.endsWith(".mirror") ? ".mirror" : "";
      const fingers: string = node.children
        .map((child): string => child.partFace)
        .join(",");
      const hand: boolean = node.hostFace.startsWith("hand");
      const expected: string = (
        hand
          ? ["pinky", "ring", "middle", "index"].map(
              (f: string): string => "finger." + f + side,
            )
          : ["little", "ring", "middle", "index", "big"].map(
              (f: string): string => "toe." + f + side,
            )
      ).join(",");
      if (
        node.compose?.frame !== "host" ||
        node.hostFace !== (hand ? "hand" : "leg") + side ||
        node.hostEnd !== "top" ||
        node.children.some((child) => child.partEnd !== "bottom") ||
        fingers !== expected
      )
        failures.push(
          `${node.name} splits ${node.hostFace} at its ${node.hostEnd} end into ${fingers}`,
        );
    } else if (node.type === "continue") {
      const side: string = node.hostFace.endsWith(".mirror") ? ".mirror" : "";
      if (
        node.hostFace !== "arm" + side ||
        node.hostEnd !== "top" ||
        node.partFace !== "hand" + side ||
        node.partEnd !== "bottom"
      )
        failures.push(
          `${node.name} continues ${node.hostFace} at its ${node.hostEnd} end into ${node.partFace} at its ${node.partEnd} end`,
        );
    } else if (node.type === "join" && node.kind === "diff") {
      const side: string = node.seed.partFace.endsWith(".mirror")
        ? ".mirror"
        : "";
      const under: IAutoMovieConstructionNode[] = [];
      const collect = (inner: IAutoMovieConstructionNode): void => {
        under.push(inner);
        if (
          inner.type === "join" ||
          inner.type === "port" ||
          inner.type === "split"
        )
          collect(inner.host);
      };
      collect(node.host);
      const attached: boolean = under.some(
        (inner: IAutoMovieConstructionNode): boolean =>
          inner.type === "source" && inner.name === "trunk",
      );
      if (node.name.startsWith("cut.concha")) {
        if (
          node.seed.hostFace !== "trunk" ||
          !under.some(
            (inner: IAutoMovieConstructionNode): boolean =>
              inner.name === "root.plate" + side,
          )
        )
          failures.push(
            `${node.name} is not cut from the head after its own ear's plate is merged`,
          );
      } else if (node.seed.hostFace !== "nose" || !attached)
        failures.push(`${node.name} is not cut from the head at the nose`);
    } else if (node.type === "join") {
      const side: string = node.seed.partFace.endsWith(".mirror")
        ? ".mirror"
        : "";
      const under: IAutoMovieConstructionNode[] = [];
      const collect = (inner: IAutoMovieConstructionNode): void => {
        under.push(inner);
        if (inner.type === "join") {
          collect(inner.host);
          collect(inner.part);
        }
      };
      if (node.name.startsWith("root.plate")) {
        // The ear's plate alone, onto the head.
        const hostUnder: IAutoMovieConstructionNode[] = [];
        const hosts = (inner: IAutoMovieConstructionNode): void => {
          hostUnder.push(inner);
          if (
            inner.type === "join" ||
            inner.type === "port" ||
            inner.type === "split"
          )
            hosts(inner.host);
        };
        hosts(node.host);
        if (
          node.seed.hostFace !== "trunk" ||
          !hostUnder.some(
            (inner: IAutoMovieConstructionNode): boolean =>
              inner.type === "source" && inner.name === "trunk",
          ) ||
          node.part.type !== "source" ||
          node.part.name !== "plate" + side
        )
          failures.push(
            `${node.name} is not its own side's plate merged onto the head`,
          );
        continue;
      }
      if (node.name.startsWith("armscye.")) {
        const hosts: IAutoMovieConstructionNode[] = [node.host];
        for (let i = 0; i < hosts.length; ++i) {
          const parent = hosts[i]!;
          if ("host" in parent) hosts.push(parent.host);
        }
        if (!hosts.some((parent) => parent.type === "source" && parent.name === "trunk"))
          failures.push(`${node.name} does not join the trunk`);
        continue;
      }
      if (node.name.startsWith("mammary.")) {
        // A breast is a side join on the trunk's skin (its footprint by rule): seeded on the trunk, with the trunk under its host.
        const hosts: IAutoMovieConstructionNode[] = [node.host];
        for (let i = 0; i < hosts.length; ++i) {
          const parent = hosts[i]!;
          if ("host" in parent) hosts.push(parent.host);
        }
        if (node.seed.hostFace !== "trunk" || !hosts.some((parent) => parent.type === "source" && parent.name === "trunk"))
          failures.push(`${node.name} is not merged onto the trunk's skin`);
        continue;
      }
      if (node.name.startsWith("ridge.")) {
        // The helix runs down its crus into the head and the antihelix ends inside the helix, so the helix is merged onto the plate right
        // after the plate is on the head, and the antihelix right after the helix.
        const before: string = node.name.startsWith("ridge.helix")
          ? "root.plate" + side
          : "ridge.helix" + side;
        if (
          node.seed.hostFace !== "plate" + side ||
          node.host.type !== "join" ||
          node.host.name !== before
        )
          failures.push(
            `${node.name} is not merged onto its own side's plate right after ${before}`,
          );
        continue;
      }
      if (node.name !== "web.finger.thumb" + side || node.seed.hostFace !== "hand" + side)
        failures.push(`${node.name} is merged onto ${node.seed.hostFace}`);
      collect(node.host);
      if (
        under.some(
          (inner: IAutoMovieConstructionNode): boolean =>
            inner.type !== "join" && inner.type !== "source",
        ) ||
        under.some(
          (inner: IAutoMovieConstructionNode): boolean =>
            inner.type === "source" && inner.name === "trunk",
        )
      )
        failures.push(
          `${node.name}'s host holds more than its own part and the parts merged on it`,
        );
    }

  // 5. Ports on the trunk.
  const trunk = declared.sources.get("trunk");
  for (const node of nodes)
    if (node.type === "port") {
      const station: number = node.loop.centre[0] * 1000;
      if (
        trunk === undefined ||
        node.hostFace !== "trunk" ||
        !(station > trunk.stations[0]! && station < trunk.stations.at(-1)!) ||
        !(node.loop.semi[1] > 0 && node.loop.semi[1] < Math.PI)
      )
        failures.push(
          `${node.name} does not stand on the trunk: station ${station} mm, phase semi-axis ${node.loop.semi[1]}`,
        );
    }

  // 6. Rings round a turn.
  const stock = AutoMovieHumanF1.originalSources(figure, new Set(["arm", "hand", "leg"]));
  for (const name of ["arm", "hand", "leg"] as const) {
    const part: IAutoMovieViewPart | undefined = stock.get(name);
    const lofted = part === undefined ? null : AutoMovieViewLoft.create({ ...part, reliefs: undefined });
    const chain = lofted?.chain ?? null;
    if (part === undefined || chain === null) {
      failures.push(`the ${name} does not loft: ${part === undefined ? "no source" : JSON.stringify(lofted?.diagnostics ?? []).slice(0, 1200)}`);
      continue;
    }
    const end: number = AutoMovieHumanF1.BODY[name].tips?.[1]?.from ?? Infinity;
    const stations: number[] = part.stations.filter(
      (s: number): boolean =>
        s >= AutoMovieHumanF1.BODY[name].knots[0]! && s <= end,
    );
    let worst: [number, number] = [0, 0];
    for (let i: number = 1; i < stations.length; ++i) {
      const [a, b]: IAutoMovieLoftSectionFrame[] = [
        part.axis.at(stations[i - 1]!),
        part.axis.at(stations[i]!),
      ];
      for (let j: number = 0; j < 96; ++j) {
        const p: number[] = AutoMovieLoftChain.point(
          chain,
          stations[i - 1]!,
          (2 * Math.PI * j) / 96,
        );
        const r: number[] = [0, 1, 2].map(
          (k: number): number => p[k]! - a.origin[k],
        );
        const [x, y]: number[] = [a.u, a.v].map(
          (e: [number, number, number]): number =>
            r[0]! * e[0] + r[1]! * e[1] + r[2]! * e[2],
        );
        const moved: number = Math.hypot(
          ...[0, 1, 2].map(
            (k: number): number =>
              b.origin[k] + x! * b.u[k] + y! * b.v[k] - p[k]!,
          ),
        );
        if (moved > worst[0]) worst = [moved, stations[i - 1]!];
      }
    }
    if (worst[0] > AutoMovieHumanF1.LAYER_MM * 1.05)
      failures.push(
        `a ring point of the ${name} moves ${worst[0].toFixed(2)} mm by the course's sweep after station ${worst[1].toFixed(1)}, more than the ${AutoMovieHumanF1.LAYER_MM} mm layers`,
      );
  }

  if (failures.length > 0)
    throw new Error("human construction topology:\n" + failures.join("\n"));
}
