import { AutoMovieIllinois, AutoMovieViewSection } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmWalk,
  IAutoMovieHumanDigitWalk,
  IAutoMovieHumanHandAttachment,
  IAutoMovieHumanHandParent,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieViewPart,
  IAutoMovieViewSection,
} from "@automovie/interface";

import { AutoMovieHumanHandParent } from "./AutoMovieHumanHandParent";
import { AutoMovieHumanHandParentRead } from "./AutoMovieHumanHandParentRead";
import { AutoMovieHumanHandVector as V } from "./AutoMovieHumanHandVector";

/**
 * Parent-owned hand attachments, before either side is lofted.
 *
 * The palm's +u is radial breadth; its +v is palmar/dorsal depth. A digit
 * instead uses +u for its dorsal direction. Its proximal depth therefore has a
 * parent v-chord datum at the actual radial location; its actual oblique dorsal
 * rays then intersect the whole parent field. Neither reads the whole palm
 * breadth as depth or uses a global-height slice. The complete parent scalar
 * field, frame, quarter ownership and available physical jets remain in the
 * attachment record. The measured PIP breadth remains this digit's width.
 */
export namespace AutoMovieHumanHandAttachment {
  /**
   * Explicit legacy fixture/part adapter; production calls fromControls before
   * publishing its arm.
   */
  export function prepare(
    definition: IAutoMovieHumanSourceDefinition,
  ): IAutoMovieHumanHandParent.IOutput {
    return AutoMovieHumanHandParent.prepare(definition);
  }

  /**
   * Consume the same generating scalar/frame owner directly, without acquiring
   * a completed arm.
   */
  export function fromControls(
    prepared: IAutoMovieHumanArmWalk.IPrepared,
  ): IAutoMovieHumanHandParent.IOutput {
    return AutoMovieHumanHandParent.fromControls(prepared);
  }

  /**
   * Consume the parent's actual chord and whole fullness for the proximal skin.
   * The root closure may move along the same first-bone line into the parent;
   * generating skeletal joints and all distal joint/skin apex positions stay.
   */
  export function attach(
    parent: IAutoMovieHumanHandParent.IOutput,
    input: IAutoMovieHumanDigitWalk.IInput,
  ): IAutoMovieHumanHandAttachment.IAttached {
    const joint: AutoMovieVector3Tuple = input.centres[0]!;
    const first: AutoMovieVector3Tuple = input.centres[1]!;
    const length: number = V.norm(V.sub(first, joint));
    if (!(length > 0))
      throw new Error(`The ${input.name} first bone has no direction`);
    const tangent: AutoMovieVector3Tuple = V.scale(
      V.sub(first, joint),
      1 / length,
    );
    const { root, section, jointSection }: Placement = inside(
      parent,
      joint,
      tangent,
      length,
      input.name,
    );
    const chordV: [number, number] = chord(section);
    const u: AutoMovieVector3Tuple = V.across(input.dorsal, tangent);
    if (!(V.norm(u) > 0))
      throw new Error(`No actual dorsal frame for ${input.name}`);
    const v: AutoMovieVector3Tuple = V.cross(u, tangent);
    const dorsalChord: IAutoMovieHumanHandAttachment.IConnection["dorsalChord"] =
      {
        lower: edge(parent, root, V.scale(u, -1), section, -1),
        upper: edge(parent, root, u, section, 1),
      };
    const lower: number = dorsalChord.lower.ordinate;
    const upper: number = dorsalChord.upper.ordinate;
    if (!(lower < 0 && upper > 0))
      throw new Error(
        `The ${input.name} parent chord does not hold its dorsal axis`,
      );
    const quarterRays: IAutoMovieHumanHandAttachment.IConnection["quarterRays"] =
      [0, 1, 2, 3].map((q: number): IAutoMovieHumanHandAttachment.IEdge => {
        const phi: number = ((q + 0.5) * Math.PI) / 2;
        const direction: AutoMovieVector3Tuple = V.plus(
          V.scale(u, Math.cos(phi)),
          V.scale(v, Math.sin(phi)),
        );
        return edge(parent, root, direction, section, 1);
      }) as IAutoMovieHumanHandAttachment.IConnection["quarterRays"];
    const phases: IAutoMovieHumanHandAttachment.Quarters = quarterRays.map(
      (ray: IAutoMovieHumanHandAttachment.IEdge): number => {
        const angle: number = Math.atan2(
          ray.inside.local[1],
          ray.inside.local[0],
        );
        return angle < 0 ? angle + 2 * Math.PI : angle;
      },
    ) as IAutoMovieHumanHandAttachment.Quarters;
    const quarters: [number, number, number, number] = phases.map(
      (phase: number): number => Math.floor(phase / (Math.PI / 2)) % 4,
    ) as [number, number, number, number];
    const shoulders: IAutoMovieHumanHandAttachment.Quarters = quarterRays.map(
      (ray: IAutoMovieHumanHandAttachment.IEdge, q: number): number =>
        ray.inside.values.shoulders[quarters[q]!]!,
    ) as IAutoMovieHumanHandAttachment.Quarters;
    const near: IAutoMovieHumanDigitWalk.ISiteLaw = input.law("joint 1");
    const physical2: boolean = [
      section,
      dorsalChord.lower.inside,
      dorsalChord.upper.inside,
      ...quarterRays.map(
        (
          ray: IAutoMovieHumanHandAttachment.IEdge,
        ): IAutoMovieHumanHandAttachment.ISection => ray.inside,
      ),
    ].every(
      (reading: IAutoMovieHumanHandAttachment.ISection): boolean =>
        typeof reading.jets !== "string" && reading.axisJet !== null,
    );
    const proximal: IAutoMovieHumanHandAttachment.IConnection["proximal"] = {
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
            })) as NonNullable<IAutoMovieHumanDigitWalk.ISiteLaw["jets"]>,
            shoulderJets: [0, 1, 2, 3].map(
              (): { first: number; second: number } => ({
                first: 0,
                second: 0,
              }),
            ) as IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IKnot["jet"]>,
          }
        : {}),
    };
    const attachment: IAutoMovieHumanHandAttachment.IConnection = {
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
          (ray: IAutoMovieHumanHandAttachment.IEdge): number =>
            ray.inside.station,
        ) as IAutoMovieHumanHandAttachment.Quarters,
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
      law: (site: string): IAutoMovieHumanDigitWalk.ISiteLaw =>
        site === "base" ? attachment.proximal : input.law(site),
    };
  }

  /**
   * Read the actual normal plane on straight or curved source spans, never
   * global height.
   */
  export function locate(
    parent: IAutoMovieHumanHandParent.IOutput,
    point: AutoMovieVector3Tuple,
  ): IAutoMovieHumanHandAttachment.ISection | null {
    return AutoMovieHumanHandParentRead.locate(parent, point);
  }
}

