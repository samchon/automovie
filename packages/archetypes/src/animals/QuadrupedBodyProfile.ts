import { AutoMovieArchetypeUnits } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import type { QuadrupedProportions } from "./QuadrupedProportions";

/**
 * Map one declared coarse shape into the quadruped's shared rigid-bar format.
 *
 * Shape dimensions are metres at their stated reference withers height. The
 * species adapter owns source provenance and any cross-cohort transfer. This
 * owner only performs the common geometry: circular girth, trigonometric
 * control projections, an exact withers apex, a head capsule of the requested
 * total axial length, and a distinct hip-to-rump run behind the trunk.
 * Directions are the initial authored conformation. AutoMovieArchetypeQuadrupedBody owns the
 * subsequent explicit neutral connection to its parent solids; it does
 * not change these reference measurements or infer measured joint anatomy.
 *
 * @param props Reference shape, four controls per limb, authored construction, colors and optional admitted instance height.
 * @returns Fresh dimensionless body controls, with metre lateral inset for the height.
 * @throws {RangeError} For invalid/nonfinite dimensions, impossible capsule/trunk extents, invalid construction ratios or unrepresentable normalized output.
 * @evidence contracts/development/common.md#meaningful-documentation Defines reference/instance metres, control directions, circular/capsule interpretations, producer-owned provenance, resource ownership and refusals; no anatomical or visual result is asserted.
 * @evidence contracts/development/implementation.md#principled-implementation Divide lengths by reference height and project straight controls with sine/cosine. A radius-w withers sphere centered at height-w reaches exactly height. Removing both head caps from its total axial length gives the bar span; reserving a positive pelvic run avoids a zero-length hindquarters bar.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit source and construction scalars, derive the common controls once, then return the existing body representation to all three species adapters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No species branch, borrowed horse profile, measured-pose claim, fitted patch, arbitrary numeric fallback or physical coefficient is supplied. The source adapter declares every measurement transfer and authored estimate.
 * @evidence contracts/development/implementation.md#efficient-algorithms Admission and construction each inspect a fixed number of scalars and eight limb controls; O(1) time/space and no mesh generation, geometry search or iterative numerical solve occurs.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One shared mapping serves ox, camel and deer. Immutable-in-type source data is read directly, and fresh arrays/records prevent a result mutation from changing source choices or a later result.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no props, query, cache or external handle. The caller owns all returned records; no segment shares or foot material are added, leaving their absence explicit for the existing builder.
 */
export function QuadrupedBodyProfile(
  props: QuadrupedBodyProfile.IProps,
): AutoMovieArchetypeQuadrupedBody.IBody {
  const m: QuadrupedBodyProfile.IMeasures = props.measures;
  const c: QuadrupedBodyProfile.IConstruction = props.construction;
  const h: number = m.withers;
  const height: number =
    props.withersHeight === undefined ? h : props.withersHeight;
  for (const value of [
    height,
    m.withers,
    m.girth,
    m.body,
    m.neck,
    m.neckRadius,
    m.head,
    m.headDiameter,
    m.tail,
    ...props.fore,
    ...props.hind,
    c.withersRadius,
    c.pelvisRun,
    c.tailRadius,
    ...c.barRadii,
  ])
    if (!(Number.isFinite(value) && value > 0))
      throw new RangeError(
        "Coarse quadruped lengths and radii must be positive and finite",
      );
  for (const value of [
    c.neckRootDrop,
    c.tailDock,
    c.inset,
    c.neckPitch,
    c.headPitch,
    c.tailPitch,
    ...c.forePitch,
    ...c.hindPitch,
  ])
    if (!Number.isFinite(value))
      throw new RangeError("Coarse quadruped construction must be finite");
  if (
    props.fore.length !== 4 ||
    props.hind.length !== 4 ||
    c.barRadii.length !== 4 ||
    c.forePitch.length !== 4 ||
    c.hindPitch.length !== 4 ||
    c.withersRadius >= 1 ||
    c.pelvisRun >= 1 ||
    c.neckRootDrop < 0 ||
    c.neckRootDrop >= 1 - c.withersRadius ||
    c.inset < 0 ||
    c.inset >= 1 ||
    c.tailDock < 0 ||
    c.tailDock > 1 ||
    m.head <= m.headDiameter
  )
    throw new RangeError(
      "Coarse quadruped construction is outside its rigid-bar domain",
    );

  const barrel: number = m.girth / (2 * Math.PI);
  const trunk: number = (m.body * (1 - c.pelvisRun) - barrel) / h;
  const buttock: number = m.body / h;
  const neckPitch: number = c.neckPitch * AutoMovieArchetypeUnits.DEGREE;
  const headPitch: number = c.headPitch * AutoMovieArchetypeUnits.DEGREE;
  const headControl: number = m.head - m.headDiameter;
  const tailPitch: number = c.tailPitch * AutoMovieArchetypeUnits.DEGREE;
  const fore: QuadrupedProportions.LimbValues = [
    props.fore[0] / h,
    props.fore[1] / h,
    props.fore[2] / h,
    props.fore[3] / h,
  ];
  const hind: QuadrupedProportions.LimbValues = [
    props.hind[0] / h,
    props.hind[1] / h,
    props.hind[2] / h,
    props.hind[3] / h,
  ];
  const rise: number = (m.neck * Math.sin(neckPitch)) / h - c.neckRootDrop;
  const ahead: number = (m.neck * Math.cos(neckPitch)) / h;
  const drop: number = (headControl * Math.sin(headPitch)) / h;
  const muzzle: number = (headControl * Math.cos(headPitch)) / h;
  const neckRadius: number = m.neckRadius / h;
  const headRadius: number = m.headDiameter / h / 2;
  const tailDrop: number = (m.tail * Math.sin(tailPitch)) / h;
  const tailBack: number = (m.tail * Math.cos(tailPitch)) / h;
  const inset: number = (barrel / h) * c.inset * height;
  if (
    [barrel, ...fore, ...hind, trunk, buttock, neckRadius, headRadius].some(
      (value: number): boolean => !(value > 0 && Number.isFinite(value)),
    ) ||
    [rise, ahead, drop, muzzle, tailDrop, tailBack, inset].some(
      (value: number): boolean => !Number.isFinite(value),
    )
  )
    throw new RangeError(
      "Coarse quadruped controls are not finitely representable",
    );
  return {
    lengths: { fore, hind, trunk },
    stance: { fore: [...c.forePitch], hind: [...c.hindPitch] },
    back: 1 - c.withersRadius,
    buttock,
    withers: c.withersRadius,
    neck: { root: c.neckRootDrop, radius: neckRadius },
    head: {
      poll: { rise, ahead },
      nose: { drop, ahead: muzzle },
      radius: headRadius,
      mouth: 0,
    },
    tail: {
      radius: c.tailRadius,
      drop: tailDrop,
      back: tailBack,
      dock: c.tailDock,
    },
    bones: [...c.barRadii],
    inset,
    colors: { ...props.colors },
  };
}

