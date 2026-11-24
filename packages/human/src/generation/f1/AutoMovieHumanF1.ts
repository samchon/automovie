import { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanBoundSection } from "../conic/AutoMovieHumanBoundSection";
import { AutoMovieHumanConicSection } from "../conic/AutoMovieHumanConicSection";
import { AutoMovieHumanJoinLoop } from "../conic/AutoMovieHumanJoinLoop";
import { AutoMovieHumanLayerTurn } from "../conic/AutoMovieHumanLayerTurn";
import { AutoMovieHumanTipDome } from "../conic/AutoMovieHumanTipDome";
import { AutoMovieHumanChainTopology } from "../frame/AutoMovieHumanChainTopology";
import {
  AutoMovieHumanHipSupportPlacement,
} from "../frame/AutoMovieHumanHipSupportPlacement";
import { AutoMovieHumanSegmentFrame as F } from "../frame/AutoMovieHumanSegmentFrame";
import { AutoMovieHumanF1Antihelix } from "./AutoMovieHumanF1Antihelix";
import { AutoMovieHumanF1Arm } from "./AutoMovieHumanF1Arm";
import { AutoMovieHumanF1ArmEnd } from "./AutoMovieHumanF1ArmEnd";
import { AutoMovieHumanF1Armscye } from "./AutoMovieHumanF1Armscye";
import { AutoMovieHumanF1Axilla } from "./AutoMovieHumanF1Axilla";
import { AutoMovieHumanF1Breast } from "./AutoMovieHumanF1Breast";
import { AutoMovieHumanF1Centres } from "./AutoMovieHumanF1Centres";
import { AutoMovieHumanF1Concha } from "./AutoMovieHumanF1Concha";
import { AutoMovieHumanF1DigitSources } from "./AutoMovieHumanF1DigitSources";
import { AutoMovieHumanF1Divide } from "./AutoMovieHumanF1Divide";
import { AutoMovieHumanF1Hand } from "./AutoMovieHumanF1Hand";
import { AutoMovieHumanF1Helix } from "./AutoMovieHumanF1Helix";
import { AutoMovieHumanF1Leg } from "./AutoMovieHumanF1Leg";
import { AutoMovieHumanF1Mammary } from "./AutoMovieHumanF1Mammary";
import { AutoMovieHumanF1Nails } from "./AutoMovieHumanF1Nails";
import { AutoMovieHumanF1NativeLaw } from "./AutoMovieHumanF1NativeLaw";
import { AutoMovieHumanF1NativeSites } from "./AutoMovieHumanF1NativeSites";
import { AutoMovieHumanF1Nose } from "./AutoMovieHumanF1Nose";
import { AutoMovieHumanF1Nostril } from "./AutoMovieHumanF1Nostril";
import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";
import { AutoMovieHumanF1Placing } from "./AutoMovieHumanF1Placing";
import { AutoMovieHumanF1Plate } from "./AutoMovieHumanF1Plate";
import { AutoMovieHumanF1RootControls } from "./AutoMovieHumanF1RootControls";
import { AutoMovieHumanF1RootRails } from "./AutoMovieHumanF1RootRails";
import { AutoMovieHumanF1SegmentLengths } from "./AutoMovieHumanF1SegmentLengths";
import { AutoMovieHumanF1SourceScope } from "./AutoMovieHumanF1SourceScope";
import { AutoMovieHumanF1ThumbRoot } from "./AutoMovieHumanF1ThumbRoot";
import { AutoMovieHumanF1Trunk } from "./AutoMovieHumanF1Trunk";
import {
  AutoMovieLoftAdmissionError,
  AutoMovieLoftChain,
  AutoMovieLoftViewFullSource,
  AutoMovieNaturalSpline,
  AutoMovieSolidVector,
  AutoMovieViewLoft,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionBandProfile,
  IAutoMovieConstructionFoldWidth,
  IAutoMovieConstructionNode,
  IAutoMovieConstructionPortLoop,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSharedLoop,
  IAutoMovieLoftSectionConnect,
  IAutoMovieConstructionSplit,
  IAutoMovieHumanBodyIdentity,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
  IAutoMovieHumanJoinLoop,
  IAutoMovieHumanF1Nails,
  IAutoMovieHumanF1NativeLaw,
  IAutoMovieHumanF1NativeRoot,
  IAutoMovieHumanF1Placement,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieHumanSegmentJoint,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewLoft,
  IAutoMovieViewPart,
} from "@automovie/interface";

/**
 * The f1 figure in its reference pose, generated from its authored conic
 * families alone: no reference mesh, recovered curve or observation file is
 * read anywhere on this path.
 *
 * The body is one sewn skin, built by the engine's construction operators:
 * the trunk from the crotch to the crown, the nose's free end, and on each
 * side an arm that runs from the armpit's sagittal plane round the shoulder
 * and through the wrist to the finger webs, a leg that runs from below the
 * crotch round the ankle to the toe webs, an ear, five fingers and five toes.
 * The trunk's open lower end is split into the two legs along the midsagittal
 * chord, and each arm, each breast and the nose is attached at a port on the
 * trunk; those bands span from a curve on the trunk to a ring of the part and
 * meet both G2 without a traced intersection. Each finger and toe is a
 * capsule merged onto its limb's cap along the curve where it comes out, and
 * each ear is its plate with the helix and the antihelix merged on it as
 * tubes, merged onto the head along the curve round the plate's root. The
 * crown, each hand, each foot, each ear, the nose and each digit close in a
 * pole.
 *
 * The hand's sections leave out the thumb past where it stands free, as the
 * trunk's leave out the arms, the ears and the nose. The face's eyes and
 * mouth are height fields over the trunk's wall. A hollow with a wall of its
 * own is a loft cut out: each nostril and each ear's bowl from the head.
 *
 * Every family is placed through f1's segment frames (`assemble`): its course, its chart's `up` and its reliefs' directions are stored in
 * the frames of the segments they belong to (`AutoMovieHumanF1Placing`) and mapped to the figure's frame at a pose, the reference pose
 * unless another is given. Whatever reads the figure's frame here (the port loops, the fan seams, the fills) reads it through those frames.
 */
export namespace AutoMovieHumanF1 {

  /** The families the sewn body is built from. */
  export const BODY: IAutoMovieHumanF1.IBody = {
    trunk: AutoMovieHumanF1Trunk,
    arm: AutoMovieHumanF1Arm,
    hand: AutoMovieHumanF1Hand,
    leg: AutoMovieHumanF1Leg,
    ear: AutoMovieHumanF1Plate,
    nose: AutoMovieHumanF1Nose,
    breast: AutoMovieHumanF1Breast,
  };

  /** Canonical stored digit producers, before the W3 dome. */
  export const PRE_DOME_DIGITS: readonly IAutoMovieHumanF1.IDigit[] = AutoMovieHumanF1DigitSources;

  /**
   * Long-axis dome shares of the fingers (the thumb with them) and of the toes: the dome's length over the section's mean reach where it
   * starts. Flattened rules (rule-basis.md, "Flattened rules", "Measured on an open asset": the MPFB2 base mesh, commit 9de0707f, CC0):
   * one share for the five fingers and one for the toes, the asset's means, good to about 0.3; ESTIMATE, the frames decide. They replace
   * f1's fitted 1.5, 1.1 and 0.8.
   */
  const FINGER_DOME: number = 1.35;
  const TOE_DOME: number = 1.0;

  /** Apply the dome law to the selected, complete distal record. */
  function digitDome(
    family: IAutoMovieHumanConicLoft.IFamily,
    share: number,
  ): IAutoMovieHumanConicLoft.IFamily {
    const top: IAutoMovieHumanConicLoft.ITip = family.tips![1]!;
    const last: number = family.knots.at(-1)!;
    const reach = (station: number): number => AutoMovieHumanConicLoft.meanReach(family, station);
    const start = AutoMovieHumanTipDome.start(reach, top.tip, share, family.knots[1]!);
    if (start.held)
      throw new Error(family.name + ": dome start held at " + start.from + " mm");
    return { ...family, tips: [family.tips![0], { ...top, from: Math.min(start.from, last) }] };
  }

  /** The authored digits with their actual W3 cap starts. */
  export const DIGITS: readonly IAutoMovieHumanF1.IDigit[] = PRE_DOME_DIGITS.map(authoredDigit);

  function authoredDigit(digit: IAutoMovieHumanF1.IDigit): IAutoMovieHumanF1.IDigit {
    return { ...digit, family: digitDome(digit.family, digit.limb === "leg" ? TOE_DOME : FINGER_DOME) };
  }

  /** The families not sewn: none now. A loose family is emitted as a closed tube of its own, carried by its reach under its neighbour's skin. */
  export const LOOSE: readonly IAutoMovieHumanF1.IMember[] = [];

  /** Every authored family of the figure. */
  export const FAMILIES: readonly IAutoMovieHumanF1.IMember[] = [
    { family: BODY.trunk, mirrored: false },
    { family: BODY.arm, mirrored: true },
    { family: BODY.hand, mirrored: true },
    { family: BODY.leg, mirrored: true },
    { family: BODY.ear, mirrored: true },
    { family: AutoMovieHumanF1Helix, mirrored: true },
    { family: AutoMovieHumanF1Antihelix, mirrored: true },
    { family: BODY.nose, mirrored: false },
    { family: BODY.breast, mirrored: true },
    ...DIGITS.map(
      (digit: IAutoMovieHumanF1.IDigit): IAutoMovieHumanF1.IMember => ({ family: digit.family, mirrored: true }),
    ),
    ...LOOSE,
  ];

  /**
   * Every stored cutter of the figure: the armpit's slit, each ear's bowl and each nostril are lofts cut out of the skin (`construction`),
   * so `FAMILIES` does not hold them. Each is listed as stored, with `cut`, the family the figure lofts from it: the nostril is drawn in by
   * its rim and spread past its mouth (`drawnIn`, `spreadOut`), the others are cut as stored. A reader that changes a cutter's stored
   * fields reads through `cut` the wall the figure would cut with them.
   */
  export const CUTTERS: IAutoMovieHumanF1.Cutters = [
    {
      family: AutoMovieHumanF1Axilla,
      mirrored: true,
      cut: (
        family: IAutoMovieHumanConicLoft.IFamily,
      ): IAutoMovieHumanConicLoft.IFamily => family,
    },
    {
      family: AutoMovieHumanF1Concha,
      mirrored: true,
      cut: (
        family: IAutoMovieHumanConicLoft.IFamily,
      ): IAutoMovieHumanConicLoft.IFamily => family,
    },
    {
      family: AutoMovieHumanF1Nostril,
      mirrored: true,
      cut: (
        family: IAutoMovieHumanConicLoft.IFamily,
      ): IAutoMovieHumanConicLoft.IFamily =>
        spreadOut(
          drawnIn(family, nostrilRim(family)),
          NOSTRIL_MOUTH_MM,
          NOSTRIL_SPREAD_MM,
        ),
    },
  ];

  /**
   * Place every family of the figure at a pose: each family's course, `up` and relief directions are read from the re-based table through
   * the chain of segment frames (`AutoMovieHumanF1Placement.place`), and its section table is carried untouched. Where the pose changes
   * a course's joint angles its turns keep their set-backs, its stations are mapped and its chart takes its joints' twist
   * (`AutoMovieHumanConicPose`). With neither pose nor chain supplied, every family is its stored module number for number. A twin is not placed: it is the reflection of its placed
   * side in the median plane, as before.
   *
   * Custom inputs preserve the fixed bilateral figure plane z=0 through the
   * central pelvis/thorax/head frames, their courses/datums and the pose. The
   * existing world reflection, fan and fill definitions do not support an
   * arbitrary global rigid transform. This is a producer premise, not a claim
   * established by checking only the root or the logical topology.
   *
   * @param pose One rotation per joint by segment name; a joint it leaves undefined keeps its reference rotation.
   * @param chain Complete, unique stored name/parent topology with changed offsets/reference rotations under the fixed-figure-frame premise; absent, the stored chain.
   * @evidence contracts/development/implementation.md#principled-implementation Composes one invocation chain and poses each stored source family through those same frames, retaining its original family and actual station map for every downstream consumer.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One place closure records original and resolved identities together; constructionFrom consumes the returned complete assembly without another placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Topology admission refuses missing, additional, duplicate or reparented joints before frame composition. It does not certify the fixed bilateral frame. Missing original identities and station maps are refused; anatomical tables and priors remain f1-specific.
   * @evidence contracts/development/common.md#meaningful-documentation States logical-chain premises, reference default, actual transport and the original versus resolved family distinction.
   * @evidence contracts/development/implementation.md#efficient-algorithms One frame composition and one placement per family retain the existing costs; two invocation maps have one entry per original family.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every root, descendant datum and source consumer shares the same prepared frames and station maps; the unposed stored chain reuses its exact reference frames.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned closures retain the invocation's bounded family maps and frames, released with the assembly and its readers; original source records are borrowed immutably.
   */
  export function assemble(
    pose?: IAutoMovieHumanF1Placement.IPose,
    chain?: readonly IAutoMovieHumanSegmentJoint[],
    originals?: ReadonlyMap<string, IAutoMovieHumanConicLoft.IFamily>,
  ): IAutoMovieHumanF1.IAssembly {
    if (originals === undefined) return resolve(pose, chain, true);
    const selected = new Map(originals);
    for (const [name, family] of selected)
      if (name !== family.name || !FAMILIES.some((member): boolean => member.family.name === name))
        throw new Error("assemble: the selected canonical family identity is unknown or inconsistent: " + name);
    for (const [name, family] of selected) selected.set(name, originalStock(family));
    return resolve(pose, chain, true, undefined, (name: string) => selected.get(name));
  }

  /** Apply the assembly's existing protected distal cap law to a replaced authored stock. */
  function originalStock(family: IAutoMovieHumanConicLoft.IFamily): IAutoMovieHumanConicLoft.IFamily {
    const digit: IAutoMovieHumanF1.IDigit | undefined =
      PRE_DOME_DIGITS.find((entry): boolean => entry.family.name === family.name);
    return digit === undefined ? family : authoredDigit({ ...digit, family }).family;
  }

  /**
   * Replace one canonical source in an ordinary neutral assembly using the same placement and station transport.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The neutral reference frames are shared. The selected family applies the same protected cap and repose laws as assemble and owns its new reference and placement maps.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One prepared stock replaces the named members of an otherwise borrowed assembly.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-reference frame bank, native material, or unknown stock refuses. Unchanged sources borrow the original assembly's families, stations and datum closures.
   * @evidence contracts/development/common.md#meaningful-documentation Names the neutral scope, canonical input and source transport.
   * @evidence contracts/development/implementation.md#efficient-algorithms One actual repose and a linear pass through the fixed family roster.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work No unchanged family's disjoint source or frame is recomputed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned call-owned record borrows the baseline and one selected family's maps.
   */
  export function replaceNeutralOriginal(
    baseline: IAutoMovieHumanF1.IAssembly,
    family: IAutoMovieHumanConicLoft.IFamily,
  ): IAutoMovieHumanF1.IAssembly {
    const name: string = family.name;
    if (baseline.frames !== AutoMovieHumanF1Placement.REFERENCE || family.native !== undefined ||
        !baseline.families.some((old): boolean => old.name === name) ||
        baseline.families.some((old): boolean => old.native !== undefined))
      throw new Error("a neutral source replacement requires the ordinary original bank: " + name);
    const stock: IAutoMovieHumanConicLoft.IFamily = originalStock(family);
    const placed: ReturnType<typeof AutoMovieHumanF1Placement.repose> = AutoMovieHumanF1Placement.repose(stock, baseline.frames);
    const replace = (value: IAutoMovieHumanConicLoft.IFamily): IAutoMovieHumanConicLoft.IFamily =>
      value.name === name ? placed.family : value;
    const body: IAutoMovieHumanF1.IAssembly["body"] = { ...baseline.body };
    for (const key of Object.keys(body) as (keyof typeof body)[]) body[key] = replace(body[key]);
    return {
      ...baseline,
      body,
      digits: baseline.digits.map((digit): IAutoMovieHumanF1.IDigit =>
        digit.family.name === name ? { ...digit, family: placed.family } : digit),
      helix: replace(baseline.helix), antihelix: replace(baseline.antihelix), axilla: replace(baseline.axilla),
      concha: replace(baseline.concha), nostril: replace(baseline.nostril),
      families: baseline.families.map(replace),
      reference: (source: string): IAutoMovieHumanConicLoft.IFamily => source === name ? stock : baseline.reference(source),
      station: (source: string, from: number, length?: number): number => {
        if (source !== name) return baseline.station(source, from, length);
        const map: ((station: number) => number) | null = placed.station;
        return length === undefined ? map === null ? from : map(from) :
          map === null ? length : map(from + length) - map(from);
      },
    };
  }

  /**
   * Same frame/source composer; legacy compatibility and native prior stages resolve roots separately.
   *
   * `locals` gives a person's coordinates of the stored datums in their segments' frames (`AutoMovieHumanF1Centres.local`): with it
   * every course centre and datum is read at the person, and each family keeps its stations as the reference's material coordinate
   * (`AutoMovieHumanConicPose.repose`, `"material"`). A posed person is refused: the pose map and the material map are not composed yet.
   */
  function resolve(
    pose: IAutoMovieHumanF1Placement.IPose | undefined,
    chain: readonly IAutoMovieHumanSegmentJoint[] | undefined,
    legacy: boolean,
    locals?: IAutoMovieHumanF1Placement.ILocals,
    reference?: (name: string) => IAutoMovieHumanConicLoft.IFamily | undefined,
  ): IAutoMovieHumanF1.IAssembly {
    if (pose !== undefined && locals !== undefined)
      throw new Error(
        "assemble: a person's segment lengths are not carried through a pose yet",
      );
    const frames: IAutoMovieHumanF1Placement.IFrames =
      AutoMovieHumanF1Placement.frames(
        pose,
        AutoMovieHumanChainTopology(
          AutoMovieHumanF1Placing.CHAIN,
          chain ?? AutoMovieHumanF1Placing.CHAIN,
        ),
      );
    const maps: Map<string, ((station: number) => number) | null> = new Map();
    const references: Map<string, IAutoMovieHumanConicLoft.IFamily> = new Map();
    const place = (
      family: IAutoMovieHumanConicLoft.IFamily,
    ): IAutoMovieHumanConicLoft.IFamily => {
      const stock: IAutoMovieHumanConicLoft.IFamily = reference?.(family.name) ?? family;
      if (stock.name !== family.name)
        throw new Error("assemble: original material family identity differs for " + family.name);
      const posed: {
        family: IAutoMovieHumanConicLoft.IFamily;
        station: ((station: number) => number) | null;
      } = AutoMovieHumanF1Placement.repose(stock, frames, locals);
      references.set(stock.name, stock);
      maps.set(stock.name, posed.station);
      return posed.family;
    };
    const body: typeof BODY = {
      trunk: place(BODY.trunk),
      arm: place(BODY.arm),
      hand: place(BODY.hand),
      leg: place(BODY.leg),
      ear: place(BODY.ear),
      nose: place(BODY.nose),
      breast: place(BODY.breast),
    };
    const digits: IAutoMovieHumanF1.IDigit[] = DIGITS.map(
      (digit: IAutoMovieHumanF1.IDigit): IAutoMovieHumanF1.IDigit => ({ ...digit, family: place(digit.family) }),
    );
    const [
      helix,
      antihelix,
      axilla,
      concha,
      nostril,
    ]: IAutoMovieHumanConicLoft.IFamily[] = [
      AutoMovieHumanF1Helix,
      AutoMovieHumanF1Antihelix,
      AutoMovieHumanF1Axilla,
      AutoMovieHumanF1Concha,
      AutoMovieHumanF1Nostril,
    ].map(place);
    const assembled: IAutoMovieHumanF1.IAssembly = {
      frames,
      roots: AutoMovieHumanF1RootControls,
      body,
      digits,
      helix: helix!,
      antihelix: antihelix!,
      axilla: axilla!,
      concha: concha!,
      nostril: nostril!,
      families: [
        ...Object.values(body),
        helix!,
        antihelix!,
        ...digits.map(
          (digit: IAutoMovieHumanF1.IDigit): IAutoMovieHumanConicLoft.IFamily => digit.family,
        ),
        concha!,
        nostril!,
      ],
      reference: (name: string): IAutoMovieHumanConicLoft.IFamily => {
        const family: IAutoMovieHumanConicLoft.IFamily | undefined =
          references.get(name);
        if (family === undefined)
          throw new Error("assemble: no reference family " + name);
        return family;
      },
      station: (family: string, from: number, length?: number): number => {
        const map: ((station: number) => number) | null | undefined =
          maps.get(family);
        if (map === undefined) throw new Error("assemble: no family " + family);
        return length === undefined
          ? map === null
            ? from
            : map(from)
          : map === null
            ? length
            : map(from + length) - map(from);
      },
      point: (name: string): [number, number, number] =>
        AutoMovieHumanF1Placement.point(name, frames, locals),
      direction: (name: string): [number, number, number] =>
        AutoMovieHumanF1Placement.direction(name, frames),
    };
    if (legacy && (pose !== undefined || chain !== undefined)) {
      // The archived pose roots share the prepared parent chart. Only the requested root is drawn.
      const chart: (p: readonly number[]) => IChart = trunkChart(assembled);
      assembled.roots = {
        get arm(): IAutoMovieHumanF1.IAssembly["roots"]["arm"] {
          return [legacyArmscye(1, assembled, chart), legacyArmscye(-1, assembled, chart)];
        },
        get breast(): IAutoMovieHumanF1.IAssembly["roots"]["breast"] {
          const draw = prepareLegacyMammary(assembled, chart);
          return [draw(1), draw(-1)];
        },
        get nose(): IAutoMovieConstructionPortLoop {
          return legacyNostril(assembled, chart);
        },
      };
    }
    return assembled;
  }

