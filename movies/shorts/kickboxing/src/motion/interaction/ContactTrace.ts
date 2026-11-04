import type { IAutoMovieMesh } from "@automovie/interface";

import type { MotionAction } from "../core/MotionAction";
import { ContactGeometry } from "./ContactGeometry";

/**
 * First interception of actual displayed attack and receiving triangles.
 *
 * @evidence contracts/common.md#implementation-and-ownership Canonical action-local samples, strict public Engine crossings and actual referenced-vertex segment rays find a conservative delivery limit. Rays account for receiver translation; rotating/deforming surfaces retain finite sampling limits. This is kinematic interception, not articulated continuous collision detection or force simulation.
 * @evidence contracts/common.md#authoring-interface The host updates both actors and matrices before capture, supplies detached immutable world-metre meshes and the actual fitted attacker sample, then consumes the returned contact state. Every supplied pair is inspected; omitted surfaces remain outside the claim and are enumerated by the participant receipt.
 */
export namespace ContactTrace {
  /**
   * One complete displayed participating surface and actual bone-bound witnesses.
   *
   * @evidence contracts/common.md#implementation-and-ownership Actual drawing triangles and referenced vertices drive contact queries; explicit clearance surfaces use identical tests but refuse an unintended collision instead of creating a strike reaction.
   * @evidence contracts/common.md#authoring-interface Stable id, role and topology are required through one delivery. Mesh/points are detached world metres. Omitted role means strike; additional points must be actual achieved effectors.
   */
  export interface Attack {
    /** Stable mesh identity within this action placement. */
    id: string;
    /** Strike participation or incidental-limb clearance; omitted means strike. */
    role?: "strike" | "clearance";
    /** Complete currently displayed world-metre triangles. */
    mesh: IAutoMovieMesh;
    /** Additional actual world-metre effectors; referenced vertices are always traced too. */
    points?: MotionAction.Vec3[];
  }
  /**
   * An explicitly participating receiver surface.
   *
   * @evidence contracts/common.md#implementation-and-ownership Guard, head, body and shin-check triangles use the same strict query path; relation labels classify a witnessed interception without exempting any geometry.
   * @evidence contracts/common.md#authoring-interface Supply all surfaces that can intercept the attack, including guards preceding a body aim. Stable identity/relation/topology are required; the resolver cannot infer an omitted body part.
   */
  export interface Receiver {
    /** Stable receiver mesh identity within this action placement. */
    id: string;
    /** Named guard, head, body or shin interception. */
    relation: MotionAction.ContactEvent["relation"];
    /** Complete currently displayed world-metre triangles. */
    mesh: IAutoMovieMesh;
  }
  /**
   * Owned geometry and fitted configuration at one common local sample time.
   *
   * @evidence contracts/common.md#implementation-and-ownership The actual fitted attacker state and both participants' current surfaces share a host sample, so contact cannot be inferred from a nominal target beside unrelated animation.
   * @evidence contracts/common.md#authoring-interface Capture must finish pose/support/IK and world-matrix updates for both actors before returning immutable detached data. Every sample.elapsed equals the requested local seconds.
   */
  export interface Frame {
    /** Attacker's actual constrained configuration, including achieved effectors. */
    sample: MotionAction.Sample;
    /** All striking and incidental attacking limb meshes required by this case. */
    attacks: Attack[];
    /** All preceding guard, head, body and check surfaces required by this case. */
    receivers: Receiver[];
  }
  /**
   * Fixed local sampling controls and the actual-geometry consumer seam.
   *
   * @evidence contracts/common.md#implementation-and-ownership Canonical intervals and midpoint samples are independent of Viewer frame delta; bounded refinement and capture counts make the computation finite. Graze incidence is an explicit authored classification.
   * @evidence contracts/common.md#authoring-interface Delivery interval and steps use local seconds. Distinct named participants, positive steps, integer refinement in [0,24], sufficient capture budget and a closed-unit graze cosine are required.
   */
  export interface Options {
    /** Unique action placement. */
    actionId: string;
    /** Acting actor identity. */
    actorId: string;
    /** Receiving actor identity. */
    targetId: string;
    /** Inclusive delivery start in action-local seconds. */
    start: number;
    /** Inclusive delivery endpoint in action-local seconds. */
    end: number;
    /** Positive canonical interval, also sampled halfway. */
    stepSeconds: number;
    /** Bisection count, integer in [0,24]. */
    refinementSteps: number;
    /** Maximum captures including refinement; exhaustion refuses. */
    maximumCaptures: number;
    /** Incidence cosine below this authored threshold is grazing. */
    grazeCosine: number;
    /** Default last-clear preserves conservative return. First-witness captures the original witness time once more within the same budget; it is not a nonpenetration certificate. */
    stopAt?: "last-clear" | "first-witness";
    /**
     * Update both actual actors, then return detached geometry and fitted attacker state.
     *
     * @evidence contracts/common.md#implementation-and-ownership The consumer owns FK, fitting and actual world transforms, while the resolver owns sampling order and queries. Captures are timed separately from geometry preparation and Engine queries.
     * @evidence contracts/common.md#authoring-interface The input is action-local seconds and may seek backward during refinement. Return a fresh immutable frame with actual achieved sample/effectors; no nominal-only geometry or mutable frame reuse is supported.
     */
    capture(time: number): Frame;
  }
  /**
   * Actual participant coverage, timings and finite-query uncertainty.
   *
   * @evidence contracts/common.md#implementation-and-ownership The receipt preserves canonical resolution, last-clear/witness brackets, actual queried surface population and Engine work counts, including build/refit reuse. Host capture, query preparation and narrow-phase costs are measured separately.
   * @evidence contracts/common.md#authoring-interface All durations ending Ms are CPU elapsed milliseconds and exclude draw/GPU/capture/encoding outside this resolver. Witness time can differ from conservative reaction time; neither the bracket nor a miss supplies whole-body or continuous-articulation proof.
   */
  export interface Receipt {
    /** Requested stopping policy; omitted input resolves to last-clear. */
    stopAt: "last-clear" | "first-witness";
    /** Canonical interval before additional midpoint samples, seconds. */
    stepSeconds: number;
    /** Original last-clear local sample, preserved independently of the selected stop. */
    lastClearTime: number | null;
    /** Last-clear/first-witness local seconds, or null for a miss. */
    bracket: [number, number] | null;
    /** Local time of the geometric witness, possibly interpolated between captures. */
    witnessTime: number | null;
    /** Selected local time when connected retraction/reaction begins. */
    reactionTime: number | null;
    /** Actual first-interception pair and original receiver triangle. */
    pair: { attack: string; receiver: string; triangle: number } | null;
    /** Actual witness query method, without a continuous-articulation claim. */
    method: "sampled-crossing" | "translated-vertex-path" | null;
    /** Complete supplied mesh population and explicit clearance policy. */
    participants: {
      attacks: { id: string; role: "strike" | "clearance" }[];
      receivers: { id: string; relation: Receiver["relation"] }[];
    };
    /** Actual captures, narrow-phase queries, proved current-box separations and query reuse work. */
    work: {
      captures: number;
      crossings: number;
      rays: number;
      crossingBuilds: number;
      crossingRefits: number;
      rayBuilds: number;
      separatedPairs: number;
    };
    /** CPU timings in milliseconds; host capture includes the host's own fitting/matrix work. */
    profile: {
      hostCaptureMs: number;
      queryPreparationMs: number;
      crossingMs: number;
      raysMs: number;
      totalMs: number;
    };
    /** Maximum observed receiver departure from translation between adjacent captures, metres. */
    receiverNontranslationMetres: number;
    /** Strict coplanar crossings without an attributed transverse point. */
    unlocalizedCrossings: number;
    /** Explicit unproved regions and physical-model boundaries. */
    limitations: string[];
  }
  /**
   * An explicitly selected contact trigger and its actual connected recovery configuration.
   *
   * @evidence contracts/common.md#implementation-and-ownership Default retraction starts at the last-clear configuration. Explicit first-witness captures the same original witness time and keeps that actual sample, without changing pair selection. Direct head/body contact is a hit; guard/shin interception is a block. Sampled-crossing velocity is a displacement proxy under receiver rotation/deformation, not contact-patch velocity. Misses have no event or impact reaction; unintended clearance contacts refuse instead of masquerading as a valid hit.
   * @evidence contracts/common.md#authoring-interface Event time, stopTime and constrainedSample.elapsed agree exactly under either policy. World point/normal are unchanged original-query witnesses at receipt.witnessTime; the bracket/last-clear time remain observable. First-witness captures actual state at that time, while interpolated vertex paths need independent same-pair point-to-surface measurements on that actual state. Strict crossing can be absent at a mere touch; consumers distinguish separation, touch and bounded penetration without replacing the witness or inferring exact articulated contact.
   */
  export interface Result {
    /** Miss within finite inspection, grazing contact, blocked strike or direct head/body hit. */
    outcome: "miss" | "graze" | "block" | "hit";
    /** Selected local contact/reaction trigger, or null for a miss. */
    event: MotionAction.ContactEvent | null;
    /** Selected actual delivery seconds, or null for a miss. */
    stopTime: number | null;
    /** Actual fitted configuration at stopTime. */
    constrainedSample: MotionAction.Sample | null;
    /** Normal approach value, metres per second: point-path velocity for translated rays, mean attack-point minus receiver-first-vertex velocity proxy for sampled crossings. */
    approachMetresPerSecond: number;
    /** Query attribution, work, measured cost and finite limitations. */
    receipt: Receipt;
  }

