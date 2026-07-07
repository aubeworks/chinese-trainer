# ロードマップ

## Phase 1(完了)

今日から使える個人用アプリ。

- 教材パック / 教材 / プレイリスト / 学習キュー
- 聞き流し(速度0.8〜2.0、再生モード4種、シャッフル、リピート)
- 瞬発練習(制限時間つき日本語→中国語)
- 長文(段落・文単位の表示と再生)
- 簡易SRS(まだ苦手/普通/覚えた)
- 苦手・お気に入り管理
- JSON/CSVインポート(ドラッグ&ドロップ対応)、JSONエクスポート、全データバックアップ
- RSS読み上げ・貼り付け読み上げ・教材生成プロンプト
- ピンイン自動生成(声調記号付き)+手修正
- ライト/ダークテーマ、PWA、IndexedDB保存

## Phase 2 候補(優先度順の目安)

1. **音声の強化**
   - MP3/AI音声(TTS API)対応。`src/services/speech.ts` のインターフェースを維持したまま実装を差し替える
   - 教材ごとの音声ファイル添付
2. **教材の充実**
   - Anki Import / Export(`importExport.ts` に変換関数を追加)
   - HSK / TOCFL 語彙パックのプリセット
   - YouTube字幕・PDF・Wordからのインポート
3. **同期・バックアップ**
   - Google Drive / Dropbox / OneDrive への自動バックアップ
   - 複数端末同期(ストレージ層にリモートバックエンドを追加)
4. **学習体験**
   - 音声認識・発音判定(Web Speech API の SpeechRecognition)
   - 学習分析(週間グラフ、カテゴリ別統計)
   - 仮想スクロール(教材が数万件になった場合の一覧最適化)
5. **AI連携**
   - AI APIによる教材自動生成(現在はプロンプトコピー方式)
   - AI翻訳・例文展開

## 設計上の拡張ポイント

| 拡張 | 触る場所 |
| --- | --- |
| 音声エンジン差し替え | `src/services/speech.ts` |
| ストレージ差し替え/同期 | `src/services/storage.ts`(StorageBackendインターフェース) |
| インポート形式追加 | `src/services/importExport.ts` |
| 新しい画面 | `src/pages/` + `src/App.tsx` のルート + `src/components/Layout.tsx` のナビ |
| 教材の新フィールド | `src/types/index.ts`(未知項目は既に保持される) |