  /**
   * Assemble the supplied body support field through its one source chain.
   * The only accepted body field is explicit hipJointCentreBreadth; no missing
   * clinical observation is filled from the accepted synthetic F1 calibration.
   * The supplied breadth sets only the stored femur's pelvis-local half-span;
   * AP/height, all reference rotations and other offsets stay independent.
   * Descendants follow that chain without a separate external ankle stance.
   * Central frames/datums and pose retain the fixed bilateral z=0 premise.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The support owner consumes the existing body field and changes its declared femur half-span, then the same assemble path places every family, datum and rail once from that complete chain.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A narrow body-field entry delegates to the reusable support law and existing assembly; constructionFrom consumes the returned assembly without source replacement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No unobserved clinical input is filled from F1's rig support calibration, no public body fields are silently consumed as a full identity, and no trunk/limb skin, margin, net or distal stance is compensated.
   * @evidence contracts/development/common.md#meaningful-documentation States the supplied-only field, synthetic F1 qualification, independent preserved inputs, descendant movement and fixed-frame premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms One support-chain pass precedes the existing once-per-family assembly; unchanged F1 half-span reuses the stored chain and reference frames.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The entire returned assembly shares the same resolved chain, station maps and datum frames, including every root and descendant.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The assembly borrows its source records and one bounded chain/frame result for reader lifetime; no global cache or background work is created.
   */
  export function assembleBody(
    inputs: Required<
      Pick<IAutoMovieHumanBodyIdentity, "hipJointCentreBreadth">
    >,
  ): IAutoMovieHumanF1.IAssembly {
    const original: IAutoMovieHumanF1.IAssembly = assemble();
    const originals: ReadonlyMap<string, IAutoMovieViewPart> =
      originalSources(original);
    const prepared = AutoMovieHumanF1NativeLaw.prepare(original, originals);
    return nativeFrom(
      {
        ...prepared.fields,
        hipJointCentreBreadth: inputs.hipJointCentreBreadth,
      },
      prepared,
    );
  }

  /**
   * Resolve independent directional tissue fields and the supplied support through the real native figure path.
   * Fixed accepted lengths/rotations and qualified material proxies retain their stated scope; this is not a complete clinical identity inverse.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The existing support law and frame composer resolve the skeleton, while NativeLaw generates every source/control/root from those fields and one original-control bank before construction consumes it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A distinct supplied-field entry returns the same IAssembly consumed by constructionFrom; no ignored pose or late source replacement is accepted.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No missing observation or regression covariate is filled. The original bank is generated from authored F1 source controls, not a person's mesh or reference file.
   * @evidence contracts/development/common.md#meaningful-documentation Names input qualifications, independent tissue/support and the fixed-length provisional scope.
   * @evidence contracts/development/implementation.md#efficient-algorithms One baseline source-bank generation precedes field calibration; every native field invocation uses the same builder and reuses that bank.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The original calibration/control bank is shared by every affected family, reflected source and connection in this invocation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned assembly owns its bounded source readers and borrows the original immutable controls for reader lifetime; no global source cache or process is introduced.
   */
  export function assembleNative(
    fields: IAutoMovieHumanF1NativeLaw.IFields,
  ): IAutoMovieHumanF1.IAssembly {
    const original: IAutoMovieHumanF1.IAssembly = assemble();
    return nativeFrom(
      fields,
      AutoMovieHumanF1NativeLaw.prepare(
        original,
        originalSources(original),
      ),
    );
  }

  /**
   * A person's complete native assembly from one prepared original bank: the one owner that turns fields into a
   * skeleton and then into sources. Every native entry and every round tool goes through it, so no caller composes
   * a chain of its own and silently drops a field the owner reads (a tool that placed only the hip support built
   * every length case as f1).
   *
   * @evidence contracts/development/implementation.md#principled-implementation Skeleton first: segment lengths move the joint centres, the hip support sets the femur's half-span on that chain, every stored datum is read at the person, and the prepared native law generates the sources on those frames.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain composition, one frame resolution and one application of the prepared law.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No field is defaulted from f1: the fields are complete by type, and a trunk length or a breast projection the law cannot generate is refused by the builder.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the chain and one placement per family before the builder's own work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller's prepared bank and calibration serve every person; f1's own lengths return the stored chain and its reference frames.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned assembly borrows the prepared bank for its readers' lifetime; nothing global is retained.
   * @evidence contracts/development/common.md#meaningful-documentation States the order of skeleton, datums and sources, and why callers must not compose their own chain.
   */
  export function nativeFrom(
    fields: IAutoMovieHumanF1NativeLaw.IFields,
    prepared: IAutoMovieHumanF1NativeLaw.IPrepared,
  ): IAutoMovieHumanF1.IAssembly {
    // The skeleton first: each segment length moves the joint centre at its far end (`AutoMovieHumanF1SegmentLengths.chain`), then the
    // hip support sets the femur's half-span on that chain. f1's own lengths return the stored chain itself.
    const chain: readonly IAutoMovieHumanSegmentJoint[] = AutoMovieHumanHipSupportPlacement(
      fields,
      AutoMovieHumanF1SegmentLengths.chain(fields.lengths),
      "femur",
    );

    // Every stored datum at the person: spread with its hand or foot, scaled with its digit's last bone, moved with its anchoring joint.
    return prepared.apply(
      fields,
      resolve(
        undefined,
        chain,
        false,
        (name: string): AutoMovieVector3Tuple =>
          AutoMovieHumanF1Centres.local(name, fields.lengths, chain),
        prepared.reference,
      ),
    );
  }
  /** A limb's composed-end quorum and sample grid. */
  interface IFan {
    /** The children in anatomical row order, beginning on the ulnar or lateral side. */
    digits: string[];

    /** Station distance of each child's band rail from the composed cut, as a share of the child's mean reach at its first knot. */
    rail: number;

    /** Columns of each composed band. */
    columns: number;

    /** Cross-band rows of the published grid. */
    rows: number;
  }

  /**
   * Composed ends use a child order and sampling grid. The operator owns the web curves. Each child's rail is a share of its own mean
   * reach at its first knot (`AutoMovieHumanConicLoft.meanReach`): the former 3 mm over the mean of f1's children's reaches, 10.79 mm on
   * the fingers and 10.74 on the toes (`joint-sizes-20261123-0103/sizes.json`), so f1's fan keeps 3 mm on its mean child (the pinky's
   * rail 2.10 mm, the index finger's 4.21; the little toe's 2.13, the second toe's 5.02). ESTIMATE.
   */
  const FANS: { arm: IFan; leg: IFan } = {
    arm: {
      digits: ["finger.pinky", "finger.ring", "finger.middle", "finger.index"],
      rail: 3 / 10.79,
      columns: 192,
      rows: 24,
    },
    leg: {
      digits: ["toe.little", "toe.ring", "toe.middle", "toe.index", "toe.big"],
      rail: 3 / 10.74,
      columns: 192,
      rows: 24,
    },
  };

  /** A family's mean reach at its first knot, mm: the size its joint's widths are shares of. */
  function rootReach(family: IAutoMovieHumanConicLoft.IFamily): number {
    return AutoMovieHumanConicLoft.meanReach(family, family.knots[0]!);
  }

  /**
   * The largest turn of a limb's ring between two neighbouring phases, radians (`AutoMovieHumanConicLoft.IFamily.turn`); a limb absent here
   * keeps uniform phases. The leg's 160 uniform phases, set by the thigh's girth, turned by up to 0.83 rad each round the forefoot's outer
   * edge and up to 0.94 at the ankle (the lofted rings read every millimetre of station), and the outer edge of the forefoot showed as level
   * stripes, the phases' facets; they went with phases 2 mm apart everywhere. Spaced so that no ring turns by more than 0.2 rad between
   * two phases, the leg takes 360 phases, most of them round the foot's edges, and its rings, read every millimetre, turn by at
   * most 0.37 rad on the forefoot. The arm's 104 uniform phases, set by the shoulder's girth, stood as flat strips 2.7 mm wide down the
   * hand's ulnar edge, a row of terraces on `hand.left` (px 440..520 x 480..600) that stayed with every net of the hand taken off; at 0.2
   * rad (312 phases) faint ones stayed, and at 0.1 (568) they are gone.
   */
  const PHASE_TURN: { arm?: number; leg?: number } = { arm: 0.1, leg: 0.2 };

  /**
   * Where the arm's face ends, mm along its course, and the hand's family (`AutoMovieHumanF1Hand`, from 448) takes over across `WRIST`.
   * The arm family's one knuckle turn (half 10) drew the hand's back as two flat-bottomed valleys and creased the palm; the hand's own turn
   * (half 22) is fitted from 448, past the forearm's last level that a single section turn still follows, and the arm stops 3 mm before it
   * so that the band starts on the arm's own surface, not on a ring the hand's fit also claims.
   */
  export const ARM_TO_MM: number = AutoMovieHumanF1ArmEnd.TO_MM;

  /**
   * The original wrist handoff plane, read on the registered hand course.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Reference-fit and assembled sources use the same physical boundary in world millimetres.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to the same plane owner as the material arm station.
   */
  export const wristPlane: typeof AutoMovieHumanF1ArmEnd.plane = AutoMovieHumanF1ArmEnd.plane;

  /**
   * The band joining the arm's end to the hand (`IAutoMovieConstructionContinuation.band`): its rail into the hand, its columns and its
   * rows. The rail is a share of the hand's mean reach at its first knot: the former 10 mm over f1's 26.04 mm
   * (`joint-sizes-20261123-0103/sizes.json`), ESTIMATE; on f1 it puts the hand's ring at 458, past the fit's first knot interval (448 to
   * 468 at its 10 mm midpoint), so the band meets the hand where its sections are fitted, not at their free start. 256 columns space the
   * wrist's 165 mm girth 0.65 mm apart, finer than either face's phases there (`PHASE_TURN.arm`), and 12 rows space the 13 mm span about
   * 1.1 mm apart, as the fingers' bands.
   */
  const WRIST: { rail: number; count: number; rows: number } = {
    rail: 10 / 26.04,
    count: 256,
    rows: 12,
  };

  /**
   * Chord of the thumb's blend on either side of the curve where it meets the hand, mm: at 1 mm it folds in the acute web beside the
   * index finger. It stays in millimetres until the thumb's master loop closes on the hand: its share is of that loop's length, read on
   * f1 once the hand's wall carries the thumb's root (the thumb's master is refused today, `joint-sizes-20261123-0103/sizes.json`).
   */
  const THUMB_CHORD_MM: number = 0.5;

  /**
   * The crotch's rail on each thigh, a share of the leg's mean reach at its first knot: the former 6 mm over f1's 117.17 mm
   * (`joint-sizes-20261123-0103/sizes.json`). ESTIMATE.
   */
  const CROTCH_RAIL_SHARE: number = 6 / 117.17;

  /**
   * The armscye's fold (`IAutoMovieConstructionFoldWidth`), shares of the person's master loop's extent along the trunk's stations: the
   * former 6 mm radius, 30 mm cap and 6 mm reach over f1's extent, 130.40 mm (496.30 to 626.70, `joint-sizes-20261123-0103/sizes.json`).
   * ESTIMATE. The reach also places the arm's port mark, one reach past the loop's deepest station on the arm's course.
   */
  const ARMSCYE_SHARE: { radius: number; cap: number; reach: number } = {
    radius: 6 / 130.4,
    cap: 30 / 130.4,
    reach: 6 / 130.4,
  };

  /**
   * The width of the skin faired about each of the ear's merges (`IAutoMovieConstructionJoin.fair`) and each merge's blend chord, shares
   * of the merging part's mean reach at its first knot: about the plate's root on the head, where the auricle leaves the skull in a soft
   * sulcus, 4 mm faired and a 0.5 mm chord over f1's plate's 8.07 mm; about each tube's blend, 1 mm faired and a 0.25 mm chord over the
   * helix's 1.80 mm and the antihelix's 1.60 mm (`joint-sizes-20261123-0103/sizes.json`). ESTIMATE. At half a tube's width (3 and 2.4
   * mm faired, as the thumb's is about half the thumb's) the two tubes' fills met over the narrow scapha at 1,566 to 1,572 mm and the
   * antihelix's walk was lost on the helix's.
   */
  const EAR_SHARE: { helix: { fair: number; chord: number }; antihelix: { fair: number; chord: number }; root: { fair: number; chord: number } } = {
    helix: { fair: 1 / 1.8, chord: 0.25 / 1.8 },
    antihelix: { fair: 1 / 1.6, chord: 0.25 / 1.6 },
    root: { fair: 4 / 8.07, chord: 0.5 / 8.07 },
  };

  /**
   * How many station lines round each part the seed searches of the ear's joins walk, phase first (`IAutoMovieConstructionSearchSeed.phases`):
   * which line of a part meets its host is a property of both surfaces, not of the part, so a fixed phase holds for one person only. On f1's
   * lens(1) plate the helix's phase-0 line stays outside the plate over its whole search (shares 0 to 0.5) and its first crossing line
   * of eight is 45 degrees, at station 26.8; the antihelix's is phase 0, at 6.8 (`FamilyConicEarRound.ts --crossing`). Eight lines,
   * 45 degrees apart, leave no side of a round tube more than 22.5 degrees from a walked line.
   */
  const EAR_SEED_LINES: number = 8;


  /**
   * Station spacing of the layers and derived outlines of a sewn family, mm. Each part adds stations of its own where its section turns fast,
   * so 4 mm is admitted whole; at 2 mm the engine read one toe's middle section as degenerate, and at 8 mm it refuses the arm's face.
   */
  export const LAYER_MM: number = 4;

  /**
   * Where the arm's band lands on it, mm from its first station, at the +Z arm's phases `2 pi j / 24`, joined by the periodic cubic. Behind
   * the armpit's crease the trunk's side and the arm's inner side meet in a slit, its top at 1,272 to 1,274 mm 25 to 35 mm behind the
   * crease's datum, and the arm's side falls 2 to 4 mm for each millimetre outward from it (`vault`, a scratch survey of the skin in planes
   * x = const); the ring 10 mm in hangs 22 mm below the slit's top at the arm's phases 96 to 136 degrees, and the band there left the
   * trunk upward and folded back over it (108 to 139 degrees, a speck on `shoulder.high-oblique`; `FamilyConicArmscye.ts --table`: host
   * cosines down to -0.82 over 24 columns). There, from 75 to 135 degrees, the rail comes up to 1.5 mm, to the first section's foot at
   * 1,263 mm, and the loop follows the ring under the slit (`ARMPIT_SINK_MM`): the band crosses the slit near its foot and the slit above
   * it is closed. Read by `FamilyConicArmscye.ts --table`, 3 columns point back, at -0.17 at worst, where the dip meets the front fold.
   */
  const ARM_RAILS_MM: number[] = AutoMovieHumanF1RootRails.arm;

  /** `ARM_RAILS_MM` for one side: the twin's chart runs the other way round, so its phase `psi` is the +Z arm's `-psi`. */
  export function armRails(side: 1 | -1): number[] {
    return AutoMovieHumanF1RootRails.forArm(side);
  }

  /**
   * Where each limb's band lands on it, mm from the limb's first station: the limb keeps its stations beyond. The arm's first station is 2 mm
   * past the armscye's plane and its course is nearly square to that plane for its first 25 mm, so its ring 10 mm on lies beside the plane. The nose's band lands on a curve (`NOSE_RAILS_MM`).
   */
  export const RAIL_MM: IAutoMovieHumanF1.IRailMm = {
    arm: 10,
    leg: 6,
    breast: 1,
  };

  /**
   * Where the nose's band lands on it, mm from its first station, at its phases `2 pi j / 32` (0 up, a quarter turn toward -Z, a half turn
   * down), joined by the periodic cubic: a curve, not one station, because the nose's root lies in no one plane. The nose's sections start
   * half a millimetre in front of the alar grooves, so from there its wall is the wings' outer face, but its first sections are closed by its
   * box's chords at the top, inside the dorsum, and at the bottom, inside the lip behind the subnasale. Read off the nose's own wall by its
   * distance to the reference skin (`FamilyConicScan.ts nose-rail`, the station from which it lies within 0.3 mm of the skin): the wings'
   * faces from the first station, and the dorsum from 10 mm in (x 123.5). Below, the wall leaves the lip's flesh for the skin 7 to 10.5 mm
   * in, but there the nostrils lie, back to 117.6 mm forward, and a cut that crossed the band admitted only a knife-edged blend. Below,
   * from 135 to 225 degrees round, the band lands on the line where the lip's front meets the nose's floor at 1,543 mm, read off level
   * sections at 1,542 and 1,544 mm (`FamilyConicScan.ts alar`): x 123 on the median line (9 mm in), 122.8 at 2.6 mm across (8.5), 122.2
   * at 5.4 mm (8), 120 at 8.7 mm (5.5, just behind each nostril's blended rim at 120.2 to 120.9) and 116.5 at 13 mm (3), so the band
   * rises from the lip straight into the floor. Landed 3 mm in all along, behind the nostrils, the band ran 4 to 6 mm back under the sill
   * from the lip's front and turned on itself (folds of 110 to 161 degrees along y 1,543); landed 10.5 mm in at the subnasale alone,
   * between neighbours at 3 mm, it stood as a notch. Where the wall is skin from the first station the band still lands 2 mm in, so it
   * rounds the alar groove; under the back of each wing, where the alar groove is sharpest (110 to 125 and 235 to 250 degrees), only
   * 1.5 mm in, so the crease there is crisp and softer above. The floor's net (`AutoMovieHumanF1Nose`, `nose.floor`) lifts the ring
   * between the wings onto the underside's skin, which leaves it no longer star-shaped about its centroid, so the port matches it to its
   * loop by length (`correspondence`); by angle it was refused. Above the wings the
   * face keeps the sidewalls (`FamilyConicBody.ts noseCut`), and the band lands 5 to 8 mm in, the farther the higher, so its loop, 2.5 mm
   * outside this curve, stays on the face's own skin.
   */
  export const NOSE_RAILS_MM: readonly number[] =
    AutoMovieHumanF1RootRails.nose;

