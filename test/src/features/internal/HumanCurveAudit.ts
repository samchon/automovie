import { HumanLoftSectionWinding } from "./HumanLoftSectionWinding";
import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftMesh } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanPoseChannels } from "../../../../packages/human/src/skeleton/AutoMovieHumanPoseChannels";

type V3 = [number, number, number];

/** Finds every place a generated body is mathematically unsound. */
export namespace HumanCurveAudit {
/** One group of points that break the same rule in the same place. */
export interface IHumanCurveFinding {
  /** Person or parameter set. */
  person: string;

  /** Chain or join. */
  region: string;

  /** Rule broken. */
  rule: string;

  /** Layers and direction on the body. */
  where: string;

  /** Worst value found there. */
  value: number;

  /** The rule's limit. */
  limit: number;

  /** Points in the group. */
  count: number;

  /** The worst point, mm, to look at in the viewer. */
  point: number[];
}

/**
 * Every place a body's curves are mathematically unsound.
 *
 * Each rule is a property of curves and surfaces, in units that do not depend
 * on a person: nothing names a coordinate. Findings are gathered rather than
 * thrown one at a time, so a run fixes them together by cause.
 *
 * - `finite`, `stations`, `winding`: values, station order, ring orientation.
 * - `crossing`: a ring runs over itself.
 * - `collapse`: an interior section has no area distinguishable from roundoff.
 * - `slope`: a control point's station slope, against what the ring's width can
 *   need.
 * - `slide`: rings slip along themselves between layers, which shears skin.
 * - `overshoot`: a span swings past both of its layers.
 * - `crease`: tangent breaks along a longitudinal curve (G1).
 * - `band`: curvature flips within less than a radius, the ripple that reads
 *   as a horizontal stripe under light.
 * - `ridge`: the whole ring bends the same way at one height.
 * - `ripple`: a section's curvature flips more often than its anatomy needs.
 * - `alias`: a face's section turns by most of a corner within one control.
 * - `ledge`: the skin beside the nose steps with height, a ridge off the lip.
 * - `base`: the nose's base turns at a shelf's edge instead of a radius.
 * - `jaw`: the lower face rolls into the neck with no border to turn under.
 * - `facet`: the jaw's border shades as facets, its skin turning by a large
 *   angle across one cell of the mesh.
 * - `pit`: a nostril's closure shades as streaks, its walls turning by a large
 *   angle across one cell of the mesh.
 * - `rib`: a foot's or toe's longitudinal curve turns sharply for its ring's
 *   size, the line a section prints across the skin.
 * - `ball`: a web runs a groove back into the padded ball of the foot.
 * - `dome`: a toe or digit closes by a dome that leaves its tube at an angle,
 *   the rim round a flat pad.
 * - `gap`, `seam`: a join is open (G0) or kinks across its seam (G1).
 * - `fold`: a limb's or the trunk's join turns within a few millimetres of its
 *   ring, though the tangent planes agree on the ring itself.
 * - `midline`, `mirror`: a limb crosses the plane of symmetry, or the sides
 *   differ under equal inputs.
 * - `rim-slide`, `ear-fold`, `ear-crossing`: an ear's rim leaves its phase, its
 *   cells reverse along the chain, or a section runs over itself round more
 *   than a pinch's corner.
 *
 * @param person Name in the findings.
 * @param body The generated body.
 * @param generated Chains audited.
 * @param mandible Half the person's mandibular width input, in the body's
 *   millimetres: the jaw is read at shares of its own width. Without it the
 *   jaw is read at shares of the lower head's.
 */
export function auditHumanCurves(
  person: string,
  body: IAutoMovieHumanBodyCalibration,
  generated: RegExp,
  mandible?: number,
): IHumanCurveFinding[] {
  const groups: Map<string, IHumanCurveFinding> = new Map();
  const report = (
    region: string,
    rule: string,
    where: string,
    value: number,
    limit: number,
    point: readonly number[] = [],
  ): void => {
    const key: string = [region, rule, where].join("|");
    const found: IHumanCurveFinding | undefined = groups.get(key);
    if (found === undefined)
      groups.set(key, {
        person,
        region,
        rule,
        where,
        value,
        limit,
        count: 1,
        point: [...point],
      });
    else {
      found.count++;
      if (value > found.value) {
        found.value = value;
        found.point = [...point];
      }
    }
  };
  const chains: IAutoMovieHumanLoftChain[] = body.chains.filter(
    (c: IAutoMovieHumanLoftChain): boolean => generated.test(c.name),
  );
  for (const chain of chains) {
    auditChain(chain, report);
    if (/^ear\./.test(chain.name)) auditEar(chain, report);
  }
  auditJoins(body, generated, report);
  auditTips(body, chains, report);
  auditBall(body, generated, report);
  auditSides(body, report);
  auditHip(body, generated, report);
  auditLegRoot(body, generated, report);
  if (generated.test("head.middle")) {
    auditNoseFlank(body, report);
    auditNoseBase(body, report);
    auditJaw(body, report, mandible);
    auditHeadMesh(body, report, mandible);
  }
  return [...groups.values()];
}

/**
 * The thigh above its tape, against the tape.
 *
 * The crotch ring is the skin's way into the trunk, not a section of the thigh.
 * A law that lets the ring set the thigh's top keeps its tape exact at the tape's
 * own station and fills the fold under the buttock above it.
 *
 * @param person Name in the findings.
 * @param body The generated body.
 * @param height Stature input, to read the tape in the body's millimetres.
 * @param tape Thigh tape input.
 */
export function auditHumanThigh(
  person: string,
  body: IAutoMovieHumanBodyCalibration,
  height: number,
  tape: number,
): IHumanCurveFinding[] {
  return ["leg.left", "leg.right"].flatMap(
    (name: string): IHumanCurveFinding[] => {
      const leg: IAutoMovieHumanLoftChain = body.chains.find(
        (c: IAutoMovieHumanLoftChain): boolean => c.name === name,
      )!;
      const station: number =
        leg.layers[leg.layers.length - 1]!.y - THIGH_TOP * body.stature;
      const ring: V3[] = AutoMovieHumanLoftChain.ring(
        leg,
        station,
        uniform(PHASES),
      );
      const value: number =
        perimeter(ring) / ((tape * body.stature) / height);
      return value > THIGH_GIRTH
        ? [
            {
              person,
              region: name,
              rule: "thigh",
              where: `at ${Math.round(station)}`,
              value,
              limit: THIGH_GIRTH,
              count: 1,
              point: centre(ring),
            },
          ]
        : [];
    },
  );
}

/**
 * Where a standing body's parts are, read against anatomy and the stature
 * input, never against an earlier figure.
 *
 * - `part`: a side lacks an arm, a palm, a thumb, four fingers, a leg, a foot,
 *   five toes or an ear, or the trunk, neck or head is gone.
 * - `stature`: the crown does not stand at the stature input, or the sole is
 *   off the floor, by more than a day changes a person's stature.
 * - `order`: the lowest skin is not a foot's, or the highest is not the head's.
 * - `inside`: an arm's axis runs inside the trunk's section at its height.
 *
 * @param person Name in the findings.
 * @param body The generated body.
 * @param height Stature input, to read the body in its own millimetres.
 */
export function auditHumanPlacement(
  person: string,
  body: IAutoMovieHumanBodyCalibration,
  height: number,
): IHumanCurveFinding[] {
  const out: IHumanCurveFinding[] = [];
  const add = (
    region: string,
    rule: string,
    where: string,
    value: number,
    limit: number,
    point: readonly number[] = [],
  ): void => {
    out.push({ person, region, rule, where, value, limit, count: 1, point: [...point] });
  };
  const k: number = height / body.stature;

  // A chain counts as a part only while some ring of it encloses skin.
  const present: IAutoMovieHumanLoftChain[] = body.chains.filter(
    (c: IAutoMovieHumanLoftChain): boolean =>
      c.layers.some(
        (l: IAutoMovieHumanLoftChain.ILayer): boolean =>
          perimeter(AutoMovieHumanLoftChain.ring(c, l.y, uniform(PHASES))) > 0,
      ),
  );
  for (const [label, pattern, least, most] of ANATOMY)
    for (const side of pattern.source.includes("<side>") ? ["left", "right"] : [""]) {
      const own: RegExp = new RegExp(pattern.source.replace("<side>", side));
      const count: number = present.filter((c: IAutoMovieHumanLoftChain): boolean =>
        own.test(c.name),
      ).length;
      if (count < least || count > most)
        add(
          `${side === "" ? "" : `${side} `}${label}`,
          "part",
          `${count} found`,
          count,
          count < least ? least : most,
        );
    }
  if (present.length === 0) return out;

  // The crown and the sole, with the chain that holds each.
  let top: { y: number; chain: string; at: V3 } = { y: -Infinity, chain: "", at: [0, 0, 0] };
  let bottom: { y: number; chain: string; at: V3 } = { y: Infinity, chain: "", at: [0, 0, 0] };
  const visit = (chain: string, p: V3): void => {
    if (p[1] > top.y) top = { y: p[1], chain, at: p };
    if (p[1] < bottom.y) bottom = { y: p[1], chain, at: p };
  };
  for (const chain of present) {
    for (const l of chain.layers)
      for (const p of AutoMovieHumanLoftChain.ring(chain, l.y, uniform(PHASES)))
        visit(chain.name, p);
    if (chain.pole !== undefined) visit(chain.name, chain.pole.point);
  }
  for (const pole of body.poles) visit(pole.chain, pole.point);
  const day: number = STATURE_DAY * height;
  const crown: number = Math.abs(top.y * k - height);
  const sole: number = Math.abs(bottom.y * k);
  if (crown > day) add(top.chain, "stature", "crown against the stature input", crown, day, top.at);
  if (sole > day) add(bottom.chain, "stature", "sole against the floor", sole, day, bottom.at);
  if (!/^head\./.test(top.chain)) add(top.chain, "order", "highest skin", 1, 0, top.at);
  if (!/^(foot|forefoot|toe)\./.test(bottom.chain))
    add(bottom.chain, "order", "lowest skin", 1, 0, bottom.at);

  // Below the armpit an arm hangs beside the trunk. The trunk's sections are
  // horizontal, so its station at a height is the section there.
  const trunk: IAutoMovieHumanLoftChain | undefined = present.find(
    (c: IAutoMovieHumanLoftChain): boolean => c.name === "trunk",
  );
  if (trunk === undefined) return out;
  const low: number = trunk.layers[0]!.y;
  const high: number = trunk.layers[trunk.layers.length - 1]!.y;
  for (const arm of present.filter((c: IAutoMovieHumanLoftChain): boolean =>
    /^arm\.(left|right)$/.test(c.name),
  )) {
    const within: V3[] = [];
    for (const l of arm.layers) {
      const c: V3 = centre(AutoMovieHumanLoftChain.ring(arm, l.y, uniform(PHASES)));
      if (c[1] < low || c[1] > high) continue;
      const section: [number, number][] = AutoMovieHumanLoftChain.ring(
        trunk,
        c[1],
        uniform(PHASES),
      ).map((p: V3): [number, number] => [p[0], p[2]]);
      if (encloses(section, [c[0], c[2]])) within.push(c);
    }
    if (within.length !== 0)
      out.push({
        person,
        region: arm.name,
        rule: "inside",
        where: "rings in the trunk",
        value: within.length,
        limit: 0,
        count: within.length,
        point: [...within[0]!],
      });
  }
  return out;
}

/**
 * A hand's skin as it is meshed, which a chain's curves cannot show.
 *
 * - `tear`: two neighbouring triangles of the hand fold sharply against each
 *   other, the jagged skin at a digit's root. Only the arm's own chains are
 *   lofted, so this costs a hand and not a body.
 * - `join`: a child's own end ring stands off the parent's ring it inherits, so
 *   the zipper between them spans the difference. The plain `gap` rule allows a
 *   width at which a finger's root is already visibly torn.
 * - `crumple`: sharp edges crowd one small patch of skin. A crease is a few in a
 *   line; no single fold in a crumple need be sharp enough for `tear`.
 *
 * @param person Name in the findings.
 * @param body The generated body.
 */
export function auditHumanHand(
  person: string,
  body: IAutoMovieHumanBodyCalibration,
): IHumanCurveFinding[] {
  return (["left", "right"] as const).flatMap(
    (hand: "left" | "right"): IHumanCurveFinding[] => {
      const owned: RegExp = new RegExp(`^(arm|hand|finger|thumb)\\.${hand}`);
      return [
        ...auditHandMesh(person, body, owned),
        ...auditHandJoins(person, body, owned),
      ];
    },
  );
}

/**
 * A foot's skin as it is meshed: `crumple`, sharp edges crowding one small
 * patch of skin, which shows at the webs between the toes and no curve rule
 * reads. Only the foot's own chains are lofted, and the ankle's closing fan,
 * which has no leg here, is not read.
 *
 * @param person Name in the findings.
 * @param body The generated body.
 */
export function auditHumanFoot(
  person: string,
  body: IAutoMovieHumanBodyCalibration,
): IHumanCurveFinding[] {
  return (["left", "right"] as const).flatMap(
    (side: "left" | "right"): IHumanCurveFinding[] => {
      const root: string = `foot.${side}`;
      const layers: number =
        body.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === root)?.layers
          .length ?? 0;
      return auditHandMesh(
        person,
        body,
        new RegExp(`^(foot|forefoot|toe)\\.${side}`),
        (name: string): boolean => name !== `${root}/${layers - 2}`,
      ).filter((f: IHumanCurveFinding): boolean => f.rule === "crumple");
    },
  );
}

}

