import type { IScene } from "../structures/IScene";
import { SceneBuild } from "./SceneBuild";

const { planned }: typeof SceneBuild = SceneBuild;

/**
 * The scenes the follow-up programme (#3503) plans, each with the issues it
 * waits on: crowds and troops (#3452), film props (#3468) and
 * the motion capabilities composition alone cannot express (#3414). Each
 * becomes a composed record when its pieces land.
 */
export const SCENES_PLANNED: readonly IScene[] = [
  planned(
    {
      id: "line-volley",
      title: "Line volley, elite against militia",
      summary:
        "A battalion marches in step to the drum, halts, makes ready, presents and fires: tight for the elite, ragged for the militia, five misfires chosen by the seed.",
      setting: "troops",
      needs: [3457, 3458, 3461, 3462, 3465, 3483, 3488, 3478, 3479, 3480],
    },
    {
      cast: "120 soldiers, an officer and a drummer; muskets",
      pieces:
        "ensemble, line formation, drum cadence, command track with drawn latency, make ready, present, fire",
    },
  ),
  planned(
    {
      id: "column-to-square",
      title: "Column deploys, square forms",
      summary:
        "A column deploys into line, the farther companies stepping off first; then it forms a square against cavalry with the front rank kneeling.",
      setting: "troops",
      needs: [3459, 3465],
    },
    {
      cast: "a battalion",
      pieces:
        "manoeuvres deploy and square, a kneeling front rank, presenting outward",
    },
  ),
  planned(
    {
      id: "cavalry-charge",
      title: "Cavalry squadron, walk to charge",
      summary:
        "A squadron of two ranks advances knee to knee at the walk, trot and canter, and charges with sabres; the line loosens through the gallop.",
      setting: "troops",
      needs: [3457, 3458, 3462, 3466, 3491, 3493, 3494],
    },
    {
      cast: "48 riders; horses, sabres",
      pieces:
        "a two-rank block on slot paths, a trumpet track, gait changes, the sabre carried over the ride",
    },
  ),
  planned(
    {
      id: "mob",
      title: "A mob running ragged",
      summary:
        "A rabble scatters from a threat through a street, each at their own speed and start, glancing back.",
      setting: "troops",
      needs: [3457, 3460, 3467],
    },
    {
      cast: "a rabble",
      pieces:
        "a scatter block, crowd steering from a threat point, glances back as a layer",
    },
  ),
  planned(
    {
      id: "street-carriage",
      title: "Street parting around a carriage",
      summary:
        "Two flows of pedestrians, many in twos and threes, part around a horse-drawn carriage and close behind it, turning their heads as it nears.",
      setting: "street",
      needs: [3460, 3467, 3495],
    },
    {
      cast: "two flows of pedestrians; a carriage and its horses",
      pieces: "a moving obstacle, crowd steering, a gaze layer",
    },
  ),
  planned(
    {
      id: "shot-in-square",
      title: "A shot in a square",
      summary:
        "A shot rings out in a crowded square and every member turns to it after their own reaction time.",
      setting: "street",
      needs: [3462, 3467, 3480],
    },
    {
      cast: "a crowd",
      pieces: "a report every member turns to with drawn latency",
    },
  ),
  planned(
    {
      id: "mounted-archery",
      title: "Mounted archery",
      summary:
        "A rider at a canter takes an arrow from the quiver, nocks, draws and looses; the arrow flies and strikes a target.",
      setting: "ride",
      needs: [3476, 3478, 3479, 3480, 3481, 3485, 3487, 3491, 3493, 3494],
    },
    {
      cast: "a rider; a horse, a horse bow, a quiver, arrows, a target",
      pieces: "nock, draw and loose over the ride, the arrow's flight and hit",
    },
  ),
  planned(
    {
      id: "cannon-crew",
      title: "Cannon crew",
      summary:
        "A crew sponges, loads, rams, primes, points and fires a field gun; the carriage recoils and the ball bounces through a column.",
      setting: "troops",
      needs: [3475, 3476, 3478, 3479, 3480, 3482, 3484, 3489, 3495, 3430],
    },
    {
      cast: "a gun crew; a field gun, its tools, round shot, a limber and horses",
      pieces:
        "sponge, load, ram, prime, point and fire as rows of a mutual join synchronised by cues; recoil on the carriage's track",
    },
  ),
  planned(
    {
      id: "saloon-gunfight",
      title: "Saloon gunfight",
      summary:
        "A gunman draws a revolver, cocks and fires; the man at the bar is hit and falls, and a stray shot breaks a bottle.",
      setting: "combat",
      needs: [3476, 3479, 3480, 3483, 3488, 3499],
    },
    {
      cast: "a gunman and a man at the bar; a revolver, a bottle",
      pieces:
        "cocking the hammer, a shot that launches, a knockdown from the hit, a bottle breaking into fragments",
    },
  ),
  planned(
    {
      id: "siege",
      title: "Siege",
      summary:
        "A trebuchet looses a stone against a wall that breaks; on the wall, crossbowmen span with stirrup and cranequin and shoot.",
      setting: "troops",
      needs: [3475, 3476, 3481, 3486, 3487, 3499],
    },
    {
      cast: "a trebuchet crew and crossbowmen; a trebuchet, crossbows, a wall",
      pieces:
        "the arm's own track, spanning and shooting as rows, a wall breaking",
    },
  ),
  planned(
    {
      id: "chariot",
      title: "Chariot archer",
      summary:
        "A charioteer drives two horses while an archer beside him draws and looses in the chariot's moving frame.",
      setting: "ride",
      needs: [3477, 3487, 3491, 3495],
    },
    {
      cast: "a driver and an archer; a chariot and two horses",
      pieces:
        "an assembly towed by a harness, a draw and loose aimed in the support's frame",
    },
  ),
  planned(
    {
      id: "rowing",
      title: "Rowing on a swell",
      summary: "Two rowers pull a rowboat over a seeded swell.",
      setting: "ride",
      needs: [3497],
    },
    {
      cast: "two rowers; a rowboat",
      pieces: "rowing on a boat that rides a seeded swell",
    },
  ),
  planned(
    {
      id: "throwing-weapons",
      title: "Throwing weapons",
      summary:
        "A javelin, a spear, a knife, a grenade, a stone and a sling, each thrown and flying to its mark.",
      setting: "combat",
      needs: [3478, 3479, 3482, 3490],
    },
    {
      cast: "four throwers; a javelin, a spear, a knife, a grenade, a stone, a sling",
      pieces: "throws that launch a prop, and its flight",
    },
  ),
  planned(
    {
      id: "breakaway",
      title: "Breakaway props",
      summary:
        "A chair broken over a back, a window shattered, a door kicked in.",
      setting: "combat",
      needs: [3480, 3499],
    },
    {
      cast: "three people; a chair, a window, a door",
      pieces: "fracture sets and fragments launched at a hit",
    },
  ),
  planned(
    {
      id: "knights",
      title: "Knights",
      summary:
        "Two knights in helmets, cuirasses and mail fight with longswords.",
      setting: "combat",
      needs: [3500],
    },
    {
      cast: "two knights; helmets, cuirasses, mail, longswords",
      pieces:
        "armour fitted to the body and worn on its bones, the longsword rows",
    },
  ),
  planned(
    {
      id: "dinner",
      title: "Dinner",
      summary: "Four diners at a lit table pass dishes, eat and drink.",
      setting: "everyday",
      needs: [3501],
    },
    {
      cast: "four diners; tableware, food, lights",
      pieces: "tableware, food and lights as kinds",
    },
  ),
  planned(
    {
      id: "dog-and-ox",
      title: "Dog walker and ox cart",
      summary:
        "A walker with a dog on a lead, and an ox drawing a cart behind its driver.",
      setting: "ride",
      needs: [3495, 3496],
    },
    {
      cast: "a walker, a driver; a dog, an ox, a cart",
      pieces: "quadrupeds on the horse's rig, a drawn cart",
    },
  ),
  planned(
    {
      id: "van-and-pickup",
      title: "Van and pickup",
      summary:
        "Three people load a van through its rear doors and a pickup over its tailgate, and open the bonnet.",
      setting: "ride",
      needs: [3498],
    },
    {
      cast: "three people; a van, a pickup",
      pieces: "rear doors, a boot, a bonnet, windows",
    },
  ),
  planned(
    {
      id: "shove-and-topple",
      title: "A shove that topples",
      summary:
        "A shove that sends a man stepping or falling by its impulse, a slip on ice, and standing passengers in a braking bus.",
      setting: "everyday",
      needs: [3429, 3430, 3431],
    },
    {
      cast: "three people; a bus",
      pieces:
        "forces and impulses, one perturbation law with sway, steps and fall, a braking support, a slip",
    },
  ),
  planned(
    {
      id: "swimming",
      title: "Swimming in water",
      summary:
        "Breaststroke, floating, wading and a dive's entry, moved by the water's forces.",
      setting: "sport",
      needs: [3432],
    },
    {
      cast: "three swimmers",
      pieces: "an immersed base with hydrodynamic and buoyant forces",
    },
  ),
  planned(
    {
      id: "heavy-push",
      title: "Pushing a heavy cart",
      summary:
        "Two people push a loaded cart, drag a crate and open a heavy door, each moved by the force applied.",
      setting: "work",
      needs: [3433],
    },
    {
      cast: "two people; a cart, a crate, a heavy door",
      pieces: "props with mass and friction moved by the hands' force",
    },
  ),
  planned(
    {
      id: "diving",
      title: "Diving and twisting",
      summary:
        "A twisting salto, a platform dive and a tour en l'air, the turns following from the shape in flight.",
      setting: "sport",
      needs: [3422, 3423, 3424, 3426, 3427, 3428],
    },
    {
      cast: "two divers",
      pieces:
        "whole-body momentum and rotation, airborne rotation from conserved angular momentum",
    },
  ),
  planned(
    {
      id: "parkour",
      title: "Parkour",
      summary:
        "Two runners vault a wall, scramble up a ledge, get up from the floor and climb.",
      setting: "sport",
      needs: [3425, 3435, 3436],
    },
    {
      cast: "two runners; a wall, a bar",
      pieces:
        "loaded contacts on any region, a support-sequence planner, vault, scramble, get-up and climb as rows",
    },
  ),
  planned(
    {
      id: "lifts-and-carries",
      title: "Lifts and carries",
      summary:
        "A dance lift, a fireman's carry lifted in, a hand to help someone up, a support walk.",
      setting: "partner",
      needs: [3437, 3440],
    },
    {
      cast: "pairs",
      pieces: "coupled meetings in which one body bears another",
    },
  ),
  planned(
    {
      id: "grappling",
      title: "Grappling",
      summary:
        "A judo throw by force exchange, a takedown, arm wrestling and a tug of war.",
      setting: "partner",
      needs: [3439, 3440, 3451],
    },
    {
      cast: "pairs; a rope",
      pieces:
        "force exchange through grips: off-balancing, resisting and throwing",
    },
  ),
  planned(
    {
      id: "fingers",
      title: "Fingers at work",
      summary:
        "Touch typing, a piano, a guitar fretted and strummed, writing with a pen, thumb texting, and turning an object in the hand.",
      setting: "work",
      needs: [3442, 3443, 3444, 3445, 3446, 3447],
    },
    {
      cast: "four people; a keyboard, a piano, a guitar, a pen, a phone",
      pieces:
        "finger ranges, fingertip surfaces, digit goals, keyed contact sequences, in-hand regrasp",
    },
  ),
  planned(
    {
      id: "cloth-and-rope",
      title: "Cloth and rope",
      summary:
        "A towel folded, a flag waved, a sheet shaken out, a rope pulled and a shoelace tied.",
      setting: "work",
      needs: [3448, 3449, 3450, 3451, 3504],
    },
    {
      cast: "four people; a towel, a flag, a sheet, a rope",
      pieces:
        "soft props in the performance, gripped and loaded by the hands, cords with bending and self-contact",
    },
  ),
];
