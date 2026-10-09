# Style guide (from the reference Short, 89s, 9:16)

## Structure
- Talking head (presenter at desk, warm lamp-lit room) alternates with full-screen
  map animation / AI-style b-roll. Roughly 70% graphics, 30% face.
- Cuts every 3-7s on graphics, 4-10s on face. Measured cuts: 4.3, 17.8, 22.4, 29.8,
  44.5, 47.8, 48.9, 59.2, 63.1, 67.4, 69.5, 71.8, 74.6, 80.5, 83.9s.
- Constant camera motion: maps slowly push in, tilt into 3D perspective, or fly
  from India -> state -> landmark. Nothing stays static.
- Transitions: hard cuts mostly; map-to-map uses a zoom/fly-through; one torn
  "shatter" wipe (37s).

## Maps (signature look)
- Satellite-texture terrain. Focus region filled saturated orange/yellow
  (#F5A623 -> #FFC21A), surrounding land crimson (#8B0A0A), sea deep teal (#0E3A3F).
- Coastline / borders glow white or cyan (#5FF4FF) with outer glow.
- Rivers drawn on as glowing cyan squiggles (stroke-draw animation).
- Location pins: red map pin + small black label chip with white caps text.
- Distances as dashed route lines drawing on, with a big number.

## Typography
- Heavy geometric sans, ALL CAPS (Montserrat ExtraBold/Black look-alike).
- Region names: big white caps, 3D-tilted onto the map with drop shadow.
- Labels: white caps on black rounded chip (BHAVNAGAR, SALTY WATER, 16000 SQ),
  or yellow (#FFE14D) caps on dark chip with yellow border (16 LANE HIGHWAY).
- Numbers: glowing — cyan "60 KM", green "177KM" / "₹3800 CRORE", red "356KM" for bad.
- Text reveals: type-on / mask wipe left->right, ~0.3s; numbers count up.
- NO running subtitles. Only keyword labels on screen.

## Colour coding
- Cyan = water/neutral fact, green = good/benefit, red = problem/cost.

## Audio
- Voice-led, continuous bed (no silent gaps), integrated loudness -17.5 LUFS.
- For our version: no BGM, SFX only — whoosh on scene changes, pop on labels,
  click on counters, boom on reveals, riser into twists, ding on CTA.