/**
 * The sharpest fold between neighbouring triangles, and the crowding of sharp
 * ones, per chain of a hand or a foot.
 *
 * @param keep Whether a triangle group counts; by default the arm far from
 *   the hand does not, since it is not the hand and its top has no parent here.
 */
function auditHandMesh(
  person: string,
  body: IAutoMovieHumanBodyCalibration,
  owned: RegExp,
  keep: (group: string) => boolean = (name: string): boolean => {
    const [chain, interval] = name.split("/");
    return !/^arm\./.test(chain!) || Number(interval) < HAND_ARM_LAYERS;
  },
): HumanCurveAudit.IHumanCurveFinding[] {
  const mesh: AutoMovieHumanLoftMesh.IContext = AutoMovieHumanBodySurface.generate({
    ...body,
    chains: body.chains.filter(
      (c: IAutoMovieHumanLoftChain): boolean => owned.test(c.name),
    ),
    events: body.events.filter(
      (e: IAutoMovieHumanBodyCalibration.IEvent): boolean => owned.test(e.parent),
    ),
    poles: body.poles.filter(
      (p: IAutoMovieHumanBodyCalibration.IPole): boolean => owned.test(p.chain),
    ),
    apertures: [],
    appendages: undefined,
  }).mesh;
  const count: number = mesh.indices.length / 3;
  const owner: string[] = new Array<string>(count).fill("");
  mesh.groups.forEach(
    (g: { name: string; start: number }, k: number): void => {
      const end: number = mesh.groups[k + 1]?.start ?? mesh.indices.length;
      for (let t: number = g.start / 3; t < end / 3; t++) owner[t] = g.name;
    },
  );
  const point = (v: number): V3 => [
    mesh.positions[3 * v]!,
    mesh.positions[3 * v + 1]!,
    mesh.positions[3 * v + 2]!,
  ];
  const normal = (t: number): V3 => {
    const a: V3 = point(mesh.indices[3 * t]!);
    return unit(
      cross(
        sub(point(mesh.indices[3 * t + 1]!), a),
        sub(point(mesh.indices[3 * t + 2]!), a),
      ),
    );
  };

  const edges: Map<number, number[]> = new Map();
  const size: number = mesh.positions.length / 3;
  for (let t: number = 0; t < count; t++) {
    if (!keep(owner[t]!)) continue;
    for (let e: number = 0; e < 3; e++) {
      const a: number = mesh.indices[3 * t + e]!;
      const b: number = mesh.indices[3 * t + ((e + 1) % 3)]!;
      const key: number = Math.min(a, b) * size + Math.max(a, b);
      const list: number[] | undefined = edges.get(key);
      if (list === undefined) edges.set(key, [t]);
      else list.push(t);
    }
  }
  const worst: Map<string, HumanCurveAudit.IHumanCurveFinding> = new Map();
  const sharp: { region: string; at: V3 }[] = [];
  for (const [key, list] of edges) {
    if (list.length !== 2) continue;
    const angle: number =
      (Math.acos(clamp(dot(normal(list[0]!), normal(list[1]!)))) * 180) / Math.PI;
    if (angle > HAND_SHARP)
      sharp.push({
        region: owner[list[0]!]!.split("/")[0]!,
        at: point(Math.floor(key / size)),
      });
    if (angle <= HAND_TEAR) continue;
    const region: string = owner[list[0]!]!.split("/")[0]!;
    const found: HumanCurveAudit.IHumanCurveFinding | undefined = worst.get(region);
    if (found !== undefined) found.count++;
    if (found !== undefined && found.value >= angle) continue;
    worst.set(region, {
      person,
      region,
      rule: "tear",
      where: "mesh",
      value: angle,
      limit: HAND_TEAR,
      count: found?.count ?? 1,
      point: point(Math.floor(key / size)),
    });
  }
  const crumples: Map<string, HumanCurveAudit.IHumanCurveFinding> = new Map();
  // Counted about each sharp edge, so a patch reads the same wherever a hand
  // stands, as a fixed grid would not.
  for (const edge of sharp) {
    let near: number = 0;
    for (const other of sharp)
      if (distance(edge.at, other.at) < HAND_PATCH) near++;
    if (near <= HAND_CRUMPLE) continue;
    const found: HumanCurveAudit.IHumanCurveFinding | undefined = crumples.get(edge.region);
    if (found !== undefined && found.value >= near) continue;
    crumples.set(edge.region, {
      person,
      region: edge.region,
      rule: "crumple",
      where: "mesh",
      value: near,
      limit: HAND_CRUMPLE,
      count: near,
      point: edge.at,
    });
  }
  return [...worst.values(), ...crumples.values()];
}

/** The most a child's own end ring stands off the arc it inherits, per join of a hand. */
function auditHandJoins(
  person: string,
  body: IAutoMovieHumanBodyCalibration,
  owned: RegExp,
): HumanCurveAudit.IHumanCurveFinding[] {
  const find = (name: string): IAutoMovieHumanLoftChain =>
    body.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === name)!;
  // A web's children start apart from the parent's ring by design; the mesh
  // rules read the web between them.
  return body.events
    .filter((e: IAutoMovieHumanBodyCalibration.IEvent): boolean => owned.test(e.parent) && e.web !== true)
    .flatMap((event: IAutoMovieHumanBodyCalibration.IEvent): HumanCurveAudit.IHumanCurveFinding[] => {
      const parent: IAutoMovieHumanLoftChain = find(event.parent);
      const end: number = parent.layers[0]!.y;
      return event.splits.flatMap((split: IAutoMovieHumanBodyCalibration.ISplit): HumanCurveAudit.IHumanCurveFinding[] => {
        const child: IAutoMovieHumanLoftChain = find(split.child);
        const own: V3[] = AutoMovieHumanLoftChain.ring(
          child,
          child.layers[child.layers.length - 1]!.y,
          uniform(720),
        );
        let most: number = 0;
        let at: V3 = [0, 0, 0];
        for (const [from, to] of split.arcs) {
          const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
          for (const p of AutoMovieHumanLoftChain.ring(
            parent,
            end,
            Array.from(
              { length: 48 },
              (_: unknown, i: number): number => from + (span * (i + 0.5)) / 48,
            ),
          )) {
            let best: number = Infinity;
            for (const q of own) best = Math.min(best, distance(p, q));
            if (best > most) {
              most = best;
              at = p;
            }
          }
        }
        return most > HAND_JOIN
          ? [
              {
                person,
                region: `${event.parent} > ${child.name}`,
                rule: "join",
                where: "own ring",
                value: most,
                limit: HAND_JOIN,
                count: 1,
                point: at,
              },
            ]
          : [];
      });
    });
}

