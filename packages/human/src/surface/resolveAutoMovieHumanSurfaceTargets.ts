import type { IAutoMovieHumanMeasurements as I } from "../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton as K } from "../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieHumanSurfaceMeasurements as M } from "../structures/IAutoMovieHumanSurfaceMeasurements";

type ArmTargets = Required<NonNullable<NonNullable<M["arms"]>["left"]>>;
type LegTargets = Required<NonNullable<NonNullable<M["legs"]>["left"]>>;

/**
 * Resolve physical rest targets from one admitted detailed identity and skeleton.
 * Explicit rest observations retain all their dimensions together. Automatic
 * stations, circular limb aspect and the reuse of clinical girths in transported
 * rest sections are engineering conventions, not a measured A-to-T conversion.
 * The compressed clinical chest breadth is used only as an explicitly qualified
 * numerical default; a supplied relaxed rest section replaces that proxy.
 * No source mesh, control catalogue, stature-only template or demographic label
 * is read. The result records each provided observation separately from rules.
 */
export function resolveAutoMovieHumanSurfaceTargets(props: {
  measurements: I;
  skeleton: K;
  observations: M;
}): {
  trunk: NonNullable<M["trunk"]>;
  neck: M.Envelope;
  arms: Record<"left" | "right", ArmTargets>;
  legs: Record<"left" | "right", LegTargets>;
  qualifications: string[];
} {
  const input: M = props.observations;
  const body: I["identity"]["body"] = props.measurements.identity.body;
  const qualifications: string[] = [];
  qualifications.push(body.hipJointCentreBreadth === undefined
    ? "Hip joint-centre breadth is missing: the common skeleton uses the Hara inter-ASIS regression with the 0.82 bicristal convention, an unverified compound placement prior independent of leg length."
    : "Hip joint-centre breadth is supplied independently; it is a mechanical coordinate, not soft-tissue hip breadth.");
  /** Admit a closed record before reading any of its named dimensions. */
  function keys(value: unknown, allowed: readonly string[], name: string): void {
    if (value === null || typeof value !== "object" || Array.isArray(value) ||
        Object.keys(value).some((key: string): boolean => !allowed.includes(key)))
      throw new Error(`${name}: a closed physical-observation record is required`);
  }
  keys(input, ["version", "qualification", "trunk", "neck", "arms", "legs"], "rest");
  if (input.version !== 1 || !["measured-neutral-T", "authored-convention"].includes(input.qualification))
    throw new Error("A versioned physical-rest observation qualification is required");
  /** Retain complete B/D/G observations; omitted values have a stated common rule. */
  function envelope(value: M.Envelope | undefined, fallback: M.Envelope, name: string): M.Envelope {
    if (value === undefined) {
      qualifications.push(`${name}: engineering rest-section convention; not an independently measured rest observation.`);
      return fallback;
    }
    keys(value, ["breadthMm", "depthMm", "perimeterMm"], name);
    if (![value.breadthMm, value.depthMm, value.perimeterMm].every(
      (x: number): boolean => Number.isFinite(x) && x > 0))
      throw new Error(`${name}: finite positive independent breadth, depth and perimeter required`);
    qualifications.push(`${name}: supplied ${input.qualification} observation; no protocol conversion inferred.`);
    return structuredClone(value);
  }
  /** Equal breadth/depth is a missing-aspect convention, not a hidden constraint on supplied inputs. */
  function round(perimeterMm: number): M.Envelope {
    return {breadthMm: perimeterMm/Math.PI, depthMm: perimeterMm/Math.PI, perimeterMm};
  }
  const trunk: NonNullable<M["trunk"]> = input.trunk === undefined ? {
    chest: {heightMm: (body.suprasternaleHeight+body.waistHeight)/2,
      breadthMm: body.chestBreadth, depthMm: body.chestDepth,
      perimeterMm: body.chestCircumference, anteriorFraction: 0.5},
    waist: {heightMm: body.waistHeight, breadthMm: body.waistBreadth,
      depthMm: body.waistDepth, perimeterMm: body.waistCircumference, anteriorFraction: 0.5},
    buttock: {heightMm: (props.measurements.leftTrochanterionHeight+props.measurements.rightTrochanterionHeight)/2,
      breadthMm: body.hipBreadth, depthMm: body.buttockDepth,
      perimeterMm: body.buttockCircumference, anteriorFraction: 0.5},
  } : structuredClone(input.trunk);
  keys(trunk, ["chest", "waist", "buttock"], "trunk");
  for (const name of ["chest", "waist", "buttock"] as const) {
    const value: M.Section = trunk[name];
    keys(value, ["heightMm", "breadthMm", "depthMm", "perimeterMm", "anteriorFraction"], `trunk.${name}`);
    if (![value.heightMm, value.breadthMm, value.depthMm, value.perimeterMm,
      value.anteriorFraction].every(Number.isFinite) || value.heightMm <= 0 ||
      value.anteriorFraction <= 0 || value.anteriorFraction >= 1)
      throw new Error(`trunk.${name}: finite positive-height rest section required`);
  }
  qualifications.push(input.trunk === undefined
    ? "Automatic trunk: chest plane is the midpoint of suprasternale and natural-waist heights; buttock plane is the mean resolved trochanter height. These are support conventions, not measured apex planes. Clinical compressed chest breadth is an unvalidated rest-envelope proxy."
    : `Trunk: supplied ${input.qualification} physical stations and B/D/G; no clinical-to-rest conversion inferred.`);
  const neck: M.Envelope = envelope(input.neck, round(body.neckCircumference), "neck.midTube");
  if (input.arms !== undefined) keys(input.arms, ["left", "right"], "arms");
  if (input.legs !== undefined) keys(input.legs, ["left", "right"], "legs");
  const hipPositions: K.IJoint[] = props.skeleton.joints.filter(
    (joint: K.IJoint): boolean => joint.bone === "leftUpperLeg" || joint.bone === "rightUpperLeg");
  if (hipPositions.length !== 2) throw new Error("Both actual hip joints are required");
  const hipSeparation: number = Math.abs(hipPositions[0]!.position.x-hipPositions[1]!.position.x);
  /** One side retains its own observations; symmetry is only an equal-input choice. */
  function sideTargets(side: "left" | "right"): {arm: ArmTargets; leg: LegTargets} {
    const arm: I["identity"]["body"]["leftArm"] = body[side === "left" ? "leftArm" : "rightArm"];
    const leg: I["identity"]["body"]["leftLeg"] = body[side === "left" ? "leftLeg" : "rightLeg"];
    const a: NonNullable<NonNullable<M["arms"]>["left"]> | undefined = input.arms?.[side];
    const l: NonNullable<NonNullable<M["legs"]>["left"]> | undefined = input.legs?.[side];
    if (a !== undefined) keys(a, ["upperArm", "elbow", "forearm", "wrist"], `${side}.arm`);
    if (l !== undefined) keys(l, ["thigh", "knee", "calf", "ankle"], `${side}.leg`);
    const armTargets: ArmTargets = {
      upperArm: envelope(a?.upperArm, round(arm.upperArmCircumference), `${side}.upperArm`),
      elbow: envelope(a?.elbow, round((arm.upperArmCircumference+arm.forearmCircumference)/2), `${side}.elbow`),
      forearm: envelope(a?.forearm, round(arm.forearmCircumference), `${side}.forearm`),
      wrist: envelope(a?.wrist, round(arm.wristCircumference), `${side}.wrist`),
    };
    const thigh: M.Envelope = round(leg.thighCircumference);
    thigh.breadthMm = Math.min(thigh.breadthMm, 0.9*hipSeparation);
    const legTargets: LegTargets = {
      thigh: envelope(l?.thigh, thigh, `${side}.thigh`),
      knee: envelope(l?.knee, round(leg.lowerThighCircumference), `${side}.knee`),
      calf: envelope(l?.calf, round(leg.calfCircumference), `${side}.calf`),
      ankle: envelope(l?.ankle, round(leg.ankleCircumference), `${side}.ankle`),
    };
    return {arm: armTargets, leg: legTargets};
  }
  const left: ReturnType<typeof sideTargets> = sideTargets("left");
  const right: ReturnType<typeof sideTargets> = sideTargets("right");
  qualifications.push("Automatic limb aspect is equal breadth/depth from equivalent circumference, except the unmeasured thigh breadth is at most 0.9 times actual hip-centre separation. Elbow girth is the mean upper-arm/forearm girth. These are explicit shape priors; supplied triples do not use them and joints are never moved to fit skin.");
  return {trunk, neck, arms: {left: left.arm, right: right.arm},
    legs: {left: left.leg, right: right.leg}, qualifications};
}
