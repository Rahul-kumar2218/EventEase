import crypto from 'crypto';
import { generateSignedQrToken } from './security.js';

export const generateEventId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'EVT-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateParticipantId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'PAR-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateEntryCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateQrToken = () => {
  const raw = crypto.randomBytes(24).toString('hex');
  return generateSignedQrToken(raw);
};

export const generateCheckInId = () => {
  return 'CHK-' + crypto.randomBytes(6).toString('hex').toUpperCase();
};