/** A chain's own values, rings and surface. */
function auditChain(
  chain: IAutoMovieHumanLoftChain,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  const name: string = chain.name;
  const finite: boolean = chain.layers.every(
    (l: IAutoMovieHumanLoftChain.ILayer): boolean =>
      [...l.coefficients, ...l.slopes, ...(l.lift ?? [])].every(Number.isFinite),
  );
  if (!finite) {
    report(name, "finite", "controls", 1, 0);
    return;
  }
  chain.layers.forEach(
    (l: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
      if (k > 0 && !(l.y > chain.layers[k - 1]!.y))
        report(name, "stations", `layer ${k}`, chain.layers[k - 1]!.y - l.y, 0);
    },
  );
  const digit: boolean = /^(toe|finger|thumb)\./.test(name);
  const pinched: boolean = /^(hand|foot|forefoot|ear)\./.test(name);
  const face: boolean = /^head\./.test(name);
  const rings: V3[][] = chain.layers.map(
    (l: IAutoMovieHumanLoftChain.ILayer): V3[] =>
      AutoMovieHumanLoftChain.ring(chain, l.y, uniform(PHASES)),
  );
  const perimeters: number[] = rings.map(perimeter);

  // Rings: orientation, crossings, section fairness.
  rings.forEach((ring: V3[], k: number): void => {
    const where = (j: number): string => `layer ${band(k)} ${side(ring, j)}`;
    const small: boolean = perimeters[k]! < SMALL;

    // Neighbouring rings turn the same way, whatever way the section planes
    // fan round the chain.
    if (
      !small &&
      k > 0 &&
      perimeters[k - 1]! >= SMALL &&
      dot(areaNormal(ring), areaNormal(rings[k - 1]!)) < 0
    )
      report(name, "winding", `layer ${k}`, 1, 0);
    if (!small && !pinched) {
      const n: number = crossings(ring);
      if (n > 0) report(name, "crossing", `layer ${k}`, n, 0);
    }
    if (small || pinched || digit) return;
    const radius: number = perimeters[k]! / (2 * Math.PI);
    const flips: number[] = flipsOf(signedCurvature(ring), radius, 0.5);
    const ripples: number = face ? FACE_RIPPLES : RIPPLES;
    if (flips.length > ripples)
      report(name, "ripple", where(flips[0]!), flips.length, ripples);
  });

  // A feature of the face narrower than its controls: the section turns by
  // most of a corner in one control, so the mesh's cells alias it into teeth.
  if (/^head\.(lower|middle|upper)$/.test(name))
    chain.layers.forEach(
      (l: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
        const ring: V3[] = AutoMovieHumanLoftChain.ring(chain, l.y, uniform(chain.order));
        const c: V3 = centre(ring);
        ring.forEach((p: V3, j: number): void => {
          if (Math.abs(Math.atan2(p[2] - c[2], p[0] - c[0])) > ALIAS_FRONT) return;
          const a: V3 = sub(p, ring[(j + ring.length - 1) % ring.length]!);
          const b: V3 = sub(ring[(j + 1) % ring.length]!, p);
          if (Math.hypot(...a) < 1e-6 || Math.hypot(...b) < 1e-6) return;
          const turn: number = (Math.acos(clamp(dot(unit(a), unit(b)))) * 180) / Math.PI;
          if (turn > ALIAS)
            report(name, "alias", `layer ${band(k)} ${side(ring, j)}`, turn, ALIAS, p);
        });
      },
    );

  // Control slopes against what the ring's width can need.
  chain.layers.forEach(
    (l: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
      const limit: number =
        (face ? FACE_SLOPE : SLOPE) *
        Math.max(1, perimeters[k]! / SLOPE_GIRTH);
      const worst: number = Math.max(...l.slopes.map(Math.abs));
      const cap: boolean = perimeters[k]! < CAP;
      if (worst > limit && !digit && !cap && !pinched)
        report(name, "slope", `layer ${band(k)}`, worst, limit);
    },
  );

  // The surface between layers.
  const stations: number[] = chain.layers.flatMap(
    (l: IAutoMovieHumanLoftChain.ILayer, k: number): number[] =>
      k === 0
        ? [l.y]
        : Array.from(
            { length: STEPS },
            (_: unknown, i: number): number =>
              chain.layers[k - 1]!.y +
              ((l.y - chain.layers[k - 1]!.y) * (i + 1)) / STEPS,
          ),
  );
  const grid: V3[][] = stations.map((s: number): V3[] =>
    AutoMovieHumanLoftChain.ring(chain, s, uniform(PHASES)),
  );
  // End sections cannot certify orientation between them.
  const orientations: ReturnType<typeof HumanLoftSectionWinding> = HumanLoftSectionWinding(chain, stations, grid);
  grid.forEach((ring: V3[], i: number): void => {
    if (!orientations[i]!.finite) {
      const phase: number = ring.findIndex((point: V3): boolean => !point.every(Number.isFinite));
      report(name, "finite", `${i % STEPS === 0 ? "principal" : "interior"} at ${stations[i]}; phase=${phase < 0 ? "area" : (2 * Math.PI * phase / PHASES).toString()}`, 1, 0, ring[Math.max(0, phase)]!);
      return;
    }
    if (i % STEPS === 0) return;
    if (!orientations[i]!.resolved)
      report(name, "collapse", `interior at ${stations[i]}; area=${orientations[i]!.area} mm^2, roundoff=${orientations[i]!.areaError} mm^2`, 1, 0, ring[0]!);
    const previous: V3[] = rings[Math.floor(i / STEPS)]!;
    if (perimeter(ring) >= SMALL && perimeter(previous) >= SMALL && orientations[i]!.area * orientations[Math.floor(i / STEPS) * STEPS]!.area < 0)
      report(name, "winding", `interior at ${stations[i]}`, 1, 0, ring[0]!);
    if (perimeter(ring) >= SMALL && !pinched) {
      const crossingsFound: number = crossings(ring);
      if (crossingsFound > 0)
        report(name, "crossing", `interior at ${stations[i]}`, crossingsFound, 0, ring[0]!);
    }
  });
  const layerOf = (i: number): number => Math.ceil(i / STEPS);
  const count: number = grid.length;
  const centres: V3[] = grid.map(centre);
  const radii: number[] = grid.map(
    (r: V3[]): number => perimeter(r) / (2 * Math.PI),
  );

  // Slide and overshoot, per interval.
  for (let k: number = 1; k < rings.length; k++) {
    const gap: number = distance(centre(rings[k]!), centre(rings[k - 1]!));
    const a: V3[] = rings[k - 1]!;
    const b: V3[] = rings[k]!;
    const interior: V3[][] = grid.slice((k - 1) * STEPS + 1, k * STEPS);
    for (let j: number = 0; j < PHASES; j++) {
      const tangent: V3 = unit(sub(a[(j + 1) % PHASES]!, a[(j + PHASES - 1) % PHASES]!));
      const move: V3 = sub(b[j]!, a[j]!);
      const along: number = Math.abs(dot(move, tangent));
      if (gap > 0.5 && along / gap > SLIDE && !digit)
        report(name, "slide", `layer ${band(k)} ${side(a, j)}`, along / gap, SLIDE);
      const chord: number = distance(a[j]!, b[j]!);
      const swing: number = Math.max(
        ...interior.flatMap((ring: V3[]): number[] => [distance(ring[j]!, a[j]!), distance(ring[j]!, b[j]!)]),
      );
      if (swing > OVERSHOOT * Math.max(chord, 1))
        report(name, "overshoot", `layer ${band(k)} ${side(a, j)}`, swing / Math.max(chord, 1), OVERSHOOT);
    }
  }

  // Longitudinal curves: creases and bands.
  const first: number = digit ? 2 * STEPS : 1;
  for (let j: number = 0; j < PHASES; j += 2) {
    const line: V3[] = grid.map((r: V3[]): V3 => r[j]!);
    const signed: number[] = new Array<number>(count).fill(0);
    for (let i: number = first; i + 1 < count; i++) {
      const a: V3 = sub(line[i]!, line[i - 1]!);
      const b: V3 = sub(line[i + 1]!, line[i]!);
      const la: number = Math.hypot(...a);
      const lb: number = Math.hypot(...b);
      if (la < SEGMENT || lb < SEGMENT) continue;
      const turn: number = Math.acos(clamp(dot(a, b) / (la * lb)));
      const outward: V3 = unit(sub(line[i]!, centres[i]!));
      const bend: V3 = sub(unit(b), unit(a));
      signed[i] = (Math.sign(dot(bend, outward)) * turn) / ((la + lb) / 2);
      const crease: number = face ? FACE_CREASE : CREASE;
      if ((turn * 180) / Math.PI > crease)
        report(name, "crease", `layer ${band(layerOf(i))} ${side(grid[i]!, j)}`, (turn * 180) / Math.PI, crease, line[i]!);
    }
    if (digit) continue;

    // A band is curvature that flips back within a radius.
    let last: number = -1;
    for (let i: number = 1; i + 1 < count; i++) {
      const radius: number = radii[i]!;
      if (radius < 1) continue;
      const value: number = signed[i]! * radius;
      if (Math.abs(value) < BAND_FLOOR) continue;
      if (last >= 0 && Math.sign(signed[last]!) !== Math.sign(value)) {
        const apart: number = distance(line[i]!, line[last]!);
        const size: number = Math.min(Math.abs(value), Math.abs(signed[last]! * radius));
        if (apart < radius && size > BAND)
          report(name, "band", `layer ${band(layerOf(i))} ${side(grid[i]!, j)}`, size, BAND, line[i]!);
      }
      last = i;
    }
  }

  auditRidges(chain, report);
  auditRibs(chain, report);
}

/**
 * An ear's sections are thin plates with a rim, so the general rules are not
 * read on them: their layers lie closer than `slide` looks and their corners
 * are by design. These three read what goes wrong on a plate instead. A rim
 * that moves round its ring between layers draws the sawtooth along the helix;
 * cells that reverse along the chain are folds in the skin; a crossing is
 * measured by the arc it encloses, since a pinch's corner may overshoot by a
 * fraction of the rim's own thickness.
 */
function auditEar(
  chain: IAutoMovieHumanLoftChain,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  const name: string = chain.name;
  const fine: number[] = uniform(EAR_PHASES);
  const stations: number[] = chain.layers.flatMap(
    (l: IAutoMovieHumanLoftChain.ILayer, k: number): number[] =>
      k === 0 ? [l.y] : [(chain.layers[k - 1]!.y + l.y) / 2, l.y],
  );
  const rings: V3[][] = stations.map((s: number): V3[] =>
    AutoMovieHumanLoftChain.ring(chain, s, fine),
  );
  const perimeters: number[] = rings.map(perimeter);

  // The rim, the point standing farthest off the head, keeps its phase.
  const rims: number[] = rings.map((ring: V3[]): number => {
    let at: number = 0;
    ring.forEach((p: V3, j: number): void => {
      if (Math.abs(p[2]) > Math.abs(ring[at]![2])) at = j;
    });
    return at;
  });
  for (let i: number = 1; i < rings.length; i++) {
    if (perimeters[i]! < SMALL || perimeters[i - 1]! < SMALL) continue;
    const gap: number = stations[i]! - stations[i - 1]!;
    const steps: number = Math.abs(rims[i]! - rims[i - 1]!);
    const turn: number = Math.min(steps, EAR_PHASES - steps) / EAR_PHASES;
    const value: number = (turn * perimeters[i]!) / gap;
    if (value > SLIDE)
      report(name, "rim-slide", `at ${Math.round(stations[i]!)}`, value, SLIDE, rings[i]![rims[i]!]!);
  }

  // Cells whose normals reverse from one layer to the next.
  const coarse: number = Math.floor(EAR_PHASES / PHASES);
  let previous: V3[] | null = null;
  for (let i: number = 0; i + 1 < rings.length; i++) {
    const normals: V3[] = [];
    for (let j: number = 0; j < PHASES; j++) {
      const a: V3 = rings[i]![j * coarse]!;
      const b: V3 = rings[i]![((j + 1) % PHASES) * coarse]!;
      const c: V3 = rings[i + 1]![j * coarse]!;
      const n: V3 = cross(sub(b, a), sub(c, a));
      normals.push(dot(n, n) > 1e-12 ? unit(n) : [0, 0, 0]);
      if (previous !== null && dot(previous[j]!, normals[j]!) < EAR_FOLD)
        report(name, "ear-fold", `at ${Math.round(stations[i]!)}`, 1, 0, a);
    }
    previous = normals;
  }

  // A crossing, by the shorter arc it encloses.
  rings.forEach((ring: V3[], i: number): void => {
    const sampled: V3[] = Array.from(
      { length: PHASES },
      (_: unknown, j: number): V3 => ring[j * coarse]!,
    );
    const arc: number = crossingArc(sampled);
    if (arc > EAR_CROSSING)
      report(name, "ear-crossing", `at ${Math.round(stations[i]!)}`, arc, EAR_CROSSING, sampled[0]!);
  });
}