  /**
   * Detached evidence attached to initial-crossing and clearance-contact Error.cause.
   *
   * @evidence contracts/common.md#implementation-and-ownership Copies only the already computed witness, participants and stopping bracket into plain records and owned coordinate arrays. No mesh, pose, mutable query state or new sampling is retained, so later actor reuse/refits cannot change this historical cause.
   * @evidence contracts/common.md#authoring-interface Times are action-local seconds; point/normal use world coordinates at witnessTime, which can differ from conservative time. Pair.triangle is the receiver's original triangle ordinal. This receipt has the same finite-query limits as the failed solve and supplies no independently recomputed bounds.
   */
  export interface RefusalReceipt {
    /** Witness-bearing refusal; other errors need not have this cause shape. */
    kind: "initial-crossing" | "clearance-contact";
    /** Failed action placement and explicit participating actors. */
    actionId: string;
    /** Attacking actor identity. */
    actorId: string;
    /** Receiving actor identity. */
    targetId: string;
    /** Conservative action-local stopping seconds. */
    time: number;
    /** Initial singleton time or refined last-clear/first-witness seconds. */
    bracket: [number, number];
    /** Actual mesh pair and original receiver triangle ordinal. */
    pair: { attack: string; receiver: string; triangle: number };
    /** Existing strike or incidental-clearance policy. */
    role: "strike" | "clearance";
    /** Witnessed receiving relationship. */
    relation: MotionAction.ContactEvent["relation"];
    /** Owned observed world-metre point at witnessTime. */
    point: MotionAction.Vec3;
    /** Owned query-oriented unit world normal at witnessTime. */
    normal: MotionAction.Vec3;
    /** Action-local observed or interpolated witness seconds. */
    witnessTime: number;
    /** Existing query method, with its finite-sampling premises. */
    method: NonNullable<Receipt["method"]>;
  }

