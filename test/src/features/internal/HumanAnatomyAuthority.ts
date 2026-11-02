import type { HumanPoseStrain } from "./HumanPoseStrain";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";

/** Distinct evidence authorities; a model goal never supplies clinical evidence. */
export namespace HumanAnatomyAuthority {
  /** What the observed number establishes, independently of whether it passes. */
  export type Authority = "model-identity" | "observed-anatomy" | "clinical-identity";

  /** Explicit availability prevents missing evidence being counted as success. */
  export type Status = "measured" | "unavailable";

  /** One acceptance result with an auditable evidence identity. */
  export interface IRow {
    /** Person label, never a generation selector. */
    person: string;
    /** Measurement and its precise site or operation. */
    site: string;
    /** Measured number, NaN when the required evidence is unavailable. */
    value: number;
    /** Original least acceptable value. */
    low: number;
    /** Original greatest acceptable value. */
    high: number;
    /** Physical unit. */
    unit: string;
    /** The claim this result is allowed to support. */
    authority: Authority;
    /** Whether an independent reading exists. */
    status: Status;
    /** Missing provenance, landmark or pose; never a substitute for failure. */
    reason?: string;
    /** Complete face scan and worst actual skin triangle; this evidence never changes acceptance bounds. */
    triangleStrain?: HumanPoseStrain.IOutput;
  }

  /** Local raw shape rows acquire an explicit observed-anatomy default on exit. */
  export type IInput = Omit<IRow, "authority" | "status"> & Partial<Pick<IRow, "authority" | "status">>;

  /** Assign explicit metadata without changing any measured value or limit. */
  export function finish(rows: readonly IInput[]): IRow[] {
    return rows.map((row: IInput): IRow => {
      const status: Status = row.status ?? (Number.isFinite(row.value) ? "measured" : "unavailable");
      return { ...row, authority: row.authority ?? "observed-anatomy", status, reason: row.reason ?? (status === "unavailable" ? "The final-skin reader could not establish a finite result for this declared site and operation." : undefined) };
    });
  }

  /** A finite, available reading must meet both unchanged bounds. */
  export function passes(row: IRow): boolean {
    return row.status === "measured" && Number.isFinite(row.value) && row.value >= row.low && row.value <= row.high;
  }

  /** Keep original clinical expectations visible when their reader is unestablished. */
  export function unavailable(person: string, site: string, input: number, tolerance: number, reason: string): IRow {
    return { person, site, value: NaN, low: input - tolerance, high: input + tolerance, unit: "mm", authority: "clinical-identity", status: "unavailable", reason };
  }

