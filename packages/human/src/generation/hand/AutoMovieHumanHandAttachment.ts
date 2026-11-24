import { AutoMovieIllinois } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmWalk,
  IAutoMovieHumanDigitWalk,
  IAutoMovieHumanHandAttachment,
  IAutoMovieHumanHandParent,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanHandParent } from "./AutoMovieHumanHandParent";
import { AutoMovieHumanHandParentRead } from "./AutoMovieHumanHandParentRead";
import { AutoMovieHumanHandVector as V } from "./AutoMovieHumanHandVector";

/**
 * Selected skin datum and the original joint's separate coordinate
 * availability.
 */
interface Placement {
  /** Supported source skin root, calibration mm. */
  root: AutoMovieVector3Tuple;
  /** Actual parent material section at that root. */
  section: IAutoMovieHumanHandAttachment.ISection;
  /** Original anatomical joint coordinate, with unavailability preserved. */
  jointSection: IAutoMovieHumanHandAttachment.ISection | null;
  /** Qualified boundaries in this candidate's child plane. */
  rays: Rays;
}

type Rays = Pick<
  IAutoMovieHumanHandAttachment.IConnection,
  "dorsalChord" | "quarterRays"
>;

type ParentRead = ReturnType<typeof AutoMovieHumanHandParentRead.prepare>;
type ParentSample = NonNullable<ReturnType<ParentRead["read"]>>;

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
    const u: AutoMovieVector3Tuple = V.across(input.dorsal, tangent);
    if (!(V.norm(u) > 0))
      throw new Error(`No actual dorsal frame for ${input.name}`);
    const v: AutoMovieVector3Tuple = V.cross(u, tangent);
    const {
      root,
      section,
      jointSection,
      rays: { dorsalChord, quarterRays },
    }: Placement = supportedRoot(
      parent,
      input.name,
      joint,
      tangent,
      length,
      u,
      v,
    );
    const chordV: [number, number] = chord(section);
    const lower: number = dorsalChord.lower.ordinate;
    const upper: number = dorsalChord.upper.ordinate;
    if (!(lower < 0 && upper > 0))
      throw new Error(
        `The ${input.name} parent chord does not hold its dorsal axis`,
      );
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
    const source: ParentRead = AutoMovieHumanHandParentRead.prepare(parent);
    const sample: ParentSample | null = source.read(point);
    return sample === null ? null : source.complete(sample);
  }
}

/** The parent depth chord is along +v at fixed radial +u, not the old +u span. */
function chord(
  section: IAutoMovieHumanHandAttachment.ISection,
): [number, number] {
  const radius = AutoMovieHumanHandParentRead.radius(section.values);
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
    radius(phase) * Math.cos(phase);
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
    result.push(radius(phase) * Math.sin(phase));
  }
  return [Math.min(...result), Math.max(...result)];
}

/**
 * Bracket an actual parent exit along one child-depth ray, including the
 * parent's changing planes.
 */
function edge(
  parent: IAutoMovieHumanHandParent.IOutput,
  source: ParentRead,
  root: AutoMovieVector3Tuple,
  direction: AutoMovieVector3Tuple,
  initial: ParentSample,
  sign: 1 | -1,
): IAutoMovieHumanHandAttachment.IEdge | null {
  const at = (distance: number): ParentSample | null =>
    source.read(V.plus(root, V.scale(direction, distance)));
  let low: number = 0;
  let high: number = Math.min(...initial.values.extents);
  let inside: ParentSample = initial;
  let outside: ParentSample | null = at(high);
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
      const pole: ParentSample | null = source.read(
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
    if (step === 96 || high - low <= 1e-7) return null;
    const middle: number = (low + high) / 2;
    const reading: ParentSample | null = at(middle);
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
    const reading: ParentSample | null = at(middle);
    if (reading === null) return null;
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
    inside: source.complete(inside),
    outside: source.complete(outside),
  };
}

/**
 * Keep a fully supported joint, or select the deepest admissible root along its
 * proximal first-bone extension. An interior radial reading alone does not
 * qualify a root: its oblique rays can leave the finite parent chart through
 * the wrist plane with positive skin margin.
 */
function supportedRoot(
  parent: IAutoMovieHumanHandParent.IOutput,
  name: string,
  joint: AutoMovieVector3Tuple,
  tangent: AutoMovieVector3Tuple,
  length: number,
  u: AutoMovieVector3Tuple,
  v: AutoMovieVector3Tuple,
): Placement {
  const source: ParentRead = AutoMovieHumanHandParentRead.prepare(parent);
  const initial: ParentSample | null = source.read(joint);
  const quarterDirections: AutoMovieVector3Tuple[] = [0, 1, 2, 3].map(
    (q: number): AutoMovieVector3Tuple => {
      const phi: number = ((q + 0.5) * Math.PI) / 2;
      return V.plus(V.scale(u, Math.cos(phi)), V.scale(v, Math.sin(phi)));
    },
  );
  const lowerDirection: AutoMovieVector3Tuple = V.scale(u, -1);
  const qualify = (
    root: AutoMovieVector3Tuple,
    section: ParentSample,
  ): Placement | null => {
    const lower = edge(parent, source, root, lowerDirection, section, -1);
    if (lower === null) return null;
    const upper = edge(parent, source, root, u, section, 1);
    if (upper === null) return null;
    const quarterRays: IAutoMovieHumanHandAttachment.IEdge[] = [];
    for (const direction of quarterDirections) {
      const ray = edge(parent, source, root, direction, section, 1);
      if (ray === null) return null;
      quarterRays.push(ray);
    }
    return {
      root,
      section: source.complete(section),
      jointSection: initial === null ? null : source.complete(initial),
      rays: {
        dorsalChord: { lower, upper },
        quarterRays: quarterRays as Rays["quarterRays"],
      },
    };
  };
  if (initial !== null && initial.margin > 0) {
    const placement: Placement | null = qualify(joint, initial);
    if (placement !== null) return placement;
  }
  const candidates: { root: AutoMovieVector3Tuple; section: ParentSample }[] =
    [];
  for (let index: number = 1; index <= 64; index++) {
    const root: AutoMovieVector3Tuple = V.plus(
      joint,
      V.scale(tangent, (-length * index) / 64),
    );
    const section: ParentSample | null = source.read(root);
    if (section !== null && section.margin > 0)
      candidates.push({ root, section });
  }
  candidates.sort((a, b): number => b.section.margin - a.section.margin);
  for (const { root, section } of candidates) {
    const placement: Placement | null = qualify(root, section);
    if (placement !== null) return placement;
  }
  throw new Error(
    `The ${name} first-bone line has no interior root with six qualified arm/palm ray boundaries`,
  );
}
