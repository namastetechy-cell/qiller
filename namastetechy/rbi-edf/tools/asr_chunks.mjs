// Whisper-small word timestamps over fixed windows (it loops less on short Hinglish windows).
// usage: node asr_chunks.mjs <modelRoot> <audio16k.f32> <lang> <windowSec> <outDir>  -> outDir/partNN.json (+ offsets.txt)
import { pipeline, env } from "@huggingface/transformers";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const [modelRoot, audioPath, lang, winS, outDir] = process.argv.slice(2);
env.allowRemoteModels = false;
env.localModelPath = modelRoot;
mkdirSync(outDir, { recursive: true });
const buf = readFileSync(audioPath);
const audio = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
const asr = await pipeline("automatic-speech-recognition", "Xenova/whisper-small", { dtype: "q8" });
const SR = 16000, win = Math.round(+winS * SR), offs = [];
for (let k = 0, s = 0; s < audio.length; k++, s += win) {
  const res = await asr(audio.subarray(s, Math.min(audio.length, s + win)), { language: lang, task: "transcribe", return_timestamps: "word" });
  const name = `${outDir}/part${String(k).padStart(2, "0")}.json`;
  writeFileSync(name, JSON.stringify(res));
  offs.push(`${name}:${(s / SR).toFixed(3)}`);
  console.log(k, (s / SR).toFixed(1), res.text.slice(0, 80));
}
writeFileSync(`${outDir}/offsets.txt`, offs.join(" "));
