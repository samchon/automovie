import { IAutoMovieEnvironmentContext } from "../analysis/IAutoMovieEnvironmentContext";
import { IAutoMovieDeliveryCrop } from "../cinematics/IAutoMovieDeliveryCrop";
import { IAutoMovieRenderBudget } from "../render/IAutoMovieRenderBudget";
import { IAutoMovieProductionLighting } from "../scene/IAutoMovieProductionLighting";
import type { IAutoMovieAcousticResponseProfile } from "./IAutoMovieAcousticResponseProfile";
import { IAutoMovieCaptionReadabilityProfile } from "./IAutoMovieCaptionReadabilityProfile";
import type { IAutoMovieExternalMotionAdoption } from "./IAutoMovieExternalMotionAdoption";
import { IAutoMovieProductionDeliverable } from "./IAutoMovieProductionDeliverable";
import { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";
import { IAutoMovieProductionMixedVisualDeliveryPolicy } from "./IAutoMovieProductionMixedVisualDeliveryPolicy";
import type { IAutoMovieProductionTtsReceipt } from "./IAutoMovieProductionTtsReceipt";
import { IAutoMovieProductionVisualDeliveryLane } from "./IAutoMovieProductionVisualDeliveryLane";
import type { IAutoMovieSoundPropagationProfile } from "./IAutoMovieSoundPropagationProfile";
import { IAutoMovieStoryClock } from "./IAutoMovieStoryClock";
import type { IAutoMovieRepaintExecutionPolicy } from "./capture/IAutoMovieRepaintExecutionPolicy";
import type { IAutoMovieRepaintGeneratorAdoption } from "./capture/IAutoMovieRepaintGeneratorAdoption";
import type { IAutoMovieRepaintParameters } from "./capture/IAutoMovieRepaintParameters";
import type { IAutoMovieRepaintReferenceInput } from "./capture/IAutoMovieRepaintReferenceInput";
import type { IAutoMovieRepaintRequestEvidence } from "./capture/IAutoMovieRepaintRequestEvidence";

/**
 * Production-owned frame, story, appearance, sound and delivery decisions consumed by source compilation and final validation.
 *
 * @evidence contracts/common.md#principled-implementation The production design fixes shared invariants and explicitly adopted profiles before shot source executes; validation checks raster and rational frame clocks, delivery populations and optional policy identities, and the acquired design bytes participate in compile freshness.
 * @evidence contracts/common.md#clear-and-simple-design Related optional sound, repaint, tier and simulation decisions stay grouped with the global frame and art contract; their implementations and per-shot performance remain in the responsible engine and host packages.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional physical and review policies supply no invented thresholds or providers; legacy delivery and tier defaults are documented, while external motion, repaint and moving-boundary choices require explicit production declarations.
 * @evidence contracts/common.md#meaningful-documentation Defines production identity, shared units and limits, optional-state effects, policy ownership, explicit adoptions and the separation between deterministic technical truth and rendition delivery.
 * @author Samchon
 */
export interface IAutoMovieProductionDesign {
  /** Non-blank stable production id; film-level acceptance targets use it. */
  id: string;

  /** Non-blank human-facing title. */
  title: string;

  /** Non-blank one-sentence narrative promise. */
  logline: string;

  /**
   * Finite intended finished runtime in seconds, strictly above zero and on the production frame clock.
   */
  targetRuntimeSeconds: number;

  /**
   * Legacy all-one-lane shorthand or an explicit mixed film delivery.
   *
   * Deterministic delivery uses builder/render output directly. Repainted delivery keeps that output as technical truth and additionally requires a required feature plus a receipt-bound rendition review for every delivered shot.
   */
  visualDelivery: "deterministic" | "repainted" | "mixed";

  /** Ordered explicit occurrence lanes, required exactly for mixed delivery. */
  visualDeliveryLanes?: IAutoMovieProductionVisualDeliveryLane[];

  /** Versioned crossing policy, required exactly when explicit lanes cross. */
  mixedVisualDeliveryPolicy?: IAutoMovieProductionMixedVisualDeliveryPolicy;

  /**
   * Story clock every pinned shot and cross-shot criterion is measured on.
   *
   * Omitted means the production asserts nothing about story time; shots may then carry no pin and no cross-shot criterion is admissible.
   */
  storyClock?: IAutoMovieStoryClock;

  /**
   * The production's own light sources and their motion on the story clock.
   *
   * Where {@link storyClock} says when a shot happens, this says what the light is doing then. A shot's `lightMotions` is the right unit for a light that belongs to the moment and the wrong unit for one that belongs to the production: stated per shot, every shot restages the same source and nothing relates the light in the first shot to the light in the last. A production that runs across a stretch of story could not say that its light travelled over that stretch, whatever the subject.
   *
   * Declared once here, each shot reads the state at its own story moment ({@link IAutoMovieShotStoryTime}); a shot still states its own local light on top. Optional and purely additive: a production declaring none is unaffected in every respect, and so is any shot carrying no story pin.
   */
  lighting?: IAutoMovieProductionLighting;

  /**
   * Render cost limits this production holds its own artifacts to, by tier.
   *
   * The engine ships no preset tiers. A budget is a claim about what this production is willing to draw, which nobody else can make for it, so a production that declares none is measured and reported without a verdict rather than judged against a number it never chose.
   *
   * Each entry names its own `tier`, such as `review` or `delivery`, and a render job checks an artifact against the one it targets. Optional and purely additive: a production declaring none behaves exactly as it did before the field existed.
   */
  renderBudgets?: IAutoMovieRenderBudget[];

  /**
   * User-selected external motion adoptions, unique by id and clip.
   *
   * The builder validates and applies these records but does not choose an asset, take, actor, adoption mode, or retarget mapping. Omission preserves the legacy source-computed motion path.
   */
  externalMotions?: IAutoMovieExternalMotionAdoption[];

  /**
   * Production-owned caption readability profiles, unique by language.
   *
   * Omission provides no implicit thresholds: measurements may be reported, but their verdict is `not-run` and existing compiled output is unchanged.
   */
  captionReadabilityProfiles?: IAutoMovieCaptionReadabilityProfile[];

  /**
   * Optional production-owned propagation, room-response, and dialogue choices.
   *
   * Omitting propagation or the room response preserves the legacy dry path. The engine does not choose a physical profile, external provider, adopted asset, or room mapping.
   *
   * The same record carries the two dialogue decisions nothing else can make for the production: which generator it adopted under which reviewed rights, and which compiled actor each screenplay speaker performs through.
   */
  sound?: {
    /** Selected direct-path propagation model. */
    propagation?: IAutoMovieSoundPropagationProfile;

    /** Selected bounded derived or externally adopted room-response source. */
    acousticResponse?: IAutoMovieAcousticResponseProfile;

    /**
     * The exact dialogue generator this production adopted, if any.
     *
     * The choice of a voice is a delivery decision the production makes and answers for, so it is stated here beside the rest of the design rather than in a runtime declaration that no reviewed document owns. The record carries no credential: it names where the generator came from, which rights and terms were reviewed on which calendar day, the authored cost basis, and why this production needs synthesized dialogue at all.
     *
     * The host runtime narrows this to the adapter it actually implements and refuses a provider, model revision, dtype, or device it cannot produce; this contract stays provider-neutral so the decision is portable. Omission means the production synthesizes no dialogue.
     */
    dialogueSynthesis?: {
      /** Non-blank generator identity the host runtime must implement. */
      provider: string;

      /** Non-blank exact model repository or local tool identity. */
      model: string;

      /** Non-blank immutable model revision. */
      modelRevision: string;

      /** Non-blank weight quantization the adopted revision was taken at. */
      dtype: string;

      /** Non-blank execution device the adoption was reviewed for. */
      device: string;

      /** Non-blank voice identity inside that model revision. */
      voice: string;

      /** Finite speaking rate strictly above zero. */
      speed: number;

      /** Reviewed source, rights, terms date, cost, and consumer reason. */
      generatorProvenance: IAutoMovieProductionTtsReceipt["generatorProvenance"];
    };

    /**
     * Joins from a screenplay speaker identity to the compiled actor whose mouth performs that line.
     *
     * The screenplay names who speaks and source names the actor node, and nothing between them is inferable: cast order and a similar name are both wrong answers. Stating the join in the design is what lets the builder refuse a speaker with no line, a duplicate identity, and an actor absent from the shot the line lands in.
     *
     * A binding is for an audible identity with a mouth on screen. An off-screen narrator or machine voice still needs a settings owner and a screenplay source, but it has no actor to bind. Omission means the production binds no speaker to a mouth.
     */
    speakerBindings?: Array<{
      /** Non-blank speaker identity carried by the dialogue line. */
      speaker: string;

      /** Non-blank compiled actor node id that owns the mouth layer. */
      actor: string;
    }>;
  };

  /**
   * The proxy and final visual deliverables this production renders at.
   *
   * A tier is a delivery contract rather than a filename: the raster scale and the frame decimation say what the review pass and the final pass actually are, and a proxy that succeeded is not clearance for the final. Declaring both here keeps the pair addressable by the same design revision every other delivery decision is read from.
   *
   * Optional and purely additive: a production declaring none is rendered at the host's shipped review and delivery tiers, exactly as it was before the field existed.
   */
  renderTiers?: {
    /**
     * Review tier, which must be cheaper than the final one in at least one of its two axes. A proxy that reduces neither is refused rather than run.
     */
    proxy: {
      /** Stable tier identity used in slots, chunks, and publication paths. */
      kind: "proxy";

      /** Output raster multiplier in `(0, 1]`. */
      resolutionScale: number;

      /** Keep every Nth source frame; an integer from 1 through 16. */
      frameStep: number;
    };

    /** Delivery tier; `resolutionScale` and `frameStep` are exactly one. */
    final: {
      /** Stable tier identity used in slots, chunks, and publication paths. */
      kind: "final";

      /** Output raster multiplier; exactly one at the final tier. */
      resolutionScale: number;

      /** Source frame stride; exactly one at the final tier. */
      frameStep: number;
    };
  };

  /**
   * The appearance rendition this production adopted, and its exact requests.
   *
   * A repaint is a derived appearance over deterministic truth, so what it may do has to be decided before anything is drawn: which generator, on which execution boundary, under which bounded retry and cost policy, and with which exact prompt, seed, preservation strength, and role-specific references per shot. Holding that here means a request cannot appear as an ephemeral command-line override, and a changed request stales the compile that consumed it.
   *
   * The post-generation selection review is deliberately not part of this record: reviewing a candidate must not stale the deterministic render that produced it, so the host joins that observation by shot from its own control-plane sidecar. Omission means deterministic visual delivery.
   */
  repaint?: {
    /** Adopted runtime identity and reviewed rights for the generator. */
    generator: IAutoMovieRepaintGeneratorAdoption;

    /** Bounded attempts, timeouts, cost, backoff, and retryable failures. */
    executionPolicy: IAutoMovieRepaintExecutionPolicy;

    /** One immutable reviewed request per delivered shot, unique by shot. */
    requests: Array<{
      /** Authored shot id this request repaints. */
      shot: string;

      /** Prompt, seed, preservation strength, and optional scalar controls. */
      parameters: IAutoMovieRepaintParameters;

      /** At least one manifest-registered role-specific reference. */
      references: IAutoMovieRepaintReferenceInput[];

      /** Stable addresses of the owners this request answers to. */
      evidence: IAutoMovieRepaintRequestEvidence;
    }>;
  };

  /**
   * Soft-body domains this production admits to a live moving-boundary solve.
   *
   * A moving anchor or a body capsule makes a domain expensive in a way a static one is not, so which domains are worth that cost is a production decision rather than a solver default. The list is production-wide, so a domain may be absent from a shot that does not stage it; across every compiled shot, however, this set must equal the set of domains that actually declare a moving boundary, and list order is the stable subject budget order every shot shares.
   *
   * Omission admits none. That is correct for a production staging no moving-boundary domain, and refused for one that stages any.
   */
  simulation?: {
    /** Unique, non-blank, trimmed domain ids in stable budget order. */
    liveWearableSoftBodies: string[];
  };

  /**
   * Read-only site context every environmental analysis is measured against.
   *
   * Sun, sky, reference ground and neighbouring occluder masses are conditions a building is subject to, not parts of it. Declaring them here keeps that direction one-way: an analysis reads the context and the building, and neither the context nor a result it produces can become design.
   *
   * The builder refuses a context whose ids collide with the building's own elements, spaces or boundaries, because a shading mass sharing an id with a wall is a mass the building would appear to own. Optional and purely additive: a production declaring none runs no analysis and is otherwise unaffected.
   */
  environmentContext?: IAutoMovieEnvironmentContext;

  /** Deterministic frame clock and raster format. */
  frameFormat: {
    /**
     * Integer pixel width from 16 through 16,384. Width times height may not exceed 16,777,216 pixels, the exact-frame review capture ceiling.
     */
    width: number;

    /**
     * Integer pixel height from 16 through 16,384. Width times height may not exceed 16,777,216 pixels, the exact-frame review capture ceiling.
     */
    height: number;

    /** Finite frames per second, strictly above zero. */
    fps: number;

    /**
     * Exact frame rate when `fps` is fractional. Integer legacy rates use an equivalent denominator of one when this field is omitted.
     */
    frameRate?: IAutoMovieProductionFrameRate;

    /** Output color space. */
    colorSpace: "srgb";

    /**
     * Optional normalized delivery-gate window projected onto the full output raster. Omission and the complete `0,0,1,1` window are geometric no-ops.
     */
    crop?: IAutoMovieDeliveryCrop;
  };

  /** Bounded visual grammar rather than screenplay prose. */
  artDirection: {
    /** Foundation visual style. */
    style: "primitive-3d";

    /** Non-empty unique CSS-compatible palette colors. */
    palette: string[];

    /** Non-blank rules that keep important silhouettes legible. */
    silhouettePriority: string;

    /** Non-blank rules for conveying scale with primitive geometry. */
    scaleGrammar: string;
  };

  /** At least one output, with every deliverable id unique. */
  deliverables: IAutoMovieProductionDeliverable[];
}