  /**
   * Retain the required clinical identity rows alongside model-course rows.
   * Current native body courses have no established clinical mapping, and
   * animation origins cannot stand in for unobserved palpable landmarks.
   * No numerical input or error bound is modified here.
   */
  export function requirements(region: "trunk" | "arm" | "leg" | "hand" | "head", person: string, params: IAutoMovieHumanParameters): IRow[] {
    const rows: IRow[] = [];
    const controls: IAutoMovieHumanParameters["body"]["controls"] = params.body.controls;
    const add: (site: string, input: number | null, tolerance: number, reason: string) => void = (site: string, input: number | null, tolerance: number, reason: string): void => {
      if (input !== null) rows.push(unavailable(person, site, input, tolerance, reason));
    };
    const native: string = "The authored native course has not been registered to this clinical protocol; a passing model-course goal cannot establish that correspondence.";
    if (region === "trunk") {
      add("clinical chest/bust girth at the protocol's chest point", controls.chest.value, 9, native + " Bust-point and axilla chest protocols remain distinct.");
      add("clinical underbust girth at the inframammary fold", controls.underbust.value, 9, native + " A model lower-bust guide is not an independently identified inframammary fold.");
      add("clinical natural-waist girth", controls.waist.value, 9, native + " A fixed model waist address does not prove the final least-waist site.");
      add("clinical high-hip girth midway natural waist to hip", controls.highHip.value, 9, native);
      add("clinical hip girth at buttock prominence", controls.hip.value, 9, native);
      add("clinical neck girth at the declared published site", controls.neck.value, 4, native + " A handover ring is neither a palpable infrathyroid landmark nor proof of the whole-neck minimum.");
      add("clinical neck-base girth over the required anatomical contacts", controls.neckBase.value, 4, native + " C7, jugular-notch and side-neck correspondence is not established by a model four-contact course.");
    }
    if (region === "arm") for (const side of ["left", "right"] as const) {
      add(`${side} clinical upper-arm girth at the published midpoint and pose`, controls.bicep.value, 4, native + " The attachment arc centroid is not an independently identified acromion; the elbow origin is not proven olecranon.");
      add(`${side} clinical elbow girth at olecranon in the declared pose`, controls.elbow.value, 4, native + " Neither olecranon nor the clinical pose transformation is independently established.");
      add(`${side} clinical relaxed forearm maximum`, controls.forearm.value, 4, native + " The actual generated turn exit bounds a model muscle region, not an independently established clinical relaxed-forearm domain.");
      add(`${side} clinical wrist girth over radial stylion`, controls.wrist.value, 4, native + " The Hand animation origin is a crease centre, not WJC or a palpated radial stylion.");
    }
    if (region === "leg") for (const side of ["left", "right"] as const) {
      add(`${side} clinical thigh girth at the published post-crotch site`, controls.thigh.value, 9, native + " The declared model upper-thigh window is not independently registered to the clinical course.");
      add(`${side} clinical knee girth at mid-patella`, controls.knee.value, 4, native + " The knee-joint centre is not an independently identified patellar landmark.");
      add(`${side} clinical calf maximum`, controls.calf.value, 4, native + " Generated frame transitions bound a model domain; independent anatomical calf-region correspondence remains unestablished.");
    }
    if (region === "hand") for (const side of ["left", "right"] as const) {
      const hand: NonNullable<IAutoMovieHumanParameters["extremities"]>["hands"] = params.extremities?.hands;
      const own: NonNullable<typeof hand>["left"] | undefined = hand?.[side];
      if (own !== undefined) {
        add(`${side} clinical hand length from radial stylion`, own.handLength, 1, "Reference remeasurement used a thinnest-wrist proxy because no reliable styloid prominence was visible. The generated crease-centre origin does not establish radial stylion.");
        add(`${side} clinical palm length from radial stylion to the middle-finger crease`, own.palmLength, 1, "Both a true radial-stylion origin and the equivalence of shared-web separation to the specified surface crease remain unestablished.");
        add(`${side} clinical hand breadth at metacarpal heads II and V`, own.handBreadth, 1, "Current animation-joint guides locate the model section; independent metacarpal-head anatomical landmark correspondence remains unestablished.");
        add(`${side} clinical thumb length from its MCP crease`, own.thumbLength, 1, "The thumb MCP animation origin does not independently identify the skin crease required by the input definition.");
      }
      add(`${side} clinical hand circumference at metacarpal heads II and V`, controls.handCircumference.value, 4, native);
    }
    if (region === "head") {
      add("clinical face height, nasion to gnathion", params.head.faceHeight, 1, "Historical extraction used a sellion-like root minimum and an unestablished chin address. A shared model seam at eye-centre height and a new intrinsic mandibular ridge do not establish the superior palpebral sulcus or traditional clinical nasion/gnathion correspondence.");
      add("clinical nasal height, nasion to subnasale", params.head.face.nose.height, 1, "Historical input extraction used a nasal-root minimum. The current model also places its root at eye-centre height; neither equality establishes FaceBase nasion or the superior palpebral sulcus, whose physical owner has not been independently established.");
      add("clinical nasal width, alare to alare", params.head.face.nose.width, 1, "The historical attachment-groove proxy and retained reference value have not been certified to lateral ala extrema. The new physical alar owner remains separately observed geometry until final composition and definition-correct reference correspondence are established.");
      add("clinical face width, zygion to zygion", params.head.faceWidth, 1, "A widest-skin band does not independently establish the bony zygion landmarks, and these reference inputs retained earlier values for lack of reliable source landmarks.");
      add("clinical mandibular width, gonion to gonion", params.head.mandibularWidth, 1, "A widest lower-face band does not independently establish gonion, and these reference inputs retained earlier values for lack of reliable source landmarks.");
    }
    return rows;
  }
}