  /**
   * The nose's band's cross profiles (`IAutoMovieConstructionPort.IProfile`), depths in metres along its inward normal, on its loop clock
   * (0 at the dorsum, a quarter turn at the +Z wing, a half turn under the columella). Read by `FamilyConicScan.ts band band.nose 64`: the
   * reference skin's depth below the plain band along its normal at shares 0.1 to 0.9 of its span, with the sidewall's net
   * (`AutoMovieHumanF1Nose`, `nose.side`) on, averaged over each window's columns and over the two sides (`+Z` and its mirror clock):
   * - Behind each wing, the alar-facial groove (clocks 1.57 to 2.36 and 3.93 to 4.71): the plain band stands 0.42, 0.70, 0.45 and 0.09 mm
   *   proud of the skin at the shares 0.2, 0.4, 0.6 and 0.8, a hollow nearer the face than the wing.
   * - Under each nostril's sill (clocks 2.6 to 3.0 and 3.28 to 3.68): the plain band lies 0.12, 0.52 and 0.87 mm inside the skin at 0.4, 0.6
   *   and 0.8, where the lip rolls into the floor; the band must end flat on the nose's ring, which lies 0.9 to 1.2 mm inside there itself,
   *   so the last knot takes 0.6 mm and the ring's own share is left to the floor's net.
   * Each window fades over 0.2 rad of clock (0.15 under the sill, where the columella's columns between the two stand within 0.35 mm).
   */
  const NOSE_PROFILES: IAutoMovieConstructionBandProfile[] = [
    {
      start: 1.57,
      end: 2.36,
      transition: 0.2,
      knots: [
        [0.3, 0.0003],
        [0.5, 0.0004],
        [0.7, 0.0002],
      ],
    },
    {
      start: 3.93,
      end: 4.71,
      transition: 0.2,
      knots: [
        [0.3, 0.0003],
        [0.5, 0.0004],
        [0.7, 0.0002],
      ],
    },
    {
      start: 2.6,
      end: 3.0,
      transition: 0.15,
      knots: [
        [0.4, -0.0001],
        [0.6, -0.0002],
      ],
    },
    {
      start: 3.28,
      end: 3.68,
      transition: 0.15,
      knots: [
        [0.4, -0.0001],
        [0.6, -0.0002],
      ],
    },
  ];

  /**
   * Spacing of a digit's layers at its root, mm, and how far from its first station that holds, mm. Each digit meets its limb in a curve a few
   * millimetres across with a blend 1 mm wide; on layers 4 mm apart the digit's root was a few flat facets.
   */
  const WEB_LAYER_MM: number = 1;

  /**
   * Trunk station from which its layers are spaced on the skin over the crown (`construction` `domed`), mm: 1,640 mm high, above the ears
   * (their roots reach 1,610 mm) and below where the skull's top turns over toward the vertex.
   */
  const CROWN_MM: number = 860;

  /**
   * The trunk's mesh over the face, apart from its nets: from station 690 to 830 mm (the chin to the brow) layers at most 1 mm apart, and
   * phases at most 0.016 rad apart round the whole trunk (`IFamily.phase`). The layers and phases had followed the face's finest nets (the
   * chin's 0.95 mm rows, the eyes' 105 columns); with those nets coarsened for their own sake to 1.4 to 2 mm rows and 73 columns, the face's
   * mesh read in level bands across the cheeks and the nose and in blocks over the lips and the chin, and the head's skin round the ear
   * in steps.
   */
  const TRUNK_FACE_LAYERS: [number, number, number] = [690, 830, 1];
  const TRUNK_PHASE: number = 0.016;

  /**
   * The rows by which a net cuts its family's layers (`leaf`), where they are not the net's own: a layer interval inside a net's window is
   * cut as fine as `(stations[1] - stations[0]) / (rows - 3)`, and these nets were stored at coarser grids for their numbers' sake
   * (issue #3197, stage B2), which would have thinned the layers with them (the nose's from 54 to 41).
   * Each entry is the row count the net had when its family's layers were last accepted, so the mesh stays as it was; a twin and a
   * mirrored family's net read their original's entry. Tessellation, not shape.
   */
  const NET_LAYER_ROWS: Record<string, number> = {
    "leg.hollow.1": 18,
    "nose.under": 31,
  };

  /**
   * The nose's largest phase step, radians (`IFamily.phase`): the column of its finest net as it was last accepted, `nose.under` at 39
   * columns over its window of 2.0416 to 4.2416 rad, which gave the nose 104 phases. That net is stored at 21 columns now (issue #3197,
   * stage B2), and the nose's phases would have followed it down to 64. Tessellation, not shape.
   */
  const NOSE_PHASE: number = (4.2416 - 2.0416) / (39 - 3);

  /**
   * Station spacing of the fingers' and the thumb's layers past their roots, mm. At the body's 4 mm the digits' rings showed as fine level
   * stripes along the thumb and the fingers under flat shading (`hand.high-oblique` px 610..660 x 520..580, a fold of 30 degrees at the
   * thumb's [238.8, 942, 427.7]), where a finger's section turns faster along it than the trunk's does; at 2 mm they are gone.
   */
  const FINGER_LAYER_MM: number = 2;

  /**
   * The largest turn of a finger's or the thumb's ring between two neighbouring phases, radians (`AutoMovieHumanConicLoft.IFamily.turn`),
   * as the arm's (`PHASE_TURN`). On phases set by its girth the thumb's flat side turned into its edges between few columns and drew a
   * sawtooth of long thin facets along the thumb (`limbview` close to [236, 945, 427]), the stripes `hand.high-oblique` showed.
   */
  const FINGER_TURN: number = 0.1;

  /**
   * When a layer is added midway between two of a family that carries reliefs: its skin there stands off the middle of the chord between the
   * two by more than `sagitta` mm at some phase. No interval is cut below `least` mm. Layers are level rings, so a fold that crosses them
   * aslant, as the one under the breast does, is drawn in steps as tall as the layers are apart; where the skin turns that fast the layers
   * must stand closer than the 4 mm that carries the rest.
   *
   * On every family a layer is also added where the skin turns along the station by more than `turn` degrees between the two halves of
   * the interval, at `fine` phases (`AutoMovieHumanLayerTurn`). Flat shading shows the turn, not the sagitta: the fold under the breast turned 14 to
   * 20 degrees across one layer 2 to 4 mm tall, a sagitta of 0.1 mm, and stood in level steps from the front; the lips, on layers 2 to
   * 2.6 mm apart, stood in level bands (mouth.front px 200..720 x 330..640); the heel, on the outer side of the ankle's turn, stood in
   * terraces 4.4 mm apart (`foot.back`, f1 and every case). The rule held over the breast's fold and the mouth alone until the heel showed
   * it is general (2026-11-22): it bounds each band's turn wherever a family's skin turns along its course. It was held to those windows
   * because everywhere on the trunk it added 166 rings and moved the head's, against which the ear's band was triangulated; the ear's
   * root is a traced merge now and no band reads those rings.
   */
  const FOLD: {
    sagitta: number;
    least: number;
    phases: number;
    turn: number;
    fine: number;
  } = {
    sagitta: 0.15,
    least: 0.5,
    phases: 96,
    turn: 4,
    fine: 192,
  };

  /** Columns round each band and rows across it. */
  const BAND: { count: number; rows: number } = { count: 96, rows: 8 };

  /**
   * Columns round each leg's band at the crotch and round each arm's at the armscye. A band twists from its loop's direction to its ring's, so
   * each of its quads is two triangles of different slope, and a column wider than about 2 mm shows as a pair of stripes: at 96 columns a ring
   * of facets stood round each thigh, at 144 upright hatching, and at 288, 2 mm apart round a thigh's girth of 565 mm, neither.
   */
  const THIGH_COLUMNS: number = 288;
  const SHOULDER_COLUMNS: number = 192;

  /** A side join's attachment tolerance, metres: the master's address and its shared source's gap are certified within it. */
  const ATTACHMENT_TOLERANCE: number = 1e-6;

  /** A side join's grazing bound (`IAutoMovieConstructionJoin.grazing`), the master's trace's own. */
  const ATTACHMENT_GRAZING: number = 0.2;

  /**
   * Grid stations across each arm's band. Each column's ribbons take their own scale (`ribbons: "column"`), so in front of the armpit and
   * over the cap the band arches from the trunk to the arm over its whole length instead of hugging its chord, and its rows must follow
   * that arch as the splits use their own cross-band grids.
   */
  const ARMSCYE_ROWS: number = 24;

  /**
   * Spacing of the breast's layers, mm. Over the dome a ring moves 1.5 to 4 mm across the skin for each millimetre of station, so layers
   * 4 mm apart stood as concentric steps on `fold.front`, and at 1 mm the rings still showed as ring facets folding by about 4 degrees
   * ([118, 1272, 90]).
   */
  const BREAST_LAYER_MM: number = 0.5;

  /**
   * Largest distance between the breast's neighbouring phases, mm (`AutoMovieHumanConicLoft.IFamily.pitch`). At the figure's 4 mm the
   * breast's girth of about 315 mm took about 80 phases, and with its layers half a millimetre apart the dome still showed radial spokes
   * and ring facets on `fold.front` (px 300..500 x 200..300): the phases' facets, converging on the tip. 1.5 mm is the ear rim's pitch.
   */
  const BREAST_PITCH_MM: number = 1.5;
  /**
   * Columns round the nose's band. Its rail is a curve on the nose, which the band's end meets exactly only at its columns; between them the
   * band's own interpolation stood 0.03 mm off the nose's rail at 96 columns, and a nostril's cut, which crosses there, could not place its
   * crossing from one face to the next (`AutoMovieSolidClip.CROSSING`, 0.01 mm).
   */
  const NOSE_COLUMNS: number = 192;

  /**
   * The nostril's rim: the width of its cut's blend on either side of the curve, and how far its cutter is drawn in so the opening,
   * widened by the blend, keeps the hollow's own size, a share of the hollow's mean reach at its first knot: the former 1.5 mm over f1's
   * 5.02 mm (`joint-sizes-20261123-0103/sizes.json`), ESTIMATE. The reference's rim, the alar rim and the sill, is a roll of about 1.5 to
   * 2 mm radius (`FamilyConicFigure.ts nose`, from below); with a blend of 0.15 mm the generated rim was a knife's edge.
   */
  const NOSTRIL_RIM_SHARE: number = 1.5 / 5.02;

  /** The nostril's rim for a hollow, mm (`NOSTRIL_RIM_SHARE`). */
  function nostrilRim(family: IAutoMovieHumanConicLoft.IFamily): number {
    return NOSTRIL_RIM_SHARE * rootReach(family);
  }

  /**
   * Columns round a nostril's blend and rows across it. An edge with a roll is resolved only when every sampling across it is at most
   * a quarter of the roll (lofting.md, Fitting and verification), 0.375 mm of the rim's 1.5. On 48 columns, equal steps of the cutter's
   * phase, the traced curve, 25.5 mm long, had its columns 0.28 to 0.98 mm apart, and 4 rows spanned the 2.21 mm from rail to rail 0.55 mm
   * apart (`FamilyConicScan.ts strips cut.nostril`): the stepped collar round each nostril, saw-toothed along its outer edge
   * (`nose.front`, `nose.low-oblique`). The counts stay: on 128 columns, 0.10 to 0.37 mm apart, with 4 rows or 8, the nose's face was
   * refused by the triangulation ("face has coincident distinct source authorities") and both cutters stood out of the nose uncut, so
   * the rule is not yet met here.
   */
  const NOSTRIL_BLEND: { count: number; rows: number } = { count: 48, rows: 4 };

  /**
   * Spacing of a nostril cutter's layers over its whole length, mm. The cutter's wall turns from its flared mouth into the canal within
   * about 2.5 mm of station above the cut (its station line at 0.4 rad round turns 72 degrees between 10.4 and 13 mm along its course,
   * where its knots at 9 and 11 mm change its section by 7 mm), and on layers 1.6 mm apart there the mesh folded 64 to 72 degrees along
   * one ring inside each nostril, a faint streak down its walls (mouth.front px 555..600 x 190..260). On layers 1 mm apart the folds were
   * 44 degrees.
   */
  const NOSTRIL_LAYER_MM: number = 0.5;

  /**
   * The nostril cutter's mouth, mm along its course: its first fitted knot (`AutoMovieHumanF1Nostril`, sections read from 9 mm), whose
   * section the lead carries out of the nose; the cut meets the floor 8 to 10 mm along it. And how far its later knots and its closed end are
   * moved on (`spreadOut`), mm: fitted, the section moves 7 mm between the knots at 9 and 11 mm, a flare whose station line turns 72 degrees
   * into the canal within 2.5 mm, and that turn stood as a streak inside each nostril however finely it was layered (folds of 32 to 50
   * degrees on layers half a millimetre apart). Spread by this much the canal starts 2 mm higher and the flare is drawn over 4 mm: the
   * nostril's lateral wall reads as one shadow from the front and from below, as the reference's does. Spread by 1 or 1.5 mm, one
   * nostril's face was refused by the triangulation ("interior point hits an unshared boundary", "does not share one original diagonal").
   */
  const NOSTRIL_MOUTH_MM: number = 9;
  const NOSTRIL_SPREAD_MM: number = 2;




  /** Native anatomy fields have a distinct fixed-reference entry. These original producers preserve the existing non-native posed constructor. */
  /** A point in the trunk's chart: its station along the trunk's course from the course's foot, mm, and its coordinates across it, mm. */
  interface IChart {
    station: number;
    u: number;
    v: number;
  }

  /**
   * The trunk's chart of a point of the figure's frame at a pose: its station along the trunk's course and its coordinates across it, `u`
   * along the chart's `up` and `v = u x t` as the engine charts a course, whose angle `atan2(v, u)` is the chart's phase. The point is
   * mapped into the pelvis's frame, the trunk's own, and read there about the trunk's course, so a port loop read through it follows a
   * posed child and does not change when the whole figure moves. The trunk's course is straight and its chart has no roll.
   */
  function trunkChart(placed: IAutoMovieHumanF1.IAssembly): (p: readonly number[]) => IChart {
    const pelvis: IAutoMovieHumanSegmentFrame = AutoMovieHumanF1Placement.frame(
      "pelvis",
      placed.frames,
    );
    const floor: AutoMovieVector3Tuple = F.toLocal(pelvis, placed.body.trunk.centres[0]!);
    const t: AutoMovieVector3Tuple = F.unit(
      F.sub(F.toLocal(pelvis, placed.body.trunk.centres[1]!), floor),
    );
    const u: AutoMovieVector3Tuple = F.perpendicular(
      F.toLocalDirection(pelvis, placed.body.trunk.up),
      t,
    );
    const v: AutoMovieVector3Tuple = F.cross(u, t);
    return (p: readonly number[]): IChart => {
      const q: AutoMovieVector3Tuple = F.sub(F.toLocal(pelvis, [p[0]!, p[1]!, p[2]!]), floor);
      return { station: F.dot(q, t), u: F.dot(q, u), v: F.dot(q, v) };
    };
  }

  /**
   * How far outside the arm's ring the port loop stands on the trunk's own skin, mm. With the rail 10 mm in, at 6 mm every column of the band
   * leaves the trunk toward the ring and reaches it along the arm's own direction (`FamilyConicArmscye.ts`), 6 to 19 mm long. At 3 mm with
   * the rail 3 mm in the same held, but a band 4 mm long turned from the trunk's skin to the arm's so sharply that it showed as a line round
   * the shoulder.
   */
  const ARMSCYE_MARGIN_MM: number = 6;
  /**
   * How far below the armpit's crease the arm's ring is still followed by the loop, mm. The ring 10 mm into the arm dips 25 mm below the
   * crease, since the arm hangs down from it; a loop that follows it there cuts away the trunk's side up to the crease, and the band is a
   * web across the hollow.
   */
  const ARMPIT_DROP_MM: number = -6;
  /** Width of the smooth maximum by which the loop meets that floor, mm: the loop rounds onto the floor over about this much height. */
  const ARMPIT_ROUND_MM: number = 12;
  /**
   * How far the loop's floor sinks where the arm's rail is shortest, mm, by the rail's share of its dip elsewhere. At 23 mm the floor is
   * 4 mm under the ring there, so the smooth maximum and the margin leave the loop 1 to 2 mm under the ring, across the slit from it: sunk
   * 18 mm the loop stood level with the ring and 16 columns left the trunk against it; sunk 28 or 40 mm it stood 3 to 6 mm under the ring
   * and up to 17 columns reached the arm against the arm's own direction, which falls 2 mm a millimetre there.
   */
  const ARMPIT_SINK_MM: number = 23;
  /**
   * How far from the breast's course the trunk's own skin starts round the port, mm, at the clocks `2 pi j / 8` about the course: 0 up, a
   * quarter turn to the side, a half turn down, three quarters toward the median line. The port's loop stands there. Under the breast it is
   * the fold's lower edge, where the chest begins (`FamilyConicBody.ts BREAST_CHEST_MM`, read off the skin's profile in half-planes about
   * the course: straight down the chest stands level 24 to 26 mm behind the top from 52 mm out), so the band spans the fold and the fold is
   * its short side; elsewhere the skin runs on from the breast with no crease, and the loop stands 5 to 6 mm outside the ring: 2 to 3.5 mm
   * out, the band joined the breast's flank to the trunk's in a visible line on `fold.left`. Over the upper flank, a quarter and an eighth
   * of a turn from the top, the loop stands 4 mm farther out (58 and 52 mm were read off the profile): there the band, 5 to 6 mm long, turned
   * from the trunk's side to the breast's within it and drew a ragged dark line along the breast's outer edge on `shoulder.high-oblique`
   * (px 600..700 x 540..610), its facets 1.9 mm columns by 0.55 mm rows; at 9 to 10 mm the turn is softer. Carried on 2 mm at three
   * eighths of a turn (47 to 49 mm), the fan of the band's columns at [99, 1246, 111] darkened (`fold.left`). The trunk's sections leave out the breast's
   * underside to 1.5 mm inside this curve, and elsewhere the skin to 1 mm inside the ring (`FamilyConicBody.ts BREAST_CLIP_MM`).
   */
  const BREAST_CHEST_MM: number[] = [62, 62, 56, 47, 52, 50, 54, 60];

  /**
   * How far outside the nose's rail curve its port loop stands on the face, mm: the rail lies 2 mm in front of the alar groove on the wing's
   * face (`FamilyConicBody.ts nose`), so 2.5 mm puts the loop in the groove and outside the box the face leaves to the nose.
   */
  const NOSE_MARGIN_MM: number = 2.5;
  /**
   * How much farther out the nose's loop stands under the columella, mm, at the loop's lowest clock, falling off as `(-cos c)^6` (half of
   * it about 10 mm to either side of the median line, nothing at the wings). The reference's lip turns forward into the subnasale over 6 mm of
   * height (its front at 120.6, 121.1, 122.2 and 124 mm forward at 1,538, 1,540, 1,542 and 1,544 mm, `FamilyConicScan.ts alar`); a loop 2.5 mm
   * below the floor stood on the face's own skin just under the nose's cut, which its net leaves fair and 1 mm hollow there, and the
   * profile showed a notch under the band (mouth.left px 580..598 x 235..265). Landed 5 mm below, the band spans the whole turn.
   */
  const NOSE_SUBNASAL_MM: number = 2.5;

