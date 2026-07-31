/**
 * Enhanced useMotionSensing with calibration and sensitivity support
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { MechanicType } from '../types';

export interface MotionSensorsState {
  permissionGranted: boolean;
  needsPermissionButton: boolean;
  intensity: number;
  acc: { x: number; y: number; z: number };
  rot: { alpha: number; beta: number; gamma: number };
  isShaking: boolean;
  isWhipping: boolean;
}

interface SensitivityConfig {
  shakeThreshold: number;
  whipThreshold: number;
  tiltTolerance: number;
  stillThreshold: number;
  quickDrawThreshold: number;
  intensityScale: number;
}

const SENSITIVITY_CONFIGS: Record<string, SensitivityConfig> = {
  low: {
    shakeThreshold: 25,
    whipThreshold: 28,
    tiltTolerance: 20,
    stillThreshold: 8,
    quickDrawThreshold: 22,
    intensityScale: 0.8
  },
  medium: {
    shakeThreshold: 15,
    whipThreshold: 22,
    tiltTolerance: 15,
    stillThreshold: 10,
    quickDrawThreshold: 20,
    intensityScale: 1.0
  },
  high: {
    shakeThreshold: 8,
    whipThreshold: 15,
    tiltTolerance: 10,
    stillThreshold: 5,
    quickDrawThreshold: 15,
    intensityScale: 1.3
  }
};

export function useMotionSensing(
  socket: Socket | null,
  roomCode: string,
  playerId: string,
  currentMechanic?: MechanicType,
  enabled: boolean = true,
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
) {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [needsPermissionButton, setNeedsPermissionButton] = useState<boolean>(false);
  const [motionState, setMotionState] = useState<MotionSensorsState>({
    permissionGranted: false,
    needsPermissionButton: false,
    intensity: 0,
    acc: { x: 0, y: 0, z: 0 },
    rot: { alpha: 0, beta: 0, gamma: 0 },
    isShaking: false,
    isWhipping: false
  });

  const lastEmitTimeRef = useRef<number>(0);
  const prevAccRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const baselineIntensityRef = useRef<number>(0);
  const isCalibratingRef = useRef<boolean>(false);
  const calibrationSamplesRef = useRef<number[]>([]);

  const config = SENSITIVITY_CONFIGS[sensitivity];

  const triggerVibrate = useCallback((pattern: number | number[] = [100, 50, 100]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (err) {
        console.warn('Vibration API error:', err);
      }
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceMotionEvent as any)?.requestPermission === 'function'
    ) {
      try {
        const motionPermission = await (DeviceMotionEvent as any).requestPermission();
        let orientationPermission = 'granted';
        if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
          orientationPermission = await (DeviceOrientationEvent as any).requestPermission();
        }

        if (motionPermission === 'granted' && orientationPermission === 'granted') {
          setPermissionGranted(true);
          setNeedsPermissionButton(false);
          triggerVibrate([50, 50, 100]);
          return true;
        } else {
          alert('需要加速度計與陀螺儀權限才能體驗 1-2-Switch 感應遊戲！');
          return false;
        }
      } catch (error) {
        console.error('Request Motion Permission error:', error);
        return false;
      }
    } else {
      setPermissionGranted(true);
      setNeedsPermissionButton(false);
      return true;
    }
  }, [triggerVibrate]);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceMotionEvent as any)?.requestPermission === 'function'
    ) {
      setNeedsPermissionButton(true);
    } else {
      setPermissionGranted(true);
      setNeedsPermissionButton(false);
    }
  }, []);

  useEffect(() => {
    if (!permissionGranted || !enabled) return;

    let rotAlpha = 0;
    let rotBeta = 0;
    let rotGamma = 0;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      rotAlpha = event.alpha || 0;
      rotBeta = event.beta || 0;
      rotGamma = event.gamma || 0;
    };

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.acceleration || event.accelerationIncludingGravity;
      if (!acc) return;

      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;

      const gForce = Math.sqrt(x * x + y * y + z * z);
      const deltaX = Math.abs(x - prevAccRef.current.x);
      const deltaY = Math.abs(y - prevAccRef.current.y);
      const deltaZ = Math.abs(z - prevAccRef.current.z);
      const deltaAcc = deltaX + deltaY + deltaZ;

      prevAccRef.current = { x, y, z };

      // Apply calibration baseline
      const calibratedGForce = Math.max(0, gForce - baselineIntensityRef.current);
      let intensity = Math.min(Math.round((calibratedGForce / 25) * 100 * config.intensityScale), 100);

      // Apply delta boost
      if (deltaAcc > config.shakeThreshold * 0.5) {
        intensity = Math.min(intensity + 20, 100);
      }

      const isShaking = deltaAcc > config.shakeThreshold || gForce > config.quickDrawThreshold;
      const isWhipping = deltaAcc > config.whipThreshold || (Math.abs(y) > config.quickDrawThreshold && z > 10);
      const isQuickDraw = gForce > config.quickDrawThreshold || (y > 15 && z < 5);

      setMotionState({
        permissionGranted: true,
        needsPermissionButton: false,
        intensity,
        acc: { x, y, z },
        rot: { alpha: rotAlpha, beta: rotBeta, gamma: rotGamma },
        isShaking,
        isWhipping
      });

      // Throttle socket emission to ~30fps
      const now = Date.now();
      if (socket && roomCode && playerId && now - lastEmitTimeRef.current > 33) {
        lastEmitTimeRef.current = now;

        let isSpecialTrigger = false;
        if (currentMechanic === 'quick_draw' && isQuickDraw) {
          isSpecialTrigger = true;
          triggerVibrate([80, 40, 80]);
        } else if (currentMechanic === 'whip' && isWhipping) {
          isSpecialTrigger = true;
          triggerVibrate(80);
        } else if (currentMechanic === 'shake' && isShaking) {
          isSpecialTrigger = true;
          triggerVibrate(40);
        }

        socket.emit('player-motion', {
          roomCode,
          playerId,
          mechanicType: currentMechanic || 'shake',
          intensity,
          acc: { x, y, z },
          rot: { alpha: rotAlpha, beta: rotBeta, gamma: rotGamma },
          isSpecialTrigger
        });
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [permissionGranted, enabled, socket, roomCode, playerId, currentMechanic, triggerVibrate, config]);

  // Calibration function: call during practice phase to establish baseline
  const calibrate = useCallback(() => {
    isCalibratingRef.current = true;
    calibrationSamplesRef.current = [];
  }, []);

  const updateCalibration = useCallback((intensity: number) => {
    if (!isCalibratingRef.current) return;

    calibrationSamplesRef.current.push(intensity);
    if (calibrationSamplesRef.current.length >= 30) {
      // Calculate average baseline
      const avg = calibrationSamplesRef.current.reduce((a, b) => a + b, 0) / calibrationSamplesRef.current.length;
      baselineIntensityRef.current = Math.max(0, avg - 5); // Subtract a small buffer
      isCalibratingRef.current = false;
      calibrationSamplesRef.current = [];
    }
  }, []);

  return {
    permissionGranted,
    needsPermissionButton,
    requestPermission,
    motionState,
    triggerVibrate,
    calibrate,
    updateCalibration
  };
}
