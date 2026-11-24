import { useSeoMeta } from '@unhead/react';
import { ExternalLink, Shield, Layers, Cpu, Smartphone, Info } from 'lucide-react';
import { SettingsPageLayout } from '@/components/SettingsPageLayout';
import { BrandLogo } from '@/components/BrandLogo';
import { BRAND } from '@/lib/brand';
import { Button } from '@/components/ui/button';

export default function AboutSettings() {
  useSeoMeta({
    title: `About — ${BRAND.name}`,
    description: BRAND.description,
  });

  const version = import.meta.env.VERSION || '1.0.0';
  const commitSha = import.meta.env.COMMIT_SHA || '';
  const buildDate = import.meta.env.BUILD_DATE
    ? new Date(import.meta.env.BUILD_DATE).toLocaleDateString()
    : '';

  return (
    <SettingsPageLayout
      icon={Info}
      titleKey="settingsAbout"
      descriptionKey="settingsAboutDescription"
    >
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo className="w-12 h-12 rounded-xl" />
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{BRAND.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{BRAND.tagline}</p>
              <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-muted-foreground">
                <span>v{version}</span>
                {commitSha && <span>· {commitSha}</span>}
                {buildDate && <span>· {buildDate}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {BRAND.docsUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={BRAND.docsUrl} target="_blank" rel="noreferrer">
                  Docs <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </Button>
            )}
            {BRAND.repoUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={BRAND.repoUrl} target="_blank" rel="noreferrer">
                  Source <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              icon: Shield,
              title: 'Isolated Credentials Vault',
              desc: 'API keys, Git tokens & deploy keys live in a dedicated IndexedDB vault separated from project workspaces and AI tools.',
            },
            {
              icon: Layers,
              title: '5-Pillar Agent Studio',
              desc: 'Rules, Skills, Spec-Driven Workflows, @Context Inspector, MCP Servers & isolated Sub-Agents built directly into the IDE.',
            },
            {
              icon: Cpu,
              title: '100% Static Browser Engine',
              desc: 'CodeMirror 6 editor, interactive Bash/Git/TypeScript/Pyodide terminal, and esbuild-wasm bundler run client-side.',
            },
            {
              icon: Smartphone,
              title: 'Web + Android APK Parity',
              desc: 'Unified Linear/Vercel obsidian interface across desktop web, mobile web, and Capacitor Android APK.',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-foreground">
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">{item.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </SettingsPageLayout>
  );
}
