'use client';

import { frame, cancelFrame } from 'framer-motion';

export type FrameStep = 'update' | 'render';
export type FrameCallback = (timestampMs: number, deltaMs: number) => void;

/** Runs cb every frame on framer-motion's single rAF. Returns unsubscribe. */
export function onEveryFrame(cb: FrameCallback, step: FrameStep): () => void {
  const process = (d: { timestamp: number; delta: number }): void => cb(d.timestamp, d.delta);
  frame[step](process, true);
  return () => cancelFrame(process);
}
