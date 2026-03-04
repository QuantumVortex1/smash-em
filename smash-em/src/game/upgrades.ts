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
        description: 'Jump Force +60',
        rarity: 'common',
        apply: (p) => p.jumpForce -= 60,
    },
    {
        id: 'speed-boost',
        name: 'Speed-Boost',
        description: 'Max Speed +15',
        rarity: 'common',
        apply: (p) => p.speedLimit += 15,
    },
    {
        id: 'dmg-boost',
        name: 'DMG-Boost',
        description: 'Damage + 1',
        rarity: 'common',
        apply: (p) => p.damage += 1,
    },
    {
        id: 'hp-boost',
        name: 'HP-Boost',
        description: 'Max HP +4, heal by 4',
        rarity: 'common',
        apply: (p) => {
            p.maxHp += 4;
            p.hp += 4;
        }
    },
    {
        id: 'heal',
        name: 'Heal',
        description: 'Heal +10 HP',
        rarity: 'common',
        apply: (p) => {
            p.hp = Math.min(p.maxHp, p.hp + 10);
        }
    },
    {
        id: 'bounce-boost',
        name: 'Bounce Boost',
        description: 'Bounce Height +40 when jumping on enemies',
        rarity: 'common',
        apply: (p) => { p.bounceBoost -= 40; },
    },
    {
        id: 'shield',
        name: 'Shield',
        description: 'Reduce damage taken by 15%',
        rarity: 'common',
        apply: (p) => p.defensiveDmgMult *= 0.85,
    },

    // onetime
    {
        id: 'bloodthirst',
        name: 'Bloodthirst',
        description: 'Gain HP from killing enemies',
        rarity: 'onetime',
        canApply: (p) => !p.hasBloodthirst,
        apply: (p) => p.hasBloodthirst = true,
    },
    {
        id: 'springboard',
        name: 'Springboard',
        description: 'Reset your available jumps when landing on enemies',
        rarity: 'onetime',
        canApply: (p) => !p.hasResetBounces,
        apply: (p) => p.hasResetBounces = true,
    },
    {
        id: 'immunity-boost',
        name: 'Immunity',
        description: 'Gain temporary invulnerability after taking damage',
        rarity: 'onetime',
        canApply: (p) => !p.hasLongImmunity,
        apply: (p) => p.hasLongImmunity = true,
    },
    {
        id: 'xp-leech',
        name: 'XP Leech',
        description: 'Gain XP from dealing damage to enemies',
        rarity: 'onetime',
        canApply: (p) => !p.hasXpFromDamage,
        apply: (p) => p.hasXpFromDamage = true,
    },
    {
        id: 'aoe-landing',
        name: 'Ground Slam',
        description: 'Area damage on landing',
        rarity: 'onetime',
        canApply: (p) => !p.hasGroundSlam,
        apply: (p) => p.hasGroundSlam = true,
    },
    {
        id: 'speed-dmg-mult',
        name: 'Adrenalin',
        description: 'Damage increases with fall speed',
        rarity: 'onetime',
        canApply: (p) => !p.hasSpeedDmgMult,
        apply: (p) => p.hasSpeedDmgMult = true,
    },
    {
        id: 'frost-bite',
        name: 'Frostbite',
        description: 'Chance of 30% to freeze enemies when hitting them',
        rarity: 'onetime',
        canApply: (p) => !p.hasFrostBite,
        apply: (p) => p.hasFrostBite = true,
    },
    {
        id: 'lucky-shot',
        name: 'Lucky Shot',
        description: 'Chance of 25% to get two upgrades at once',
        rarity: 'onetime',
        canApply: (p) => !p.hasLuckyShot,
        apply: (p) => p.hasLuckyShot = true,
    },

    // rare
    {
        id: 'crit-chance',
        name: 'Krit Chance',
        description: 'Chance to deal crit damage +25%',
        rarity: 'rare',
        canApply: (p) => p.critChance < 0.8,
        apply: (p) => p.critChance += 0.25,
    },
    {
        id: 'fast-learner',
        name: 'Fast Learner',
        description: 'Gain 40% more XP',
        rarity: 'rare',
        apply: (p) => p.xpMult *= 1.4,
    },
    {
        id: 'crit-dmg',
        name: 'Crit Master',
        description: 'Crit Damage Factor +0.4',
        rarity: 'rare',
        apply: (p) => p.critMultiplier += 0.4,
    },
    {
        id: 'multi-jump',
        name: 'Multi Jump',
        description: '+1 Multijump',
        rarity: 'rare',
        apply: (p) => { p.maxJumps += 1; p.jumpsLeft += 1; },
    }
];

export function getRandomUpgrades(player: Player, count: number = 3): Upgrade[] {
    const available = allUpgrades.filter(u => !u.canApply || u.canApply(player));

    const pickRandomWithRarity = (): Upgrade => {
        const roll = Math.random();
        let targetRarity: UpgradeRarity = 'common';
        if (roll < 0.05) targetRarity = 'rare';
        else if (roll < 0.25) targetRarity = 'onetime';
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