  /**
   * Inspect one deterministic action-local path, independent of playback cadence.
   *
   * @evidence contracts/common.md#implementation-and-ownership Canonical endpoint/midpoint captures inspect every named pair through one solve-local fixed-topology Engine query owner. Exact co-first clearance takes precedence over a strike before either stopping policy can publish an event. Unlocalized endpoint pairs require an actual capture through an earlier located witness and strict separation of their swept endpoint boxes; remaining overlap or ambiguous ordering refuses. This encloses linear sampled-vertex paths, not unsampled articulation. First interception is bisected; default last-clear or explicitly captured original witness state drives return. Every additional capture consumes the unchanged budget and keeps the same participant identities. No sampled bracket is promoted to exact articulated CCD or force proof.
   * @evidence contracts/common.md#authoring-interface Invalid controls, unstable participants/topology, initial crossing, clearance contact, unattributed coplanar overlap and capture exhaustion throw. Initial/clearance witnesses attach a detached RefusalReceipt to Error.cause; other failures need not. Results retain no session handles; the receipt separates host, preparation and query CPU cost. Runtime work follows captures times actual pairs and referenced vertices, plus Engine triangle-query traversal.
   */
  export function resolve(options: Options): Result {
    validate(options);
    const start: number = performance.now();
    const receipt: Receipt = {
      stopAt: options.stopAt ?? "last-clear",
      stepSeconds: options.stepSeconds,
      lastClearTime: null,
      bracket: null,
      witnessTime: null,
      reactionTime: null,
      pair: null,
      method: null,
      participants: { attacks: [], receivers: [] },
      work: {
        captures: 0,
        crossings: 0,
        rays: 0,
        crossingBuilds: 0,
        crossingRefits: 0,
        rayBuilds: 0,
        separatedPairs: 0,
      },
      profile: {
        hostCaptureMs: 0,
        queryPreparationMs: 0,
        crossingMs: 0,
        raysMs: 0,
        totalMs: 0,
      },
      receiverNontranslationMetres: 0,
      unlocalizedCrossings: 0,
      limitations: [
        "Only enumerated actual surfaces participate. The host must supply complete attacking limbs and every possible preceding guard/head/body/check receiver; omitted geometry has no clearance claim.",
        "Referenced actual vertices follow piecewise linear paths between captures. Exactly translated receiver snapshots support vertex-segment rays; rotated/deformed receivers receive only finite endpoint/midpoint crossing checks.",
        "Vertex paths do not cover swept triangle interiors or all edge-edge contact; strict crossing queries omit mere touches and containment. No articulated continuous collision certificate is supplied.",
        "A strictly disjoint referenced world-coordinate box proves only that current triangles do not cross. It never suppresses a translated vertex path between the captures.",
        "Sampled-crossing incidence and response use mean attack-point displacement minus receiver-first-vertex displacement per local interval. Under receiver rotation/deformation this is a kinematic proxy, not actual contact-patch relative velocity; translated vertex rays instead use their sampled point-path velocity.",
        options.stopAt === "first-witness"
          ? "The selected stop is a fresh actual capture at the original witness time, with the original first pair unchanged. Sampled crossings can already overlap and translated-ray contact can be a mere touch. No last-clear, penetration-depth, exact-contact or continuous-contact certificate is supplied; the host must inspect this displayed state."
          : "The event/reaction starts at the conservative last-clear sample. Point/normal belong to the separately recorded witness time inside the finite bracket, not exact first physical contact.",
        "Initial/unattributed coplanar overlap and incidental-clearance interception refuse; no relation or named actor supplies an exemption.",
        "Recovery and authored compliance offsets require actual host fitting and reinspection; this query supplies no force, balance, injury or material model.",
      ],
    };
    const capture: (time: number) => Frame = (time: number): Frame => {
      if (++receipt.work.captures > options.maximumCaptures)
        throw new Error("Contact capture budget exhausted.");
      const captureStart: number = performance.now();
      const frame: Frame = options.capture(time);
      receipt.profile.hostCaptureMs += performance.now() - captureStart;
      if (frame.sample.elapsed !== time)
        throw new Error(
          "Contact capture must report its actual local sample time.",
        );
      validateFrame(frame);
      return frame;
    };
    const queries: ContactGeometry.Session = ContactGeometry.create(
      receipt,
      capture,
    );
    let lowTime: number = options.start;
    let low: Frame = capture(lowTime);
    const initial: ContactGeometry.Witness | null = queries.intercept(
      low,
      low,
      0,
    );
    if (initial)
      throw new Error(
        `Delivery starts with an existing surface crossing: action ${options.actionId}, actors ${options.actorId}->${options.targetId}, pair ${initial.attack}->${initial.receiver}, ${initial.role}/${initial.relation}, local ${lowTime}s, receiver triangle ${initial.triangle}, world point [${initial.point.join(",")}]. Repair the initial configuration.`,
        {
          cause: refusalReceipt("initial-crossing", options, initial, lowTime, [
            lowTime,
            lowTime,
          ]),
        },
      );
    const intervals: number = Math.ceil(
      (options.end - options.start) / options.stepSeconds,
    );
    for (let index: number = 1; index <= intervals * 2; index++) {
      let highTime: number = Math.min(
        options.end,
        options.start + (index * options.stepSeconds) / 2,
      );
      const high: Frame = capture(highTime);
      let witness: ContactGeometry.Witness | null = queries.intercept(
        low,
        high,
        highTime - lowTime,
      );
      if (!witness) {
        lowTime = highTime;
        low = high;
        if (highTime === options.end) break;
        continue;
      }
      for (
        let refinement: number = 0;
        refinement < options.refinementSteps;
        refinement++
      ) {
        const middleTime: number = (lowTime + highTime) / 2;
        const middle: Frame = capture(middleTime);
        const earlier: ContactGeometry.Witness | null = queries.intercept(
          low,
          middle,
          middleTime - lowTime,
        );
        if (earlier) {
          highTime = middleTime;
          witness = earlier;
        } else {
          lowTime = middleTime;
          low = middle;
        }
      }
      if (witness.role === "clearance")
        throw new Error(
          `Unintended clearance contact: ${witness.attack} -> ${witness.receiver} at local ${lowTime}s; bracket [${lowTime}, ${highTime}].`,
          {
            cause: refusalReceipt(
              "clearance-contact",
              options,
              witness,
              lowTime,
              [lowTime, highTime],
            ),
          },
        );
      const speed: number = Math.hypot(...witness.velocity);
      const approach: number = Math.max(
        0,
        -(
          witness.velocity[0] * witness.normal[0] +
          witness.velocity[1] * witness.normal[1] +
          witness.velocity[2] * witness.normal[2]
        ),
      );
      const grazing: boolean =
        speed > 0 && approach / speed < options.grazeCosine;
      const stopTime: number =
        options.stopAt === "first-witness" ? witness.time : lowTime;
      const stopped: Frame =
        options.stopAt === "first-witness" ? capture(stopTime) : low;
      if (options.stopAt === "first-witness")
        validatePopulation(stopped, low, receipt.participants);
      receipt.bracket = [lowTime, highTime];
      receipt.lastClearTime = lowTime;
      receipt.witnessTime = witness.time;
      receipt.reactionTime = stopTime;
      receipt.pair = {
        attack: witness.attack,
        receiver: witness.receiver,
        triangle: witness.triangle,
      };
      receipt.method = witness.method;
      receipt.profile.totalMs = performance.now() - start;
      return {
        outcome: grazing
          ? "graze"
          : witness.relation === "body" || witness.relation === "head"
            ? "hit"
            : "block",
        event: {
          actionId: options.actionId,
          actorId: options.actorId,
          targetId: options.targetId,
          time: stopTime,
          relation: witness.relation,
          point: witness.point,
          normal: witness.normal,
        },
        stopTime,
        constrainedSample:
          options.stopAt === "first-witness"
            ? structuredClone(stopped.sample)
            : low.sample,
        approachMetresPerSecond: approach,
        receipt,
      };
    }
    receipt.profile.totalMs = performance.now() - start;
    return {
      outcome: "miss",
      event: null,
      stopTime: null,
      constrainedSample: null,
      approachMetresPerSecond: 0,
      receipt,
    };
  }