/** Shorter arc enclosed by a ring's largest self-crossing, 0 without one, mm. */
function crossingArc(ring: V3[]): number {
  const n: V3 = areaNormal(ring);
  const seed: V3 = Math.abs(n[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
  const u: V3 = unit(cross(n, seed));
  const v: V3 = cross(n, u);
  const flat: [number, number][] = ring.map((p: V3): [number, number] => [
    dot(p, u),
    dot(p, v),
  ]);
  const turn = (a: [number, number], b: [number, number], c: [number, number]): number =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const size: number = flat.length;
  const lengths: number[] = ring.map((p: V3, i: number): number =>
    distance(p, ring[(i + 1) % size]!),
  );
  const whole: number = lengths.reduce((s: number, l: number): number => s + l, 0);
  let worst: number = 0;
  for (let i: number = 0; i < size; i++) {
    let run: number = lengths[i]!;
    for (let j: number = i + 2; j < size; j++) {
      run += lengths[j - 1]!;
      if (i === 0 && j === size - 1) continue;
      const a = flat[i]!;
      const b = flat[(i + 1) % size]!;
      const c = flat[j]!;
      const d = flat[(j + 1) % size]!;
      if (turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0)
        worst = Math.max(worst, Math.min(run, whole - run));
    }
  }
  return worst;
}

/**
 * A ridge bends the whole ring the same way at one height, which no anatomy
 * does: a rib or a breast bends a part of it. It is read off the surface's
 * radius at fixed heights and bearings, so a phase sliding round a ring is not
 * mistaken for a bend, and at even steps, so a short layer does not magnify
 * noise.
 */
function auditRidges(
  chain: IAutoMovieHumanLoftChain,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  if (!/^(trunk|upper|leg\.|arm\.)/.test(chain.name)) return;
  const low: number = chain.layers[0]!.y;
  const high: number = chain.layers[chain.layers.length - 1]!.y;
  const count: number = Math.floor((high - low) / RIDGE_STEP);
  if (count < 3) return;
  const rings: V3[][] = Array.from(
    { length: count + 1 },
    (_: unknown, i: number): V3[] =>
      AutoMovieHumanLoftChain.ring(chain, low + i * RIDGE_STEP, uniform(PHASES)),
  );
  // Across the shoulders only the torso's faces have a bearing: the arm's root
  // is not star-shaped about the ring's centre.
  const bearings: number[] = uniform(RIDGE_BEARINGS).filter(
    (a: number): boolean =>
      chain.name !== "upper" || Math.abs(Math.cos(a)) > RIDGE_FACE,
  );
  // Bearings and radii lie in each ring's own section plane, which is level
  // on a chain without frames and across the bone on a limb lofted in them.
  const table: number[][] = rings.map((ring: V3[], i: number): number[] => {
    const c: V3 = centre(ring);
    const f = AutoMovieHumanLoftChain.frame(chain, low + i * RIDGE_STEP);
    const flat: [number, number][] = ring.map((p: V3): [number, number] => [
      dot(sub(p, c), f.u),
      dot(sub(p, c), f.v),
    ]);
    const angles: number[] = flat.map((p: [number, number]): number =>
      Math.atan2(p[1], p[0]),
    );
    return bearings.map((bearing: number): number => {
      let best: number = Infinity;
      let at: number = 0;
      angles.forEach((a: number, j: number): void => {
        const d: number = Math.abs(
          Math.atan2(Math.sin(a - bearing), Math.cos(a - bearing)),
        );
        if (d < best) {
          best = d;
          at = j;
        }
      });
      return Math.hypot(...flat[at]!);
    });
  });
  for (let i: number = 1; i < count; i++) {
    const r: number = perimeter(rings[i]!) / (2 * Math.PI);
    if (r < 1) continue;
    const bends: number[] = bearings
      .map(
        (_: number, b: number): number =>
          ((table[i + 1]![b]! - 2 * table[i]![b]! + table[i - 1]![b]!) /
            (RIDGE_STEP * RIDGE_STEP)) *
          r,
      )
      .sort((p: number, q: number): number => p - q);
    const middle: number = Math.abs(bends[Math.floor(bends.length / 2)]!);
    if (middle > RIDGE)
      report(
        chain.name,
        "ridge",
        `at ${Math.round(low + i * RIDGE_STEP)}`,
        middle,
        RIDGE,
        centre(rings[i]!),
      );
  }
}

/** Joins: closed, and smooth across the seam. */
function auditJoins(
  body: IAutoMovieHumanBodyCalibration,
  generated: RegExp,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  const chains: Map<string, IAutoMovieHumanLoftChain> = new Map(
    body.chains.map(
      (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [
        c.name,
        c,
      ],
    ),
  );
  const find = (n: string): IAutoMovieHumanLoftChain => chains.get(n)!;
  for (const event of body.events) {
    // A web's children meet the parent through the web's own surface, which
    // the mesh rules read; their ends stand apart from its ring by design.
    if (event.web === true) continue;
    const parent: IAutoMovieHumanLoftChain = find(event.parent);
    const down: boolean = event.direction === "down";
    const end: number = down
      ? parent.layers[0]!.y
      : parent.layers[parent.layers.length - 1]!.y;
    const into: number = end + (down ? 1 : -1) * Math.min(REACH, length(parent) / 2);
    for (const split of event.splits) {
      const child: IAutoMovieHumanLoftChain = find(split.child);
      if (!generated.test(child.name) && !generated.test(parent.name)) continue;
      const region: string = `${event.parent} > ${child.name}`;
      const tip: number = down
        ? child.layers[child.layers.length - 1]!.y
        : child.layers[0]!.y;
      const away: number = tip + (down ? -1 : 1) * Math.min(REACH, length(child) / 2);
      const fine: number[] = uniform(720);
      const own: V3[] = AutoMovieHumanLoftChain.ring(child, tip, fine);
      const next: V3[] = AutoMovieHumanLoftChain.ring(child, away, fine);
      for (const [from, to] of split.arcs) {
        const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
        const count: number = 48;
        const phases: number[] = Array.from(
          { length: count },
          (_: unknown, i: number): number =>
            from + (span * (i + 0.5)) / count,
        );
        const ring: V3[] = AutoMovieHumanLoftChain.ring(parent, end, phases);
        const inner: V3[] = AutoMovieHumanLoftChain.ring(parent, into, phases);
        const facing: number[] = [];
        ring.forEach((p: V3, i: number): void => {
          let best: number = Infinity;
          let at: number = 0;
          own.forEach((q: V3, m: number): void => {
            const d: number = distance(p, q);
            if (d < best) {
              best = d;
              at = m;
            }
          });
          facing.push(fine[at]!);
          if (best > GAP) report(region, "gap", side(ring, i), best, GAP, p);

          // Pinches are corners by design: the seam rule is for the open arc.
          const edge: number = Math.min(i, count - 1 - i) / count;
          if (edge < 0.15) return;
          const a: V3 = unit(sub(p, inner[i]!));
          const b: V3 = unit(sub(next[at]!, own[at]!));
          const kink: number = (Math.acos(clamp(dot(a, b))) * 180) / Math.PI;
          if (/ear\./.test(region)) return;
          const limit: number = /> hand\./.test(region)
            ? WRIST_SEAM
            : /^upper > arm/.test(region)
              ? ARMPIT_SEAM
              : /^head\.middle > head\.lower/.test(region)
                ? ARMPIT_SEAM
                : SEAM;
          if (kink > limit) report(region, "seam", side(ring, i), kink, limit, p);
        });

        // How far the skin has turned a few millimetres either side of the ring.
        // One point of a heavy arm pressed on the trunk is a contact, so the
        // rule reads the arc's ninth decile.
        if (!/^(trunk|upper)$/.test(event.parent)) continue;
        const open: number[] = phases
          .map((_: number, i: number): number => i)
          .filter((i: number): boolean => Math.min(i, count - 1 - i) / count >= 0.15);
        const step: number = (down ? 1 : -1) * FOLD_REACH;
        const above: V3[] = normalsOf(
          parent,
          end + step,
          open.map((i: number): number => phases[i]!),
        );
        const below: V3[] = normalsOf(
          child,
          tip - step,
          open.map((i: number): number => facing[i]!),
        );
        const turns: number[] = open
          .map(
            (_: number, i: number): number =>
              (Math.acos(clamp(Math.abs(dot(above[i]!, below[i]!)))) * 180) /
              Math.PI,
          )
          .sort((p: number, q: number): number => p - q);
        const turn: number = turns[Math.floor(0.9 * (turns.length - 1))]!;
        if (turn > FOLD)
          report(region, "fold", side(ring, Math.floor(count / 2)), turn, FOLD, ring[Math.floor(count / 2)]!);
      }
    }
  }
}

/**
 * What shades as a line on figures every other rule passed.
 *
 * - `shelf`: the rear stops rising at the crotch ring, though the leg climbs into
 *   it. It reads as a soft line across the hip.
 * - `tip`: the crotch ring's rear ends in a sharp V, whose point shades across
 *   the cleft as a tab.
 * - `step`: the skin of the back turns faster on one side of the armpit's joint
 *   than on the other, a line with no angle at the ring itself.
 * - `streak`: a phase's kink runs down the thigh below its last interval, which
 *   is the join's fillet carrying a pinch's slope down the leg.
 */
function auditHip(
  body: IAutoMovieHumanBodyCalibration,
  generated: RegExp,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  const find = (n: string): IAutoMovieHumanLoftChain | undefined =>
    body.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === n);
  const trunk: IAutoMovieHumanLoftChain | undefined = find("trunk");
  const upper: IAutoMovieHumanLoftChain | undefined = find("upper");
  if (trunk === undefined || upper === undefined) return;
  const seam: number = trunk.layers[0]!.y;
  if (generated.test("trunk")) {
    const fine: number[] = uniform(720);
    const reach: number = THIGH_TOP * body.stature;
    const side: number = Math.max(
      ...AutoMovieHumanLoftChain.ring(trunk, seam, fine).map(
        (p: V3): number => p[2],
      ),
    );
    const rear = (chain: IAutoMovieHumanLoftChain, y: number): number =>
      rearAt(AutoMovieHumanLoftChain.ring(chain, y, fine), SHELF_PLANE * side);
    const leg: IAutoMovieHumanLoftChain | undefined = find("leg.left");
    if (leg !== undefined) {
      const at: number = rear(leg, seam);
      const below: number = rear(leg, seam - reach) - at;
      const above: number = at - rear(trunk, seam + reach);
      const ratio: number = below / Math.max(above, 1e-3);
      if (ratio > SHELF)
        report("trunk", "shelf", "rear of the crotch ring", ratio, SHELF, [at, seam, SHELF_PLANE * side]);
    }
    const spacing: number = (2 * Math.PI) / trunk.order;
    const [tip, next] = AutoMovieHumanLoftChain.ring(trunk, seam, [
      Math.PI,
      Math.PI - spacing,
    ]) as [V3, V3];
    const sharp: number =
      Math.abs(next[0] - tip[0]) / Math.max(Math.abs(next[2] - tip[2]), 1e-3);
    if (sharp > TIP) report("trunk", "tip", "rear of the crotch ring", sharp, TIP, tip);

    const joint: number = upper.layers[0]!.y;
    const phases: number[] = uniform(PHASES).filter(
      (t: number): boolean => Math.abs(t - Math.PI) < STEP_ARC,
    );
    const turn = (
      chain: IAutoMovieHumanLoftChain,
      a: number,
      b: number,
    ): number => {
      const p: V3[] = normalsOf(chain, a, phases);
      const q: V3[] = normalsOf(chain, b, phases);
      const angles: number[] = p
        .map(
          (n: V3, i: number): number =>
            (Math.acos(clamp(Math.abs(dot(n, q[i]!)))) * 180) / Math.PI,
        )
        .sort((x: number, y: number): number => x - y);
      return angles[Math.floor(angles.length / 2)]!;
    };
    const off: number = 0.1;
    const difference: number = Math.abs(
      turn(upper, joint + off, joint + STEP_REACH) -
        turn(trunk, joint - off, joint - STEP_REACH),
    );
    if (difference > STEP)
      report("upper > trunk", "step", "back of the joint", difference, STEP, [0, joint, 0]);

    // A feature narrower than a ring's control pitch turns the ring sharply
    // between two controls, and each row places it differently, so it prints
    // as teeth along it. The pinches are corners by design.
    const per: number = 4;
    const count: number = per * trunk.order;
    const pitched: number[] = uniform(count);
    const pinch: number = (TEETH_PINCH * 2 * Math.PI) / trunk.order;
    trunk.layers.forEach((l: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
      const stations: number[] =
        k === 0 ? [l.y] : [(l.y + trunk.layers[k - 1]!.y) / 2, l.y];
      for (const s of stations) {
        const ring: V3[] = AutoMovieHumanLoftChain.ring(trunk, s, pitched);
        const heading: number[] = ring.map((p: V3, i: number): number => {
          const q: V3 = ring[(i + 1) % count]!;
          return Math.atan2(q[2] - p[2], q[0] - p[0]);
        });
        ring.forEach((p: V3, i: number): void => {
          const t: number = pitched[i]!;
          if (Math.min(t, Math.abs(t - Math.PI), 2 * Math.PI - t) < pinch) return;
          const d: number = heading[(i + per) % count]! - heading[i]!;
          const turn: number =
            (Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) * 180) / Math.PI;
          if (turn > TEETH)
            report("trunk", "teeth", `layer ${band(k)} phase ${Math.round((t * 180) / Math.PI / 30) * 30}`, turn, TEETH, p);
        });
      }
    });
  }
  for (const name of ["leg.left", "leg.right"]) {
    const leg: IAutoMovieHumanLoftChain | undefined = find(name);
    if (leg === undefined || !generated.test(name)) continue;
    const top: number = leg.layers[leg.layers.length - 1]!.y;
    for (const share of STREAK_SHARES) {
      const ring: V3[] = AutoMovieHumanLoftChain.ring(
        leg,
        top - share * body.stature,
        uniform(512),
      );
      const n: number = ring.length;
      ring.forEach((b: V3, i: number): void => {
        const a: V3 = ring[(i + n - 1) % n]!;
        const c: V3 = ring[(i + 1) % n]!;
        const e: V3 = ring[(i + 2) % n]!;
        const third: number = Math.hypot(
          e[0] - 3 * c[0] + 3 * b[0] - a[0],
          e[2] - 3 * c[2] + 3 * b[2] - a[2],
        );
        if (third > STREAK)
          report(name, "streak", `under the ring ${share}`, third, STREAK, b);
      });
    }
  }
}

/**
 * A leg's rows through its knee and its sections under the crotch's pinches.
 *
 * - `rows`: under the knee's whole flexion, two neighbouring layers within its
 *   bend turn apart by more than {@link ALIAS}. The rig spreads a joint's turn
 *   over a quintic ramp {@link BEND} skin depths either side of it and the skin
 *   bends only between its rows, so rows that far apart print as facets round
 *   a flexed knee though the standing skin is smooth.
 * - `corner`: a leg's own section turns by more than {@link ALIAS} within 2 mm
 *   near one of the crotch ring's pinches, deeper than {@link CORNER_FROM} under
 *   the ring and down to the thigh rule's depth: the slit's corner carried down
 *   the thigh, which the cells alias into an edge.
 */
function auditLegRoot(
  body: IAutoMovieHumanBodyCalibration,
  generated: RegExp,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  const trunk: IAutoMovieHumanLoftChain | undefined = body.chains.find(
    (c: IAutoMovieHumanLoftChain): boolean => c.name === "trunk",
  );
  const event: IAutoMovieHumanBodyCalibration.IEvent | undefined = body.events.find(
    (e: IAutoMovieHumanBodyCalibration.IEvent): boolean => e.parent === "trunk" && e.direction === "down",
  );
  const flexion = AutoMovieHumanPoseChannels.find((r): boolean => r[0] === "legs.<side>.knee.flexion");
  for (const side of ["left", "right"]) {
    const name: string = `leg.${side}`;
    const leg: IAutoMovieHumanLoftChain | undefined = body.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === name,
    );
    if (leg === undefined || !generated.test(name)) continue;
    const low: number = leg.layers[0]!.y;
    const top: number = leg.layers[leg.layers.length - 1]!.y;

    // Rows through the knee.
    const knee: V3 | undefined = body.skeleton?.find((b): boolean => b.bone === `${side}LowerLeg`)?.position;
    if (knee !== undefined && flexion !== undefined && knee[1] > low && knee[1] < top) {
      const range: number = flexion[5] - flexion[4];
      const depth: number = Math.min(
        ...AutoMovieHumanLoftChain.ring(leg, knee[1], uniform(PHASES)).map((p: V3): number => distance(p, knee)),
      );
      const half: number = BEND * depth;
      const ramp = (s: number): number => {
        const y: number = (Math.min(1, Math.max(-1, (s - knee[1]) / half)) + 1) / 2;
        return y * y * y * (y * (6 * y - 15) + 10);
      };
      leg.layers.forEach((l: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
        if (k === 0) return;
        const turn: number = range * (ramp(l.y) - ramp(leg.layers[k - 1]!.y));
        if (turn > ALIAS) report(name, "rows", `layer ${band(k)}`, turn, ALIAS, knee);
      });
    }

    // Sections under the pinches.
    const split: IAutoMovieHumanBodyCalibration.ISplit | undefined = event?.splits.find(
      (s: IAutoMovieHumanBodyCalibration.ISplit): boolean => s.child === name,
    );
    if (trunk === undefined || split === undefined) continue;
    const pinches: V3[] = AutoMovieHumanLoftChain.ring(trunk, trunk.layers[0]!.y, split.arcs.flat());
    const phases: number[] = uniform(CORNER_PHASES);
    for (let d: number = CORNER_FROM; d <= THIGH_TOP * body.stature && top - d > low; d += CORNER_STEP) {
      const ring: V3[] = AutoMovieHumanLoftChain.ring(leg, top - d, phases);
      const n: number = ring.length;
      const walk = (from: number, step: number): V3 => {
        let gone: number = 0;
        let i: number = from;
        while (gone < 1) {
          const j: number = (i + step + n) % n;
          gone += distance(ring[j]!, ring[i]!);
          i = j;
        }
        return ring[i]!;
      };
      for (const pinch of pinches) {
        let near: number = 0;
        ring.forEach((p: V3, i: number): void => {
          if (distance(p, pinch) < distance(ring[near]!, pinch)) near = i;
        });
        for (let o: number = -CORNER_REACH; o <= CORNER_REACH; o++) {
          const i: number = (near + o + n) % n;
          const a: V3 = unit(sub(ring[i]!, walk(i, -1)));
          const b: V3 = unit(sub(walk(i, 1), ring[i]!));
          const turn: number = (Math.acos(clamp(dot(a, b))) * 180) / Math.PI;
          if (turn > ALIAS) report(name, "corner", `under the ring ${Math.round(d)} ${pinch[0] > 0 ? "front" : "back"}`, turn, ALIAS, ring[i]!);
        }
      }
    }
  }
}

