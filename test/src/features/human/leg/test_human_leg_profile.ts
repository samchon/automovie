import { assertHumanRows } from "../../internal/assertHumanRows";
import { HumanProfileRows } from "../../internal/HumanProfileRows";

/**
 * Every person's leg, cut square to the vertical every 2 mm from the crotch to
 * the lateral malleolus, runs the way a leg does: the thigh falls from its top
 * to the knee in one run, the girths and heights stand in the body's order, and
 * the least ankle girth lies above the malleoli.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's skin and cuts each leg horizontally, the section kept being the component that holds the bone axis. It reads the thigh's girth from the section below the crotch to 60 mm above the knee (the largest rise below its maximum), the heights of the hip joint, crotch, knee joint, ankle joint and floor, the margins between thigh, knee, calf and least ankle girths, the height of the least girth from the knee down to the lateral malleolus' height over that height, and whether knee and calf keep the order of their own tapes. It catches a second belly on the thigh, a crotch above the hip joint, a knee wider than the thigh, an ankle thicker than the calf, an ankle least at the malleoli themselves and a knee and calf that swap the order the person's inputs give them.
 * @evidence contracts/testing.md#independent-expectations The thigh's widest section is its top and the girth falls to the knee, each rise below the maximum within ISO 20685-1's 4 mm for small girths (Gray 1918; the vastus medialis swells only the knee's inner side). The heights and girths follow the body's order (ANSUR II: thigh 616 and 625, calf 373 and 392, least ankle 216 and 229 mm for women and men). The least ankle girth lies above the malleoli by the identity's own definition of the ankle circumference ("minimum horizontal ankle circumference above the malleoli"), at least two sections over `ankleHeight`. Knee and calf are not ordered in the population (calf over knee 0.966, SD 0.041, ANSUR 1988), so the skin keeps the order of the two tapes of the person where they differ by more than 4 mm. No construction constant or earlier output enters.
 * @evidence contracts/testing.md#distinguishing-cases All nine generated people, both legs, slender and heavy, short and tall. The leg's anatomy test owns the tapes at their sites and the bone inside the skin, the leg's curve test the chain's soundness; the pieces and seams of the leg wait for the region's announcement.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_leg_profile`, reading each person's rows once from a `Singleton` per person, with no renderer, browser or GPU.
 */
export function test_human_leg_profile(): void {
  assertHumanRows("leg profile", HumanProfileRows.leg);
}
