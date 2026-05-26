import { v4 as uuidv4 } from 'uuid';

export function generateToken(): string {
  return uuidv4().replace(/-/g, '');
}

export function buildQuizUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  return `${base}/quiz/${token}`;
}
