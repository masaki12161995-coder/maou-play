# ゲームで使うファイルの一覧（files.json）を作る。sw.js が、これを見てオフライン用に保存する
# コミットの前に自動で動く（.git/hooks/pre-commit）。手で動かすときは：python3 rpg/tools_files.py
import os, json
root = os.path.dirname(os.path.abspath(__file__))
out = []
for d in ["img"]:
    for f in sorted(os.listdir(os.path.join(root, d))):
        if f.endswith((".png", ".jpg", ".gif", ".webp")): out.append(f"{d}/{f}")
out += ["index.html", "cards.html", "manifest.webmanifest"]
json.dump(out, open(os.path.join(root, "files.json"), "w"), ensure_ascii=False, indent=0)
print(len(out), "files")
