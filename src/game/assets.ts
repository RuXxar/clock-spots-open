import type { JobId } from './types';

const LOCAL_XIVPLAN_ASSET_BASE = '/assets/xivplan';

export function xivplanAsset(path: string): string {
  return `${LOCAL_XIVPLAN_ASSET_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

export function jobIconUrl(job: JobId): string {
  return xivplanAsset(`/actor/${job}.png`);
}

export function roleIconUrl(role: 'tank' | 'healer' | 'dps'): string {
  return xivplanAsset(`/actor/${role}.png`);
}

export function markerIconUrl(marker: string): string {
  return xivplanAsset(`/marker/${marker}`);
}

export function arenaImageUrl(): string {
  return xivplanAsset('/arena/arcadion8.svg');
}
