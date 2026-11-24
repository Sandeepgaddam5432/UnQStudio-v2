export interface StarterTemplate {
  id: string;
  name: string;
  category: 'Web App' | 'Dashboard' | 'Landing' | 'AI' | 'Python';
  description: string;
  stack: string[];
  files: Record<string, string>;
}

const BASE_TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      jsx: 'react-jsx',
      strict: true,
      baseUrl: '.',
      paths: { '@/*': ['./src/*'] },
    },
    include: ['src'],
  },
  null,
  2,
);

const BASE_REACT_PKG = (name: string) =>
  JSON.stringify(
    {
      name,
      private: true,
      version: '0.1.0',
      type: 'module',
      scripts: { dev: 'vite', build: 'vite build' },
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        'lucide-react': '^0.468.0',
      },
      devDependencies: {
        tailwindcss: '^4.0.0',
        typescript: '^5.6.3',
        '@types/react': '^18.3.1',
        '@types/react-dom': '^18.3.1',
      },
    },
    null,
    2,
  );

const BASE_HTML = (title: string) => `<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body class="bg-zinc-950 text-zinc-50 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const BASE_MAIN_TSX = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'saas-dashboard',
    name: 'SaaS Analytics Dashboard',
    category: 'Dashboard',
    description: 'Obsidian dark KPI metrics, interactive filterable activity feed & revenue overview.',
    stack: ['React 18', 'TypeScript', 'Tailwind v4'],
    files: {
      'package.json': BASE_REACT_PKG('saas-dashboard'),
      'tsconfig.json': BASE_TSCONFIG,
      'index.html': BASE_HTML('Analytics Dashboard'),
      'src/main.tsx': BASE_MAIN_TSX,
      'src/App.tsx': `import { useState } from 'react';
import { Activity, ArrowUpRight, DollarSign, Layers, Users } from 'lucide-react';

const METRICS = [
  { label: 'Monthly Revenue', value: '$48,920', delta: '+18.4%', icon: DollarSign },
  { label: 'Active Workspaces', value: '2,841', delta: '+12.1%', icon: Users },
  { label: 'API Requests (24h)', value: '1.42M', delta: '+31.7%', icon: Activity },
  { label: 'Deployments', value: '946', delta: '+9.2%', icon: Layers },
];

const EVENTS = [
  { id: '1', name: 'Production deploy succeeded', env: 'prod', time: '2m ago', status: 'healthy' },
  { id: '2', name: 'New enterprise workspace created', env: 'billing', time: '14m ago', status: 'healthy' },
  { id: '3', name: 'Edge cache invalidated globally', env: 'edge', time: '38m ago', status: 'healthy' },
  { id: '4', name: 'Rate-limit spike mitigated', env: 'security', time: '1h ago', status: 'warn' },
];

