import { EventSettings } from '@prisma/client';

export type UserRole = 'ADMIN' | 'FAMILY' | 'ARTISTS' | 'MATES' | 'THE_FRIENDS' | 'GUEST';

export interface FeatureSettings {
    isEnabled: boolean;
    targetRoles: string; // comma-separated roles
}

export function isFeatureVisible(
    settings: FeatureSettings,
    userRole: string
): boolean {
    if (!settings.isEnabled) {
        return false;
    }

    if (!settings.targetRoles || settings.targetRoles.trim() === '') {
        return true; // Visible to all if no specific roles targeted
    }

    const allowedRoles = settings.targetRoles.split(',').map((r) => r.trim());
    return allowedRoles.includes(userRole);
}

export function getDietVisibility(settings: EventSettings, userRole: string): boolean {
    return isFeatureVisible({
        isEnabled: settings.isDietEnabled,
        targetRoles: settings.dietTargetRoles,
    }, userRole);
}

export function getSongVisibility(settings: EventSettings, userRole: string): boolean {
    return isFeatureVisible({
        isEnabled: settings.isSongRequestEnabled,
        targetRoles: settings.songTargetRoles,
    }, userRole);
}
