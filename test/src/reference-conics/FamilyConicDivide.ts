import { AutoMovieConstructionSkinCut, AutoMovieConstructionSplitCompose, AutoMovieLoftViewFullSource } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1, AutoMovieHumanF1Divide, AutoMovieHumanLandmarkSurface } from "@automovie/human";
import type { IAutoMovieConstructionNode, IAutoMovieConstructionSplit, IAutoMovieViewPart } from "@automovie/interface";

import { FamilyConicLoop } from "./FamilyConicLoop";
import type { FamilyConicSource as R } from "./FamilyConicSource";
import { FamilyConicThumbRoot } from "./FamilyConicThumbRoot";

/**
 * Every surface that divides f1's skin between two neighbouring parts, read on the reference's own joints.
 *
 * A fit keeps, for each part, the skin on its own side of every surface it shares with a neighbour, and closes its sections past the
 * surface by a closure that is no observation (`FamilyConicBody.ts`, `opening` with `around`). Two neighbours therefore fit no skin
 * twice and leave none out, provided both read the same surface with opposite signs, and the figure's tree joins them on that same
 * surface. The rules are the Human package's (`AutoMovieHumanF1Divide`, which states each); this module only hands them the
 * reference's joint centres under the fit's part names, so the fit and the tree read one declaration. `FamilyConicBody.ts --divides`
 * counts on the reference's vertices the skin two neighbours both keep and the skin neither keeps
 * (`packages/human/docs/techniques/joints-one-shot.md`, The hypotheses).
 */
export namespace FamilyConicDivide {
  type V = R.V;

  /** One dividing surface (`AutoMovieHumanF1Divide.ISurface`). */
  export type ISurface = AutoMovieHumanF1Divide.ISurface;

  /** A parent's section plane where its children part from it (`AutoMovieHumanF1Divide.IEnd`). */
  export type IEnd = AutoMovieHumanF1Divide.IEnd;

  /** How near the shoulder joint the armscye's surface divides, mm. */
  export const ARMSCYE_MM: number = AutoMovieHumanF1Divide.ARMSCYE_MM;

  /** The fingers in their row's order, from the little one, by their joints' names in the reference. */
  export const FINGERS: readonly string[] = ["pinky", "ring", "middle", "index"];

  /** The toes in their row's order, from the little one, by their joints' names in the reference. */
  export const TOES: readonly string[] = ["littletoe", "ringtoe", "middletoe", "indextoe", "bigtoe"];

  /** A digit's part name in `FamilyConicBody.ts`. */
  export const part = (digit: string): string =>
    FINGERS.includes(digit) || digit === "thumb" ? "finger." + digit : "toe." + ({ littletoe: "little", ringtoe: "ring", middletoe: "middle", indextoe: "index", bigtoe: "big" } as Record<string, string>)[digit]!;

