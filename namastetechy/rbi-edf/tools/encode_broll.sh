#!/bin/sh
# Frame sequences from capture.mjs -> 1280x720 mp4 clips stretched to ~TARGET seconds, plus each clip's
# last frame (<name>_end.jpg, held when a slot outlasts the clip) and clips.json with clip lengths.
# usage: sh encode_broll.sh <captureDir> <outDir> [targetSeconds=12]
CAP=$1; OUT=$2; TARGET=${3:-12}
mkdir -p "$OUT"; echo "{" > "$OUT/clips.json"; first=1
for d in "$CAP"/*/; do
  name=$(basename "$d"); n=$(ls "$d" | grep -c '^[0-9]*\.png$')
  [ "$n" -lt 2 ] && continue
  fps=$(python3 -c "print(round(max(8, min(30, $n / $TARGET)), 3))")
  ffmpeg -v error -y -framerate "$fps" -i "$d/%04d.png" -vf "scale=1280:720:flags=lanczos,fps=30,format=yuv420p" -c:v libx264 -crf 20 -preset medium -movflags +faststart "$OUT/$name.mp4"
  last=$(ls "$d" | grep '^[0-9]*\.png$' | sort | tail -1)
  ffmpeg -v error -y -i "$d/$last" -vf scale=1280:720 -q:v 3 "$OUT/${name}_end.jpg"
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/$name.mp4")
  [ $first -eq 0 ] && echo "," >> "$OUT/clips.json"; first=0
  printf '"%s": %s' "$name" "$dur" >> "$OUT/clips.json"
done
echo "}" >> "$OUT/clips.json"
