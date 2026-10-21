import type { IAutoMovieHumanBodyParameters } from "../structures/body/IAutoMovieHumanBodyParameters";
import type { HumanCurve } from "./HumanCurve";

/** One owner for geometric neutral supports and regional attachment frames.
 * The shared scalar laws were identified from the four source-bound current
 * native skeleton observations. They are broad geometric interpolation rules,
 * not clinical joints or independently established physiological effects.
 */
export namespace HumanSkeleton {
  /** Generated supports in mm, +X forward, +Y up and signed lateral Z. */
  export interface Result {
    /** Sole-owner support identities consumed by every region. */
    supports: ReadonlyMap<string, HumanCurve.Vector>;

    /** Requested height used by this geometric construction, mm. */
    heightMm: number;

    /** Pelvis floor-relative height derived from leg support length, mm. */
    pelvisHeightMm: number;

    /** Original common normalized pelvis station, before independent inseam. */
    baselinePelvisFraction: number;

    /** Nominal and generated axial anchors for one common trunk transport. */
    trunkFrame: { referencePelvisMm: HumanCurve.Vector; referenceNeckMm: HumanCurve.Vector; pelvisMm: HumanCurve.Vector; neckMm: HumanCurve.Vector };

    /** Explicit observation and parameter-domain limits. */
    limitations: string[];
  }

  /** Build the fixed neutral support hierarchy from independent length inputs.
   * Limb directions follow the observed common neutral posture. The ankle
   * datum and inseam determine pelvis height together; an independent pelvis
   * height constraint is not silently added. Upper axial projection then meets
   * the height constraint with the common observed crown allowance.
   */
  export function build(parameters: IAutoMovieHumanBodyParameters): Result {
    const height: number = length("height");
    const inseam: number = length("inseam");
    const upperArm: number = length("upperArmLength");
    const forearm: number = length("lowerArmLength");
    const acrossShoulder: number = length("acrossShoulder");
    const shape: number | null = parameters.controls.masculineFeminine.value;
    if (shape === null || !Number.isFinite(shape)) throw new Error("The common support reference chart requires a finite observed shape coordinate");
    const supports: Map<string, HumanCurve.Vector> = new Map();
    // Pooled through-origin length fits use achieved native courses, not
    // authored specimen controls. See human/docs/techniques/neutral-supports.md.
    const leg: number = 1.1155098721717496 * inseam;
    const thigh: number = 0.5198535106861544 * leg;
    const shank: number = leg - thigh;
    const thighDirection: HumanCurve.Vector = unit([-0.0206281, -0.9986946, -0.0467283]);
    const shankDirection: HumanCurve.Vector = unit([-0.0384685, -0.9982878, -0.0440641]);
    const ankleHeight: number = 0.04677 * height;
    const thighOffset: HumanCurve.Vector = [0.0002904 * height, -0.0091511 * height, -0.0496056 * height];
    const pelvisHeight: number = ankleHeight - thighOffset[1] - thigh * thighDirection[1] - shank * shankDirection[1];
    const pelvis: HumanCurve.Vector = [0.013166581158147941 * height, pelvisHeight, 0];
    supports.set("pelvis", pelvis);
    const axial: Array<[string, number, HumanCurve.Vector]> = [
      ["spine_01", 0.018352817420672813, [-0.0257349, 0.9996688, 0]],
      ["spine_02", 0.03359415546151662, [0.224999, 0.974359, 0]],
      ["spine_03", 0.03854247688757201, [0.0990095, 0.9950865, 0]],
      ["spine_04", 0.048572685954208134, [-0.0666927, 0.9977736, 0]],
      ["spine_05", 0.0785093395814794, [-0.2140034, 0.9768329, 0]],
      ["neck_01", 0.08912895844598472, [-0.1525176, 0.9883008, 0]],
      ["neck_02", 0.029368894633815947, [0.2135463, 0.9769329, 0]],
      ["head", 0.030419570811928587, [0.1974579, 0.9803114, 0]],
    ];
    const nominalProjection: number = axial.reduce((sum: number, row: [string, number, HumanCurve.Vector]): number => sum + row[1] * unit(row[2])[1], 0);
    const nominalPelvis: number = 0.5423947765812867;
    const crownAllowance: number = (1 - nominalPelvis - nominalProjection) * height;
    const axialScale: number = (height - crownAllowance - pelvisHeight) / nominalProjection;
    if (!(axialScale > 0 && Number.isFinite(axialScale))) throw new Error("Height and inseam leave no supported upper axial extent");
    let parent: HumanCurve.Vector = pelvis;
    // Trunk course rules were learned conditionally on height and this shape
    // coordinate. Their reference frame must use that same conditional inseam,
    // not an unrelated constant pelvis height. Only the independent deviation
    // from this reference transports the trunk with the generated supports.
    const referenceInseam: number = height * (0.43686773202807394 + 0.0056851924785208344 * shape);
    const referenceLeg: number = 1.1155098721717496 * referenceInseam;
    const referencePelvisHeight: number = ankleHeight - thighOffset[1] - referenceLeg * (0.5198535106861544 * thighDirection[1] + (1 - 0.5198535106861544) * shankDirection[1]);
    const referenceScale: number = (height - crownAllowance - referencePelvisHeight) / nominalProjection;
    if (!(referenceInseam > 0 && referenceScale > 0 && Number.isFinite(referenceScale))) throw new Error("The common conditional reference frame has no finite axial extent");
    const referencePelvis: HumanCurve.Vector = [pelvis[0], referencePelvisHeight, 0];
    let referenceParent: HumanCurve.Vector = referencePelvis;
    let referenceNeck: HumanCurve.Vector | undefined;
    for (const [name, ratio, direction] of axial) {
      parent = add(parent, unit(direction), ratio * axialScale);
      referenceParent = add(referenceParent, unit(direction), ratio * referenceScale);
      if (name === "neck_01") referenceNeck = referenceParent;
      supports.set(name, parent);
    }
    const spine: HumanCurve.Vector = supports.get("spine_05")!;
    const clavicleLength: number = 0.04514546021316002 * height + 0.16806034750004278 * acrossShoulder;
    for (const side of ["l", "r"] as const) {
      const sign: number = side === "l" ? 1 : -1;
      const clavicle: HumanCurve.Vector = add(spine, [-0.014695, 0.0529466, -0.0057949 * sign], height);
      supports.set("clavicle_" + side, clavicle);
      const shoulder: HumanCurve.Vector = add(clavicle, mirror(unit([-0.0223502, -0.1386215, -0.9900932]), sign), clavicleLength);
      supports.set("upperarm_" + side, shoulder);
      const elbow: HumanCurve.Vector = add(shoulder, mirror(unit([0.0269654, -0.7946319, -0.6064924]), sign), 0.8242395804153954 * upperArm);
      supports.set("lowerarm_" + side, elbow);
      supports.set("hand_" + side, add(elbow, mirror(unit([0.6173155, -0.6039913, -0.5040994]), sign), 1.0278544231416413 * forearm));
      const hip: HumanCurve.Vector = add(pelvis, mirror(thighOffset, sign), 1);
      supports.set("thigh_" + side, hip);
      const knee: HumanCurve.Vector = add(hip, mirror(thighDirection, sign), thigh);
      supports.set("calf_" + side, knee);
      supports.set("foot_" + side, add(knee, mirror(shankDirection, sign), shank));
    }
    return { supports, heightMm: height, pelvisHeightMm: pelvisHeight, baselinePelvisFraction: referencePelvisHeight / height,
      trunkFrame: { referencePelvisMm: referencePelvis, referenceNeckMm: referenceNeck!, pelvisMm: pelvis, neckMm: supports.get("neck_01")! }, limitations: [
      "Shared observed neutral support interpolation; independent parameter response and unobserved morphology prediction remain unqualified",
      "Bilateral reflection is a declared common support symmetry, not a claim that the original people were exactly symmetric",
      "Neck-length and neck-to-waist courses have no independently identified chord mapping in this support model",
      "Rig supports guide planes and attachment; recovered Hermite curves remain the source of surface shape",
      "The reference inseam/height versus shape relation is a pooled two-coefficient fit over four achieved sources, not an independently established shape effect",
    ] };

    function length(name: "height" | "inseam" | "upperArmLength" | "lowerArmLength" | "acrossShoulder"): number {
      const value: number | null = parameters.controls[name].value;
      if (value === null || !Number.isFinite(value) || value <= 0) throw new Error("A positive physical body input is required: " + name);
      return value;
    }
  }

