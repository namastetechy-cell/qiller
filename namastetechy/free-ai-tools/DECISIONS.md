# Decisions: 5 free AI tools (16:9, Bold Poster)

- Picture: HyperFrames frame preset `bold-poster` (white / ink / tomato red; Shrikhand, Libre Baskerville, Space Grotesk). Audio: the creator's voiceover only, no SFX or music.
- Timing: Whisper-small (Hindi) in 10s + 22s windows, plus 6s re-runs over four gaps where it looped (160-174s, 175-190s, 225-236s, 299-312s), aligned to the script (`whysplained/tools/align.py`) and re-timed from confident anchors (`whysplained/tools/retime.py`).
- Layout: poster type on the left, b-roll in a double-ruled ink frame on the right; red title slam per tool; chapter label and a red progress bar with chapter ticks along the bottom; line captions in the preset's caption card.
- B-roll (captured live with Playwright at 1920x1080, see tools/):
  - ChatPDF: real upload of a sample contract (input/MSA_Contract_Report.pdf, written for this video) and the script's exact question; the answer lists the real deadlines and risks from it.
  - NotebookLM, MacWhisper, Clipdrop, Activepieces: page captures and scrolls.
  - Whisper Web: transcribed a 12s clip of this voiceover in the browser.
  - Clipdrop: real brush painting on Clipdrop's own sample photo. Its "Clean" result needs sign-in, so the result shot is Clipdrop's own before/after hero, not a fake.
  - LanguageTool: a rough sentence typed into the live editor and corrected.
  - Pricing evidence: Otter, Grammarly and Zapier pricing pages.
  - Not capturable here: DeepL Write and Make.com (Cloudflare bot check), Adobe pricing (Access Denied). Make is shown as a drawn workflow diagram.

## Worth checking before upload
- Clipdrop is now "Clipdrop by Jasper" (Jasper acquired it from Stability AI). The script still says "by Stability AI".
- NotebookLM's site title now reads "Gemini Notebook".
- Whisper Web's English model mangled this Hinglish clip ("Try Currow Mac Whisper"), so "accuracy unmatched" is generous for Hinglish. MacWhisper with a large multilingual model does much better.
- Free-tier numbers (NotebookLM 50 sources / 500k words, DeepL Write 1,500 characters, LanguageTool 10,000 characters, Make 1,000 operations, Zapier 100 tasks) are as scripted. Vendors change these often, so re-check them on the day you publish.
