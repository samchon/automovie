import type { IStudentProfile } from "./IStudentProfile";
import { studentParameters } from "./studentParameters";

/**
 * The twelve anonymous supporting players of the practice match as data,
 * keyed by their authoring ids, each with the stature, build, hair and skin
 * of the practice-teams table and the riding state of the uniform. Builds
 * are tapes only where the table states one (broad, heavy, slight);
 * everything else is Human's survey default for the stature and sex.
 *
 * ```ts
 * practicePlayers["G-K"].stature; // 1.84
 * ```
 *
 * @evidence docs/body/settings/crowds/practice-teams.md#players Every row of the table.
 * @evidence docs/body/settings/crowds/practice-teams.md#zones Slytherin defends the west hoops, Gryffindor the east.
 * @evidence contracts/development/entities.md#settings-realization Every value is a fact of the table; masses follow the builds.
 * @evidence contracts/development/common.md#meaningful-documentation States what the table supplies and what Human defaults.
 */
export const practicePlayers: Readonly<Record<string, IStudentProfile>> =
  Object.freeze(
    Object.fromEntries(
      (
        [
          ["S-C1", "slytherin", false, 1.8, 70, 0x2b1d14, "short", 0xf0d2bd, { chest: 0.96, shoulders: 0.45 }],
          ["S-C2", "slytherin", true, 1.65, 52, 0x101010, "tail-high", 0x8d5a3b, { waist: 0.64 }],
          ["S-C3", "slytherin", false, 1.72, 68, 0xd9c38f, "short", 0xf0d2bd, { waist: 0.84 }],
          ["S-B1", "slytherin", false, 1.83, 82, 0x1c1814, "shaved", 0xd5b08c, { chest: 1.02, waist: 0.88 }],
          ["S-B2", "slytherin", false, 1.78, 72, 0x8a6a4a, "short", 0xeccbb3, { chest: 0.96 }],
          ["S-K", "slytherin", false, 1.85, 70, 0x16110e, "curls", 0x5c3a26, {}],
          ["G-C1", "gryffindor", true, 1.7, 58, 0x16110e, "braids", 0x5c3a26, {}],
          ["G-C2", "gryffindor", true, 1.66, 50, 0xe6cf8f, "bob", 0xf0d2bd, { waist: 0.63 }],
          ["G-C3", "gryffindor", true, 1.68, 54, 0x6b4a30, "tail-low", 0xf0d2bd, {}],
          ["G-B1", "gryffindor", false, 1.8, 76, 0xb0471f, "short", 0xf3d3bf, { chest: 0.98, shoulders: 0.45 }],
          ["G-B2", "gryffindor", false, 1.8, 76, 0xb0471f, "short", 0xf3d3bf, { chest: 0.98, shoulders: 0.45 }],
          ["G-K", "gryffindor", false, 1.84, 66, 0xc0581f, "short-untidy", 0xf3d3bf, {}],
        ] as const
      ).map(
        ([id, house, female, stature, mass, hairColor, hair, skin, tapes]) => [
          id,
          Object.freeze<IStudentProfile>({
            id,
            name: id,
            parameters: studentParameters({ female, stature, ...tapes }),
            stature,
            mass,
            house,
            bottoms: female ? "skirt" : "trousers",
            skin,
            hairColor,
            hair,
            glasses: false,
            habits: [],
          }),
        ],
      ),
    ),
  );
