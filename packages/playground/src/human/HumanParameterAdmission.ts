import type { IAutoMovieHumanParameters as Parameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { AutoMovieHumanActionUnit as Unit } from "../../../human/src/typings/AutoMovieHumanActionUnit";
import { AutoMovieHumanExpressionSide as Side } from "../../../human/src/typings/AutoMovieHumanExpressionSide";
import { AutoMovieHumanHairColor as Color } from "../../../human/src/typings/AutoMovieHumanHairColor";
import { AutoMovieHumanHairCurl as Curl } from "../../../human/src/typings/AutoMovieHumanHairCurl";
import { AutoMovieHumanHairStyle as Style } from "../../../human/src/typings/AutoMovieHumanHairStyle";
import { AutoMovieHumanHairline as Hairline } from "../../../human/src/typings/AutoMovieHumanHairline";
import { AutoMovieHumanIrisColor as Iris } from "../../../human/src/typings/AutoMovieHumanIrisColor";
import { AutoMovieHumanLowerUnderwear as Lower } from "../../../human/src/typings/AutoMovieHumanLowerUnderwear";
import { AutoMovieHumanUpperUnderwear as Upper } from "../../../human/src/typings/AutoMovieHumanUpperUnderwear";

/** Validate the current public Human contract and return an independent mutable snapshot.
 *
 * @evidence contracts/common.md#principled-implementation Public fields and explicit tags define admission; registered examples only label snapshots afterward.
 * @evidence contracts/common.md#clear-and-simple-design The Human boundary owns validation and copying in this namespace.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No rule is inferred from example shape or example values.
 * @evidence contracts/common.md#meaningful-documentation Success establishes input validity, not generated anatomy or rendering.
 * @evidence contracts/performance.md#efficient-algorithms Validation, cloning and alias comparison each traverse only submitted data.
 * @evidence contracts/performance.md#reuse-equivalent-work Closed rules are module-owned; requests do not rebuild them.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Each returned copy belongs to the caller; no request cache or background handle is retained.
 */
export namespace HumanParameterAdmission {
/** Describe the finite rules used by this Human boundary, including explicit optional undefined.
 *
 * @evidence contracts/common.md#principled-implementation The alternatives represent declared field types, bounds, choices and record membership.
 * @evidence contracts/common.md#clear-and-simple-design This private union has no caller-facing schema API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It represents public declarations rather than a schema inferred from examples.
 * @evidence contracts/common.md#meaningful-documentation Optionality belongs to each parent record; required undefined remains invalid.
 * @evidence contracts/performance.md#efficient-algorithms This erased type adds no runtime traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Runtime rules reuse this one type.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The type acquires no resource or runtime lifetime.
 */
  type Rule = "number" | "nullable" | "boolean" | "hex"
    | { range: readonly [number, number]; integer: boolean }
    | { choices: readonly string[] }
    | { fields: Readonly<Record<string, Rule>>; optional: readonly string[] }
    | { array: Rule };

/** Validate and copy the candidate without imposing freeze on the generator or UI.
 *
 * @evidence contracts/common.md#principled-implementation The input and owned copy pass the guard; documented control pins and expression exclusions are checked.
 * @evidence contracts/common.md#clear-and-simple-design One entry point performs validation and snapshot transfer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Values are neither corrected nor replaced by example data.
 * @evidence contracts/common.md#meaningful-documentation The caller receives a deep clone; copy or validation failure throws before transfer.
 * @evidence contracts/performance.md#efficient-algorithms Traversals and cross-field checks are linear in the candidate population.
 * @evidence contracts/performance.md#reuse-equivalent-work Structural checks share module rules; copied data are per call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary sets and the clone belong to this call; only the accepted clone escapes.
 */
  export function read(candidate: unknown): Parameters {
    if (!isParameters(candidate)) throw new Error("Human parameter request: parameters is invalid");
    let parameters: Parameters;
    try { parameters = structuredClone(candidate); }
    catch (error) { throw new Error("Human parameter request: parameters could not be copied: " + String(error)); }
    if (!isParameters(parameters)) throw new Error("Human parameter request: copied parameters is invalid");
    for (const [name, control] of Object.entries(parameters.body.controls))
      if (control.pinned && control.value === null)
        throw new Error(`Human parameter request: parameters.body.controls.${name}.pinned cannot pin an unknown value`);

    const seen: Map<string, Set<string>> = new Map();
    for (const entry of parameters.expression?.units ?? []) {
      const sides: Set<string> = seen.get(entry.unit) ?? new Set<string>();
      if (sides.has(entry.side) || sides.has(Side.Both) || entry.side === Side.Both && sides.size !== 0)
        throw new Error(`Human parameter request: parameters.expression.units overlaps ${entry.unit}/${entry.side}`);
      if ((entry.unit === Unit.JawDrop || entry.unit === Unit.MouthStretch) && entry.side !== Side.Both)
        throw new Error("Human parameter request: parameters.expression.units jaw units must act on both sides");
      sides.add(entry.side); seen.set(entry.unit, sides);
    }
    for (const [name, amount] of Object.entries(parameters.expression?.mouth?.lips ?? {}))
      if (amount !== undefined && seen.has(name)) throw new Error(`Human parameter request: parameters.expression.mouth.lips.${name} duplicates an action unit`);
    return parameters;
  }

/** Compare an admitted snapshot with one typed alias value, without selecting its schema.
 *
 * @evidence contracts/common.md#principled-implementation Object.is and own-field recursion compare values, retaining array order and signed zero.
 * @evidence contracts/common.md#clear-and-simple-design This function labels already validated snapshots only.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registered example values are intentionally compared here; they never determine validation rules.
 * @evidence contracts/common.md#meaningful-documentation Equal values return true; differing or differently present fields return false.
 * @evidence contracts/performance.md#efficient-algorithms Comparison is linear in compared fields and short-circuits at the first difference.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller compares at most four existing examples without building another model.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only temporary entry arrays and recursion state are retained during comparison.
 */
  export function same(first: unknown, second: unknown): boolean {
    if (Object.is(first, second)) return true;
    if (first === null || second === null || typeof first !== "object" || typeof second !== "object"
      || Array.isArray(first) !== Array.isArray(second)) return false;
    const entries: [string, unknown][] = Object.entries(first);
    if (entries.length !== Object.keys(second).length) return false;
    for (const [key, value] of entries) {
      const field: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(second, key);
      if (field === undefined || !("value" in field) || !same(value, field.value)) return false;
    }
    return true;
  }

/** Back the parameter type predicate with the complete current field rules.
 *
 * @evidence contracts/common.md#principled-implementation A successful return follows inspect of every required and present field.
 * @evidence contracts/common.md#clear-and-simple-design The predicate delegates to the one structural traversal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown values become typed through checks, without an unchecked Parameters cast.
 * @evidence contracts/common.md#meaningful-documentation Mismatch throws a field-path error instead of returning an admitted value.
 * @evidence contracts/performance.md#efficient-algorithms One pass visits the candidate population.
 * @evidence contracts/performance.md#reuse-equivalent-work The module-owned PARAMETERS rule is reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The guard retains no candidate after return.
 */
  function isParameters(value: unknown): value is Parameters {
    inspect(value, PARAMETERS, "parameters");
    return true;
  }

/** Check declared data properties, preserving optional undefined and rejecting undeclared fields.
 *
 * @evidence contracts/common.md#principled-implementation Finite scalars, explicit ranges and own record membership follow the public declarations.
 * @evidence contracts/common.md#clear-and-simple-design One traversal handles the closed Human rule alternatives.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coercion, field deletion, default value or example matching occurs.
 * @evidence contracts/common.md#meaningful-documentation Optional undefined is accepted and later cloned; required undefined and accessors reject.
 * @evidence contracts/performance.md#efficient-algorithms Field traversal is linear; the fixed public type tree bounds recursion depth.
 * @evidence contracts/performance.md#reuse-equivalent-work Equivalent fields reuse the same rule objects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Key arrays are temporary and no inspected value is globally cached.
 */
  function inspect(value: unknown, rule: Rule, path: string): void {
    let valid: boolean;
    if (typeof rule === "string") {
      valid = rule === "nullable" && value === null
        || (rule === "number" || rule === "nullable") && typeof value === "number" && Number.isFinite(value)
        || rule === "boolean" && typeof value === "boolean"
        || rule === "hex" && typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value);
    } else if ("range" in rule) {
      valid = typeof value === "number" && Number.isFinite(value)
        && value >= rule.range[0] && value <= rule.range[1] && (!rule.integer || Number.isInteger(value));
    } else if ("choices" in rule) valid = typeof value === "string" && rule.choices.includes(value);
    else {
      const array: boolean = "array" in rule;
      if (value === null || typeof value !== "object" || Array.isArray(value) !== array
        || Object.getPrototypeOf(value) !== (array ? Array.prototype : Object.prototype))
        throw new Error(`Human parameter request: ${path} must be a plain ${array ? "array" : "record"}`);
      const keys: PropertyKey[] = Reflect.ownKeys(value);
      if ("array" in rule) {
        if (!Array.isArray(value) || keys.length !== value.length + 1)
          throw new Error(`Human parameter request: ${path} must be a dense array without extra fields`);
        for (let index: number = 0; index < value.length; ++index)
          inspect(data(value, String(index), `${path}[${index}]`), rule.array, `${path}[${index}]`);
      } else {
        for (const key of keys) {
          if (typeof key !== "string" || !Object.hasOwn(rule.fields, key))
            throw new Error(`Human parameter request: ${path} has undeclared field ${String(key)}`);
          const member: unknown = data(value, key, `${path}.${key}`);
          if (member !== undefined || !rule.optional.includes(key))
            inspect(member, rule.fields[key]!, `${path}.${key}`);
        }
        for (const key of Object.keys(rule.fields))
          if (!Object.hasOwn(value, key) && !rule.optional.includes(key))
            throw new Error(`Human parameter request: ${path}.${key} is required`);
      }
      return;
    }
    if (!valid) throw new Error(`Human parameter request: ${path} violates its declared finite value, range or closed choice`);
  }

/** Read one enumerable own data field without evaluating an accessor.
 *
 * @evidence contracts/common.md#principled-implementation Property descriptors distinguish ordinary input values from holes and getters.
 * @evidence contracts/common.md#clear-and-simple-design This function performs one property read through its descriptor.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No getter is invoked to synthesize a parameter value.
 * @evidence contracts/common.md#meaningful-documentation Missing, hidden and accessor fields throw with their path.
 * @evidence contracts/performance.md#efficient-algorithms One descriptor lookup is performed.
 * @evidence contracts/performance.md#reuse-equivalent-work No second traversal or cached field copy is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The descriptor is local and the original object is not retained.
 */
  function data(value: object, key: string, path: string): unknown {
    const field: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(value, key);
    if (field === undefined || !field.enumerable || !("value" in field))
      throw new Error(`Human parameter request: ${path} must be an enumerable own data field`);
    return field.value;
  }

/** Describe the declared members and optional names of one Human record.
 *
 * @evidence contracts/common.md#principled-implementation The member map and optional list come from its public declaration.
 * @evidence contracts/common.md#clear-and-simple-design The result contains only the rule map and optional-name list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It does not infer keys from registered examples.
 * @evidence contracts/common.md#meaningful-documentation Required names and present undeclared names are enforced by inspect.
 * @evidence contracts/performance.md#efficient-algorithms Rule construction is constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work The supplied module-owned child rules are retained directly.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only module rule references survive initialization.
 */
  function object(fields: Readonly<Record<string, Rule>>, optional: readonly string[] = []): Rule { return { fields, optional }; }

/** Describe the public left and right members of one supplied pair.
 *
 * @evidence contracts/common.md#principled-implementation IAutoMovieHumanPair requires both named members.
 * @evidence contracts/common.md#clear-and-simple-design The same child rule is referenced for each side.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing side is synthesized.
 * @evidence contracts/common.md#meaningful-documentation A supplied pair still requires both sides unless its public declaration says otherwise.
 * @evidence contracts/performance.md#efficient-algorithms Two rule references are installed.
 * @evidence contracts/performance.md#reuse-equivalent-work The child rule is shared across the two members.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned rule is module-owned and contains no request data.
 */
  function pair(rule: Rule): Rule { return object({ left: rule, right: rule }); }

/** Describe an explicit inclusive public numerical interval.
 *
 * @evidence contracts/common.md#principled-implementation Minimum and maximum come from the selected type tags; integer checking is explicit.
 * @evidence contracts/common.md#clear-and-simple-design The rule stores two limits and one integer flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No empirical example range or correction is introduced.
 * @evidence contracts/common.md#meaningful-documentation Inspect still requires a finite number inside the interval.
 * @evidence contracts/performance.md#efficient-algorithms Rule construction takes constant work.
 * @evidence contracts/performance.md#reuse-equivalent-work Each field retains its module-owned interval rule.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only numerical rule data are retained.
 */
  function range(minimum: number, maximum: number, integer: boolean = false): Rule { return { range: [minimum, maximum], integer }; }

/** Describe the serialized members of a closed public choice.
 *
 * @evidence contracts/common.md#principled-implementation Named enum members and literal alternatives define the accepted strings.
 * @evidence contracts/common.md#clear-and-simple-design The rule stores its supplied closed choice list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No runtime enumeration of const enums or sample-derived choice discovery occurs.
 * @evidence contracts/common.md#meaningful-documentation Inspect requires exact string membership.
 * @evidence contracts/performance.md#efficient-algorithms Construction is linear in the fixed choice list.
 * @evidence contracts/performance.md#reuse-equivalent-work One module-owned list serves all requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The list retains no submitted value.
 */
  function choices(...values: string[]): Rule { return { choices: values }; }

/** Assign one shared rule to explicit public field names.
 *
 * @evidence contracts/common.md#principled-implementation The supplied names are the declared fields, not observed example keys.
 * @evidence contracts/common.md#clear-and-simple-design Only repeated field rules use this small construction helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No submitted object is used to create schema members.
 * @evidence contracts/common.md#meaningful-documentation Optionality applies to the listed names only.
 * @evidence contracts/performance.md#efficient-algorithms Construction is linear in the fixed name population.
 * @evidence contracts/performance.md#reuse-equivalent-work All listed fields reference the same child rule.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The constructed map is module-owned; no request state is stored.
 */
  function repeated(names: string, rule: Rule, optional: boolean = false): Rule {
    const fields: Record<string, Rule> = {};
    const keys: string[] = names.split(" ");
    for (const name of keys) fields[name] = rule;
    return object(fields, optional ? keys : []);
  }

/** Describe the existing optional channels and ranges of one pose joint.
 *
 * @evidence contracts/common.md#principled-implementation Each channel interval copies its public minimum and maximum.
 * @evidence contracts/common.md#clear-and-simple-design All supplied channel names become independently optional fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted channels are not assigned generated pose values.
 * @evidence contracts/common.md#meaningful-documentation Validation accepts the public input without claiming every channel deforms current skin.
 * @evidence contracts/performance.md#efficient-algorithms Construction is linear in the fixed channel population.
 * @evidence contracts/performance.md#reuse-equivalent-work The joint rule is built once and reused.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the module-owned field rule map is retained.
 */
  function joint(channels: Readonly<Record<string, readonly [number, number]>>): Rule {
    const fields: Record<string, Rule> = {};
    for (const [name, bounds] of Object.entries(channels)) fields[name] = range(bounds[0], bounds[1]);
    return object(fields, Object.keys(fields));
  }

  /** Plain finite controls and independent unknown measurements have different records. */
  const CONTROL: Rule = object({ value: "nullable", pinned: "boolean" });
  /** Every current control is explicitly listed, including three unitless authoring coordinates. */
  const CONTROLS: Rule = repeated("height fat masculineFeminine muscularity chest bustSpan underbust frontInterscyeLength neckToWaist " +
      "acrossShoulder shoulderToApex waist hip highHip neckBase neck neckLength upperArmLength " +
      "lowerArmLength bicep elbow wrist forearm inseam thigh knee calf handCircumference", CONTROL);
  /** Actual body measurements exclude the three unitless shape controls. */
  const BODY: Rule = object({ controls: CONTROLS,
    measurements: repeated("height chest bustSpan underbust frontInterscyeLength neckToWaist acrossShoulder shoulderToApex waist " +
      "hip highHip neckBase neck neckLength upperArmLength lowerArmLength bicep elbow wrist forearm inseam " +
      "thigh knee calf handCircumference", "nullable"),
    diagnostics: repeated("rise shoulderHeight", "nullable") });
  /** Independent head dimensions and bilateral eye/ear records retain all explicit type-tag ranges. */
  const HEAD: Rule = object({ length: range(80, 260), cephalicIndex: range(60, 110), circumference: range(300, 700),
    height: range(80, 320), faceHeight: range(40, 180), faceWidth: range(50, 200), mandibularWidth: range(40, 180),
    minimumFrontalWidth: range(50, 160), mouthOpening: range(5, 90), mandibularLaterotrusion: range(0, 25),
    face: object({ eyePair: pair(object({ palpebralFissureLength: range(10, 50), palpebralFissureHeight: range(3, 20) })),
      intercanthalWidth: range(10, 60), nose: object({ width: range(10, 70), height: range(15, 90), protrusion: range(4, 45) }),
      mouth: object({ width: range(15, 90), upperVermilionHeight: range(1, 25), lowerVermilionHeight: range(1, 25) }) }),
    earPair: pair(object({ length: range(15, 110), breadth: range(10, 70), protrusion: range(0, 50) })) });
  /** Only the public Pick fields of the arm/leg identity enter optional extremity inputs. */
  const EXTREMITIES: Rule = object({ hands: pair(object({ handLength: range(40, 300), palmLength: range(20, 200),
    thumbLength: range(10, 150), handBreadth: range(20, 160) })),
    feet: pair(object({ footLength: range(50, 400), footBreadth: range(20, 180), ankleHeight: range(15, 150) })),
    footAssembly: choices("independent", "joined") }, ["hands", "feet", "footAssembly"]);
  /** Supplemental numbers have no invented statistical range or missing-value default. */
  const TOE: Rule = repeated("lengthMm breadthMm thicknessMm rootRetractionMm splayRad", "number");
  /** The complete supplemental graph is mandatory only when supplement itself is supplied. */
  const SUPPLEMENT: Rule = object({
    face: object({
      neck: repeated("circumferenceAtMidTubeMm depthToBreadthRatio upperCircumferenceMm", "number"),
      jaw: repeated("submentalDropMm chinBreadthMm prominenceHeightMm prominenceForwardMm sublabialHeightMm sublabialRecessionMm cheekRecessionMm", "number"),
      nose: repeated("rootRecessionMm tipRiseMm nostrilBreadthMm nostrilHeightMm nostrilPlaneDegrees nostrilRecessionDegrees", "number"),
      mouth: repeated("upperBorderProjectionMm lowerBorderProjectionMm cornerRecessionMm philtrumBreadthMm", "number"),
      eyePair: pair(repeated("canthalSlantDegrees canthalRecessionMm marginDepthBulgeMm foldOffsetMm rollOffsetMm", "number")),
      eyeSupportAnteriorRadiusMm: "number",
      earPair: pair(repeated("rotationDegrees helixBreadthScaleMm conchaLengthMm conchaBreadthMm conchaDepthMm lobuleLengthMm", "number")) }),
    torso: object({
      relaxedChestBreadthMm: "number", chestHeightMm: "number", underfoldHeightMm: "number", underbustDepthMm: "number",
      chestAnteriorFraction: "number", waistAnteriorFraction: "number", chestPeakSeparationMm: "number",
      pairedMassProjectionMm: pair("number"), spinalGrooveDepthMm: "number", deltoidSuperiorThicknessMm: "number",
      clavicularHollowDepthMm: "number", posteriorShoulderThicknessMm: "number", axillaryFloorDropMm: "number",
      upperArmBreadthDepthRatio: pair("number"), proximalUpperArmCircumferenceMm: pair("number") }),
    handPair: pair(repeated("palmThicknessMm", "number")),
    armPair: pair(repeated("upperArmDepthMm forearmDepthMm elbowBreadthMm elbowDepthMm forearmTwistDegrees", "number")),
    pelvis: repeated("buttockMaximumHeightMm buttockAnteriorReachMm posteriorMedianRecessMm iliacSkinBreadthMm perinealCrownHeightMm", "number"),
    legPair: pair(repeated("thighBreadthOverDepth calfBreadthOverDepth ankleBreadthMm patellaHeightMm kneeCircumferenceMm " +
      "belowKneeCircumferenceMm calfMaximumHeightAboveAnkleMm ankleMinimumHeightAboveJointMm " +
      "calfAnteriorReachMm ankleAnteriorReachMm", "number")),
    footPair: pair(object({ heelBreadthMm: "number", heelBehindAnkleMm: "number", heelPadHeightMm: "number", ballHeightMm: "number",
      instepHeightMm: "number", plantarArchHeightMm: "number", toePadHeightMm: "number", webGapMm: "number",
      toeSet: object({ hallux: TOE, second: TOE, third: TOE, fourth: TOE, fifth: TOE }) })) });
  /** Existing artistic enum choices are independent from shape authority. */
  const HAIR_COLOR: Rule = choices(Color.Black, Color.DarkBrown, Color.Brown, Color.LightBrown, Color.Blond, Color.Auburn, Color.Red, Color.Gray, Color.White);
  /** All appearance fields are required inside a supplied appearance, except the skin's named optional marks/seed. */
  const APPEARANCE: Rule = object({
    skin: object({ oiliness: range(0, 1), wrinkles: range(0, 1), seed: range(0, 4294967295, true),
      freckles: object({ density: range(0, 40), diameterMm: range(2, 6), contrast: range(0, 1) }),
      moles: object({ count: range(0, 200), diameterMm: range(1, 6), contrast: range(0, 1) }),
      acne: object({ density: range(0, 10), diameterMm: range(3, 10), severity: range(0, 1) }) }, ["seed", "freckles", "moles", "acne"]),
    hair: object({ style: choices(Style.Crop, Style.Short, Style.Bob), color: HAIR_COLOR, length: range(0, 1500),
      curl: choices(Curl.I, Curl.II, Curl.III, Curl.IV, Curl.V, Curl.VI, Curl.VII, Curl.VIII),
      hairline: choices(Hairline.Round, Hairline.MShaped, Hairline.Rectangular, Hairline.BellShaped, Hairline.Triangular) }),
    browPair: pair(object({ color: HAIR_COLOR })), lashPair: pair(object({ color: HAIR_COLOR, length: range(0, 15) })),
    underwear: object({ bottom: choices(Lower.None, Lower.Briefs, Lower.BoxerBriefs), top: choices(Upper.None, Upper.Bra), color: "hex" }) });
  /** Optional pose channels mirror the existing public clinical angle tables without claiming they all deform the current skin. */
  const FINGER: Rule = joint({ mcpFlexion: [0, 80], mcpAbduction: [-20, 20], pipFlexion: [0, 90], dipFlexion: [0, 65] });
  /** Toe joint ranges differ from the hallux. */
  const TOE_POSE: Rule = joint({ mtpFlexion: [-40, 40], mtpAbduction: [-10, 10], pipFlexion: [0, 35], dipFlexion: [0, 60] });
  /** Upper limb records are optional channel groups, not default poses. */
  const ARM_POSE: Rule = object({
    shoulderGirdle: joint({ elevation: [-10, 45], upwardRotation: [-10, 60], protraction: [-15, 15] }),
    shoulder: joint({ flexion: [-60, 170.4], abduction: [-40, 180], rotation: [-70, 90] }),
    elbow: joint({ flexion: [-2.75, 147.3] }), forearm: joint({ pronation: [-87.8, 79.45] }),
    wrist: joint({ flexion: [-70, 80], radialDeviation: [-30, 20] }),
    hand: object({ thumb: joint({ cmcFlexion: [-20, 15], cmcAbduction: [0, 60], cmcOpposition: [0, 45], mcpFlexion: [0, 50], ipFlexion: [0, 80] }),
      index: FINGER, middle: FINGER, ring: FINGER, little: FINGER }, ["thumb", "index", "middle", "ring", "little"])
  }, ["shoulderGirdle", "shoulder", "elbow", "forearm", "wrist", "hand"]);
  /** Lower limb and foot channels preserve negative extension and independent named digits. */
  const LEG_POSE: Rule = object({
    hip: joint({ flexion: [-17.75, 132.1], abduction: [-20, 40], rotation: [-45, 45] }),
    knee: joint({ flexion: [-1.3, 139.8], rotation: [-25, 35] }), ankle: joint({ dorsiflexion: [-58.35, 13.25] }),
    foot: object({ subtalarInversion: range(-5, 5), midfootSupination: range(-15, 35),
      hallux: joint({ mtpFlexion: [-70, 45], mtpAbduction: [-15, 15], ipFlexion: [0, 90] }),
      second: TOE_POSE, third: TOE_POSE, fourth: TOE_POSE, fifth: TOE_POSE
    }, ["subtalarInversion", "midfootSupination", "hallux", "second", "third", "fourth", "fifth"])
  }, ["hip", "knee", "ankle", "foot"]);
  /** All pose regions may be omitted independently; supplied bilateral regions still require both sides. */
  const POSE: Rule = object({
    head: object({ eyes: pair(joint({ vertical: [-30, 30], horizontal: [-45, 45] })),
      jaw: joint({ opening: [0, 52.9], protrusion: [0, 8.5], lateralExcursion: [-10.35, 10.35] }) }, ["eyes", "jaw"]),
    neck: object({ atlantoOccipital: joint({ flexion: [-15, 10], lateralFlexion: [-5, 5] }),
      atlantoAxial: joint({ rotation: [-40, 40] }), cervical: joint({ flexion: [-30, 35], lateralFlexion: [-40, 40], rotation: [-20, 20] })
    }, ["atlantoOccipital", "atlantoAxial", "cervical"]),
    arms: pair(ARM_POSE), pelvis: joint({ tilt: [-90, 90], obliquity: [-90, 90], rotation: [-180, 180] }),
    spine: object({ thoracic: joint({ flexion: [-10, 30], lateralFlexion: [-15, 15], rotation: [-40, 40] }),
      lumbar: joint({ flexion: [-15, 50], lateralFlexion: [-20, 20], rotation: [-5, 5] }) }, ["thoracic", "lumbar"]),
    legs: pair(LEG_POSE)
  }, ["head", "neck", "arms", "spine", "pelvis", "legs"]);
  /** The full public FACS union, including zero-intensity and empty neutral populations. */
  const ACTION: Rule = choices(Unit.InnerBrowRaiser, Unit.OuterBrowRaiser, Unit.BrowLowerer, Unit.UpperLidRaiser,
    Unit.CheekRaiser, Unit.LidTightener, Unit.NoseWrinkler, Unit.UpperLipRaiser, Unit.NasolabialDeepener,
    Unit.LipCornerPuller, Unit.SharpLipPuller, Unit.Dimpler, Unit.LipCornerDepressor, Unit.LowerLipDepressor,
    Unit.ChinRaiser, Unit.LipPucker, Unit.LipStretcher, Unit.NeckTightener, Unit.LipFunneler, Unit.LipTightener,
    Unit.LipPressor, Unit.LipsPart, Unit.JawDrop, Unit.MouthStretch, Unit.LipSuck, Unit.NostrilDilator,
    Unit.NostrilCompressor, Unit.LidDroop, Unit.EyesClosed);
  /** Named speech fields retain their own optionality and ranges; no normalization or geometry default is added. */
  const EXPRESSION: Rule = object({
    units: { array: object({ unit: ACTION, intensity: range(0, 1), side: choices(Side.Both, Side.Left, Side.Right) }) },
    mouth: object({
      lips: object({ upperLipRaiser: pair(range(0, 1)), lipCornerPuller: pair(range(0, 1)),
        lipCornerDepressor: pair(range(0, 1)), lipStretcher: pair(range(0, 1)), lowerLipDepressor: pair(range(0, 1)),
        lipPucker: range(0, 1), lipFunneler: range(0, 1), lipTightener: range(0, 1), lipPressor: range(0, 1),
        lipsPart: range(0, 1), lipSuck: range(0, 1), cheekPuff: range(0, 1)
      }, ["upperLipRaiser", "lipCornerPuller", "lipCornerDepressor", "lipStretcher", "lowerLipDepressor",
        "lipPucker", "lipFunneler", "lipTightener", "lipPressor", "lipsPart", "lipSuck", "cheekPuff"]),
      tongue: object({ tipElevation: range(-1, 1), tipProtrusion: range(-1, 1), tipLateral: range(-1, 1),
        dorsumHeight: range(-1, 1), dorsumBacking: range(0, 1)
      }, ["tipElevation", "tipProtrusion", "tipLateral", "dorsumHeight", "dorsumBacking"]),
      visemes: repeated("sil PP FF TH DD kk CH SS nn RR aa E I O U", range(0, 1), true)
    }, ["lips", "tongue", "visemes"])
  }, ["mouth"]);
  /** The actual public root has two mandatory records and six independent optional records. */
  const PARAMETERS: Rule = object({ body: BODY, head: HEAD, extremities: EXTREMITIES, supplement: SUPPLEMENT,
    appearance: APPEARANCE, pigmentation: object({ melanin: range(0, 0.5), eumelaninShare: range(0, 1),
      haemoglobin: range(0.001, 0.32), iris: choices(Iris.Blue, Iris.Gray, Iris.Green, Iris.Hazel, Iris.LightBrown, Iris.Brown, Iris.DarkBrown) }),
    pose: POSE, expression: EXPRESSION
  }, ["extremities", "supplement", "appearance", "pigmentation", "pose", "expression"]);
}