export default function App() {
  const [filter, setFilter] = useState<'all' | 'healthy' | 'warn'>('all');
  const visible = EVENTS.filter((e) => filter === 'all' || e.status === filter);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500">Overview</p>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">Command Analytics</h1>
          </div>
          <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1 text-xs">
            {(['all', 'healthy', 'warn'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={\`px-3 py-1.5 rounded-md capitalize transition \${
                  filter === tab ? 'bg-zinc-100 text-zinc-950 font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }\`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICS.map((m) => (
            <div key={m.label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-xs">{m.label}</span>
                <m.icon className="w-4 h-4" />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-semibold tabular-nums">{m.value}</span>
                <span className="inline-flex items-center text-xs text-emerald-400 font-medium">
                  {m.delta} <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-zinc-800 text-xs font-medium uppercase tracking-wider text-zinc-400">
            Recent System Events
          </div>
          <div className="divide-y divide-zinc-800/80">
            {visible.map((event) => (
              <div key={event.id} className="px-5 py-3.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span
                    className={\`w-2 h-2 rounded-full \${
                      event.status === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'
                    }\`}
                  />
                  <span>{event.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                    {event.env}
                  </span>
                </div>
                <span className="text-xs text-zinc-500 tabular-nums">{event.time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
`,
    },
  },
  {
    id: 'minimal-landing',
    name: 'Linear-Style Product Landing',
    category: 'Landing',
    description: 'High-craft hero, feature bento grid & pricing tiers with crisp monochrome design.',
    stack: ['React 18', 'TypeScript', 'Tailwind v4'],
    files: {
      'package.json': BASE_REACT_PKG('minimal-landing'),
      'tsconfig.json': BASE_TSCONFIG,
      'index.html': BASE_HTML('Product Landing'),
      'src/main.tsx': BASE_MAIN_TSX,
      'src/App.tsx': `import { ArrowRight, Check, Shield, Sparkles, Zap } from 'lucide-react';

const FEATURES = [
  { icon: Zap, title: 'Sub-50ms Execution', desc: 'Instant browser-native bundling and preview updates with zero cold starts.' },
  { icon: Shield, title: 'Isolated Security', desc: 'Strict sandboxing and local-first architecture keep your code private.' },
  { icon: Sparkles, title: 'Autonomous Workflows', desc: 'Plan, review diffs, and ship production features at 10x velocity.' },
];

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between border-b border-zinc-900">
        <span className="font-semibold tracking-tight">Acme Studio</span>
        <button className="px-3.5 py-1.5 rounded-md bg-zinc-100 text-zinc-950 text-xs font-medium hover:bg-zinc-200 transition">
          Get Started
        </button>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/70 text-xs text-zinc-300 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          Now in General Availability
        </div>
        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.08] max-w-3xl mx-auto">
          Ship production software at the speed of thought.
        </h1>
        <p className="mt-6 text-zinc-400 max-w-xl mx-auto text-base md:text-lg">
          A razor-sharp developer workspace designed for teams that care deeply about craft, speed, and reliability.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-zinc-100 text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition">
            Start Building <ArrowRight className="w-4 h-4" />
          </button>
          <button className="px-5 py-2.5 rounded-md border border-zinc-800 text-zinc-200 text-sm hover:bg-zinc-900 transition">
            Read Documentation
          </button>
        </div>

        <section className="mt-24 grid md:grid-cols-3 gap-4 text-left">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-6">
              <f.icon className="w-5 h-5 text-cyan-400 mb-4" />
              <h3 className="font-medium text-base">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        <footer className="mt-24 pt-8 border-t border-zinc-900 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500">
          {['100% Static Ready', 'TypeScript First', 'Zero Vendor Lock-in'].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" /> {t}
            </span>
          ))}
        </footer>
      </main>
    </div>
  );
}
`,
    },
  },
  {
    id: 'ai-chat-ui',
    name: 'AI Chat Interface',
    category: 'AI',
    description: 'Clean streaming-ready assistant UI with prompt chips, history & message actions.',
    stack: ['React 18', 'TypeScript', 'Tailwind v4'],
    files: {
      'package.json': BASE_REACT_PKG('ai-chat-ui'),
      'tsconfig.json': BASE_TSCONFIG,
      'index.html': BASE_HTML('AI Chat Interface'),
      'src/main.tsx': BASE_MAIN_TSX,
      'src/App.tsx': `import { useState } from 'react';
import { ArrowUp, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Welcome! Ask me anything or wire this UI to your OpenAI-compatible API endpoint.' },
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    const prompt = input.trim();
    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', content: prompt },
      { id: crypto.randomUUID(), role: 'assistant', content: \`Received: "\${prompt}". Ready to connect your streaming API!\` },
    ]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="h-14 border-b border-zinc-800 px-6 flex items-center justify-between">
        <span className="text-sm font-semibold">AI Assistant</span>
        <span className="text-xs text-zinc-500 font-mono">Ready</span>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-4 overflow-y-auto">
        {messages.map((m) => (
          <div key={m.id} className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-md border border-zinc-800 bg-zinc-900 flex items-center justify-center flex-shrink-0">
              {m.role === 'assistant' ? <Bot className="w-4 h-4 text-cyan-400" /> : <User className="w-4 h-4 text-zinc-400" />}
            </div>
            <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 px-4 py-2.5 text-sm leading-relaxed">
              {m.content}
            </div>
          </div>
        ))}
      </main>
      <footer className="border-t border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask anything..."
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm focus:outline-none focus:border-zinc-600"
          />
          <button
            onClick={send}
            className="px-3.5 py-2 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 transition"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
`,
    },
  },
  {
    id: 'react-vite-starter',
    name: 'React + TypeScript Blank Pro',
    category: 'Web App',
    description: 'Minimal, zero-bloat React 18 + TypeScript + Tailwind v4 starter ready for any idea.',
    stack: ['React 18', 'TypeScript', 'Tailwind v4'],
    files: {
      'package.json': BASE_REACT_PKG('react-ts-app'),
      'tsconfig.json': BASE_TSCONFIG,
      'index.html': BASE_HTML('React TypeScript App'),
      'src/main.tsx': BASE_MAIN_TSX,
      'src/App.tsx': `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center space-y-5">
        <h1 className="text-2xl font-semibold tracking-tight">Ready to Build</h1>
        <p className="text-sm text-zinc-400">
          Edit <code className="font-mono text-zinc-200">src/App.tsx</code> or ask the AI agent to design your app.
        </p>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-4 py-2 rounded-md bg-zinc-100 text-zinc-950 text-sm font-medium hover:bg-zinc-200 transition tabular-nums"
        >
          Count: {count}
        </button>
      </div>
    </main>
  );
}
`,
    },
  },
  {
    id: 'python-data-lab',
    name: 'Python Data & Automation',
    category: 'Python',
    description: 'Browser-native CPython (Pyodide) workspace for scripts, analysis & algorithms.',
    stack: ['Python 3', 'Pyodide', 'CLI'],
    files: {
      'README.md': `# Python Data Lab\n\nRun \`python3 main.py\` in the built-in Terminal drawer (\`Ctrl+\\\`\`).\n`,
      'main.py': `import json
from statistics import mean

records = [
    {"month": "Jan", "revenue": 14200, "users": 310},
    {"month": "Feb", "revenue": 18900, "users": 420},
    {"month": "Mar", "revenue": 24600, "users": 580},
    {"month": "Apr", "revenue": 31400, "users": 740},
]

avg_rev = mean(r["revenue"] for r in records)
total_users = sum(r["users"] for r in records)

print("=== Quarterly Summary ===")
print(json.dumps({"average_monthly_revenue": avg_rev, "total_users": total_users}, indent=2))
`,
    },
  },
];
