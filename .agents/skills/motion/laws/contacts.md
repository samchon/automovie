# Contacts and supports

A contact can be a touch event or a constraint held over a window.

## Windows and support frames

Declare which surfaces may touch and when, including approach, first touch and release where they matter. Keep a retained contact in the material frame of the part that owns its surface. Measure slip and penetration from the displayed effector and that material frame at the same second.

Derive the fit from the contact points, the rig's segment lengths and joint limits, and the outer surfaces that must clear.

Match contact tolerances to the resolution of the posed rig and its material.

During continuous bearing, transfer weight to the next support before releasing the current one. Where the authored action goes airborne, check that release ends bearing and touchdown opens it again.

## Feet

Plant the foot at the contact points the phase uses, such as ball, heel or both.

A heel lift rotates the foot about the metatarsophalangeal axis with the ball fixed in the support frame, the forefoot rocker of Perry's Gait Analysis. Measure swing clearance at the lowest point of the toe and sole.

Plan travel in whole steps. Use about 0.41 of stature for a normal step (Murray, Drought and Kory 1964; Grieve and Gear 1966). Shorten the first and last steps.

## Held objects

At grip closure, store inverse(hand) · object and keep that offset until release. For placement, derive the hand goal from the object's target pose and the stored offset.

To verify a held tool's pose, read back its working point and a second point along its length after fitting. Refuse or choose another pose if either misses.

A held object stays held across actions until an action takes that hand over to put it down, hand it on or use it. Until then the hand travels with the body and keeps its grip. Refuse an action that would use a holding hand for something else.

At a handover, the object stays held throughout:

- both hands hold through a shared window while the object's world pose blends from the giver to the receiver;
- the giver opens only after the receiver's grip has closed;
- keep a hand on the object through any outcome that retains it, until set-down.

## Contact between performers

Compute one shared contact target from both bodies' reach and give it to both performers.

Resolve contact stops against both performers' displayed paths during preparation. A stop that changes a path changes all subsequent contact candidates involving that path.

Preserve action duration, events and decisive instant when applying a contact stop. Resolve stops in time order so each sees earlier ones.

Measure penetration against each part's own collider, not against one radius shared by a whole limb.
