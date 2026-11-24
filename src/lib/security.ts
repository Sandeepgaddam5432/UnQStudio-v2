/**
 * Security utilities for path validation and access control.
 * Hardened (fixes F-006):
 * - Always resolves relative paths against `cwd` before verifying boundaries
 * - Restricts writes strictly to `cwd` and `tmpPath` (when `cwd` is provided)
 */

import { join, normalize } from "path-browserify";

export function isAbsolutePath(path: string): boolean {
  return path.startsWith('/') || path.startsWith('\\') || /^[A-Za-z]:[\\/]/.test(path);
}

/** Canonicalize a path relative to `cwd` */
export function resolveCanonicalPath(path: string, cwd?: string): string {
  const cleaned = path.replace(/\\/g, '/');
  if (isAbsolutePath(cleaned)) {
    return normalize(cleaned);
  }
  return normalize(cwd ? join(cwd, cleaned) : `/${cleaned}`);
}

/** Check if a path is inside (or equal to) a given root directory */
export function isPathWithinRoot(targetPath: string, rootDir: string): boolean {
  const normTarget = normalize(targetPath).replace(/\/+$/, '') || '/';
  const normRoot = normalize(rootDir).replace(/\/+$/, '') || '/';
  if (normRoot === '/') return true;
  return normTarget === normRoot || normTarget.startsWith(`${normRoot}/`);
}

/**
 * Check if write operations are allowed for the given path.
 * Relative paths are ALWAYS resolved against `cwd` before validation.
 */
export function isWriteAllowed(
  path: string,
  cwd?: string,
  options?: {
    tmpPath?: string;
    projectsPath?: string;
  },
): boolean {
  if (!path || path.includes('\0')) return false;

  const tmpPath = normalize(options?.tmpPath || '/tmp');
  const projectsPath = normalize(options?.projectsPath || '/projects');

  // Resolve relative paths against cwd (never blindly allow relative traversal like `../../config/ai.json`)
  let absolutePath: string;
  if (!isAbsolutePath(path)) {
    if (!cwd) {
      // Without cwd, only allow simple non-escaping relative paths
      const normalized = normalize(path);
      return !normalized.startsWith('..') && !isAbsolutePath(normalized);
    }
    absolutePath = normalize(join(cwd, path));
  } else {
    absolutePath = normalize(path);
  }

  // Always allow writes inside configured tmp directory
  if (isPathWithinRoot(absolutePath, tmpPath)) {
    return true;
  }

  // When cwd is known, restrict writes strictly to the active cwd (not sibling projects or /config)
  if (cwd) {
    return isPathWithinRoot(absolutePath, cwd);
  }

  // Fallback when no cwd is specified: allow writes inside projectsPath
  return isPathWithinRoot(absolutePath, projectsPath);
}

/**
 * Check if a read path is allowed for workspace tools (blocks /config and sibling projects).
 */
export function isReadAllowed(
  path: string,
  cwd: string,
  options?: {
    tmpPath?: string;
    configPath?: string;
  },
): boolean {
  if (!path || path.includes('\0')) return false;
  const absolutePath = resolveCanonicalPath(path, cwd);
  const tmpPath = normalize(options?.tmpPath || '/tmp');
  const configPath = normalize(options?.configPath || '/config');

  // Explicitly deny config path
  if (isPathWithinRoot(absolutePath, configPath)) {
    return false;
  }

  return isPathWithinRoot(absolutePath, cwd) || isPathWithinRoot(absolutePath, tmpPath);
}

export function validateWritePath(
  path: string,
  operationName: string,
  cwd?: string,
  options?: {
    tmpPath?: string;
    projectsPath?: string;
  },
): void {
  if (!isWriteAllowed(path, cwd, options)) {
    const tmpPath = options?.tmpPath || '/tmp';
    const cwdInfo = cwd ? `\n\nCurrent working directory: ${cwd}` : '';
    throw new Error(
      `${operationName}: write access denied to ${path}. ` +
        `Write operations are only allowed inside the active project directory and ${tmpPath}${cwdInfo}`,
    );
  }
}

export function createWriteAccessDeniedError(
  path: string,
  toolName?: string,
  cwd?: string,
  options?: {
    tmpPath?: string;
    projectsPath?: string;
  },
): string {
  const prefix = toolName ? `Write access denied to "${path}".` : `Write access denied to ${path}.`;
  const cwdInfo = cwd ? `\n\nCurrent working directory: ${cwd}` : '';
  const tmpPath = options?.tmpPath || '/tmp';

  return (
    `${prefix}\n\n` +
    `Write operations are strictly confined to:\n` +
    `- Active project directory and subdirectories\n` +
    `- Temporary directory (${tmpPath}/)${cwdInfo}`
  );
}

/**
 * Returns true if a VFS path attempts to touch the protected credentials/config directory.
 */
export function isProtectedVaultPath(targetPath: string): boolean {
  const normalized = resolveCanonicalPath(targetPath);
  return normalized === '/config' || normalized.startsWith('/config/');
}

/**
 * Blocks loopback, RFC1918 private networks, link-local / cloud metadata, and IPv6 local addresses.
 */
export function isPrivateOrLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host === '::' ||
    host.startsWith('fc') ||
    host.startsWith('fd') ||
    host.startsWith('fe80:')
  ) {
    return true;
  }
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

