import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

/**
 * Named opposing bony surfaces of one anatomical articulation.
 *
 * These references are generated relationships, not coordinates a document
 * author positions. Side is shared by both surfaces; a hip refers to the
 * coxal acetabulum and the same-side femoral head, a knee to the femoral and
 * tibial surfaces, and a shoulder to scapula/humerus.
 * `surfaceA` and `surfaceB` identify the pair without asserting a universal
 * proximal/distal order for midline and shoulder joints. The ankle mortise
 * separately names tibia and fibula against talus, with a third surface.
 * A rig transform does
 * not establish cartilage thickness, joint fit or a valid range of motion.
 * The scapulothoracic interface is a sliding contact, typed separately.
 * @author Samchon
 */
export type IAutoMovieHumanBodyArticulation<Side extends AutoMovieHumanBodySide> =
  | {
      readonly joint: "sacroiliac";
      readonly surfaceA: { readonly structure: "sacrum"; readonly site: "auricularSurface" };
      readonly surfaceB: { readonly structure: `${Side}CoxalBone`; readonly site: "auricularSurface" };
    }
  | {
      readonly joint: "hip";
      readonly surfaceA: { readonly structure: `${Side}CoxalBone`; readonly site: "acetabulum" };
      readonly surfaceB: { readonly structure: `${Side}Femur`; readonly site: "articularHead" };
    }
  | {
      readonly joint: "tibiofemoral";
      readonly surfaceA: { readonly structure: `${Side}Femur`; readonly site: "distalCondyles" };
      readonly surfaceB: { readonly structure: `${Side}Tibia`; readonly site: "tibialPlateau" };
    }
  | {
      readonly joint: "patellofemoral";
      readonly surfaceA: { readonly structure: `${Side}Femur`; readonly site: "patellarGroove" };
      readonly surfaceB: { readonly structure: `${Side}Patella`; readonly site: "posteriorArticularSurface" };
    }
  | {
      readonly joint: "talocrural";
      readonly surfaceA: { readonly structure: `${Side}Tibia`; readonly site: "distalPlafondAndMedialMalleolus" };
      readonly surfaceB: { readonly structure: `${Side}Fibula`; readonly site: "lateralMalleolus" };
      readonly surfaceC: { readonly structure: `${Side}Talus`; readonly site: "trochlea" };
    }
  | {
      readonly joint: "subtalar";
      readonly surfaceA: { readonly structure: `${Side}Talus`; readonly site: "inferiorFacet" };
      readonly surfaceB: { readonly structure: `${Side}Calcaneus`; readonly site: "superiorFacet" };
    }
  | {
      readonly joint: "sternoclavicular";
      readonly surfaceA: { readonly structure: "sternum"; readonly site: "clavicularNotch" };
      readonly surfaceB: { readonly structure: `${Side}Clavicle`; readonly site: "sternalEnd" };
    }
  | {
      readonly joint: "acromioclavicular";
      readonly surfaceA: { readonly structure: `${Side}Scapula`; readonly site: "acromion" };
      readonly surfaceB: { readonly structure: `${Side}Clavicle`; readonly site: "acromialEnd" };
    }
  | {
      readonly joint: "glenohumeral";
      readonly surfaceA: { readonly structure: `${Side}Scapula`; readonly site: "glenoid" };
      readonly surfaceB: { readonly structure: `${Side}Humerus`; readonly site: "articularHead" };
    }
  | {
      readonly joint: "humeroulnar";
      readonly surfaceA: { readonly structure: `${Side}Humerus`; readonly site: "trochlea" };
      readonly surfaceB: { readonly structure: `${Side}Ulna`; readonly site: "trochlearNotch" };
    }
  | {
      readonly joint: "humeroradial";
      readonly surfaceA: { readonly structure: `${Side}Humerus`; readonly site: "capitulum" };
      readonly surfaceB: { readonly structure: `${Side}Radius`; readonly site: "radialHead" };
    }
  | {
      readonly joint: "distalRadioulnar";
      readonly surfaceA: { readonly structure: `${Side}Radius`; readonly site: "ulnarNotch" };
      readonly surfaceB: { readonly structure: `${Side}Ulna`; readonly site: "ulnarHead" };
    }
  | {
      readonly joint: "radiocarpal";
      readonly surfaceA: { readonly structure: `${Side}Radius`; readonly site: "distalArticularSurface" };
      readonly surfaceB: { readonly structure: `${Side}Carpus`; readonly site: "proximalRow" };
    };