/*
 * Selected skin datum and the original joint's separate coordinate
 * availability.
 */
interface Placement {
  /*
   * Supported source skin root, calibration mm.
   */
  root: AutoMovieVector3Tuple;
  /*
   * Actual parent material section at that root.
   */
  section: IAutoMovieHumanHandAttachment.ISection;
  /*
   * Original anatomical joint coordinate, with unavailability preserved.
   */
  jointSection: IAutoMovieHumanHandAttachment.ISection | null;
}

/*
 * The parent depth chord is along +v at fixed radial +u, not the old +u span.
 */
function chord(
  section: IAutoMovieHumanHandAttachment.ISection,
): [number, number] {
  const shape: IAutoMovieViewSection.ISection =
    AutoMovieHumanHandParentRead.section(section.values);
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
  function horizontal(phase: number): number {
    return AutoMovieViewSection.radius(shape, phase)[0] * Math.cos(phase);
  }
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

/*
 * Bracket an actual parent exit along one child-depth ray, including the
 * parent's changing planes.
 */
function edge(
  parent: IAutoMovieHumanHandParent.IOutput,
  root: AutoMovieVector3Tuple,
  direction: AutoMovieVector3Tuple,
  initial: IAutoMovieHumanHandAttachment.ISection,
  sign: 1 | -1,
): IAutoMovieHumanHandAttachment.IEdge {
  function at(distance: number): IAutoMovieHumanHandAttachment.ISection | null {
    return AutoMovieHumanHandAttachment.locate(
      parent,
      V.plus(root, V.scale(direction, distance)),
    );
  }
  let low: number = 0;
  let high: number = Math.min(...initial.values.extents);
  let inside: IAutoMovieHumanHandAttachment.ISection = initial;
  let outside: IAutoMovieHumanHandAttachment.ISection | null = at(high);
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
      const pole: IAutoMovieHumanHandAttachment.ISection | null =
        AutoMovieHumanHandAttachment.locate(
          parent,
          parent.part.axis.at(station).origin,
        );
      if (pole?.kind !== "pole") continue;
      const delta: AutoMovieVector3Tuple = V.sub(pole.frame.origin, root);
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
    const reading: IAutoMovieHumanHandAttachment.ISection | null = at(middle);
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
    const reading: IAutoMovieHumanHandAttachment.ISection | null = at(middle);
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

/*
 * Keep an interior joint; otherwise select the best supported candidate on its
 * proximal first-bone extension.
 */
function inside(
  parent: IAutoMovieHumanHandParent.IOutput,
  joint: AutoMovieVector3Tuple,
  tangent: AutoMovieVector3Tuple,
  length: number,
  name: string,
): Placement {
  const initial: IAutoMovieHumanHandAttachment.ISection | null =
    AutoMovieHumanHandAttachment.locate(parent, joint);
  if (initial !== null && initial.margin > 0)
    return { root: joint, section: initial, jointSection: initial };
  let root: AutoMovieVector3Tuple | null = null;
  let chosen: IAutoMovieHumanHandAttachment.ISection | null = null;
  let margin: number = 0;
  for (let index: number = 1; index <= 64; index++) {
    const point: AutoMovieVector3Tuple = V.plus(
      joint,
      V.scale(tangent, (-length * index) / 64),
    );
    const section: IAutoMovieHumanHandAttachment.ISection | null =
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