/** Rearmost place where a ring crosses the plane at a lateral place. */
function rearAt(ring: V3[], z: number): number {
  let best: number = Infinity;
  ring.forEach((a: V3, i: number): void => {
    const b: V3 = ring[(i + 1) % ring.length]!;
    if ((a[2] - z) * (b[2] - z) > 0 || a[2] === b[2]) return;
    best = Math.min(best, a[0] + ((z - a[2]) / (b[2] - a[2])) * (b[0] - a[0]));
  });
  return best;
}

/**
 * A rib is a sharp turn along a foot's or toe's longitudinal curve, in degrees
 * per radius of the ring it crosses so a toe and a heel read alike. Sampled at
 * even steps of skin, not per layer: `crease` reads a turn between samples, and
 * a turn spread over a few samples of a short layer slips under it.
 */
function auditRibs(
  chain: IAutoMovieHumanLoftChain,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  if (!/^(foot|forefoot|toe)\./.test(chain.name)) return;
  const low: number = chain.layers[0]!.y;
  const high: number = chain.layers[chain.layers.length - 1]!.y;
  const count: number = Math.floor((high - low) / RIB_STEP);
  if (count < 2) return;
  const grid: V3[][] = Array.from(
    { length: count + 1 },
    (_: unknown, i: number): V3[] =>
      AutoMovieHumanLoftChain.ring(chain, low + i * RIB_STEP, uniform(RIB_PHASES)),
  );
  for (let j: number = 0; j < RIB_PHASES; j++)
    for (let i: number = 1; i < count; i++) {
      const radius: number = perimeter(grid[i]!) / (2 * Math.PI);
      if (radius < RIB_RADIUS) continue;
      const a: V3 = sub(grid[i]![j]!, grid[i - 1]![j]!);
      const b: V3 = sub(grid[i + 1]![j]!, grid[i]![j]!);
      const la: number = Math.hypot(...a);
      const lb: number = Math.hypot(...b);
      if (la < RIB_SEGMENT || lb < RIB_SEGMENT) continue;
      const turn: number = (Math.acos(clamp(dot(a, b) / (la * lb))) * 180) / Math.PI;
      const value: number = (turn / ((la + lb) / 2)) * radius;
      if (value > RIB)
        report(chain.name, "rib", `at ${Math.round(low + i * RIB_STEP)}`, value, RIB, grid[i]![j]!);
    }
}

/**
 * The ball of the foot is one padded surface: a web may shape the top of the
 * foot and the web itself, and a toe's crease is short. So the plantar skin a
 * little behind a web's lower end stands no higher than the skin beside it. The
 * skin is read off the chains, in axes along and across the foot from that end,
 * so a groove reads whatever the chains' stations are.
 */
function auditBall(
  body: IAutoMovieHumanBodyCalibration,
  generated: RegExp,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  for (const sign of ["left", "right"]) {
    const skin: V3[] = body.chains
      .filter(
        (c: IAutoMovieHumanLoftChain): boolean =>
          new RegExp(`^(foot|forefoot)\\.${sign}`).test(c.name) && generated.test(c.name),
      )
      .flatMap((c: IAutoMovieHumanLoftChain): V3[] => {
        const low: number = c.layers[0]!.y;
        const high: number = Math.min(c.layers[c.layers.length - 1]!.y, low + BALL_CHAIN);
        const count: number = Math.ceil((high - low) / BALL_STEP);
        return Array.from({ length: count + 1 }, (_: unknown, i: number): V3[] =>
          AutoMovieHumanLoftChain.ring(c, Math.min(high, low + i * BALL_STEP), uniform(BALL_PHASES)),
        ).flat();
      });
    if (skin.length === 0) continue;
    const ankle: IAutoMovieHumanLoftChain = body.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === `foot.${sign}`,
    )!;
    const heel: V3 = centre(
      AutoMovieHumanLoftChain.ring(
        ankle,
        ankle.layers[ankle.layers.length - 1]!.y,
        uniform(PHASES),
      ),
    );
    for (const event of body.events) {
      if (!new RegExp(`^(foot|forefoot)\\.${sign}`).test(event.parent)) continue;
      const parent: IAutoMovieHumanLoftChain | undefined = body.chains.find(
        (c: IAutoMovieHumanLoftChain): boolean => c.name === event.parent,
      );
      if (parent === undefined) continue;
      for (const split of event.splits) {
        if (split.arcs.length !== 1 || !/^toe\./.test(split.child)) continue;
        const ends: V3[] = AutoMovieHumanLoftChain.ring(
          parent,
          parent.layers[0]!.y,
          [split.arcs[0]![0], split.arcs[0]![1]],
        );
        const web: V3 = ends[0]![1] < ends[1]![1] ? ends[0]! : ends[1]!;
        const along: V3 = unit([web[0] - heel[0], 0, web[2] - heel[2]]);
        const across: V3 = [-along[2], 0, along[0]];
        const lowest = (offset: number): number => {
          let y: number = Infinity;
          for (const p of skin) {
            const d: V3 = sub(p, web);
            if (
              Math.abs(dot(d, along) + BALL_BACK) < 1 &&
              Math.abs(dot(d, across) - offset) < 1
            )
              y = Math.min(y, p[1]);
          }
          return y;
        };
        const here: number = lowest(0);
        const beside: number = Math.min(lowest(BALL_SIDE), lowest(-BALL_SIDE));
        if (Number.isFinite(here) && Number.isFinite(beside) && here - beside > BALL)
          report(`${event.parent} > ${split.child}`, "ball", `${BALL_BACK} mm behind the web`, here - beside, BALL, web);
      }
    }
  }
}

/**
 * A toe closed by a rounded dome: the surface lays that dome on the first ring
 * that is no point ring, leaving it along the line to the pole, so the skin
 * kinks wherever the tube is still tapering. A toe's own cap carries no such
 * pole, so this reads nothing on one.
 */
