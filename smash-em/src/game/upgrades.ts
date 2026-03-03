import { Player } from '../entities/player';

export type UpgradeRarity = 'common' | 'onetime' | 'rare';

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    rarity: UpgradeRarity;
    apply: (player: Player) => void;
    canApply?: (player: Player) => boolean;
}

export const allUpgrades: Upgrade[] = [
    {
        id: 'jump-boost',
        name: 'Jump-Boost',
        description: 'Sprungkraft +40',
        rarity: 'common',
        apply: (p) => p.jumpForce -= 40,
    },
    {
        id: 'speed-boost',
        name: 'Speed-Boost',
        description: 'Max Geschwindigkeit +15',
        rarity: 'common',
        apply: (p) => p.speedLimit += 15,
    },
    {
        id: 'dmg-boost',
        name: 'DMG-Boost',
        description: 'Schaden + 1',
        rarity: 'common',
        apply: (p) => p.damage += 1,
    },
    {
        id: 'hp-boost',
        name: 'HP-Boost',
        description: 'Max HP +2, heilt dich um 2',
        rarity: 'common',
        apply: (p) => {
            p.maxHp += 2;
            p.hp += 2;
        }
    },
    {
        id: 'heal',
        name: 'Heal',
        description: 'Heile +6 HP',
        rarity: 'common',
        apply: (p) => {
            p.hp = Math.min(p.maxHp, p.hp + 6);
        }
    },

    // One Time
    {
        id: 'bloodthirst',
        name: 'Blutdurst',
        description: 'Bekomme HP, wenn du Gegner tötest',
        rarity: 'onetime',
        canApply: (p) => !p.hasBloodthirst,
        apply: (p) => p.hasBloodthirst = true,
    },
    {
        id: 'crit-chance',
        name: 'Krit-Auge',
        description: 'Krit-Chance stark erhöht (+20%)',
        rarity: 'onetime',
        canApply: (p) => p.critChance < 0.2,
        apply: (p) => p.critChance += 0.2,
    },
    {
        id: 'springboard',
        name: 'Sprungfeder',
        description: 'Setzt bei Sprüngen auf Gegnern deine Sprünge zurück',
        rarity: 'onetime',
        apply: (p) => p.hasResetBounces = true,
    },
    {
        id: 'immunity-boost',
        name: 'Schildkröte',
        description: 'Chance, nach Schaden kurzzeitig unverwundbar zu sein',
        rarity: 'onetime',
        canApply: (p) => !p.hasLongImmunity,
        apply: (p) => p.hasLongImmunity = true,
    },
    {
        id: 'xp-leech',
        name: 'Wissen ist Macht',
        description: 'Sammle XP durch ausgeteilten Schaden',
        rarity: 'onetime',
        canApply: (p) => !p.hasXpFromDamage,
        apply: (p) => p.hasXpFromDamage = true,
    },
    {
        id: 'aoe-landing',
        name: 'Erdbeben',
        description: 'Flächenschaden bei Landung',
        rarity: 'onetime',
        canApply: (p) => !p.hasGroundSlam,
        apply: (p) => p.hasGroundSlam = true,
    },

    // rare
    {
        id: 'fast-learner',
        name: 'Superhirn',
        description: 'Schnellere Level-Ups (-20% XP req)',
        rarity: 'rare',
        apply: (p) => p.xpReqFactor *= 0.8,
    },
    {
        id: 'crit-dmg',
        name: 'Brutalität',
        description: 'Krit-DMG Faktor +0.2',
        rarity: 'rare',
        apply: (p) => p.critMultiplier += 0.2,
    },
    {
        id: 'multi-jump',
        name: 'Doppelsprung',
        description: 'Mehrfachsprung +1',
        rarity: 'rare',
        apply: (p) => p.maxJumps += 1,
    }
];

export function getRandomUpgrades(player: Player, count: number = 3): Upgrade[] {
    const available = allUpgrades.filter(u => !u.canApply || u.canApply(player));

    const pickRandomWithRarity = (): Upgrade => {
        const roll = Math.random();
        let targetRarity: UpgradeRarity = 'common';
        if (roll < 0.05) targetRarity = 'rare';
        else if (roll < 0.2) targetRarity = 'onetime';
        else targetRarity = 'common';

        let candidates = available.filter(u => u.rarity === targetRarity);
        if (candidates.length === 0) {
            candidates = available.filter(u => u.rarity === 'common');
        }

        return candidates[Math.floor(Math.random() * candidates.length)];
    };

    const selectedSet = new Set<string>();
    const results: Upgrade[] = [];

    for (let i = 0; i < count * 3 && results.length < count; i++) {
        const candidate = pickRandomWithRarity();
        if (!selectedSet.has(candidate.id)) {
            selectedSet.add(candidate.id);
            results.push(candidate);
        }
    }

    if (results.length < count) {
        for (const u of available.filter(u => u.rarity === 'common')) {
            if (!selectedSet.has(u.id)) {
                results.push(u);
                if (results.length >= count) break;
            }
        }
    }

    return results;
}