  /** Copy the existing witness and bracket without retaining mutable producer storage. */
  function refusalReceipt(
    kind: RefusalReceipt["kind"],
    options: Options,
    witness: ContactGeometry.Witness,
    time: number,
    bracket: [number, number],
  ): RefusalReceipt {
    return {
      kind,
      actionId: options.actionId,
      actorId: options.actorId,
      targetId: options.targetId,
      time,
      bracket: [bracket[0], bracket[1]],
      pair: {
        attack: witness.attack,
        receiver: witness.receiver,
        triangle: witness.triangle,
      },
      role: witness.role,
      relation: witness.relation,
      point: [witness.point[0], witness.point[1], witness.point[2]],
      normal: [witness.normal[0], witness.normal[1], witness.normal[2]],
      witnessTime: witness.time,
      method: witness.method,
    };
  }

  /** Refuse malformed author controls before touching host state. */
  function validate(options: Options): void {
    if (
      !options.actionId ||
      !options.actorId ||
      !options.targetId ||
      options.actorId === options.targetId
    )
      throw new Error(
        "Contact needs distinct named participants and an action identity.",
      );
    if (
      ![
        options.start,
        options.end,
        options.stepSeconds,
        options.grazeCosine,
      ].every(Number.isFinite) ||
      options.start < 0 ||
      options.end <= options.start ||
      options.stepSeconds <= 0 ||
      options.grazeCosine < 0 ||
      options.grazeCosine > 1
    )
      throw new Error("Invalid contact interval, step or grazing threshold.");
    if (
      !Number.isInteger(options.refinementSteps) ||
      options.refinementSteps < 0 ||
      options.refinementSteps > 24 ||
      !Number.isSafeInteger(options.maximumCaptures) ||
      options.maximumCaptures < 2
    )
      throw new Error("Invalid contact refinement or capture budget.");
    if (
      options.stopAt !== undefined &&
      options.stopAt !== "last-clear" &&
      options.stopAt !== "first-witness"
    )
      throw new Error(
        "Contact stop policy must be last-clear or first-witness.",
      );
  }
  /** Verify the fresh witness capture retains every original participant without selecting or exempting pairs. */
  function validatePopulation(
    frame: Frame,
    original: Frame,
    participants: Receipt["participants"],
  ): void {
    const attacks: Map<string, Attack> = new Map(
      frame.attacks.map((attack: Attack): [string, Attack] => [
        attack.id,
        attack,
      ]),
    );
    const receivers: Map<string, Receiver> = new Map(
      frame.receivers.map((receiver: Receiver): [string, Receiver] => [
        receiver.id,
        receiver,
      ]),
    );
    if (
      attacks.size !== frame.attacks.length ||
      receivers.size !== frame.receivers.length ||
      attacks.size !== participants.attacks.length ||
      receivers.size !== participants.receivers.length ||
      participants.attacks.some(
        (attack: Receipt["participants"]["attacks"][number]): boolean =>
          (attacks.get(attack.id)?.role ??
            (attacks.has(attack.id) ? "strike" : undefined)) !== attack.role,
      ) ||
      participants.receivers.some(
        (receiver: Receipt["participants"]["receivers"][number]): boolean =>
          receivers.get(receiver.id)?.relation !== receiver.relation,
      )
    )
      throw new Error(
        "Witness capture must retain the original contact participants and relations.",
      );
    for (const attack of original.attacks)
      validateWitnessMesh(attacks.get(attack.id)!.mesh, attack.mesh);
    for (const receiver of original.receivers)
      validateWitnessMesh(receivers.get(receiver.id)!.mesh, receiver.mesh);
  }
  /** Keep the established finite-coordinate and fixed-addressing premise on the extra capture without running another contact query. */
  function validateWitnessMesh(
    mesh: IAutoMovieMesh,
    original: IAutoMovieMesh,
  ): void {
    if (
      mesh.positions.length !== original.positions.length ||
      (mesh.indices === null) !== (original.indices === null) ||
      mesh.indices?.length !== original.indices?.length
    )
      throw new Error(
        "Witness capture must retain finite vertices and original contact topology.",
      );
    for (let index: number = 0; index < mesh.positions.length; index++)
      if (!Number.isFinite(mesh.positions[index]))
        throw new Error(
          "Witness capture must retain finite vertices and original contact topology.",
        );
    for (let index: number = 0; index < (mesh.indices?.length ?? 0); index++)
      if (mesh.indices![index] !== original.indices![index])
        throw new Error(
          "Witness capture must retain finite vertices and original contact topology.",
        );
  }
  /** Refuse empty participant lists and nonfinite auxiliary actual points. */
  function validateFrame(frame: Frame): void {
    if (!frame.attacks.length || !frame.receivers.length)
      throw new Error(
        "Contact capture requires explicit nonempty attack and receiver lists.",
      );
    for (const attack of frame.attacks)
      for (const point of attack.points ?? [])
        if (point.length !== 3 || !point.every(Number.isFinite))
          throw new Error(
            "Actual contact points must be finite world-metre triples.",
          );
  }
}
