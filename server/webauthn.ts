import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoUint8Array } from '@simplewebauthn/server/helpers';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON
} from '@simplewebauthn/server';
import { db } from './db.js';

const rpName = process.env.RP_NAME || 'Campus Lost & Found';
const rpID = process.env.RP_ID || 'localhost';
const origin = process.env.ORIGIN || 'http://localhost:5173';

export async function getRegistrationOptions(user: any): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const userPasskeys = db.prepare(`SELECT credential_id FROM passkeys WHERE user_id = ?`).all(user.id) as any[];

  return generateRegistrationOptions({
    rpName,
    rpID,
    userID: isoUint8Array.fromUTF8String(user.id),
    userName: user.email,
    userDisplayName: user.name,
    attestationType: 'none',
    excludeCredentials: userPasskeys.map((key) => ({
      id: key.credential_id,
      type: 'public-key',
      transports: ['internal'],
    })),
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
    },
  });
}

export async function verifyRegistration(user: any, response: RegistrationResponseJSON, expectedChallenge: string) {
  return verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: false,
  });
}

export async function getAuthOptions(userEmail?: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
  let allowCredentials: any[] = [];

  if (userEmail) {
    const user = db.prepare(`SELECT id FROM users WHERE email = ?`).get(userEmail) as any;
    if (user) {
      const userPasskeys = db.prepare(`SELECT credential_id FROM passkeys WHERE user_id = ?`).all(user.id) as any[];
      allowCredentials = userPasskeys.map(key => ({
        id: key.credential_id,
        type: 'public-key',
        transports: ['internal']
      }));
    }
  }

  return generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: 'preferred',
  });
}

export async function verifyAuth(response: AuthenticationResponseJSON, expectedChallenge: string, credential: any) {
  return verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: credential.credential_id,
      publicKey: Buffer.from(credential.public_key, 'base64'),
      counter: credential.counter,
      transports: credential.transports ? credential.transports.split(',') : undefined,
    },
    requireUserVerification: false,
  });
}