  /**
   * Every dividing surface of the stored side, on the reference.
   *
   * @param source The reference: its joint centres.
   * @param armscye The armscye's landmark surface on the reference's skin.
   * @param foot The trunk's foot, mm of height: its family's first station on its course.
   * @param ends The arm's section plane at its end, and the hand's and the leg's where their digits part from them: a point and the course's direction.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Every rule is `AutoMovieHumanF1Divide.create`'s; this function names the reference's joints that enter each.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record of joints and one call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate is read off a fit or a render; a missing joint is refused by name; the sole's normal is the floor's, the reference standing on it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work besides the caller's landmark surface.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The landmark surface is built once and passed in by the caller that also clips by it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the package's closures.
   * @evidence contracts/development/common.md#meaningful-documentation States what each argument is read for.
   */
  export function build(source: R.ISource, armscye: FamilyConicLoop.ILoop, foot: number, ends: { hand: IEnd; foot: IEnd; wrist: IEnd; hip?: IEnd }): ISurface[] {
    const joint = (name: string): V => {
      const p: V | undefined = source.joints.get(name);
      if (p === undefined) throw new Error("divide: the reference has no joint " + name);
      return p;
    };
    const digit = (name: string): AutoMovieHumanF1Divide.IDigit => ({ part: part(name), first: joint(name + "_01_r"), second: joint(name + "_02_r") });
    // The thumb's root: the landmark surface through its four landmarks on the reference's skin about its metacarpophalangeal centre,
    // its far side toward the thumb's next joint. It divides skin inside the ball about that centre that holds its landmarks and,
    // past it, inside the tube about the thumb's course that the landmarks' ring spans.
    const root: FamilyConicThumbRoot.IRoot = FamilyConicThumbRoot.read(source);
    const landmarks: V[] = root.landmarks.map(([name, p]: [string, V | null]): V => {
      if (p === null) throw new Error("divide: the thumb root's landmark " + name + " met no skin");
      return p;
    });
    const thumbRoot: AutoMovieHumanLandmarkSurface.ISurface = AutoMovieHumanLandmarkSurface.create(root.centre, landmarks, root.toward);
    // A landmark's distance from the line a part's course starts along: the root ring's radius about the course, which bounds the
    // part's own skin about it.
    const off = (p: readonly number[], a: V, b: V): number => {
      const e: V = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const t: number = ((p[0]! - a[0]) * e[0] + (p[1]! - a[1]) * e[1] + (p[2]! - a[2]) * e[2]) / (e[0] * e[0] + e[1] * e[1] + e[2] * e[2]);
      return Math.hypot(p[0]! - a[0] - t * e[0], p[1]! - a[1] - t * e[1], p[2]! - a[2] - t * e[2]);
    };
    const armCourse: V[] = [joint("upperarm_r"), joint("lowerarm_r"), joint("hand_r")];
    const surfaces: ISurface[] = AutoMovieHumanF1Divide.create({
      armscye: { side: armscye.side, centre: armCourse[0]!, reach: ARMSCYE_MM, course: armCourse, tube: Math.max(...armscye.landmarks.map((p: number[]): number => off(p, armCourse[0]!, armCourse[1]!))), part: "arm" },
      wrist: joint("hand_r"),
      thumb: { side: thumbRoot.side, centre: root.centre, reach: Math.max(...landmarks.map((p: V): number => Math.hypot(p[0] - root.centre[0], p[1] - root.centre[1], p[2] - root.centre[2]))), course: [root.centre, root.toward], tube: Math.max(...landmarks.map((p: V): number => off(p, root.centre, root.toward))), part: part("thumb") },
      fingers: FINGERS.map(digit),
      toes: TOES.map(digit),
      sole: [0, 1, 0],
      hip: joint("thigh_r"),
      foot,
      ends,
      parts: { trunk: "trunk", arm: "arm", hand: "hand", leg: "leg", twin: "leg.mirror" },
    });
    const hip: IEnd | undefined = ends.hip;
    return hip === undefined ? surfaces : surfaces.map((surface): ISurface => surface.name !== "hip" ? surface : {
      ...surface,
      anchor: hip.point,
      side: (p: readonly number[]): number =>
        hip.normal[0] * (p[0]! - hip.point[0]) + hip.normal[1] * (p[1]! - hip.point[1]) + hip.normal[2] * (p[2]! - hip.point[2]),
    });
  }

  /**
   * Read fitting planes and source addresses once from the ordinary production construction, keeping each actual child cut result.
   * Every composed plane here must be the exact host end section it would use in the engine. No joint offset or numerical fix is supplied.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The same authored split, complete source chart and positive host end normal supply the section used by Compose and the complementary reference clips.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A source with a different actual plane or no compatible cut keeps an exact refusal; no fitting, retry or alternate axis is used.
   */
  export function composed(name: string, requested: string) {
    const prepared = composition(name);
    return { ...prepared.member(requested), cuts: prepared.readCuts() };
  }

