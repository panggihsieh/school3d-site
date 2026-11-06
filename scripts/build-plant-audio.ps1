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
  foreach ($taskTree in $taskData.points) {
    if ($taskTree.topic -eq 'carbon') { $taskClips[$taskTree.id] = "目前目標，$($taskTree.label)，$($taskTree.species)。" }
  }
  foreach ($taskClip in $taskClips.GetEnumerator()) {
    $taskSynth.SetOutputToWaveFile((Join-Path $taskOutput ($taskClip.Key + '.wav')), $taskFormat)
    $taskSynth.Speak($taskClip.Value)
    $taskSynth.SetOutputToNull()
  }
  Write-Output "Generated $($taskClips.Count) Chinese audio clips."
} finally { $taskSynth.Dispose() }