function auditTips(
  body: IAutoMovieHumanBodyCalibration,
  chains: readonly IAutoMovieHumanLoftChain[],
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  for (const pole of body.poles) {
    if (!pole.critical || !/^(toe|finger|thumb)\./.test(pole.chain)) continue;
    const chain: IAutoMovieHumanLoftChain | undefined = chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === pole.chain,
    );
    if (chain === undefined) continue;
    const radii: number[] = chain.layers.map(
      (l: IAutoMovieHumanLoftChain.ILayer): number =>
        perimeter(AutoMovieHumanLoftChain.ring(chain, l.y, uniform(PHASES))) / (2 * Math.PI),
    );
    const median: number = [...radii].sort((p: number, q: number): number => p - q)[radii.length >> 1]!;
    const k: number = radii.findIndex((r: number): boolean => r >= DOME_FLOOR * median);
    if (k < 0) continue;
    const station: number = chain.layers[k]!.y;
    const ring: V3[] = AutoMovieHumanLoftChain.ring(chain, station, uniform(PHASES));
    // A chain that ends on the dome's own ring has no skin past it, so its tube
    // is read coming down to the ring.
    const last: boolean = k === 0;
    const inner: V3[] = AutoMovieHumanLoftChain.ring(
      chain,
      last ? station + NORMAL_STATION : station - NORMAL_STATION,
      uniform(PHASES),
    );
    const along: V3 = unit(sub(pole.point, centre(ring)));
    ring.forEach((p: V3, j: number): void => {
      const run: V3 = last ? sub(p, inner[j]!) : sub(inner[j]!, p);
      const kink: number = (Math.acos(clamp(dot(unit(run), along))) * 180) / Math.PI;
      if (kink > DOME) report(pole.chain, "dome", side(ring, j), kink, DOME, p);
    });
  }
}

/**
 * Beside the nose the cheek runs into the lip with no step: a base that goes on
 * past the wing stands off the skin as a ridge, which the sections hold as a
 * sharp rise with height at a fixed distance from the midline.
 */
function auditNoseFlank(
  body: IAutoMovieHumanBodyCalibration,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  const nostril = body.apertures.find((a): boolean => a.name === "nostril.left");
  if (nostril === undefined) return;
  const step: number = (2 * nostril.order + 1);
  const centre: number = nostril.coefficients[step]!;
  const lateral: number = Math.abs(nostril.coefficients[2 * step]!);
  const chains: IAutoMovieHumanLoftChain[] = body.chains.filter(
    (c: IAutoMovieHumanLoftChain): boolean => /^head\.(lower|middle)$/.test(c.name),
  );
  const front = (y: number, z: number): number | null => {
    const chain: IAutoMovieHumanLoftChain | undefined = chains.find(
      (c: IAutoMovieHumanLoftChain): boolean =>
        y >= c.layers[0]!.y && y <= c.layers[c.layers.length - 1]!.y,
    );
    if (chain === undefined) return null;
    const ring: V3[] = AutoMovieHumanLoftChain.ring(chain, y, uniform(1440));
    let best: number | null = null;
    ring.forEach((p: V3, i: number): void => {
      const q: V3 = ring[(i + 1) % ring.length]!;
      if ((p[2] - z) * (q[2] - z) > 0 || p[2] === q[2]) return;
      const x: number = p[0] + ((z - p[2]) * (q[0] - p[0])) / (q[2] - p[2]);
      if (best === null || x > best) best = x;
    });
    return best;
  };
  for (const share of LEDGE_PLACES) {
    const z: number = share * lateral;
    let last: number | null = null;
    for (let y: number = centre - LEDGE_BELOW; y <= centre + LEDGE_ABOVE; y += LEDGE_STEP) {
      const x: number | null = front(y, z);
      if (x !== null && last !== null) {
        const rise: number = Math.abs(x - last) / LEDGE_STEP;
        if (rise > LEDGE)
          report("head", "ledge", `beside the nose at ${share} nostrils out`, rise, LEDGE, [x, y, z]);
      }
      last = x;
    }
  }
}

/**
 * The face's front x against world height at a fixed distance from the midline,
 * read off the lower and middle head's rings.
 */
function faceProfile(
  body: IAutoMovieHumanBodyCalibration,
  z: number,
  low: number,
  high: number,
): [number, number][] {
  const out: [number, number][] = [];
  for (const chain of body.chains.filter((c: IAutoMovieHumanLoftChain): boolean =>
    /^head\.(lower|middle)$/.test(c.name),
  )) {
    const bottom: number = chain.layers[0]!.y;
    const top: number = chain.layers[chain.layers.length - 1]!.y;
    for (let s: number = bottom; s <= top; s += PROFILE_STEP) {
      const ring: V3[] = AutoMovieHumanLoftChain.ring(chain, s, uniform(1440));
      let best: [number, number] | null = null;
      ring.forEach((p: V3, i: number): void => {
        const q: V3 = ring[(i + 1) % ring.length]!;
        if ((p[2] - z) * (q[2] - z) > 0 || p[2] === q[2]) return;
        const f: number = (z - p[2]) / (q[2] - p[2]);
        const x: number = p[0] + f * (q[0] - p[0]);
        if (best === null || x > best[1]) best = [p[1] + f * (q[1] - p[1]), x];
      });
      if (best !== null && best[0] >= low && best[0] <= high) out.push(best);
    }
  }
  return out.sort((p: [number, number], q: [number, number]): number => p[0] - q[0]);
}

/**
 * The nose's base is a rounded surface: from the lip up to the tip, at every
 * distance across the base, the skin turns from facing down to facing forward
 * over a radius, never at a shelf's edge.
 */
function auditNoseBase(
  body: IAutoMovieHumanBodyCalibration,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  const nostril = body.apertures.find((a): boolean => a.name === "nostril.left");
  if (nostril === undefined) return;
  const step: number = 2 * nostril.order + 1;
  const y: number = nostril.coefficients[step]!;
  const lateral: number = Math.abs(nostril.coefficients[2 * step]!);
  const k: number = body.stature / BASE_STATURE;
  for (const share of BASE_PLACES) {
    const line: [number, number][] = faceProfile(body, share * lateral, y - BASE_BELOW * k, y + BASE_ABOVE * k);
    const points: [number, number][] = [];
    for (const p of line) {
      const last: [number, number] | undefined = points[points.length - 1];
      if (last === undefined || Math.hypot(p[0] - last[0], p[1] - last[1]) >= BASE_SAMPLE * k) points.push(p);
    }
    for (let i: number = 1; i + 1 < points.length; i++) {
      const a: [number, number] = points[i - 1]!;
      const b: [number, number] = points[i]!;
      const c: [number, number] = points[i + 1]!;
      const d1: [number, number] = [b[0] - a[0], b[1] - a[1]];
      const d2: [number, number] = [c[0] - b[0], c[1] - b[1]];
      const turn: number = Math.atan2(d1[0] * d2[1] - d1[1] * d2[0], d1[0] * d2[0] + d1[1] * d2[1]);
      if (turn >= 0) continue;
      const radius: number = (Math.hypot(...d1) + Math.hypot(...d2)) / 2 / -turn;
      if (radius < BASE_RADIUS * k)
        report("head", "base", `nose base at ${share} nostrils out`, BASE_RADIUS * k / radius, 1, [b[1], b[0], share * lateral]);
    }
  }
}

/**
 * The mandible's border is an edge the skin turns under, toward the neck: at the
 * face's steepest fall below the cheek, the profile turns within a radius. A
 * lower face rolling into the neck over a wide radius is a bag with no jaw.
 *
 * The places are shares of the mandible's own half-width, as a jaw is
 * measured: a share of the head's width read a jaw narrower than the cheeks
 * outside its own angle, on the cheek's taper.
 */
function auditJaw(
  body: IAutoMovieHumanBodyCalibration,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
  mandible: number | undefined,
): void {
  const lower: IAutoMovieHumanLoftChain | undefined = body.chains.find(
    (c: IAutoMovieHumanLoftChain): boolean => c.name === "head.lower",
  );
  if (lower === undefined) return;
  const bottom: number = lower.layers[0]!.y;
  const top: number = lower.layers[lower.layers.length - 1]!.y;
  const half: number =
    mandible ??
    Math.max(...AutoMovieHumanLoftChain.ring(lower, top, uniform(720)).map((p: V3): number => Math.abs(p[2])));
  const from: number = bottom + JAW_ABOVE_NECK * (top - bottom);
  for (const share of JAW_PLACES) {
    const line: [number, number][] = faceProfile(body, share * half, from, top);

    // The turn under is where the skin falls back fastest with height.
    let turn: number = -1;
    let steepest: number = 0;
    for (let i: number = 0, j: number = 0; i < line.length; i++) {
      while (line[i]![0] - line[j]![0] > JAW_SPAN) j++;
      const dy: number = line[i]![0] - line[j]![0];
      if (dy <= 0) continue;
      const slope: number = (line[i]![1] - line[j]![1]) / dy;
      if (slope > steepest) {
        steepest = slope;
        turn = j;
      }
    }
    if (turn < 0) continue;

    // The border's own radius: the sharpest convex turn about the turn under.
    const k: number = body.stature / BASE_STATURE;
    const centre: number = line[turn]![0];
    const points: [number, number][] = [];
    for (const p of line) {
      if (Math.abs(p[0] - centre) > JAW_BAND * k) continue;
      const last: [number, number] | undefined = points[points.length - 1];
      if (last === undefined || Math.hypot(p[0] - last[0], p[1] - last[1]) >= JAW_SAMPLE * k) points.push(p);
    }
    let least: number = Infinity;
    let at: [number, number] = line[turn]!;
    for (let i: number = 1; i + 1 < points.length; i++) {
      const a: [number, number] = points[i - 1]!;
      const b: [number, number] = points[i]!;
      const c: [number, number] = points[i + 1]!;
      const d1: [number, number] = [b[0] - a[0], b[1] - a[1]];
      const d2: [number, number] = [c[0] - b[0], c[1] - b[1]];
      const bend: number = Math.atan2(d1[0] * d2[1] - d1[1] * d2[0], d1[0] * d2[0] + d1[1] * d2[1]);
      if (bend >= 0) continue;
      const radius: number = (Math.hypot(...d1) + Math.hypot(...d2)) / 2 / -bend;
      if (radius < least) {
        least = radius;
        at = b;
      }
    }
    const limit: number = JAW_TURN * k;
    if (least > limit) report("head.lower", "jaw", `under the jaw at ${share} of its half-width`, least, limit, [at[1], at[0], share * half]);
  }
}

/**
 * The head's skin as the viewer shades it, about the jaw and the nostrils.
 *
 * - `facet`: across one cell of the skin along the mandible's border, the
 *   shading normal turns by more than {@link FACET}. Where the sections run
 *   nearly along the jaw's underside, a turn the layers cannot carry falls
 *   between two of them and shades as a row of facets, though every curve
 *   rule reads the layers themselves as sound.
 * - `pit`: across one cell of a nostril's closure where it shows through the
 *   opening, or from it to the skin round it, the shading normal turns by
 *   more than {@link PIT}: the walls shade as the white streaks of a fringe.
 */