  /** Original non-native pose producer; no supplied native field falls back through this path. */
  function legacyArmscye(
    side: 1 | -1,
    placed: IAutoMovieHumanF1.IAssembly,
    chart: (p: readonly number[]) => IChart,
  ): IAutoMovieConstructionPortLoop {
    const family: IAutoMovieHumanConicLoft.IFamily =
      side > 0
        ? placed.body.arm
        : AutoMovieHumanConicLoft.mirror(
            placed.body.arm,
            placed.body.arm.name + ".mirror",
          );
    // Stations past the arm's first knot as the stored arm dates them, carried to the pose: the first sections lie in the shoulder's turn.
    const past = (mm: number): number =>
      placed.station(BODY.arm.name, BODY.arm.knots[0]! + mm);
    const armpit: IChart = chart(placed.point("armpit"));

    // The arm's ring at its rail curve (`armRails`), read from a loft of its first stations alone.
    const along: (psi: number) => number = AutoMovieNaturalSpline.periodic(
      armRails(side).map(past),
    );
    const loft: IAutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(
      { ...family, tips: undefined, reliefs: undefined },
      [
        past(0),
        past(Math.min(...ARM_RAILS_MM) / 2),
        past(RAIL_MM.arm),
        past(2 * RAIL_MM.arm),
        past(4 * RAIL_MM.arm),
      ],
    );
    if (loft.chain === null)
      throw new Error("the arm's first stations do not loft");
    const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;
    const behind: (psi: number) => number = AutoMovieNaturalSpline.periodic(
      armRails(side).map(
        (mm: number): number =>
          (RAIL_MM.arm - mm) / (RAIL_MM.arm - Math.min(...ARM_RAILS_MM)),
      ),
    );
    const outline: [number, number][] = Array.from(
      { length: 4 * SHOULDER_COLUMNS },
      (_: unknown, j: number): [number, number] => {
        const psi: number = (2 * Math.PI * j) / (4 * SHOULDER_COLUMNS);
        const p: IChart = chart(
          AutoMovieLoftChain.point(chain, along(psi), psi),
        );
        // The floor under the crease, met by a smooth maximum: held by a plain one, the loop ran level along the floor and turned up at a
        // corner at each end, and the band stood a box-shaped notch at the back of the armpit. Behind the crease, where the rail comes up to
        // the arm's first section, the floor sinks by the same share, so the loop follows the ring there.
        const floor: number =
          armpit.station -
          ARMPIT_DROP_MM -
          ARMPIT_SINK_MM * Math.max(0, Math.min(1, behind(psi)));
        return [
          (p.station + floor + Math.hypot(p.station - floor, ARMPIT_ROUND_MM)) /
            2,
          Math.atan2(p.v, p.u),
        ];
      },
    );
    // The margin's phase is taken at the armpit's side distance from the trunk's course.
    return around(outline, SHOULDER_COLUMNS, ARMSCYE_MARGIN_MM, armpit.v, side);
  }

  /** Prepare the archived breast ring on the original pose for both sides' chart loops. */
  function prepareLegacyMammary(
    placed: IAutoMovieHumanF1.IAssembly,
    chart: (p: readonly number[]) => IChart,
  ): (side: 1 | -1) => IAutoMovieConstructionPortLoop {
    const family: IAutoMovieHumanConicLoft.IFamily = placed.body.breast;
    const first: number = family.knots[0]!;
    const rail: number = first + RAIL_MM.breast;
    const loft: IAutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(
      { ...family, tips: undefined, reliefs: undefined },
      [first, rail, first + 2 * LAYER_MM, first + 4 * LAYER_MM],
    );
    if (loft.chain === null)
      throw new Error("the breast's first stations do not loft");
    const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;

    // The course's point and directions at the rail: along it, up squared to it, and to +Z square to both.
    const frame: IAutoMovieLoftSectionFrame =
      AutoMovieHumanConicLoft.axis(family).at(rail);
    const w: number[] = [0, 1, 2].map(
      (k: number): number => family.centres[1]![k]! - family.centres[0]![k]!,
    );
    const length: number = Math.hypot(w[0]!, w[1]!, w[2]!);
    const t: number[] = w.map((x: number): number => x / length);
    const y: AutoMovieVector3Tuple = AutoMovieHumanF1Placement.frame("thorax", placed.frames)
      .axes[1];
    const rise: number = t[0]! * y[0] + t[1]! * y[1] + t[2]! * y[2];
    const up: number[] = [
      y[0] - rise * t[0]!,
      y[1] - rise * t[1]!,
      y[2] - rise * t[2]!,
    ];
    const lateral: number[] = [
      t[1]! * up[2]! - t[2]! * up[1]!,
      t[2]! * up[0]! - t[0]! * up[2]!,
      t[0]! * up[1]! - t[1]! * up[0]!,
    ];
    const chest: (clock: number) => number =
      AutoMovieNaturalSpline.periodic(BREAST_CHEST_MM);
    const point: (phase: number) => AutoMovieVector3Tuple = AutoMovieLoftChain.sampler(chain, rail);
    const ring: number[][] = Array.from(
      { length: 4 * SHOULDER_COLUMNS },
      (_: unknown, j: number): number[] => {
        const p: number[] = point((2 * Math.PI * j) / (4 * SHOULDER_COLUMNS));
        const off: number[] = [0, 1, 2].map(
          (k: number): number => p[k]! - frame.origin[k]!,
        );
        const r: number = Math.hypot(off[0]!, off[1]!, off[2]!);
        const clock: number = Math.atan2(
          off[0]! * lateral[0]! + off[1]! * lateral[1]! + off[2]! * lateral[2]!,
          off[0]! * up[0]! + off[1]! * up[1]! + off[2]! * up[2]!,
        );
        const out: number = chest(clock < 0 ? clock + 2 * Math.PI : clock) / r;
        return [0, 1, 2].map(
          (k: number): number => frame.origin[k]! + off[k]! * out,
        );
      },
    );
    const seen: IChart[] = ring.map(chart);
    const radius: number =
      seen.reduce(
        (sum: number, p: IChart): number => sum + Math.hypot(p.u, p.v),
        0,
      ) / seen.length;
    return (side: 1 | -1): IAutoMovieConstructionPortLoop => around(
      seen.map((p: IChart): [number, number] => [p.station, side * Math.atan2(p.v, p.u)]),
      SHOULDER_COLUMNS, 0, radius, side,
    );
  }

  /** Original non-native pose producer; no supplied native field falls back through this path. */
  function legacyNostril(
    placed: IAutoMovieHumanF1.IAssembly,
    chart: (p: readonly number[]) => IChart,
  ): IAutoMovieConstructionPortLoop {
    const family: IAutoMovieHumanConicLoft.IFamily = placed.body.nose;
    const first: number = family.knots[0]!;
    const along: (psi: number) => number = AutoMovieNaturalSpline.periodic(
      NOSE_RAILS_MM.map((rail: number): number => first + rail),
    );
    const far: number = first + Math.max(...NOSE_RAILS_MM);
    const loft: IAutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(
      { ...family, tips: undefined, reliefs: undefined },
      [first, (first + far) / 2, far, far + LAYER_MM],
    );
    if (loft.chain === null)
      throw new Error("the nose's first stations do not loft");
    const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;
    const ring: IChart[] = Array.from(
      { length: 4 * NOSE_COLUMNS },
      (_: unknown, j: number): IChart => {
        const psi: number = (2 * Math.PI * j) / (4 * NOSE_COLUMNS);
        return chart(AutoMovieLoftChain.point(chain, along(psi), psi));
      },
    );
    const radius: number =
      ring.reduce(
        (sum: number, p: IChart): number => sum + Math.hypot(p.u, p.v),
        0,
      ) / ring.length;
    return around(
      ring.map((p: IChart): [number, number] => [
        p.station,
        Math.atan2(p.v, p.u),
      ]),
      NOSE_COLUMNS,
      (clock: number): number =>
        NOSE_MARGIN_MM + NOSE_SUBNASAL_MM * Math.max(0, -Math.cos(clock)) ** 6,
      radius,
      1,
    );
  }

  /** Original non-native pose producer; no supplied native field falls back through this path. */
  function around(
    outline: [number, number][],
    columns: number,
    margin: number | ((clock: number) => number),
    radius: number,
    sense: 1 | -1,
  ): IAutoMovieConstructionPortLoop {
    const span = (c: 0 | 1): [number, number] => [
      Math.min(...outline.map((q: [number, number]): number => q[c])),
      Math.max(...outline.map((q: [number, number]): number => q[c])),
    ];
    const [stations, phases]: [number, number][] = [span(0), span(1)];
    const centre: [number, number] = [
      (stations[0] + stations[1]) / 2,
      (phases[0] + phases[1]) / 2,
    ];
    const semi: [number, number] = [
      (stations[1] - stations[0]) / 2,
      (phases[1] - phases[0]) / 2,
    ];

    // Each outline point by its clock on that ellipse and its distance from the centre as a share of the ellipse's.
    const polar: [number, number][] = outline
      .map((q: [number, number]): [number, number] => {
        const x: number = (q[0] - centre[0]) / semi[0];
        const y: number = (sense * (q[1] - centre[1])) / semi[1];
        return [
          (Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI),
          Math.hypot(x, y),
        ];
      })
      .sort((a: [number, number], b: [number, number]): number => a[0] - b[0]);
    const shape: number[] = Array.from(
      { length: columns },
      (_: unknown, k: number): number => {
        const clock: number = (2 * Math.PI * k) / columns;
        const after: number = polar.findIndex(
          (q: [number, number]): boolean => q[0] >= clock,
        );
        // The outline's two points on either side of the clock; round the turn's end, its last point and its first.
        const [a, b]: [number, number][] =
          after > 0
            ? [polar[after - 1]!, polar[after]!]
            : after === 0
              ? [[polar.at(-1)![0] - 2 * Math.PI, polar.at(-1)![1]], polar[0]!]
              : [polar.at(-1)!, [polar[0]![0] + 2 * Math.PI, polar[0]![1]]];
        const share: number =
          b[0] === a[0]
            ? a[1]
            : a[1] + ((b[1] - a[1]) * (clock - a[0])) / (b[0] - a[0]);

        // The margin as a share of the ellipse's own distance at this clock.
        return (
          share +
          (typeof margin === "number" ? margin : margin(clock)) /
            Math.hypot(
              semi[0] * Math.cos(clock),
              semi[1] * radius * Math.sin(clock),
            )
        );
      },
    );
    return {
      centre: [centre[0] / 1000, centre[1]],
      semi: [semi[0] / 1000, semi[1]],
      sense,
      shape,
    };
  }

  /**
   * The armscye's port on the trunk's chart.
   *
   * The armscye is the armpit's sagittal plane: the trunk owns the skin medial of it and the arm the skin lateral of it, the shoulder's cap
   * included. The arm's course leaves the trunk square to that plane, so the ring the band lands on lies beside the plane. The port is that
   * ring's own outline as the trunk's chart sees it, each point's height above the axis's foot and its phase about the axis, pushed out from
   * the outline's centre by the margin so the loop stands on the trunk's own skin round the ring. The loop is written as the ellipse on the
   * outline's half extents with a share per column. An ellipse alone stood up to 29 mm from the ring under the armpit, where the ring's
   * lower edge runs aslant, and the band there reached the arm against the arm's own direction.
   *
   * The ring, the armpit's crease and the axis's foot are read in the trunk's chart at the pose (`trunkChart`), heights as stations along
   * the trunk's course, so the loop follows a posed arm.
   *
   * @param side +1 for the +Z side, -1 for its twin.
   * @param placed The figure's families at a pose; absent, the reference pose.
   */
  export function armscye(
    side: 1 | -1,
    placed: IAutoMovieHumanF1.IAssembly = assemble(),
  ): IAutoMovieConstructionPortLoop {
    return side > 0 ? placed.roots.arm[0] : placed.roots.arm[1];
  }

  /**
   * The armscye's port on the arm's course, traced as the declaration traces it (`armscyeContact` and `bind`): the master loop on the
   * trunk's own source, each master clock's station on the arm's course with its polar phase and radius in that station's section chart,
   * the port's first station (the loop's shallowest station on the course, less one address tolerance) and its protected mark (one fold
   * reach, `ARMSCYE_SHARE.reach` of the master's extent along the trunk, past the loop's deepest station). It reads the course alone,
   * never the arm's fields, so it holds for any fields on that course: the arm's root refit reads it (joints-one-shot.md, "The arm's
   * root on its port").
   *
   * @param placed The figure's families at a pose; absent, the reference pose.
   * @returns The master, its clocks on the arm's course, the port's first station and its mark, the trunk's source it is traced on, and
   * the fold's widths (`ARMSCYE_SHARE` of the extent), mm.
   */
  export function armscyePort(placed: IAutoMovieHumanF1.IAssembly = assemble()): {
    master: ReturnType<typeof AutoMovieHumanJoinLoop.master>;
    clocks: { clock: number; station: number; phase: number; radius: number }[];
    from: number;
    mark: number;
    extent: number;
    host: IAutoMovieViewPart;
    fold: { radius: number; cap: number; reach: number };
  } {
    const thorax: IAutoMovieHumanSegmentFrame | undefined = placed.frames.get("thorax");
    if (thorax === undefined) throw new Error("the armscye's port requires segment thorax");
    const root = placed.point("upperarm"), next = placed.point("lowerarm");
    const landmarks = AutoMovieHumanF1Armscye.landmarks(thorax);
    const owns = AutoMovieHumanF1Divide.landmarkOwner(root, [root, next, placed.point("hand")], landmarks, AutoMovieHumanF1Divide.ARMSCYE_MM);
    const host: IAutoMovieViewPart | undefined = originalSources(placed, new Set([placed.body.trunk.name])).get(placed.body.trunk.name);
    if (host === undefined) throw new Error("the armscye's port has no trunk source");
    const tolerance: number = ATTACHMENT_TOLERANCE * 1000;
    const master = AutoMovieHumanJoinLoop.master(host, SHOULDER_COLUMNS, landmarks, AutoMovieHumanF1Armscye.surface(thorax, root, next), owns,
      tolerance, ATTACHMENT_GRAZING);
    const arm: IAutoMovieHumanConicLoft.IFamily = placed.body.arm;
    const axis = AutoMovieHumanConicLoft.axis(arm);
    const clocks = Array.from({ length: 2 * SHOULDER_COLUMNS }, (_, k: number) => {
      const clock: number = (Math.PI * k) / SHOULDER_COLUMNS, point = master.at(clock).point;
      const station: number = AutoMovieHumanJoinLoop.address({ name: arm.name, axis }, [0, arm.knots.at(-1)!], point, arm.knots[0]!)[0];
      const frame = axis.at(station);
      const q: number[] = [0, 1, 2].map((i: number): number => point[i]! - frame.origin[i]!);
      const u: number = q[0]! * frame.u[0]! + q[1]! * frame.u[1]! + q[2]! * frame.u[2]!;
      const v: number = q[0]! * frame.v[0]! + q[1]! * frame.v[1]! + q[2]! * frame.v[2]!;
      return { clock, station, phase: Math.atan2(v, u), radius: Math.hypot(u, v) };
    });
    const hostStations: number[] = clocks.map(({ clock }): number => master.hostAt(clock).point[0]);
    const extent: number = Math.max(...hostStations) - Math.min(...hostStations);
    const stations: number[] = clocks.map(({ station }): number => station);
    return { master, clocks, from: Math.max(0, Math.min(...stations) - tolerance), mark: Math.max(...stations) + ARMSCYE_SHARE.reach * extent, extent,
      host, fold: { radius: ARMSCYE_SHARE.radius * extent, cap: ARMSCYE_SHARE.cap * extent, reach: ARMSCYE_SHARE.reach * extent } };
  }

  /**
   * The share of its lead an extreme may be drawn in by (`drawnIn`): at half, the extreme keeps as much of its lead over its nearer
   * neighbour as it gives up, the same margin from the stored section as from the section whose quarter has closed.
   */
  const DRAWN_SHARE: number = 0.5;

  /**
   * A family with every section drawn in by a distance: at each knot each of the four extremes moves inward along its own normal, the
   * front and back ones along `u` and the side ones along `v`, and the shoulders, shares of their arcs, stay. A curve's parallel at a
   * distance has its extremes on the normals through the curve's extremes, so the drawn-in extreme keeps its other coordinate. A cutter
   * whose cut is blended is drawn in by the blend's width, which moves the opening's edge out again by about as much.
   *
   * An extreme stays the extreme only while it leads both its neighbours along its own axis, so it moves by the distance or by
   * `DRAWN_SHARE` of its lead over the nearer of them, the smaller. Drawn toward the mean of the extremes by 1.5 mm, the nostril's front
   * extreme, which leads its lateral neighbour by 1.05 mm, kept 0.63 mm of that lead while both moved in both coordinates, and the four
   * extremes left their normals by 0.42 to 1.02 mm; a made section leading by 0.2 mm fell 0.25 mm behind (`test_human_f1_nostril_rim`).
   *
   * @param family The family, whose layout's four extremes come in (u, v) pairs: front (+u), side (+v), back (-u), side (-v).
   * @param mm The distance, mm.
   */
  function drawnIn(
    family: IAutoMovieHumanConicLoft.IFamily,
    mm: number,
  ): IAutoMovieHumanConicLoft.IFamily {
    const units: string[] = AutoMovieHumanConicSection.units(family.layout);
    const pairs: number[] = units.flatMap(
      (unit: string, f: number): number[] =>
        unit === "mm" && units[f + 1] === "mm" && pairsBefore(units, f)
          ? [f]
          : [],
    );
    if (pairs.length !== 4)
      throw new Error(
        "drawnIn: " +
          family.name +
          " has " +
          pairs.length +
          " extremes, not the four of a limb layout without medians",
      );
    const values: number[][] = family.values.map((row: number[]): number[] => [
      ...row,
    ]);
    for (let k: number = 0; k < family.knots.length; ++k)
      for (let q: number = 0; q < 4; ++q) {
        // The first two extremes are maxima of their coordinate, `u` then `v`; the last two are minima of them.
        const field = (extreme: number): number => pairs[extreme]! + (q % 2);
        const sign: number = q < 2 ? 1 : -1;
        const own: number = family.values[field(q)]![k]!;
        const lead: number = Math.min(
          ...[1, 3].map(
            (step: number): number =>
              sign * (own - family.values[field((q + step) % 4)]![k]!),
          ),
        );
        if (lead <= 0)
          throw new Error(
            "drawnIn: " +
              family.name +
              "'s extreme " +
              q +
              " at knot " +
              k +
              " does not lead its neighbours",
          );
        values[field(q)]![k] = own - sign * Math.min(mm, DRAWN_SHARE * lead);
      }
    return { ...family, values };
  }

  /**
   * A family whose knots past `mouth`, and its closed end, are moved on along its course by a distance: the section at `mouth` and every
   * section before it stay, and the change from it to the next knot's section is drawn over that much more station. A cutter whose wall
   * turns from its flared mouth into its canal within a few millimetres is spread so it turns more gently.
   *
   * @param family The family.
   * @param mouth The station of the last knot that stays, mm.
   * @param mm The distance, mm.
   */
  function spreadOut(
    family: IAutoMovieHumanConicLoft.IFamily,
    mouth: number,
    mm: number,
  ): IAutoMovieHumanConicLoft.IFamily {
    const moved = (s: number): number => (s > mouth ? s + mm : s);
    const end = (
      tip: IAutoMovieHumanConicLoft.ITip | null,
    ): IAutoMovieHumanConicLoft.ITip | null =>
      tip === null
        ? null
        : { ...tip, from: moved(tip.from), tip: moved(tip.tip) };
    return {
      ...family,
      knots: family.knots.map(moved),
      ...(family.tips === undefined
        ? {}
        : { tips: [end(family.tips[0]), end(family.tips[1])] }),
    };
  }

