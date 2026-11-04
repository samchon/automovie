import {
  type AutoMovieHumanClinicalIk,
  AutoMovieHumanRigControls,
  type AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";

/**
 * Shared action-local inputs and observable requests for the motion laboratory.
 *
 * @evidence contracts/common.md#implementation-and-ownership Technique modules own anatomy and trajectories; this namespace only connects their measured actor geometry, local clocks and explicit contact feedback. Requests are not physical admission.
 * @evidence contracts/common.md#authoring-interface Actor vectors use metres in +X forward, +Y up, +Z left. Contact witnesses and support anchors explicitly use world metres. All times are local seconds, never film timestamps.
 */
export namespace MotionAction {
  /**
   * Nested read-only view for action snapshots exposed by reusable instances.
   *
   * @evidence contracts/common.md#implementation-and-ownership Primitive leaves are retained as their exact input type before object recursion, including Human numeric intersections with range brands. Recursive readonly properties preserve tuple/object structure without mapping a branded number's methods into an object. Runtime ownership remains the producing instance's responsibility.
   * @evidence contracts/common.md#authoring-interface Use for immutable public snapshots, not a cast back to mutable inputs. Numeric units and brands survive the readonly view and a detached pose clone remains assignable to the public Human pose type; a producer must freeze or return detached copies to enforce runtime isolation.
   */
  export type Immutable<T> = T extends
    | string
    | number
    | boolean
    | bigint
    | symbol
    | null
    | undefined
    ? T
    : T extends object
      ? { readonly [K in keyof T]: Immutable<T[K]> }
      : T;
  /**
   * Three metre coordinates in the frame stated by the containing member.
   * @evidence contracts/common.md#implementation-and-ownership A fixed tuple carries a single point/vector without a runtime wrapper; the consuming member owns frame conversion.
   * @evidence contracts/common.md#authoring-interface Coordinates are metres; world and actor-local members state their frame explicitly.
   */
  export type Vec3 = [number, number, number];
  /**
   * Anatomical side, independent of heading or camera.
   * @evidence contracts/common.md#implementation-and-ownership Closed anatomical alternatives prevent actor names from entering technique definitions.
   * @evidence contracts/common.md#authoring-interface Left/right are the performer's own sides.
   */
  export type Side = "left" | "right";
  /**
   * Half-open phases; complete includes the exact recovery endpoint.
   * @evidence contracts/common.md#implementation-and-ownership Preparation, forward delivery, contact, limb return and body settling remain distinct measurable responsibilities.
   * @evidence contracts/common.md#authoring-interface A contact phase is timing intent; only ContactEvent records a detected encounter. Adjacent phases retain compatible actual point/frame goals and clinical endpoints; changing a phase does not certify a previously unresolved support or permit a pose jump.
   */
  export type Phase =
    | "idle"
    | "preparation"
    | "delivery"
    | "contact"
    | "retraction"
    | "recovery"
    | "complete";
  /**
   * Consecutive durations, not absolute timestamps; delivery/retraction are positive.
   * @evidence contracts/common.md#implementation-and-ownership Distinct local durations let actual interception shorten forward delivery while preserving independent return and settling.
   * @evidence contracts/common.md#authoring-interface Seconds are finite and nonnegative; delivery and retraction must be positive. Source event definitions belong to the named timing profile.
   */
  export interface Timing {
    /** Setup and loading seconds; zero permits an already prepared start. */
    preparation: number;
    /** Forward delivery seconds. */
    delivery: number;
    /** Authored dwell ceiling; actual collision can start recovery earlier. */
    contact: number;
    /** Limb return from release to guard, seconds. */
    retraction: number;
    /** Subsequent body/support settling seconds; zero permits immediate completion. */
    recovery: number;
  }
  /**
   * Caller-selected variation bounds, not measured athlete distributions.
   * @evidence contracts/common.md#implementation-and-ownership One explicit seed and bounded duration, Euclidean aim and articulation deviations support deterministic instance variation.
   * @evidence contracts/common.md#authoring-interface Fraction bounds lie in [0,1), aim uses nonnegative metres and seed is unsigned 32-bit.
   */
  export interface Variation {
    /** Unsigned 32-bit deterministic seed. */
    seed: number;
    /** Maximum relative duration change, in [0,1). */
    timingFraction: number;
    /** Maximum Euclidean actor-local aim displacement, metres, nonnegative. */
    aimMetres: number;
    /** Maximum relative articulation scale change, in [0,1). */
    amplitudeFraction: number;
  }
  /**
   * One placement of a technique for an independent actor and target.
   * @evidence contracts/common.md#implementation-and-ownership Identity, lead/acting side, direction and local timing are caller data, leaving definitions independent of a bout or actor pair.
   * @evidence contracts/common.md#authoring-interface Distinct actor identities and a finite nonzero actor-local direction are required; variation is sampled once.
   */
  export interface Request {
    /** Unique placement identity for contact and diagnostic attribution. */
    id: string;
    /** Acting actor identity; no particular name is reserved. */
    actorId: string;
    /** Independent receiving actor identity. */
    targetId: string;
    /** Acting anatomical limb. */
    side: Side;
    /** Stance lead side; needed to distinguish lead and rear mechanics. */
    leadSide: Side;
    /** Nonzero actor-local direction; modules normalize before using it. */
    direction: Vec3;
    /** Explicit local phase durations. */
    timing: Timing;
    /** Omission means exact authored values and no random sampling. */
    variation?: Variation;
  }
  /**
   * Dimensions and landmarks measured from the actual public Human FK/drawing.
   * @evidence contracts/common.md#implementation-and-ownership Measurements remain input data instead of technique constants, so changed proportions affect reachable targets and real bone-bound points.
   * @evidence contracts/common.md#authoring-interface Landmarks use actor-local metres, handLocalPoint uses hand-bone-local metres, and lengths/extents are positive. Techniques refuse missing required geometry.
   */
  export interface Geometry {
    /** Acting shoulder centre in actor-local metres. */
    shoulder?: Vec3;
    /** Acting hip centre in actor-local metres. */
    hip?: Vec3;
    /** Current striking glove contact centre in actor-local metres. */
    hand?: Vec3;
    /** Actual hand-bone-local pad witness, metres. */
    handLocalPoint?: Vec3;
    /** Shoulder-to-elbow length, metres. */
    upperArmMetres?: number;
    /** Elbow-to-wrist length, metres. */
    forearmMetres?: number;
    /** Wrist-to-contact extent, metres. */
    gloveOffsetMetres?: number;
    /** Measured actual pad proxy extent, metres; the host still checks full geometry. */
    gloveRadiusMetres?: number;
    /** Hip-to-knee length, metres. */
    thighMetres?: number;
    /** Knee-to-ankle length, metres. */
    shinMetres?: number;
  }
  /**
   * A real bone-bound point and its requested actor-local destination.
   * @evidence contracts/common.md#implementation-and-ownership Explicit canonical joint and local witness bind fitting and queries to the actual rig; proxy radius supplements full geometry without changing it. Role and constraint priority are independent. Soft anatomical guides retain measured residuals and require separate technique-shape verification rather than becoming automatic acceptance.
   * @evidence contracts/common.md#authoring-interface Target is actor-local metres; localPoint is bone-local metres. Role selects participation and radius must describe the chosen geometric proxy. A raw attack objective stays independent from achieved FK. Clinical shape controls and actual chain geometry must agree; moving a guide to an achieved endpoint cannot erase the original target residual.
   */
  export interface Effector {
    /** Exact canonical public Human joint identity. */
    bone: AutoMovieHumanRigControls.Joint;
    /** Bone-local witness; omitted means the actual joint centre. */
    localPoint?: Vec3;
    /** FK-local metres in the requested root frame; freeze its world target before solving root changes. */
    target: Vec3;
    /** Only strike participates in attack queries; guide is an auxiliary anatomical IK point. */
    role: "strike" | "guard" | "support" | "guide";
    /** Hard goal or subordinate shape objective; omission retains hard-goal behavior. Soft error never certifies technique acceptance. */
    constraint?: "hard" | "soft";
    /** Explicit geometric proxy radius in metres; never shrinks actual geometry. */
    radius: number;
  }
  /**
   * Retained original bone-local surface point and independent world frame.
   * @evidence contracts/common.md#implementation-and-ownership One real emitted point and world goal identify the actual point/frame across phase transitions. Ground-support role is independent of fitting priority: an unloaded point can follow a hard moving trajectory before becoming a compatible pivot. That trajectory does not establish ground contact, force or balance.
   * @evidence contracts/common.md#authoring-interface The point is bone-local metres, world is the desired metre point, yaw is degrees and free mode makes no ground-support claim. Planted/pivot points require hard enforcement plus actual full-foot floor and load-admission checks. Keep the same compatible world goals/priority when changing roles; unresolved soft approach cannot become certified support at a phase boundary.
   */
  export interface SupportPoint {
    /** Exact public bone carrying the retained point. */
    bone: AutoMovieHumanRigControls.Joint;
    /** Actual emitted point in bone-local metres. */
    localPoint: Vec3;
    /** Desired world position in metres; a free point may trace a continuous unloaded path. */
    world: Vec3;
    /** Actual initial world location of this same bone-local point; preparation may approach world from here. */
    initialWorld?: Vec3;
    /** Retained ground point, ground pivot, or a point/frame with no ground-support claim. */
    mode: "planted" | "pivot" | "free";
    /** Target enforcement independent of support role. Default: free is soft; planted/pivot is hard. */
    constraint?: "hard" | "soft";
    /** Anatomical-left pivot degrees (+X toward +Z); opposite Three.js +Y. A solver verifies it. */
    yawDegrees?: number;
    /** Unit x/y/z/w WORLD-axis rotation from the host's measured initial plantar frame about world. Mutually exclusive with yawDegrees. */
    frameRotation?: AutoMovieHumanRigControls.Rotation;
  }
  /**
   * One anatomical foot's retained original surface point.
   *
   * @evidence contracts/common.md#implementation-and-ownership Keeps existing foot planning separate from other ground-bearing anatomy. Runtime admission checks exact canonical foot membership and side agreement; the host additionally proves emitted-vertex identity.
   * @evidence contracts/common.md#authoring-interface Side is anatomical and bone must belong to that side's foot or toes. Point/frame units and independent target priority follow SupportPoint.
   */
  export interface SupportPatch extends SupportPoint {
    /** Owner's anatomical foot. */
    side: Side;
  }
  /**
   * Closed anatomical carrier alternatives for whole-body ground contact.
   *
   * @evidence contracts/common.md#implementation-and-ownership Uses existing Human joints for feet, hands, forearms, elbows, shoulders, knees, hips and trunk without introducing a body or solver. Side/bone agreement is also checked at runtime.
   * @evidence contracts/common.md#authoring-interface Paired regions require anatomical side. Central hips, spine and chest omit it; hip contact can instead name a side's proximal upper-leg surface. Region identifies the retained surface, not a force or injury model.
   */
  export type GroundCarrier =
    | {
        region: "foot";
        side: Side;
        bone: Extract<
          AutoMovieHumanRigControls.Joint,
          `${Side}${"Foot" | "Subtalar" | "Midfoot" | `Hallux${string}` | `Toe${string}`}`
        >;
      }
    | {
        region: "hand";
        side: Side;
        bone: Extract<
          AutoMovieHumanRigControls.Joint,
          `${Side}${"Hand" | `Thumb${string}` | `Index${string}` | `Middle${string}` | `Ring${string}` | `Little${string}`}`
        >;
      }
    | { region: "forearm" | "elbow"; side: Side; bone: `${Side}LowerArm` }
    | { region: "shoulder"; side: Side; bone: `${Side}UpperArm` }
    | { region: "knee"; side: Side; bone: `${Side}LowerLeg` }
    | { region: "hip"; side: Side; bone: `${Side}UpperLeg` }
    | { region: "hip"; side?: never; bone: "hips" }
    | { region: "trunk"; side?: never; bone: "spine" | "chest" };
  /**
   * A named original surface contact carrying a normalized load-intent share.
   *
   * @evidence contracts/common.md#implementation-and-ownership Combines one explicit anatomical carrier with the existing independent point/frame request. A contact must be retained hard; actual surface identity, floor clearance and target residual remain the host's responsibility.
   * @evidence contracts/common.md#authoring-interface Id is unique within one support sample, share is finite nonnegative, and all contacts sum to one. Bone-local/world points are metres. This is requested support, not measured force, balance or swept collision proof.
   */
  export type GroundContact = Omit<SupportPoint, "bone" | "mode"> &
    GroundCarrier & {
      /** Stable contact identity across a retained interval. */
      id: string;
      /** Normalized nonnegative load intent. */
      share: number;
      /** Retained point or pivot; an unloaded trajectory belongs in patches. */
      mode: "planted" | "pivot";
    };
  /**
   * Planned rigid foot frame and its same-pose actual floor-contact witness.
   * @evidence contracts/common.md#implementation-and-ownership Both patches derive from one authored public FK and every original same-side foot vertex. The fixed frame retains its own point identity and horizontal anchor; a separate minimum vertex supplies ground contact without moving the requested frame or copying an achieved solver result.
   * @evidence contracts/common.md#authoring-interface World metres and a unit world-axis frame describe one planned placement. Frame is hard/free and carries no ground-load claim. Contact is hard/planted, carries no frame rotation, and lies on the fixed floor. Its vertex may change only with the actual minimum geometry; a host independently verifies complete-foot floor, frame/contact residuals and adjacent-phase continuity.
   */
  export interface SupportMeasurement {
    /** Same requested frame identity and X/Z, with floor-compatible height/orientation. */
    frame: SupportPatch;
    /** Actual minimum original vertex in that planned frame, independently checked after fitting. */
    contact: SupportPatch;
  }
  /**
   * Independent load intent, distinct from measured forces or COM proof.
   * @evidence contracts/common.md#implementation-and-ownership Named left/right shares and optional actual patches expose support intent without pretending a scalar is a force solution.
   * @evidence contracts/common.md#authoring-interface Nonnegative shares sum to one. A loaded side requires actual admitted retained ground geometry; a hard free trajectory alone does not provide it. A host must inspect full-foot floor, point/frame residuals and load intent together; these shares are not measured contact forces.
   */
  export interface FootSupport {
    /** Omitted discriminator retains existing standing-action inputs. */
    kind?: "feet";
    /** Nonnegative left-foot share; shares sum to one. */
    left: number;
    /** Nonnegative right-foot share; shares sum to one. */
    right: number;
    /** Optional actual plantar witnesses for the public support solver. */
    patches?: SupportPatch[];
  }
  /**
   * Mixed whole-body support with no redundant foot-share authority.
   *
   * @evidence contracts/common.md#implementation-and-ownership One contacts array owns every load share, including any loaded feet. Zero legacy shares retain common left/right reads without mislabeling hip or trunk contact as a planted foot.
   * @evidence contracts/common.md#authoring-interface At least one contact and normalized total share are required. Optional foot patches are unloaded free trajectories; a loaded foot belongs in contacts. Original geometry and floor checks apply to every retained contact.
   */
  export interface ContactSupport {
    /** Selects explicit contact load ownership. */
    kind: "contacts";
    /** No second foot-load authority. */
    left: 0;
    /** No second foot-load authority. */
    right: 0;
    /** Every supporting anatomical surface and its share. */
    contacts: GroundContact[];
    /** Optional unloaded foot trajectories, each free. */
    patches?: SupportPatch[];
  }
  /**
   * Explicit absence of requested ground support during flight or a fall.
   *
   * @evidence contracts/common.md#implementation-and-ownership Zero shares and free trajectories express no retained contact. This changes support intent only and grants no collision or floor exemption.
   * @evidence contracts/common.md#authoring-interface The host still inspects actual geometry against the floor. It must transition to explicit measured contacts when the surface reaches ground; airborne never certifies free space.
   */
  export interface AirborneSupport {
    /** Selects no ground-load claim. */
    kind: "airborne";
    /** No left-foot load. */
    left: 0;
    /** No right-foot load. */
    right: 0;
    /** Optional unloaded foot trajectories, each free. */
    patches?: SupportPatch[];
  }
  /**
   * Exactly one owner for standing, mixed-contact or absent ground support.
   *
   * @evidence contracts/common.md#implementation-and-ownership A closed discriminator prevents simultaneous airborne and loaded-contact intent. Existing undiscriminated foot inputs retain their meaning and unchanged geometric admission requirements.
   * @evidence contracts/common.md#authoring-interface Validate before any actor mutation. This structure carries requested load shares and anchors only; each actual consumer owns source geometry, native fitting and physical inspection.
   */
  export type Support = FootSupport | ContactSupport | AirborneSupport;
  /**
   * One owned requested configuration, subsequently fitted and checked by the host.
   * @evidence contracts/common.md#implementation-and-ownership Clinical pose, independent root/support and named effectors connect the technique to one actual rig consumer without storing film events. One current-pose FK supplies coherent anatomical guides. The host declares a consistent root/seed policy and preserves authored channels rather than switching numerical goals when a coordinate crosses zero.
   * @evidence contracts/common.md#authoring-interface Root and effector targets use actor-local metres, clinical pose uses public Human units, elapsed is local seconds and progress is [0,1]. A host freezes world goals before any permitted root fit and reports requested/applied root snapshots separately; applied motion never retargets the request. Requests do not admit contact or balance. Actual adjacent-phase geometry must remain continuous when support roles change, including retained-contact retraction and replant.
   */
  export interface Sample {
    /** Clinical degrees, with jaw controls retaining Human's millimetre convention. */
    pose: IAutoMovieHumanPose;
    /** Exact authored clinical channels excluded from host fitting; the host validates canonical paths and applied bounds. */
    preservedChannels?: readonly AutoMovieHumanRigControls.DegreeChannel[];
    /** Authored actor-local root displacement in metres; a fitting host reports any permitted applied-root delta separately. */
    rootOffset: Vec3;
    /** Unit x/y/z/w actor-local root orientation after the fixed scene heading; omitted means identity. */
    rootRotation?: AutoMovieHumanRigControls.Rotation;
    /** Independent support intent and optional retained geometry. */
    support: Support;
    /** Explicit real-bone target requests. */
    effectors: Effector[];
    /** Current action-local phase. */
    phase: Phase;
    /** Sampled local seconds. */
    elapsed: number;
    /** Closed-unit progress through the current phase. */
    progress: number;
  }
  /**
   * Body-only placement shared by support planning and subsequent arm authoring.
   *
   * @evidence contracts/common.md#implementation-and-ownership This deep-readonly projection reuses pose, authored controls, rigid root and support types without introducing a solver or a second task representation. A host realizes support first where the technique requests this boundary; the arm stage consumes that same realized body and root. Requested and applied placements remain separately observable.
   * @evidence contracts/common.md#authoring-interface A placement carries clinical Human units, actor-local root metres, optional unit root quaternion and original WORLD support anchors. The host validates actual geometry and every loaded carrier before publishing realized support. The type alone proves neither admission nor balance and never permits copying achieved geometry over the original request.
   */
  export type BodyPlacement = Immutable<
    Pick<
      Sample,
      "pose" | "rootOffset" | "rootRotation" | "support" | "preservedChannels"
    >
  >;
  /**
   * First observed contact of one explicitly participating action pair.
   * @evidence contracts/common.md#implementation-and-ownership The query identifies the action, participants, relation and world witness; finite-sampling uncertainty remains in its receipt instead of becoming an automatic hit timestamp.
   * @evidence contracts/common.md#authoring-interface Time is conservative action-local stopping seconds. Point is world metres and normal points from receiver toward attacker; query bracket and proxy limits must accompany the event.
   */
  export interface ContactEvent {
    /** Owning action placement. */
    actionId: string;
    /** Attacking actor. */
    actorId: string;
    /** Receiving actor. */
    targetId: string;
    /** Conservative local stopping seconds; sampled query brackets belong to the receipt. */
    time: number;
    /** Named interception relationship. */
    relation: "guard" | "body" | "head" | "shin-check";
    /** Actual/proxy contact witness in world metres, described by the query receipt. */
    point: Vec3;
    /** World unit normal directed from receiver toward attacker. */
    normal: Vec3;
  }
  /**
   * First contact and actual constrained delivery retained immutably by the host.
   * @evidence contracts/common.md#implementation-and-ownership Return begins from the displayed constrained configuration rather than a planned peak, with one explicit originating action clock.
   * @evidence contracts/common.md#authoring-interface Event time and sample elapsed must be equal. Incoming receiver events use their separate contactElapsed conversion.
   */
  export interface ContactState {
    /** Explicit participant and query witness. */
    event: ContactEvent;
    /** Configuration fitted to the collision limit, not the planned peak. */
    sample: Sample;
  }
  /**
   * Measured geometry and optional contact feedback for one local sample.
   * @evidence contracts/common.md#implementation-and-ownership Caller-owned geometry, optional public fixed-body FK, actual full-foot measurement, frame and retained contact connect independent action definitions to the actual prepared person. Current-pose joint guides derive from that FK rather than stale guard landmarks. The host owns callable lifetime and original surface data; no new solver or actor catalogue is introduced.
   * @evidence contracts/common.md#authoring-interface Pose is never mutated, target is actor-local metres and root frame is world origin/yaw radians. Anatomical-guided samplers require evaluatePose and its same-body neutral output. supportFrame measures explicitly supplied authored pose/root/point against the fixed floor; achieved postsolve geometry remains an independent check. Borrow callables without structuredClone or serialization. Missing contact forbids an impact-triggered response.
   */
  export interface Context {
    /** Requested neutral/guard configuration, never mutated by an action. */
    basePose: IAutoMovieHumanPose;
    /** Independent actor-local target position in metres. */
    target: Vec3;
    /** Missing technique-required dimensions cause an explicit refusal. */
    geometry: Geometry;
    /** Borrowed public fixed-body Human FK for current authored pose; no world/root transform is applied. */
    evaluatePose?: AutoMovieHumanSkeleton.PoseEvaluator;
    /** Neutral output from the exact same prepared body as evaluatePose, in its evaluator metre frame. */
    neutral?: AutoMovieHumanSkeleton.IOutput;
    /**
     * Measure a planned foot frame and the same authored full-foot ground contact.
     * @evidence contracts/common.md#implementation-and-ownership The host uses the borrowed same-body FK and all original foot vertices once. Frame preserves the supplied bone/local point, initialWorld and world X/Z while its authored orientation determines floor-compatible Y. A separate actual minimum vertex gives contact in that same planned placement; neither result comes from postsolve geometry or mutates actor, root, floor or source shape.
     * @evidence contracts/common.md#authoring-interface Inputs are authored clinical pose, requested actor-local metre root offset and one bone-local frame patch. Output frame is hard/free, contact hard/planted without orientation; the loaded side consumes contact once and never counts the frame as support. Contact identity follows actual equal-height minimum changes, while the frame identity/anchor stays fixed. Invalid or unsupported data refuses. Independent displayed-world point/frame, complete-foot floor, requested/applied root delta and phase continuity remain mandatory.
     */
    supportFrame?: (
      authoredPose: IAutoMovieHumanPose,
      requestedRootOffset: Vec3,
      patch: SupportPatch,
    ) => SupportMeasurement;
    /**
     * Borrow the original bone-bound support frame targets in WORLD metres.
     *
     * @evidence contracts/common.md#implementation-and-ownership The host captures original carrier geometry, initial FK rotation and actor heading independently of mutable actor state. Planning and final fitting share the same original noncollinear three points for a declared rigid frame or the original single point for a plain contact; a contact alone never invents orientation. The callable reads the patch without mutation and returns independently owned target objects and coordinate tuples on every call; no achieved pose, root or later actor matrix can redefine them.
     * @evidence contracts/common.md#authoring-interface The input is a readonly original bone/local identity, WORLD anchor and optional frame rotation. Unlike a direct ClinicalIk request, each returned ITarget.position is WORLD metres: the consumer converts it exactly once into its requested evaluator frame before solving. Fixed bone/local identities and raw WORLD goals survive fitting and failure. Missing geometry or an unsupported identity refuses; consumers preserve planning residuals and independently verify displayed frame, complete-foot floor and per-foot load instead of treating this callback as physical admission. Borrow the function without cloning or serializing it.
     */
    supportTargets?: (
      patch: Immutable<SupportPatch>,
    ) => readonly Immutable<AutoMovieHumanClinicalIk.ITarget>[];
    /**
     * Borrow the host's same prepared support solve without changing the displayed actor.
     * @evidence contracts/common.md#implementation-and-ownership Uses the captured same-body FK, original full geometry, WORLD anchors and native solver limits also consumed by final placement. It returns actual pose/root with original support goals; failure retains the existing detached Error.cause diagnostics and never substitutes achieved anchors.
     * @evidence contracts/common.md#authoring-interface Input is immutable and output detached. The host owns bounded work accounting and callable lifetime, with no recursive action sampling or live actor-state dependency. Source planning must not mutate displayed state. Missing callback permits only source requests, never a claim of actual host admission.
     */
    prepareSupport?: (plan: BodyPlacement) => BodyPlacement;
    /** Measured planted and forefoot-pivot alternatives; a technique selects retained points. */
    supportPatches?: SupportPatch[];
    /** Actual scene root, needed only to convert world contact reactions. */
    frame?: {
      /** Actual actor origin in world metres. */
      origin: Vec3;
      /** Scene right-hand +Y rotation in radians, matching the actual actor matrix. */
      yawRadians: number;
    };
    /** No contact means no impact-triggered reaction or early recovery. */
    contact?: ContactState;
  }
  /**
   * Detach the body-only boundary without copying tasks or host callables.
   *
   * @evidence contracts/common.md#implementation-and-ownership Copies clinical pose, authored-control selection, root displacement/orientation and support through structuredClone. Nested controls, point/frame tuples and shares belong to this returned snapshot, so later requests or fitting cannot mutate the placement used for arm authoring. No fitting, frame conversion or acceptance decision occurs here.
   * @evidence contracts/common.md#authoring-interface Input and output retain the same readonly BodyPlacement structure and coordinate conventions. The producing host must separately record requested versus realized placements and validate native fitting, every loaded foot and floor before publishing realized support. Each invocation returns a fresh independent snapshot; original anchors and coordinates are copied exactly rather than replaced by achieved geometry.
   */
  export function snapshotBodyPlacement(source: BodyPlacement): BodyPlacement {
    return structuredClone({
      pose: source.pose,
      rootOffset: source.rootOffset,
      ...(source.rootRotation ? { rootRotation: source.rootRotation } : {}),
      ...(source.preservedChannels
        ? { preservedChannels: source.preservedChannels }
        : {}),
      support: source.support,
    });
  }
  /**
   * Admit an actual support point's finite coordinates and optional rigid frame request.
   *
   * @evidence contracts/common.md#implementation-and-ownership Validates finite three-coordinate point/anchor tuples, finite legacy yaw and unit quaternion norm with the public Human root's 1e-6 norm tolerance. Mutually exclusive rotation representations prevent composing pitch/yaw about different unstated centres. This is structural admission only; full-foot floor compatibility remains the actual solver's responsibility.
   * @evidence contracts/common.md#authoring-interface frameRotation uses unit x/y/z/w and world axes, rotating the measured initial plantar frame about this patch's single retained world point. Invalid dimensions, rotations or simultaneous yaw/quaternion throw without mutation.
   */
  export function validateSupportFrame(patch: Immutable<SupportPatch>): void {
    if (
      (patch.side !== "left" && patch.side !== "right") ||
      !carrierMatches("foot", patch.side, patch.bone)
    )
      throw new Error(
        "Support foot must retain its own canonical foot carrier",
      );
    validatePoint(patch);
  }
  /**
   * Admit finite normalized support intent before a consumer mutates its actor.
   * @evidence contracts/common.md#implementation-and-ownership Validates the closed support branch, all declared carriers and finite nonnegative shares with a 1e-9 arithmetic sum tolerance. Explicit foot patches must contain retained own-side support for every positive foot share; omitted patches leave existing measured-default selection to the host. No geometry is generated or retargeted.
   * @evidence contracts/common.md#authoring-interface Unknown branches, contradictory contact/flight records, duplicate contact ids and malformed shares refuse without mutation. Contact and airborne branches require exact zero legacy shares and free optional trajectories. Actual vertex identity, full geometry floor, target tolerance and balance remain separate host checks.
   */
  export function validateSupport(support: Immutable<Support>): void {
    if (
      !support ||
      ![undefined, "feet", "contacts", "airborne"].includes(support.kind)
    )
      throw new Error("Unknown support kind");
    if (support.patches !== undefined && !Array.isArray(support.patches))
      throw new Error("Support patches must be an array");
    for (const patch of support.patches ?? []) validateSupportFrame(patch);
    if (
      ![support.left, support.right].every(
        (share: number): boolean => Number.isFinite(share) && share >= 0,
      )
    )
      throw new Error("Foot shares must be finite and nonnegative");
    if (support.kind === undefined || support.kind === "feet") {
      if (
        "contacts" in support ||
        Math.abs(support.left + support.right - 1) > 1e-9
      )
        throw new Error(
          "Foot shares must sum to one without contact authority",
        );
      for (const side of ["left", "right"] as const)
        if (
          support[side] > 0 &&
          support.patches !== undefined &&
          !support.patches.some(
            (patch: Immutable<SupportPatch>): boolean =>
              patch.side === side && patch.mode !== "free",
          )
        )
          throw new Error(
            `Loaded ${side} foot requires retained own-side support`,
          );
      return;
    }
    if (
      support.left !== 0 ||
      support.right !== 0 ||
      support.patches?.some(
        (patch: Immutable<SupportPatch>): boolean => patch.mode !== "free",
      )
    )
      throw new Error(
        "Non-foot support requires zero legacy shares and free foot trajectories",
      );
    if (support.kind === "airborne") {
      if ("contacts" in support)
        throw new Error("Airborne support cannot retain ground contacts");
      return;
    }
    if (support.kind !== "contacts")
      throw new Error("Expected explicit contact support");
    if (!Array.isArray(support.contacts) || !support.contacts.length)
      throw new Error("Contact support requires at least one retained contact");
    const ids: Set<string> = new Set<string>();
    let total: number = 0;
    for (const contact of support.contacts) {
      validateGroundContact(contact);
      if (ids.has(contact.id))
        throw new Error("Ground contact ids must be unique");
      ids.add(contact.id);
      total += contact.share;
    }
    if (!Number.isFinite(total) || Math.abs(total - 1) > 1e-9)
      throw new Error("Ground contact shares must sum to one");
  }
  /**
   * Check one explicitly named anatomical ground carrier and retained hard target.
   * @evidence contracts/common.md#implementation-and-ownership Canonical Human identity and closed region mapping reject side swaps, foreign limbs and central-bone side labels before numerical fitting. It shares point/frame admission with original foot requests.
   * @evidence contracts/common.md#authoring-interface Id must be nonempty, share finite nonnegative, and mode planted or pivot. Source-vertex membership and actual world/floor agreement belong to the same actor's geometry consumer.
   */
  export function validateGroundContact(
    contact: Immutable<GroundContact>,
  ): void {
    if (
      !contact ||
      typeof contact.id !== "string" ||
      !contact.id.trim() ||
      !Number.isFinite(contact.share) ||
      contact.share < 0 ||
      (contact.mode !== "planted" && contact.mode !== "pivot") ||
      !carrierMatches(contact.region, contact.side, contact.bone)
    )
      throw new Error(
        "Ground contact requires a named canonical anatomical carrier and nonnegative share",
      );
    validatePoint(contact);
  }
  /**
   * Validate optional root orientation in the fixed-heading actor frame.
   * @evidence contracts/common.md#implementation-and-ownership Reuses Human's 1e-6 unit-quaternion norm tolerance without normalizing malformed input. Root orientation adds a rigid placement, preserving clinical joint bounds.
   * @evidence contracts/common.md#authoring-interface Omitted means identity; otherwise x/y/z/w must be finite and unit. Actual world orientation is heading multiplied by this local quaternion. Root offset remains in the fixed heading frame.
   */
  export function validateRootRotation(
    rotation: Immutable<AutoMovieHumanRigControls.Rotation> | undefined,
  ): void {
    if (
      rotation !== undefined &&
      (!Array.isArray(rotation) ||
        rotation.length !== 4 ||
        ![0, 1, 2, 3].every((index: number): boolean =>
          Number.isFinite(rotation[index]),
        ) ||
        Math.abs(Math.hypot(...rotation) - 1) > 1e-6)
    )
      throw new Error("Root rotation must be a unit actor-local quaternion");
  }
  /** Share finite point/frame validation without assigning anatomical or load semantics. */
  function validatePoint(patch: Immutable<SupportPoint>): void {
    supportConstraint(patch);
    const points: readonly (readonly number[])[] = [
      patch.localPoint,
      patch.world,
      ...(patch.initialWorld !== undefined ? [patch.initialWorld] : []),
    ];
    if (
      !points.every(
        (point: readonly number[]): boolean =>
          Array.isArray(point) &&
          point.length === 3 &&
          [0, 1, 2].every((index: number): boolean =>
            Number.isFinite(point[index]),
          ),
      )
    )
      throw new Error(
        "Support frame requires finite bone-local and world metre points",
      );
    if (patch.yawDegrees !== undefined && !Number.isFinite(patch.yawDegrees))
      throw new Error("Support yaw must be finite degrees");
    if (
      patch.frameRotation !== undefined &&
      (patch.yawDegrees !== undefined ||
        !Array.isArray(patch.frameRotation) ||
        patch.frameRotation.length !== 4 ||
        ![0, 1, 2, 3].every((index: number): boolean =>
          Number.isFinite(patch.frameRotation![index]),
        ) ||
        Math.abs(Math.hypot(...patch.frameRotation) - 1) > 1e-6)
    )
      throw new Error(
        "Support frame requires one unit world quaternion or legacy yaw, never both",
      );
  }
  /**
   * Admit fitting priority without interpreting an unloaded path as grounded support.
   *
   * @evidence contracts/common.md#implementation-and-ownership Resolves the existing free-soft/retained-hard defaults while allowing an explicitly hard unloaded trajectory. Invalid priorities and soft retained supports refuse; callers still own actual floor, geometry, load and phase-continuity verification.
   * @evidence contracts/common.md#authoring-interface Hard/soft chooses the public solver's physical or subordinate target collection, independently of mode. A free hard point can move above the floor and carries no ground reaction claim. Changing mode must not silently change the effective priority of a continuously retained target.
   */
  export function supportConstraint(
    patch: Immutable<SupportPoint>,
  ): "hard" | "soft" {
    if (
      !["planted", "pivot", "free"].includes(patch.mode) ||
      (patch.constraint !== undefined &&
        patch.constraint !== "hard" &&
        patch.constraint !== "soft")
    )
      throw new Error(
        "Support role and target priority must use their declared alternatives",
      );
    const priority: "hard" | "soft" =
      patch.constraint ?? (patch.mode === "free" ? "soft" : "hard");
    if (patch.mode !== "free" && priority !== "hard")
      throw new Error(
        "Retained ground support requires hard point/frame enforcement",
      );
    return priority;
  }
  /** Match canonical carrier regions before a host verifies the actor's actual emitted vertices. */
  function carrierMatches(
    region: string,
    side: Side | undefined,
    bone: string,
  ): boolean {
    if (!AutoMovieHumanRigControls.isJoint(bone)) return false;
    if (region === "trunk")
      return side === undefined && (bone === "spine" || bone === "chest");
    if (region === "hip" && bone === "hips") return side === undefined;
    if ((side !== "left" && side !== "right") || !bone.startsWith(side))
      return false;
    const suffix: string = bone.slice(side.length);
    if (region === "foot")
      return /^(Foot|Subtalar|Midfoot|Hallux(Proximal|Distal)|Toe[2-5](Proximal|Intermediate|Distal))$/.test(
        suffix,
      );
    if (region === "hand")
      return /^(Hand|Thumb(Metacarpal|Proximal|Distal)|(Index|Middle|Ring|Little)(Proximal|Intermediate|Distal))$/.test(
        suffix,
      );
    if (region === "forearm" || region === "elbow")
      return suffix === "LowerArm";
    if (region === "shoulder") return suffix === "UpperArm";
    if (region === "knee") return suffix === "LowerLeg";
    return region === "hip" && suffix === "UpperLeg";
  }
}