function auditHeadMesh(
  body: IAutoMovieHumanBodyCalibration,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
  mandible: number | undefined,
): void {
  const owned: RegExp = /^head\.(lower|middle)$/;
  const nostrils = body.apertures.filter((a): boolean => /^nostril\./.test(a.name));
  const lower: IAutoMovieHumanLoftChain | undefined = body.chains.find(
    (c: IAutoMovieHumanLoftChain): boolean => c.name === "head.lower",
  );
  if (lower === undefined || nostrils.length === 0) return;
  const out = AutoMovieHumanBodySurface.generate({
    ...body,
    chains: body.chains.filter((c: IAutoMovieHumanLoftChain): boolean => owned.test(c.name)),
    events: body.events
      .filter((e: IAutoMovieHumanBodyCalibration.IEvent): boolean => owned.test(e.parent))
      .map((e: IAutoMovieHumanBodyCalibration.IEvent): IAutoMovieHumanBodyCalibration.IEvent => ({
        ...e,
        splits: e.splits.filter((s: IAutoMovieHumanBodyCalibration.ISplit): boolean => owned.test(s.child)),
      })),
    poles: [],
    apertures: nostrils,
    eyes: [],
    appendages: undefined,
  });
  const p: number[] = out.mesh.positions;
  const n: number[] = out.normals;
  const c: number[] = out.coordinates;
  const size: number = p.length / 3;
  const at = (v: number): V3 => [p[3 * v]!, p[3 * v + 1]!, p[3 * v + 2]!];
  const skin = (v: number): boolean => Number.isFinite(c[3 * v]!);
  const turn = (a: number, b: number): number =>
    (Math.acos(clamp(n[3 * a]! * n[3 * b]! + n[3 * a + 1]! * n[3 * b + 1]! + n[3 * a + 2]! * n[3 * b + 2]!)) * 180) / Math.PI;

  // The jaw's border: below the nose, about the mandible's own half-width,
  // ahead of the lower head's axis.
  const step: number = 2 * nostrils[0]!.order + 1;
  const nose: number = nostrils[0]!.coefficients[step]!;
  const k: number = body.stature / BASE_STATURE;
  const half: number =
    mandible ??
    Math.max(
      ...AutoMovieHumanLoftChain.ring(lower, lower.layers[lower.layers.length - 1]!.y, uniform(720)).map(
        (q: V3): number => Math.abs(q[2]),
      ),
    );
  const bottom: number = lower.layers[0]!.y;
  const top: number = lower.layers[lower.layers.length - 1]!.y;
  const jaw = (v: number): boolean => {
    const q: V3 = at(v);
    if (q[1] < nose - FACET_BELOW[1]! * k || q[1] > nose - FACET_BELOW[0]! * k) return false;
    if (Math.abs(q[2]) < FACET_ACROSS[0]! * half || Math.abs(q[2]) > FACET_ACROSS[1]! * half) return false;
    // The lips turn sharply by design.
    if (Math.abs(q[2]) < FACET_MOUTH[0]! * half && q[1] > nose - FACET_MOUTH[1]! * k) return false;
    // Back to the angle, which stands about the lower head's axis.
    const axis: V3 = AutoMovieHumanLoftChain.axis(lower, Math.min(top, Math.max(bottom, q[1])));
    return q[0] > axis[0] - FACET_BACK * half;
  };

  // A nostril's closure: the vertices it added in the half of its pocket that
  // shows through the opening. The skin's shading darkens the pocket fully
  // by half its depth, and the pole's fan lies past it.
  const centres: { centre: V3; forward: V3; reach: number; depth: number }[] = nostrils.map((a) => {
    const s: number = 2 * a.order + 1;
    const radius: number = Math.hypot(
      ...[1, 2, s + 1, s + 2, 2 * s + 1, 2 * s + 2].map((h: number): number => a.coefficients[h]!),
    );
    return {
      centre: [a.coefficients[0]!, a.coefficients[s]!, a.coefficients[2 * s]!],
      forward: unit([a.forward[0]!, a.forward[1]!, a.forward[2]!]),
      reach: (a.pocket ?? 0) + 2 * radius,
      depth: (a.pocket ?? 0) / 2,
    };
  });
  const closure = (v: number): boolean =>
    !skin(v) &&
    centres.some(
      (o): boolean =>
        distance(at(v), o.centre) < o.reach && dot(sub(o.centre, at(v)), o.forward) < o.depth,
    );

  const seen: Set<number> = new Set();
  const ix: number[] = out.mesh.indices;
  for (let t: number = 0; t < ix.length; t += 3)
    for (let e: number = 0; e < 3; e++) {
      const a: number = ix[t + e]!;
      const b: number = ix[t + ((e + 1) % 3)]!;
      const key: number = Math.min(a, b) * size + Math.max(a, b);
      if (seen.has(key)) continue;
      seen.add(key);
      if (skin(a) && skin(b) && jaw(a) && jaw(b)) {
        const value: number = turn(a, b);
        if (value > FACET) report("head.lower", "facet", "along the jaw's border", value, FACET, at(a));
      } else if (closure(a) || closure(b)) {
        if (!(closure(a) || skin(a)) || !(closure(b) || skin(b))) continue;
        const value: number = turn(a, b);
        if (value > PIT) report("head", "pit", "nostril closure", value, PIT, at(a));
      }
    }
}

/** Unit normals of a chain's surface at one station and given phases. */
function normalsOf(
  chain: IAutoMovieHumanLoftChain,
  station: number,
  phases: number[],
): V3[] {
  const at = (s: number, shift: number): V3[] =>
    AutoMovieHumanLoftChain.ring(
      chain,
      s,
      phases.map((t: number): number => t + shift),
    );
  const up: V3[] = at(station + NORMAL_STATION, 0);
  const down: V3[] = at(station - NORMAL_STATION, 0);
  const ahead: V3[] = at(station, NORMAL_PHASE);
  const behind: V3[] = at(station, -NORMAL_PHASE);
  return phases.map(
    (_: number, i: number): V3 =>
      unit(cross(sub(up[i]!, down[i]!), sub(ahead[i]!, behind[i]!))),
  );
}

/** The two sides mirror each other, and no limb crosses the midline. */
function auditSides(
  body: IAutoMovieHumanBodyCalibration,
  report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
): void {
  for (const left of body.chains.filter(
    (c: IAutoMovieHumanLoftChain): boolean => /^(arm|leg)\.left$/.test(c.name),
  )) {
    const right: IAutoMovieHumanLoftChain | undefined = body.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean =>
        c.name === left.name.replace("left", "right"),
    );
    if (right === undefined || right.layers.length !== left.layers.length) {
      report(left.name, "mirror", "layer count", 1, 0);
      continue;
    }
    left.layers.forEach(
      (l: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
        const a: V3[] = AutoMovieHumanLoftChain.ring(left, l.y, uniform(PHASES));
        const b: V3[] = AutoMovieHumanLoftChain.ring(
          right,
          right.layers[k]!.y,
          uniform(PHASES),
        );
        let square: number = 0;
        for (const p of a) {
          let near: number = Infinity;
          for (const q of b)
            near = Math.min(
              near,
              (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] + q[2]) ** 2,
            );
          square = Math.max(square, near);
        }
        const off: number = Math.sqrt(square);
        if (off > MIRROR) report(left.name, "mirror", `layer ${band(k)}`, off, MIRROR);
        const across: number = -Math.min(...a.map((p: V3): number => p[2]));
        if (across > MIDLINE)
          report(left.name, "midline", `layer ${band(k)}`, across, MIDLINE);
      },
    );
  }
}

/** Station span of a chain. */
function length(chain: IAutoMovieHumanLoftChain): number {
  return chain.layers[chain.layers.length - 1]!.y - chain.layers[0]!.y;
}

/** Indices where a ring's curvature flips sign while large. */
function flipsOf(
  values: number[],
  radius: number,
  limit: number,
): number[] {
  const out: number[] = [];
  let sign: number = 0;
  values.forEach((v: number, i: number): void => {
    if (Math.abs(v) * radius < limit) return;
    if (sign !== 0 && Math.sign(v) !== sign) out.push(i);
    sign = Math.sign(v);
  });
  return out;
}

/** Signed curvature round a closed ring in the plane of its area. */
function signedCurvature(ring: V3[]): number[] {
  const n: V3 = areaNormal(ring);
  return ring.map((p: V3, j: number): number => {
    const a: V3 = sub(p, ring[(j + ring.length - 1) % ring.length]!);
    const b: V3 = sub(ring[(j + 1) % ring.length]!, p);
    const la: number = Math.hypot(...a);
    const lb: number = Math.hypot(...b);
    if (la < 1e-6 || lb < 1e-6) return 0;
    const c: V3 = cross(a, b);
    const turn: number = Math.atan2(dot(c, n), dot(a, b));
    return turn / ((la + lb) / 2);
  });
}

/** Unit normal of a ring's area. */
function areaNormal(ring: V3[]): V3 {
  const c: V3 = centre(ring);
  let n: V3 = [0, 0, 0];
  ring.forEach((p: V3, i: number): void => {
    n = add(n, cross(sub(p, c), sub(ring[(i + 1) % ring.length]!, c)));
  });
  return unit(n);
}

/** Direction on the body of a ring's point, about the ring's centre. */
function side(ring: V3[], j: number): string {
  const c: V3 = centre(ring);
  const p: V3 = ring[j]!;
  const a: number = Math.atan2(p[2] - c[2], p[0] - c[0]);
  const names: string[] = ["front", "front-left", "left", "back-left", "back", "back-right", "right", "front-right"];
  return names[(Math.round((a / (2 * Math.PI)) * 8) + 8) % 8]!;
}

/** Groups neighbouring layers so one defect reads as one line. */
function band(k: number): string {
  const from: number = Math.floor(k / 4) * 4;
  return `${from}-${from + 3}`;
}

const UNIFORM: Map<number, number[]> = new Map();

function uniform(count: number): number[] {
  const found: number[] | undefined = UNIFORM.get(count);
  if (found !== undefined) return found;
  const phases: number[] = Array.from(
    { length: count },
    (_: unknown, i: number): number => (2 * Math.PI * i) / count,
  );
  UNIFORM.set(count, phases);
  return phases;
}

function perimeter(ring: V3[]): number {
  return ring.reduce(
    (s: number, p: V3, i: number): number =>
      s + distance(p, ring[(i + 1) % ring.length]!),
    0,
  );
}

