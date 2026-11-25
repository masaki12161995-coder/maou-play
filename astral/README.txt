星環の決闘 / ASTRAL ECLIPSE
CPU対戦 試遊版

遊び方は同梱の「astral-eclipse-rules.pdf」またはゲームの「遊び方」で確認できます。

パソコンで遊ぶ
ZIPを展開し、index.htmlをChrome、Edge、Firefox、Safariなどのブラウザーで開きます。
マウスでカードを引っぱり、押し続けるとカードの詳細が開きます。
キーボードでもカードを選べます。Tabで移動し、Enterでカードをつかみ、
矢印キーで対象を選んでEnter。カードの詳細はIキーで開きます。

iPhoneで遊ぶ
1. パソコンとiPhoneを同じWi-Fiにつなぎます。
2. パソコンで、展開したindex.htmlのあるフォルダを開きます。
   Python 3がある場合、そのフォルダで次を実行します。

   python3 -m http.server 8765 --bind 0.0.0.0

   Windowsでpython3が使えない場合は、代わりに
   py -3 -m http.server 8765 --bind 0.0.0.0
   を実行します。
3. iPhoneのSafariで「http://パソコンのローカルIPアドレス:8765/」を開きます。
   例　http://192.168.1.10:8765/
4. 画面いっぱいで遊ぶ場合は、Safariの共有メニューから「ホーム画面に追加」し、
   追加した「星環の決闘」を縦向きで開きます。
   ゲームを開く間は、パソコンの配信を起動しておきます。

勝利で得たカードと音の設定は、開いたアドレスごとに端末のブラウザーに保存されます。
外部サイトへの接続は不要です。対戦はタイトル画面から新しく始まります。

収録素材
今回のタイトル、盤面、カード絵、肖像は生成した仮素材です。
assets内の title.webp、board.webp、01.webp〜16.webp、portrait-*.webp が画像です。
カードIDと画像番号の対応は engine.js の cards にあります。
書体のライセンスは assets/font-license.txt に収録しています。
