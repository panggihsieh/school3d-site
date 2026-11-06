param([switch]$ContextOnly,[switch]$StationOnly)
Add-Type -AssemblyName System.Speech
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskOutput = Join-Path $taskRoot 'dist/assets/plant-audio'
New-Item -ItemType Directory -Force -Path $taskOutput | Out-Null
$taskData = Get-Content -LiteralPath (Join-Path $taskRoot 'dist/data.json') -Raw -Encoding utf8 | ConvertFrom-Json
$taskSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$taskSynth.SelectVoice('Microsoft Hanhan Desktop')
$taskSynth.Rate = -1
$taskFormat = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
try {
  $taskClips = @{'test'='朗讀測試成功。';'stt-success'='STT 成功。';'no-target'='請先選擇目標樹木。'}
  $taskContextClips = @{
    'location-unavailable'='尚未取得有效手機定位。請先開始定位。目前選取的樹木不代表您所在的位置。'
    'location-stale'='手機定位已過期。請重新取得定位，再朗讀目前目標。'
    'location-inaccurate'='目前定位精度不足，無法確認您是否在目標附近。請在安全空曠處重新定位。'
    'outside-campus'='您目前不在校園樹木附近。選取的樹木不是您的所在位置。請查看畫面的實際距離。'
    'target-distant'='您尚未接近目前選取的樹木。請查看畫面距離，確認目標編號。橘色樹木點不是手機位置。'
  }
  if ($ContextOnly) { $taskClips = $taskContextClips } else { foreach ($taskEntry in $taskContextClips.GetEnumerator()) { $taskClips[$taskEntry.Key] = $taskEntry.Value } }
  foreach ($taskTree in $(if ($ContextOnly) { @() } else { $taskData.points })) {
    if ($taskTree.topic -eq 'carbon') { $taskClips[$taskTree.id] = "目前目標，$($taskTree.label)，$($taskTree.species)。" }
  }
  if ($StationOnly) {
    $taskClips = @{}
    Push-Location $taskRoot
    try { $taskStations = node --input-type=module -e "import {stations,stationDescription} from './dist/space-domain.js'; console.log(JSON.stringify(stations.map(s=>({id:s.id,text:stationDescription(s)}))));" | ConvertFrom-Json } finally { Pop-Location }
    foreach ($taskStation in $taskStations) { $taskClips[$taskStation.id] = $taskStation.text }
  }
  foreach ($taskClip in $taskClips.GetEnumerator()) {
    $taskSynth.SetOutputToWaveFile((Join-Path $taskOutput ($taskClip.Key + '.wav')), $taskFormat)
    $taskSynth.Speak($taskClip.Value)
    $taskSynth.SetOutputToNull()
  }
  Write-Output "Generated $($taskClips.Count) Chinese audio clips."
} finally { $taskSynth.Dispose() }