/**
 * Input contracts shared by the ox, camel and deer profile adapters.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Every member defines its metre, height fraction, direction or ownership; reference measurements are distinct from authored construction choices.
 * @evidence contracts/development/design.md#principled-representation Four fixed controls per limb and positive SI reference dimensions map to the existing quadruped representation. Runtime admission checks numeric finiteness, positive capsule/trunk spans and construction domains.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three current species adapters supply source normalization and this owner supplies their common geometry; no species catalogue, mass allocator, second skeleton or future option is introduced.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source lineage, anatomical range or contact coefficient is inferred from these shape inputs, and no cast widens incompatible records into the shared body type.
 */
export namespace QuadrupedBodyProfile {
  /** Reference shape in metres; each adapter documents measured versus authored fields. */
  export interface IMeasures {
    /** Reference withers height used to normalize all lengths. */
    withers: number;

    /** Circular trunk's desired circumference. */
    girth: number;

    /** Shoulder landmark to rear buttock landmark along the forward axis. */
    body: number;

    /** Straight neck control length. */
    neck: number;

    /** Neck cylinder radius, not circumference. */
    neckRadius: number;

    /** Head capsule's complete axial extent, including both end caps. */
    head: number;

    /** Desired head capsule diameter; strictly less than its axial extent. */
    headDiameter: number;

    /** Straight tail control length. */
    tail: number;
  }

  /** Authored rigid-bar geometry, not anatomical joint ranges or measured static poses. */
  export interface IConstruction {
    /** Withers sphere radius / height, in (0, 1). */
    withersRadius: number;

    /** Body-length share reserved between hip and rounded rump, in (0, 1). */
    pelvisRun: number;

    /** Neck root's drop below back / height, in [0, back). */
    neckRootDrop: number;

    /** Neck elevation above forward horizontal, degrees. */
    neckPitch: number;

    /** Head axis below forward horizontal, degrees. */
    headPitch: number;

    /** Tail down from rearward horizontal, degrees. */
    tailPitch: number;

    /** Tail cylinder radius / height, positive. */
    tailRadius: number;

    /** Tail root displacement up/rearward / barrel radius, in [0, 1]. */
    tailDock: number;

    /** Foot inward placement / barrel radius, in [0, 1). */
    inset: number;

    /** Four initial fore directions from down, degrees, before shared parent-solid neutral connection. */
    forePitch: readonly [number, number, number, number];

    /** Four initial hind directions from down, degrees, before shared parent-solid neutral connection. */
    hindPitch: readonly [number, number, number, number];

    /** Four positive limb bar radii / height. */
    barRadii: readonly [number, number, number, number];
  }

  /** One caller-normalized shape with construction and display inputs. */
  export interface IProps {
    /** SI reference measurements/proxies and their normalization height. */
    measures: IMeasures;

    /** Four fore control lengths in metres at reference height. */
    fore: readonly [number, number, number, number];

    /** Four hind control lengths in metres at reference height. */
    hind: readonly [number, number, number, number];

    /** Explicit authored directions and shape ratios. */
    construction: IConstruction;

    /** Authored display colors; no photometric measurement is implied. */
    colors: Readonly<QuadrupedProportions.IColors>;

    /** Admitted instance height in metres, defaulting to the reference height. */
    withersHeight?: number;
  }
}
