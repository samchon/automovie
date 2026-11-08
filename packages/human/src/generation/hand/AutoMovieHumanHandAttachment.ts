import {
  AutoMovieIllinois,
  type AutoMovieLoftViewRead,
  AutoMovieViewSection,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { AutoMovieHumanDigitWalk } from "../limb/AutoMovieHumanDigitWalk";
import type { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";
import type { AutoMovieHumanArmWalk } from "../arm/AutoMovieHumanArmWalk";
import { AutoMovieHumanHandVector as V } from "./AutoMovieHumanHandVector";
import { AutoMovieHumanHandParentRead } from "./AutoMovieHumanHandParentRead";
import { AutoMovieHumanHandParent } from "./AutoMovieHumanHandParent";

/** Calibration-mm point or dimensionless direction. */
type Vec3 = V.Vec3;
/** The actual original section plane, before any loft or mesh. */
type Frame = ReturnType<IAutoMovieViewPart["axis"]["at"]>;
/** Four effective conic quarters in their declared material order. */
type Quarters = [number, number, number, number];
/** Selected skin datum and the original joint's separate coordinate availability. */
interface Placement {
  /** Supported source skin root, calibration mm. */
  root: Vec3;
  /** Actual parent material section at that root. */
  section: AutoMovieHumanHandAttachment.ISection;
  /** Original anatomical joint coordinate, with unavailability preserved. */
  jointSection: AutoMovieHumanHandAttachment.ISection | null;
}

/**
 * Parent-owned hand attachments, before either side is lofted.
 *
 * The palm's +u is radial breadth; its +v is palmar/dorsal depth. A digit
 * instead uses +u for its dorsal direction. Its proximal depth therefore
 * has a parent v-chord datum at the actual radial location; its actual
 * oblique dorsal rays then intersect the whole parent field. Neither reads
 * the whole palm breadth as depth or uses a global-height slice. The complete parent scalar
 * field, frame, quarter ownership and available physical jets remain in the
 * attachment record. The measured PIP breadth remains this digit's width.
 */
export namespace AutoMovieHumanHandAttachment {
  /** Common scalar/frame parent; production retains no completed neighbouring part. */
  export type IParent = AutoMovieHumanHandParent.IOutput;

  /** A qualified local original section and the point in its chart. */
  export interface ISection {
    /** A declared zero pole is a known point, not a positive native section. */
    kind: "regular" | "pole";
    /** Physical parent station, mm. */
    station: number;
    /** Actual parent plane and original scalar inputs at that station. */
    frame: Frame;
    /** Signed location in the parent +u(radial),+v(depth) chart, mm. */
    local: [number, number];
    /** Whole original four extents and effective quarter fullness. */
    values: AutoMovieLoftViewRead.IValues;
    /** Available physical source2, or its actual named absence. */
    jets: AutoMovieLoftViewRead.IJets | string;
    /** Actual axis jets; absence remains absence. */
    axisJet: ReturnType<NonNullable<IAutoMovieViewPart["axis"]["jet"]>> | null;
    /** Positive means the point lies inside the actual parent section, mm. */
    margin: number;
  }

  /** One canonical geometric attachment and its explicit material-chart map. */
  export interface IConnection {
    /** Actual digit source name, shared with the construction tree and observer. */
    name: string;
    /** Whole final parent source, shared rather than reconstructed from a mesh. */
    parent: IParent;
    /** Unchanged anatomical MCP/CMC; this is not the skin closure datum. */
    joint: Vec3;
    /** Original joint's qualified normal coordinate; null is unavailable, not an outside verdict. */
    jointSection: ISection | null;
    /** Skin closure inside the actual parent, on the same first-bone line. */
    root: Vec3;
    /** Qualified actual parent normal section at that root. */
    section: ISection;
    /** Lower/upper palmar-depth chord at fixed parent radial +u, mm. */
    chordV: [number, number];
    /** Actual parent intersections along the child's dorsal line, with explicit geometric brackets. */
    dorsalChord: { lower: IEdge; upper: IEdge };
    /** The child's own dorsal and breadth directions at its first straight bone. */
    childFrame: { u: Vec3; v: Vec3; tangent: Vec3 };
    /** Actual parent-boundary rays in the four child-quarter bisector directions. */
    quarterRays: [IEdge, IEdge, IEdge, IEdge];
    /** Parent phase at each actual ray exit, including the root's local offset, radians. */
    phases: Quarters;
    /** Parent quarter selected at each of those actual boundary points. */
    quarters: [number, number, number, number];
    /** The root law holds its source readings; their pullback station derivatives are zero. */
    parameterMap: {
      parentStation: number;
      depthStations: [number, number];
      quarterStations: Quarters;
      first: 0;
      second: 0;
    };
    /** Parent-derived positive base law, followed by the unchanged measured shaft and joints. */
    proximal: AutoMovieHumanDigitWalk.ISiteLaw & {
      /** Four effective source-quarter owners, in the child's engine chart. */
      shoulders: Quarters;
      /** Authored pullback jets only when all original physical/frame jets are available. */
      shoulderJets?: IAutoMovieViewPart.IQuarters<
        IAutoMovieViewPart.IKnot["jet"]
      >;
    };
    /** Original measured first-shaft law before the parent contact is attached. */
    measuredShaft: AutoMovieHumanDigitWalk.ISiteLaw;
  }

  /** A source-field boundary bracket; no absent parent coordinate becomes a numeric value. */
  export interface IEdge {
    /** World direction in which the signed ordinate and bracket are expressed. */
    direction: Vec3;
    /** Signed distance along that direction, mm. */
    ordinate: number;
    /** The actual inside and outside ray distances bracketing that boundary, mm. */
    bracket: [number, number];
    /** Last actual inside parent section, including its own frame and available jets. */
    inside: ISection;
    /** Qualified non-interior original reading, including a declared zero pole. */
    outside: ISection;
  }

  /** A digit input retaining the same canonical connection consumed by its law. */
  export interface IAttached extends AutoMovieHumanDigitWalk.IInput {
    /** Original parent, location, material map, fullness and jets. */
    attachment: IConnection;
  }

  /** Explicit legacy fixture/part adapter; production calls fromControls before publishing its arm. */
  export function prepare(definition: AutoMovieHumanSiteViewPart.IDefinition): IParent {
    return AutoMovieHumanHandParent.prepare(definition);
  }

  /** Consume the same generating scalar/frame owner directly, without acquiring a completed arm. */
  export function fromControls(prepared: AutoMovieHumanArmWalk.IPrepared): IParent {
    return AutoMovieHumanHandParent.fromControls(prepared);
  }

  /**
   * Consume the parent's actual chord and whole fullness for the proximal skin.
   * The root closure may move along the same first-bone line into the parent;
   * generating skeletal joints and all distal joint/skin apex positions stay.
   */
  export function attach(
    parent: IParent,
    input: AutoMovieHumanDigitWalk.IInput,
  ): IAttached {
    const joint: Vec3 = input.centres[0]!;
    const first: Vec3 = input.centres[1]!;
    const length: number = V.norm(V.sub(first, joint));
    if (!(length > 0))
      throw new Error(`The ${input.name} first bone has no direction`);
    const tangent: Vec3 = V.scale(V.sub(first, joint), 1 / length);
    const { root, section, jointSection }: Placement = inside(
      parent,
      joint,
      tangent,
      length,
      input.name,
    );
    const chordV: [number, number] = chord(section);
    const u: Vec3 = V.across(input.dorsal, tangent);
    if (!(V.norm(u) > 0))
      throw new Error(`No actual dorsal frame for ${input.name}`);
    const v: Vec3 = V.cross(u, tangent);
    const dorsalChord: IConnection["dorsalChord"] = {
      lower: edge(parent, root, V.scale(u, -1), section, -1),
      upper: edge(parent, root, u, section, 1),
    };
    const lower: number = dorsalChord.lower.ordinate;
    const upper: number = dorsalChord.upper.ordinate;
    if (!(lower < 0 && upper > 0))
      throw new Error(
        `The ${input.name} parent chord does not hold its dorsal axis`,
      );
    const quarterRays: IConnection["quarterRays"] = [0, 1, 2, 3].map(
      (q: number): IEdge => {
        const phi: number = ((q + 0.5) * Math.PI) / 2;
        const direction: Vec3 = V.plus(
          V.scale(u, Math.cos(phi)),
          V.scale(v, Math.sin(phi)),
        );
        return edge(parent, root, direction, section, 1);
      },
    ) as IConnection["quarterRays"];
    const phases: Quarters = quarterRays.map((ray: IEdge): number => {
      const angle: number = Math.atan2(
        ray.inside.local[1],
        ray.inside.local[0],
      );
      return angle < 0 ? angle + 2 * Math.PI : angle;
    }) as Quarters;
    const quarters: [number, number, number, number] = phases.map(
      (phase: number): number => Math.floor(phase / (Math.PI / 2)) % 4,
    ) as [number, number, number, number];
    const shoulders: Quarters = quarterRays.map(
      (ray: IEdge, q: number): number =>
        ray.inside.values.shoulders[quarters[q]!]!,
    ) as Quarters;
    const near: AutoMovieHumanDigitWalk.ISiteLaw = input.law("joint 1");
    const physical2: boolean = [
      section,
      dorsalChord.lower.inside,
      dorsalChord.upper.inside,
      ...quarterRays.map((ray: IEdge): ISection => ray.inside),
    ].every(
      (reading: ISection): boolean =>
        typeof reading.jets !== "string" && reading.axisJet !== null,
    );
    const proximal: IConnection["proximal"] = {
      breadth: near.breadth,
      depth: upper - lower,
      dorsal: upper / (upper - lower),
      shoulder: shoulders[0],
      shoulders,
      ...(physical2
        ? {
            jets: [0, 1, 2, 3].map((): { first: number; second: number } => ({
              first: 0,
              second: 0,
            })) as NonNullable<AutoMovieHumanDigitWalk.ISiteLaw["jets"]>,
            shoulderJets: [0, 1, 2, 3].map(
              (): { first: number; second: number } => ({
                first: 0,
                second: 0,
              }),
            ) as IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IKnot["jet"]>,
          }
        : {}),
    };
    const attachment: IConnection = {
      name: input.name,
      parent,
      joint,
      jointSection,
      root,
      section,
      chordV,
      dorsalChord,
      quarterRays,
      childFrame: { u, v, tangent },
      phases,
      quarters,
      parameterMap: {
        parentStation: section.station,
        depthStations: [
          dorsalChord.lower.inside.station,
          dorsalChord.upper.inside.station,
        ],
        quarterStations: quarterRays.map(
          (ray: IEdge): number => ray.inside.station,
        ) as Quarters,
        first: 0,
        second: 0,
      },
      proximal,
      measuredShaft: input.law("shaft 0"),
    };
    return {
      ...input,
      centres: [root, ...input.centres.slice(1)],
      attachment,
      law: (site: string): AutoMovieHumanDigitWalk.ISiteLaw =>
        site === "base"
          ? attachment.proximal
          : input.law(site),
    };
  }

  /** Read the actual normal plane on straight or curved source spans, never global height. */
  export function locate(parent: IParent, point: Vec3): ISection | null {
    return AutoMovieHumanHandParentRead.locate(parent, point);
  }
}

/** The parent depth chord is along +v at fixed radial +u, not the old +u span. */
function chord(
  section: AutoMovieHumanHandAttachment.ISection,
): [number, number] {
  const shape: AutoMovieViewSection.ISection = AutoMovieHumanHandParentRead.section(section.values);
  const across: number = section.local[0];
  if (
    !(
      across > -section.values.extents[2]! &&
      across < section.values.extents[0]!
    )
  )
    throw new Error(
      "The hand attachment is outside the actual radial supports",
    );
  const horizontal: (phase: number) => number = (phase: number): number =>
    AutoMovieViewSection.radius(shape, phase)[0] * Math.cos(phase);
  const result: number[] = [];
  for (const from of [0, Math.PI]) {
    const phase: number | null = AutoMovieIllinois.root(
      (angle: number): number => horizontal(angle) - across,
      from,
      from + Math.PI,
      1e-9,
      100,
    );
    if (phase === null || Math.abs(horizontal(phase) - across) > 1e-7)
      throw new Error("The actual hand-parent depth chord failed its residual");
    result.push(AutoMovieViewSection.radius(shape, phase)[0] * Math.sin(phase));
  }
  return [Math.min(...result), Math.max(...result)];
}

/** Bracket an actual parent exit along one child-depth ray, including the parent's changing planes. */
function edge(
  parent: AutoMovieHumanHandAttachment.IParent,
  root: Vec3,
  direction: Vec3,
  initial: AutoMovieHumanHandAttachment.ISection,
  sign: 1 | -1,
): AutoMovieHumanHandAttachment.IEdge {
  const at: (
    distance: number,
  ) => AutoMovieHumanHandAttachment.ISection | null = (
    distance: number,
  ): AutoMovieHumanHandAttachment.ISection | null =>
    AutoMovieHumanHandAttachment.locate(
      parent,
      V.plus(root, V.scale(direction, distance)),
    );
  let low: number = 0;
  let high: number = Math.min(...initial.values.extents);
  let inside: AutoMovieHumanHandAttachment.ISection = initial;
  let outside: AutoMovieHumanHandAttachment.ISection | null = at(high);
  for (let step: number = 0; outside !== null && outside.margin > 0; step++) {
    if (step === 64)
      throw new Error("The actual hand-parent ray has no finite exit bracket");
    low = high;
    inside = outside;
    high *= 2;
    outside = at(high);
  }
  if (outside === null) {
    for (const station of parent.domain) {
      const pole: AutoMovieHumanHandAttachment.ISection | null =
        AutoMovieHumanHandAttachment.locate(
          parent,
          parent.part.axis.at(station).origin,
        );
      if (pole?.kind !== "pole") continue;
      const delta: Vec3 = V.sub(pole.frame.origin, root);
      const distance: number = V.dot(delta, direction);
      if (
        distance >= low &&
        distance <= high &&
        V.norm(V.sub(delta, V.scale(direction, distance))) <= 1e-9
      ) {
        high = distance;
        outside = pole;
        break;
      }
    }
  }
  for (let step: number = 0; outside === null; step++) {
    if (step === 96 || high - low <= 1e-7)
      throw new Error(
        "The actual parent ray has no qualified boundary before an unavailable normal coordinate",
      );
    const middle: number = (low + high) / 2;
    const reading: AutoMovieHumanHandAttachment.ISection | null = at(middle);
    if (reading === null) high = middle;
    else if (reading.margin > 0) {
      low = middle;
      inside = reading;
    } else {
      high = middle;
      outside = reading;
    }
  }
  for (let step: number = 0; high - low > 1e-7; step++) {
    if (step === 96)
      throw new Error("The actual hand-parent exit bracket did not converge");
    const middle: number = (low + high) / 2;
    const reading: AutoMovieHumanHandAttachment.ISection | null = at(middle);
    if (reading === null)
      throw new Error(
        "The actual parent boundary bracket contains an unavailable normal coordinate",
      );
    if (reading.margin > 0) {
      low = middle;
      inside = reading;
    } else {
      high = middle;
      outside = reading;
    }
  }
  return {
    direction: V.scale(direction, sign),
    ordinate: (sign * (low + high)) / 2,
    bracket: [sign * low, sign * high],
    inside,
    outside,
  };
}

/** Keep an interior joint; otherwise select the best supported candidate on its proximal first-bone extension. */
function inside(
  parent: AutoMovieHumanHandAttachment.IParent,
  joint: Vec3,
  tangent: Vec3,
  length: number,
  name: string,
): Placement {
  const initial: AutoMovieHumanHandAttachment.ISection | null =
    AutoMovieHumanHandAttachment.locate(parent, joint);
  if (initial !== null && initial.margin > 0)
    return { root: joint, section: initial, jointSection: initial };
  let root: Vec3 | null = null;
  let chosen: AutoMovieHumanHandAttachment.ISection | null = null;
  let margin: number = 0;
  for (let index: number = 1; index <= 64; index++) {
    const point: Vec3 = V.plus(joint, V.scale(tangent, (-length * index) / 64));
    const section: AutoMovieHumanHandAttachment.ISection | null =
      AutoMovieHumanHandAttachment.locate(parent, point);
    if (section !== null && section.margin > margin) {
      root = point;
      chosen = section;
      margin = section.margin;
    }
  }
  if (root === null || chosen === null)
    throw new Error(
      `The ${name} first-bone line has no supported interior arm/palm attachment`,
    );
  return { root, section: chosen, jointSection: initial };
}