  /** Whether the "mm" field at `f` starts a (u, v) pair: an even count of "mm" fields runs up to it. */
  function pairsBefore(units: string[], f: number): boolean {
    let run: number = 0;
    for (let g: number = f - 1; g >= 0 && units[g] === "mm"; --g) ++run;
    return run % 2 === 0;
  }

  /**
   * The nose's port on the trunk's chart: the nose's own rail curve as the trunk's chart sees it, each point's height above the axis's foot
   * and its phase about the axis, pushed out by the margin, as the armscye's loop is the arm's ring. Its phase is read as millimetres at the
   * ring's mean distance from the trunk's axis.
   *
   * @param placed The figure's families at a pose; absent, the reference pose.
   */
  export function nostril(
    placed: IAutoMovieHumanF1.IAssembly = assemble(),
  ): IAutoMovieConstructionPortLoop {
    return placed.roots.nose;
  }

  /**
   * The breast's port on the trunk's chart: each point of the breast's ring at its rail carried out from the breast's course, square to
   * it, to the distance `BREAST_CHEST_MM` gives at its clock, as the trunk's chart sees it; written as the armscye's loop is. Its phase is
   * read as millimetres at the ring's mean distance from the trunk's axis.
   *
   * The clocks' zero, up, is the thorax's Y made square to the course, and the ring is read in the trunk's chart at the pose
   * (`trunkChart`).
   *
   * @param side +1 for the +Z side, -1 for its twin.
   * @param placed The figure's families at a pose; absent, the reference pose.
   */
  export function mammary(
    side: 1 | -1,
    placed: IAutoMovieHumanF1.IAssembly = assemble(),
  ): IAutoMovieConstructionPortLoop {
    return side > 0 ? placed.roots.breast[0] : placed.roots.breast[1];
  }

  /**
   * Where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the
   * plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`.
   *
   * @param family The limb's family, its end open.
   * @param station The end's station, mm.
   * @param joints The two digits' first and second joints: `[[first, second], [first, second]]`.
   * @param up The palm's or the sole's normal, or any direction the plane must hold.
   */
  export function valley(
    family: IAutoMovieHumanConicLoft.IFamily,
    station: number,
    joints: [[number[], number[]], [number[], number[]]],
    up: number[],
  ): [number, number] {
    const loft: IAutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(
      family,
      family.knots,
    );
    if (loft.chain === null) throw new Error("valley: the limb does not loft");
    const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;
    const mid = (a: number[], b: number[]): number[] => [
      (a[0]! + b[0]!) / 2,
      (a[1]! + b[1]!) / 2,
      (a[2]! + b[2]!) / 2,
    ];
    const m1: number[] = mid(joints[0][0], joints[1][0]);
    const m2: number[] = mid(joints[0][1], joints[1][1]);
    const d: number[] = [m2[0]! - m1[0]!, m2[1]! - m1[1]!, m2[2]! - m1[2]!];
    const normal: number[] = [
      d[1]! * up[2]! - d[2]! * up[1]!,
      d[2]! * up[0]! - d[0]! * up[2]!,
      d[0]! * up[1]! - d[1]! * up[0]!,
    ];
    const point: (phase: number) => AutoMovieVector3Tuple = AutoMovieLoftChain.sampler(chain, station);
    const side = (t: number): number => {
      const p: number[] = point(t);
      return (
        (p[0]! - m1[0]!) * normal[0]! +
        (p[1]! - m1[1]!) * normal[1]! +
        (p[2]! - m1[2]!) * normal[2]!
      );
    };
    const count: number = 720;
    const crossings: number[] = [];
    for (let k: number = 0; k < count; ++k) {
      let [lo, hi]: number[] = [
        (2 * Math.PI * k) / count,
        (2 * Math.PI * (k + 1)) / count,
      ];
      if (side(lo!) <= 0 === side(hi!) <= 0) continue;
      for (let i: number = 0; i < 50; ++i) {
        const middle: number = (lo! + hi!) / 2;
        if (side(middle) <= 0 === side(lo!) <= 0) lo = middle;
        else hi = middle;
      }
      crossings.push((lo! + hi!) / 2);
    }
    if (crossings.length !== 2)
      throw new Error(
        "valley: the plane crosses the limb's end " +
          crossings.length +
          " times",
      );
    return [crossings[0]!, crossings[1]!];
  }

  /**
   * A child's root section: its own family's skin, carried back along its fields' end tangents where the plane lies before its first
   * knot, cut by the plane its parent declares for its end, the parent's course frame at its last knot. A branch node's parent end is
   * the composition of its children's root sections in one declared plane, each published through the frame map from the child's own
   * frame to the parent's (`packages/human/docs/techniques/joint-logic.md`, Metacarpophalangeal row and finger webs, steps 1 and 2), so
   * the section is a function of the two families' courses and fields and follows a pose that moves either. Nothing reads a mesh.
   *
   * Each point is the root of the child's station line at one phase against the plane, bracketed about the station where the child's
   * course pierces it. A child whose course does not pierce the plane within its own length either side of its first centre, or runs
   * along it, publishes none.
   *
   * @param parent The parent family, ending open at its last knot.
   * @param child The child family, whose course leaves the parent's end.
   * @param phases Points round the loop.
   */
  export function rootSection(
    parent: IAutoMovieHumanConicLoft.IFamily,
    child: IAutoMovieHumanConicLoft.IFamily,
    phases: number = 64,
  ): IAutoMovieHumanF1.IRootSection {
    const end = AutoMovieHumanConicLoft.axis(parent).at(parent.knots.at(-1)!);
    const origin: [number, number, number] = [
      end.origin[0],
      end.origin[1],
      end.origin[2],
    ];
    const u: [number, number, number] = [end.u[0], end.u[1], end.u[2]];
    const v: [number, number, number] = [end.v[0], end.v[1], end.v[2]];
    // The course's direction: `u` and `v` chart the plane square to it, counter-clockwise seen against it.
    const normal: [number, number, number] = [
      v[1] * u[2] - v[2] * u[1],
      v[2] * u[0] - v[0] * u[2],
      v[0] * u[1] - v[1] * u[0],
    ];
    const off = (p: readonly number[]): number =>
      (p[0]! - origin[0]) * normal[0] +
      (p[1]! - origin[1]) * normal[1] +
      (p[2]! - origin[2]) * normal[2];
    const charted = (p: readonly number[]): [number, number] => [
      (p[0]! - origin[0]) * u[0] +
        (p[1]! - origin[1]) * u[1] +
        (p[2]! - origin[2]) * u[2],
      (p[0]! - origin[0]) * v[0] +
        (p[1]! - origin[1]) * v[1] +
        (p[2]! - origin[2]) * v[2],
    ];
    // The root of a function that changes sign once over a bracket, by bisection to a micrometre of station.
    const root = (f: (s: number) => number, low: number, high: number): number => {
      let [a, b]: [number, number] = [low, high];
      const rising: boolean = f(a) < 0;
      for (let k: number = 0; k < 60 && b - a > 1e-6; ++k) {
        const m: number = (a + b) / 2;
        if (f(m) < 0 === rising) a = m;
        else b = m;
      }
      return (a + b) / 2;
    };

    const course: IAutoMovieViewAxis.IAxis = AutoMovieHumanConicLoft.axis(child);
    const first: number = child.knots[0]!;
    const last: number = child.knots.at(-1)!;
    const back: number = -last;
    if (off(course.at(back).origin) * off(course.at(last).origin) >= 0)
      throw new Error(
        "rootSection: the course of " +
          child.name +
          " does not pierce the end plane of " +
          parent.name,
      );
    const pierced: number = root(
      (s: number): number => off(course.at(s).origin),
      back,
      last,
    );
    // The section's farthest reach at its first knot bounds how far along the station a station line can meet an oblique plane.
    const read: (s: number) => number[] = AutoMovieHumanConicLoft.reader(child);
    const reach: number = Math.max(
      ...AutoMovieHumanConicSection.resolve(
        read(first),
        child.layout,
      ).input.points.map((p: readonly number[]): number =>
        Math.hypot(p[0]!, p[1]!),
      ),
    );
    const [from, to]: [number, number] = [pierced - 2 * reach, pierced + 2 * reach];
    const stations: number[] = [
      ...new Set([
        ...Array.from(
          { length: 17 },
          (_: unknown, i: number): number => from + ((to - from) * i) / 16,
        ),
        ...child.knots.filter((s: number): boolean => s > to),
      ]),
    ].sort((a: number, b: number): number => a - b);
    const loft: IAutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(
      { ...child, tips: undefined, reliefs: undefined },
      stations,
    );
    if (loft.chain === null)
      throw new Error("rootSection: " + child.name + " does not loft at its root");
    const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;
    const atFrom: (phase: number) => AutoMovieVector3Tuple = AutoMovieLoftChain.sampler(chain, from);
    const atTo: (phase: number) => AutoMovieVector3Tuple = AutoMovieLoftChain.sampler(chain, to);
    const loop: [number, number][] = Array.from(
      { length: phases },
      (_: unknown, k: number): [number, number] => {
        const phase: number = (2 * Math.PI * k) / phases;
        const line = (s: number): number =>
          off(AutoMovieLoftChain.point(chain, s, phase));
        if (off(atFrom(phase)) * off(atTo(phase)) >= 0)
          throw new Error(
            "rootSection: the station line of " +
              child.name +
              " at phase " +
              phase.toFixed(3) +
              " does not cross the end plane of " +
              parent.name,
          );
        return charted(
          AutoMovieLoftChain.point(chain, root(line, from, to), phase),
        );
      },
    );
    return {
      plane: { origin, u, v, normal },
      centre: charted(course.at(pierced).origin),
      loop,
    };
  }

  /**
   * Inspect the knuckled digit root sections in anatomical row order. The composed end derives its own actual operand sections and rails from its source tree.
   *
   * @param which The limb.
   * @param placed The figure's families at a pose; absent, the reference pose.
   */
  export function fanRoots(
    which: "arm" | "leg",
    placed: IAutoMovieHumanF1.IAssembly = assemble(),
  ): { name: string; root: IAutoMovieHumanF1.IRootSection }[] {
    const parent: IAutoMovieHumanConicLoft.IFamily =
      which === "arm" ? placed.body.hand : placed.body.leg;
    return FANS[which].digits.map(
      (name: string): { name: string; root: IAutoMovieHumanF1.IRootSection } => ({
        name,
        root: rootSection(
          parent,
          placed.digits.find((d: IAutoMovieHumanF1.IDigit): boolean => d.family.name === name)!
            .family,
          64,
        ),
      }),
    );
  }