  /** Transport identified trunk centres through the same pelvis/neck anchors
   * that respond to independent inseam. This affine displacement preserves
   * each section's learned offset from the axial reference rather than leaving
   * the torso at a height-only location while its limbs and pelvis move.
   */
  export function mapTrunkOrigin(skeleton: Result, origin: HumanCurve.Vector): HumanCurve.Vector {
    const frame: Result["trunkFrame"] = skeleton.trunkFrame;
    const width: number = frame.referenceNeckMm[1] - frame.referencePelvisMm[1];
    if (!(width > 0)) throw new Error("The common trunk frame has no directed axial extent");
    const fraction: number = (origin[1] - frame.referencePelvisMm[1]) / width;
    return origin.map((value: number, axis: number): number => value + frame.pelvisMm[axis]! - frame.referencePelvisMm[axis]! + fraction * ((frame.neckMm[axis]! - frame.pelvisMm[axis]!) - (frame.referenceNeckMm[axis]! - frame.referencePelvisMm[axis]!))) as HumanCurve.Vector;
  }

  function unit(vector: HumanCurve.Vector): HumanCurve.Vector {
    const length: number = Math.hypot(...vector);
    if (!(length > 0 && Number.isFinite(length))) throw new Error("A support direction must be finite and nonzero");
    return [vector[0] / length, vector[1] / length, vector[2] / length];
  }

  function add(origin: HumanCurve.Vector, direction: HumanCurve.Vector, scale: number): HumanCurve.Vector {
    return [origin[0] + scale * direction[0], origin[1] + scale * direction[1], origin[2] + scale * direction[2]];
  }

  function mirror(vector: HumanCurve.Vector, sign: number): HumanCurve.Vector { return [vector[0], vector[1], sign * vector[2]]; }
}
