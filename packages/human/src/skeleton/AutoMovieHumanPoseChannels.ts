import type { AutoMovieHumanRigControls as Controls } from "./AutoMovieHumanRigControls";
/** Existing head, neck, shoulder and thumb rows preserve literal joint identities. */
const INITIAL = [
    ["head.eyes.<side>.vertical", "<side>Eye", "flexion", 1, -30, 30],
    ["head.eyes.<side>.horizontal", "<side>Eye", "twist", 1, -45, 45],
    ["head.jaw.opening", "jaw", "flexion", 1, 0, 52.9],
    ["head.jaw.protrusion", "jaw", "forward", 1, 0, 8.5],
    ["head.jaw.lateralExcursion", "jaw", "lateral", 1, -10.35, 10.35],
    ["neck.atlantoOccipital.flexion", "head", "flexion", 1, -15, 10],
    ["neck.atlantoOccipital.lateralFlexion", "head", "abduction", -1, -5, 5],
    ["neck.atlantoAxial.rotation", "atlas", "twist", 1, -40, 40],
    ["neck.cervical.flexion", "neck", "flexion", 1, -30, 35],
    ["neck.cervical.lateralFlexion", "neck", "abduction", -1, -40, 40],
    ["neck.cervical.rotation", "neck", "twist", 1, -20, 20],
    [
      "arms.<side>.shoulderGirdle.elevation",
      "<side>Shoulder",
      "abduction",
      1,
      -10,
      45,
    ],
    [
      "arms.<side>.shoulderGirdle.upwardRotation",
      "<side>Scapula",
      "flexion",
      1,
      -10,
      60,
    ],
    [
      "arms.<side>.shoulderGirdle.protraction",
      "<side>Shoulder",
      "flexion",
      1,
      -15,
      15,
    ],
    [
      "arms.<side>.shoulder.flexion",
      "<side>UpperArm",
      "flexion",
      1,
      -60,
      170.4,
    ],
    [
      "arms.<side>.shoulder.abduction",
      "<side>UpperArm",
      "abduction",
      1,
      -40,
      180,
    ],
    ["arms.<side>.shoulder.rotation", "<side>UpperArm", "twist", 1, -70, 90],
    ["arms.<side>.elbow.flexion", "<side>LowerArm", "flexion", 1, -2.75, 147.3],
    [
      "arms.<side>.forearm.pronation",
      "<side>LowerArm",
      "twist",
      1,
      -87.8,
      79.45,
    ],
    ["arms.<side>.wrist.flexion", "<side>Hand", "flexion", 1, -70, 80],
    [
      "arms.<side>.wrist.radialDeviation",
      "<side>Hand",
      "abduction",
      1,
      -30,
      20,
    ],
    [
      "arms.<side>.hand.thumb.cmcFlexion",
      "<side>ThumbMetacarpal",
      "flexion",
      1,
      -20,
      15,
    ],
    [
      "arms.<side>.hand.thumb.cmcAbduction",
      "<side>ThumbMetacarpal",
      "abduction",
      1,
      0,
      60,
    ],
    [
      "arms.<side>.hand.thumb.cmcOpposition",
      "<side>ThumbMetacarpal",
      "twist",
      1,
      0,
      45,
    ],
    [
      "arms.<side>.hand.thumb.mcpFlexion",
      "<side>ThumbProximal",
      "flexion",
      1,
      0,
      50,
    ],
    [
      "arms.<side>.hand.thumb.ipFlexion",
      "<side>ThumbDistal",
      "flexion",
      1,
      0,
      80,
    ],
  ] as const satisfies readonly (readonly [Controls.ChannelTemplate, string, "flexion"|"abduction"|"twist"|"forward"|"lateral", 1|-1, number, number])[];
/** Existing finger construction inputs are shared by runtime rows and their joint types. */
const FINGERS = [
    ["index", "Index"],
    ["middle", "Middle"],
    ["ring", "Ring"],
    ["little", "Little"],
  ] as const satisfies readonly (readonly [string,string])[];