  /** Gather the fixed parent plane, ordered children and registered original names once for the complete solve. */
  export function composition(name: string) {
    const figure = AutoMovieHumanF1.assemble();
    // The tree alone first (no source lofted), to find the owner; then the sources of the owner's host and children alone. The foot's
    // height and the three composed ends' planes, which place the registry's dividing planes, are read on the hosts' courses at their end
    // stations (`AutoMovieHumanF1.endStations`). The whole body's sources belong to the figure, not to a joint's start.
    const tree = AutoMovieHumanF1.constructionOf(figure, new Set());
    const splits = new Map<string, IAutoMovieConstructionSplit>();
    const find = (node: IAutoMovieConstructionNode): void => {
      if (node.type === "split") splits.set(node.name, node);
      if ("host" in node) find(node.host);
      if ("part" in node) find(node.part);
      if (node.type === "split") for (const child of node.children) find(child.part);
    };
    find(tree.root);
    const own = splits.get(name);
    if (own === undefined) throw new Error("the actual composer is absent: " + name);
    const faces = new Set<string>([own.hostFace, ...own.children.map((entry): string => entry.partFace)]);
    const declared = AutoMovieHumanF1.constructionOf(figure, faces);
    const stations = AutoMovieHumanF1.endStations(figure);
    const nodes = new Map<string, IAutoMovieConstructionNode>();
    const visit = (node: IAutoMovieConstructionNode): void => {
      nodes.set(node.name, node);
      if ("host" in node) visit(node.host);
      if ("part" in node) visit(node.part);
      if (node.type === "split") for (const child of node.children) visit(child.part);
    };
    visit(declared.root);
    const source = (face: string): IAutoMovieViewPart => {
      const found = declared.sources.get(face);
      if (found === undefined) throw new Error("the actual source is absent: " + face);
      return found;
    };
    const end = (node: IAutoMovieConstructionSplit): IEnd => {
      const rule = node.compose;
      if (rule === undefined || rule.frame !== "host" || rule.plane.point.some((x: number): boolean => x !== 0) ||
          rule.plane.normal[0] !== 0 || rule.plane.normal[1] !== 0 || rule.plane.normal[2] !== 1)
        throw new Error(node.name + " does not compose the actual terminal section plane");
      // The end plane is the host course's section at its end station (`AutoMovieHumanF1.endStations`), read on the course alone, so
      // no host is lofted for it.
      const family = figure.families.find((item): boolean => item.name === node.hostFace);
      if (family === undefined) throw new Error(node.name + " has no placed host family " + node.hostFace);
      const into: 1 | -1 = node.hostEnd === "top" ? 1 : -1;
      const station: number = node.hostFace === figure.body.hand.name ? stations.hand : node.hostFace === figure.body.leg.name ? stations.foot : stations.pelvis;
      const frame = AutoMovieHumanConicLoft.axis(family).at(station);
      const basis = AutoMovieConstructionSplitCompose.basis(frame, into);
      if (basis === null) throw new Error(node.name + " has no regular terminal section");
      return { point: basis.origin, normal: basis.z };
    };
    const split = (owner: string): IAutoMovieConstructionSplit => {
      const node = nodes.get(owner);
      if (node?.type !== "split") throw new Error("the actual composer is absent: " + owner);
      return node;
    };
    const owner = split(name);
    const parents = new Map<string, string>();
    for (const { family, mirrored } of AutoMovieHumanF1.FAMILIES) {
      parents.set(family.name, family.name);
      if (mirrored) parents.set(family.name + ".mirror", family.name);
    }
    const originalOf = (face: string): string => {
      const original = parents.get(face);
      if (original === undefined || !declared.sources.has(face)) throw new Error("unregistered original for source face " + face);
      return original;
    };
    const plane = end(owner);
    // Only the single-child entrance asks whether the ordinary installed sources already cross the plane.
    // Group fitting prepares their restored sources separately and observation has its own complete incidence read.
    const readCuts = () => owner.children.map((entry) => {
      try {
        const view = source(entry.partFace);
        const actual = AutoMovieLoftViewFullSource.create(view);
        const domain: [number, number] = [actual.domain[0], actual.domain[1]];
        const into: 1 | -1 = entry.partEnd === "bottom" ? 1 : -1;
        const cut = AutoMovieConstructionSkinCut.create({
          surface: { name: view.name, domain, period: 2 * Math.PI, orientation: 1, jet: actual.jet },
          planes: [plane],
          into,
          stations: view.stations.filter((s: number): boolean => s >= domain[0] && s <= domain[1]),
          samples: owner.count,
        });
        return { name: view.name, refusal: typeof cut === "string" ? cut : null };
      } catch (error: unknown) {
        return { name: entry.partFace, refusal: error instanceof Error ? error.message : String(error) };
      }
    });
    const common = {
      foot: AutoMovieHumanConicLoft.axis(figure.body.trunk).at(figure.body.trunk.knots[0]!).origin[1],
      ends: {
        hand: end(split("fan.hand")),
        foot: end(split("fan.leg")),
        hip: end(split("crotch")),
        wrist: AutoMovieHumanF1.wristPlane(AutoMovieHumanConicLoft.axis(figure.body.hand)),
      },
    };
    return { ...common, owner, plane, figure, source, originalOf, readCuts,
      member: (requested: string) => {
        if (!owner.children.some((child): boolean => child.partFace === requested))
          throw new Error(requested + " is not an authored child of " + name);
        const family = figure.families.find((item): boolean => item.name === requested);
        if (family === undefined || family.origin !== undefined)
          throw new Error("the fit reader lacks the placed original chart " + requested);
        return { ...common, family, first: source(requested).stations[0]! };
      },
    };
  }

  /** How far a point stands outside a part's own skin, mm, positive outside (`AutoMovieHumanF1Divide.outside`). */
  export const outside: (surfaces: readonly ISurface[], name: string) => (p: V) => number = AutoMovieHumanF1Divide.outside;
}
