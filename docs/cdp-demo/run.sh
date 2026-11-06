#!/usr/bin/env bash
# Drive the simulator app over CDP (__app) and take a screenshot for each scene.
#   AD=<path to agent-device> docs/cdp-demo/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
OUT=docs/cdp-demo
LOG=$OUT/log.txt
: > "$LOG"

shot() { sleep 0.8; "$AD" screenshot "$OUT/$1.png" --pixel-density 2 >/dev/null; echo "📸 $1.png" | tee -a "$LOG"; }
step() { echo "## $1" | tee -a "$LOG"; shift; node scripts/cdp.mjs "$@" 2>&1 | cut -c1-300 | tee -a "$LOG"; }

# Weather variations: just swap the deps and Retry
step "01 実ネットワーク" "__app.scenario('default')" "__app.go('/')" "__app.do('Retry').then(s => s.state.status)"
shot 01-live
step "02 雨" "__app.scenario('rainy')" "__app.do('Retry').then(s => s.state.forecast.current)"
shot 02-rainy
step "03 雪" "__app.scenario('snowy')" "__app.do('Retry').then(s => s.state.forecast.current)"
shot 03-snowy
step "04 雷雨" "__app.scenario('stormy')" "__app.do('Retry').then(s => s.state.forecast.current)"
shot 04-stormy

# Failure cases: states that are hard to produce on a real device
step "05 オフライン" "__app.scenario('offline')" "__app.do('Retry').then(s => s.state)"
shot 05-offline
# loading never gets a response, so don't wait for it
step "06 読み込み中" "__app.scenario('loading')" "(__app.do('Retry'), 'sent')" "__app.ls().state"
shot 06-loading
step "07 位置情報を拒否済み" "__app.scenario('location-denied')" "__app.do('Retry').then(s => s.state)"
shot 07-location-denied

# Navigation: search → detail → favorite → Favorites tab (no button taps)
# After go / Open / Back, wait a bit for focus to move (until useFocusEffect runs)
W="new Promise(r => setTimeout(r, 300))"
step "08 検索して詳細を開く" "__app.scenario('fixtures')" "__app.go('/search')" \
  "$W.then(() => __app.do('ChangeQuery', { query: 'Tokyo' })).then(s => s.state.query)" \
  "__app.do('Submit').then(s => s.state.results.map(r => r.name + ' / ' + r.region))" \
  "__app.do('Open', { id: 1850147 })" "$W.then(() => __app.ls()).then(s => [s.path, s.state.status, s.state.favorite])"
shot 08-city
step "09 お気に入りを切り替える" "__app.do('ToggleFavorite').then(s => s.state.favorite)"
shot 09-favorite-toggled
step "10 お気に入りが多い" "__app.do('Back')" "__app.scenario('many-favorites')" "__app.go('/favorites')" \
  "$W.then(() => __app.do('Appear')).then(s => s.state.items.map(i => i.city.name))"
shot 10-many-favorites

# hydrate: set state directly, bypassing update (for visual checks of edge values)
step "11 hydrate で長い地名と極端な気温" "__app.go('/')" \
  "$W.then(() => { const s = __app.ls().state; return __app.hydrate({ ...s, place: 'ランフェアプルグウィンギルゴウゲリフウィルンドロブル', forecast: { ...s.forecast, current: { code: 0, temperature: -38.6 } } }).state.place })"
shot 11-hydrate

# Clean up
step "12 元に戻す" "__app.scenario('default')" "__app.do('Retry').then(s => s.state.status)"