/** Existing axial, pelvis, leg and foot rows preserve literal joint identities. */
const AXIAL = [["spine.thoracic.flexion", "chest", "flexion", 1, -10, 30],
    ["spine.thoracic.lateralFlexion", "chest", "abduction", -1, -15, 15],
    ["spine.thoracic.rotation", "chest", "twist", 1, -40, 40],
    ["spine.lumbar.flexion", "spine", "flexion", 1, -15, 50],
    ["spine.lumbar.lateralFlexion", "spine", "abduction", -1, -20, 20],
    ["spine.lumbar.rotation", "spine", "twist", 1, -5, 5],
    ["pelvis.tilt", "hips", "flexion", 1, -90, 90],
    ["pelvis.obliquity", "hips", "abduction", 1, -90, 90],
    ["pelvis.rotation", "hips", "twist", 1, -180, 180],
    ["legs.<side>.hip.flexion", "<side>UpperLeg", "flexion", 1, -17.75, 132.1],
    ["legs.<side>.hip.abduction", "<side>UpperLeg", "abduction", 1, -20, 40],
    ["legs.<side>.hip.rotation", "<side>UpperLeg", "twist", 1, -45, 45],
    ["legs.<side>.knee.flexion", "<side>LowerLeg", "flexion", 1, -1.3, 139.8],
    ["legs.<side>.knee.rotation", "<side>LowerLeg", "twist", 1, -25, 35],
    [
      "legs.<side>.ankle.dorsiflexion",
      "<side>Foot",
      "flexion",
      1,
      -58.35,
      13.25,
    ],
    [
      "legs.<side>.foot.subtalarInversion",
      "<side>Subtalar",
      "abduction",
      -1,
      -5,
      5,
    ],
    [
      "legs.<side>.foot.midfootSupination",
      "<side>Midfoot",
      "abduction",
      -1,
      -15,
      35,
    ],
    [
      "legs.<side>.foot.hallux.mtpFlexion",
      "<side>HalluxProximal",
      "flexion",
      1,
      -70,
      45,
    ],
    [
      "legs.<side>.foot.hallux.mtpAbduction",
      "<side>HalluxProximal",
      "abduction",
      1,
      -15,
      15,
    ],
    [
      "legs.<side>.foot.hallux.ipFlexion",
      "<side>HalluxDistal",
      "flexion",
      1,
      0,
      90,
    ]] as const satisfies readonly (readonly [Controls.ChannelTemplate, string, "flexion"|"abduction"|"twist"|"forward"|"lateral", 1|-1, number, number])[];
/** Existing toe construction inputs are shared by runtime rows and their joint types. */
const TOES = [
    ["second", 2],
    ["third", 3],
    ["fourth", 4],
    ["fifth", 5],
  ] as const satisfies readonly (readonly [string,number])[];
/**
 * Every degree of freedom of `IAutoMovieHumanPose`, top to bottom, with the
 * stickman bone and axis it turns and its range of motion.
 *
 * Each row is `[path, bone, axis, sign, min, max]`. `path` is the field's
 * dotted path in the pose and `bone` the stickman bone; `<side>` stands for
 * `left` or `right` in both. `axis` names the bone's clinical axis (see
 * `AutoMovieHumanSkeleton`), or a jaw translation (`forward`, `lateral`);
 * `sign` maps the field's positive motion onto that axis. `min` and `max` are
 * the same range of motion as the field's type tags, in degrees, or
 * millimetres for the jaw; the field comments and
 * `docs/anatomy/joint-range.md` give their sources.
 */

export const AutoMovieHumanPoseChannels: readonly Channel[] = ((): Channel[] => {
  const rows: Channel[] = [...INITIAL];
  for (const [key, bone] of FINGERS)
    rows.push(
      [
        `arms.<side>.hand.${key}.mcpFlexion`,
        `<side>${bone}Proximal`,
        "flexion",
        1,
        0,
        80,
      ],
      [
        `arms.<side>.hand.${key}.mcpAbduction`,
        `<side>${bone}Proximal`,
        "abduction",
        1,
        -20,
        20,
      ],
      [
        `arms.<side>.hand.${key}.pipFlexion`,
        `<side>${bone}Intermediate`,
        "flexion",
        1,
        0,
        90,
      ],
      [
        `arms.<side>.hand.${key}.dipFlexion`,
        `<side>${bone}Distal`,
        "flexion",
        1,
        0,
        65,
      ],
    );
  rows.push(...AXIAL);
  for (const [key, n] of TOES)
    rows.push(
      [
        `legs.<side>.foot.${key}.mtpFlexion`,
        `<side>Toe${n}Proximal`,
        "flexion",
        1,
        -40,
        40,
      ],
      [
        `legs.<side>.foot.${key}.mtpAbduction`,
        `<side>Toe${n}Proximal`,
        "abduction",
        1,
        -10,
        10,
      ],
      [
        `legs.<side>.foot.${key}.pipFlexion`,
        `<side>Toe${n}Intermediate`,
        "flexion",
        1,
        0,
        35,
      ],
      [
        `legs.<side>.foot.${key}.dipFlexion`,
        `<side>Toe${n}Distal`,
        "flexion",
        1,
        0,
        60,
      ],
    );
  return rows;
})();
/** Canonical generating inputs supply all finger and toe joint spellings. */
type GeneratedJoint = `<side>${(typeof FINGERS)[number][1]}${"Proximal"|"Intermediate"|"Distal"}` | `<side>Toe${(typeof TOES)[number][1]}${"Proximal"|"Intermediate"|"Distal"}`;
/** The canonical table has finite paths/joints, clinical signs and sourced ranges. */
type Channel = readonly [path:Controls.ChannelTemplate,bone:(typeof INITIAL)[number][1]|(typeof AXIAL)[number][1]|GeneratedJoint,axis:"flexion"|"abduction"|"twist"|"forward"|"lateral",sign:1|-1,min:number,max:number];