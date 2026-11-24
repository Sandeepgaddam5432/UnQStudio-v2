import { useState } from 'react';
import { ArrowRight, Check, KeyRound, ShieldCheck, Sparkles } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAISettings } from '@/hooks/useAISettings';
import { BrandLogo } from '@/components/BrandLogo';
import { AI_PROVIDER_PRESETS, type PresetProvider } from '@/lib/aiProviderPresets';
import { BRAND } from '@/lib/brand';
import { cn } from '@/lib/utils';

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingDialog({ open, onOpenChange }: OnboardingDialogProps) {
  const { setProvider } = useAISettings();
  const [selectedPreset, setSelectedPreset] = useState<PresetProvider>(AI_PROVIDER_PRESETS[0]);
  const [apiKey, setApiKey] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    const requiresKey = selectedPreset.id !== 'ollama' && selectedPreset.id !== 'lmstudio';
    if (requiresKey && !apiKey.trim()) {
      setError(`Enter your ${selectedPreset.name} API key to continue.`);
      return;
    }

    setSaving(true);
    try {
      const baseUrl = customUrl.trim() || selectedPreset.baseURL;
      await setProvider({
        id: selectedPreset.id,
        name: selectedPreset.name,
        baseURL: baseUrl,
        apiKey: apiKey.trim() || selectedPreset.apiKey || '',
      });
      setApiKey('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save provider settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border bg-card">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="w-7 h-7" />
            <DialogTitle className="text-base font-semibold tracking-tight">
              Connect an AI Provider to {BRAND.name}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Your API key is stored locally inside your browser&apos;s isolated credentials vault — never sent to any third-party backend.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Provider Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AI_PROVIDER_PRESETS.slice(0, 6).map((preset) => {
              const active = selectedPreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(preset);
                    setCustomUrl(preset.baseURL);
                    setError(null);
                  }}
                  className={cn(
                    'text-left rounded-lg border p-2.5 transition-all',
                    active
                      ? 'border-foreground bg-muted/70'
                      : 'border-border/80 bg-background/50 hover:border-foreground/30',
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-foreground truncate">{preset.name}</span>
                    {active && <Check className="w-3.5 h-3.5 text-foreground flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {preset.id === 'openrouter' ? '100+ models' : preset.id === 'ollama' ? 'Local free' : 'Direct API'}
                  </p>
                </button>
              );
            })}
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{selectedPreset.name} API Key</span>
            </label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                selectedPreset.id === 'ollama'
                  ? 'Optional for local Ollama'
                  : `Paste your ${selectedPreset.name} API key...`
              }
              className="h-9 text-xs font-mono"
            />
            {selectedPreset.apiKeysURL && (
              <p className="text-[11px] text-muted-foreground">
                Need a key?{' '}
                <a
                  href={selectedPreset.apiKeysURL}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground underline underline-offset-4"
                >
                  Get {selectedPreset.name} API key →
                </a>
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/70">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Isolated local vault</span>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSave()}
              disabled={saving}
              className="gap-1.5 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save & Start Building'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
