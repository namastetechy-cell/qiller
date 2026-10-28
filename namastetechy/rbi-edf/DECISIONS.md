# Decisions: RBI EDF rule & YouTubers (16:9, Bold Poster)

- Picture: same Bold Poster system as `free-ai-tools` (white / ink / tomato red; Shrikhand, Libre Baskerville, Space Grotesk): poster type on the left, b-roll in a double-ruled frame on the right, red title slams per part, caption card, chapter label + red progress bar. Audio: the creator's voiceover only, no SFX, no music.
- Pauses: the take was already tight (no pause over 0.5s). `tools/tighten.py` trims every pause of 0.35s or more to 0.22s (cut mid-pause, 10ms crossfade): 227.3s -> 218.4s, 47 pauses shortened.
- Timing: Whisper-small looped on this voice ("आप आप आप…"), so it only supplies sparse anchors. `tools/pause_align.py` puts every caption-line break on a real pause with a DP (line length vs. character count, Whisper anchors, sentence-end bonus); words within a line are spread by characters. Agrees with all but two anchors, both of which are Whisper errors.
- B-roll: live captures at 1920x1080 (`tools/capture.mjs`, `tools/jobs.json`, `tools/jobs2.json` for the RBI language pop-up and cookie bars), encoded by `tools/encode_broll.sh`. Sources: rbi.org.in (home, FAQs), Business Today (6 Oct EDF story), Taxmann and SCC Online (FEMA regulations 2026), Razorpay blog, Fueler (7 Oct clarification, a secondary report), Winvesta, AdSense site + payment-timeline help, YouTube for Creators monetization page.
- Pixabay: not used. pixabay.com refuses automated downloads (403); its API needs a key. Stock clips can be dropped into `assets/broll/` and referenced in `frame([...])`.
- StudyCafe capture is not used: a membership pop-up covers the article.

## Worth checking before upload
- The Business Today story on screen is the 6 Oct one (before the clarification). I couldn't find the Business Today piece on the 7 Oct statement; the clarification is shown via Fueler's write-up, labelled "secondary report".
- The "Fill a form for just being alive" quote: I couldn't find its source online. It's attributed on screen only as "experts, via a business news report", as in the script.
- RBI FAQs were still pending at the time of these captures; re-check before publishing.