function crossings(ring: V3[]): number {
  const n: V3 = areaNormal(ring);
  const seed: V3 = Math.abs(n[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0];
  const u: V3 = unit(cross(n, seed));
  const v: V3 = cross(n, u);
  const flat: [number, number][] = ring.map((p: V3): [number, number] => [
    dot(p, u),
    dot(p, v),
  ]);
  const turn = (a: [number, number], b: [number, number], c: [number, number]): number =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  let count: number = 0;
  const size: number = flat.length;
  for (let i: number = 0; i < size; i++)
    for (let j: number = i + 2; j < size; j++) {
      if (i === 0 && j === size - 1) continue;
      const a = flat[i]!;
      const b = flat[(i + 1) % size]!;
      const c = flat[j]!;
      const d = flat[(j + 1) % size]!;
      if (turn(a, b, c) * turn(a, b, d) < 0 && turn(c, d, a) * turn(c, d, b) < 0)
        count++;
    }
  return count;
}

/** Whether a closed polygon in the plane holds a point, by the even-odd rule. */
function encloses(polygon: [number, number][], p: [number, number]): boolean {
  let odd: boolean = false;
  for (let i: number = 0, j: number = polygon.length - 1; i < polygon.length; j = i++) {
    const a: [number, number] = polygon[i]!;
    const b: [number, number] = polygon[j]!;
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      odd = !odd;
  }
  return odd;
}

function centre(ring: V3[]): V3 {
  const s: V3 = ring.reduce((a: V3, p: V3): V3 => add(a, p), [0, 0, 0]);
  return [s[0] / ring.length, s[1] / ring.length, s[2] / ring.length];
}

function add(a: V3, b: V3): V3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: V3, b: V3): V3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function unit(a: V3): V3 {
  const l: number = Math.sqrt(dot(a, a)) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

function distance(a: V3, b: V3): number {
  const d: V3 = sub(a, b);
  return Math.sqrt(dot(d, d));
}

function clamp(v: number): number {
  return Math.min(1, Math.max(-1, v));
}

/**
 * The parts a body has, by the chains that carry them, with the fewest and most
 * of each: a hand has a thumb and four fingers, a foot five toes. `<side>`
 * stands for each side in turn.
 */
const ANATOMY: readonly [label: string, chains: RegExp, least: number, most: number][] = [
  ["trunk", /^(trunk|upper)$/, 1, Infinity],
  ["neck", /^head$/, 1, 1],
  ["head", /^head\.(lower|middle|upper)$/, 1, Infinity],
  ["ear", /^ear\.[a-z]+\.<side>$/, 1, Infinity],
  ["arm", /^arm\.<side>$/, 1, 1],
  ["palm", /^hand\.<side>\./, 1, Infinity],
  ["thumb", /^thumb\.<side>$/, 1, 1],
  ["finger", /^finger\.<side>\./, 4, 4],
  ["leg", /^leg\.<side>$/, 1, 1],
  ["foot", /^foot\.<side>$/, 1, 1],
  ["toe", /^toe\.<side>\./, 5, 5],
];

/**
 * Share of stature the crown and the sole may stand off: a person's stature
 * falls by about this much from morning to evening, so a reading within it is
 * the same stature.
 */
const STATURE_DAY: number = 0.01;

/** Ring samples. */
const PHASES: number = 96;

/** Surface samples per layer interval. */
const STEPS: number = 4;

/** A ring shorter than this is a cap's tip, mm. */
const SMALL: number = 20;

/** Largest slope for a ring of `SLOPE_GIRTH`: the crotch opens this steeply. */
const SLOPE: number = 13;

/** Girth the slope limit is stated for, mm. */
const SLOPE_GIRTH: number = 1300;

// The limits below sit just above what reads smooth in the viewer. A limit
// licenses everything under it, so a defect the viewer shows gets its own rule
// rather than a tighter number here.

/** Tangential motion per unit of the rings' axial gap. */
const SLIDE: number = 8;

/** Span's swing past its chord. */
const OVERSHOOT: number = 1.5;

/** Turn along a longitudinal curve between samples, degrees. */
const CREASE: number = 40;

/** Ring samples an ear's rim is found among. */
const EAR_PHASES: number = 960;

/** Cosine between neighbouring cells' normals below which an ear folds. */
const EAR_FOLD: number = -0.2;

/**
 * Arc a crossing may enclose on an ear, mm: a helix tube's thickness, the most a
 * pinch's corner can overshoot and stay inside the rim.
 */
const EAR_CROSSING: number = 3.4;

/** Shortest step along a curve that can show a corner, mm. */
const SEGMENT: number = 0.5;

/** Curvature times the radius above which a flip is a band. */
const BAND: number = 34;

/** Curvature times the radius that counts as bending at all. */
const BAND_FLOOR: number = 1.5;

/** Median of the radius's height curvature, times the radius, round a ring. */
const RIDGE: number = 8;

/** Height between the rings a ridge is read from, mm. */
const RIDGE_STEP: number = 6;

/** Bearings a ridge is read at. */
const RIDGE_BEARINGS: number = 48;

/** Cosine of a bearing past which it faces forward or back. */
const RIDGE_FACE: number = 0.7;

/** Curvature flips a plain section may have round its ring. */
const RIPPLES: number = 14;

/** And a section through the face, which crosses the nose, lips and sockets. */
const FACE_RIPPLES: number = 26;

/** Station slope a face reaches at the lips' fissure. */
const FACE_SLOPE: number = 17;

/** Turn a face reaches at the lips and the nose's base, degrees. */
const FACE_CREASE: number = 52;

/** Station step of the face's profiles, mm. */
const PROFILE_STEP: number = 0.25;

/** Stature the base and jaw lengths are stated for, mm. */
const BASE_STATURE: number = 1700;

/** Least radius of the nose base's convex turns, mm. */
const BASE_RADIUS: number = 1.5;

/** Distances from the midline the base is read at, in the nostril's own. */
const BASE_PLACES: readonly number[] = [0, 0.5, 1, 1.5];

/** Heights the base is read over about the nostril, and the profile's sample, mm. */
const BASE_BELOW: number = 6;
const BASE_ABOVE: number = 12;
const BASE_SAMPLE: number = 0.4;

/**
 * Largest radius of the turn under the mandible's border, mm: the soft tissue
 * over the bone's edge, which fat rounds but does not take away.
 */
const JAW_TURN: number = 10;

/** Height either side of the jaw's turn read for its radius, and the sample, mm. */
const JAW_BAND: number = 12;
const JAW_SAMPLE: number = 1;

/** Height over which the jaw's turn under is read, mm. */
const JAW_SPAN: number = 3;

/** Distances from the midline the jaw is read at, in the lower head's half-width. */
const JAW_PLACES: readonly number[] = [0.5, 0.65, 0.8];

/** Share of the lower head above its bottom ring where the neck's base ends. */
const JAW_ABOVE_NECK: number = 0.15;

/**
 * Turn of the shading normal across one cell along the jaw's border, degrees:
 * above it the border read as a row of facets in the viewer.
 */
const FACET: number = 15;

/** Heights below the nostrils the jaw's border is read between, mm. */
const FACET_BELOW: readonly number[] = [25, 80];

/** Distances from the midline it is read between, in the jaw's half-width. */
const FACET_ACROSS: readonly number[] = [0.35, 1.3];

/**
 * The mouth, which it leaves out: within this share of the jaw's half-width
 * of the midline, and less than this far below the nostrils, mm.
 */
const FACET_MOUTH: readonly number[] = [0.6, 40];

/** How far behind the lower head's axis it is read, in the jaw's half-width. */
const FACET_BACK: number = 0.5;

/**
 * Turn of the shading normal across one cell of a nostril's closure, degrees:
 * at 40 and more its walls read in the viewer as a white, jagged fringe.
 */
const PIT: number = 30;

/** Rise of the skin forward per millimetre of height beside the nose. */
const LEDGE: number = 0.7;

/** Distances from the midline it is read at, in the nostril's own: past the wing. */
const LEDGE_PLACES: readonly number[] = [2.5, 2.8];

/** Heights it is read over about the nostril, and its step, mm. */
const LEDGE_BELOW: number = 12;
const LEDGE_ABOVE: number = 6;
const LEDGE_STEP: number = 1;

/** Turn of a face's section across one control, degrees. */
const ALIAS: number = 30;

/** Bearing from the ring's centre within which a section is the face, radians. */
const ALIAS_FRONT: number = 1;

/** A ring shorter than this closes on a pole, where slopes run steep, mm. */
const CAP: number = 150;

/** Open join, mm. */
const GAP: number = 4;

/** Kink across a seam, degrees. */
const SEAM: number = 65;

/**
 * Kink at a fold by design, degrees: the armpit's front, which a heavy arm
 * deepens, and the crease beside the nose where the face's two chains meet.
 */
const ARMPIT_SEAM: number = 85;

/** Kink where the palm leaves the wrist, whose sections turn across the hand, degrees. */
const WRIST_SEAM: number = 96;

/** Station offset of the seam's tangents, mm. */
const REACH: number = 6;

/** Turn of the skin across a limb's or the trunk's join, degrees. */
const FOLD: number = 20;

/** Station offset either side of a join where its turn is read, mm. */
const FOLD_REACH: number = 4;

/** Station half step of a surface normal, mm. */
const NORMAL_STATION: number = 0.02;

/** Phase half step of a surface normal, radians. */
const NORMAL_PHASE: number = 1e-3;

/** Where the thigh's top is read under the crotch ring, a share of stature. */
const THIGH_TOP: number = 0.024;

/** Largest girth of the thigh's top per unit of the thigh tape. */
const THIGH_GIRTH: number = 1.15;

/** Skin depths either side of a joint over which the rig spreads its turn: its cut. */
const BEND: number = 1.5;

/**
 * Depth under the crotch ring where a leg's section is its own, mm: within it
 * the slit's pinch is a corner by design, as the event join's taper holds.
 */
const CORNER_FROM: number = 6;

/** Depth step of the corner rule, mm. */
const CORNER_STEP: number = 1;

/** Phases of a ring the corner rule reads: about a quarter millimetre apart. */
const CORNER_PHASES: number = 1440;

/** Samples either side of a pinch's nearest point the corner rule reads. */
const CORNER_REACH: number = 60;

/** Largest turn of the trunk's ring over one control pitch, degrees. */
const TEETH: number = 30;

/** Control pitches either side of a pinch where the teeth rule is not read. */
const TEETH_PINCH: number = 6;

/** Plane the rear is read in, a share of the crotch ring's half width. */
const SHELF_PLANE: number = 0.3;

/** Rise of the rear under the crotch ring per unit of its rise above. */
const SHELF: number = 2;

/** Depth per half width of the crotch ring's rear, one control from its tip. */
const TIP: number = 1.5;

/** Difference of the back's turn either side of the joint, degrees. */
const STEP: number = 4;

/** Height the back's turn is read over, mm. */
const STEP_REACH: number = 16;

/** Half arc round the back's midline that is read, radians. */
const STEP_ARC: number = 0.5;

/** Shares of stature under the crotch ring where a streak is read. */
const STREAK_SHARES: number[] = [0.04, 0.05];

/** Third difference round a leg's ring of 512 points, mm. */
const STREAK: number = 0.3;

/** Sides' difference under equal inputs, mm. */
const MIRROR: number = 1.5;

/** How far a limb may pass the midline, mm: the softness of the thighs' contact. */
const MIDLINE: number = 1.5;

/** Turn along a foot's longitudinal curve, degrees per radius of its ring. */
const RIB: number = 250;

/** Station step a rib is read at, mm. */
const RIB_STEP: number = 1;

/** Phases a rib is read at. */
const RIB_PHASES: number = 64;

/** A ring smaller than this is a cap's tip, whose curve turns by design, mm. */
const RIB_RADIUS: number = 3;

/** Shortest step along a curve that can show a rib, mm. */
const RIB_SEGMENT: number = 0.2;

/** Sharpest fold between a hand's neighbouring triangles, degrees. */
const HAND_TEAR: number = 110;

/** Layer intervals up the arm that count as the hand's skin. */
const HAND_ARM_LAYERS: number = 12;

/** Most a child's own end ring stands off the arc it inherits, mm. */
const HAND_JOIN: number = 1;

/** Fold past which a hand's edge counts toward a crumple, degrees. */
const HAND_SHARP: number = 30;

/** Radius of the patch in which sharp edges are counted, mm. */
const HAND_PATCH: number = 4;

/** Most sharp edges one patch of a hand may hold. */
const HAND_CRUMPLE: number = 8;

/** Share of a chain's median radius below which the surface skips a ring for its dome. */
const DOME_FLOOR: number = 0.35;

/** How far behind a web the ball is read, mm: past any toe's crease. */
const BALL_BACK: number = 6;

/** How far either side of a web its neighbouring skin is read, mm. */
const BALL_SIDE: number = 9;

/** Height of a groove in the ball that reads, mm. */
const BALL: number = 1;

/** Station step of the ball's skin, mm. */
const BALL_STEP: number = 0.5;

/** Phases of the ball's skin. */
const BALL_PHASES: number = 360;

/** Length of a chain read from its toe end, mm. */
const BALL_CHAIN: number = 60;

/** Angle a toe's dome may leave its tube at, degrees. */
const DOME: number = 15;
