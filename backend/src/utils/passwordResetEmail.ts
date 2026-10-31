import axios from 'axios';
import { z } from 'zod';

type Language = 'en' | 'cs';

type MailjetConfig = {
  apiKey: string;
  secretKey: string;
  fromEmail: string;
  fromName: string;
  appOrigin: string;
};

export function getMailjetConfig(): MailjetConfig | null {
  const apiKey = process.env.MAILJET_API_KEY?.trim();
  const secretKey = process.env.MAILJET_SECRET_KEY?.trim();
  const fromEmail = process.env.MAILJET_FROM_EMAIL?.trim();
  const appUrl = process.env.APP_BASE_URL?.trim();
  if (!apiKey || !secretKey || !fromEmail || !z.string().email().safeParse(fromEmail).success || !appUrl) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(appUrl);
  } catch {
    return null;
  }
  const localHttp = process.env.NODE_ENV !== 'production' &&
    url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !localHttp) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    return null;
  }

  return {
    apiKey,
    secretKey,
    fromEmail,
    fromName: process.env.MAILJET_FROM_NAME?.trim() || 'Alcohol Tracker',
    appOrigin: url.origin,
  };
}

export async function sendPasswordResetEmail(
  config: MailjetConfig,
  recipient: string,
  token: string,
  language: Language,
): Promise<void> {
  const url = new URL('/reset-password', config.appOrigin);
  url.hash = new URLSearchParams({ token }).toString();
  const subject = language === 'cs' ? 'Obnova hesla' : 'Reset your password';
  const text = language === 'cs'
    ? `Pro obnovu hesla otevřete tento odkaz:\n\n${url.href}\n\nOdkaz platí jednu hodinu a lze jej použít pouze jednou. Pokud jste o obnovu nežádali, e-mail ignorujte.`
    : `To reset your password, open this link:\n\n${url.href}\n\nThis link expires in one hour and can only be used once. If you did not request it, ignore this email.`;

  const response = await axios.post<{ Messages?: Array<{ Status?: string }> }>(
    'https://api.mailjet.com/v3.1/send',
    {
      Messages: [{
        From: { Email: config.fromEmail, Name: config.fromName },
        To: [{ Email: recipient }],
        Subject: subject,
        TextPart: text,
      }],
    },
    { auth: { username: config.apiKey, password: config.secretKey }, timeout: 10000 },
  );
  if (response.data.Messages?.[0]?.Status !== 'success') {
    throw new Error('Mailjet did not accept the password reset message');
  }
}
