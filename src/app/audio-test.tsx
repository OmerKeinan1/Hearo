// DEV-ONLY: Audio engine sanity-check screen.
// Navigate here by going to /audio-test in the app.
// Uses bundled trigger mp3s as stand-ins for ambient/voice (no real assets needed).

import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { dBToGain } from '@/lib/audio-engine';
import { IntensitySlider } from '@/components/IntensitySlider';

const AMBIENT_STUB = require('../../assets/sounds/ambient/beach/Soothing_ocean_shore_1-1780143780490.mp3');
const TRIGGER_FILE = require('../../assets/sounds/triggers/door-slam/1.mp3');
const VOICE_STUB   = require('../../assets/sounds/triggers/car-horn/1.mp3');

const TRIGGER_CEILING_DB = 0; // 0 dB = gain 1.0 = recorded level
const TRIGGER_CEILING_GAIN = dBToGain(TRIGGER_CEILING_DB);

type Status = 'idle' | 'loading' | 'ambient' | 'scheduler' | 'spiked' | 'done';

export default function AudioTestScreen() {
  const engine = useAudioEngine();
  const [status, setStatus] = useState<Status>('idle');
  const [log, setLog] = useState<string[]>(['Ready.']);

  const [graceEnd, setGraceEnd] = useState<number | null>(null);
  const [graceLabel, setGraceLabel] = useState('');
  const [ceiling, setCeiling] = useState(1.0);
  const [effectiveNorm, setEffectiveNorm] = useState(1.0);
  const [ambientLevel, setAmbientLevel] = useState(1.0);
  const [burstActive, setBurstActive] = useState(false);

  function addLog(msg: string) {
    const ts = new Date().toLocaleTimeString();
    setLog(prev => [`[${ts}] ${msg}`, ...prev].slice(0, 30));
  }

  // Grace countdown interval (3.2)
  useEffect(() => {
    if (graceEnd === null) {
      setGraceLabel('');
      return;
    }
    const id = setInterval(() => {
      const remaining = Math.ceil((graceEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(id);
        setGraceEnd(null);
        setGraceLabel('');
        addLog('Scheduler resumed.');
      } else {
        setGraceLabel(`grace: ${remaining}s`);
      }
    }, 500);
    return () => clearInterval(id);
  }, [graceEnd]);

  // Poll burst state and effective gain while scheduler is running.
  useEffect(() => {
    if (status !== 'scheduler' && status !== 'spiked') return;
    const id = setInterval(() => {
      setEffectiveNorm(Math.min(1, engine.currentTriggerGain() / TRIGGER_CEILING_GAIN));
      setBurstActive(engine.isBurstActive());
    }, 200);
    return () => clearInterval(id);
  }, [status, engine]);

  // ── Step handlers ───────────────────────────────────────────────────────

  async function step1_loadAndStartAmbient() {
    setStatus('loading');
    addLog('Loading ambient + voice buffers…');
    try {
      await engine.loadAmbientAndVoice(AMBIENT_STUB, [VOICE_STUB]);
      addLog('Buffers loaded. Starting ambient loop.');
      engine.startAmbient();
      setStatus('ambient');
      addLog('Ambient playing. Tap "Load trigger" next.');
    } catch (e: any) {
      addLog(`ERROR: ${e?.message ?? e}`);
      setStatus('idle');
    }
  }

  async function step2_loadTrigger() {
    addLog('Loading trigger buffer…');
    try {
      await engine.loadTrigger(TRIGGER_FILE);
      addLog('Trigger loaded. Tap "Start burst scheduler" to begin.');
    } catch (e: any) {
      addLog(`ERROR: ${e?.message ?? e}`);
    }
  }

  function step3_startRamp() {
    // Short intervals for dev testing (3–8s gap, 5s burst).
    engine.startTriggerScheduler({
      intervalMinMs: 3_000,
      intervalMaxMs: 8_000,
      burstDurationMs: 5_000,
      fadeInMs: 500,
      fadeOutMs: 500,
      peakGain: TRIGGER_CEILING_GAIN * ceiling,
    });
    setStatus('scheduler');
    addLog(`Burst scheduler started — 3–8s intervals, 5s burst, peak −${TRIGGER_CEILING_DB} dBFS.`);
  }

  function triggerSpike() {
    engine.onSpike();
    setStatus('spiked');
    setBurstActive(false);
    setGraceEnd(null);
    addLog('onSpike() — scheduler paused, burst fading to silence.');
  }

  function triggerNormalize() {
    engine.onNormalized();
    setStatus('scheduler');
    const end = Date.now() + 30_000;
    setGraceEnd(end);
    addLog('onNormalized() — 30s grace, then scheduler resumes.');
  }

  async function playVoice() {
    addLog('Playing voice clip (ducks trigger)…');
    await engine.playVoiceClip(0);
    addLog('Voice clip finished, trigger restored.');
  }

  function fadeOut() {
    engine.fadeOutAll(3);
    setStatus('done');
    setGraceEnd(null);
    addLog('fadeOutAll(3s) called.');
  }

  // ── Status label ────────────────────────────────────────────────────────

  const statusLabel = graceLabel ? `${status} · ${graceLabel}` : status;

  // ── Helpers ─────────────────────────────────────────────────────────────

  const btn = (label: string, onPress: () => void, disabled = false, color = '#208AEF') => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? '#555' : color,
        borderRadius: 8,
        padding: 12,
        marginVertical: 4,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>{label}</Text>
    </TouchableOpacity>
  );

  const sliderLabel = (text: string) => (
    <Text style={{ color: '#aaa', fontSize: 11, marginTop: 12, marginBottom: 2 }}>{text}</Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#111', padding: 20, paddingTop: 60 }}>
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 4 }}>
        Audio Engine Test
      </Text>
      <Text style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>
        Status: <Text style={{ color: '#4CF' }}>{statusLabel}</Text>
        {status === 'scheduler' && (
          <Text style={{ color: burstActive ? '#4F4' : '#888' }}>
            {' '}· burst: {burstActive ? '▶ ON' : '◼ off'}
          </Text>
        )}
      </Text>
      <View style={{ height: 16 }} />

      {/* Step-by-step controls */}
      {btn('1. Load buffers + start ambient', step1_loadAndStartAmbient, status !== 'idle')}
      {btn('2. Load trigger buffer', step2_loadTrigger, status !== 'ambient')}
      {btn('3. Start burst scheduler', step3_startRamp, status !== 'ambient')}
      {btn('Simulate HR spike → onSpike()', triggerSpike, status !== 'scheduler', '#E05')}
      {btn('Simulate normalize → onNormalized()', triggerNormalize, status !== 'spiked', '#080')}
      {btn('Play voice clip (interrupts burst)', playVoice, !['scheduler', 'spiked', 'ambient'].includes(status), '#884')}
      {btn('Fade out all (wind-down)', fadeOut, status === 'idle' || status === 'done', '#444')}

      {/* Ambient slider */}
      {['ambient', 'scheduler', 'spiked'].includes(status) && (
        <>
          {sliderLabel('Ambient level')}
          <IntensitySlider
            value={ambientLevel}
            onChange={v => {
              setAmbientLevel(v);
              engine.setAmbientGain(v);
            }}
          />
        </>
      )}

      {/* Trigger peak gain slider */}
      {['scheduler', 'spiked'].includes(status) && (
        <>
          {sliderLabel('Trigger peak gain')}
          <IntensitySlider
            value={ceiling}
            effective={effectiveNorm}
            onChange={v => {
              setCeiling(v);
              engine.setTriggerPeakGain(TRIGGER_CEILING_GAIN * v);
            }}
          />
        </>
      )}

      {/* Log */}
      <Text style={{ color: '#aaa', marginTop: 16, marginBottom: 4, fontSize: 11 }}>Log</Text>
      <ScrollView style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 8, padding: 10 }}>
        {log.map((line, i) => (
          <Text key={i} style={{ color: '#cfc', fontFamily: 'monospace', fontSize: 11, marginBottom: 2 }}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
