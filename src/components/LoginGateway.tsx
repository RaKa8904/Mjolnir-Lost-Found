import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { LightningFlash } from './LightningFlash';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

export const LoginGateway = () => {
  useAuth(); // Just call to satisfy hook dependencies if needed, or remove completely if unused.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [adminCode, setAdminCode] = useState('');
  
  const [studentMode, setStudentMode] = useState<'signin' | 'signup'>('signin');
  const [adminMode, setAdminMode] = useState<'signin' | 'setup'>('signin');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [flashTrigger, setFlashTrigger] = useState(0);

  const handleStudentAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = studentMode === 'signin' ? '/api/auth/login/password' : '/api/auth/signup/password';
      const body = studentMode === 'signin' 
        ? { email, password } 
        : { email, password, name };
        
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (res.ok && data.user) {
        setFlashTrigger(prev => prev + 1);
        setTimeout(() => {
          window.location.reload();
        }, 350);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (adminMode === 'setup') {
        if (!adminCode) throw new Error("Setup code required");
        // Admin Setup (Registration)
        const optionsRes = await fetch('/api/auth/passkeys/register-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, adminSetupToken: adminCode })
        });
        
        if (!optionsRes.ok) throw new Error((await optionsRes.json()).error || 'Setup failed');
        const options = await optionsRes.json();
        
        const attResp = await startRegistration({ optionsJSON: options });
        
        const verificationRes = await fetch('/api/auth/passkeys/register-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, adminSetupToken: adminCode, response: attResp })
        });
        
        if (!verificationRes.ok) throw new Error((await verificationRes.json()).error || 'Verification failed');
        const verification = await verificationRes.json();
        
        if (verification.success) {
          setFlashTrigger(prev => prev + 1);
          setTimeout(() => window.location.reload(), 350);
        }
      } else {
        // Admin Login (Authentication)
        const optionsRes = await fetch('/api/auth/passkeys/login-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        if (!optionsRes.ok) throw new Error((await optionsRes.json()).error || 'Login failed');
        const options = await optionsRes.json();
        
        const asseResp = await startAuthentication({ optionsJSON: options });
        
        const verificationRes = await fetch('/api/auth/passkeys/login-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, response: asseResp })
        });
        
        if (!verificationRes.ok) throw new Error((await verificationRes.json()).error || 'Verification failed');
        const verification = await verificationRes.json();
        
        if (verification.success) {
          setFlashTrigger(prev => prev + 1);
          setTimeout(() => window.location.reload(), 350);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Passkey error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      <LightningFlash trigger={flashTrigger} />
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-4 shadow-[0_0_15px_rgba(245,185,66,0.15)]">
            <svg width="20" height="24" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary drop-shadow-[0_0_5px_currentColor]">
              <path d="M7 1L1 8H6L5 13L11 6H6L7 1Z" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 font-serif-display">Mjolnir Lost & Found</h1>
          <p className="text-muted-foreground text-sm">Authenticate to access the campus ledger.</p>
        </div>

        <div className="bg-card border border-border/50 rounded-xl shadow-2xl p-6 backdrop-blur-sm relative overflow-hidden group">
          {/* Subtle glowing top border */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
          
          <Tabs defaultValue="student" className="w-full" onValueChange={() => setError('')}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1">
              <TabsTrigger value="student" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Student</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Admin</TabsTrigger>
            </TabsList>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center break-words">
                {error}
              </div>
            )}

            <TabsContent value="student">
              <form onSubmit={handleStudentAuth} className="space-y-4">
                {studentMode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      type="text" 
                      placeholder="Jane Doe" 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      required 
                      className="bg-background/50 focus:bg-background border-border/50 focus:border-primary/50 transition-colors"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Campus Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="student@demo.edu" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="bg-background/50 focus:bg-background border-border/50 focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password (Demo)</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    className="bg-background/50 focus:bg-background border-border/50 focus:border-primary/50 transition-colors"
                  />
                </div>
                <Button type="submit" className="w-full font-semibold relative overflow-hidden group/btn" disabled={loading}>
                  <span className="pointer-events-none absolute -top-[1px] -right-[1px] w-4 h-4 opacity-0 group-hover/btn:opacity-100 transition-opacity">
                    <span className="absolute top-0 right-0 w-3 h-[1.5px] bg-background shadow-[0_0_4px_var(--background)] animate-pulse" />
                    <span className="absolute top-0 right-0 w-[1.5px] h-3 bg-background shadow-[0_0_4px_var(--background)] animate-pulse" />
                  </span>
                  {loading ? 'Authenticating...' : (studentMode === 'signin' ? 'Sign In as Student' : 'Sign Up as Student')}
                </Button>
                
                <div className="mt-4 text-center text-sm">
                  <Button type="button" variant="link" onClick={() => setStudentMode(studentMode === 'signin' ? 'signup' : 'signin')} className="text-muted-foreground hover:text-primary">
                    {studentMode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form onSubmit={handleAdminAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input 
                    id="admin-email" 
                    type="email" 
                    placeholder="admin@demo.edu" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    className="bg-background/50 border-border/50"
                  />
                </div>
                
                {adminMode === 'setup' && (
                  <div className="space-y-2">
                    <Label htmlFor="admin-code">Admin Setup Code</Label>
                    <Input 
                      id="admin-code" 
                      type="password" 
                      placeholder="Enter setup code..." 
                      value={adminCode} 
                      onChange={e => setAdminCode(e.target.value)} 
                      required 
                      className="bg-background/50 border-border/50 font-mono tracking-widest text-center"
                    />
                  </div>
                )}
                
                <Button type="submit" variant="secondary" className="w-full font-semibold" disabled={loading}>
                  {loading ? 'Authenticating...' : (adminMode === 'setup' ? 'Setup Admin Passkey' : 'Sign In with Passkey')}
                </Button>
                
                <div className="mt-4 text-center text-sm">
                  <Button type="button" variant="link" onClick={() => setAdminMode(adminMode === 'signin' ? 'setup' : 'signin')} className="text-muted-foreground hover:text-primary">
                    {adminMode === 'signin' ? "First time? Setup Admin Access" : "Already registered? Sign in"}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
