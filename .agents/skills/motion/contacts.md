# Contacts and supports

## Windows and support frames

Each contact holds through a declared window: a plant, a seat, a grip, a rest or a hang. Each window names its support frame: the ground, a prop or another performer. Slip and penetration are measured in that frame, so a hand on a moving rail or a rider on a moving mount is not reported as sliding.

## Feet

Plant a foot at the point that actually touches: the ball, the heel, or both. Holding the ankle while the check reads the ball lets the ball drift as the foot pivots.

A heel lift rotates the foot about the metatarsophalangeal axis with the ball fixed in the world, the forefoot rocker of Perry's *Gait Analysis*. Measure swing clearance at the lowest point of the toe and sole, not at the ankle.

Plan travel as whole steps. A normal step is about 0.41 of stature (Murray, Drought and Kory 1964; Grieve and Gear 1966), and the first and last steps are shorter. Covering even a short distance in one stride splits the legs into a lunge.

## Held objects

At grip closure, store the object's pose in the hand's frame (inverse(hand) · object) and keep it fixed until release, as a parent constraint keeps its offset at activation. Re-deriving the offset during the hold lets the object drift in the hand and tilt when it is set down. Set an object down by giving the hand the goal that puts the object at its target pose through that stored offset.

A held object stays held across actions until an action takes that hand over to put it down, hand it on or use it. Until then the hand travels with the body and keeps its grip. Refuse an action that would use a holding hand for something else, because the object would be left in the air or dragged through a gesture.

At a handover:

- both hands hold through a shared window while the object's world pose blends from the giver to the receiver;
- the giver opens only after the receiver's grip has closed;
- every outcome that keeps the object, such as a withdrawn offer, keeps a hand on it until the object is set down.

## Contact between performers

Judge a contact against each performer's final displayed pose. A contact stop, the instant a moving limb is halted at contact, committed against a provisional pose lands at the wrong instant and lets one body pass into the other. When a contact stop changes what is displayed, resolve the contacts again against the new display, or resolve both performers together at each instant.

A contact stop changes the pose only. The action keeps its duration, its events and its [decisive instant](laws.md#declare-events-and-the-decisive-instant), so a partner and the sound still meet it at the planned time. Resolve contacts that fall in the same span in time order, each later one seeing the earlier stops.

Measure penetration against each part's own collider, not against one radius shared by a whole limb.
