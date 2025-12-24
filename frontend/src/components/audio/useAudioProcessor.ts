import { useRef, useCallback } from 'react'
import { useAudioContext } from './AudioContext'

export type GainLevel = 'Off' | '6' | '12' | '18' | '24' | '30'
export type HighpassFreq = 'Off' | '250' | '500' | '1000' | '1500'
export type LowpassFreq = 'Off' | '2000' | '4000' | '8000'

const GAIN_VALUES: Record<GainLevel, number> = {
  Off: 1,
  '6': 2,
  '12': 4,
  '18': 8,
  '24': 16,
  '30': 32,
}

const STORAGE_KEYS = {
  gain: 'birdnet-player-gain',
  highpass: 'birdnet-player-highpass',
  lowpass: 'birdnet-player-lowpass',
}

function safeGet<T extends string>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(key)
    return (val as T) || fallback
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

export function useAudioProcessor(audioElement: HTMLAudioElement | null) {
  const { getAudioContext } = useAudioContext()

  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const highpassNodeRef = useRef<BiquadFilterNode | null>(null)
  const lowpassNodeRef = useRef<BiquadFilterNode | null>(null)
  const isInitializedRef = useRef(false)

  const initAudioChain = useCallback(() => {
    if (!audioElement || isInitializedRef.current) return

    const ctx = getAudioContext()

    sourceNodeRef.current = ctx.createMediaElementSource(audioElement)
    gainNodeRef.current = ctx.createGain()
    gainNodeRef.current.gain.value = 1

    sourceNodeRef.current.connect(gainNodeRef.current)
    gainNodeRef.current.connect(ctx.destination)

    isInitializedRef.current = true
  }, [audioElement, getAudioContext])

  const rebuildChain = useCallback(() => {
    if (!sourceNodeRef.current || !gainNodeRef.current) return

    const ctx = getAudioContext()

    sourceNodeRef.current.disconnect()
    gainNodeRef.current.disconnect()
    highpassNodeRef.current?.disconnect()
    lowpassNodeRef.current?.disconnect()

    let currentNode: AudioNode = sourceNodeRef.current

    if (highpassNodeRef.current) {
      currentNode.connect(highpassNodeRef.current)
      currentNode = highpassNodeRef.current
    }

    if (lowpassNodeRef.current) {
      currentNode.connect(lowpassNodeRef.current)
      currentNode = lowpassNodeRef.current
    }

    currentNode.connect(gainNodeRef.current)
    gainNodeRef.current.connect(ctx.destination)
  }, [getAudioContext])

  const setGain = useCallback((level: GainLevel) => {
    initAudioChain()
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = GAIN_VALUES[level]
    }
    safeSet(STORAGE_KEYS.gain, level)
  }, [initAudioChain])

  const setHighpass = useCallback((freq: HighpassFreq) => {
    initAudioChain()
    const ctx = getAudioContext()

    if (freq === 'Off') {
      if (highpassNodeRef.current) {
        highpassNodeRef.current.disconnect()
        highpassNodeRef.current = null
      }
    } else {
      if (!highpassNodeRef.current) {
        highpassNodeRef.current = ctx.createBiquadFilter()
        highpassNodeRef.current.type = 'highpass'
      }
      highpassNodeRef.current.frequency.value = parseFloat(freq)
    }

    rebuildChain()
    safeSet(STORAGE_KEYS.highpass, freq)
  }, [initAudioChain, getAudioContext, rebuildChain])

  const setLowpass = useCallback((freq: LowpassFreq) => {
    initAudioChain()
    const ctx = getAudioContext()

    if (freq === 'Off') {
      if (lowpassNodeRef.current) {
        lowpassNodeRef.current.disconnect()
        lowpassNodeRef.current = null
      }
    } else {
      if (!lowpassNodeRef.current) {
        lowpassNodeRef.current = ctx.createBiquadFilter()
        lowpassNodeRef.current.type = 'lowpass'
      }
      lowpassNodeRef.current.frequency.value = parseFloat(freq)
    }

    rebuildChain()
    safeSet(STORAGE_KEYS.lowpass, freq)
  }, [initAudioChain, getAudioContext, rebuildChain])

  const getSavedSettings = useCallback(() => ({
    gain: safeGet<GainLevel>(STORAGE_KEYS.gain, 'Off'),
    highpass: safeGet<HighpassFreq>(STORAGE_KEYS.highpass, 'Off'),
    lowpass: safeGet<LowpassFreq>(STORAGE_KEYS.lowpass, 'Off'),
  }), [])

  return {
    initAudioChain,
    setGain,
    setHighpass,
    setLowpass,
    getSavedSettings,
  }
}
