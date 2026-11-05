import type { AutoMovieHumanFootConstruction } from "../AutoMovieHumanFootConstruction";
import { AutoMovieHumanFootPlaces } from "../AutoMovieHumanFootPlaces";
import { AutoMovieHumanReferenceOutlines } from "../AutoMovieHumanReferenceOutlines";
import { AutoMovieHumanTrunkRows } from "../AutoMovieHumanTrunkRows";
import { AutoMovieHumanFootPrior } from "../AutoMovieHumanFootPrior";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanDigitInterim } from "../limb/AutoMovieHumanDigitInterim";
import type { AutoMovieHumanDigitWalk } from "../limb/AutoMovieHumanDigitWalk";
import { AutoMovieHumanFootPart } from "./AutoMovieHumanFootPart";
import { AutoMovieHumanFootBreadth } from "./AutoMovieHumanFootBreadth";
import { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import type { AutoMovieHumanToePart } from "./AutoMovieHumanToePart";
import { type AutoMovieLoftContract, AutoMovieViewOutline, type IAutoMovieViewPart } from "@automovie/engine";

type Vec3 = [number, number, number];

/**
 * A foot and its toes from the person's foot dimensions and the reference set's
 * foot outline (`AutoMovieHumanReferenceOutlines.FOOT`: lateral and medial
 * edges about the heel-to-toe axis and the dorsum's and sole's heights, per
 * foot length; `AutoMovieHumanFootPlaces`: the foot's yaw, the ankle's place
 * along it, the toes' along maxima and across loop means; estimated from the private reference set, no
 * published source gives a foot's outline).
 *
 * The foot's axis turns out by its yaw from the heel, which stands behind the
 * ankle centre by the ankle's place. Its sites are the heel half-way to the
 * ankle's place, the ankle's place, the instep and the ball (`instepLength`,
 * `ballOfFootLength`), plus all distinct outline-table rows. The
 * axis stands at half the lowest dorsum among the sites, and each site's box
 * is the table's edges about the axis there. The forefoot closes half-way
 * from the ball to the shortest toe's tip, where the toes have taken over.
 *
 * Each toe runs from its retained cascade/root-u proxy to a generated distal apex. That apex
 * combines its retained foremost along reach with its first accepted loop's
 * vertex-mean across position: these are different observations, not a
 * measured three-dimensional tip or MTP/PIP/DIP landmarks.
 * Its breadth is a packing proxy: the mean gap to its neighbours' across means,
 * or the one gap at either end, since the toes fill the
 * forefoot side by side. Root depth reads the actual foot's whole vertical
 * dorsal support at its station, not surface contact at the root's across
 * place; using it as proximal toe depth remains a generating overlap proxy.
 * Distal depth belongs to the individual toe: the retained FootPrior D/B
 * ratio times its across-gap breadth in the original per-L pattern, before
 * the common transverse scale. That ratio's extraction site is unverified,
 * and its transfer to this foot-axis chart is a modelling proxy. The FOOT
 * dorsum envelope includes all toes and cannot supply an individual depth.
 * A fixed-height level axis and absolute plantar edge
 * preserve floor contact while these depths change. The midpoint and hidden inner start are generating stations,
 * not measured phalangeal joint centres; the latter remains owed.
 */
export namespace AutoMovieHumanFootInterim {
  /**
   * One generated toe attachment and its defining parallel-plane part, in calibration mm.
   * Root is a skin attachment proxy, and apex combines different retained
   * along/across observations; neither is a measured MTP or 3D tip.
   *
   * @evidence contracts/common.md#principled-implementation Keeps the actual generated attachment and distal proxy beside the parallel-plane source that consumes them.
   * @evidence contracts/common.md#clear-and-simple-design A point pair and its view input expose the skin source without inventing a skeletal landmark.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not label retained normalized placements or loop means as observed joint centres.
   * @evidence contracts/common.md#meaningful-documentation States calibration units, point provenance and the absence of anatomical joint identity.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A source record declares no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The owning define operation shares this record; the type coordinates no work.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The synchronous definition caller owns the points and walk.
   */
  export interface IToe {
    /** Generating axis centre on the retained metatarsal cascade, mm; not a surface-contact point or measured MTP. */
    root: Vec3;

    /** Generated distal proxy, not an independently observed 3D tip, mm. */
    apex: Vec3;

    /** The identical fixed foot-chart definition passed to the production toe builder. */
    part: AutoMovieHumanToePart.IInput;
  }

  /**
   * The foot input and all five toe sources sharing its actual floor frame
   * and metatarsal support origin, before loft or skin construction.
   *
   * @evidence contracts/common.md#principled-implementation Makes the actual foot's heel, axis and regional supports the source for every toe.
   * @evidence contracts/common.md#clear-and-simple-design Owns one foot input and five explicit attachment records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not recover placement from a generated course or reuse the old skeletal foot's different yaw and origin.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes source inputs from a realized foot, and skin attachments from skeletal centres.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This result type declares no runtime algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The define owner determines how the records are shared.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The generating call owns the finite result without global retention.
   */
  export interface IDefinition {
    /** The actual foot builder input, including its shared regional support datum. */
    foot: AutoMovieHumanFootPart.IInput;

    /** Hallux first, each with its actual generated attachment and walk. */
    toes: IToe[];

    /** Nonfatal attachment-premise diagnostics retained before any join or skin. An unavailable breadth source throws before a normalized record can be returned. */
    diagnostics: AutoMovieLoftContract.IDiagnostic[];
  }

  /**
   * Define the foot and its toe attachments in one shared source frame.
   * Head-u is transferred from its retained global forefoot support fraction,
   * not interpreted as a fraction of each root's local cut. This is a
   * normalized placement convention, not recovery of an old rigid frame.
   * One positive transverse scale closes the entire host-plus-toe source
   * region, because the retained FOOT envelope already includes toe loops.
   * Root-u first transfers into the retained host supports; after the common
   * scale it is not a newly measured fraction of the group's final extrema.
   *
   * @throws {Error} If a required source, affine/chart premise or positive finite group breadth is unavailable. This is a construction failure, not proof that a supplied anatomical measurement is invalid; no normalized definition or substituted shape is returned.
   *
   * @evidence contracts/common.md#principled-implementation Builds the actual foot input once, then derives each skin root and distal proxy in that input's heel/axis/support datum.
   * @evidence contracts/common.md#clear-and-simple-design A single result supplies the production foot and five digit builders with the same source objects.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no measured joint claim, person correction, old-frame registration, skin readback or root clamp.
   * @evidence contracts/common.md#meaningful-documentation States retained global head-u transfer and separates source skin points from skeletal landmarks and final support acceptance.
   * @evidence contracts/performance.md#efficient-algorithms Prepares a fixed-size unit-across source family, reads its shared continuous-source critical candidates once, then constructs that family's final scale without running a loft.
   * @evidence contracts/performance.md#reuse-equivalent-work Shares one frame, station plan and retained host-support preparation between the unit and final source definitions; all toes then share the final host record.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns call-owned records without a cache, sampler or realized skin reference.
   */
  export function define(name: "left" | "right", d: AutoMovieHumanFootConstruction.IDimensions, ankle: Vec3, measures: IAutoMovieHumanBodyMeasures, scale: number): IDefinition {
    const frame: IFrame = place(name, d, ankle, scale);
    const plan: IPlan = sourcePlan(d, measures, scale, frame.back);
    const support: ITransverse = acrossSupport(d, plan);
    // Across coordinates alone vary in this family. Along, Y, source
    // parameters and cap stations are independent of its positive scale.
    const unit: AutoMovieHumanFootPart.IInput = host(name, d, frame, plan, support, 1);
    const raw: AutoMovieHumanFootBreadth.ISupport | string = AutoMovieHumanFootBreadth.measure(unit, attachments(unit, []).map((toe: IToe): AutoMovieHumanToePart.IInput => toe.part));
    if (typeof raw === "string") throw new Error(`The ${name} metatarsal source cannot own public breadth: ${raw}`);
    const transverse: number = d.breadth / raw.breadth;
    if (!(transverse > 0) || !Number.isFinite(transverse)) throw new Error(`The ${name} metatarsal source needs a finite positive transverse scale`);
    const foot: AutoMovieHumanFootPart.IInput = host(name, d, frame, plan, support, transverse);
    const diagnostics: AutoMovieLoftContract.IDiagnostic[] = [];
    return { foot, toes: attachments(foot, diagnostics), diagnostics };
  }

  /**
   * The foot part's input.
   *
   * @param name The side.
   * @param d The foot's dimensions, calibration mm.
   * @param ankle The ankle centre.
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @returns The foot part's input.
   */
  export function of(name: "left" | "right", d: AutoMovieHumanFootConstruction.IDimensions, ankle: Vec3, measures: IAutoMovieHumanBodyMeasures, scale: number): AutoMovieHumanFootPart.IInput {
    return define(name, d, ankle, measures, scale).foot;
  }

  /** Construct the same source family at one across scale; public breadth belongs to the group, not this bare host. */
  function host(name: "left" | "right", d: AutoMovieHumanFootConstruction.IDimensions, frame: IFrame, plan: IPlan, support: ITransverse, transverse: number): AutoMovieHumanFootPart.IInput {
    const L: number = d.length;
    const T: typeof AutoMovieHumanReferenceOutlines = AutoMovieHumanReferenceOutlines;
    const read = (column: string, share: number): number => T.at(T.FOOT, column, share) * (column === "lateral" || column === "medial" ? transverse : L);

    // Keep each named measurement and every distinct outline-table row.
    const kept: [string, number][] = plan.named;
    const height: number = Math.min(...kept.map(([, s]: [string, number]): number => read("dorsum", s))) / 2;

    // Each site's box about the axis, its sides in the law's order (up,
    // lateral, down, medial).
    const sites: { site: string; law: AutoMovieHumanFootPart.ISiteLaw }[] = kept.map(([site, s]: [string, number]): { site: string; law: AutoMovieHumanFootPart.ISiteLaw } => ({
      site,
      law: { share: s, edges: [read("dorsum", s) - height, read("lateral", s), -height, -read("medial", s)], fullness: { shoulder: Math.SQRT2 - 1 }, plantarJet: { first: 0, second: 0 } },
    }));
    // A standing central sole is planar between its contact sites. Shared
    // zero jets express that plane; the closed scalar range includes both
    // heel/forefoot caps without altering a computed loft or skin point.
    return { name: `foot.${name}`, heel: frame.heel, along: frame.along, height, length: L, poles: [0, plan.end], sites, plantarRange: { minimum: -height, maximum: 0 }, metatarsal: { span: [plan.fifth * L, plan.first * L], breadth: d.breadth, supports: { lateral: support.lateral * transverse, medial: support.medial * transverse }, transverseScale: transverse }, side: name, order: 128, gap: AutoMovieHumanTrunkRows.MAX_GAP };
  }

  /**
   * The toes' walks, the hallux first.
   *
   * @param name The side.
   * @param d The foot's dimensions, calibration mm.
   * @param ankle The ankle centre.
   * @param measures The person's measures, world mm.
   * @param scale Calibration millimetres per world millimetre.
   * @returns Each toe's walk.
   */
  export function toes(name: "left" | "right", d: AutoMovieHumanFootConstruction.IDimensions, ankle: Vec3, measures: IAutoMovieHumanBodyMeasures, scale: number): AutoMovieHumanToePart.IInput[] {
    return define(name, d, ankle, measures, scale).toes.map((toe: IToe): AutoMovieHumanToePart.IInput => toe.part);
  }

  /** Generate skin attachments from the identical actual foot input, without a second placement or support solve. */
  function attachments(foot: AutoMovieHumanFootPart.IInput, diagnostics: AutoMovieLoftContract.IDiagnostic[]): IToe[] {
    const region: NonNullable<AutoMovieHumanFootPart.IInput["metatarsal"]> | undefined = foot.metatarsal;
    if (region === undefined) throw new Error("Toe attachments need the defining foot's metatarsal supports");
    const sign: number = foot.side === "left" ? 1 : -1;
    const lateral: Vec3 = [-sign * foot.along[2], 0, sign * foot.along[0]];
    const L: number = foot.length;
    const tips: readonly { tip: number; across: number }[] = AutoMovieHumanFootPlaces.TOES;
    // A maximum of population means need not equal the mean's unit maximum.
    // Treat this retained pattern as relative toe lengths, then let public
    // heel-to-longest-toe length own its actual longitudinal support.
    const longest: number = Math.max(...tips.map((tip: { tip: number }): number => tip.tip));
    const transverse: number = region.transverseScale;
    const dorsalSource: AutoMovieViewOutline.IOutline = sourceEdge(foot, 0);
    const lateralSource: AutoMovieViewOutline.IOutline = sourceEdge(foot, 1);
    const medialSource: AutoMovieViewOutline.IOutline = sourceEdge(foot, 3);
    const cascade: readonly number[] = AutoMovieHumanFootPrior.PRIOR.cascade;
    const stations: number[] = [region.span[1], region.span[1] + cascade[0]! * L / AutoMovieHumanFootPrior.CASCADE_FOOT];
    for (const drop of cascade.slice(1)) stations.push(stations.at(-1)! - drop * L / AutoMovieHumanFootPrior.CASCADE_FOOT);
    return tips.map((t: { tip: number; across: number }, k: number): IToe => {
      const gaps: number[] = [k > 0 ? t.across - tips[k - 1]!.across : null, k + 1 < tips.length ? tips[k + 1]!.across - t.across : null].filter((g: number | null): g is number => g !== null);
      const gap: number = gaps.reduce((a: number, g: number): number => a + Math.abs(g), 0) / gaps.length;
      const breadth: number = gap * transverse;
      const terminal: number = t.tip / longest;

      // The original toe pattern is normalized by L. Apply the retained
      // individual aspect before the group's across-only kappa, so changing
      // public B does not move the floor, cap stations or the Y family.
      // This is a source choice, not a recovered individual measurement.
      const distalDepth: number = AutoMovieHumanFootPrior.PRIOR.toes[k]!.depth * gap * L;
      const rootDepth: number = sourceValue(dorsalSource, stations[k]!) + foot.height;
      if (!(rootDepth > 0 && distalDepth > 0)) throw new Error(`The ${foot.side} toe ${k + 1} needs positive defining depths`);
      // The axis remains level while the two absolute dorsal edges vary.
      // A common plantar edge and its zero jets own floor contact; averaging
      // depth ratios would move that edge when the depths differ.
      const height: number = Math.min(rootDepth, distalDepth) / 2;
      const jets: NonNullable<AutoMovieHumanDigitWalk.ISiteLaw["jets"]> = [undefined, undefined, { first: 0, second: 0 }, undefined];
      const law = (depth: number): AutoMovieHumanDigitWalk.ISiteLaw => ({ breadth, depth, dorsal: 1 - height / depth, shoulder: Math.SQRT2 - 1, jets });
      const near: AutoMovieHumanDigitWalk.ISiteLaw = law(rootDepth);
      const far: AutoMovieHumanDigitWalk.ISiteLaw = law(distalDepth);
      const at = (along: number, across: number): Vec3 => [
        foot.heel[0] + foot.along[0] * along + lateral[0] * across,
        height,
        foot.heel[2] + foot.along[2] * along + lateral[2] * across,
      ];
      const rootAcross: number = -region.supports.medial + AutoMovieHumanFootPrior.PRIOR.toes[k]!.head * (region.supports.lateral + region.supports.medial);
      const root: Vec3 = at(stations[k]!, rootAcross);
      const localLateral: number = sourceValue(lateralSource, stations[k]!);
      const localMedial: number = sourceValue(medialSource, stations[k]!);
      if (!(rootAcross >= localMedial && rootAcross <= localLateral))
        diagnostics.push({ producer: `definition.toe.${foot.side}.${k + 1}`, level: 2, contract: "root axis centre inside parent source box", detail: `root across ${rootAcross} mm at ${stations[k]} mm lies outside [${localMedial}, ${localLateral}] mm; this necessary box check is not a surface-overlap or group-breadth proof` });
      const apex: Vec3 = at(terminal * L, t.across * transverse);
      // The observed foot-along chart owns the cap reach as well as width.
      // An oblique centreline's arclength would re-interpret that chart.
      const span: number = terminal * L - stations[k]!;
      if (!(span > distalDepth / 2)) throw new Error(`The ${foot.side} toe ${k + 1} has no shaft before its distal cap`);
      const tip: Vec3 = [apex[0] - (apex[0] - root[0]) * distalDepth / (2 * span), height, apex[2] - (apex[2] - root[2]) * distalDepth / (2 * span)];
      const mid: Vec3 = [(root[0] + tip[0]) / 2, height, (root[2] + tip[2]) / 2];
      const inside: Vec3 = [root[0] - (mid[0] - root[0]) / 2, height, root[2] - (mid[2] - root[2]) / 2];
      const profiles: AutoMovieHumanDigitWalk.IInput = AutoMovieHumanDigitInterim.walk(`toe.${foot.side}.${k + 1}`, [inside, root, mid, tip], [0, 1, 0], near, far);
      return { root, apex, part: { name: profiles.name, centres: profiles.centres, apex, along: foot.along, height, law: profiles.law, ranges: [undefined, undefined, { minimum: -height, maximum: 0 }, undefined], order: profiles.order, gap: profiles.gap } };
    });
  }

  /** Prepare the foot's exact named edge and closing poles through the shared scalar owner, before any loft is built. */
  function sourceEdge(foot: AutoMovieHumanFootPart.IInput, quarter: 0 | 1 | 3): AutoMovieViewOutline.IOutline {
    const bottom: number = foot.poles[0] * foot.length;
    const top: number = foot.poles[1] * foot.length;
    // FootPart owns the left/right chart swap; convert the anatomical side
    // back to that chart before asking its identical outline declaration.
    const chart: 0 | 1 | 3 = foot.side === "left" && quarter !== 0 ? quarter === 1 ? 3 : 1 : quarter;
    const declaration: IAutoMovieViewPart.IOutline = AutoMovieHumanSiteViewPart.outline(AutoMovieHumanFootPart.source(foot), chart);
    const source: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create(foot.side === "left" && quarter !== 0 ? AutoMovieViewOutline.scale(declaration, 1, -1) : declaration, { bottom, top });
    if ("detail" in source) throw new Error(`The defining foot edge failed: ${source.detail}`);
    return source;
  }

  /** Read the defining scalar source or retain its actual failure, never a table or sampled-ring fallback. */
  function sourceValue(source: AutoMovieViewOutline.IOutline, station: number): number {
    const value: number | string = AutoMovieViewOutline.value(source, station);
    if (typeof value === "string") throw new Error(`The defining foot edge failed at ${station} mm: ${value}`);
    return value;
  }

  /** A foot's frame on the floor. */
  interface IFrame {
    /** The heel's rearmost point on the floor. */
    heel: Vec3;

    /** The unit direction from the heel to the toes. */
    along: Vec3;

    /** The unit lateral direction on the floor. */
    lateral: Vec3;

    /** The ankle's place ahead of the heel, mm. */
    back: number;
  }

  /**
   * The foot's frame: the axis turned out by its yaw, the heel behind the
   * ankle centre by the ankle's place along the foot (`AutoMovieHumanFootPlaces`).
   *
   * @param name The side.
   * @param d The foot's dimensions, calibration mm.
   * @param ankle The ankle centre.
   * @param scale Calibration millimetres per world millimetre.
   * @returns The frame.
   */
  function place(name: "left" | "right", d: AutoMovieHumanFootConstruction.IDimensions, ankle: Vec3, scale: number): IFrame {
    const sign: number = name === "left" ? 1 : -1;
    const yaw: number = (AutoMovieHumanFootPlaces.YAW * Math.PI) / 180;
    const along: Vec3 = [Math.cos(yaw), 0, sign * Math.sin(yaw)];
    const back: number = AutoMovieHumanFootPlaces.ankle(d.length / scale) * scale;
    const heel: Vec3 = [ankle[0] - along[0] * back, 0, ankle[2] - along[2] * back];
    return { heel, along, lateral: [-sign * along[2], 0, sign * along[0]], back };
  }

  /**
   * Brannock horizontal breadth is the distance between across support
   * planes at the metatarsal heads, not one cut or their oblique chord
   * (ANSUR II handbook pp.83/84/112/113). The first head's public length and
   * the retained cascade convention bound the head region. The complete
   * retained host uses the same named knots and two-pole parameter as the
   * foot builder. These independent, dimensionless host supports transfer
   * head-u before the complete group's one common scale is solved. They are
   * not themselves the target public breadth. No section or skin is read.
   */
  function acrossSupport(d: AutoMovieHumanFootConstruction.IDimensions, plan: IPlan): ITransverse {
    const T: typeof AutoMovieHumanReferenceOutlines = AutoMovieHumanReferenceOutlines;
    const supportOf = (column: string): number => {
      const knots: IAutoMovieViewPart.IKnot[] = [{ site: "bottom pole", station: 0, value: 0 }, ...plan.named.map(([site, share]: [string, number]): IAutoMovieViewPart.IKnot => ({ site, station: share * d.length, value: T.at(T.FOOT, column, share) })), { site: "top pole", station: plan.end * d.length, value: 0 }];
      const source: AutoMovieViewOutline.IOutline | AutoMovieViewOutline.IFailure = AutoMovieViewOutline.create({ knots }, { bottom: 0, top: plan.end * d.length });
      if ("detail" in source) throw new Error(`The foot's ${column} source failed: ${source.detail}`);
      const from: number = plan.fifth * d.length;
      const to: number = plan.first * d.length;
      const stations: number[] = [from, to, ...AutoMovieViewOutline.criticalStations(source).filter((station: number): boolean => station > from && station < to)];
      return Math.max(...stations.map((station: number): number => {
        const value: number | string = AutoMovieViewOutline.value(source, station);
        if (typeof value === "string") throw new Error(`The foot's ${column} source support failed: ${value}`);
        return value;
      }));
    };
    const lateral: number = supportOf("lateral");
    const medial: number = supportOf("medial");
    const support: number = lateral + medial;
    if (!(support > 0)) throw new Error("The foot's metatarsal source supports must span positive breadth");
    return { lateral, medial };
  }

  /** Retained host's independent dimensionless regional supports, not the group's public breadth or one cut's radii. */
  interface ITransverse {
    /** Largest retained lateral support, before the common group scale. */ lateral: number;
    /** Largest retained medial support, before the common group scale. */ medial: number;
  }

  /** The exact stations and cap used by both source normalization and the actual foot builder. */
  interface IPlan {
    /** Named sites and table rows, strictly rising shares. */ named: [string, number][];
    /** Hidden forefoot cap share. */ end: number;
    /** Public first-ball skin station share. */ first: number;
    /** Fifth-ball station share, a retained cascade transfer convention. */ fifth: number;
  }

  /** Preserve every anatomical/table station once, so inserting the public ball or instep cannot make normalization use a different source spline. */
  function sourcePlan(d: AutoMovieHumanFootConstruction.IDimensions, measures: IAutoMovieHumanBodyMeasures, scale: number, back: number): IPlan {
    const L: number = d.length;
    const first: number = measures.ballOfFootLength * scale / L;
    const longest: number = Math.max(...AutoMovieHumanFootPlaces.TOES.map((tip: { tip: number }): number => tip.tip));
    const shortest: number = Math.min(...AutoMovieHumanFootPlaces.TOES.map((tip: { tip: number }): number => tip.tip / longest));
    const end: number = Math.max((first + shortest) / 2, first + AutoMovieHumanTrunkRows.MAX_GAP / L);
    const named: [string, number][] = [["heel", back / L / 2], ["ankle", back / L], ["instep", measures.instepLength * scale / L], ["ball", first], ...AutoMovieHumanReferenceOutlines.FOOT.rows.filter((row: AutoMovieHumanReferenceOutlines.IRow): boolean => row.share > 0 && row.share < end).map((row: AutoMovieHumanReferenceOutlines.IRow): [string, number] => [`outline ${row.share}`, row.share])];
    named.sort((a: [string, number], b: [string, number]): number => a[1] - b[1]);
    const kept: [string, number][] = named.filter((row: [string, number], index: number): boolean => index === 0 || row[1] !== named[index - 1]![1]);
    const cascade: readonly number[] = AutoMovieHumanFootPrior.PRIOR.cascade;
    const fifth: number = first + (cascade[0]! - cascade.slice(1).reduce((sum: number, value: number): number => sum + value, 0)) / AutoMovieHumanFootPrior.CASCADE_FOOT;
    return { named: kept, end, first, fifth };
  }
}