  /**
   * The seams a limb's open end is split along between its knuckled digits (`IAutoMovieConstructionSplit.outer`), from the little
   * finger's or the little toe's valley inward, each a pair of host phases on the end's ring enclosing the one before; each seam's heading,
   * toward the middle of the gap between the two digits' facing skins (`IAutoMovieConstructionSplit.IProfile.heading`); and the end's station, outward normal and palm or
   * sole normal. Historical source instruments read this section geometry independently of the realized composed-end split.
   *
   * The joints are the datums at the pose. The palm's normal is the vector product of the wrist's lines to the index and the pinky
   * finger's first joints; the sole's is the foot's stored direction `leg.fan.up`, the floor's normal reversed in the reference pose.
   *
   * @param which The limb.
   * @param placed The figure's families at a pose; absent, the reference pose.
   */
  export function fanSeams(
    which: "arm" | "leg",
    placed: IAutoMovieHumanF1.IAssembly = assemble(),
  ): {
    station: number;
    seams: [number, number][];
    headings: [number, number, number][];
    normal: number[];
    up: number[];
  } {
    const at: (name: string) => number[] = placed.point;
    const family: IAutoMovieHumanConicLoft.IFamily = {
      ...(which === "arm" ? placed.body.hand : placed.body.leg),
      tips: undefined,
    };
    const station: number = family.knots.at(-1)!;
    const sub = (a: number[], b: number[]): number[] => [
      a[0]! - b[0]!,
      a[1]! - b[1]!,
      a[2]! - b[2]!,
    ];
    const [a, b]: number[][] = [
      sub(at("index1"), at("hand")),
      sub(at("pinky1"), at("hand")),
    ];
    const up: number[] =
      which === "arm"
        ? [
            a[1]! * b[2]! - a[2]! * b[1]!,
            a[2]! * b[0]! - a[0]! * b[2]!,
            a[0]! * b[1]! - a[1]! * b[0]!,
          ]
        : placed.direction("leg.fan.up");
    const rows: [number[], number[]][] = (
      which === "arm"
        ? ["pinky", "ring", "middle", "index"]
        : ["littletoe", "ringtoe", "middletoe", "indextoe", "bigtoe"]
    ).map((digit: string): [number[], number[]] => [
      at(digit + "1"),
      at(digit + "2"),
    ]);
    const seams: [number, number][] = [];
    for (let i: number = 0; i + 1 < rows.length; ++i) {
      const [p, q]: [number, number] = valley(
        family,
        station,
        [rows[i]!, rows[i + 1]!],
        up,
      );
      if (seams.length === 0) {
        seams.push([p, q]);
        continue;
      }
      // Of the three readings of the same two crossings, the one that encloses the seam before.
      const [ia, ib]: [number, number] = seams.at(-1)!;
      const enclosing: [number, number] | undefined = (
        [
          [p, q],
          [q, p + 2 * Math.PI],
          [q - 2 * Math.PI, p],
        ] as [number, number][]
      ).find(
        ([x, y]: [number, number]): boolean =>
          x < ia && y > ib && y < x + 2 * Math.PI,
      );
      if (enclosing === undefined)
        throw new Error(
          "fanSeams: the valleys of the " + which + " do not nest",
        );
      seams.push(enclosing);
    }
    const frame = AutoMovieHumanConicLoft.axis(family).at(station);
    const normal: number[] = [
      frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1],
      frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2],
      frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0],
    ];
    // Each seam's plane holds its chord and the middle of the gap between the two digits' skins where they face each other, on each
    // digit's first section: the point of that ring farthest toward the other ring's centre. Held to the digits' mean direction instead
    // (the line from their first joints' midpoint to their second joints'), the plane between the index and the big toe stood midway
    // between their axes, 12.3 mm from each, but the big toe is the wider: its skin crossed the plane by 1.1 to 1.5 mm from 8 to 18 mm
    // along the seam, and the web scan's rays there ran on inside the big toe (31 to 47 mm) and were left out. The gap's middle stands
    // 3.1 mm toward the index toe there, and within 0.7 mm of the mean-direction plane at every other seam.
    const names: string[] =
      which === "arm"
        ? ["finger.pinky", "finger.ring", "finger.middle", "finger.index"]
        : ["toe.little", "toe.ring", "toe.middle", "toe.index", "toe.big"];
    const end: IAutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(
      family,
      family.knots,
    );
    if (end.chain === null)
      throw new Error("fanSeams: the " + which + " does not loft");
    const firstRings: number[][][] = names.map((name: string): number[][] => {
      const digit: IAutoMovieHumanConicLoft.IFamily = placed.digits.find(
        (d: IAutoMovieHumanF1.IDigit): boolean => d.family.name === name,
      )!.family;
      const loft: IAutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(
        { ...digit, tips: [null, digit.tips?.[1] ?? null] },
        digit.knots,
      );
      if (loft.chain === null)
        throw new Error("fanSeams: " + name + " does not loft");
      const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;
      const point: (phase: number) => AutoMovieVector3Tuple = AutoMovieLoftChain.sampler(chain, digit.knots[0]!);
      return Array.from({ length: 256 }, (_: unknown, k: number): number[] =>
        point((2 * Math.PI * k) / 256),
      );
    });
    const centre = (ring: number[][]): number[] =>
      [0, 1, 2].map(
        (c: number): number =>
          ring.reduce((sum: number, p: number[]): number => sum + p[c]!, 0) /
          ring.length,
      );
    const terminal: (phase: number) => AutoMovieVector3Tuple = AutoMovieLoftChain.sampler(end.chain, station);
    const headings: [number, number, number][] = seams.map(
      ([phase]: [number, number], i: number): [number, number, number] => {
        const [one, two]: number[][][] = [firstRings[i]!, firstRings[i + 1]!];
        const toward: number[] = sub(centre(two), centre(one));
        const reach = (p: number[]): number =>
          p[0]! * toward[0]! + p[1]! * toward[1]! + p[2]! * toward[2]!;
        const near: number[] = one.reduce(
          (best: number[], p: number[]): number[] =>
            reach(p) > reach(best) ? p : best,
        );
        const far: number[] = two.reduce(
          (best: number[], p: number[]): number[] =>
            reach(p) < reach(best) ? p : best,
        );
        const d: number[] = sub(
          [0, 1, 2].map((c: number): number => (near[c]! + far[c]!) / 2),
          terminal(phase),
        );
        const l: number = Math.hypot(d[0]!, d[1]!, d[2]!);
        return [
          Math.round((d[0]! / l) * 1e4) / 1e4,
          Math.round((d[1]! / l) * 1e4) / 1e4,
          Math.round((d[2]! / l) * 1e4) / 1e4,
        ];
      },
    );
    return { station, seams, headings, normal, up };
  }

  /**
   * Declare the sewn body.
   *
   * @param layer Station spacing of each family's layers and derived outlines, mm.
   * @param pose The pose the families are placed at (`assemble`); absent, the reference pose.
   * @evidence contracts/development/implementation.md#principled-implementation Resolves the requested pose once and delegates all coupled consumers to constructionFrom with that assembly.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Retains the existing public layer/pose call shape as one delegation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A supplied pose is always passed to assemble; resolved input has its own entry point rather than an ignored-pose combination.
   * @evidence contracts/development/common.md#meaningful-documentation States physical layer spacing and pose default.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds constant delegation to assemble and constructionFrom's documented work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One assembly serves the complete tree and returned source map.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned records borrow that assembly's immutable source inputs for reader lifetime; the wrapper retains no additional cache or handle.
   */
  export function construction(
    layer: number = LAYER_MM,
    pose?: IAutoMovieHumanF1Placement.IPose,
  ): IAutoMovieHumanF1.IConstructionWithNails {
    return constructionFrom(assemble(pose), layer);
  }

  /** Exact production family cap/clock scope and kept wall interval, before lofting. */
  export function sourceScope(
    placed: IAutoMovieHumanF1.IAssembly,
    name: keyof IAutoMovieHumanF1.IAssembly["body"],
  ): AutoMovieHumanF1SourceScope.IResult {
    const family: IAutoMovieHumanConicLoft.IFamily = placed.body[name];
    if (name === "arm")
      return AutoMovieHumanF1SourceScope.resolve(family, {
        kind: "arm",
        until: placed.station(
          family.name,
          AutoMovieHumanF1ArmEnd.station(
            placed.reference(family.name),
            placed.reference(placed.body.hand.name),
          ),
        ),
        ...(PHASE_TURN.arm === undefined ? {} : { turn: PHASE_TURN.arm }),
      });
    if (name === "hand" || name === "leg")
      return AutoMovieHumanF1SourceScope.resolve(family, {
        kind: name,
        ...(PHASE_TURN[name === "hand" ? "arm" : "leg"] === undefined
          ? {}
          : { turn: PHASE_TURN[name === "hand" ? "arm" : "leg"] }),
      });
    if (name === "trunk" || name === "nose")
      return AutoMovieHumanF1SourceScope.resolve(family, {
        kind: name,
        phase: name === "trunk" ? TRUNK_PHASE : NOSE_PHASE,
      });
    return AutoMovieHumanF1SourceScope.resolve(family, { kind: name });
  }
  /**
   * Declare the sewn body from one already resolved assembly in figure-world mm.
   * Every source, host loop, child rail, descendant datum and station window reads
   * that invocation. No pose argument can be silently ignored or applied twice.
   * Existing bare-root loft helpers and anatomical priors remain unchanged;
   * this ownership prerequisite does not establish a new anatomical boundary law.
   * The supplied central pelvis/thorax/head frames, courses/datums and pose
   * preserve the fixed bilateral figure plane z=0 consumed by twins, fans and
   * fills. This function does not validate arbitrary supplied frame callbacks,
   * and a valid logical topology alone does not establish that premise.
   *
   * @param placed Complete immutable generating inputs, already placed exactly once.
   * @param layer Physical sampling resolution in mm.
   * @evidence contracts/development/implementation.md#principled-implementation All construction consumers borrow the same resolved families, reference-station lookup, station transport, frames and datums; the existing operators and root helpers own their geometry.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The old public constructor resolves one assembly and delegates here; this distinct entry point accepts no pose or replacement source map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No template tree is paired with later replacement leaves, no ambient deformation is applied, and no unavailable derivative is filled. Existing loft-derived bare root loops remain a separate boundary-law limitation.
   * @evidence contracts/development/common.md#meaningful-documentation States figure-world mm, resolved-input lifetime, once-only placement, bare-root scope and lack of anatomical acceptance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Retains the existing per-family refinement, root-loop sampling and tree construction costs; the reference and station lookups add constant map work at each existing consumer.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each source leaf is built once from its invocation's family and shared by the returned source map; all roots use the same assembly instead of another default assembly.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned tree and source map own their generated records and borrow the assembly's transitive immutable inputs for reader lifetime; no module cache or background process is added.
   */
  export function constructionFrom(
    assembled: IAutoMovieHumanF1.IAssembly,
    layer: number = LAYER_MM,
  ): IAutoMovieHumanF1.IConstructionWithNails {
    return declaration(assembled, layer, undefined, undefined, true);
  }

  /**
   * The already placed tree and its sources without an additional nail pass.
   * The tree retains its declared attachment contacts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Uses the passed placed source as supplied, in figure-world mm.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same tree builder receives production bedded inputs or the original inputs.
   */
  export function constructionBareFrom(
    placed: IAutoMovieHumanF1.IAssembly,
    layer: number = LAYER_MM,
    observeContact?: IAutoMovieHumanJoinLoop.IMeasure,
  ): IAutoMovieHumanF1.IConstructionWithContacts {
    return declaration(placed, layer, undefined, observeContact);
  }

  /**
   * The three composed ends' stations on their hosts' courses, mm: the hand's at its middle finger's first joint, the leg's at the ball
   * of the foot, the trunk's foot midway between its course's foot and the thigh joints' height. A reader that needs an end's plane
   * reads it on the host's course at this station, without lofting the host.
   *
   * @param placed The placed figure.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each end is its landmark's address on the host's own course.
   * @evidence contracts/development/common.md#meaningful-documentation Names each end's landmark.
   */
  export function endStations(placed: IAutoMovieHumanF1.IAssembly): { hand: number; foot: number; pelvis: number } {
    const station = (family: IAutoMovieHumanConicLoft.IFamily, point: AutoMovieVector3Tuple): number => {
      const domain: [number, number] = [family.knots[0]!, family.knots.at(-1)!];
      return AutoMovieHumanJoinLoop.address({ name: family.name, axis: AutoMovieHumanConicLoft.axis(family) }, domain, point,
        (domain[0] + domain[1]) / 2)[0];
    };
    const trunkFoot = AutoMovieHumanConicLoft.axis(placed.body.trunk).at(placed.body.trunk.knots[0]!).origin;
    return {
      hand: station(placed.body.hand, placed.point("middle1")),
      foot: AutoMovieHumanF1NativeSites.footStation(placed.body.leg, placed.point("footBall")),
      pelvis: station(placed.body.trunk, [trunkFoot[0], (trunkFoot[1] + placed.point("thigh")[1]) / 2, trunkFoot[2]]),
    };
  }

  /**
   * The whole construction tree with only the named faces' sources prepared: a reader of one joint (a composed end's host and children)
   * gets its owner node and its own sources without lofting every other family of the figure.
   *
   * @param placed The placed figure.
   * @param names The faces whose sources are prepared.
   * @param layer The layer spacing, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The same declaration as `constructionBareFrom`, with the source registry restricted to the named faces.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A named face the declaration does not make is refused by name.
   * @evidence contracts/development/implementation.md#efficient-algorithms Lofts the named faces only.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the declaration with every other reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the declaration's records.
   * @evidence contracts/development/common.md#meaningful-documentation States the restriction.
   */
  export function constructionOf(
    placed: IAutoMovieHumanF1.IAssembly,
    names: ReadonlySet<string>,
    layer: number = LAYER_MM,
  ): IAutoMovieHumanF1.IConstructionWithContacts {
    const declared = declaration(placed, layer, names, undefined, false);
    for (const name of names) if (!declared.sources.has(name)) throw new Error("the construction's named face is absent: " + name);
    return declared;
  }

  /**
   * Prepare the placed declaration's original wall and cap controls before
   * attachment fields are bound.
   *
   * @param names Registered physical source faces. Omit for the complete original bank.
   *
   * @param held Per face, the complete emitted station array of a base source whose discrete choices a derivative holds fixed. The face
   *   is resolved at exactly those stations without refinement, and is kept only when it emits the same array element by element;
   *   otherwise the face takes the ordinary path.
   */
  export function originalSources(
    placed: IAutoMovieHumanF1.IAssembly,
    names?: ReadonlySet<string>,
    layer: number = LAYER_MM,
    held?: ReadonlyMap<string, readonly number[]>,
  ): ReadonlyMap<string, IAutoMovieViewPart> {
    if (names?.size === 0) throw new Error("a material source query needs at least one registered face");
    const sources = declaration(placed, layer, names, undefined, false, held, false).sources;
    if (names !== undefined)
      for (const name of names) if (!sources.has(name)) throw new Error("the material source face is absent: " + name);
    return sources;
  }

  /** Build the original or bedded tree through one source registry. */
  function declaration(
    placed: IAutoMovieHumanF1.IAssembly,
    layer: number,
    names?: ReadonlySet<string>,
    observeContact?: IAutoMovieHumanJoinLoop.IMeasure,
    nailsRequested: boolean = false,
    held?: ReadonlyMap<string, readonly number[]>,
    withContacts: boolean = true,
  ): IAutoMovieHumanF1.IConstructionWithNails {
    const sources: Map<string, IAutoMovieViewPart> = new Map();
    const faceLayers: [number, number, number] = [
      placed.station(placed.body.trunk.name, TRUNK_FACE_LAYERS[0]),
      placed.station(placed.body.trunk.name, TRUNK_FACE_LAYERS[1]),
      placed.station(
        placed.body.trunk.name,
        TRUNK_FACE_LAYERS[0],
        TRUNK_FACE_LAYERS[2],
      ),
    ];
    /** Read one declaration's fixed family/cap scope on a requested layer grid. */
    type LayerSource = (stations: number[], bare?: boolean, refine?: boolean) => IAutoMovieViewPart;
    const leafSource = (
      family: IAutoMovieHumanConicLoft.IFamily,
      fine: number = -Infinity,
      close: number = WEB_LAYER_MM,
      pitch: number = layer,
      until: number = Infinity,
      dome: number = Infinity,
      since: number = -Infinity,
    ): IAutoMovieViewPart => {
      const sample = family.native?.preparePart?.(family);
      const part: LayerSource = (stations, bare = false, refine = true) => {
        const scope: IAutoMovieHumanConicLoft.IFamily = bare ? { ...family, reliefs: undefined } : family;
        return sample === undefined
          ? AutoMovieHumanConicLoft.part(scope, stations, refine)
          : sample(stations, scope);
      };

      // A held face keeps the base source's stations: the caps' rings come from the family's own tips, and the face is kept only when
      // the whole emitted array is the base's, so every discrete choice of the base stands.
      const fixed: readonly number[] | undefined = held?.get(family.name);
      if (fixed !== undefined) {
        const [low, high] = family.tips ?? [null, null];
        const interior: number[] = fixed.filter((s: number): boolean =>
          (low === null || s >= low.from) && (high === null || s <= high.from));
        const made: IAutoMovieViewPart = part(interior, false, false);
        if (made.stations.length === fixed.length && made.stations.every((s: number, i: number): boolean => s === fixed[i]))
          return made;
      }
      const from: number = Math.max(family.knots[0]!, since);
      const to: number = Math.min(family.knots.at(-1)!, until);
      if (!(to > from)) throw new Error(family.name + ": the source section interval is empty");
      const count: number = Math.ceil((to - from) / pitch) + 1;
      const even: number[] = Array.from(
        { length: count },
        (_: unknown, i: number): number =>
          i === 0 ? from : i === count - 1 ? to :
            from + ((to - from) * i) / (count - 1),
      );

      // Inside a relief whose net is finer along the station than the layers, each layer interval is cut until it is as fine: rings 4 mm
      // apart showed the face's net, 2.6 mm apart, as level steps.
      const stations: number[] = even.flatMap(
        (s: number, i: number): number[] => {
          if (i === 0) return [s];
          const before: number = even[i - 1]!;
          const step: number = Math.min(
            pitch,
            before < fine ? close : pitch,
            ...(family.name === placed.body.trunk.name &&
            s > faceLayers[0] &&
            before < faceLayers[1]
              ? [faceLayers[2]]
              : []),
            ...(family.reliefs ?? [])
              .filter(
                (relief): boolean =>
                  relief.stations[0] < s && relief.stations[1] > before,
              )
              .map(
                (relief): number =>
                  (relief.stations[1] - relief.stations[0]) /
                  ((NET_LAYER_ROWS[
                    relief.name.replace(/(\.twin)?(\.mirror)?$/, "")
                  ] ?? relief.rows) -
                    3),
              ),
          );
          const cuts: number = Math.ceil((s - before) / step - 1e-9);
          return Array.from(
            { length: cuts },
            (_: unknown, k: number): number =>
              before + ((s - before) * (k + 1)) / cuts,
          );
        },
      );
      const refined: number[] = folded(family, part, domed(part, swept(family, part, stations), dome));
      // Refinement inserts interior stations; the declared terminal plane is exact.
      refined[refined.length - 1] = to;
      return part(refined);
    };
    // Whether a family's source (or its twin's) is declared: a carried start that needs a side join's loop is made only then.
    const declares = (name: string): boolean => names === undefined || names.has(name) || names.has(name + ".mirror");
    const leaf = (
      family: IAutoMovieHumanConicLoft.IFamily,
      fine?: number, close?: number, pitch?: number, until?: number, dome?: number, since?: number,
    ): IAutoMovieConstructionNode => {
      if (names === undefined || names.has(family.name))
        sources.set(family.name, leafSource(family, fine, close, pitch, until, dome, since));
      return { type: "source", name: family.name, source: family.name };
    };

    // The same stations with each interval from `from` on cut until no ring point of the wall moves farther than a layer between two
    // rings. Over a dome the skin faces up, and a ring point moves across it several times as far as the station: on f1's crown the wall
    // narrows 1.2 to 1.3 mm a millimetre of station, rings 4 mm apart stood 6 to 7 mm apart on the skin and drew concentric terraces on
    // `head.high-oblique`. Measured on the wall alone, without the reliefs, and only over the crown, so the head's rings below, which the
    // ear's band is triangulated against, stay where they were.
    const domed = (
      part: LayerSource,
      stations: number[],
      from: number,
    ): number[] => {
      if (!Number.isFinite(from)) return stations;
      const loft: IAutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part(stations, true));
      if (loft.chain === null) return stations;
      const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;
      const moved = (s: number, t: number): number => {
        const low: (phase: number) => AutoMovieVector3Tuple = AutoMovieLoftChain.sampler(chain, s);
        const high: (phase: number) => AutoMovieVector3Tuple = AutoMovieLoftChain.sampler(chain, t);
        return Math.max(
          ...Array.from(
            { length: FOLD.phases },
            (_: unknown, j: number): number => {
              const phase: number = (2 * Math.PI * j) / FOLD.phases;
              const p: AutoMovieVector3Tuple = low(phase), q: AutoMovieVector3Tuple = high(phase);
              return Math.hypot(
                p[0] - q[0],
                p[1] - q[1],
                p[2] - q[2],
              );
            },
          ),
        );
      };
      return stations.flatMap((s: number, i: number): number[] => {
        if (i === 0) return [s];
        const before: number = stations[i - 1]!;
        const cuts: number =
          before < from
            ? 1
            : Math.max(1, Math.ceil(moved(before, s) / layer - 1e-9));
        return Array.from(
          { length: cuts },
          (_: unknown, k: number): number =>
            before + ((s - before) * (k + 1)) / cuts,
        );
      });
    };

    // The same stations with each interval cut until no ring point moves farther than a layer by the course frame's own sweep. Round a
    // turn a point off the course moves by `1 + kappa d` times the station, `d` its distance toward the turn's outside: round the shoulder
    // the deltoid's cap moved 7 to 10 mm between layers 4 mm apart, round the heel 8 to 10, and every ring showed as a stripe. Measured by
    // the frame alone, not by the rings' whole change, so a section that changes shape on a straight course keeps its layers.
    const swept = (
      family: IAutoMovieHumanConicLoft.IFamily,
      part: LayerSource,
      stations: number[],
    ): number[] => {
      if (family.centres.length < 3) return stations;
      const loft: IAutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part(stations, true));
      if (loft.chain === null) return stations;
      const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;
      const course: IAutoMovieViewAxis.IAxis =
        AutoMovieHumanConicLoft.axis(family);
      const reach = (s: number, t: number): number => {
        const [from, to]: IAutoMovieLoftSectionFrame[] = [
          course.at(s),
          course.at(t),
        ];
        const point: (phase: number) => AutoMovieVector3Tuple = AutoMovieLoftChain.sampler(chain, s);
        return Math.max(
          ...Array.from(
            { length: FOLD.phases },
            (_: unknown, j: number): number => {
              const p: number[] = point((2 * Math.PI * j) / FOLD.phases);
              const r: number[] = [0, 1, 2].map(
                (k: number): number => p[k]! - from.origin[k]!,
              );
              const [x, y]: number[] = [from.u, from.v].map(
                (e: [number, number, number]): number =>
                  r[0]! * e[0] + r[1]! * e[1] + r[2]! * e[2],
              );
              return Math.hypot(
                ...[0, 1, 2].map(
                  (k: number): number =>
                    to.origin[k]! + x! * to.u[k]! + y! * to.v[k]! - p[k]!,
                ),
              );
            },
          ),
        );
      };
      return stations.flatMap((s: number, i: number): number[] => {
        if (i === 0) return [s];
        const before: number = stations[i - 1]!;
        const cuts: number = Math.ceil(
          Math.max(reach(before, s), reach(s, before)) / layer - 1e-9,
        );
        return Array.from(
          { length: Math.max(1, cuts) },
          (_: unknown, k: number): number =>
            before + ((s - before) * (k + 1)) / Math.max(1, cuts),
        );
      });
    };

    // The same stations with a layer added wherever the family's skin turns too fast between two of them (`FOLD`): on a relieved family
    // where the skin stands off the chord's middle by more than the sagitta, and on every family wherever it turns along the station by
    // more than `FOLD.turn` between an interval's halves, a band's chord angle on the skin's own radius along the course.
    const folded = (
      family: IAutoMovieHumanConicLoft.IFamily,
      part: LayerSource,
      stations: number[],
    ): number[] => {
      const loft: IAutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part(stations));
      if (loft.chain === null) return stations;
      const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;
      const ring = (s: number): number[][] => {
        const point: (phase: number) => AutoMovieVector3Tuple = AutoMovieLoftChain.sampler(chain, s);
        return Array.from({ length: FOLD.phases }, (_: unknown, j: number): number[] =>
          point((2 * Math.PI * j) / FOLD.phases),
        );
      };
      const between = (
        a: number,
        low: number[][],
        b: number,
        high: number[][],
      ): number[] => {
        if (b - a <= 2 * FOLD.least) return [];
        const middle: number = (a + b) / 2;
        const mid: number[][] = ring(middle);
        const off: boolean = mid.some(
          (p: number[], j: number): boolean =>
            Math.hypot(
              p[0]! - (low[j]![0]! + high[j]![0]!) / 2,
              p[1]! - (low[j]![1]! + high[j]![1]!) / 2,
              p[2]! - (low[j]![2]! + high[j]![2]!) / 2,
            ) > FOLD.sagitta,
        );
        return off
          ? [
              ...between(a, low, middle, mid),
              middle,
              ...between(middle, mid, b, high),
            ]
          : [];
      };
      const rings: number[][][] | null = (family.reliefs ?? []).length === 0 ? null : stations.map(ring);
      const cut: number[] = rings === null ? stations : stations.flatMap(
        (s: number, i: number): number[] =>
          i === 0
            ? [s]
            : [...between(stations[i - 1]!, rings[i - 1]!, s, rings[i]!), s],
      );
      // Every family: no band turns along the course by more than `FOLD.turn` (`AutoMovieHumanLayerTurn`). Found on the heel, terraces
      // 4.4 mm apart on the outer side of the ankle's turn (f1 and every case); it acts wherever a family's skin turns along its course.
      return AutoMovieHumanLayerTurn.refine(chain, cut, { turn: FOLD.turn, phases: FOLD.fine, least: FOLD.least });
    };

    const twin = (
      family: IAutoMovieHumanConicLoft.IFamily,
    ): IAutoMovieHumanConicLoft.IFamily =>
      AutoMovieHumanConicLoft.mirror(family, family.name + ".mirror");
    // A digit as stored, whose stations the constants below are given in; `placed.station` carries each to the pose.
    const stored = (name: string): IAutoMovieHumanConicLoft.IFamily =>
      placed.reference(name);
    const trunk: string = placed.body.trunk.name;
    const reach = (
      family: IAutoMovieHumanConicLoft.IFamily,
      mm: number,
    ): number => placed.station(family.name, stored(family.name).knots[0]!, mm);

    // A located side join carries its master loop's measured size: its extent along the host's stations and its length, mm.
    type Size = { extent: number; length: number };
    type Located = ReturnType<typeof AutoMovieHumanBoundSection.port> & {
      hostAt: ReturnType<typeof AutoMovieHumanJoinLoop.master>["hostAt"];
      size: Size;
    };
    type Contact = { kind: "ready"; from: Located; twin: Located; gap: number } | { kind: "refused"; detail: string };
    type Attachment = { name: string; hostFace: string; partFace: string; count: number;
      side: 1 | -1; key: string; read?: (h: IAutoMovieViewPart, p: IAutoMovieViewPart) => Located; refusal?: string };
    const attachments = new Map<string, Attachment>();
    const attachmentTolerance: number = ATTACHMENT_TOLERANCE;
    const attachmentGrazing: number = ATTACHMENT_GRAZING;
    const reflected = ([s, phase]: readonly [number, number]): [number, number] => [s, -phase];
    const mirrorClock = <T extends { point: [number, number]; first: [number, number]; second: [number, number] }>(j: T) =>
      ({ point: reflected(j.point), first: reflected(j.first), second: reflected(j.second) });
    const reflectLocal = ([u, v]: readonly [number, number]): [number, number] => [u, -v];
    const odd = ([u, v]: readonly [number, number]): [number, number] => [-u, v];
    const twinSection = (name: string, field: IAutoMovieLoftSectionConnect.IOriginal): IAutoMovieLoftSectionConnect.IOriginal => ({
      name, domain: field.domain,
      point: (s, p) => reflectLocal(field.point(s, -p)),
      phase: (s, p) => { const x = field.phase(s, -p); return { p: reflectLocal(x.p), t: odd(x.t), tt: reflectLocal(x.tt) }; },
      jet: (s, p) => { const x = field.jet(s, -p);
        return { p: reflectLocal(x.p), s: reflectLocal(x.s), t: odd(x.t), ss: reflectLocal(x.ss), st: odd(x.st), tt: reflectLocal(x.tt) }; },
    });
    /** Prepare the shared sections and measured incidences from the original source bank of one attachment pair. */
    const prepareContact = (
      main: Attachment,
      other: Attachment,
      originals: ReadonlyMap<string, IAutoMovieViewPart>,
    ): Contact => {
      try {
        if (main.read === undefined) throw new AutoMovieLoftAdmissionError(main.refusal ?? "the attachment has no original divider");
        const readFace = (name: string): IAutoMovieViewPart => {
          const view = originals.get(name);
          if (view === undefined) throw new AutoMovieLoftAdmissionError("the original attachment source is absent: " + name);
          return view;
        };
        const originalHost = readFace(main.hostFace), reflectedHost = readFace(other.hostFace);
        const from = main.read(originalHost, readFace(main.partFace));
        const otherView = readFace(other.partFace);
        const twin: Located = {
          view: { ...otherView, originalSection: twinSection(other.partFace, from.view.originalSection!) },
          hostAt: (clock) => mirrorClock(from.hostAt(clock)),
          childAt: (clock) => mirrorClock(from.childAt(clock)),
          size: from.size,
        };
        const h = AutoMovieLoftViewFullSource.create(originalHost), p = AutoMovieLoftViewFullSource.create(from.view);
        const hm = AutoMovieLoftViewFullSource.create(reflectedHost), pm = AutoMovieLoftViewFullSource.create(twin.view);
        let gap = 0;
        for (let i = 0; i < 2 * main.count; ++i) {
          const clock = Math.PI * i / main.count;
          const host = from.hostAt(clock).point, child = from.childAt(clock).point;
          const hostTwin = reflected(host), childTwin = reflected(child);
          const own = AutoMovieHumanJoinLoop.columnGap(h, p, host, child);
          const mirror = AutoMovieHumanJoinLoop.columnGap(hm, pm, hostTwin, childTwin);
          observeContact?.(main.name, clock, i % 2 === 1, own, mirror);
          if (!(own <= attachmentTolerance * 1000 && mirror <= attachmentTolerance * 1000)) {
            const reflectionError = (a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): number =>
              Math.hypot(a[0] - b[0], a[1] - b[1], a[2] + b[2]);
            const hostError: number = reflectionError(h.point(...host), hm.point(...hostTwin));
            const partError: number = reflectionError(p.point(...child), pm.point(...childTwin));
            throw new AutoMovieLoftAdmissionError(
              "the original shared source has gap " + own + " mm and reflected gap " + mirror + " mm at " + clock +
              " (host reflection error " + hostError + " mm, part reflection error " + partError + " mm)",
            );
          }
          gap = Math.max(gap, own, mirror);
        }
        return { kind: "ready", from, twin, gap };
      } catch (error: unknown) {
        return { kind: "refused", detail: error instanceof Error ? error.message : String(error) };
      }
    };
    const attached = (
      label: string, host: IAutoMovieConstructionNode, hostFace: string,
      part: IAutoMovieConstructionNode, partFace: string, side: 1 | -1,
      count: number, rows: number, fold: IAutoMovieConstructionFoldWidth,
      read: Attachment["read"] | string,
    ): IAutoMovieConstructionNode => {
      const name = label + "." + partFace, key = partFace.replace(/\.mirror$/, "");
      attachments.set(name, { name, hostFace, partFace, side, key, count,
        ...(typeof read === "string" ? { refusal: read } : { read }) });
      const seed = (which: "hostAt" | "childAt"): [number, number] => {
        const record = contact(key);
        if (record.kind === "refused") throw new AutoMovieLoftAdmissionError(record.detail);
        const [s, p] = (side === 1 ? record.from : record.twin)[which](0).point;
        return [s / 1000, p];
      };
      return { type: "join", kind: "merge", name, host, part,
        seed: { type: "point", hostFace, partFace,
          get host() { return seed("hostAt"); }, get part() { return seed("childAt"); } },
        parameter: { type: "arc" }, loop: { type: "source", source: name }, partWidth: fold, hostWidth: fold,
        count, rows, tolerance: attachmentTolerance, grazing: attachmentGrazing, continuity: "G2",
      };
    };
    const bind = (parent: IAutoMovieViewPart, child: IAutoMovieViewPart, family: IAutoMovieHumanConicLoft.IFamily,
      cut: ReturnType<typeof thumbCut> | AutoMovieHumanF1Mammary.ILoop |
        ReturnType<typeof AutoMovieHumanJoinLoop.master>, count: number,
      reach: number | ((size: Size) => number)): Located => {
      const tol = attachmentTolerance * 1000;
      // A landmark divider's cut of the parent's skin, or a loop the caller generated on the parent's skin by its own rule.
      const master = "divider" in cut
        ? AutoMovieHumanJoinLoop.master(parent, count, cut.landmarks, cut.divider, cut.owns, tol, attachmentGrazing)
        : cut;
      const domain = AutoMovieLoftViewFullSource.create(child).domain;
      const station = AutoMovieHumanJoinLoop.materialAddresses(child, domain, family, placed.reference(family.name));
      const observed = Array.from({ length: 2 * count }, (_, k) => {
        const clock: number = Math.PI * k / count;
        return { clock, held: k % 2 === 1, addresses: station(master.at(clock).point) };
      });
      const refused = observed.filter(({ addresses }): boolean => addresses.length !== 1);
      if (refused.length > 0)
        throw new AutoMovieLoftAdmissionError(child.name + " has no unique original section plane on every observed master clock: " +
          JSON.stringify({ domain, missing: refused.filter(({ addresses }): boolean => addresses.length === 0).length,
            multiple: refused.filter(({ addresses }): boolean => addresses.length > 1).length, refused }));
      const high = Math.max(...observed.map(({ addresses }) => addresses[0]![0]));
      const ceiling = family.tips?.[1]?.from ?? domain[1];
      // The master's size at the observed clocks: its extent along the host's stations and its length as a closed polygon.
      const hostStations: number[] = observed.map(({ clock }): number => master.hostAt(clock).point[0]);
      const points = observed.map(({ clock }) => master.at(clock).point);
      const size: Size = {
        extent: Math.max(...hostStations) - Math.min(...hostStations),
        length: points.reduce((sum: number, p, i: number): number => {
          const q = points[(i + 1) % points.length]!;
          return sum + Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
        }, 0),
      };
      // The protected mark by the joint's own rule: one fold reach (on the part's side) past the loop's deepest station on the child's
      // course (joints-one-shot.md, "The port blend, ruled"); the port runs from the loop to it.
      const mark: number = high + (typeof reach === "number" ? reach : reach(size));
      if (!(mark < ceiling)) throw new AutoMovieLoftAdmissionError(child.name + "'s port mark " + mark + " reaches its distal cap at " + ceiling);
      // The host's slope rides with a master that publishes the host's normal (`AutoMovieHumanJoinLoop.master`); the breast's generated loop
      // publishes none yet, so its port keeps the zero slope until its own root refit.
      return { ...AutoMovieHumanBoundSection.port({ view: child, station, at: master.at, count, mark, tolerance: tol,
        ...("normal" in master ? { normal: master.normal } : {}) }), hostAt: master.hostAt, size };
    };
    // These physical fold inputs are provisional geometric priors. The
    // shared-loop foot gap is checked independently of width and grazing.
    const fold = (radius: number, cap: number, reach: number): IAutoMovieConstructionFoldWidth => ({
      type: "fold", radius: radius / 1000, cap: cap / 1000, reach: reach / 1000,
    });
    const frame = (name: string): IAutoMovieHumanSegmentFrame => {
      const found: IAutoMovieHumanSegmentFrame | undefined = placed.frames.get(name);
      if (found === undefined) throw new Error("the contact requires segment " + name);
      return found;
    };
    const { hand: handEnd, foot: footEnd, pelvis: pelvisEnd } = endStations(placed);
    const compose: IAutoMovieConstructionSplit.ICompose = {
      frame: "host",
      plane: { point: [0, 0, 0], normal: [0, 0, 1] },
    };
    const armscyeCut = () => {
      const thorax = frame("thorax"), root = placed.point("upperarm"), next = placed.point("lowerarm");
      const landmarks = AutoMovieHumanF1Armscye.landmarks(thorax);
      return {
        divider: AutoMovieHumanF1Armscye.surface(thorax, root, next), landmarks,
        owns: AutoMovieHumanF1Divide.landmarkOwner(root, [root, next, placed.point("hand")], landmarks, AutoMovieHumanF1Divide.ARMSCYE_MM),
      };
    };
    // The thumb's root: the plane square to its metacarpal at `AutoMovieHumanF1ThumbRoot.ROOT_SHARE` of its length (a flattened rule);
    // its seeds stand on that plane at the thumb's own mean reach there (its course starts at the carpometacarpal centre), and it owns
    // the skin within that reach of the plane's centre or of the thumb's course.
    // The root plane's station on the thumb's course, which starts at the carpometacarpal centre and runs along the metacarpal.
    const thumbPlane = (): number => {
      const root = placed.point("thumb2"), cmc = frame("thumb.metacarpal").origin;
      return AutoMovieHumanF1ThumbRoot.ROOT_SHARE * Math.hypot(root[0] - cmc[0]!, root[1] - cmc[1]!, root[2] - cmc[2]!);
    };
    // Past the plane by the thumb fold's reach on the thumb's side (`THUMB_CHORD_MM`), the join's own need.
    const thumbFrom = (): number => Math.max(0, thumbPlane() - attachmentTolerance * 1000);
    const thumbCut = (thumb: IAutoMovieHumanConicLoft.IFamily) => {
      const metacarpal = frame("thumb.metacarpal"), root = placed.point("thumb2"), next = placed.point("thumb3");
      const divider = AutoMovieHumanF1ThumbRoot.divider(metacarpal, root);
      const cmc = metacarpal.origin;
      const landmarks = AutoMovieHumanF1ThumbRoot.seeds(divider, AutoMovieHumanConicLoft.meanReach(thumb, thumbPlane()));
      return {
        divider, landmarks,
        owns: AutoMovieHumanF1Divide.landmarkOwner(divider.origin, [[cmc[0]!, cmc[1]!, cmc[2]!], root, next], landmarks),
      };
    };

    // The breast's footprint and the trunk's skin cut by it (`AutoMovieHumanF1Mammary`), prepared once per declaration from the trunk's
    // own source and shared by both sides: the twin's loop is this one reflected (`contact`). The breast is carried back past the loop's
    // deepest station by its fold's reach (`AutoMovieHumanF1Mammary.FOLD_SHARE.reach` of the footprint's height), so every loop point has
    // a section plane of the breast and the fold's band has the breast's own skin under it. The preparation holds the footprint and the
    // loop on the trunk's source.
    type Mammary = { from: number; fold: IAutoMovieConstructionFoldWidth; reach: number; loop: AutoMovieHumanF1Mammary.ILoop };
    const prepareMammary = (host: IAutoMovieViewPart): Mammary => {
      const thorax = frame("thorax");
      const landmarks = AutoMovieHumanF1Armscye.landmarks(thorax);
      // The person's umbilicus: the navel site (ANSUR II omphalion, `AutoMovieHumanF1NativeSites`) carried to the person's trunk course.
      const umbilicus: AutoMovieVector3Tuple = [...AutoMovieHumanConicLoft.axis(placed.body.trunk)
        .at(placed.station(trunk, AutoMovieHumanF1NativeSites.REFERENCE.wall.omphalion.station)).origin] as AutoMovieVector3Tuple;
      const print = AutoMovieHumanF1Mammary.footprint(AutoMovieHumanConicLoft.axis(placed.body.breast).at(0), {
        suprasternale: thorax.origin, up: thorax.axes[1], hips: frame("pelvis").origin,
        shoulder: landmarks[0]!, armpitFront: landmarks[1]!, bust: frame("breast").origin, umbilicus,
      }, host);
      const own = AutoMovieHumanF1Mammary.loop(host, print);
      // The fold by the footprint's own size (`AutoMovieHumanF1Mammary.FOLD_SHARE`), in metres.
      const sized = AutoMovieHumanF1Mammary.fold(print);
      return {
        from: Math.min(...own.stations) - attachmentTolerance * 1000,
        fold: { type: "fold", radius: sized.radii[0]! / 1000, radii: sized.radii.map((r: number): number => r / 1000), reach: sized.reach / 1000, cap: sized.cap / 1000 },
        reach: sized.reach,
        loop: own,
      };
    };

    // The armscye's master, prepared once per declaration on the trunk's own source and shared by the arm's start and its bind. The
    // port starts at the loop's shallowest station on the arm's course, less one address tolerance. A refused trace leaves the arm at
    // its stored start and refuses again at its bind, so the join fails with its one diagnostic.
    type Armscye = { from: number; master: () => ReturnType<typeof AutoMovieHumanJoinLoop.master> };
    const prepareArmscye = (host: IAutoMovieViewPart): Armscye => {
      const cut = armscyeCut();
      const arm: IAutoMovieHumanConicLoft.IFamily = placed.body.arm;
      try {
        const own = AutoMovieHumanJoinLoop.master(
          host, SHOULDER_COLUMNS, cut.landmarks, cut.divider, cut.owns, attachmentTolerance * 1000, attachmentGrazing);
        const axis = { name: arm.name, axis: AutoMovieHumanConicLoft.axis(arm) };
        const stations: number[] = Array.from({ length: 2 * SHOULDER_COLUMNS }, (_, k: number): number =>
          AutoMovieHumanJoinLoop.address(axis, [0, arm.knots.at(-1)!], own.at((Math.PI * k) / SHOULDER_COLUMNS).point, arm.knots[0]!)[0]);
        return { from: Math.max(0, Math.min(...stations) - attachmentTolerance * 1000), master: () => own };
      } catch (error: unknown) {
        return { from: arm.knots[0]!, master: (): never => { throw error; } };
      }
    };

    /** Prepare only the side starts the requested source names need, on the trunk's own declared wall. */
    const prepareSideSources = (): { armscye?: Armscye; mammary?: Mammary } => {
      const needArmscye: boolean = declares(placed.body.arm.name);
      const needMammary: boolean = declares(placed.body.breast.name);
      if (!needArmscye && !needMammary) return {};
      const host: IAutoMovieViewPart = sources.get(trunk) ??
        leafSource(sourceScope(placed, "trunk").family, -Infinity, WEB_LAYER_MM, layer, Infinity, placed.station(trunk, CROWN_MM), pelvisEnd);
      return {
        armscye: needArmscye ? prepareArmscye(host) : undefined,
        mammary: needMammary ? prepareMammary(host) : undefined,
      };
    };
    const armscyeContact = (): Armscye => {
      if (sideSources.armscye === undefined) throw new AutoMovieLoftAdmissionError("the armscye's contact was not prepared: the arm is outside this declaration");
      return sideSources.armscye;
    };
    const mammaryContact = (): Mammary => {
      if (sideSources.mammary === undefined) throw new AutoMovieLoftAdmissionError("the breast's contact was not prepared: the breast is outside this declaration");
      return sideSources.mammary;
    };

    /** Prepare the one placed digit source and nail shared by both declarations. */
    const prepareDigit = (digit: IAutoMovieHumanF1.IDigit) => {
      const rootFamily: IAutoMovieHumanConicLoft.IFamily = digit.knuckle
        ? digit.family
        : AutoMovieHumanConicLoft.extended(digit.family, thumbFrom());
      const own: IAutoMovieHumanConicLoft.IFamily = digit.limb === "arm" ? { ...rootFamily, turn: FINGER_TURN } : rootFamily;
      const pitch: number = digit.limb === "arm" ? FINGER_LAYER_MM : layer;
      const original: IAutoMovieViewPart | null = nailsRequested
        ? leafSource({ ...own, turn: undefined }, -Infinity, WEB_LAYER_MM, pitch)
        : null;
      const prepared = original === null ? null : {
        original,
        made: AutoMovieHumanF1Nails.createFrom({ ...digit, family: rootFamily }, placed.frames, original),
      };
      return { digit, rootFamily, own, pitch, prepared };
    };
    type DigitSource = ReturnType<typeof prepareDigit>;
    const digits: DigitSource[] = placed.digits.map(prepareDigit);
    const digitByName: ReadonlyMap<string, DigitSource> = new Map(digits.map((source: DigitSource): [string, DigitSource] => [source.own.name, source]));

    /** Read a side of the digit and fit the prepared nail's bed to its published view. */
    const digitLeaf = ({ own, pitch, prepared }: DigitSource, side: 1 | -1): IAutoMovieConstructionNode => {
      if (prepared === null) return leaf(side === 1 ? own : twin(own), -Infinity, WEB_LAYER_MM, pitch);
      const equipped: IAutoMovieHumanConicLoft.IFamily = { ...own, reliefs: [...(own.reliefs ?? []), prepared.made.nail.bed] };
      const family: IAutoMovieHumanConicLoft.IFamily = side === 1 ? equipped : twin(equipped);
      const reliefs: NonNullable<IAutoMovieHumanConicLoft.IFamily["reliefs"]> = family.reliefs!;
      const original: IAutoMovieViewPart = side === 1 ? prepared.original :
        leafSource({ ...family, turn: undefined, reliefs: own.reliefs === undefined ? undefined : reliefs.slice(0, -1) },
          -Infinity, WEB_LAYER_MM, pitch);
      sources.set(family.name, AutoMovieHumanF1Nails.addReliefs(original, family, [reliefs.at(-1)!]));
      return { type: "source", name: family.name, source: family.name };
    };

    // Each composed end is owned by its actual terminal section and child sources.
    const limb = (
      which: "arm" | "leg",
      side: 1 | -1,
    ): { node: IAutoMovieConstructionNode; face: string } => {
      const fanned: IFan = FANS[which];
      const leaned: IAutoMovieHumanConicLoft.IFamily = sourceScope(
        placed,
        which === "arm" ? "hand" : "leg",
      ).family;
      const family: IAutoMovieHumanConicLoft.IFamily = side > 0 ? leaned : twin(leaned);
      const end: number = which === "arm" ? handEnd : footEnd;
      let node: IAutoMovieConstructionNode = leaf(family, -Infinity, WEB_LAYER_MM, layer, end);
      for (const source of digits.filter(
        ({ digit }: DigitSource): boolean => digit.limb === which && !digit.knuckle,
      )) {
        // A part on its host's side is carried back as its own tube (`AutoMovieHumanConicLoft.continued`) past its loop by its fold's reach: the
        // thumb past its root's plane, on the metacarpal (`thumbFrom`).
        const { digit, rootFamily } = source;
        const part: IAutoMovieConstructionNode = digitLeaf(source, side);
        node = attached(
          "web", node, family.name, part, part.name,
          side, 48, 4, fold(THUMB_CHORD_MM, THUMB_CHORD_MM, THUMB_CHORD_MM),
          (parent, child) => bind(parent, child, digit.family, thumbCut(rootFamily), 48, THUMB_CHORD_MM),
        );
      }
      const children: IAutoMovieConstructionSplit.IChild[] = fanned.digits.map(

        (name: string): IAutoMovieConstructionSplit.IChild => {
          const digit: DigitSource = digitByName.get(name)!;
          const part: IAutoMovieConstructionNode = digitLeaf(digit, side);
          return {
            band: "band." + part.name,
            part,
            partFace: part.name,
            partEnd: "bottom",
            rail: (fanned.rail * rootReach(digit.digit.family)) / 1000,
            correspondence: "length",
          };
        },
      );
      node = {
        type: "split",
        name: "fan." + family.name,
        host: node,
        hostFace: family.name,
        hostEnd: "top",
        seam: [0, Math.PI],
        outer: children.slice(2).map((): IAutoMovieConstructionSplit.ISeam => ({ seam: [0, Math.PI] })),
        compose,
        count: fanned.columns,
        rows: fanned.rows,
        children: children as IAutoMovieConstructionSplit["children"],
      };
      if (which === "leg") return { node, face: family.name };

      // The arm ends open at the transported reference wrist plane and the hand, a family of its own on a wider knuckle turn, continues it across a
      // band (`WRIST`), since the two families' sections need not share one ring.
      const armScope: AutoMovieHumanF1SourceScope.IResult = sourceScope(
        placed,
        "arm",
      );
      // The arm is carried back as its own tube past the armscye master's shallowest point on its course by the fold's reach (`armscyeContact`),
      // so the loop over the cap's top (arm stations 17.3 to 23.7 mm, before the stored first knot at 24) has a section plane of the arm
      // (joints-one-shot.md, row 5, amendment D and "The carried root stretch, corrected").
      // The master is traced only when the arm's source is declared or the join is realized (`declares`).
      const arm: IAutoMovieHumanConicLoft.IFamily = declares(armScope.family.name)
        ? AutoMovieHumanConicLoft.extended(armScope.family, armscyeContact().from)
        : armScope.family;
      const armFamily: IAutoMovieHumanConicLoft.IFamily =
        side > 0 ? arm : twin(arm);
      return {
        node: {
          type: "continue",
          name: "wrist." + armFamily.name,
          host: leaf(
            armFamily,
            -Infinity,
            WEB_LAYER_MM,
            layer,
            armScope.wallDomain[1],
          ),
          hostFace: armFamily.name,
          hostEnd: "top",
          part: node,
          partFace: family.name,
          partEnd: "bottom",
          band: {
            rail: (WRIST.rail * rootReach(placed.body.hand)) / 1000,
            count: WRIST.count,
            rows: WRIST.rows,
            correspondence: "length",
          },
        },
        face: armFamily.name,
      };
    };

    // The trunk's section chart has +u forward and +v to +Z, so the seam from phase 0 to pi gives the first child the +Z half of the end.
    const legs: { node: IAutoMovieConstructionNode; face: string }[] = [
      limb("leg", 1),
      limb("leg", -1),
    ];
    let root: IAutoMovieConstructionNode = {
      type: "split",
      name: "crotch",
      host: leaf(
        sourceScope(placed, "trunk").family,
        -Infinity,
        WEB_LAYER_MM,
        layer,
        Infinity,
        placed.station(trunk, CROWN_MM),
        pelvisEnd,
      ),
      hostFace: trunk,
      hostEnd: "bottom",
      seam: [0, Math.PI],
      compose,
      count: THIGH_COLUMNS,
      rows: BAND.rows,
      children: [
        {
          band: "band." + legs[0]!.face,
          part: legs[0]!.node,
          partFace: legs[0]!.face,
          partEnd: "bottom",
          rail: (CROTCH_RAIL_SHARE * rootReach(placed.body.leg)) / 1000,
        },
        {
          band: "band." + legs[1]!.face,
          part: legs[1]!.node,
          partFace: legs[1]!.face,
          partEnd: "bottom",
          rail: (CROTCH_RAIL_SHARE * rootReach(placed.body.leg)) / 1000,
        },
      ],
    };
    // The side contacts, prepared here in the declaration's order: the crotch's root above declared the trunk's own source, and the
    // arms and breasts below read the contacts; a declaration that leaves the arm or the breast out prepares neither for it.
    const sideSources: ReturnType<typeof prepareSideSources> = prepareSideSources();
    for (const side of [1, -1] as const) {
      const arm: { node: IAutoMovieConstructionNode; face: string } = limb(
        "arm",
        side,
      );
      // The fold's widths are shares of the master loop's extent along the trunk (`ARMSCYE_SHARE`), which exists only once the
      // contact has traced the master: read lazily, as the join's seeds are.
      const armKey: string = arm.face.replace(/\.mirror$/, "");
      const armExtent = (): number => {
        const record = contact(armKey);
        if (record.kind === "refused") throw new AutoMovieLoftAdmissionError(record.detail);
        return record.from.size.extent;
      };
      root = attached(
        "armscye", root, trunk, arm.node, arm.face, side,
        SHOULDER_COLUMNS, ARMSCYE_ROWS, {
          type: "fold",
          get radius(): number { return (ARMSCYE_SHARE.radius * armExtent()) / 1000; },
          get cap(): number { return (ARMSCYE_SHARE.cap * armExtent()) / 1000; },
          get reach(): number { return (ARMSCYE_SHARE.reach * armExtent()) / 1000; },
        },
        (parent, child) => bind(parent, child, placed.body.arm, armscyeContact().master(), SHOULDER_COLUMNS, (size: Size): number => ARMSCYE_SHARE.reach * size.extent),
      );
      // The plate root is a medial attachment. Upper ear geometry keeps its own owners.
      const helix: IAutoMovieHumanConicLoft.IFamily =
        side > 0 ? placed.helix : twin(placed.helix);
      const antihelix: IAutoMovieHumanConicLoft.IFamily =
        side > 0 ? placed.antihelix : twin(placed.antihelix);
      const concha: IAutoMovieHumanConicLoft.IFamily =
        side > 0 ? placed.concha : twin(placed.concha);
      const plate: IAutoMovieHumanConicLoft.IFamily =
        side > 0 ? placed.body.ear : twin(placed.body.ear);
      const ridge = (
        host: IAutoMovieConstructionNode,
        part: IAutoMovieHumanConicLoft.IFamily,
        share: { fair: number; chord: number },
      ): IAutoMovieConstructionNode => ({
        type: "join",
        kind: "merge",
        name: "ridge." + part.name,
        host,
        part: leaf(part, Infinity),
        seed: {
          type: "search",
          partFace: part.name,
          hostFace: plate.name,
          phase: 0,
          phases: EAR_SEED_LINES,
          from: 0,
          to: 0.5,
        },
        parameter: { type: "arc" },
        partWidth: { type: "chord", value: (share.chord * rootReach(part)) / 1000 },
        hostWidth: { type: "chord", value: (share.chord * rootReach(part)) / 1000 },
        continuity: "G2",
        count: 192,
        rows: 4,
        tolerance: 1e-12,
        grazing: 0.04,
        fair: (share.fair * rootReach(part)) / 1000,
      });
      // The stored traced merge stays: no closed medial head-insertion contour has been witnessed on the reference (joint worker A's
      // 2026-11-20 02:26 survey: tragion and the insertion marks are open marks), so no landmark surface can be declared, and a shared-loop
      // join refused for that would drop the plate from the figure (joints-one-shot.md, row 6).
      root = {
        type: "join",
        kind: "merge",
        name: "root." + plate.name,
        host: root,
        part: leaf(plate, Infinity),
        seed: { type: "search", partFace: plate.name, hostFace: trunk, phase: Math.PI, phases: EAR_SEED_LINES, from: 0, to: 1 },
        parameter: { type: "arc" },
        partWidth: { type: "chord", value: (EAR_SHARE.root.chord * rootReach(plate)) / 1000 },
        hostWidth: { type: "chord", value: (EAR_SHARE.root.chord * rootReach(plate)) / 1000 },
        continuity: "G2",
        count: 256,
        rows: 4,
        tolerance: 1e-12,
        grazing: 0.04,
        fair: (EAR_SHARE.root.fair * rootReach(plate)) / 1000,
      };
      root = ridge(root, helix, EAR_SHARE.helix);
      root = ridge(root, antihelix, EAR_SHARE.antihelix);
      root = {
        type: "join",
        kind: "diff",
        name: "cut." + concha.name,
        host: root,
        part: leaf(concha),
        seed: {
          type: "search",
          partFace: concha.name,
          hostFace: trunk,
          phase: Math.PI,
          phases: EAR_SEED_LINES,
          from: 0,
          to: 0.9,
        },
        parameter: { type: "arc" },

        // A quarter-millimetre chord, held under half the radius of the tighter turn the rail meets (`IAutoMovieConstructionCurvatureWidth`),
        // so each rail moves along the curve at least half as fast as the curve. At a constant 0.25 mm, allsite95's cut met a 0.21 mm turn of its
        // curve toward the cutter's rail at the cutter's floor-front corner (t 1.11) and the rail ran backward there, a folded blend.
        partWidth: { type: "curvature", share: 0.5, cap: 0.00025, end: null },
        hostWidth: { type: "curvature", share: 0.5, cap: 0.00025, end: null },
        continuity: "G2",
        count: 192,
        rows: 4,
        tolerance: 1e-12,
        grazing: 0.04,
      };

      // The breast, a part on the trunk's side (joints-one-shot.md, "The breast's footprint by rule"): its family starts inside the chest
      // as the footprint carried along its course, the trunk's skin cut by that wall is the loop both share, and one shared-loop merge
      // meets them with a fold of stated radius. Its layers stand half a millimetre apart all along it (`BREAST_LAYER_MM`) and its phases
      // 1.5 mm (`BREAST_PITCH_MM`).
      // The loop is made only when the breast's source is declared or the join is realized: a declaration of other names (each
      // derivative column of a fit) leaves it, and the trunk's source it is read on, unmade.
      const pitched: IAutoMovieHumanConicLoft.IFamily = { ...placed.body.breast, pitch: BREAST_PITCH_MM };
      const carried: IAutoMovieHumanConicLoft.IFamily = declares(pitched.name)
        ? AutoMovieHumanConicLoft.extended(pitched, mammaryContact().from)
        : pitched;
      const breast: IAutoMovieHumanConicLoft.IFamily = side > 0 ? carried : twin(carried);
      root = attached(
        "mammary", root, trunk, leaf(breast, Infinity, BREAST_LAYER_MM), breast.name, side,
        SHOULDER_COLUMNS, BAND.rows, {
          type: "fold",
          get radius(): number { return mammaryContact().fold.radius; },
          get radii(): number[] { return mammaryContact().fold.radii!; },
          get reach(): number { return mammaryContact().fold.reach!; },
          get cap(): number { return mammaryContact().fold.cap; },
        },
        (parent, child) => bind(parent, child, placed.body.breast, mammaryContact().loop, SHOULDER_COLUMNS, mammaryContact().reach),
      );
    }
    const nosePort: IAutoMovieHumanF1NativeRoot.IRootSpec | undefined = placed.nativePorts?.get(
      placed.body.nose.name,
    );
    root = {
      type: "port",
      name: "nostril." + placed.body.nose.name,
      host: root,
      hostFace: trunk,
      loop: nostril(placed),
      band: "band." + placed.body.nose.name,
      part: leaf(sourceScope(placed, "nose").family),
      partFace: placed.body.nose.name,
      partEnd: "bottom",
      rail:
        nosePort === undefined
          ? reach(placed.body.nose, Math.min(...NOSE_RAILS_MM)) / 1000
          : Math.min(...nosePort.railDistances) / 1000,
      rails:
        nosePort === undefined
          ? NOSE_RAILS_MM.map(
              (rail: number): number => reach(placed.body.nose, rail) / 1000,
            )
          : nosePort.railDistances.map((mm: number): number => mm / 1000),
      correspondence: "length",
      profiles: NOSE_PROFILES,
      count: NOSE_COLUMNS,
      rows: BAND.rows,
    };
    // Each nostril is cut from the head: its loft comes up out of the nose's underside and closes inside it. The band lands behind it, so the
    // cut lies wholly on the nose's own face and its blend may be as wide as the rim's roll; while the cut crossed the band at the sill only
    // a blend 0.15 mm wide found its rails there.
    const rim: number = nostrilRim(placed.nostril);
    for (const side of [1, -1] as const) {
      const drawn: IAutoMovieHumanConicLoft.IFamily = spreadOut(
        drawnIn(placed.nostril, rim),
        placed.station(placed.nostril.name, NOSTRIL_MOUTH_MM),
        placed.station(
          placed.nostril.name,
          NOSTRIL_MOUTH_MM,
          NOSTRIL_SPREAD_MM,
        ),
      );
      const hollow: IAutoMovieHumanConicLoft.IFamily =
        side > 0 ? drawn : twin(drawn);
      root = {
        type: "join",
        kind: "diff",
        name: "cut." + hollow.name,
        host: root,
        part: leaf(hollow, Infinity, NOSTRIL_LAYER_MM),
        seed: placed.nativeSeed?.(hollow, {
          phase: 0, from: 0, to: 0.9,
        }, placed.body.nose.name) ?? {
          type: "search",
          partFace: hollow.name,
          hostFace: placed.body.nose.name,
          phase: 0,
          from: 0,
          to: 0.9,
        },
        parameter: { type: "phase" },
        partWidth: { type: "chord", value: rim / 1000 },
        hostWidth: { type: "chord", value: rim / 1000 },
        continuity: "G2",
        count: NOSTRIL_BLEND.count,
        rows: NOSTRIL_BLEND.rows,
        tolerance: 1e-12,
        grazing: 0.05,
      };
    }
    // Bind each bilateral attachment once from the unmodified sources, before publishing the port views.
    const primary: Attachment[] = [...attachments.values()].filter(({ side }): boolean => side === 1);
    const contacts: ReadonlyMap<string, Contact> = new Map(withContacts
      ? primary.map((main): [string, Contact] => [main.key, prepareContact(main, attachments.get(main.name + ".mirror")!, sources)])
      : []);
    const contact = (key: string): Contact => contacts.get(key)!;
    if (withContacts && names === undefined)
      for (const { partFace, side, key } of attachments.values()) {
        const raw: IAutoMovieViewPart | undefined = sources.get(partFace);
        if (raw === undefined || !primary.some((main) => main.key === key && main.read !== undefined)) continue;
        const made: Contact = contact(key);
        sources.set(partFace, { ...raw, get originalSection() {
          if (made.kind === "refused") throw new AutoMovieLoftAdmissionError(made.detail);
          return (side === 1 ? made.from : made.twin).view.originalSection!;
        } });
      }
    const loops = new Map<string, IAutoMovieConstructionSharedLoop.ISource>();
    if (withContacts)
      for (const { name, hostFace, partFace, side, key } of attachments.values()) {
        const made: Contact = contact(key);
        if (made.kind === "refused") loops.set(name, { hostFace, partFace, kind: "refused", detail: made.detail });
        else {
          const bound = side === 1 ? made.from : made.twin;
          loops.set(name, Object.freeze({ hostFace, partFace, kind: "ready", at: bound.hostAt, partAt: bound.childAt }));
        }
      }
    return {
      root, sources, fills: [], loopSources: () => loops,
      nails: nailsRequested ? digits.map(({ prepared }: DigitSource): IAutoMovieHumanF1Nails.IMade => prepared!.made) : [],
      contactPremises: (): IAutoMovieHumanF1.IContactPremise[] =>
        primary.map(({ name, hostFace, partFace, key, count }) => {
          const made = contact(key);
          return made.kind === "ready" ? { name, hostFace, partFace, kind: "prepared", gapMm: made.gap, columns: count }
            : { name, hostFace, partFace, kind: "refused", detail: made.detail };
        }),
    };
  }

  /**
   * Generate the figure's pieces: the sewn body, then every loose family and its twin.
   *
   * @param step Station spacing of a loose family's layers, mm.
   * @param phases Vertices round every layer of a loose family.
   * @param chord Largest distance the sewn body's triangles may stand off its surfaces, metres. Most of the generation time is this tessellation.
   */
  export function create(
    step: number = 4,
    phases: number = 128,
    chord: number = 0.001,
  ): IAutoMovieHumanF1.IPiece[] {
    const declared: IAutoMovieHumanF1.IConstruction = construction();
    const real: IAutoMovieConstructionRealization.IRealization =
      realizeAutoMovieConstruction(
        { name: "f1.body", root: declared.root, fills: declared.fills },
        { chord, sources: declared.sources, loopSources: declared.loopSources() },
      );
    const pieces: IAutoMovieHumanF1.IPiece[] = [
      {
        name: "body",
        positions: Array.from(real.mesh.positions),
        indices: Array.from(real.mesh.indices),
        diagnostics: real.diagnostics.map(
          (d: { node: string; contract: string; detail: string }): string =>
            d.node + " (" + d.contract + "): " + d.detail,
        ),
      },
    ];
    for (const { family, mirrored, reach } of LOOSE) {
      // Layers from the first knot to the last, widened by the member's reach, evenly spaced at most `step` apart.
      const from: number = family.knots[0]! - (reach?.[0] ?? 0);
      const to: number = family.knots.at(-1)! + (reach?.[1] ?? 0);
      const count: number = Math.max(2, Math.ceil((to - from) / step) + 1);
      const stations: number[] = Array.from(
        { length: count },
        (_: unknown, i: number): number =>
          from + ((to - from) * i) / (count - 1),
      );
      const loft: IAutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(
        family,
        stations,
      );
      const diagnostics: string[] = loft.diagnostics.map((d: unknown): string =>
        JSON.stringify(d),
      );
      if (loft.chain === null) {
        pieces.push({
          name: family.name,
          positions: [],
          indices: [],
          diagnostics,
        });
        continue;
      }
      const chain: NonNullable<IAutoMovieViewLoft.IResult["chain"]> = loft.chain;

      // Past the last knot the loft's own cap layers follow, and the pole closes them by a fan.
      const layers: number[] = [
        ...stations,
        ...chain.layers
          .map((layer: { y: number }): number => layer.y)
          .filter((y: number): boolean => y > to),
      ];
      const rings: number[][][] = layers.map((s: number): number[][] => {
        const point: (phase: number) => AutoMovieVector3Tuple = AutoMovieLoftChain.sampler(chain, s);
        return Array.from({ length: phases }, (_: unknown, j: number): number[] =>
          point((2 * Math.PI * j) / phases),
        );
      });
      for (const sign of mirrored ? [1, -1] : [1]) {
        const positions: number[] = [];
        const indices: number[] = [];
        for (const ring of rings)
          for (const p of ring)
            positions.push(p[0]! / 1000, p[1]! / 1000, (sign * p[2]!) / 1000);
        if (chain.pole?.end === "top") {
          const apex: number = positions.length / 3;
          const last: number = (rings.length - 1) * phases;
          positions.push(
            chain.pole.point[0] / 1000,
            chain.pole.point[1] / 1000,
            (sign * chain.pole.point[2]) / 1000,
          );
          for (let j: number = 0; j < phases; ++j)
            indices.push(
              ...(sign > 0
                ? [last + j, apex, last + ((j + 1) % phases)]
                : [last + j, last + ((j + 1) % phases), apex]),
            );
        }
        for (let i: number = 0; i + 1 < rings.length; ++i)
          for (let j: number = 0; j < phases; ++j) {
            const a: number = i * phases + j;
            const b: number = i * phases + ((j + 1) % phases);

            // The reflection reverses the winding, so the twin's triangles are listed the other way round.
            if (sign > 0)
              indices.push(a, a + phases, b, b, a + phases, b + phases);
            else indices.push(a, b, a + phases, b, b + phases, a + phases);
          }
        pieces.push({
          name: family.name + (sign > 0 ? "" : ".mirror"),
          positions,
          indices,
          diagnostics,
        });
      }
    }
    return pieces;
  }
}
